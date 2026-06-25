import { predictIngredients } from "../utils/mlUtils.js";

export const analyzeHarmfulIngredients = async (req, res) => {
  try {
    const { ingredients } = req.body;

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res.json({
        harmful: [],
        all: [],
        message: "No ingredients provided"
      });
    }

    // Run local ML prediction (pure JS — no external service needed)
    const { results, frequency_analysis } = predictIngredients(ingredients);

    // Harmful = risk >= 40 (threshold matching original AI-model behaviour)
    const harmful = results.filter(
      (item) => item.label === "harmful" && item.risk >= 40
    );

    return res.json({
      harmful,
      all: results,
      frequency_analysis
    });

  } catch (error) {
    console.error("❌ ML analysis error:", error.message);

    return res.status(500).json({
      error: "Failed to analyze harmful ingredients"
    });
  }
};
