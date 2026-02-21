import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Optional for Google Auth users
    googleId: { type: String, unique: true, sparse: true },
    authMethod: { type: String, enum: ["local", "google"], default: "local" },

    age: { type: Number },
    gender: { type: String, enum: ["male", "female", "other"] },

    height: { type: Number }, // cm
    weight: { type: Number }, // kg

    // ✅ add this
    targetWeight: { type: Number }, // kg

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

    sleepHours: { type: Number },

    medicalConditions: [{ type: String }],
    allergies: [{ type: String }],
    avoidIngredients: [{ type: String }],

    // ✅ Use dietType everywhere (veg/non-veg etc.)
    dietType: {
      type: String,
      enum: ["veg", "non-veg", "vegan", "jain", "keto"],
      default: "veg",
    },

    // ✅ add these
    preferredCuisine: { type: String, default: "indian" },
    mealFrequency: { type: String, default: "3" }, // 3 meals

    goal: { type: String }, // gain, lose, maintain

    calorieTarget: { type: Number },
    proteinTarget: { type: Number },
    sugarTarget: { type: Number, default: 50 },
    fiberTarget: { type: Number, default: 30 },
    waterIntakeGoal: { type: Number },

    wakeupTime: { type: String },
    profilePhoto: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
