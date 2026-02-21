import os
import re
import json


# ✅ LOAD ENV FIRST (CRITICAL FIX)
from dotenv import load_dotenv
load_dotenv()

from groq import Groq
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import List

# ✅ Groq client AFTER env is loaded
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# -----------------------
# App setup
# -----------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------
# Load dataset
# -----------------------
# -----------------------
# Load dataset
# -----------------------
BASE_DIR = os.path.dirname(__file__)
JSON_PATH = os.path.join(BASE_DIR, "data", "ingredients_db.json")

print(f"Loading database from {JSON_PATH}...")

with open(JSON_PATH, "r", encoding="utf-8") as f:
    INGREDIENT_DB = json.load(f)

# Helper to map risk score to severity string for compatibility
def get_severity(risk):
    if risk >= 80: return "high"
    if risk >= 50: return "medium"
    if risk > 0: return "low"
    return "none"

LOOKUP = {}
for name, data in INGREDIENT_DB.items():
    # Primary name
    LOOKUP[name] = {
        "label": "harmful" if data.get("risk", 0) > 0 else "safe",
        "severity": get_severity(data.get("risk", 0)),
        "risk": data.get("risk", 0),
        "nova": data.get("nova", 1),
        "desc": data.get("desc", ""),
        "source": data.get("source", "Unknown")
    }
    # Aliases
    for alias in data.get("aliases", []):
        if alias and alias not in LOOKUP:
             LOOKUP[alias] = LOOKUP[name]  # Point alias to same data

# -----------------------
# Severity explanations
# -----------------------
SEVERITY_EXPLANATION = {
    "high": "Linked to serious health risks",
    "medium": "May cause issues if consumed frequently",
    "low": "Generally safe in limited quantities",
    "none": "Safe for normal consumption"
}

