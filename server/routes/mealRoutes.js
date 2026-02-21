import express from "express";
import mongoose from "mongoose";
import Meal from "../models/Meal.js";

const router = express.Router();

import {
  normalizeMealType,
  normalizeNutrition,
  normalizeDateYYYYMMDD,
  toNumber
} from "../utils/nutritionUtils.js";
import { updateDailySummary } from "../services/summaryService.js";

/* ============================================================
   1️⃣ MANUAL MEAL ENTRY (Add Meal Dialog)
   POST /api/meals/add
   Body:
   {
     userId,
     date: "YYYY-MM-DD",
     meal: { mealType, foodName, nutrition?, timestamp? }
   }
============================================================ */
router.post("/add", async (req, res) => {
  try {
    const { userId, date, meal } = req.body;

    if (!userId || !date || !meal) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid userId" });
    }

    const validDate = normalizeDateYYYYMMDD(date);
    if (!validDate) {
      return res.status(400).json({ success: false, message: "Invalid date format. Use YYYY-MM-DD" });
    }

    const mealType = normalizeMealType(meal.mealType);
    if (!mealType) {
      return res.status(400).json({
        success: false,
        message: `Invalid mealType. Allowed: ${MEAL_TYPES.join(", ")}`,
      });
    }

    const foodName = String(meal.foodName || meal.mealName || "").trim();
    if (!foodName) {
      return res.status(400).json({ success: false, message: "foodName is required" });
    }

    const newMealItem = {
      mealType,
      foodName,
      nutrition: normalizeNutrition(meal.nutrition || meal),
      timestamp: meal.timestamp ? new Date(meal.timestamp) : new Date(),
    };

    const doc = await Meal.findOneAndUpdate(
      { userId, date: validDate },
      { $push: { meals: newMealItem } },
      { upsert: true, new: true }
    );

    // ✅ Update Daily Summary & Streak
    try {
      await updateDailySummary(userId, validDate);
    } catch (summaryError) {
      console.error("⚠️ Failed to update Daily Summary:", summaryError);
    }

    return res.json({ success: true, doc });
  } catch (err) {
    console.error("Add meal error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ============================================================
   2️⃣ AUTO-DETECTED MEAL ENTRY (Dashboard → Backend)
   POST /api/meals/detected
   Body:
   {
     userId,
     mealType,
     foodName,
     nutrition: { calories, protein, carbs, fats },
     timestamp (optional)
   }
============================================================ */
router.post("/detected", async (req, res) => {
  try {
    console.log("🔍 [Detected] Request Body:", JSON.stringify(req.body, null, 2));

    const { userId, mealType, foodName, nutrition, timestamp, serving, portionMultiplier } = req.body;

    if (!userId || !foodName || !nutrition) {
      console.error("❌ [Detected] Missing fields:", { userId, foodName, nutrition });
      return res.status(400).json({
        success: false,
        message: "Missing detected meal fields",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("❌ [Detected] Invalid userId:", userId);
      return res.status(400).json({ success: false, message: "Invalid userId" });
    }

    const normalizedMealType = normalizeMealType(mealType) || "snacks";
    const cleanFoodName = String(foodName).trim();

    // Check nutrition normalization
    console.log("🔍 [Detected] Normalizing nutrition...");
    const cleanNutrition = normalizeNutrition(nutrition);
    console.log("✅ [Detected] Nutrition normalized:", cleanNutrition);

    const ts = timestamp ? new Date(timestamp) : new Date();
    const date = ts.toISOString().split("T")[0];

    const mealItem = {
      mealType: normalizedMealType,
      foodName: cleanFoodName,
      nutrition: cleanNutrition,
      timestamp: ts,

      // ✅ NEW
      source: "ai_fresh",
      serving: {
        unit: String(serving?.unit || "serving"),
        quantity: toNumber(serving?.quantity, 1),
        weight_est: toNumber(serving?.weight_est, 0),
      },
      portionMultiplier: toNumber(portionMultiplier, 1),
    };

    console.log("🔍 [Detected] Saving to DB...");
    const doc = await Meal.findOneAndUpdate(
      { userId, date },
      { $push: { meals: mealItem } },
      { upsert: true, new: true }
    );
    console.log("✅ [Detected] Saved to DB. Doc ID:", doc._id);

    // ✅ Update Daily Summary & Streak
    try {
      console.log("🔍 [Detected] Updating summary...");
      await updateDailySummary(userId, date);
      console.log("✅ [Detected] Summary updated.");
    } catch (summaryError) {
      console.error("⚠️ Failed to update Daily Summary:", summaryError);
      // We do NOT return 500 here, so the meal is still saved.
    }

    return res.json({ success: true, doc });
  } catch (err) {
    console.error("❌ [Detected] CRITICAL ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error: " + err.message, stack: err.stack });
  }
});


/* ============================================================
   3️⃣ GET MEALS FOR A SPECIFIC DATE
   GET /api/meals/:userId/:date
============================================================ */
router.get("/:userId/:date", async (req, res) => {
  try {
    const { userId, date } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid userId" });
    }

    const validDate = normalizeDateYYYYMMDD(date);
    if (!validDate) {
      return res.status(400).json({ success: false, message: "Invalid date format. Use YYYY-MM-DD" });
    }

    const mealDoc = await Meal.findOne({ userId, date: validDate }).lean();
    const meals = mealDoc?.meals || [];

    return res.json({ success: true, meals });
  } catch (err) {
    console.error("Meals fetch error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ============================================================
   4️⃣ GET MEAL COMPLETION STATUS (Streak Calendar)
   GET /api/meals/status/:userId
============================================================ */
router.get("/status/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid userId" });
    }

    const mealDocs = await Meal.find({ userId }).lean();

    const status = {};
    mealDocs.forEach((doc) => {
      const dayStatus = {
        breakfast: false,
        lunch: false,
        snacks: false,
        dinner: false,
      };

      (doc.meals || []).forEach((meal) => {
        const t = normalizeMealType(meal.mealType);
        if (t) dayStatus[t] = true;
      });

      status[doc.date] = dayStatus;
    });

    return res.json({ success: true, status });
  } catch (err) {
    console.error("Meal status fetch error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
