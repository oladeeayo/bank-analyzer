export interface UserIdentity {
  fullName: string;
  surname: string;
}

export interface ContextMatch {
  categoryName: string;
  subCategoryName: string | null;
  confidence: number;
  reason: string;
  merchantGuess?: string;
}

// Nigerian POS cash amounts (₦5,000 + ₦100 fee = ₦5,100, etc.)
const POS_AMOUNTS = new Set([
  5050, 5100, 5150, 5200,
  10100, 10150, 10200, 10250, 10300, 10500,
  15100, 15200, 15300, 15500,
  20100, 20200, 20300, 20400, 20500,
  30100, 30200, 30300, 30400, 30500,
  50100, 50200, 50300, 50500,
  100100, 100200, 100500,
]);

const POS_KEYWORDS = /POS|MONIEPOINT|GBENGA\s*POS|AGENT|ENTERPRISE|VENTURES|GLOBAL\s*SERVICES|MFB|MICRO\s*FINANCE|9PSB|POCKETAPP|PAGA|KUDA\s*MFB|OPAY\s*MFB|PALMPAY\s*MFB/i;

const STATUTORY_PATTERNS: Array<{ pattern: RegExp; name: string; confidence: number }> = [
  { pattern: /STAMP\s*DUTY/i, name: "Stamp Duty", confidence: 1.0 },
  { pattern: /ELECTRONIC\s*MONEY\s*TRANSFER|EMTL/i, name: "EMTL", confidence: 1.0 },
  { pattern: /SMS\s*(ALERT|CHARGE)/i, name: "SMS Alert Charges", confidence: 0.98 },
  { pattern: /CARD\s*MAINTENANCE|ACCOUNT\s*MAINTENANCE/i, name: "Account Maintenance", confidence: 0.95 },
  { pattern: /\bVAT\b/i, name: "VAT", confidence: 0.95 },
  { pattern: /LEDGER\s*FEE/i, name: "Ledger Fee", confidence: 0.95 },
  { pattern: /COMMISSION/i, name: "Commission", confidence: 0.9 },
  { pattern: /SERVICE\s*CHARGE/i, name: "Service Charge", confidence: 0.9 },
];

const SAVINGS_PATTERNS: Array<{ pattern: RegExp; name: string; confidence: number }> = [
  { pattern: /OWEALTH\s*INTEREST|CASHBOX\s*INTEREST|SAVINGS\s*INTEREST|YIELD/i, name: "Interest", confidence: 1.0 },
  { pattern: /AUTO[\s-]SAVE|CASHBOX\s*AUTO|SAFEBOX|PIGGYVEST|COWRYWISE/i, name: "Savings", confidence: 0.95 },
  { pattern: /OWEALTH\s*(BALANCE|WITHDRAWAL)/i, name: "OWealth", confidence: 0.9 },
];

export function extractCounterparty(description: string): {
  counterparty: string | null;
  institution: string | null;
  accountOrPhone: string | null;
  channel: "MOBILE" | "WEB" | "POS" | "ATM" | "USSD" | "OTHER";
  isTransfer: boolean;
  transferDirection: "inbound" | "outbound" | null;
} {
  const raw = description.trim();

  // Detect channel
  let channel: "MOBILE" | "WEB" | "POS" | "ATM" | "USSD" | "OTHER" = "OTHER";
  if (/POS|GBENGA\s*POS|AGENT|TERMINAL/i.test(raw)) channel = "POS";
  else if (/USSD/i.test(raw)) channel = "USSD";
  else if (/\bATM\b/i.test(raw)) channel = "ATM";
  else if (/WEB|INTERSWITCH|PAYSTACK|FLUTTERWAVE|RAVE/i.test(raw)) channel = "WEB";
  else if (/MOBILE|APP|TRANSFER/i.test(raw)) channel = "MOBILE";

  // Detect transfer direction
  let transferDirection: "inbound" | "outbound" | null = null;
  if (/Transfer\s+to|Send\s+to|Payment\s+to/i.test(raw)) transferDirection = "outbound";
  else if (/Transfer\s+from|Received?\s+from|Funded?\s+by/i.test(raw)) transferDirection = "inbound";

  const isTransfer = /transfer|send|received|funded/i.test(raw);

  let counterparty: string | null = null;
  let institution: string | null = null;
  let accountOrPhone: string | null = null;

  // Pipe-separated format (OPay / Moniepoint)
  // "Transfer to NAME | BANK | ACC_NO"
  if (raw.includes("|")) {
    const parts = raw.split("|").map((p) => p.trim());

    // Extract counterparty from first part (strip prefix)
    let namePart = parts[0]
      .replace(/^(Transfer\s+(to|from)|Send\s+to|Received?\s+from|Payment\s+to|Funded\s+by)\s+/i, "")
      .replace(/\s+/g, " ")
      .trim();
    counterparty = namePart || null;

    // Extract institution from second part
    if (parts.length >= 2 && parts[1]) {
      institution = parts[1].toUpperCase().trim();
    }

    // Extract account/phone from third part
    if (parts.length >= 3 && parts[2]) {
      accountOrPhone = parts[2].replace(/\*/g, "").trim();
    }
  }
  // Sentence format (PalmPay / GTB / Access)
  else {
    const match = raw.match(
      /(?:Send\s+to|Received?\s+from|Transfer\s+(to|from)|Payment\s+to|Funded\s+by)\s+(.+)/i
    );
    if (match) {
      counterparty = match[1]
        .replace(/\s*Ref:.*$/i, "")
        .replace(/\s*-\s+\d+.*$/, "")
        .replace(/\s*\(\w+\)\s*$/, "")
        .trim();
    }
  }

  return { counterparty, institution, accountOrPhone, channel, isTransfer, transferDirection };
}

