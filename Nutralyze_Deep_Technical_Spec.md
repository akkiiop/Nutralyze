# Nutralyze Deep Technical Specification

## 1. Module: Frontend Client

### 1. Module Identification
*   **Module Name**: Client Application
*   **Location**: `client/`
*   **Purpose**: Provides the user interface for food tracking, dashboard visualization, camera handling, and interaction with the Nutralyze ecosystem.

### 2. Input Data
*   **User Input**: Text (manual logs), Images (Camera/Gallery capture), Form Data (Profile setup).
*   **API Data**: JSON responses from Backend (User profile, Food detection results, Progress stats).
*   **Format**: JSON for API, Base64/Blob for Images.

### 3. Processing Logic
*   **Workflow**:
    1.  User captures image -> Image compressed via canvas/browser APIs.
    2.  Image sent to Backend via `axios`.
    3.  Backend response (Food Identity) displayed in Modal.
    4.  User confirms/edits -> "Add Meal" request sent.
*   **Validation**: Form validation (Yup/Formik), Auth token checks (Protected Routes).

### 4. AI / ML / LLM Usage
*   **Models**: None locally.
*   **Role**: Acts as a "Thin Client". All AI processing is offloaded to the server to preserve client battery/performance.

### 5. APIs & External Services
*   **Nutralyze Backend**: `http://localhost:8080/api` (All operations).
*   **Firebase Authentication** (if active): For social login tokens.

### 6. Datasets & Local Data
*   **Local Storage**: Stores `token` (JWT) for session persistence.
*   **Assets**: Static images/icons in `public/`.

### 7. Database Interaction
*   **Direct Access**: None. All DB operations are proxied through the Backend API.

### 8. Environment & Secrets
*   **`VITE_API_URL`**: Backend endpoint.
*   **`VITE_FIREBASE_Config`**: Public API keys for Auth (safe to expose in client).
*   **Security**: No secret keys stored here.

### 9. Output Data
*   **To Server**: HTTP POST requests with JSON/Multipart payloads.
*   **To User**: Visual Dashboard (Charts, Lists, Modals).

### 10. End-to-End Flow
*   **Role**: The "Initiator". Starts every workflow (Login, Scan, Log).
*   **Flow**: `User Action` -> `Frontend` -> `API Request` -> `Backend`.

---

## 2. Module: Main Server API

### 1. Module Identification
*   **Module Name**: Main Server
*   **Location**: `server/`
*   **Purpose**: The central orchestrator. Handles Auth, Database, Rate Limiting, and routes requests to specific AI services.

### 2. Input Data
*   **From Client**: HTTP Requests (JSON/Images).
*   **From AI Services**: JSON Analysis results.
*   **Format**: JSON, Multipart/Form-Data (Images).

### 3. Processing Logic
*   **Auth**: Verifies JWT on protected routes.
*   **Rate Limiting**: `quotaGuard` checks User IP against daily limits.
*   **Orchestration**:
    *   "Fresh Food" -> Calls Groq Cloud directly.
    *   "Packaged Food" -> Calls AI Microservice or Python Engine.
*   **Validation**: Input sanitization, Error handling (try/catch blocks).

### 4. AI / ML / LLM Usage
*   **Models**: `llama-4-scout-17b` (Vision), `llama-3.1-70b` (Reasoning).
*   **Provider**: Groq Cloud.
*   **Usage**:
    *   `detectController.js`: Sends Image -> Receives Food Identity + Quantity.
    *   Then sends Identity -> Receives Nutrition Estimates.
    *   **Safety Net**: Overrides "Zero Macro" hallucinations with category-based defaults.

### 5. APIs & External Services
*   **Groq API**: For Vision and LLM inference.
*   **Python Service**: `http://127.0.0.1:8002` (Internal HTTP call).
*   **Google OAuth**: For token verification (`google-auth-library`).

### 6. Datasets & Local Data
*   **`harmfulList.js`**: A lightweight local JS array for "Tier 2" fallback ingredient scanning.

### 7. Database Interaction
*   **Database**: MongoDB (Atlas).
*   **Schemas**:
    *   `User`: Reads profile, Writes auth data.
    *   `Meal`: Writes new logs, Reads history for charts.
    *   `DailySummary`: Updates aggregates (increment logic).

### 8. Environment & Secrets
*   **Keys**: `GROQ_API_KEY`, `MONGO_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`.
*   **Loading**: `dotenv` loads from `.env`.
*   **Security**: Never exposed to client.

