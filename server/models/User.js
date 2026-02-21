import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    googleId: { type: String, unique: true, sparse: true },
    authMethod: { type: String, enum: ["local", "google"], default: "local" },

    age: { type: Number, min: 1, max: 150 },
    gender: { type: String, enum: ["male", "female", "other"] },

    height: { type: Number, min: 30, max: 300 },
    weight: { type: Number, min: 10, max: 500 },
    targetWeight: { type: Number, min: 10, max: 500 },

    activityLevel: {
      type: String,
      enum: [
        "sedentary",
        "lightly_active",
        "moderately_active",
        "very_active",
        "athlete",
      ],
    },

    sleepHours: { type: Number, min: 0, max: 24 },

    medicalConditions: [{ type: String }],
    allergies: [{ type: String }],
    avoidIngredients: [{ type: String }],

    dietType: {
      type: String,
      enum: ["veg", "non-veg", "vegan", "jain", "keto"],
      default: "veg",
    },

    preferredCuisine: { type: String, default: "indian" },
    mealFrequency: { type: String, default: "3" },

    goal: { type: String, enum: ["gain", "lose", "maintain"] },

    calorieTarget: { type: Number, min: 500, max: 10000 },
    proteinTarget: { type: Number, min: 0 },
    sugarTarget: { type: Number, default: 50, min: 0 },
    fiberTarget: { type: Number, default: 30, min: 0 },
    waterIntakeGoal: { type: Number, min: 0 },

    wakeupTime: { type: String },
    profilePhoto: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
