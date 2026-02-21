import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

async function debugChat() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    console.log("--- TEST 1: Simple Chat (No History) ---");
    try {
        const chat = model.startChat({ history: [] });
        const res = await chat.sendMessage("Hi");
        console.log("✅ Custom Chat Success:", res.response.text());
    } catch (err) {
        console.log("❌ Custom Chat Failed:", err.message);
    }

    console.log("\n--- TEST 2: Chat with Valid History ---");
    try {
        const history = [
            { role: "user", parts: [{ text: "Hello" }] },
            { role: "model", parts: [{ text: "Hi there!" }] }
        ];
        const chat = model.startChat({ history });
        const res = await chat.sendMessage("How are you?");
        console.log("✅ History Chat Success:", res.response.text());
    } catch (err) {
        console.log("❌ History Chat Failed:", err.message);
    }

    console.log("\n--- TEST 3: Chat with BAD History (Double User) ---");
    try {
        const history = [
            { role: "user", parts: [{ text: "Hello" }] },
            { role: "user", parts: [{ text: "Hello again" }] } // ❌ Invalid for Gemini
        ];
        const chat = model.startChat({ history });
        const res = await chat.sendMessage("How are you?");
        console.log("✅ Bad History Chat Success (Unexpected):", res.response.text());
    } catch (err) {
        console.log("❌ Bad History Chat Failed (Expected):", err.message);
    }
}

debugChat();
