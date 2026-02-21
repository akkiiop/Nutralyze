import Groq from "groq-sdk";

// Initialize Groq lazily to avoid issues with missing env vars during import
let groq;

export async function generateGroqResponse(message, history = [], language = "en-US") {
    try {
        if (!process.env.GROQ_API_KEY) {
            console.warn("⚠ GROQ_API_KEY missing in .env");
            return "Groq API key not configured.";
        }

        if (!groq) {
            groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        }

        const langMap = {
            "en-US": "English",
            "hi-IN": "Hindi",
            "mr-IN": "Marathi"
        };
        const selectedLang = langMap[language] || "English";

        // Prepare messages array for Groq (OpenAI-compatible format)
        // System instruction to define persona
        const systemMessage = {
            role: "system",
            content: `You are a helpful and knowledgeable Clinical Nutritionist. You help users with diet, nutrition, and health advice. 
            The user has selected ${selectedLang} as their preferred language. 
            You MUST ALWAYS respond in ${selectedLang} only. 
            Use a simple, natural conversational tone suitable for voice output. 
            Avoid complex markdown tables or heavy formatting. Keep your answers concise and helpful.`
        };

        // Format usage history: ensures roles are strictly 'user' or 'assistant'
        const formattedHistory = history.map(msg => ({
            role: msg.role === "model" ? "assistant" : msg.role, // normalize 'model' to 'assistant' just in case
            content: msg.text || msg.content || ""
        }));

        // Construct final message list
        const messages = [
            systemMessage,
            ...formattedHistory,
            { role: "user", content: message }
        ];

        const completion = await groq.chat.completions.create({
            messages: messages,
            model: "llama-3.3-70b-versatile", // Powerful, fast, and free-tier friendly
            temperature: 0.7,
            max_tokens: 1024,
        });

        return completion.choices[0]?.message?.content || "No response generated.";

    } catch (err) {
        console.error("🔥 GROQ API ERROR:", err.message);
        return "Sorry, I am having trouble connecting to the AI right now.";
    }
}
