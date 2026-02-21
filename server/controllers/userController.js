// server/controllers/userController.js
import User from "../models/User.js";

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    /**
     * ✅ IMPORTANT FIXES:
     * 1) Removed duplicate dietType declaration
     * 2) Removed dietaryType (not in schema)
     * 3) Avoid overwriting existing DB values with undefined
     * 4) Map UI values to schema fields safely
     */

    const {
      name,
      age,
      gender,
      height,
      weight,
      targetWeight, // ✅ NEW

      activityLevel,
      goal,

      // ✅ Use ONLY ONE standard key for preference
      dietType, // veg / non-veg / vegan / jain

      // ✅ NEW fields
      preferredCuisine, // indian / continental
      mealFrequency, // "3" / "4" / "5"

      // optional (add to schema if you want to store)
      budgetRange,
      sleepDuration,

      // Targets
      calorieTarget,
      proteinTarget,
      sugarTarget,
      fiberTarget,
      waterIntakeGoal,

      // Safety
      allergies,
      avoidIngredients,
      medicalConditions,
    } = req.body;

    // ✅ Only update fields that are provided (prevents reset-to-empty bug)
    const updateData = {};

    // Basic
    if (name !== undefined) updateData.name = name;

    if (age !== undefined) updateData.age = age;
    if (gender !== undefined) updateData.gender = gender;
    if (height !== undefined) updateData.height = height;
    if (weight !== undefined) updateData.weight = weight;
    if (targetWeight !== undefined) updateData.targetWeight = targetWeight;

    if (activityLevel !== undefined) updateData.activityLevel = activityLevel;
    if (goal !== undefined) updateData.goal = goal;

    // Dietary Intelligence (MAIN FIX)
    if (dietType !== undefined) updateData.dietType = dietType;
    if (preferredCuisine !== undefined) updateData.preferredCuisine = preferredCuisine;
    if (mealFrequency !== undefined) updateData.mealFrequency = mealFrequency;

    // Optional fields (store only if schema supports them)
    if (budgetRange !== undefined) updateData.budgetRange = budgetRange;
    if (sleepDuration !== undefined) updateData.sleepDuration = sleepDuration;

    // Targets
    if (calorieTarget !== undefined) updateData.calorieTarget = calorieTarget;
    if (proteinTarget !== undefined) updateData.proteinTarget = proteinTarget;
    if (sugarTarget !== undefined) updateData.sugarTarget = sugarTarget;
    if (fiberTarget !== undefined) updateData.fiberTarget = fiberTarget;
    if (waterIntakeGoal !== undefined) updateData.waterIntakeGoal = waterIntakeGoal;

    // Safety
    if (allergies !== undefined) updateData.allergies = allergies;
    if (avoidIngredients !== undefined) updateData.avoidIngredients = avoidIngredients;
    if (medicalConditions !== undefined) updateData.medicalConditions = medicalConditions;

    const updated = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updated) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      message: "Metabolic Profile Re-calibrated!",
      user: updated,
    });
  } catch (err) {
    console.error("Update Profile Critical Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
