import express from "express";
import { harmfulList } from "../utils/harmfulList.js";
import axios from "axios";
const router = express.Router();

/**
 * POST /api/scan/analyze
 * Returns harmful ingredients detected
 */
const WATCHLIST = [
  { name: "palm oil", label: "warning", severity: "High", reason: "High saturated fats, heart risk." },
  { name: "sugar", label: "warning", severity: "Moderate", reason: "Empty calories, insulin spike." },
  { name: "added sugar", label: "warning", severity: "High", reason: "Direct metabolic impact." },
  { name: "corn syrup", label: "warning", severity: "High", reason: "High fructose spike." },
  { name: "high fructose corn syrup", label: "warning", severity: "High", reason: "Metabolic disruptor." },
  { name: "maida", label: "warning", severity: "Moderate", reason: "Refined carb, low fiber." },
  { name: "refined flour", label: "warning", severity: "Moderate", reason: "Refined carb, high GI." },
  { name: "maltodextrin", label: "warning", severity: "Moderate", reason: "High GI hidden sugar." },
  { name: "hydrogenated vegetable oil", label: "warning", severity: "High", reason: "Trans fat source." }
];

router.post("/analyze", async (req, res) => {
  try {
    const { ingredients } = req.body;
    if (!ingredients) {
      return res.status(400).json({ success: false, message: "No ingredients provided" });
    }

    // 1. Call Python Nutrition Engine (TIER 1: HAZARDS)
    let aiResults = [];
    try {
      const aiRes = await axios.post("http://127.0.0.1:8002/predict", { ingredients });
      aiResults = aiRes.data.results || [];
    } catch (e) {
      console.warn("AI Service unavailable, skipping Tier 1 scan.");
    }

    // Tag AI results as 'harmful' explicitly
    const hazards = aiResults.map(i => ({ ...i, label: 'harmful' }));


    // 2. Local Scan (TIER 2: WARNINGS)
    const text = ingredients.toLowerCase();
    const warnings = [];

    WATCHLIST.forEach(item => {
      if (text.includes(item.name)) {
        // Avoid duplicates if AI already caught it (unlikely but safe)
        if (!hazards.find(h => h.ingredient.toLowerCase().includes(item.name))) {
          warnings.push({
            ingredient: item.name,
            label: 'warning',
            severity: item.severity,
            reason: item.reason,
            source: "NutriVision Watchlist"
          });
        }
      }
    });

    const combined = [...hazards, ...warnings];

    return res.json({
      success: true,
      harmfulFound: combined
    });

  } catch (err) {
    console.error("Ingredient analysis error:", err);
    res.status(500).json({ success: false });
  }
});

export default router;