export function matchSelfTransfer(
  description: string,
  user: UserIdentity
): ContextMatch | null {
  if (!user.fullName || user.fullName.length < 3) return null;

  const cleanUser = user.fullName.toUpperCase().replace(/\s+/g, " ").trim();
  const descUpper = description.toUpperCase();

  if (descUpper.includes(cleanUser)) {
    return {
      categoryName: "Banking & Financial",
      subCategoryName: "Self Transfer",
      confidence: 1.0,
      reason: "Matched user full name",
    };
  }

  return null;
}

export function matchFamilyTransfer(
  description: string,
  user: UserIdentity,
  isCredit: boolean
): ContextMatch | null {
  if (!user.surname || user.surname.length < 3) return null;

  const cleanSurname = user.surname.toUpperCase().trim();
  const cleanFullName = user.fullName.toUpperCase().replace(/\s+/g, " ").trim();
  const descUpper = description.toUpperCase();

  // Must match surname but NOT full name (that's self-transfer)
  if (descUpper.includes(cleanSurname) && !descUpper.includes(cleanFullName)) {
    return {
      categoryName: "Family",
      subCategoryName: isCredit ? "Family Support" : "Family",
      confidence: 0.92,
      reason: "Surname match (likely family)",
    };
  }

  return null;
}

export function matchPOSCashWithdrawal(
  description: string,
  amount: number,
  isCredit: boolean
): ContextMatch | null {
  if (isCredit) return null;
  if (!POS_AMOUNTS.has(Math.round(amount))) return null;
  if (!POS_KEYWORDS.test(description)) return null;

  return {
    categoryName: "Banking & Financial",
    subCategoryName: "POS Cash Withdrawal",
    confidence: 0.88,
    reason: "Nigerian POS amount pattern (amount + agent fee)",
  };
}

export function matchStatutoryFee(description: string): ContextMatch | null {
  for (const { pattern, name, confidence } of STATUTORY_PATTERNS) {
    if (pattern.test(description)) {
      return {
        categoryName: "Banking & Financial",
        subCategoryName: name,
        confidence,
        reason: `Statutory/bank fee: ${name}`,
      };
    }
  }
  return null;
}

export function matchSavingsYield(description: string): ContextMatch | null {
  for (const { pattern, name, confidence } of SAVINGS_PATTERNS) {
    if (pattern.test(description)) {
      const isCredit = /interest|yield|earned/i.test(description);
      return {
        categoryName: "Savings & Investments",
        subCategoryName: name,
        confidence,
        reason: isCredit ? `Savings yield: ${name}` : `Savings transfer: ${name}`,
      };
    }
  }
  return null;
}

export function evaluateContextRules(
  description: string,
  amount: number,
  isCredit: boolean,
  user: UserIdentity
): ContextMatch | null {
  // Priority order matters - self transfer is highest
  return (
    matchSelfTransfer(description, user) ||
    matchStatutoryFee(description) ||
    matchSavingsYield(description) ||
    matchPOSCashWithdrawal(description, amount, isCredit) ||
    matchFamilyTransfer(description, user, isCredit)
  );
}
