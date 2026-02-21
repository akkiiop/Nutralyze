import Tesseract from "tesseract.js";

export async function extractIngredientsFromImageFile(file) {
  const {
    data: { text },
  } = await Tesseract.recognize(file.buffer, "eng");

  console.log("OCR RAW TEXT:", text);

  const ingredients = text
    .split(/,|\n/)
    .map((i) => i.trim().toLowerCase())
    .filter((i) => i.length > 2);

  return {
    rawText: text,
    ingredients,
  };
}
