import axios from "axios";
import { normalizeIngredients } from "../utils/normalizeIngredients.js";

export const detectProduct = async (req, res) => {
  try {
    const barcode = req.body?.barcode;
    if (!barcode) {
      return res.status(400).json({ error: "Barcode missing" });
    }

    const offRes = await axios.get(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );

    if (offRes.data.status !== 1) {
      return res.status(404).json({ error: "Product not found" });
    }

    const p = offRes.data.product;

    let ingredients = [];
    if (p.ingredients_text) {
      ingredients = normalizeIngredients(p.ingredients_text);
    }

    res.json({
      name: p.product_name || "N/A",
      brand: p.brands || "N/A",
      image: p.image_front_url || "",
      ingredients,
      nutriments: p.nutriments || {},
      nutriScore: p.nutriscore_grade || "unknown",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Detection failed" });
  }
};
