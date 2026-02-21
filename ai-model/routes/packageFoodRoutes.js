import express from "express";
import { detectProduct } from "../controllers/detectController.js";

const router = express.Router();

// FINAL endpoint used by frontend
router.post("/scan", detectProduct);

export default router;
