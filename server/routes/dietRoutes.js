// server/routes/dietRoutes.js
import express from "express";
import { generateDietPlan, getLatestDietPlan } from "../controllers/dietController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// GET latest (today) diet plan
router.get("/latest", authMiddleware, getLatestDietPlan);

// POST generate plan for today (idempotent)
router.post("/generate", authMiddleware, generateDietPlan);

export default router;

