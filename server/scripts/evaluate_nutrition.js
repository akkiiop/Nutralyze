/**
 * ============================================================
 * NUTRALYZE — NUTRITION ESTIMATION ACCURACY EVALUATOR
 * ============================================================
 * This script tests the Groq LLM nutrition estimation against
 * known USDA/IFCT reference values for common Indian & global foods.
 * 
 * Metric: Mean Absolute Percentage Error (MAPE)
 *   MAPE = (1/n) * Σ |actual - predicted| / actual * 100
 * ============================================================
 */

import Groq from "groq-sdk";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Since this is in server/scripts, the .env is in the parent dir
dotenv.config({ path: path.join(__dirname, "../.env") });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ============================
// USDA / IFCT GROUND TRUTH
// Source: USDA FoodData Central + Indian Food Composition Tables (NIN, Hyderabad)
// All values are PER SERVING (not per 100g)
// ============================
const TEST_CASES = [
  {
    name: "Boiled Egg",
    unit: "piece", quantity: 1, weight_est: 50,
    usda: { calories: 78, protein: 6.3, carbs: 0.6, fats: 5.3 }
  },
  {
    name: "Banana",
    unit: "piece", quantity: 1, weight_est: 120,
    usda: { calories: 105, protein: 1.3, carbs: 27, fats: 0.4 }
  },
  {
    name: "White Rice (Cooked)",
    unit: "bowl", quantity: 1, weight_est: 200,
    usda: { calories: 260, protein: 4.4, carbs: 56, fats: 0.4 }
  },
  {
    name: "Chapati / Roti",
    unit: "piece", quantity: 1, weight_est: 40,
    usda: { calories: 120, protein: 3.5, carbs: 20, fats: 3.5 }
  },
  {
    name: "Dal (Toor/Arhar) Cooked",
    unit: "bowl", quantity: 1, weight_est: 200,
    usda: { calories: 198, protein: 11.8, carbs: 34, fats: 1.2 }
  },
  {
    name: "Apple",
    unit: "piece", quantity: 1, weight_est: 180,
    usda: { calories: 95, protein: 0.5, carbs: 25, fats: 0.3 }
  },
  {
    name: "Chicken Breast (Grilled)",
    unit: "piece", quantity: 1, weight_est: 150,
    usda: { calories: 231, protein: 43.5, carbs: 0, fats: 5.0 }
  },
  {
    name: "Paneer (Cottage Cheese)",
    unit: "serving", quantity: 1, weight_est: 100,
    usda: { calories: 265, protein: 18.3, carbs: 1.2, fats: 20.8 }
  },
  {
    name: "Samosa (Fried)",
    unit: "piece", quantity: 1, weight_est: 80,
    usda: { calories: 240, protein: 4.0, carbs: 28, fats: 13 }
  },
  {
    name: "Idli",
    unit: "piece", quantity: 2, weight_est: 120,
    usda: { calories: 156, protein: 4.8, carbs: 32, fats: 0.4 }
  },
  {
    name: "Poha (Flattened Rice)",
    unit: "plate", quantity: 1, weight_est: 200,
    usda: { calories: 250, protein: 5.0, carbs: 45, fats: 6.0 }
  },
  {
    name: "Masala Dosa",
    unit: "piece", quantity: 1, weight_est: 150,
    usda: { calories: 206, protein: 4.0, carbs: 30, fats: 8.0 }
  },
  {
    name: "Orange",
    unit: "piece", quantity: 1, weight_est: 150,
    usda: { calories: 62, protein: 1.2, carbs: 15.4, fats: 0.2 }
  },
  {
    name: "Curd / Yogurt (Plain)",
    unit: "bowl", quantity: 1, weight_est: 150,
    usda: { calories: 90, protein: 5.3, carbs: 7.0, fats: 4.5 }
  },
  {
    name: "Gulab Jamun",
    unit: "piece", quantity: 2, weight_est: 80,
    usda: { calories: 300, protein: 3.5, carbs: 45, fats: 12 }
  }
];

// ============================
// ESTIMATION FUNCTION (same as your detectController.js)
// ============================
async function estimateNutrition(identity) {
  const name = identity.name;
  const unit = identity.unit;
  const quantity = identity.quantity;
  const weight_est = identity.weight_est;

  const prompt = `
You are a professional Nutritionist.
Your job: estimate nutrition for the EXACT detected serving size, using common real-world values.

Identity:
- name: "${name}"
- unit: "${unit}"
- quantity: ${quantity}
- weight_est (grams): ${weight_est}

Serving rule:
- Calculate nutrition for the detected serving (${quantity} ${unit}, ~${weight_est}g).
- If unit is "piece" or "egg", calculate for that many units.
- If unit is "bowl" or "plate" or "cup", calculate for that quantity.
- Use weight_est as supporting info.
- Do NOT return per 100g numbers.

Return ONLY JSON:
{
  "nutrition": { "calories": 0, "protein": 0, "carbs": 0, "fats": 0 }
}

Constraints:
- Keep values realistic.
- Numbers can be decimals (1 decimal).
- NEVER return 0 for straight macros unless the food is Water, Black Coffee, or truly zero-calorie.
- Use standard USDA/Indian Food Composition Table references.
`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.1,
    max_tokens: 200,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are a nutrition estimation engine. Return ONLY JSON." },
      { role: "user", content: prompt },
    ],
  });

  const raw = completion?.choices?.[0]?.message?.content || "{}";
  return JSON.parse(raw);
}

// ============================
// MAPE CALCULATION
// ============================
function calcMAPE(actual, predicted) {
  if (actual === 0 && predicted === 0) return 0;
  if (actual === 0) return 100; // edge case: ground truth is 0 but predicted non-zero
  return Math.abs((actual - predicted) / actual) * 100;
}

