import express from "express";
import multer from "multer";
import { extractIngredientsFromImageFile } from "../utils/ingredientOCR.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/ocr-ingredients",
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Image missing" });
      }

      const data = await extractIngredientsFromImageFile(req.file);

      res.json(data);
    } catch (err) {
      console.error("OCR failed:", err.message);
      res.status(500).json({ error: "OCR failed" });
    }
  }
);

export default router;
