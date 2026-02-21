import express from "express";
import { scanPackageFood } from "../controllers/packageFoodController.js";

const router = express.Router();

router.post("/scan", scanPackageFood);

export default router;
