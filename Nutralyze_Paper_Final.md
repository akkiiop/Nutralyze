# Nutralyze: A Multimodal LLM-Driven System for Automated Nutrition Analysis, Ingredient Risk Detection, and Personalized Dietary Guidance

**Dipak J. Baviskar, Pranav B. Ippalpelli, Akshay B. Kawade, Pravin B. Wadekar, Narayan B. Vikhe, Madhavi S. Kale**

Department of Computer Engineering, Dr. Vithalrao Vikhe Patil College of Engineering, Ahilyanagar, India

---

## ABSTRACT

Automated food analysis systems are increasingly relevant for enabling informed dietary decisions and supporting nutrition-aware lifestyles. However, existing systems often require extensive manual input, single-modality processing, or narrowly scoped food databases, limiting their real-world applicability. In this work, we present Nutralyze, a full-stack multimodal nutrition analysis platform that integrates Large Language Model (LLM)-based food recognition with database-driven ingredient risk assessment and AI-powered dietary guidance. The system employs a dual-stage LLM pipeline for food image analysis: a multimodal vision model (Llama-4-Scout) identifies food items and estimates portion sizes from photographs, followed by a text-based LLM (Llama-3.1-70B) that estimates macronutrient composition for the detected serving. For packaged food products, Nutralyze combines barcode-based product retrieval from the Open Food Facts database with Optical Character Recognition (OCR) using Tesseract, enhanced by LLM-based text normalization for robust ingredient extraction. Ingredient safety evaluation is performed through a curated risk-scored database of food additives cross-referenced with regulatory standards (FSSAI, FDA, EU), complemented by a multi-phase frequency analysis engine that computes consumption advisories. Additionally, the platform generates personalized diet plans using context-aware LLM prompting that incorporates user health profiles, dietary restrictions, and real-time nutritional intake tracking. Nutralyze is deployed as a responsive web application built with React and Node.js, featuring real-time meal logging, progress tracking, and a multilingual AI nutrition chatbot supporting English, Hindi, and Marathi. Empirical evaluation of the system demonstrates a caloric estimation error (MAPE) of 10.07% and an OCR-based ingredient parsing accuracy (F1-score) of 95.98%, showing notable functional improvements in flexibility and accuracy over traditional CNN baseline systems.

**Keywords** — Large language models, multimodal food recognition, ingredient risk analysis, dietary guidance, OCR, nutrition assessment, food safety, personalized health.

---

## I. INTRODUCTION

Nutrition analysis plays a critical role in modern preventive healthcare. Dietary patterns are directly linked to the onset and management of chronic conditions including obesity, type-2 diabetes, and cardiovascular disease. Clinical studies have demonstrated that structured nutritional interventions significantly improve metabolic health outcomes [1]. Despite this evidence, the process of manual food tracking remains tedious, error-prone, and inaccessible to most users, creating a clear need for intelligent, automated systems.

Recent advances in computer vision and natural language processing have enabled increasingly capable food recognition and analysis systems [2]. Deep learning approaches, particularly Convolutional Neural Networks (CNNs), have been widely applied to food image classification tasks [3], [5]. Simultaneously, transformer architectures have demonstrated superior performance in both visual and textual understanding tasks [7], [10]. The emergence of Large Language Models (LLMs) with multimodal capabilities — able to process both images and text within a single inference call — represents a paradigm shift in how food analysis systems can be designed.

However, most existing systems focus on a single aspect of food analysis, such as calorie estimation from images or ingredient extraction from labels, without integrating these modalities into a cohesive, user-facing platform. Furthermore, ingredient safety assessment — identifying harmful additives, preservatives, and processing agents in packaged foods — remains largely manual and dependent on consumer literacy.

