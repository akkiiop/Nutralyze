import "dotenv/config";
import multer from "multer";
import sharp from "sharp";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const upload = multer();

/**
 * ==========================
 * ✅ FREE-TIER SAFETY CONFIG
 * ==========================
 */
const COOLDOWN_MS = 5000;          // 1 scan / 5 sec per user
const USER_DAILY_LIMIT = 20;       // scans/day per IP
const GLOBAL_DAILY_LIMIT = 500;    // scans/day overall

const usageStore = {
  perUser: new Map(), // ip -> { dateKey, count, lastScanAt }
  global: { dateKey: "", count: 0 },
};

function getDateKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function getClientIp(req) {
  // for deployment: app.set("trust proxy", 1)
  const xff = req.headers["x-forwarded-for"];
  if (xff) return xff.split(",")[0].trim();
  return req.ip || req.connection?.remoteAddress || "unknown";
}

function quotaGuard(req, res) {
  const ip = getClientIp(req);
  const dateKey = getDateKey();
  const now = Date.now();

  // reset global daily
  if (usageStore.global.dateKey !== dateKey) {
    usageStore.global.dateKey = dateKey;
    usageStore.global.count = 0;
  }

  // reset user daily
  const user = usageStore.perUser.get(ip) || { dateKey, count: 0, lastScanAt: 0 };
  if (user.dateKey !== dateKey) {
    user.dateKey = dateKey;
    user.count = 0;
    user.lastScanAt = 0;
  }

  // cooldown
  const diff = now - user.lastScanAt;
  if (diff < COOLDOWN_MS) {
    const waitSec = Math.ceil((COOLDOWN_MS - diff) / 1000);
    res.status(429).json({
      success: false,
      message: `Too many scans. Please wait ${waitSec}s and try again.`,
      type: "cooldown",
    });
    return true;
  }

  // per-user daily
  if (user.count >= USER_DAILY_LIMIT) {
    res.status(429).json({
      success: false,
      message: `Daily scan limit reached (${USER_DAILY_LIMIT}/day). Try tomorrow.`,
      type: "user_daily_limit",
    });
    return true;
  }

  // global daily
  if (usageStore.global.count >= GLOBAL_DAILY_LIMIT) {
    res.status(429).json({
      success: false,
      message: "Server daily quota reached. Try tomorrow.",
      type: "global_daily_limit",
    });
    return true;
  }

  // accept scan
  user.lastScanAt = now;
  user.count += 1;
  usageStore.perUser.set(ip, user);

  usageStore.global.count += 1;

  return false;
}

/**
 * Retry helper (handles Groq 429 / temporary failures)
 */
async function retry(fn, retries = 2, delayMs = 1200) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = err?.status || err?.response?.status;

      const isRetryable = status === 429 || status === 500 || status === 502 || status === 503;
      if (!isRetryable || i === retries) break;

      await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw lastErr;
}

/**
 * ✅ Nutrition estimation using Groq TEXT model
 * IMPORTANT: This returns nutrition for the detected serving (NOT per 100g)
 */
