import axios from "axios";

/* =========================
   HELPERS
========================= */
const toNumber = (v, { allowZero = false } = {}) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  if (!allowZero && n <= 0) return null;
  return n;
};

const kjToKcal = (kj) => {
  const n = toNumber(kj);
  return n ? Math.round((n / 4.184) * 10) / 10 : null;
};

const pickFirstNumber = (...values) => {
  for (const v of values) {
    const n = toNumber(v);
    if (n !== null) return n;
  }
  return null;
};

const parseServingSizeToGrams = (text) => {
  if (!text) return null;
  const match = String(text).toLowerCase().match(/(\d+(\.\d+)?)\s*g/);
  return match ? Number(match[1]) : null;
};

const extractGramsFromQuantity = (text) => {
  if (!text) return null;
  const match = String(text).match(/(\d+(\.\d+)?)/);
  return match ? Number(match[1]) : null;
};

const buildCanonicalNutrition = ({ per100g, servingGrams }) => {
  if (!per100g || !servingGrams) return null;

  const factor = servingGrams / 100;
  const round = (v) => Math.round(v * 10) / 10;

  return {
    calories: round((per100g.calories || 0) * factor),
    protein: round((per100g.protein || 0) * factor),
    carbs: round((per100g.carbs || 0) * factor),
    fats: round((per100g.fats || 0) * factor),
    sugar: round((per100g.sugar || 0) * factor),
    fiber: round((per100g.fiber || 0) * factor),
  };
};

const extractCalories100g = (nutr) => {
  const kcal = pickFirstNumber(
    nutr["energy-kcal_100g"],
    nutr["energy_kcal_100g"],
    nutr["energy-kcal"],
    nutr["energy_kcal"]
  );
  if (kcal !== null) return kcal;

  const kj = pickFirstNumber(
    nutr["energy-kj_100g"],
    nutr["energy_kj_100g"],
    nutr["energy_100g"],
    nutr["energy"]
  );
  return kjToKcal(kj);
};

const hasRealNutritionKeys = (nutr = {}) =>
  ["energy-kcal_100g", "fat_100g", "carbohydrates_100g", "proteins_100g"].some(
    (k) => nutr[k] !== undefined
  );

/* =========================
   CONTROLLER
========================= */
export const scanPackageFood = async (req, res) => {
  const barcode = req.body?.barcode?.trim();
  if (!barcode) return res.status(400).json({ error: "Barcode required" });

  try {
    const offRes = await axios.get(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      {
        headers: {
          "User-Agent": "Nutralyze - Final Year Project - Product Identification"
        }
      }
    );

    if (offRes.data.status === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const p = offRes.data.product;
    const nutr = hasRealNutritionKeys(p.nutriments)
      ? p.nutriments
      : p.nutriments_estimated || {};

    /* ---------- Identity ---------- */
    const identity = {
      name: p.product_name || "Unknown",
      brand: p.brands || "Unknown",
      quantity: p.quantity || null,
      categories: p.categories || null,
      countries: p.countries || null,
      barcode,
    };

    /* ---------- Nutrition ---------- */
    const calories100g = extractCalories100g(nutr);

    const nutrition = {
      energy: calories100g,
      servingSizeText: p.serving_size || null,
      servingSizeGrams: parseServingSizeToGrams(p.serving_size),

      per100g: {
        calories: calories100g,
        protein: toNumber(nutr["proteins_100g"]),
        carbs: toNumber(nutr["carbohydrates_100g"]),
        fats: toNumber(nutr["fat_100g"]),
        sugar: toNumber(nutr["sugars_100g"]),
        fiber: toNumber(nutr["fiber_100g"]),
      },

      isEstimated: nutr === p.nutriments_estimated,
      hasNutrition: Boolean(calories100g),
      canonical: null,
    };

    /* ---------- ✅ FINAL FIX ---------- */
    const resolvedServingGrams =
      nutrition.servingSizeGrams ??
      extractGramsFromQuantity(identity.quantity);

    nutrition.canonical = resolvedServingGrams
      ? buildCanonicalNutrition({
        per100g: nutrition.per100g,
        servingGrams: resolvedServingGrams,
      })
      : null;

    console.log("📦 CANONICAL DEBUG", {
      quantity: identity.quantity,
      resolvedServingGrams,
      canonical: nutrition.canonical,
    });

    /* ---------- Response ---------- */
    res.json({
      product: {
        identity,
        nutrition,
        images: {
          front: p.image_front_url || null,
          ingredients: p.image_ingredients_url || null,
          nutrition: p.image_nutrition_url || null,
        },
        ingredients: {
          rawText: p.ingredients_text || null,
          list: p.ingredients?.map((i) => i.text).filter(Boolean) || [],
        },
        scores: {
          nutriScore: p.nutriscore_grade?.toUpperCase() || null,
        },
      },
    });
  } catch (err) {
    console.error("Open Food Facts Error - Attempting AI Fallback", err.message);

    // AI Fallback Phase
     // AI Fallback Phase
try {
  const aiBaseUrl =
    process.env.AI_MODEL_URL ||
    process.env.VITE_AI_MODEL_URL ||
    "https://nutralyze-ai.onrender.com";

  const cleanedUrl = aiBaseUrl.endsWith("/")
    ? aiBaseUrl.slice(0, -1)
    : aiBaseUrl;

  const aiRes = await axios.post(
    `${cleanedUrl}/api/detect`,
    { barcode },
    { timeout: 15000 }
  );

  if (aiRes.data && !aiRes.data.error) {
    return res.json({
      product: {
        identity: aiRes.data,
        nutrition: {
          isEstimated: true,
          hasNutrition: true,
          per100g: aiRes.data.nutriments || {},
        },
        ingredients: {
          list: aiRes.data.ingredients || [],
        },
      },
    });
  }
} catch (aiErr) {
  console.error("AI Fallback failed too:", aiErr.message);
}
    
};