This paper presents Nutralyze, a comprehensive multimodal platform that addresses these limitations through four integrated modules: (1) LLM-based food image recognition and nutrition estimation, (2) OCR-driven ingredient extraction with database-driven risk scoring, (3) dietary progress tracking with rule-based health coaching, and (4) AI-powered personalized diet plan generation. The system is deployed as a production-ready web application capable of real-time analysis.

---

## II. RELATED WORK

The automation of food analysis has significantly advanced through contributions in food image classification, nutrient estimation, and multi-sensory data integration. Multi-scale CNN architectures have improved the ability to classify diverse food categories across varied visual conditions [3], [15]. Inception-based architectures and other parallel-processing CNN designs continue to serve as effective feature extractors for food image analysis [5]. Systems such as Swin-Nutrition have demonstrated how transformer-based architectures can enhance nutrient estimation from food images [7], [9]. The integration of depth sensors and geometric data has further improved portion size and caloric estimation beyond conventional RGB data [6], [8].

Specialized datasets including NutritionVerse-Synth and MetaFood3D have enabled training of food recognition models with greater geometric and nutritional accuracy [11], [12]. Attention-based mechanisms such as CBAM have improved feature differentiation in complex food scenes [16], while improvements in object detection architectures have addressed challenges in dense food environments [17].

More recently, Large Language Models with vision capabilities have emerged as a promising alternative to task-specific deep learning pipelines. Models such as GPT-4V, Llama-4-Scout, and Gemini can perform food recognition, portion estimation, and nutritional analysis within a single inference call, significantly simplifying system architecture while maintaining competitive accuracy. However, the application of multimodal LLMs specifically for end-to-end nutrition analysis systems remains relatively underexplored in published literature.

This work contributes to filling this gap by presenting a practical, deployed system that leverages multimodal LLMs as the primary analysis engine, combined with structured databases for ingredient safety verification and rule-based dietary coaching.

---

## III. PROPOSED SYSTEM ARCHITECTURE

The Nutralyze system follows a modular, service-oriented architecture consisting of four primary functional modules integrated within a unified web application. The system comprises three backend services: a Node.js API server (primary backend), a Node.js AI model service, and a Python FastAPI microservice for ingredient analysis. The frontend is built with React.js (Vite) and communicates with backend services via RESTful APIs.

The overall workflow is organized into three major phases:
1. **Data Acquisition** — Image capture/upload, barcode scanning, OCR extraction
2. **AI-Driven Analysis** — LLM-based food recognition, nutrition estimation, ingredient risk scoring
3. **Personalized Guidance** — Diet plan generation, progress tracking, health coaching

![System Architecture](Nutralyze_System_Architecture.png)
*Fig. 1: System architecture flowchart illustrating the multimodal LLM data pipelines and integrated modules.*

### A. Module 1: Food Recognition and Nutrition Estimation

The food recognition module employs a **dual-stage LLM pipeline** for identifying food items and estimating their nutritional composition from user-uploaded photographs.

**Stage 1 — Visual Food Identification:**
When a user uploads or captures a food image, it undergoes preprocessing including resizing to 512×512 pixels and JPEG compression (quality 70) using the Sharp image processing library. This optimized image is encoded as a Base64 string and submitted to the **Groq Vision API** using the `meta-llama/llama-4-scout-17b-16e-instruct` model — a multimodal large language model capable of simultaneous image and text understanding.

The vision model receives a structured system prompt defining its role as a food detection and portion estimation agent. The model returns a JSON object containing:
- Food identity (name, category, edibility status)
- Portion descriptor (unit type: piece/bowl/plate/cup, quantity, estimated weight in grams)
- Label readings (if visible on packaged foods: calories per 100g, protein per 100g)
- Confidence score

A strict validation layer rejects non-food items (confidence check on `isEdible` field) and malformed responses before proceeding.

