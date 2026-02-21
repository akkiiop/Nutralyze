export function parseIngredients(text = "") {
  if (!text) return [];

  let t = text
    .toLowerCase()
    .replace(/^ingredients:/i, "")
    .replace(/\s+/g, " ")
    .trim();

  // Protect parentheses
  const blocks = [];
  t = t.replace(/\([^)]*\)/g, m => {
    const key = `__P${blocks.length}__`;
    blocks.push(m);
    return key;
  });

  // Split structurally
  let parts = t.split(/,|;|\s&\s/);
  parts = parts.flatMap(p => p.split(/(?<=\d%\))\s+/));

  // Restore parentheses
  parts = parts.map(p =>
    blocks.reduce((acc, b, i) => acc.replace(`__P${i}__`, b), p)
  );

  return parts.map(p => p.trim()).filter(p => p.length > 2);
}
