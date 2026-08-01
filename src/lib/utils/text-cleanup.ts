/**
 * Fixes character-level spacing issues from PDFs that position each character separately.
 * Examples: "A c c o u n t" → "Account", "O L A D A Y O" → "OLADAYO"
 */
export function fixCharacterSpacing(text: string): string {
  // First, strip markdown table formatting
  let cleaned = text
    .replace(/\|/g, " ")  // Remove pipe characters
    .replace(/---+/g, " ") // Remove table separator lines
    .replace(/#{1,6}\s/g, ""); // Remove markdown headers

  // Split into lines and process each
  return cleaned
    .split("\n")
    .map((line) => fixLineSpacing(line))
    .join("\n");
}

function fixLineSpacing(line: string): string {
  const trimmed = line.trim();
  if (trimmed.length === 0) return "";

  // Check if line has character-level spacing (most characters are single letters)
  if (hasCharacterLevelSpacing(trimmed)) {
    return mergeCharacterLevelText(trimmed);
  }

  return trimmed;
}

function hasCharacterLevelSpacing(text: string): boolean {
  const tokens = text.split(/\s+/);
  if (tokens.length < 5) return false;

  // Count single-character tokens (including numbers, naira sign, punctuation)
  const singleCharTokens = tokens.filter(
    (t) => t.length === 1 && /[A-Za-z0-9₦.,\-/:().]/.test(t)
  );

  // If more than 50% are single characters, it's character-level
  return singleCharTokens.length / tokens.length > 0.5;
}

function mergeCharacterLevelText(text: string): string {
  // Remove ALL single spaces between alphanumeric/symbol characters
  // This aggressively merges "O L A D A Y O" → "OLADAYO"
  // Also handles "0 2 /0 2 /2 6" → "02/02/26"
  let result = text.replace(/(?<=[A-Za-z0-9₦.,\-/:().]) (?=[A-Za-z0-9₦.,\-/:().])/g, "");
  
  // Keep trying until no more merges possible
  let previous;
  do {
    previous = result;
    result = result.replace(/(?<=[A-Za-z0-9₦.,\-/:().]) (?=[A-Za-z0-9₦.,\-/:().])/g, "");
  } while (result !== previous);
  
  return result;
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
