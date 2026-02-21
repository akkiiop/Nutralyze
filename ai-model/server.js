// ai-model/server.js (FIXED & CLEAN)

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import detectRoutes from "./routes/detectRoutes.js";
import harmfulRoutes from "./routes/harmfulRoutes.js";
import packageFoodRoutes from "./routes/packageFoodRoutes.js";

import ocrRoutes from "./routes/ocrRoutes.js";




dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ---------------------------
// Middleware
// ---------------------------
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:8080")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));

// ---------------------------
// Initialize Gemini
// ---------------------------
let genAI = null;
const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

try {
  if (!API_KEY) throw new Error("Missing GEMINI_API_KEY");
  genAI = new GoogleGenerativeAI(API_KEY);
  console.log("Gemini initialized ✔");
} catch (err) {
  console.error("Gemini initialization failed ❌:", err.message);
}

// Make Gemini available to routes
app.locals.genAI = genAI;

// ---------------------------
// Health check
// ---------------------------
app.get("/api/health", (req, res) => {
  return res.json({ status: "running", gemini: !!genAI });
});

// ---------------------------
// Routes
// ---------------------------
app.use("/api", detectRoutes);
app.use("/api", ocrRoutes);
app.use("/api", harmfulRoutes);
app.use("/api/package-food", packageFoodRoutes);

// ---------------------------
// Start server
// ---------------------------
app.listen(PORT, () => {
  console.log(`AI Model Server running on port ${PORT}`);
});
