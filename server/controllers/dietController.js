import DietPlan from "../models/DietPlan.js";
import User from "../models/User.js";
import Meal from "../models/Meal.js";
import { generateDietPlanWithAI } from "../services/aiDietPlanService.js";
import { validateAndSanitizeDietPlan } from "../utils/dietPlanValidator.js";

const toNumber = (v, def = null) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

const getTodayWindow = () => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  return { todayStart, todayEnd };
};

const calculateDailyCalories = (profile) => {
  const weight = toNumber(profile.weight, 70);
  const height = toNumber(profile.height, 170);
  const age = toNumber(profile.age, 30);
  const gender = profile.gender || "male";
  const activityLevel = profile.activityLevel || "sedentary";
  const goal = profile.goal || "maintenance";

  const bmr =
    gender === "male"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;

  const multipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    athlete: 1.9,
  };

  let tdee = bmr * (multipliers[activityLevel] || 1.2);

  if (goal === "weight_loss") tdee -= 500;
  if (goal === "weight_gain") tdee += 500;

  return Math.round(Math.max(1200, tdee));
};

/* =========================
   ✅ MEAL SLOT RESOLUTION
========================= */
const getMealSlots = (mealFrequency) => {
  switch (String(mealFrequency)) {
    case "3":
      return ["breakfast", "lunch", "dinner"];
    case "6":
      return ["meal1", "meal2", "meal3", "meal4", "meal5", "meal6"];
    default:
      return ["breakfast", "lunch", "snacks", "dinner"];
  }
};

/* =========================
   ✅ DIET TYPE RESOLUTION
========================= */
const resolveDietType = (user) => {
  const dt =
    user?.dietType ||
    user?.dietaryType ||
    user?.dietPreference ||
    user?.dietaryPreference ||
    "veg";

  return String(dt).toLowerCase();
};

/* =========================
   ✅ MEAL LOG AGGREGATION
========================= */
function sumMealNutrition(todayLog) {
  const eaten = { calories: 0, protein: 0, carbs: 0, fats: 0, sugar: 0, fiber: 0 };
  if (!todayLog?.meals) return eaten;

  const items = Array.isArray(todayLog.meals)
    ? todayLog.meals
    : Object.values(todayLog.meals).flat();

  for (const m of items) {
    const nut = m?.nutrition || {};
    eaten.calories += Number(nut.calories || 0);
    eaten.protein += Number(nut.protein || 0);
    eaten.carbs += Number(nut.carbs || 0);
    eaten.fats += Number(nut.fats || 0);
    eaten.sugar += Number(nut.sugar || 0);
    eaten.fiber += Number(nut.fiber || 0);
  }

  Object.keys(eaten).forEach((k) => (eaten[k] = Math.round(eaten[k])));
  return eaten;
}

