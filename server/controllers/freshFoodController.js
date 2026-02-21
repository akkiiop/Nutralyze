import axios from 'axios';
import FormData from 'form-data';
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const analyzeFreshFood = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    // 1. Send to CNN (Python Service)
    const formData = new FormData();
    formData.append('image', req.file.buffer, { filename: 'food.jpg' });

    const cnnRes = await axios.post('http://localhost:8001/classify', formData, {
      headers: formData.getHeaders(),
    });

    const foodItem = cnnRes.data.foodName;

    // 2. Query Groq for Analysis
    const completion = await groq.chat.completions.create({
      messages: [{
        role: "user",
        content: `Analyze this fresh food: "${foodItem}". Return a JSON object with:
                  "identity": {"name": "${foodItem}", "brand": "Fresh/Natural"},
                  "scores": {"nutriScore": "A/B/C/D/E based on health"},
                  "ingredients": {"list": ["list 5 main nutrients as ingredients"]}`
      }],
      model: "llama3-8b-8192",
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(completion.choices[0].message.content);

    res.status(200).json({ product: analysis });
  } catch (error) {
    console.error("Hybrid Error:", error);
    res.status(500).json({ error: "Analysis failed" });
  }
};