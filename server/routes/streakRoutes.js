import express from "express";
import Streak from "../models/Streak.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Get streak by userId
router.get("/:userId", authMiddleware, async (req, res) => {
  try {
    const streak = await Streak.findOne({ userId: req.params.userId });

    res.json({
      success: true,
      streak: streak?.currentStreak || 0,
      history: streak?.history || {},
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update streak
router.post("/update", authMiddleware, async (req, res) => {
  try {
    const { userId, currentStreak, history } = req.body;

    await Streak.findOneAndUpdate(
      { userId },
      { currentStreak, history },
      { upsert: true }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