# -----------------------
# Normalization
# -----------------------
def normalize_ingredient(text: str) -> set:
    text = text.lower()
    tokens = set()

    matches = re.findall(r"(?:ins|e)\s?\d{3,4}[a-z]?", text)
    for m in matches:
        tokens.add(m.replace(" ", ""))

    cleaned = re.sub(r"\(.*?\)", "", text)
    cleaned = re.sub(r"[^a-z\s]", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    if len(cleaned.split()) >= 2:
        tokens.add(cleaned)

    return tokens

# -----------------------
# Request schema
# -----------------------
class IngredientRequest(BaseModel):
    ingredients: list[str]

# -----------------------
# Helper cleaners
# -----------------------
def clean_text(text: str) -> str:
    return re.sub(r"[^a-z0-9]", "", text.lower())

def canonical_key(name: str) -> str:
    return re.sub(r"[^a-z0-9]", "", name.lower())


def rough_split_ingredients(text: str) -> list[str]:
    """
    Deterministic pre-split using visual food-label separators.
    This restores structure BEFORE LLM.
    """
    text = text.replace("•", ",")
    text = re.sub(r"\n+", ",", text)
    text = re.sub(r"\s*,\s*", ",", text)

    parts = [p.strip() for p in text.split(",") if p.strip()]
    return parts


# -----------------------
# Post-processing safety
# -----------------------
def enforce_parentheses_integrity(items):
    fixed = []
    buffer = ""
    open_paren = 0

    for item in items:
        open_paren += item.count("(") - item.count(")")
        if buffer:
            buffer += " " + item
        else:
            buffer = item

        if open_paren == 0:
            fixed.append(buffer.strip())
            buffer = ""

    if buffer:
        fixed.append(buffer.strip())

    return fixed


def extract_json_array(text: str):
    """
    Safely extract the FIRST valid JSON array from LLM output.
    """
    match = re.search(r"\[[\s\S]*?\]", text)
    if not match:
        raise ValueError("No JSON array found in Groq output")
    return match.group(0)
        


# -----------------------
# 20-PHASE CONSUMPTION FREQUENCY ENGINE (OPTIMIZED)
# -----------------------
FREQUENCY_CONFIG = {
    # PHASE 1: Calibrated Weights & Kill Switches
    "weights": { "critical": 2.5, "high": 1.5, "medium": 0.8, "low": 0.3 },
    "kill_switch": {
        "hydrogenated vegetable oil", "potassium bromate", "sodium nitrite",
        "partial hydrogenated oils", "vanaspati"
    },
    # PHASE 2: Adjusted Thresholds
    "thresholds": { "daily_safe": 25, "moderation": 80, "occasional": 150 }
}

def analyze_frequency(harmful_list):
    """
    Phases 3-20: Calculate Toxicity Score & Verdict with Semantic Context
    """
    total_score = 0
    kill_triggered = False
    kill_reason = None
    max_single_risk = 0
    
    # PHASE 3: Iteration Start
    for item in harmful_list:
        risk = item.get("risk", 0)
        name = item.get("ingredient", "").lower()
        
        # PHASE 4: Max Risk Tracking
        if risk > max_single_risk:
            max_single_risk = risk

        # PHASE 5: Kill Switch Check
        if name in FREQUENCY_CONFIG["kill_switch"]:
            kill_triggered = True
            kill_reason = f"Contains {name} (Critical Hazard)"
            
        # PHASE 6: Weight Calculation (Consolidated)
        weight = FREQUENCY_CONFIG["weights"]["low"]
        if risk >= 90: weight = FREQUENCY_CONFIG["weights"]["critical"]
        elif risk >= 70: weight = FREQUENCY_CONFIG["weights"]["high"]
        elif risk >= 40: weight = FREQUENCY_CONFIG["weights"]["medium"]
        
        # PHASE 7: Score Accumulation
        total_score += (risk * weight)

    # PHASE 8: Base Verdict Setup
    verdict = {
        "level": "Daily Safe",
        "color": "green",
        "score": round(total_score, 1),
        "advice": "Safe for regular consumption. Clean ingredients."
    }

    # PHASE 9: Kill Switch Override
    if kill_triggered:
        verdict["level"] = "Avoid"
        verdict["color"] = "red"
        verdict["advice"] = f"⚠️ STOP. {kill_reason}. Strongly advised to avoid."
        return verdict

    # PHASE 10-20: Smart Threshold & Context Checks
    if total_score > FREQUENCY_CONFIG["thresholds"]["occasional"]: 
        # Phase 10: Occasional Logic
        verdict["level"] = "Occasional"
        verdict["color"] = "orange"
        verdict["advice"] = "High additive or sugar load. Limit to once a month."
        
    elif total_score > FREQUENCY_CONFIG["thresholds"]["moderation"]:
        # Phase 11: Moderation Splitting
        if max_single_risk >= 70:
             # Phase 12: High Risk Additive Case
             verdict["level"] = "Moderation"
             verdict["color"] = "yellow"
             verdict["advice"] = "Contains high-risk additives. Limit portions (2-3x/week)."
        else:
             # Phase 13: Cumulative Load Case
             verdict["level"] = "Moderation"
             verdict["color"] = "yellow"
             verdict["advice"] = "Processed ingredients detected. Moderate consumption."
             
    elif total_score > FREQUENCY_CONFIG["thresholds"]["daily_safe"]:
        # Phase 14: Monitor Case
        verdict["level"] = "Good / Monitor"
        verdict["color"] = "blue"
        verdict["advice"] = "Generally okay, but usually implies some processing."

    return verdict

    # PHASE 15-20: Reserved for Future Expansion (Metadata, User Sensitivity, etc.)

# -----------------------
# Prediction endpoint
# -----------------------
@app.post("/predict")
def predict(req: IngredientRequest):
    results = []
    seen_harmful = set()

    # PHASE 28: Extraction Loop
    for ing in req.ingredients:
        tokens = normalize_ingredient(ing)

        for token in tokens:
            token_clean = clean_text(token)

            for csv_ing, row in LOOKUP.items():
                csv_clean = clean_text(csv_ing)

                if token_clean in csv_clean or csv_clean in token_clean:
                    if csv_ing not in seen_harmful:
                        results.append({
                            "ingredient": csv_ing,
                            "label": row["label"],
                            "severity": row["severity"],
                            "risk": row.get("risk", 0),
                            "nova": row.get("nova", 1),
                            "confidence": 1.0,
                            "source": row["source"],
                            "reason": row["desc"] if row.get("desc") else SEVERITY_EXPLANATION.get(
                                row["severity"],
                                "May impact health if consumed excessively"
                            )
                        })
                        seen_harmful.add(csv_ing)
    
    # PHASE 19: Run Frequency Analysis
    freq_data = analyze_frequency(results)

    # PHASE 20: Final Response Assembly
    return {
        "results": results,
        "frequency_analysis": freq_data
    }

# -----------------------
# Groq ingredient parser
# -----------------------
class ParseRequest(BaseModel):
    ocrText: str

class ParseResponse(BaseModel):
    ingredients: List[str]


@app.post("/parse-ingredients", response_model=ParseResponse)
def parse_ingredients(req: ParseRequest):
    rough_parts = rough_split_ingredients(req.ocrText)

    prompt = f"""
SYSTEM: You are an Advanced OCR Cleaning & Structuring Engine for Food Labels.
YOUR TASK: Convert raw, potentially broken OCR text into a perfectly structured JSON array of ingredient strings.

UNIVERSAL PARSING LOGIC:

1.  **The "Comma Splitting" Rule (ABSOLUTE PRIORITY):**
    * If a comma (`,`) appears outside of parentheses, you MUST split there.
    * **Anti-Merge:** "Corn, Vegetable Oil" -> ["corn", "vegetable oil"]. Never merge items separated by a comma.

2.  **The "Parenthesis Container" Rule:**
    * Everything inside parentheses `(...)` belongs to the ingredient before it.
    * *Example:* "Vegetable Oil (corn, canola)" -> Keep as ONE string.

3.  **The "Compound Protection" Rule (Fixes 'Corn Starch'):**
    * **NEVER** split before "Dependent Words" that describe the previous ingredient.
    * **Protected Words:** "Starch", "Powder", "Acid", "Solids", "Glutamate", "Extract", "Cheese".
    * *Example:* "Corn Starch" -> Keep together.
    * *Example:* "Tomato Powder" -> Keep together.
    * *Example:* "Citric Acid" -> Keep together.

4.  **The "Hidden Boundary" Rule (Trigger Splits):**
    * **ONLY** split before "Independent Words" if punctuation is missing.
    * **Trigger Words:** "Salt", "Sugar", "Oil" (if not preceded by 'Vegetable'), "Dextrose", "Water".
    * *Example:* "Starch Salt" -> Split -> ["...starch", "salt"].
    * *Example:* "Flour Sugar" -> Split -> ["...flour", "sugar"].

5.  **Standardization:**
    * Output strictly in **lowercase**.
    * Fix typos ("chiili" -> "chilli").
    * Remove standalone "and" (e.g., "Disodium Inosinate and Disodium Guanylate" -> keep as one line if it's a pair, or split if distinct).

FEW-SHOT TRAINING EXAMPLES:

Example 1 (Compound Logic):
Input: "Corn Starch Tomato Powder Salt Sugar"
Output: ["corn starch", "tomato powder", "salt", "sugar"]

Example 2 (Your Specific Issue - No Comma):
Input: "corn vegetable oil (corn canola and/or sunflower oil) salt"
Output: ["corn", "vegetable oil (corn canola and/or sunflower oil)", "salt"]

Example 3 (Broken OCR Numbers):
Input: "gram pulse flour (50 semolina (10%)"
Output: ["gram pulse flour (50%)", "semolina (10%)"]

CURRENT RAW INPUT TO PROCESS:
\"\"\"
{req.ocrText}
\"\"\"

OUTPUT (JSON ARRAY ONLY):
"""




    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": "You are a precise data extraction engine."},
            {"role": "user", "content": prompt}
        ],
        temperature=0
    )

    content = completion.choices[0].message.content.strip()

   
    json_text = extract_json_array(content)
    ingredients = json.loads(json_text)
    ingredients = enforce_parentheses_integrity(ingredients)

    return {
        "ingredients": ingredients
    }

# -----------------------
# Start Server on Port 8002
# -----------------------
if __name__ == "__main__":
    import uvicorn
    # This ensures it doesn't conflict with your ResNet-50 service
    uvicorn.run(app, host="127.0.0.1", port=8002)