import express from "express";
import { analyzeHarmfulIngredients } from "../controllers/harmfulController.js";

const router = express.Router();

// POST /api/harmful-ingredients
router.post("/harmful-ingredients", analyzeHarmfulIngredients);

export default router;