async function estimateNutritionServingWithGroq(identity) {
  const name = identity?.name || "Unknown Food";
  const unit = identity?.unit || "serving";
  const quantity = Number(identity?.quantity ?? 1);
  const weight_est = Number(identity?.weight_est ?? 0);

  const prompt = `
You are a professional Nutritionist.
Your job: estimate nutrition for the EXACT detected serving size, using common real-world values.

You will be given a detected food identity and serving descriptor.
Return ONLY valid JSON in the exact structure below.

Identity:
- name: "${name}"
- unit: "${unit}"
- quantity: ${quantity}
- weight_est (grams): ${weight_est}
- label_readings: ${JSON.stringify(identity.label_readings || {})}

Serving rule:
- If label_readings contains VALID NON-ZERO data (e.g. calories_100g > 10), USE IT as the base truth.
- IF label_readings contains 0s, IGNORE IT COMPLETELY and use "Category Baselines" below.
- Calculate serving nutrition = (calories_100g * weight_est) / 100.
  Example: If 540 kcal/100g and weight is 30g -> Return 162 kcal (NOT 540).
- If unit is "piece" or "egg" or other discrete unit, calculate nutrition for that many units.
- If unit is "bowl" or "plate" or "cup", calculate nutrition for that quantity of bowls/plates/cups.
- Use weight_est as supporting info, but do NOT return per 100g numbers.

Return ONLY JSON:
{
  "nutrition": { "calories": 0, "protein": 0, "carbs": 0, "fats": 0, "sugar": 0,
    "fiber": 0},
  "scores": { "nutriScore": "A|B|C|D|E" }
}
  Rules:
- Sugar must reflect total sugars for the detected serving.
- Fiber must reflect dietary fiber for the detected serving.
- If unsure, estimate conservatively (never omit fields).

Constraints:
- Keep values realistic (no extreme values).
- Numbers can be decimals (1 decimal).
- If unsure, return best estimate and choose nutriScore conservatively.
- NEVER return 0 for straight macros (Protein/Carbs/Fat) unless the food is Water, Black Coffee/Tea, or truly zero-calorie.
- For cooked meats (Chicken/Lamb), Fat is NEVER 0 (usually 1-5g minimum).
- For sweets (Gulab Jamun/Desserts), Carbs/Sugar is NEVER 0.
- If unsure, use standard USDA/Indian Food Composition Table references.

Category Baselines (Use these ranges if Label Data is missing):
- Potato Chips / Wafers / Fried Snacks: 530 - 580 kcal/100g (NEVER below 500 for chips).
- Namkeen / Bhujia / Sev: 550 - 620 kcal/100g.
- Biscuits / Cookies: 450 - 520 kcal/100g.
- Chocolates: 530 - 570 kcal/100g.
- If the brand is known (e.g. Lays, Haldiram, Balaji, Priniti), match their typical values.
- Priniti/Local Chips are usually higher calorie (~550-590 kcal) due to oil content.
`;

  // ✅ best accuracy model
  try {
    const completion70B = await retry(() =>
      groq.chat.completions.create({
        model: "llama-3.1-70b-versatile",
        temperature: 0.1,
        max_tokens: 250,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are a nutrition estimation engine. Return ONLY JSON." },
          { role: "user", content: prompt },
        ],
      })
    );

    const raw = completion70B?.choices?.[0]?.message?.content || "{}";
    return JSON.parse(raw);
  } catch (err) {
    // ✅ fallback fast model
    const completion8B = await retry(() =>
      groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        temperature: 0.1,
        max_tokens: 250,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are a nutrition estimation engine. Return ONLY JSON." },
          { role: "user", content: prompt },
        ],
      })
    );

    const raw = completion8B?.choices?.[0]?.message?.content || "{}";
    return JSON.parse(raw);
  }
}


// ✅ ADD THIS (nutrition normalization helper)
function normalizeNutrition(nutrition = {}) {
  return {
    calories: Number(nutrition.calories || 0),
    protein: Number(nutrition.protein || 0),
    carbs: Number(nutrition.carbs || 0),
    fats: Number(nutrition.fats || 0),

    // always present for consistency
    sugar: Number(nutrition.sugar || 0),
    fiber: Number(nutrition.fiber || 0),
  };
}

// ✅ SAFETY FALLBACK: If AI returns 0s for edible food, apply category density defaults
function applySafetyDefaults(aiResponse) {
  const nut = aiResponse.nutrition;
  const identity = aiResponse.identity;

  // validation: if !edible OR calories very low OR (calories > 10 but macros are all 0)
  if (!identity || !identity.isEdible) return aiResponse;

  const hasMacros = (nut.protein > 0 || nut.carbs > 0 || nut.fats > 0);

  // validation: Only apply defaults if nutrition is MISSING or strictly invalid
  if (nut.calories > 10 && hasMacros) return aiResponse;

  console.log("⚠️ Zero nutrition detected for edible food. Applying Safety Defaults...");

  const weight = identity.weight_est || 100;
  const name = (identity.name || "").toLowerCase();
  const cat = (identity.category || "").toLowerCase();

  // Density map (kcal per gram)
  let density = 2.0; // default (mixed meal)

  if (cat.includes('snack') || name.includes('chip') || name.includes('fry') || name.includes('sev') || name.includes('bhujia')) {
    density = 5.5; // High calorie density for fried snacks
  } else if (cat.includes('fruit')) {
    density = 0.6;
  } else if (cat.includes('vegetable')) {
    density = 0.3;
  } else if (cat.includes('sweet') || name.includes('chocolate') || name.includes('cake')) {
    density = 4.5;
  }

  // Auto-fill calories
  nut.calories = Math.round(weight * density);

  // Auto-fill macros (rough ratios)
  nut.fats = Math.round((nut.calories * 0.45) / 9); // 45% fat for unknown high-cal foods
  nut.carbs = Math.round((nut.calories * 0.45) / 4);
  nut.protein = Math.round((nut.calories * 0.10) / 4);

  aiResponse.nutrition = nut;
  aiResponse.scores = { nutriScore: "D" }; // Conservative score for unknown food

  return aiResponse;
}


