export function filterLikelyIngredients(words = []) {
  return words
    .filter(w => {
      const text = w.text?.toLowerCase() || "";

      // remove numbers & short junk
      if (text.length < 3) return false;
      if (/\d/.test(text)) return false;

      // remove common non-ingredient words
      const blacklist = [
        "regd", "office", "india", "fssai", "license",
        "lic", "address", "batch", "date", "customer",
        "care", "executive", "manufactured", "packaged",
        "imported", "net", "weight"
      ];

      if (blacklist.some(b => text.includes(b))) return false;

      // keep alphabetic food-like words
      return /^[a-z\s\-]+$/.test(text);
    })
    .map(w => w.text);
}
