export function splitIngredientsSafely(text = "") {
  if (!text) return [];

  // 1️⃣ Normalize base text
  const normalized = text
    .toLowerCase()
    .replace(/^ingredients:/i, "")
    .replace(/\s+/g, " ")
    .trim();

  // 2️⃣ Primary split: commas, semicolons
  let parts = normalized.split(/[,;]+/);

  // 3️⃣ Secondary split: brackets boundaries
  parts = parts.flatMap(part =>
    part.split(/(?<=\))\s+/)
  );

  // 4️⃣ Merge fragments intelligently (universal rule)
  const result = [];
  let buffer = "";

  for (const part of parts) {
    const p = part.trim();
    if (!p) continue;

    // If fragment looks incomplete, merge
    if (
      buffer &&
      !/[)\]]$/.test(buffer) &&
      !/\d%$/.test(buffer)
    ) {
      buffer += " " + p;
    } else {
      if (buffer) result.push(buffer);
      buffer = p;
    }
  }

  if (buffer) result.push(buffer);

  // 5️⃣ Final cleanup
  return result
    .map(s => s.trim())
    .filter(s => s.length > 2);
}