export const detectFood = [
  upload.single("image"),

  async (req, res) => {
    try {
      // ✅ quota safety
      if (quotaGuard(req, res)) return;

      if (!req.file) {
        return res.status(400).json({ success: false, message: "No image uploaded" });
      }

      // ✅ Resize + compress (token saver + faster vision inference)
      const optimizedBuffer = await sharp(req.file.buffer)
        .resize(512, 512, { fit: "inside" })
        .jpeg({ quality: 70 })
        .toBuffer();

      const base64Image = optimizedBuffer.toString("base64");

      /**
       * ✅ Step 1: Groq Vision call (Dual-track detection + Smart Unit descriptor)
       * - MUST return unit, quantity, weight_est
       * - NO nutrition here
       */
      const chatCompletion = await retry(() =>
        groq.chat.completions.create({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          temperature: 0.2,
          max_tokens: 450,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `You are a professional Vision Expert + Food Portion Estimator.
YOUR PRIMARY JOB IS TO FIRST VALIDATE IF THE IMAGE CONTAINS REAL FOOD.

1. DETECTION & VALIDATION:
- If the image contains ONLY non-food objects (pen, laptop, person, furniture, etc), set "isEdible": false and "name": "Non-food object".
- If the image contains food, set "isEdible": true.

2. QUANTIFICATION (Only if isEdible is true):
- Discrete foods -> unit: "piece" (or "egg") and quantity as a whole count
- Continuous foods -> unit: "bowl" or "plate" or "cup" and quantity as 1, 1.5, 2 etc.
- Also estimate weight_est in grams for the whole detected serving.

Return ONLY valid JSON.`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analyze this image and return ONLY a JSON object with this exact structure:
{
  "identity": {
    "name": "Specific food name (or 'Non-food detected' if false)",
    "category": "fruit|vegetable|grain|protein|dairy|snack|dessert|beverage|mixed_dish|non_food",
    "isEdible": true|false,
    "confidence": 95,

    "unit": "piece|egg|bowl|plate|cup|serving",
    "quantity": 1,
    "weight_est": 0,
    "label_readings": {
        "calories_100g": 0,
        "protein_100g": 0
    }
  }
}

Rules:
- CRITICAL: If this is NOT food (e.g. a face, a car, a pen, a phone), set "isEdible": false immediately.
- For packaged foods (chips/biscuits): LOOK FOR "NET WEIGHT" TEXT ON PACKET.
- ALSO LOOK FOR "NUTRITION INFORMATION" TABLE. Extract "Energy" or "Calories" per 100g value if visible (e.g. "540 kcal").
- If you see explicit numbers like "594 kcal", USE THEM. DO NOT GUESS.
- IF TEXT NOT VISIBLE: Default to SINGLE SERVING size (e.g. 30g-50g for small chips packet) unless it clearly looks like a huge family pack.
- DO NOT hallucinate large weights like 500g for a standard small packet.
- For discrete foods (apple/banana/egg/samosa), use unit "piece" or "egg" and integer quantity.
- For continuous foods (rice/dal/sabji/salad/gravies), use unit like "bowl"/"plate"/"cup".
- quantity can be 0.5, 1, 1.5, 2 etc for bowl/cup/plate.
- weight_est is estimated total grams for the detected serving.`,
                },
                {
                  type: "image_url",
                  image_url: { url: `data:image/jpeg;base64,${base64Image}` },
                },
              ],
            },
          ],
        })
      );

      const raw = chatCompletion?.choices?.[0]?.message?.content || "{}";
      const aiResponse = JSON.parse(raw);

      // ✅ STRICT VALIDATION: Reject non-food
      if (aiResponse?.identity?.isEdible === false) {
        return res.status(422).json({
          success: false,
          message: "No food detected. Please ensure you are scanning a valid food item.",
          type: "validation_error"
        });
      }

      // reject invalid structure
      if (aiResponse?.error || !aiResponse?.identity?.name) {
        return res.status(422).json({
          success: false,
          message: "Unclear image. Please try again with better lighting.",
        });
      }

      // ✅ Ensure defaults exist (prevents frontend crash)
      aiResponse.identity.unit = aiResponse.identity.unit || "serving";
      aiResponse.identity.quantity = Number(aiResponse.identity.quantity ?? 1);
      aiResponse.identity.weight_est = Number(aiResponse.identity.weight_est ?? 0);

      /**
       * ✅ Step 2: Text model nutrition estimation for the detected serving
       * This returns nutrition for that serving size (unit + quantity)
       */
      const nutritionEstimation = await estimateNutritionServingWithGroq(aiResponse.identity);

      // ✅ Merge results back into original response structure
      aiResponse.nutrition = normalizeNutrition(
        nutritionEstimation?.nutrition
      );


      aiResponse.scores = nutritionEstimation?.scores || {
        nutriScore: "C",
      };

      // ✅ Apply Safety Nets (Prevent 0 kcal bugs)
      const finalResponse = applySafetyDefaults(aiResponse);

      return res.json({
        success: true,
        product: finalResponse,
      });
    } catch (error) {
      const status = error?.status || error?.response?.status;
      console.error("GROQ ERROR:", status || "", error?.message || error);

      if (status === 429) {
        return res.status(429).json({
          success: false,
          message: "Rate limit reached. Please retry in a few seconds.",
          type: "provider_rate_limit",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Food detection failed.",
      });
    }
  },
];