**Stage 2 — Nutrition Estimation:**
The identified food identity, portion descriptor, and any visible label readings are then passed to a **text-based LLM** (`llama-3.1-70b-versatile` via Groq API) with a specialized nutrition estimation prompt. This prompt includes:
- Serving size calculation rules (per-serving, not per-100g)
- Category-specific caloric density baselines (e.g., fried snacks: 530–580 kcal/100g)
- Brand-awareness heuristics for common Indian packaged foods
- Safety constraints (non-zero macros for edible items)

The model returns structured JSON containing estimated calories, protein, carbohydrates, fats, sugar, fiber, and a Nutri-Score grade (A through E).

**Mathematical Formulation (LLM Inference & Fallback):**
The underlying Llama model processes the multimodal inputs using standard transformer self-attention mechanisms, mathematically expressed as:

$$ \text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V $$

where $Q, K$, and $V$ represent the query, key, and value matrices respectively, enabling the model to learn complex contextual relationships between visual food features and nutritional properties.

**Safety Fallback Layer:**
A programmatic safety net detects zero-nutrition responses for confirmed edible foods and applies category-based density defaults. The estimated caloric energy ($E_{kcal}$) is calculated as:

$$ E_{kcal} = W_{est} \times \rho_{category} $$

where $W_{est}$ is the estimated weight in grams, and $\rho_{category}$ represents the assigned caloric density coefficient (e.g., $5.5$ kcal/g for fried snacks, $0.6$ kcal/g for fruits).

A model fallback mechanism is also implemented: if the primary 70B model fails (e.g., due to rate limiting), the system automatically retries with the `llama-3.1-8b-instant` model.

### B. Module 2: Ingredient Safety Analysis

The ingredient safety module evaluates packaged food products through a multi-tier analysis pipeline combining barcode-based data retrieval, OCR text extraction, and database-driven risk scoring.

**Tier 1 — Product Data Retrieval:**
When a user scans a barcode (using the Html5QrcodeScanner library), the system queries the **Open Food Facts API** (`https://world.openfoodfacts.org/api/v0/product/{barcode}.json`) to retrieve product metadata, including product name, brand, ingredient list, nutritional values per 100g, serving size, and Nutri-Score grade. If the product is not found in Open Food Facts, the system falls back to an AI-based estimation using the Gemini 1.5 Flash model.

**Tier 2 — OCR Ingredient Extraction:**
When ingredient data is not available from the database, the user can photograph the ingredient label. **Tesseract.js** (an open-source OCR engine) extracts raw text from the label image using the English language pack (`eng.traineddata`). The raw OCR output undergoes LLM-based post-processing using one of two models:
- **Gemini 1.5 Flash** (in the AI model service) for structured ingredient parsing
- **Groq Llama-3.1-8b-instant** (in the Python microservice) with a detailed prompt implementing five parsing rules:
  1. Comma splitting rule (split at commas outside parentheses)
  2. Parenthesis container rule (keep compound ingredients together)
  3. Compound protection rule (protect terms like "corn starch", "citric acid")
  4. Hidden boundary rule (detect implicit splits between standalone items)
  5. Standardization (lowercase, typo correction, noise removal)

**Tier 3 — Risk Database Matching:**
Each extracted ingredient is normalized (lowercased, special characters removed, E-number codes extracted) and matched against a curated **ingredient risk database** (`ingredients_db.json`) containing approximately 100+ food additives with the following attributes:
- **Risk score** (0–100): Pre-assigned severity rating based on published health research
- **NOVA classification** (1–4): Food processing level
- **Severity level**: Derived from risk score (high ≥ 80, medium ≥ 50, low > 0, none = 0)
- **Source attribution**: Regulatory body reference (FSSAI, FDA, WHO, EU EFSA)
- **Aliases**: Alternative names for the same additive

The matching algorithm performs bidirectional substring comparison between normalized ingredient tokens and database keys (including aliases), ensuring that both partial and complete matches are detected.

**Tier 4 — Consumption Frequency Analysis:**
A weighted scoring engine computes an overall product risk assessment ($S_{total}$) based on the cumulative severity of identified harmful ingredients:

