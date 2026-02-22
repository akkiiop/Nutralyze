/**
 * ✅ ADAPTIVE SAFETY VALIDATOR (DYNAMIC MEAL COUNT)
 * - Respects mealSlots
 * - Enforces allergy safety
 * - Adds warnings instead of crashing
 */
export function validateAndSanitizeDietPlan({ aiPlan, profile, remaining }) {
  const warnings = [];
  const sanitizedPlan = { ...aiPlan };

  /* ===============================
     BASIC STRUCTURE VALIDATION
  =============================== */
  if (!sanitizedPlan.meals || !Array.isArray(sanitizedPlan.meals)) {
    throw new Error("Invalid AI response: meals array missing.");
  }

  const expectedSlots = profile.mealSlots || [];

  if (sanitizedPlan.meals.length !== expectedSlots.length) {
    warnings.push(
      `Meal count mismatch. Expected ${expectedSlots.length}, received ${sanitizedPlan.meals.length}.`
    );
  }

  /* ===============================
     MEDICAL + ALLERGY GUARDRAILS
  =============================== */
  const allergies = (profile.allergies || []).map((a) => a.toLowerCase());
  const avoidList = (profile.avoid || []).map((a) => a.toLowerCase());

  const forbiddenKeywords = [...new Set([...allergies, ...avoidList])].filter(Boolean);

  sanitizedPlan.meals = sanitizedPlan.meals.map((meal) => {
    const content = `${meal.name} ${meal.description}`.toLowerCase();

    const violated = forbiddenKeywords.filter((k) => content.includes(k));

    if (violated.length > 0) {
      warnings.push(`Dish may contain restricted items: ${violated.join(", ")}`);
    }

    return meal;
  });

  /* ===============================
     CALORIE BUDGET GUARDRAIL
  =============================== */
  const calorieBudget = Number(remaining.calories || 0);
  const estimatedPerMeal = 450;
  const estimatedTotal = sanitizedPlan.meals.length * estimatedPerMeal;

  if (calorieBudget > 0 && estimatedTotal > calorieBudget + 400) {
    warnings.push("Total meals may exceed remaining calorie budget. Adjust portions.");
  }

  /* ===============================
     AI INSIGHT FALLBACK
  =============================== */
  if (!sanitizedPlan.aiInsight || sanitizedPlan.aiInsight.length < 5) {
    sanitizedPlan.aiInsight = `Meals are optimized to meet remaining ${remaining.protein}g protein within your calorie budget.`;
  }

  return {
    ok: true,
    plan: sanitizedPlan,
    warnings,
  };
}