// ============================
// MAIN EVALUATION LOOP
// ============================
async function runEvaluation() {
  console.log("=" .repeat(80));
  console.log("  NUTRALYZE — NUTRITION ESTIMATION ACCURACY EVALUATION");
  console.log("  Model: llama-3.1-70b-versatile (via Groq API)");
  console.log("  Test Cases: " + TEST_CASES.length + " common foods");
  console.log("  Ground Truth: USDA FoodData Central + Indian Food Composition Tables");
  console.log("=" .repeat(80));
  console.log();

  const errors = { calories: [], protein: [], carbs: [], fats: [] };
  const results = [];

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    process.stdout.write(`[${i + 1}/${TEST_CASES.length}] Testing: ${tc.name} (${tc.quantity} ${tc.unit}, ~${tc.weight_est}g)... `);

    try {
      const response = await estimateNutrition(tc);
      const pred = response.nutrition || {};

      const row = {
        food: tc.name,
        serving: `${tc.quantity} ${tc.unit} (~${tc.weight_est}g)`,
        cal_usda: tc.usda.calories,
        cal_pred: Math.round(pred.calories || 0),
        cal_err: calcMAPE(tc.usda.calories, pred.calories || 0).toFixed(1),
        prot_usda: tc.usda.protein,
        prot_pred: Number((pred.protein || 0)).toFixed(1),
        prot_err: calcMAPE(tc.usda.protein, pred.protein || 0).toFixed(1),
        carb_usda: tc.usda.carbs,
        carb_pred: Number((pred.carbs || 0)).toFixed(1),
        carb_err: tc.usda.carbs > 0 ? calcMAPE(tc.usda.carbs, pred.carbs || 0).toFixed(1) : "N/A",
        fat_usda: tc.usda.fats,
        fat_pred: Number((pred.fats || 0)).toFixed(1),
        fat_err: calcMAPE(tc.usda.fats, pred.fats || 0).toFixed(1),
      };

      results.push(row);

      errors.calories.push(parseFloat(row.cal_err));
      errors.protein.push(parseFloat(row.prot_err));
      if (tc.usda.carbs > 0) errors.carbs.push(parseFloat(row.carb_err));
      errors.fats.push(parseFloat(row.fat_err));

      console.log(`✅ Cal: ${row.cal_pred} (USDA: ${row.cal_usda}, Err: ${row.cal_err}%)`);

      // Rate limit protection (Groq free tier)
      await new Promise(r => setTimeout(r, 2500));

    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  // ============================
  // RESULTS TABLE
  // ============================
  console.log("\n" + "=" .repeat(80));
  console.log("  DETAILED RESULTS");
  console.log("=" .repeat(80));

  console.log("\n%-25s | %-18s | %-18s | %-18s | %-18s",
    "Food", "Calories (Err%)", "Protein (Err%)", "Carbs (Err%)", "Fats (Err%)");
  console.log("-".repeat(105));

  for (const r of results) {
    console.log(
      `${r.food.padEnd(25)} | ${String(r.cal_pred).padStart(4)} vs ${String(r.cal_usda).padStart(4)} (${r.cal_err}%)`.padEnd(48) +
      ` | ${r.prot_pred} vs ${r.prot_usda} (${r.prot_err}%)`.padEnd(23) +
      ` | ${r.carb_pred} vs ${r.carb_usda} (${r.carb_err}%)`.padEnd(23) +
      ` | ${r.fat_pred} vs ${r.fat_usda} (${r.fat_err}%)`
    );
  }

  // ============================
  // AGGREGATE METRICS
  // ============================
  const avg = (arr) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : "N/A";
  const median = (arr) => {
    if (!arr.length) return "N/A";
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid].toFixed(2) : ((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2);
  };

  const calMAPE = avg(errors.calories);
  const protMAPE = avg(errors.protein);
  const carbMAPE = avg(errors.carbs);
  const fatMAPE = avg(errors.fats);

  const allErrors = [...errors.calories, ...errors.protein, ...errors.carbs, ...errors.fats];
  const overallMAPE = avg(allErrors);

  console.log("\n" + "=" .repeat(80));
  console.log("  AGGREGATE METRICS (MAPE — Mean Absolute Percentage Error)");
  console.log("=" .repeat(80));
  console.log(`  Calorie MAPE:   ${calMAPE}%  (Median: ${median(errors.calories)}%)`);
  console.log(`  Protein MAPE:   ${protMAPE}%  (Median: ${median(errors.protein)}%)`);
  console.log(`  Carbs MAPE:     ${carbMAPE}%  (Median: ${median(errors.carbs)}%)`);
  console.log(`  Fats MAPE:      ${fatMAPE}%   (Median: ${median(errors.fats)}%)`);
  console.log(`  ─────────────────────────────────`);
  console.log(`  ★ OVERALL MAPE: ${overallMAPE}%`);
  console.log(`  ★ Test Cases:   ${results.length} / ${TEST_CASES.length}`);
  console.log("=" .repeat(80));

  // For paper citation
  console.log("\n📝 FOR YOUR PAPER:");
  console.log(`   \"The system achieved an overall nutrition estimation MAPE of ${overallMAPE}%`);
  console.log(`    across ${results.length} food items, with calorie estimation MAPE of ${calMAPE}%,`);
  console.log(`    protein MAPE of ${protMAPE}%, carbohydrate MAPE of ${carbMAPE}%,`);
  console.log(`    and fat MAPE of ${fatMAPE}%, evaluated against USDA FoodData Central`);
  console.log(`    and Indian Food Composition Table (NIN, Hyderabad) reference values.\"`);
}

runEvaluation().catch(console.error);