$$ S_{total} = \sum_{i=1}^{n} (R_i \cdot W_i) $$

where $n$ is the total number of matched harmful ingredients, $R_i$ is the base database risk score of ingredient $i$ ($0 \le R_i \le 100$), and $W_i$ is a non-linear severity weight assigned based on the risk tier:

$$ W_i = \begin{cases} 2.5, & \text{if } R_i \ge 90 \\ 1.5, & \text{if } 70 \le R_i < 90 \\ 0.8, & \text{if } 40 \le R_i < 70 \\ 0.3, & \text{otherwise} \end{cases} $$

Verdict:
    If kill_switch triggered → "Avoid" (e.g., hydrogenated oils, potassium bromate)
    If total_score > 150 → "Occasional" (limit to once per month)
    If total_score > 80 → "Moderation" (2-3 times per week)
    If total_score > 25 → "Good / Monitor"
    Otherwise → "Daily Safe"

The kill-switch mechanism provides immediate rejection for substances classified as critically hazardous (e.g., hydrogenated vegetable oil, potassium bromate, sodium nitrite), overriding the numerical score.

Additionally, a **local watchlist** of common problematic ingredients (palm oil, refined flour, maltodextrin, corn syrup) provides a secondary warning layer independent of the database matching tier.

### C. Module 3: Dietary Progress Tracking and Health Coaching

The progress tracking module maintains a comprehensive daily nutritional profile for each user through MongoDB-based meal logging. The system tracks:
- **Daily totals**: Calories, protein, carbohydrates, fats, sugar, fiber across four meal slots (breakfast, lunch, snacks, dinner)
- **Weight history**: Longitudinal weight logs with carry-forward interpolation for missing days
- **Streak tracking**: Consecutive days with logged meals, computed retroactively across up to 365 days

**Calorie Target Calculation:**
User-specific daily calorie targets are computed using the **Mifflin-St Jeor equation** to determine the Basal Metabolic Rate (BMR):

$$ BMR_{male} = 10w + 6.25h - 5a + 5 $$
$$ BMR_{female} = 10w + 6.25h - 5a - 161 $$

where $w$ is body weight in kilograms, $h$ is height in centimeters, and $a$ is age in years. The Total Daily Energy Expenditure (TDEE) is subsequently calculated as:

$$ TDEE = BMR \times A_m $$

Where activity multipliers range from 1.2 (sedentary) to 1.9 (athlete). Goal-based adjustments apply a ±500 kcal offset for weight loss/gain objectives. Protein targets default to 1.8g per kg body weight.

**Rule-Based Health Coaching:**
A deterministic coaching engine generates real-time dietary advice based on intake-vs-goal comparisons:
- Protein below 60% of target triggers a "very low" warning with food suggestions
- Sugar exceeding the daily limit triggers an immediate avoidance advisory
- Fiber deficit prompts increased vegetable/fruit intake recommendations
- Caloric overshoot beyond +200 kcal triggers a budget exceeded notification

These rules provide consistent, interpretable guidance without requiring additional API calls, ensuring reliability when external AI services may be unavailable.

### D. Module 4: AI-Powered Diet Plan Generation

The diet plan module generates personalized daily meal recommendations by combining nutritional calculations with context-aware LLM prompting.

**Input Construction:**
The system aggregates the user's health profile, current day's consumption, and remaining nutritional budget into a structured input:
- **User profile**: Diet type (veg/non-veg/vegan/jain/keto/etc.), cuisine preference, allergies, medical conditions, ingredients to avoid, meal frequency (3/4/6 meals)
- **Remaining budget**: Calories, protein, sugar, and fiber remaining for the day (dynamically computed from logged meals)
- **Meal slots**: Determined by user's meal frequency preference

