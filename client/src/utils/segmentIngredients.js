export function segmentIngredients(lines = []) {
  const ingredients = [];
  let current = "";

  lines.forEach((line) => {
    const text = line.trim();
    if (!text) return;

    // If line starts a new ingredient
    if (
      /^[a-zA-Z]/.test(text) &&
      (
        text.includes("flour") ||
        text.includes("semolina") ||
        text.includes("oil") ||
        text.includes("powder") ||
        text.includes("salt") ||
        text.includes("leaves") ||
        text.includes("acid")
      )
    ) {
      if (current) ingredients.push(current);
      current = text;
    } 
    // Otherwise, it's a continuation
    else {
      current += " " + text;
    }
  });

  if (current) ingredients.push(current);

  return ingredients;
}
