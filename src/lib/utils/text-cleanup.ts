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
  const trimmed = line.trim();
  if (trimmed.length === 0) return line;

  // Check if entire line is character-level spaced
  if (isCharacterLevelText(trimmed)) {
    return mergeCharacterLevelText(trimmed);
  }

  // Otherwise, process segments separated by 2+ spaces
  const words = trimmed.split(/(\s{2,})/);
  return words
    .map((segment) => {
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
  if (tokens.length < 3) return false;

  const singleCharTokens = tokens.filter(
    (t) => t.length === 1 && /[A-Za-z0-9₦.,\-/:()]/.test(t)
  );

  // If more than 60% of tokens are single characters, it's likely char-level
  return singleCharTokens.length / tokens.length > 0.6;
}

function mergeCharacterLevelText(text: string): string {
  // Remove ALL single spaces between alphanumeric/symbol characters
  // This aggressively merges "O L A D A Y O" → "OLADAYO"
  return text.replace(/(?<=[A-Za-z0-9₦.,\-/:().]) (?=[A-Za-z0-9₦.,\-/:().])/g, "");
}

/**
 * Normalizes whitespace in extracted text.
 * Collapses multiple spaces, trims lines, etc.
 */
export function normalizeWhitespace(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      // Collapse multiple spaces but preserve single spaces in words
      return line.replace(/[ \t]{2,}/g, " ").trim();
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}
