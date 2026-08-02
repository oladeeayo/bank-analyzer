export interface KudaTransaction {
  date: string;
  time: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  counterparty: string;
  bank: string | null;
  accountNumber: string | null;
  description: string;
  balance: number;
}

export function parseKudaReconstruction(reconstructedText: string): KudaTransaction[] {
  const lines = reconstructedText.split("\n");
  const results: KudaTransaction[] = [];

  // Filter out headers, disclaimers, and footers
  const cleanLines = lines.filter((line) => {
    const l = line.trim();
    if (!l) return false;
    if (/KudaMFBank|CentralBankofNigeria|FinsburyPavement|AllStatements|SpendAccount|MoneyInMoneyOut|licensedby|Technology|RC796975|NDIC|Corporation/i.test(l)) {
      return false;
    }
    return true;
  });

  // Re-join and split on Date Timestamps: DD/MM/YY
  const fullContent = cleanLines.join("\n");
  const dateRegex = /(\b\d{2}\/\d{2}\/\d{2}\b)/g;
  const dateMatches = [...fullContent.matchAll(dateRegex)];

  for (let i = 0; i < dateMatches.length; i++) {
    const dateStr = dateMatches[i][0];
    const startIndex = dateMatches[i].index!;
    const endIndex = dateMatches[i + 1] ? dateMatches[i + 1].index! : fullContent.length;

    let block = fullContent.substring(startIndex, endIndex).replace(/\n/g, " ").trim();

    // Skip if block is too short (likely header/footer noise)
    if (block.length < 20) continue;

    // 1. Extract Time
    const timeMatch = block.match(/\b(\d{2}:\d{2}:\d{2})\b/);
    const timeStr = timeMatch ? timeMatch[1] : "";

    // 2. Extract Balance at the end (e.g., ₦-36,642.54 or ₦10,747.54)
    const balanceMatch = block.match(/₦\s*(-?[\d,]+\.\d{2})\s*$/);
    const balanceVal = balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, "")) : 0;

    // 3. Extract Primary Amount (first ₦ value)
    const amountMatch = block.match(/₦\s*([\d,]+\.?\d*)/);
    const amountVal = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, "")) : 0;

    if (amountVal === 0) continue;

    // 4. Determine Direction
    const isCredit = /inward/i.test(block);
    const type: "CREDIT" | "DEBIT" = isCredit ? "CREDIT" : "DEBIT";

    // 5. Clean Description
    let details = block
      .replace(dateStr, "")
      .replace(timeStr, "")
      .replace(/₦\s*-?[\d,]+\.?\d*/g, "")
      .replace(/inward|outward|transfer|localfund|loanamount|smartoverdraft|charges|interest|application|airtime|bills|purchase/gi, "")
      .trim();

    // Split by slashes for counterparty/bank details
    const parts = details.split("/").map((p) => p.trim());
    
    let counterparty = parts[0] || "Unknown";
    let bank = parts.length > 2 ? parts[2] : parts.length > 1 ? parts[1] : null;
    let accountNumber = parts.length > 1 && /^\d{5,}$/.test(parts[1]) ? parts[1] : null;
    let description = parts.length > 1 ? parts[parts.length - 1] : details;

    results.push({
      date: dateStr,
      time: timeStr,
      amount: amountVal,
      type,
      counterparty: formatName(counterparty),
      bank,
      accountNumber,
      description: formatName(description),
      balance: balanceVal,
    });
  }

  return results;
}

function formatName(str: string): string {
  // Add spaces before camelCase or glued capitalized words
  return str
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}
