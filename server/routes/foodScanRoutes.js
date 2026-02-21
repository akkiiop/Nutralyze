import express from "express";
import axios from "axios";

const router = express.Router();

/**
 * GET /api/scan/barcode/:barcode
 * Fetch product info from OpenFoodFacts
 */
router.get("/barcode/:barcode", async (req, res) => {
  try {
    const { barcode } = req.params;

    const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
    const response = await axios.get(url);

    if (response.data.status === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const product = response.data.product;

    return res.json({
      success: true,
      product: {
        name: product.product_name || "Unknown",
        brand: product.brands,
        ingredients: product.ingredients_text || "",
        nutriments: product.nutriments || {},
        additives: product.additives_original_tags || [],
        image: product.image_front_url,
      }
    });

  } catch (err) {
    console.error("OpenFoodFacts Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product data",
    });
  }
});

export default router;
