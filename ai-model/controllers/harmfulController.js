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

    // Call ported ML logic locally
    const { results, frequency_analysis } = predictIngredients(ingredients);

    // Filter harmful ingredients for specific response format if needed
    const harmful = results.filter(
      (item) =>
        item.label === "harmful" &&
        item.risk >= 40 // adjusted to match common training thresholds
    );

    return res.json({
      harmful,
      all: results,
      frequency_analysis
    });

  } catch (error) {
    console.error("ML analysis error:", error.message);

    return res.status(500).json({
      error: "Failed to analyze harmful ingredients"
    });
  }
};
