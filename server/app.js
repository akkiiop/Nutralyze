import "./config/env.js"; // ✅ Load env BEFORE everything else
import express from "express";
import cors from "cors";

import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


console.log("OPENAI KEY LOADED:", process.env.OPENAI_API_KEY ? "YES ✅" : "NO ❌");


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



const app = express();

// ✅ MUST be before routes/middlewares if using IP-based limiter
app.set("trust proxy", 1);

await connectDB();


app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json()); // ✅ keep only once

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
app.use("/api/meals", mealRoutes);
app.use("/api/packagefood", packageFoodRoutes);
app.use("/api/progress", progressRoutes);

app.get("/", (req, res) => res.send("Server is running successfully 🚀"));

const PORT = process.env.PORT || 8080;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () =>
    console.log(`✅ Server running on http://localhost:${PORT}`)
  );
}

export default app;
