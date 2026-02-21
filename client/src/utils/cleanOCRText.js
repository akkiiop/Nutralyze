export function cleanOCRText(rawText = "") {
  if (!rawText) return "";

  return rawText
    // Fix broken hyphen words
    .replace(/-\s+/g, "-")

    // Fix broken percentages: "(50 " → "(50%) "
    .replace(/\((\d+)\s+/g, "($1%) ")

    // Normalize spaces
    .replace(/\s+/g, " ")

    .trim();
}
