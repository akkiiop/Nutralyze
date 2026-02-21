import express from "express";
import { signupUser, loginUser, googleLogin } from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Google Login
router.post("/google-login", googleLogin);

// ✅ Signup
router.post("/signup", signupUser);

// ✅ Login
router.post("/login", loginUser);

// ✅ Get currently logged-in user
router.get("/me", authMiddleware, (req, res) => {
  res.json({ success: true, user: req.user });
});

export default router;
