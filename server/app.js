import "./config/env.js";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import mealRoutes from "./routes/mealRoutes.js";
import dietPlanRoutes from "./routes/dietPlanRoutes.js";
import detectRoutes from "./routes/detectRoutes.js";
import foodScanRoutes from "./routes/foodScanRoutes.js";
import ingredientAnalysis from "./routes/ingredientAnalysis.js";
import packageFoodRoutes from "./routes/packageFoodRoutes.js";
import ingredientParserRoute from "./routes/ingredientParser.js";
import progressRoutes from "./routes/progressRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set("trust proxy", 1);

await connectDB();

// --- CORS ---
const defaultOrigins = [
  "http://localhost:3000",
  "https://nutralyze.onrender.com"
];
const envOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map(o => o.trim())
  : [];
const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// --- API Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/diet", dietPlanRoutes);
app.use("/api/food", detectRoutes);
app.use("/api/scan-food", foodScanRoutes);
app.use("/api/analysis", ingredientAnalysis);
app.use("/api/package-food", packageFoodRoutes);
app.use("/api", ingredientParserRoute);
app.use("/api/progress", progressRoutes);

// --- Serve static frontend in production ---
if (process.env.NODE_ENV === "production") {
  const clientDist = path.resolve(__dirname, "../client/dist");
  app.use(express.static(clientDist));
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
} else {
  app.get("/", (req, res) => res.send("Server is running 🚀"));
}

// --- Centralized Error Handler ---
app.use((err, req, res, _next) => {
  const status = err.status || 500;
  if (process.env.NODE_ENV !== "production") {
    console.error("Error:", err.stack || err.message);
  }
  res.status(status).json({
    error: process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message,
  });
});

const PORT = process.env.PORT || 8080;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () =>
    console.log(`Server running on port ${PORT}`)
  );
}

export default app;
