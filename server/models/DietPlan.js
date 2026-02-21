import mongoose from "mongoose";

/* ======================
   MEAL SCHEMA
====================== */
const mealSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // breakfast / meal1 / etc
    description: { type: String, default: "" },
  },
  { _id: true }
);

/* ======================
   DIET PLAN SCHEMA
====================== */
const dietPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    engineUsed: {
      type: String,
      enum: ["ai", "rule", "ai_adaptive", "system_fallback"],
      default: "rule",
    },

    aiInsight: { type: String, default: "" },

    warnings: { type: [String], default: [] },

    /* ======================
       SNAPSHOT (IMPORTANT)
    ====================== */
    inputSnapshot: {
      profile: {
        goal: String,
        dietType: String,
        preferredCuisine: String,
        mealFrequency: String,

        // ✅ NEW (OPTION-1 CORE)
        mealSlots: { type: [String], default: [] },

        allergies: [String],
        avoid: [String],
        conditions: [String],
      },

      todayStatus: {
        consumed: {
          calories: Number,
          protein: Number,
          carbs: Number,
          fats: Number,
          sugar: Number,
          fiber: Number,
        },
        remaining: {
          calories: Number,
          protein: Number,
          carbs: Number,
          fats: Number,
          sugar: Number,
          fiber: Number,
        },
        targets: {
          calories: Number,
          protein: Number,
          sugar: Number,
          fiber: Number,
        },
      },
    },

    /* ======================
       GENERATED OUTPUT
    ====================== */
    meals: [mealSchema],

    recommendedFoods: { type: String, default: "" },
    foodsToAvoid: { type: String, default: "" },

    createdAt: { type: Date, default: Date.now },
    lastGeneratedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: "diet_plans",
  }
);

export default mongoose.model("DietPlan", dietPlanSchema);
