import express from "express";
import jwt from "jsonwebtoken";
import ChatMessage from "../models/ChatMessage.js";
import { generateGroqResponse } from "../services/groqService.js";

const router = express.Router();

// ✅ Load chat history for logged-in user
router.get("/messages", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      console.log("❌ No token found");
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const messages = await ChatMessage.find({ userId: decoded.id });
    res.json({ messages });

  } catch (err) {
    console.error("🔥 CHAT HISTORY ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});


// ✅ Send message + Get Groq reply
router.post("/send", async (req, res) => {
  try {
    console.log("➡ Incoming chatbot request:", req.body);

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      console.log("❌ No token for chat request");
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { message: userMessage, language } = req.body;

    if (!userMessage || userMessage.trim() === "") {
      return res.status(400).json({ message: "Message is empty" });
    }

    console.log("📩 User Message:", userMessage, "| Language:", language);

    // 🔥 Fetch last 20 messages for context
    const history = await ChatMessage.find({ userId: decoded._id })
      .sort({ createdAt: -1 }) // Get latest first
      .limit(20);

    // Sort back to chronological order (oldest first) for the AI
    const conversationHistory = history.reverse().map(msg => ({
      role: msg.role,
      text: msg.text
    }));

    // 🔥 Groq call with history
    const reply = await generateGroqResponse(userMessage, conversationHistory, language);

    console.log("🤖 Groq Reply:", reply);

    // 🔥 Save both messages
    await ChatMessage.create({
      userId: decoded._id,
      role: "user",
      text: userMessage
    });

    await ChatMessage.create({
      userId: decoded._id,
      role: "assistant",
      text: reply
    });

    res.json({ reply });
  } catch (err) {
    console.error("🔥 CHAT ROUTE ERROR:", err);
    res.status(500).json({ message: err.message || "Unknown error" });
  }
});

export default router;
