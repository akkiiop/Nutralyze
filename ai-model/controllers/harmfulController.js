import axios from "axios";

const ML_SERVICE_URL = "http://localhost:8002/predict";

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

    // Call Python ML service
    const mlResponse = await axios.post(
      ML_SERVICE_URL,
      { ingredients },
      { timeout: 15000 } // important for ML calls
    );

    const results = mlResponse.data.results || [];

    // Filter harmful ingredients
    const harmful = results.filter(
      (item) =>
        item.label === "harmful" &&
        item.confidence >= 0.7
    );

    return res.json({
      harmful,
      all: results
    });

  } catch (error) {
    console.error("ML integration error:", error.message);

    return res.status(500).json({
      error: "Failed to analyze harmful ingredients"
    });
  }
};
