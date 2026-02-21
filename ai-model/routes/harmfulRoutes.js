import express from "express";
import { analyzeHarmfulIngredients } from "../controllers/harmfulController.js";

const router = express.Router();

router.post("/harmful-ingredients", analyzeHarmfulIngredients);

export default router;