### 9. Output Data
*   **To Client**: Standardized JSON responses (`success: true`, `data: ...`).
*   **To Database**: Persistent records.

### 10. End-to-End Flow
*   **Role**: The "Hub". Connects Client, Database, and Intelligence.
*   **Flow**: `Client Request` -> `Server Middleware` -> `Logic/AI Call` -> `DB Update` -> `Response`.

---

## 3. Module: AI Microservice (Node.js)

### 1. Module Identification
*   **Module Name**: AI Connect Service
*   **Location**: `ai-model/` (Root files: `server.js`, `controllers/detectController.js`)
*   **Purpose**: Handles specialized tasks like Barcode Lookup (OpenFoodFacts) and OCR preprocessing before sending to the Python engine.

### 2. Input Data
*   **From Main Server**: JSON (Barcodes) or Images (for OCR).

### 3. Processing Logic
*   **Barcode Lookup**:
    1.  Receives Barcode.
    2.  Queries OpenFoodFacts API.
    3.  Normalizes response (extracts ingredients/nutriments).
*   **OCR Handling**:
    1.  Receives Image.
    2.  Calls OCR utility (Tesseract or Vision API).
    3.  Returns raw text.

### 4. AI / ML / LLM Usage
*   **Models**: None internally (mostly API wrapping).
*   **Role**: Data normalization and Gateway to External Data APIs.

### 5. APIs & External Services
*   **Open Food Facts API**: Public DB for packaged food.

### 6. Datasets & Local Data
*   **None**: Stateless proxy.

### 7. Database Interaction
*   **None**: Purely functional service.

### 8. Environment & Secrets
*   **Keys**: `PORT` (usually 5000 or similar).

### 9. Output Data
*   **To Main Server**: Normalized Product Object (Name, Brand, Nutriments, Ingredients).

### 10. End-to-End Flow
*   **Role**: "Packaged Food Specialist".
*   **Flow**: `Main Server` -> `AI Node Microservice` -> `OpenFoodFacts` -> `Result`.

---

## 4. Module: Ingredient Hazard Engine (Python)

### 1. Module Identification
*   **Module Name**: ML Hazard Engine
*   **Location**: `ai-model/ml/service.py`
*   **Purpose**: The core "Intelligence" for food safety. analyzes ingredient lists to detect hidden dangers using a custom 20-Phase algorithm.

### 2. Input Data
*   **Input**: JSON Wrappper (`{ ingredients: ["sugar", "palmolein", ...] }`).
*   **Source**: Main Server (via HTTP POST).

### 3. Processing Logic
*   **The "20-Phase Engine"**:
    *   **Phase 1-5**: Loads `ingredients_db.json`. Checks "Kill Switches" (Immediate Red Flags like *Potassium Bromate*).
    *   **Phase 6-10**: Weighted Scoring. (Trans Fat = 90pts, Sugar = 40pts). Checks synonyms.
    *   **Phase 11-15**: Calculates Total Toxicity Score.
    *   **Phase 16-20**: Verdict Logic (Daily Safe vs Moderation vs Avoid).

### 4. AI / ML / LLM Usage
*   **Models**: `llama-3.1-8b-instant` (Groq).
*   **Usage**: Used for **Structured Cleaning**.
    *   *Input*: Broken OCR text ("Corn, Starch, Veg Oil").
    *   *Prompt*: "Fix this text, handle compound ingredients like 'Vegetable Oil (Palm, Sunflower)'".
    *   *Output*: Clean JSON Array `["corn starch", "vegetable oil"]`.

### 5. APIs & External Services
*   **Groq API**: For the cleaning step only. The Scoring is internal (Deterministic).

### 6. Datasets & Local Data
*   **`ingredients_db.json`**: Critical Asset. Contains Risk Scores (0-100), NOVA classifications, and descriptions.

### 7. Database Interaction
*   **Read-Only**: Loads JSON DB into memory on startup (`LOOKUP` hash map). Does not write to MongoDB.

### 8. Environment & Secrets
*   **Keys**: `GROQ_API_KEY`.
*   **Loading**: `python-dotenv`.

### 9. Output Data
*   **JSON Response**:
    *   `results`: Array of detected hazards with severity.
    *   `frequency_analysis`: Final Verdict object (`color`: "Red", `advice`: "STOP...").

### 10. End-to-End Flow
*   **Role**: "The Judge".
*   **Flow**: `Main Server` -> `Python Engine` -> `Analysis` -> `Verdict` -> `Main Server`.
