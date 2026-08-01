/**
 * Fixes character-level spacing issues from PDFs that position each character separately.
 * Examples: "A c c o u n t" → "Account", "O L A D A Y O" → "OLADAYO"
 */
export function fixCharacterSpacing(text: string): string {
  // Split into lines and process each
  return text
    .split("\n")
    .map((line) => fixLineSpacing(line))
    .join("\n");
}

function fixLineSpacing(line: string): string {
  // If line is mostly single characters separated by spaces, merge them
  const words = line.split(/(\s{2,})/); // Split on 2+ spaces (word boundaries)

  return words
    .map((segment) => {
      // If segment has lots of single chars with single spaces, it's likely char-level
      if (isCharacterLevelText(segment)) {
        return mergeCharacterLevelText(segment);
      }
      return segment;
    })
    .join("");
}

function isCharacterLevelText(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 3) return false;

  // Count single-letter "words" (characters between spaces)
  const tokens = trimmed.split(/\s+/);
  const singleCharTokens = tokens.filter((t) => t.length === 1 && /[A-Za-z0-9₦.,\-/:]/.test(t));

  // If more than 70% of tokens are single characters, it's likely char-level
  return singleCharTokens.length / tokens.length > 0.7 && tokens.length > 5;
}

function mergeCharacterLevelText(text: string): string {
  // Remove single spaces between single characters but preserve intentional spaces
  return text.replace(/(?<=[A-Za-z0-9₦.,\-/:]) (?=[A-Za-z0-9₦.,\-/:])/g, "");
}

/**
 * Normalizes whitespace in extracted text.
 * Collapses multiple spaces, trims lines, etc.
 */
export function normalizeWhitespace(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}