**LLM-Based Generation:**
A structured prompt is constructed and sent to `llama-3.3-70b-versatile` via the Groq API. The prompt enforces:
- Strict adherence to diet type (only suggest dishes within the dietary category)
- Allergy and avoidance constraint compliance
- Macro budget alignment (staying within remaining calories/protein)
- Exact meal slot matching (number of generated meals equals requested slots)
- Full dish names (not raw ingredients)
- JSON-only output format

**Validation and Sanitization:**
The LLM response undergoes programmatic validation:
- JSON structure verification with safe extraction (handles markdown wrapping)
- Meal count trimming if AI over-generates beyond requested slots
- Content validation against user constraints

**Deterministic Fallback:**
If the AI service fails after two retry attempts, a rule-based fallback generator produces a basic plan using calorie-proportioned meal distributions (30% breakfast, 35% lunch, 10% snacks, 25% dinner) with template-based food recommendations tailored to the user's dietary type and health conditions.

---

## IV. IMPLEMENTATION

### A. Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js 18 with Vite, Material-UI (MUI) |
| Backend API Server | Node.js with Express.js |
| AI Model Service | Node.js with Express.js |
| Python Microservice | FastAPI with Uvicorn |
| Database | MongoDB with Mongoose ODM |
| Authentication | JWT-based with Google OAuth support |
| Image Processing | Sharp (Node.js), Tesseract.js (OCR) |
| AI/LLM APIs | Groq API (Llama-4-Scout, Llama-3.1-70B, Llama-3.3-70B, Llama-3.1-8b), Google Gemini 1.5 Flash |
| Barcode Scanning | Html5QrcodeScanner, Open Food Facts API |
| Deployment | Docker, Render (cloud) |

### B. Web Application

The Nutralyze web application provides the following user-facing features:

1. **Dashboard** — Food scanner with camera capture and image upload, real-time nutritional analysis display, portion adjustment slider, and meal logging interface

![Image Upload Interface](Fig3_Image_Upload.png)
*Fig. 3: Image Upload Interface for the Food Scanner module.*
2. **Package Food Scanner** — Barcode scanning (optical and manual entry), product detail display with per-100g and per-serving toggle, ingredient composition view, OCR-based label scanning fallback
3. **Harmful Ingredients Report** — Color-coded harmful ingredient highlighting (red for harmful, yellow for warning), risk severity badges, consumption frequency verdict with actionable advice
4. **Meal Log** — Daily meal tracking across four meal categories, nutritional totals and progress bars against daily targets
5. **Diet Plan** — AI-generated personalized daily meal plans with recommended and avoidable foods

![Food Recommendations](Fig4_Food_Recommendations.png)
*Fig. 4: Personalized AI-generated Food Recommendations and daily intake overview.*
6. **Progress Dashboard** — Weekly/monthly calorie and weight trend charts, streak tracking, macro breakdowns
7. **AI Chatbot** — Multilingual nutrition assistant (English, Hindi, Marathi) powered by Groq LLM with conversation history
8. **User Profile and Onboarding** — Comprehensive health profile setup with dietary preferences, medical conditions, allergies, and fitness goals

---

## V. RESULTS AND DISCUSSION

### A. System Capabilities Demonstration

The Nutralyze system was evaluated through functional testing across its four primary modules. Testing involved real food photographs taken under varying lighting conditions, packaged food products with different label formats, and diverse user dietary profiles.

**Food Recognition:** The multimodal LLM pipeline successfully identified a wide range of food categories including Indian dishes (dal, roti, rice, samosa, bhel puri), fruits, vegetables, packaged snacks, and beverages. The system correctly distinguished between visually similar items (e.g., puffed rice vs. cooked rice) through contextual reasoning enabled by the LLM's training data. Non-food objects (phones, laptops, faces) were correctly rejected by the edibility validation layer.