/* =========================
   ✅ CORE GENERATOR
========================= */
async function generateFreshDietPlan(userId) {
  const user = await User.findById(userId).lean();
  if (!user) throw new Error("User metadata missing.");

  const todayStr = new Date().toLocaleDateString("en-CA");
  const todayLog = await Meal.findOne({ userId, date: todayStr }).lean();

  const eaten = sumMealNutrition(todayLog);

  const calorieTarget = toNumber(user.calorieTarget) || calculateDailyCalories(user);
  const proteinTarget =
    toNumber(user.proteinTarget) || Math.round(toNumber(user.weight, 70) * 1.8);

  const sugarTarget = toNumber(user.sugarTarget) || 50;
  const fiberTarget = toNumber(user.fiberTarget) || 30;

  const remainingBudget = {
    calories: Math.max(0, calorieTarget - eaten.calories),
    protein: Math.max(0, proteinTarget - eaten.protein),
    sugar: Math.max(0, sugarTarget - eaten.sugar),
    fiber: Math.max(0, fiberTarget - eaten.fiber),
    carbs: Math.round((calorieTarget * 0.45) / 4),
    fats: Math.round((calorieTarget * 0.25) / 9),
  };

  const dietType = resolveDietType(user);
  const mealSlots = getMealSlots(user.mealFrequency);

  const profileSnapshot = {
    goal: user.goal || "maintenance",
    dietType,
    dietaryPreference: dietType,
    preferredCuisine: user.preferredCuisine || "indian",
    mealFrequency: user.mealFrequency || "4",
    mealSlots,
    allergies: user.allergies || [],
    avoid: user.avoidIngredients || [],
    conditions: user.medicalConditions || [],
  };

  const inputSnapshot = {
    profile: profileSnapshot,
    todayStatus: {
      consumed: eaten,
      remaining: remainingBudget,
      targets: {
        calories: calorieTarget,
        protein: proteinTarget,
        sugar: sugarTarget,
        fiber: fiberTarget,
      },
    },
  };

  /* ===== AI + retry once ===== */
  let aiPlanRaw = null;
  let lastError = null;

  for (let i = 1; i <= 2; i++) {
    try {
      aiPlanRaw = await generateDietPlanWithAI(inputSnapshot);
      break;
    } catch (err) {
      lastError = err;
    }
  }

  /* ===== DYNAMIC FALLBACK ===== */
  if (!aiPlanRaw) {
    console.error("AI failed twice:", lastError?.message);

    return {
      engineUsed: "system_fallback",
      warnings: ["AI unavailable. Fallback plan generated."],
      inputSnapshot,

      meals: mealSlots.map((slot) => ({
        name: slot,
        description: `Balanced ${slot} focusing on protein and calorie control.`,
      })),

      recommendedFoods:
        "- Dal / Chana / Rajma\n- Eggs / Chicken / Fish (if non-veg)\n- Seasonal vegetables",
      foodsToAvoid:
        "- Ultra processed foods\n- Sugary drinks\n- Deep fried items",
      aiInsight:
        "Fallback plan generated using your meal frequency and nutrition targets.",
    };
  }

  const validated = validateAndSanitizeDietPlan({
    aiPlan: aiPlanRaw,
    profile: profileSnapshot,
    remaining: remainingBudget,
  });

  return {
    engineUsed: "ai_adaptive",
    warnings: validated.warnings || [],
    inputSnapshot,
    ...validated.plan,
  };
}

/* =========================
   ✅ CONTROLLERS
========================= */

export async function getLatestDietPlan(req, res) {
  try {
    const userId = req.user?.id || req.user?._id;
    const { todayStart, todayEnd } = getTodayWindow();

    const dietPlan = await DietPlan.findOne({
      userId,
      createdAt: { $gte: todayStart, $lte: todayEnd },
    }).sort({ createdAt: -1 });

    res.json({ success: true, dietPlan: dietPlan || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function generateDietPlan(req, res) {
  try {
    const userId = req.user?.id || req.user?._id;
    const { todayStart, todayEnd } = getTodayWindow();

    const existing = await DietPlan.findOne({
      userId,
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });

    if (existing) return res.json({ success: true, dietPlan: existing });

    const result = await generateFreshDietPlan(userId);

    const plan = await DietPlan.create({
      userId,
      ...result,
      meals: result.meals,
      createdAt: new Date(),
      lastGeneratedAt: new Date(),
    });

    res.json({ success: true, dietPlan: plan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function regenerateDietPlan(req, res) {
  try {
    const userId = req.user?.id || req.user?._id;
    const { todayStart, todayEnd } = getTodayWindow();

    await DietPlan.deleteMany({ userId, createdAt: { $gte: todayStart, $lte: todayEnd } });

    const result = await generateFreshDietPlan(userId);

    const plan = await DietPlan.create({
      userId,
      ...result,
      meals: result.meals,
      createdAt: new Date(),
      lastGeneratedAt: new Date(),
    });

    res.json({ success: true, dietPlan: plan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
