import fetch from "node-fetch";

export async function parseIngredientsWithGroq(ocrText) {
  const prompt = `
You are given raw OCR text from a food ingredient label.

TASK:
- Fix broken words
- Keep percentages with ingredients
- Split into individual ingredients
- Do NOT invent ingredients
- Output ONLY a valid JSON array of strings

OCR TEXT:
"""
${ocrText}
"""
`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama3-8b-8192",
      messages: [
        { role: "system", content: "You are a precise data extraction engine." },
        { role: "user", content: prompt }
      ],
      temperature: 0,
    }),
  });

  const data = await res.json();

  const content = data.choices[0].message.content;

  // Parse JSON safely
  return JSON.parse(content);
}
