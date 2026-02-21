import Groq from "groq-sdk";
import "dotenv/config";

async function testGroq() {
    const key = process.env.GROQ_API_KEY;
    if (!key) {
        console.error("❌ No GROQ_API_KEY found in .env");
        return;
    }

    const groq = new Groq({ apiKey: key });

    try {
        console.log("Testing Groq connection...");
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: "Hello, answer in one word." }],
            model: "llama-3.3-70b-versatile",
        });

        console.log("✅ Groq Success:", completion.choices[0]?.message?.content);
    } catch (error) {
        console.error("❌ Groq Failed:", error.message);
    }
}

testGroq();
