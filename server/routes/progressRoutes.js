import express from "express";
import { getProgressSummary, getProgressHistory, logWeight, getDailyProgress } from "../controllers/progressController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/daily/:userId/:date", protect, getDailyProgress);
router.get("/summary", protect, getProgressSummary);
router.get("/history", protect, getProgressHistory);
router.post("/weight", protect, logWeight);

export default router;
