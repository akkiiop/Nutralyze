import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const candidates = [
    "gemini-2.0-flash-exp",
    "gemini-flash-latest",
    "gemini-2.0-flash-lite-preview-02-05",
    "gemini-2.0-flash"
];

async function testModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    console.log("Testing generation with candidates...");

    for (const modelName of candidates) {
        try {
            console.log(`\n👉 Testing: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Say hello briefly.");
            console.log(`✅ SUCCESS with ${modelName}! Response: ${result.response.text()}`);
            return; // Stop at first success
        } catch (error) {
            console.log(`❌ FAILED ${modelName}: ${error.message.split('\n')[0]}`); // Print just the first line of error
        }
    }
}

testModels();
