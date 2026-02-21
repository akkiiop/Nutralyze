/**
 * ✅ KING-LEVEL DISH-CENTRIC PROMPT ENGINE (DYNAMIC MEALS)
 * Generates meals strictly based on mealSlots (3 / 4 / 6)
 */
export function buildDietPlanPrompt({ profile, todayStatus }) {
  const { remaining } = todayStatus;
  const mealSlots = profile.mealSlots || [];

  return `
### ROLE
You are a Clinical Nutritionist and Culinary Expert API.
Your task is to generate a corrective diet plan for the REMAINDER of the user's day.

### USER METADATA (STRICT ADHERENCE)
- **Diet Type**: ${profile.dietType} (Only suggest dishes within this category)
- **Cuisine**: ${profile.preferredCuisine}
- **Medical Conditions**: ${profile.conditions.join(", ") || "None"}
- **Allergies**: ${profile.allergies.join(", ") || "None"} (NEVER include these)

### REMAINING MACRO BUDGET (DELTA)
- Calories remaining: ${remaining.calories} kcal
- Protein remaining: ${remaining.protein} g
- Sugar limit remaining: ${remaining.sugar} g
- Fiber goal remaining: ${remaining.fiber} g

### MEAL STRUCTURE (CRITICAL)
You MUST generate meals ONLY for the following meal slots:
${mealSlots.join(", ")}

RULES:
1. Number of meals MUST EXACTLY match the slots above.
2. Use FULL DISH NAMES (not ingredients).
3. Dishes must respect diet type, allergies, and medical conditions.
4. Do NOT add or remove meals.
5. Keep total calories within remaining budget.

### OUTPUT FORMAT (STRICT JSON ONLY)
No markdown, no explanations, no <think> blocks.

{
  "meals": [
    { "name": "<mealSlot>", "description": "Dish name with short corrective reasoning." }
  ],
  "recommendedFoods": "Markdown list of foods that support today's remaining macros.",
  "foodsToAvoid": "Markdown list of foods violating allergies or conditions.",
  "aiInsight": "One-line adaptive nutrition insight."
}
`.trim();
}
