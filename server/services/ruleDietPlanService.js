// server/services/ruleDietPlanService.js

/**
 * ✅ Deterministic Rule-Based Diet Plan Generator
 * This is the fallback engine when AI fails.
 * It must ALWAYS return a valid plan object.
 */

const MEAL_ORDER = ["breakfast", "lunch", "snacks", "dinner"];

export function generateDietPlanWithRules({ profile, dailyTargets }) {
  const meals = buildMealSuggestions(dailyTargets);

  const recommended = recommendedFoodsTemplate(profile);
  const avoid = foodsToAvoidTemplate(profile);

  return {
    dailyTargets,
    meals,
    recommendedFoods: `## Protein\n${recommended.protein}\n\n## Carbs\n${recommended.carbs}\n\n## Fats\n${recommended.fats}`,
    foodsToAvoid: avoid,
    warnings: [],
  };
}

/**
 * ✅ Meal suggestions based on calorie split
 */
function buildMealSuggestions(dailyTargets) {
  const totalCalories = dailyTargets?.total?.calories || 2000;

  const distribution = {
    breakfast: Math.round(totalCalories * 0.3),
    lunch: Math.round(totalCalories * 0.35),
    snacks: Math.round(totalCalories * 0.1),
    dinner: Math.round(totalCalories * 0.25),
  };

  return MEAL_ORDER.map((mealType) => ({
    name: mealType,
    description:
      mealType === "breakfast"
        ? `Target ~${distribution.breakfast} kcal. Example: poha/upma + fruit + protein.`
        : mealType === "lunch"
        ? `Target ~${distribution.lunch} kcal. Example: roti/rice + dal + salad + protein.`
        : mealType === "snacks"
        ? `Target ~${distribution.snacks} kcal. Example: nuts/banana/roasted chana.`
        : `Target ~${distribution.dinner} kcal. Example: lighter meal + veggies + protein.`,
  }));
}

/**
 * ✅ Recommended foods template
 */
function recommendedFoodsTemplate(profile) {
  const dietaryType = profile?.dietaryType || "balanced";
  const goal = profile?.goal || "maintenance";

  let protein = [];
  if (dietaryType === "vegan") {
    protein = ["tofu/tempeh", "lentils", "chickpeas", "quinoa", "nuts & seeds"];
  } else if (dietaryType === "vegetarian") {
    protein = ["eggs", "paneer", "greek yogurt", "lentils & beans", "tofu"];
  } else {
    protein = ["chicken breast", "fish", "eggs", "greek yogurt", "lean meat"];
  }

  const carbs =
    goal === "weight_loss"
      ? ["leafy greens", "berries", "oats", "sweet potato", "brown rice (small)"]
      : ["brown rice", "sweet potato", "oats", "whole wheat roti", "fruits"];

  const fats = ["avocado", "almonds/walnuts", "chia/flax seeds", "olive oil"];

  return {
    protein: protein.map((x) => `- ${x}`).join("\n"),
    carbs: carbs.map((x) => `- ${x}`).join("\n"),
    fats: fats.map((x) => `- ${x}`).join("\n"),
  };
}

/**
 * ✅ Foods to avoid template
 */
function foodsToAvoidTemplate(profile) {
  const restrict = [
    "- Sugary beverages / sodas",
    "- Deep fried snacks (frequent)",
    "- Ultra-processed packaged foods",
    "- Excess sweets / desserts",
    "- Refined grains (white bread, maida) in large quantity",
  ];

  // diabetes logic
  if ((profile?.healthConditions || []).includes("diabetes")) {
    restrict.push("- High GI foods (white rice, sugary cereals)");
  }

  // gluten logic
  if ((profile?.allergies || []).includes("gluten")) {
    restrict.push("- Gluten grains (wheat, barley, rye)");
  }

  // show allergy list
  for (const a of profile?.allergies || []) restrict.push(`- Allergy: avoid ${a}`);

  // show avoidIngredients list
  for (const x of profile?.avoidIngredients || [])
    restrict.push(`- Avoid ingredient: ${x}`);

  return restrict.join("\n");
}
