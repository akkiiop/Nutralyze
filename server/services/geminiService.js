import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateGeminiResponse(message, history = []) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("⚠ GEMINI_API_KEY missing in .env");
      return "Gemini API key not configured.";
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use the latest Flash model which is confirmed to work with free quota
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // Format history for Gemini SDK
    // SDK expects: { role: "user" | "model", parts: [{ text: "..." }] }
    const formattedHistory = history.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.text }],
    }));

    try {
      const chat = model.startChat({
        history: formattedHistory,
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      return response.text();
    } catch (historyError) {
      console.warn("⚠ Gemini Chat with History failed, retrying without history...", historyError.message);

      // Fallback: Try without history
      const chat = model.startChat({ history: [] });
      const result = await chat.sendMessage(message);
      const response = await result.response;
      return response.text();
    }

  } catch (err) {
    console.error("🔥 FATAL GEMINI ERROR:", err.message, JSON.stringify(err, null, 2));
    return "Sorry, I am having trouble connecting to the AI right now.";
  }
}
