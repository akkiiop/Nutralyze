import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getLatestDietPlan,
  generateDietPlan,
  regenerateDietPlan,
} from "../controllers/dietController.js";

const router = express.Router();

/**
 * ✅ Get today's latest diet plan
 * GET /api/diet/latest
 */
router.get("/latest", authMiddleware, getLatestDietPlan);

/**
 * ✅ Generate today's plan (idempotent)
 * POST /api/diet/generate
 */
router.post("/generate", authMiddleware, generateDietPlan);

/**
 * ✅ Force regenerate today's plan (after profile changes)
 * POST /api/diet/regenerate
 */
router.post("/regenerate", authMiddleware, regenerateDietPlan);

export default router;
