import Tesseract from "tesseract.js";

export async function extractIngredientsFromImageFile(file, genAI) {
  const {
    data: { text },
  } = await Tesseract.recognize(file.buffer, "eng");

  console.log("OCR RAW TEXT:", text);

  // If we have Gemini, use it to structure the ingredients
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        You are a food label expert. Extract a clean, structured JSON array of ingredients from this raw OCR text:
        "${text}"
        
        Rules:
        1. Return ONLY a JSON array of strings.
        2. Clean up typos and OCR noise.
        3. Split items by commas.
        4. Lowercase everything.
        
        Example: ["corn", "vegetable oil", "sugar", "salt"]
      `;

      const result = await model.generateContent(prompt);
      const output = result.response.text().trim();

      // Extract JSON array from output (sometimes Gemini wraps in markdown)
      const match = output.match(/\[.*\]/s);
      if (match) {
        const ingredients = JSON.parse(match[0]);
        return { rawText: text, ingredients };
      }
    } catch (err) {
      console.error("Gemini OCR parsing failed:", err.message);
    }
  }

  // Fallback to basic splitting
  const ingredients = text
    .split(/,|\n/)
    .map((i) => i.trim().toLowerCase())
    .filter((i) => i.length > 2);

  return {
    rawText: text,
    ingredients,
  };
}
