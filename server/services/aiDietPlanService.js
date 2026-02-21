import Groq from "groq-sdk";
import { buildDietPlanPrompt } from "../utils/dietPlanPrompt.js";

function getGroqClient() {
  const key = process.env.GROQ_API_KEY_DIETPLAN || process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error("GROQ_API_KEY_DIETPLAN missing. Ensure .env is loaded.");
  }
  return new Groq({ apiKey: key });
}

/**
 * ✅ Safe JSON extractor
 */
function safeJsonParse(text = "") {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;

  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch (err) {
    console.error("JSON Parse Error:", err.message);
    return null;
  }
}

/**
 * ✅ MAIN AI ENTRY
 */
export async function generateDietPlanWithAI({ profile, todayStatus }) {
  console.log(
    "🚀 AI Triggered | Remaining Calories:",
    todayStatus?.remaining?.calories,
    "| Meal Slots:",
    profile?.mealSlots
  );

  const groq = getGroqClient();

  // ✅ Dynamic prompt (mealSlots-aware)
  const prompt = buildDietPlanPrompt({ profile, todayStatus });

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a Clinical Nutritionist API. Return ONLY valid JSON. No markdown, no explanations, no <think> blocks.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 1500,
    });

    const text = completion?.choices?.[0]?.message?.content?.trim() || "";

    if (text.includes("<think>")) {
      throw new Error("AI returned reasoning block (<think>)");
    }

    const parsed = safeJsonParse(text);
    if (!parsed) throw new Error("AI response could not be parsed as JSON.");

    // ✅ HARD GUARD: trim extra meals if AI over-generates
    if (
      Array.isArray(parsed.meals) &&
      Array.isArray(profile.mealSlots) &&
      parsed.meals.length > profile.mealSlots.length
    ) {
      parsed.meals = parsed.meals.slice(0, profile.mealSlots.length);
    }

    return parsed;
  } catch (err) {
    console.error("Groq AI Failure:", err.message);
    throw err;
  }
}