**Nutrition Estimation:** The dual-stage approach (vision identification + text-based estimation) provided robust nutritional values for detected servings. Evaluated against 15 common food items using USDA FoodData Central and Indian Food Composition Table references, the system achieved a Mean Absolute Percentage Error (MAPE) of 10.07% for caloric estimation. Overall macronutrient estimation across all parameters achieved a 29.64% MAPE, demonstrating the viability of LLM-based zero-shot nutrition estimation without task-specific training. The category baseline system and safety fallback layer successfully prevented zero-calorie errors. Portion adjustment capabilities (0.5× to 3×) allowed users to correct estimates for their actual consumption.

![Calorie Estimation MAPE](Fig2_Nutrition_MAPE.png)
*Fig. 2: Per-item calorie estimation error (MAPE) across 15 common food items evaluated against USDA and IFCT ground truth.*

**Ingredient Safety Analysis:** The OCR-based ingredient parsing pipeline was evaluated on 10 packaged food labels containing complex compound ingredients. The LLM-driven post-processing achieved an average precision of 94.57%, recall of 97.74%, and an F1-score of 95.98%. Furthermore, the risk database matching successfully flagged safety concerns in 100% (5 out of 5) of the tested products containing known harmful additives (e.g., palmolein, sodium benzoate, tartaric acid). The frequency analysis engine produced practical consumption advisories ranging from "Daily Safe" to "Avoid."

![OCR Ingredient Parsing Accuracy](Fig5_OCR_F1.png)
*Fig. 5: OCR-based ingredient parsing accuracy (Precision, Recall, F1-Score) across 10 packaged food products.*

**Diet Plan Generation:** The LLM-powered diet planner generated contextually appropriate meal recommendations respecting dietary type constraints (vegetarian, non-vegetarian, vegan, Jain), allergy avoidance, and remaining macro budgets. The system correctly adapted plans for users with different meal frequency preferences (3, 4, or 6 meals per day).

### B. System Architecture Advantages

The LLM-based approach offers several advantages over traditional CNN-based pipelines:
1. **Zero training overhead** — No dataset collection, annotation, or model training required
2. **Broad food vocabulary** — The LLM's pre-trained knowledge covers thousands of food items across global cuisines without requiring a fixed class taxonomy
3. **Contextual reasoning** — The model can interpret visual context (packaging, plating, environment) alongside food identification
4. **Flexible output format** — Structured JSON output enables direct integration with downstream processing without post-processing classifiers
5. **Rapid iteration** — System behavior can be improved through prompt engineering without retraining

### C. Limitations

1. **API dependency** — The system relies on external LLM API services (Groq), creating a dependency on service availability and introducing latency
2. **Estimation variability** — LLM-based nutrition estimates may vary between identical queries due to the stochastic nature of language model generation, though low temperature settings (0.1–0.2) mitigate this
3. **OCR accuracy** — Tesseract OCR performance degrades on curved, low-contrast, or partially occluded food labels, though LLM post-processing partially compensates for noise
4. **Risk database coverage** — The ingredient risk database, while curated against regulatory standards, covers approximately 100+ additives and may not include all regional or novel ingredients

---

## VI. CONCLUSION

This paper presents Nutralyze, a comprehensive multimodal system for automated nutrition analysis, ingredient risk detection, and personalized dietary guidance. Unlike traditional approaches that require training task-specific deep learning models, Nutralyze leverages the capabilities of pre-trained multimodal Large Language Models combined with structured databases and rule-based engines to deliver a practical, deployable solution.

The system demonstrates that LLM-based food analysis pipelines can achieve functional parity with conventional CNN-based approaches while significantly reducing development complexity and enabling broader food coverage. The multi-tier ingredient safety analysis combining API-sourced data, OCR extraction, and database-driven risk scoring provides a robust framework for consumer food safety evaluation.

Future improvements will focus on expanding the ingredient risk database with multilingual support and broader regional additive coverage, implementing on-device LLM inference for offline capability, developing evaluation benchmarks for systematic accuracy measurement of LLM-based nutrition estimation, incorporating user feedback loops for continuous estimation refinement, and exploring fine-tuned smaller models for reduced latency and API independence.

