export function normalizeIngredients(rawList = []) {
  const normalized = new Set();

  rawList.forEach((item) => {
    if (!item || typeof item !== "string") return;

    const text = item.toLowerCase();

    /* ----------------------------------
       1️⃣ Extract INS / E numbers FIRST
    ---------------------------------- */
    const codes = text.match(/\b(ins|e)\s?\d{3,4}[a-z]?\b/g);
    if (codes) {
      codes.forEach((code) =>
        normalized.add(code.replace(/\s+/g, "")) // ins 476 → ins476
      );
    }

    /* ----------------------------------
       2️⃣ Normalize flavour phrases
    ---------------------------------- */
    if (
      text.includes("artificial flavour") ||
      text.includes("artificial flavor")
    ) {
      normalized.add("artificial flavour");
    }

    if (text.includes("nature identical")) {
      normalized.add("nature identical flavour");
    }

    /* ----------------------------------
       3️⃣ Clean text safely
    ---------------------------------- */
    const cleaned = text
      .replace(/\([^)]*\)/g, " ")     // remove brackets
      .replace(/contains.*$/g, " ")   // remove "contains wheat..." tail
      .replace(/[^a-z\s]/g, " ")      // remove symbols
      .replace(/\s+/g, " ")
      .trim();

    /* ----------------------------------
       4️⃣ Keep only meaningful phrases
    ---------------------------------- */
    const words = cleaned.split(" ");

    if (
      words.length >= 2 &&
      words.length <= 6 &&                 // avoid long garbage
      !cleaned.includes("contains") &&
      !cleaned.includes("substances")
    ) {
      normalized.add(cleaned);
    }
  });

  return Array.from(normalized);
}
