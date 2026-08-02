/**
 * Comprehensive text cleanup for bank PDFs.
 * Handles character-level spacing (Kuda), markdown artifacts, and normalizes output.
 */
export function cleanupBankText(text: string, bankHint?: string): string {
  if (!text || text.trim().length === 0) return "";

  let cleaned = text;

  // Step 1: Strip markdown formatting
  cleaned = stripMarkdown(cleaned);

  // Step 2: Fix character-level spacing (Kuda, etc.)
  cleaned = fixCharacterSpacing(cleaned);

  // Step 3: Normalize whitespace
  cleaned = normalizeWhitespace(cleaned);

  // Step 4: Add transaction line breaks
  cleaned = addTransactionBreaks(cleaned);

  // Step 5: Remove bank footers/disclaimers
  cleaned = removeBankFooters(cleaned);

  return cleaned;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\|/g, " ")           // Remove pipe characters
    .replace(/---+/g, " ")         // Remove table separators
    .replace(/#{1,6}\s/g, "")      // Remove markdown headers
    .replace(/\*\*/g, "")          // Remove bold markers
    .replace(/\*/g, "")            // Remove italic markers
    .replace(/_/g, " ");           // Remove underscores
}

function fixCharacterSpacing(text: string): string {
  const lines = text.split("\n");
  return lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.length === 0) return "";

    // Check if line has character-level spacing
    if (hasCharacterLevelSpacing(trimmed)) {
      return mergeCharacterLevelText(trimmed);
    }
    return trimmed;
  }).join("\n");
}

function hasCharacterLevelSpacing(text: string): boolean {
  const tokens = text.split(/\s+/);
  if (tokens.length < 5) return false;

  const singleCharTokens = tokens.filter(
    (t) => t.length === 1 && /[A-Za-z0-9₦.,\-/:().]/.test(t)
  );

  return singleCharTokens.length / tokens.length > 0.5;
}

function mergeCharacterLevelText(text: string): string {
  // Merge single characters separated by spaces
  let result = text;
  let previous;
  
  do {
    previous = result;
    result = result.replace(/(?<=[A-Za-z0-9₦.,\-/:().]) (?=[A-Za-z0-9₦.,\-/:().])/g, "");
  } while (result !== previous);
  
  return result;
}

function normalizeWhitespace(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/[ \t]{2,}/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

function addTransactionBreaks(text: string): string {
  // Add line breaks before transaction dates (DD/MM/YY or DD-Mon-YYYY patterns)
  let result = text;
  
  // Match dates like 02/02/26, 02-Feb-2026, 02/02/2026
  const datePattern = /(?<!^)(?=\b\d{2}[\/\-]\d{2}[\/\-]\d{2,4}\b)/gm;
  result = result.replace(datePattern, "\n");
  
  // Also match "Page X" markers
  result = result.replace(/(?<!^)(?=Page \d)/g, "\n");
  
  return result;
}

function removeBankFooters(text: string): string {
  const footerPatterns = [
    // Kuda
    /Kuda MF Bank.*?Technologies LTD\.?/gi,
    /All rights reserved\. All deposits are insured.*?NDIC\)/gi,
    /licensed by the Central Bank.*?UK\.?/gi,
    
    // GTBank
    /Guaranty Trust Bank.*?plc/gi,
    
    // Sterling
    /Sterling Bank.*?plc/gi,
    /For Further enquiries.*?sterlingbankng\.com/gi,
    
    // UBA
    /United Bank for Africa.*?plc/gi,
    /Africa's global bank/gi,
    
    // PalmPay
    /PalmPay Limited.*?Nigeria/gi,
    
    // Generic
    /All rights reserved\.?/gi,
    /Customer service.*?helpline/gi,
    /\d{3,4}-\d{3,4}-\d{3,4}/g, // Phone patterns
  ];

  let result = text;
  for (const pattern of footerPatterns) {
    result = result.replace(pattern, "");
  }
  
  return result;
}
