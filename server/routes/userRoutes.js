import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { updateUserProfile } from "../controllers/userController.js";

const router = express.Router();

// get logged-in user details
router.get("/me", authMiddleware, (req, res) => {
  return res.json({ success: true, user: req.user });
});

// update user profile
router.put("/update", authMiddleware, updateUserProfile);

export default router;