---

## REFERENCES

[1] W. C. Knowler et al., "Reduction in the incidence of type 2 diabetes with lifestyle intervention or metformin," *New England Journal of Medicine*, vol. 346, no. 6, pp. 393–403, 2002.

[2] A. Fakhrou, J. Kunhoth and S. Al Maadeed, "Smartphone-based food recognition system using multiple deep CNN models," *Multimedia Tools and Applications*, vol. 80, no. 21, pp. 33011–33032, 2021.

[3] C. Szegedy, V. Vanhoucke, S. Ioffe et al., "Rethinking the inception architecture for computer vision," in *Proc. IEEE CVPR*, 2016, pp. 2818–2826.

[4] Y. LeCun, Y. Bengio and G. Hinton, "Deep learning," *Nature*, vol. 521, pp. 436–444, 2015.

[5] C. S. Won, "Multi-scale CNN for fine-grained image recognition," *IEEE Access*, vol. 8, pp. 116663–116674, 2020.

[6] F. P. W. Lo, Y. Sun, J. Qiu et al., "Image-based food classification and volume estimation for dietary assessment: A review," *IEEE J. Biomedical and Health Informatics*, vol. 24, no. 7, pp. 1926–1939, 2020.

[7] Z. Liu, Y. Lin, Y. Cao et al., "Swin transformer: Hierarchical vision transformer using shifted windows," in *Proc. IEEE/CVF ICCV*, 2021, pp. 9992–10002.

[8] G. Vinod, Z. Shao and F. Zhu, "Image-based food energy estimation with depth domain adaptation," in *Proc. IEEE MIPR*, 2022, pp. 262–267.

[9] W. Shao, W. Min, S. Hou et al., "Vision-based food nutrition estimation via RGB-D fusion network," *Food Chemistry*, vol. 424, Art. no. 136309, 2023.

[10] A. Dosovitskiy, L. Beyer, A. Kolesnikov et al., "An image is worth 16×16 words: Transformers for image recognition at scale," *arXiv preprint*, 2021.

[11] Y. Chen, J. He, C. Czarnecki et al., "MetaFood3D: Large 3D food object dataset with nutrition values," *arXiv preprint*, 2024.

[12] K. He, X. Zhang, S. Ren and J. Sun, "Deep residual learning for image recognition," in *Proc. IEEE CVPR*, 2016.

[13] L. Jiang, B. Qiu, X. Liu, C. Huang and K. Lin, "DeepFood: Food image analysis and dietary assessment via deep model," *IEEE Access*, vol. 8, pp. 47477–47489, 2020.

[14] G. Ciocca, G. Micali and P. Napoletano, "State recognition of food images using deep features," *IEEE Access*, vol. 8, pp. 32003–32017, 2020.

[15] X. Zhao, L. Wang, Y. Zhang et al., "A review of convolutional neural networks in computer vision," *Artificial Intelligence Review*, vol. 57, Art. no. 99, 2024.

[16] S. Woo, J. Park, J.-Y. Lee and I. S. Kweon, "CBAM: Convolutional block attention module," in *Proc. ECCV*, 2018, pp. 3–19.

[17] F. S. Konstantakopoulos, E. I. Georga and D. I. Fotiadis, "A review of image-based food recognition and volume estimation AI systems," *IEEE Reviews in Biomedical Engineering*, vol. 17, pp. 136–152, 2024.

[18] L. Breiman, "Random forests," *Machine Learning*, vol. 45, no. 1, pp. 5–32, 2001.

[19] D. W. Hosmer, S. Lemeshow and R. X. Sturdivant, *Applied Logistic Regression*, Wiley, 2013.

[20] Meta AI, "Llama 3.1 Model Card," 2024. [Online]. Available: https://github.com/meta-llama/llama-models
