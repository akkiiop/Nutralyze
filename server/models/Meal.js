import mongoose from "mongoose";

/* =========================
   Meal Item (single entry)
   ========================= */
const mealItemSchema = new mongoose.Schema(
  {
    mealType: {
      type: String,
      required: true,
      enum: ["breakfast", "lunch", "snacks", "dinner"],
      lowercase: true,
      trim: true,
    },

    foodName: {
      type: String,
      required: true,
      trim: true,
    },

    // source of entry
    source: {
      type: String,
      enum: ["ai_fresh", "manual", "packaged", "edited"],
      default: "manual",
      lowercase: true,
      trim: true,
    },

    /* -------------------------
       Serving metadata
       (descriptive only)
       ------------------------- */
    serving: {
      unit: {
        type: String,
        default: "serving",
        trim: true,
      },
      quantity: {
        type: Number,
        default: 1,
        min: 0,
      },
      weight_est: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    portionMultiplier: {
      type: Number,
      default: 1,
      min: 0.1,
      max: 10,
    },

    /* -------------------------
       FINAL CONSUMED NUTRITION
       (THIS is what totals use)
       ------------------------- */
    nutrition: {
      calories: {
        type: Number,
        default: 0,
        min: 0,
        set: (v) => Number(v) || 0,
      },
      protein: {
        type: Number,
        default: 0,
        min: 0,
        set: (v) => Number(v) || 0,
      },
      carbs: {
        type: Number,
        default: 0,
        min: 0,
        set: (v) => Number(v) || 0,
      },
      fats: {
        type: Number,
        default: 0,
        min: 0,
        set: (v) => Number(v) || 0,
      },

      // health metrics (diet plan depends on these)
      sugar: {
        type: Number,
        default: 0,
        min: 0,
        set: (v) => Number(v) || 0,
      },
      fiber: {
        type: Number,
        default: 0,
        min: 0,
        set: (v) => Number(v) || 0,
      },
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,          // ✅ FIXED (important)
    timestamps: false,
  }
);

/* =========================
   Daily Meal Document
   ========================= */
const mealSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    date: {
      type: String, // YYYY-MM-DD
      required: true,
      trim: true,
      index: true,
    },

    meals: {
      type: [mealItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

mealSchema.index({ userId: 1, date: 1 }, { unique: true });

const Meal = mongoose.model("Meal", mealSchema);
export default Meal;
