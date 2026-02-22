# Nutralyze — Smart AI Nutrition & Safety Advisor

![Nutralyze Banner](https://img.shields.io/badge/Status-Active-brightgreen)
![Tech Stack](https://img.shields.io/badge/Stack-MERN%20+%20AI-blue)
![License](https://img.shields.io/badge/License-ISC-orange)

**Nutralyze** is a state-of-the-art health application designed to bridge the gap between nutrition data and actionable health insights. Utilizing advanced AI models (Gemini & Groq) and a robust MERN architecture, it provides real-time food analysis, safety audits for packaged goods, and personalized diet planning through a glassmorphic "medical-tech" interface.

---

## 🚀 Key Features

- **🔍 Intelligent Food Labelling**: Scan barcodes or search for products to receive instant nutritional breakdowns.
- **🛡️ Safety Assessment**: Automated "High-Risk" and "Warning" classification for harmful additives, emulsifiers, and preservatives.
- **📊 Interactive Dashboard**: Real-time tracking of macros, weight progress, and nutritional goals with dynamic visualizations.
- **💬 AI Nutrition Assistant**: A 24/7 smart companion powered by Gemini for answering dietary queries and meal suggestions.
- **🥗 Personalized Diet Plans**: Goal-oriented diet generation focused on user-specific biometric data and preferences.
- **🌡️ Medical-Tech UI**: A premium, nature-inspired design system with smooth micro-animations and responsive glassmorphic components.

---

## 🏗️ System Architecture

Nutralyze follows a distributed micro-service pattern to ensure high availability and efficient AI processing.

### 1. Frontend (Client)
- **Framework**: React 18 + Vite
- **Styling**: Material UI (MUI) + Vanilla CSS (Dynamic Themes)
- **Features**: Barcode scanning (HTML5-QRCode), Interactive Charts (Chart.js), Real-time state management.

### 2. Core Backend (Server)
- **Runtime**: Node.js + Express
- **Database**: MongoDB Atlas (Mongoose ODM)
- **Auth**: Google OAuth Integration + JWT
- **Logic**: User profiles, Meal logging, Progress tracking, and Session management.

### 3. AI Model Service
- **LLMs**: Google Gemini Pro & Groq (Llama-3)
- **ML Utilities**: Custom ingredient normalization and risk analysis logic.
- **OCR**: Integrated image-to-text processing for ingredient lists.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React, Vite, MUI, Framer Motion, Recharts |
| **Backend** | Node.js, Express, MongoDB, Mongoose |
| **Intelligence** | Google Gemini API, Groq SDK, Tesseract.js |
| **Deployment** | Docker, Render.com |

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas Account
- Google AI (Gemini) API Key
- Google Cloud Console for OAuth

### 1. Clone & Install
```bash
git clone https://github.com/akkiiop/Nutralyze.git
cd Nutralyze
npm run install-all  # Root script to install client, server, and ai-model deps
```

### 2. Environment Configuration
Create `.env` files in `server/` and `ai-model/` following the provided `.env.example` templates.

**Key Keys Required:**
- `MONGO_URI`
- `JWT_SECRET`
- `GEMINI_API_KEY`
- `GOOGLE_OAUTH_CLIENT_ID`

### 3. Running Locally
```bash
# Start all services concurrently
npm run dev
```
- Frontend: `http://localhost:3000`
- API Server: `http://localhost:8080`
- AI Model Server: `http://localhost:5000`

---

## 📦 Deployment

Nutralyze is containerized using **Docker** and optimized for **Render.com**. 
The production instance can be accessed at: [https://nutrivision-oc9q.onrender.com](https://nutrivision-oc9q.onrender.com)

---

## 🛡️ Research & Development

Nutralyze is a real-time research project developed by **Team Sainz**. The project focuses on leveraging Large Language Models to improve nutritional literacy and consumer safety.

**The Team:**
- **Vineel Yerubandi** — Project Lead & Architect
- **K. Sri Rishikesh Varma** — AI & Backend Systems
- **Kota Shiva Tarak Reddy** — UI/UX Design & Data Engineering
- **Solomon Heron** — Backend Infrastructure & Data Science
- **Satyadeva** — Frontend Engineering & QA

---
###### © 2026 Team Sainz | Developed with ❤️ by KMIT Students
