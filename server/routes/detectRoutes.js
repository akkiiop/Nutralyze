import express from "express";
import { detectFood } from "../controllers/detectController.js";

const router = express.Router();

// Full URL: http://localhost:8080/api/food/detect-fresh
router.post("/detect-fresh", detectFood);

export default router;