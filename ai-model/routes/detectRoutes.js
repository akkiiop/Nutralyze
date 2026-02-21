import express from "express";
import { detectProduct } from "../controllers/detectController.js";

const router = express.Router();

router.post("/detect", detectProduct);

export default router;
