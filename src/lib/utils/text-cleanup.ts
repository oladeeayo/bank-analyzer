/**
 * Comprehensive text cleanup for bank PDFs.
 * Handles character-level spacing (Kuda), markdown artifacts, and normalizes output.
 */
export function cleanupBankText(text: string): string {
  if (!text || text.trim().length === 0) return "";

  let cleaned = text;

  // Step 1: Remove ALL markdown/table formatting aggressively
  cleaned = cleaned
    .replace(/\|/g, " ")           // Remove pipe characters
    .replace(/---+/g, " ")         // Remove table separators
    .replace(/#{1,6}\s*/g, "")     // Remove markdown headers
    .replace(/\*\*/g, "")          // Remove bold markers
    .replace(/\*/g, "")            // Remove italic markers
    .replace(/_{2,}/g, " ")        // Remove multiple underscores
    .replace(/\n\s*\n/g, "\n");    // Remove empty lines

  // Step 2: Fix character-level spacing (Kuda style)
  // First, merge characters within table cells (between pipes)
  const lines = cleaned.split("\n");
  const mergedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.length === 0) return "";
    
    // If line has lots of single chars with spaces, merge them
    if (hasCharacterLevelSpacing(trimmed)) {
      return mergeCharacterLevelText(trimmed);
    }
    return trimmed;
  });
  cleaned = mergedLines.join("\n");

  // Step 3: Remove Kuda bank footer/disclaimer
  cleaned = cleaned.replace(/Kuda MF Bank.*?Technologies LTD\.?/gi, "");
  cleaned = cleaned.replace(/All rights reserved.*?NDIC\)/gi, "");
  cleaned = cleaned.replace(/licensed by the Central Bank.*?UK\.?/gi, "");
  cleaned = cleaned.replace(/Kuda.*?Technologies.*?LTD/gi, "");

  // Step 4: Normalize whitespace
  cleaned = cleaned
    .replace(/[ \t]{2,}/g, " ")     // Multiple spaces to single
    .replace(/^\s+$/gm, "")         // Empty lines
    .replace(/\n{3,}/g, "\n\n");    // Max 2 newlines

  // Step 5: Add line breaks before dates for transaction separation
  // Match DD/MM/YY or DD/MM/YYYY patterns
  cleaned = cleaned.replace(/(\d{2}\/\d{2}\/\d{2,4})/g, "\n$1");
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n"); // Clean up extra newlines

  return cleaned.trim();
}

function hasCharacterLevelSpacing(text: string): boolean {
  const tokens = text.split(/\s+/);
  if (tokens.length < 5) return false;

  const singleCharTokens = tokens.filter(
    (t) => t.length === 1 && /[A-Za-z0-9₦.,\-/:().]/.test(t)
  );

  // If more than 40% are single characters, it's character-level
  return singleCharTokens.length / tokens.length > 0.4;
}

function mergeCharacterLevelText(text: string): string {
  // Merge single characters separated by spaces
  // This handles "O L A D A Y O" → "OLADAYO"
  let result = text;
  let previous;
  
  do {
    previous = result;
    result = result.replace(/(?<=[A-Za-z0-9₦.,\-/:().]) (?=[A-Za-z0-9₦.,\-/:().])/g, "");
  } while (result !== previous);
  
  return result;
}
