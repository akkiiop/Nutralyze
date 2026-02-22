import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the database
const JSON_PATH = path.join(__dirname, "../ml/data/ingredients_db.json");
let INGREDIENT_DB = {};
let LOOKUP = {};

try {
    const data = fs.readFileSync(JSON_PATH, "utf8");
    INGREDIENT_DB = JSON.parse(data);

    // Build the lookup table with aliases (matching Python logic)
    Object.entries(INGREDIENT_DB).forEach(([name, data]) => {
        const entry = {
            ingredient: name,
            label: data.risk > 0 ? "harmful" : "safe",
            severity: getSeverity(data.risk),
            risk: data.risk || 0,
            nova: data.nova || 1,
            desc: data.desc || "",
            source: data.source || "Unknown",
        };

        LOOKUP[cleanText(name)] = entry;

        if (data.aliases) {
            data.aliases.forEach(alias => {
                if (alias) LOOKUP[cleanText(alias)] = entry;
            });
        }
    });
    console.log(`✅ Loaded ${Object.keys(LOOKUP).length} ingredient mapping entries`);
} catch (err) {
    console.error("❌ Failed to load ingredients_db.json", err.message);
}

function getSeverity(risk) {
    if (risk >= 80) return "high";
    if (risk >= 50) return "medium";
    if (risk > 0) return "low";
    return "none";
}

function cleanText(text) {
    return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeIngredient(text) {
    const t = text.toLowerCase();
    const tokens = new Set();

    // Match e-codes like e129 or ins 471
    const matches = t.match(/(?:ins|e)\s?\d{3,4}[a-z]?/g);
    if (matches) {
        matches.forEach(m => tokens.add(m.replace(/\s+/g, "")));
    }

    // Clean parentheses and special chars
    let cleaned = t.replace(/\(.*?\)/g, "");
    cleaned = cleaned.replace(/[^a-z\s]/g, " ");
    cleaned = cleaned.replace(/\s+/g, " ").trim();

    if (cleaned.split(" ").length >= 1) {
        tokens.add(cleaned);
    }

    return tokens;
}

// Ported from Python: 20-PHASE CONSUMPTION FREQUENCY ENGINE
const FREQUENCY_CONFIG = {
    weights: { critical: 2.5, high: 1.5, medium: 0.8, low: 0.3 },
    kill_switch: new Set([
        "hydrogenated vegetable oil", "potassium bromate", "sodium nitrite",
        "partial hydrogenated oils", "vanaspati"
    ]),
    thresholds: { daily_safe: 25, moderation: 80, occasional: 150 }
};

export const analyzeFrequency = (harmfulList) => {
    let totalScore = 0;
    let killTriggered = false;
    let killReason = null;
    let maxSingleRisk = 0;

    harmfulList.forEach(item => {
        const risk = item.risk || 0;
        const name = item.ingredient.toLowerCase();

        if (risk > maxSingleRisk) maxSingleRisk = risk;

        if (FREQUENCY_CONFIG.kill_switch.has(name)) {
            killTriggered = true;
            killReason = `Contains ${name} (Critical Hazard)`;
        }

        let weight = FREQUENCY_CONFIG.weights.low;
        if (risk >= 90) weight = FREQUENCY_CONFIG.weights.critical;
        else if (risk >= 70) weight = FREQUENCY_CONFIG.weights.high;
        else if (risk >= 40) weight = FREQUENCY_CONFIG.weights.medium;

        totalScore += (risk * weight);
    });

    const verdict = {
        level: "Daily Safe",
        color: "green",
        score: Math.round(totalScore * 10) / 10,
        advice: "Safe for regular consumption. Clean ingredients."
    };

    if (killTriggered) {
        verdict.level = "Avoid";
        verdict.color = "red";
        verdict.advice = `⚠️ STOP. ${killReason}. Strongly advised to avoid.`;
        return verdict;
    }

    if (totalScore > FREQUENCY_CONFIG.thresholds.occasional) {
        verdict.level = "Occasional";
        verdict.color = "orange";
        verdict.advice = "High additive or sugar load. Limit to once a month.";
    } else if (totalScore > FREQUENCY_CONFIG.thresholds.moderation) {
        verdict.level = "Moderation";
        verdict.color = "yellow";
        verdict.advice = maxSingleRisk >= 70
            ? "Contains high-risk additives. Limit portions (2-3x/week)."
            : "Processed ingredients detected. Moderate consumption.";
    } else if (totalScore > FREQUENCY_CONFIG.thresholds.daily_safe) {
        verdict.level = "Good / Monitor";
        verdict.color = "blue";
        verdict.advice = "Generally okay, but usually implies some processing.";
    }

    return verdict;
};

export const predictIngredients = (ingredients) => {
    const results = [];
    const seen = new Set();

    ingredients.forEach(ing => {
        const tokens = normalizeIngredient(ing);

        tokens.forEach(token => {
            const tokenClean = cleanText(token);

            if (LOOKUP[tokenClean] && !seen.has(LOOKUP[tokenClean].ingredient)) {
                const baseInfo = LOOKUP[tokenClean];

                // Refine Label based on Risk for Frontend categorization
                let refinedLabel = baseInfo.label;
                if (baseInfo.risk >= 70) refinedLabel = "harmful";
                else if (baseInfo.risk >= 40) refinedLabel = "warning";
                else refinedLabel = "safe";

                results.push({
                    ...baseInfo,
                    label: refinedLabel,
                    confidence: 1.0,
                    reason: baseInfo.desc || "May impact health if consumed excessively"
                });
                seen.add(baseInfo.ingredient);
            }
        });
    });

    const frequency = analyzeFrequency(results);

    return {
        results,
        frequency_analysis: frequency
    };
};
