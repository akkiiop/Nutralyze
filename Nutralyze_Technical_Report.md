# Nutralyze - Technical Architecture & Codebase Analysis

## 1. Module-wise Architecture

The **Nutralyze** project follows a **Microservice-inspired MERN Architecture**, distributed across three primary execution environments.

### **Core Modules**

| Module | Directory | Purpose | Tech Stack |
| :--- | :--- | :--- | :--- |
| **Frontend Client** | `client/` | Handles UI, Camera/Image Capture, User Dashboard, and Data Visualization. | React (Vite), Material UI, Recharts |
| **Main Server** | `server/` | Orchestrates Auth, User Management, Fresh Food Detection, and Database Interactions. | Node.js, Express, MongoDB Mongoose |
| **AI Microservice** | `ai-model/` | Dual-purpose environment hosting both a Node.js wrapper for Barcode/OpenFoodFacts and a Python ML engine for deep analysis. | Node.js (Wrapper), Python (FastAPI) |
| **ML Engine** | `ai-model/ml/` | Dedicated Python service for Ingredient Risk Analysis (20-Phase Engine) and OCR Parsing. | Python, FastAPI, PyTorch, Groq SDK |

---

## 2. Datasets & External Sources

### **Primary Datasets**
*   **`ingredients_db.json`** (`ai-model/ml/data`): A local, curated JSON database containing risk scores, NOVA classifications, and descriptions for thousands of food additives and ingredients.
*   **Open Food Facts API**: External source for retrieving product metadata (ingredients, nutrition) via Barcode scanning.

### **AI Services & APIs**
*   **Groq API**:
    *   **Vision**: `meta-llama/llama-4-scout-17b-16e-instruct` for Fresh Food Identification.
    *   **Inference**: `llama-3.1-70b-versatile` for high-accuracy Nutrition Estimation.
    *   **Fallback**: `llama-3.1-8b-instant` for fast/fallback tasks.
*   **Google Vision / Gemini**: (Found in `foodService.js`) Alternative/Legacy vision provider for specific image analysis tasks.

---

## 3. AI / ML / LLM Usage

### **A. Fresh Food Detection Pipeline**
*   **Location**: `server/controllers/detectController.js`
*   **Input**: Raw Image (Base64)
*   **Process**:
    1.  **Preprocessing**: Image resized to 512x512 via `sharp`.
    2.  **Identification (Vision)**: Groq (Llama-4-Scout) identifies the food items, unit type (bowl/piece), and estimates visual weight.
    3.  **Nutrition Estimation (LLM)**: Groq (Llama-3-70b) acts as a "Nutritionist" to estimate calories/macros for the specific serving size.
    4.  **Safety Layer**: Rule-based fallback checks for "Zero Macro" hallucinations and applies category-based calorie density defaults (e.g., Chips = 5.5 kcal/g).
*   **Output**: JSON Object with Food Identity + Calculated Nutrition.

### **B. Ingredient Risk Engine (The "20-Phase Engine")**
*   **Location**: `ai-model/ml/service.py`
*   **Input**: OCR Text from Product Label.
*   **Process**:
    1.  **OCR Cleaning**: Llama-3-8b structures raw text into a clean JSON array (handling line breaks, compound ingredients).
    2.  **20-Phase Analysis**:
        *   **Phase 1-5**: Risk Weights & Kill Switch checks (e.g., Potassium Bromate).
        *   **Phase 6-10**: Weighted Score Calculation.
        *   **Phase 11-20**: Threshold logic for "Daily Safe" vs "Moderation" vs "Avoid" verdicts.
*   **Output**: Detailed Health Report with Color-coded Verdict (Green/Yellow/Red).

---

## 4. Backend Processing Flow

### **Request Lifecycle: Fresh Food Scan**
1.  **Client Request**: React App captures image -> `POST /api/food/detect-fresh`.
2.  **Middleware**: `quotaGuard` checks User IP against daily limits (20 scans/day).
3.  **Controller**: `detectController` orchestrates the AI calls.
    *   Parallel execution of Vision and Text models.
    *   JSON validation.
4.  **Database**: (Optional) User can save result -> `POST /api/meals/add` -> stored in `Meal` collection.
5.  **Response**: JSON data sent back to Frontend for "Edit/Confirm" modal.

---

## 5. Database Design (MongoDB)

### **Key Collections**

| Collection | Schema File | Key Fields | Relationships |
| :--- | :--- | :--- | :--- |
| **Users** | `User.js` | `name`, `email`, `authMethod` (google/local), `targetWeight`, `dietType`, `allergies`, `dailyGoals` (calories/sugar/fiber) | One-to-Many with Meals, DailySummaries |
| **Meals** | `Meal.js` | `userId`, `date`, `meals` (Array of objects: `foodName`, `nutrition`, `source`, `timestamp`) | Index: `{ userId: 1, date: 1 }` (Unique per day) |
| **DailySummaries** | `DailySummary.js` | `userId`, `date`, `totalCalories`, `macroTotals`, `waterIntake`, `weightEntry` | Aggregated view for Dashboard efficiency |
| **WeightLogs** | `WeightLog.js` | `userId`, `date`, `weight` | Historical weight tracking |

---

## 6. Authentication & Security

*   **Dual Authentication System**:
    *   **Google OAuth2**: Verifies ID Tokens backend-side via `google-auth-library`. Handles "Account Linking" if email matches.
    *   **Local Auth**: Standard Email/Password with `bcryptjs` encryption.
*   **Session Management**:
    *   **JWT (JSON Web Token)**: Stateless auth. Tokens signed with `JWT_SECRET`, valid for 7 days.
*   **Configuration**:
    *   Sensitive keys (`GROQ_API_KEY`, `MONGO_URI`, `GOOGLE_CLIENT_ID`) strictly loaded from `.env`.
    *   `dotenv` used for environment variable management.

---

## 7. System Architecture Summary

The system is designed for **Scalability** and **Accuracy**. By decoupling the **App Server** (User Ops) from the **AI Engine** (Compute Heavy), Nutralyze ensures that heavy ML tasks do not block user interactions.

### **Integration Diagram (Logical)**
```mermaid
graph TD
    User[Client (React)] -->|Image/Auth| MainServer[Node.js Main Server]
    MainServer -->|Auth Check| DB[(MongoDB)]
    MainServer -->|Image Analysis| GroqAPI[Groq AI Cloud]
    MainServer -->|Barcode/OCR| AIModel[AI Microservice]
    AIModel -->|OCR Text| PythonML[Python FastAPI Engine]
    PythonML -->|Risk Score| AIModel
    AIModel -->|JSON Result| MainServer
    MainServer -->|Final Response| User
```

---

## 8. Presentation-Ready Summary (Viva/Defense Points)

*   **Project Title**: Nutralyze - AI-Powered Personal Nutritionist.
*   **Core Problem Solved**: Eliminates manual data entry in diet tracking using One-Shot AI Vision.
*   **Technical Stack**: Full MERN Stack + Python Microservice + Generative AI (Llama 3).
*   **Key Innovation**:
    *   **Hybrid AI Pipeline**: Combines Computer Vision (for identification) with LLMs (for nutrition inference).
    *   **20-Phase Safety Engine**: A deterministic algorithm that prevents "Hallucinations" in food safety analysis.
*   **Security**: Enterprise-grade Auth (Google/JWT) and Rate-Limited API endpoints.
