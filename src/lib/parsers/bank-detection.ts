import { BankFormat } from "./types";

export const BANK_FORMAT_TO_NAME: Record<string, string> = {
  "gtbank-csv": "GTBank",
  "gtbank-excel": "GTBank",
  "gtbank-pdf": "GTBank",
  "access-csv": "Access Bank",
  "access-excel": "Access Bank",
  "access-pdf": "Access Bank",
  "uba-csv": "UBA",
  "uba-excel": "UBA",
  "uba-pdf": "UBA",
  "opay-csv": "OPay",
  "opay-pdf": "OPay",
  "palmpay-csv": "PalmPay",
  "palmpay-pdf": "PalmPay",
  "moniepoint-csv": "Moniepoint",
  "moniepoint-pdf": "Moniepoint",
  "kuda-csv": "Kuda Bank",
  "kuda-pdf": "Kuda Bank",
  "firstbank-csv": "First Bank",
  "firstbank-pdf": "First Bank",
  "zenith-csv": "Zenith Bank",
  "zenith-pdf": "Zenith Bank",
};

const KNOWN_BANK_NAMES = [
  "GTBank", "GTB", "Guaranty Trust Bank",
  "Access Bank", "Access",
  "UBA", "United Bank for Africa",
  "OPay", "OPay Nigeria",
  "PalmPay", "Palm Pay",
  "Moniepoint",
  "Kuda", "Kuda Bank", "Kuda MFB",
  "First Bank", "FirstBank", "First Bank of Nigeria",
  "Zenith", "Zenith Bank",
  "Wema Bank", "Wema",
  "Fidelity Bank",
  "Sterling Bank",
  "Union Bank",
  "Polaris Bank",
  "Unity Bank",
  "Stanbic IBTC",
  "Ecobank",
  "Standard Chartered",
  "FCMB", "First City Monument Bank",
  "Jaiz Bank",
  "SunTrust Bank",
  "Heritage Bank",
  "Providus Bank",
  "Titan Trust Bank",
  "Globus Bank",
  "Parallex Bank",
  "Premium Trust Bank",
];

export function detectBankNameFromFormat(format: BankFormat): string | null {
  return BANK_FORMAT_TO_NAME[format] || null;
}

export function extractBankNameFromText(text: string): string | null {
  const lower = text.toLowerCase();
  let bestMatch: string | null = null;
  let bestIndex = text.length;

  for (const name of KNOWN_BANK_NAMES) {
    const idx = lower.indexOf(name.toLowerCase());
    if (idx >= 0 && idx < bestIndex) {
      bestIndex = idx;
      bestMatch = name;
    }
  }

  return bestMatch;
}

export function extractAccountNumber(text: string): string | null {
  // NUBAN: 10-digit number that usually starts with 0-3, 8
  const patterns = [
    /account\s*(?:number|no|#|:)\s*[#:]?\s*(\d{10})/i,
    /acct\s*(?:number|no|#|:)\s*[#:]?\s*(\d{10})/i,
    /a\/c\s*(?:number|no|#|:)\s*[#:]?\s*(\d{10})/i,
    /\b(\d{10})\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }

  return null;
}

export function extractAccountName(text: string): string | null {
  const patterns = [
    /account\s*(?:name|holder)\s*[#:]?\s*(.+?)(?:\n|$)/i,
    /acct\s*(?:name|holder)\s*[#:]?\s*(.+?)(?:\n|$)/i,
    /customer\s*(?:name|:)\s*(.+?)(?:\n|$)/i,
    /name\s*[#:]\s*(.+?)(?:\n|$)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const name = match[1].trim();
      if (name.length >= 3 && name.length <= 100) {
        return name;
      }
    }
  }

  return null;
}
