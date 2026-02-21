/**
 * Universal ingredient normalizer
 * --------------------------------
 * - Extracts INS / E numbers
 * - Extracts meaningful ingredient phrases
 * - Preserves multi-word terms
 * - Avoids hardcoded ingredient lists
 * - Works with ANY CSV content
 */

export function normalizeIngredients(ingredients = []) {
  const tokens = new Set();

  ingredients.forEach((raw) => {
    if (!raw || typeof raw !== "string") return;

    const text = raw.toLowerCase();

    // --------------------------------
    // 1️⃣ Extract INS / E numbers
    // --------------------------------
    // Examples: e476, ins 476, e472e
    const additiveMatches = text.match(/(?:\bins\b|\be\b)\s*\d{3,4}[a-z]?/g);
    if (additiveMatches) {
      additiveMatches.forEach((m) =>
        tokens.add(m.replace(/\s+/g, ""))
      );
    }

    // --------------------------------
    // 2️⃣ Extract bracket content (very important)
    // --------------------------------
    // Example: artificial color (red 40, blue 1, yellow 5)
    const bracketMatches = text.match(/\(([^)]+)\)/g);
    if (bracketMatches) {
      bracketMatches.forEach((group) => {
        group
          .replace(/[()]/g, "")
          .split(/[,/&]/)
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((item) => tokens.add(item));
      });
    }

    // --------------------------------
    // 3️⃣ Extract meaningful phrases (2–4 words)
    // --------------------------------
    // Keeps: corn syrup solids, artificial color, monosodium glutamate
    const cleaned = text.replace(/[^a-z0-9\s]/g, " ");
    const words = cleaned.split(/\s+/).filter(Boolean);

    for (let i = 0; i < words.length; i++) {
      // single word
      tokens.add(words[i]);

      // 2-word phrase
      if (i + 1 < words.length) {
        tokens.add(`${words[i]} ${words[i + 1]}`);
      }

      // 3-word phrase
      if (i + 2 < words.length) {
        tokens.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
      }
    }
  });

  // --------------------------------
  // 4️⃣ Final cleanup
  // --------------------------------
  return Array.from(tokens)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3); // avoid noise like "an", "or"
}
