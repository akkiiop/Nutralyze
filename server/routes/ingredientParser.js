import express from "express";
import axios from "axios";
import { parseIngredientsWithGroq } from "../services/parseIngredientsWithGroq.js";

const router = express.Router();

router.post("/parse-ingredients", async (req, res) => {
  try {
    const { ocrText } = req.body;

    if (!ocrText) {
      return res.status(400).json({ error: "ocrText is required" });
    }

    // OLD  const ingredients = await parseIngredientsWithGroq(ocrText);

    // --- CHANGE STARTS HERE (Line 14) ---
    // Direct call to your Python Nutrition Engine on Port 8002
    const response = await axios.post("http://127.0.0.1:8002/parse-ingredients", {
      ocrText: ocrText
    });

    // Extract the ingredients array from the Python response
    const ingredients = response.data.ingredients;
    // --- CHANGE ENDS HERE ---

    res.json({ ingredients });
  } catch (err) {
    console.error("Groq parsing failed:", err);
    res.status(500).json({ error: "Failed to parse ingredients" });
  }
});

export default router;
