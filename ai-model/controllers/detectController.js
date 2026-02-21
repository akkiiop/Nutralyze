import axios from "axios";
import { normalizeIngredients } from "../utils/normalizeIngredients.js";

export const detectProduct = async (req, res) => {
  try {
    const barcode = req.body?.barcode;
    if (!barcode) {
      return res.status(400).json({ error: "Barcode missing" });
    }

    // Step 1: Try Open Food Facts
    const offRes = await axios.get(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      {
        headers: {
          "User-Agent": "Nutralyze - AI Model Service - Barcode Detection"
        }
      }
    );

    if (offRes.data.status === 1) {
      const p = offRes.data.product;
      let ingredients = [];
      if (p.ingredients_text) {
        ingredients = normalizeIngredients(p.ingredients_text);
      }

      return res.json({
        name: p.product_name || "N/A",
        brand: p.brands || "N/A",
        image: p.image_front_url || "",
        ingredients,
        nutriments: p.nutriments || {},
        nutriScore: p.nutriscore_grade || "unknown",
      });
    }

    // Step 2: Gemini Fallback (if OFF Status is 0)
    const genAI = req.app.locals.genAI;
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
          A user scanned a food product with barcode ${barcode}. 
          It was NOT found in the database. 
          Use your knowledge to identify this product and provide its typical details.
          
          If truly unknown, guess a generic "Packaged Food" shell.
          
          Return STRICT JSON format:
          {
            "name": "Product Name",
            "brand": "Brand",
            "ingredients": ["ing1", "ing2"],
            "nutriments": { "energy-kcal_100g": 0, "proteins_100g": 0, "fat_100g": 0, "carbohydrates_100g": 0 },
            "isAIEstimated": true
          }
        `;

        const result = await model.generateContent(prompt);
        const output = result.response.text().trim();
        const match = output.match(/\{.*\}/s);
        if (match) {
          const aiData = JSON.parse(match[0]);
          return res.json({
            ...aiData,
            image: ""
          });
        }
      } catch (aiErr) {
        console.error("Gemini Product Estimation failed:", aiErr.message);
      }
    }

    res.status(404).json({ error: "Product not found" });
  } catch (err) {
    console.error("Detection error:", err.message);
    res.status(500).json({ error: "Detection failed" });
  }
};
