import { ParsedTransaction } from "@/lib/parsers/types";

export interface NormalizedTransaction extends ParsedTransaction {
  normalizedDescription: string;
  merchantGuess?: string;
  categoryGuess?: string;
}

const NOISE_WORDS = [
  "pos purchase",
  "pos trans",
  "pos terminal",
  "atm withdrawal",
  "atm cash",
  "card purchase",
  "card payment",
  "online purchase",
  "web purchase",
  "mobile purchase",
  "transfer",
  "trf",
  "sent to",
  "received from",
  "funded by",
  "wallet funding",
  "debit",
  "credit",
  "transaction",
  "txn",
  "ref:",
  "reference:",
  "naira",
  "ngn",
  "#",
  "**",
  "__",
];

const LOCATION_KEYWORDS = [
  "lagos",
  "abuja",
  "ph",
  "port harcourt",
  "iben",
  "lekki",
  "ikeja",
  "victoria island",
  "vi",
  "surulere",
  "yaba",
  "mushin",
  "ojodu",
  "ikorodu",
  "lekki phase 1",
  "lekki phase 2",
  "ajah",
  "sangotedo",
  "ikoyi",
  "maryland",
  "ogudu",
  "ojota",
  "ketu",
  "mile 12",
  "oyinbo",
  "wuse",
  "maitama",
  "gwarinpa",
  "lugbe",
  "city centre",
  "mall",
  "plaza",
  "store",
  "shop",
  "outlet",
  "branch",
  "hq",
  "head office",
];

function cleanDescription(desc: string): string {
  let cleaned = desc.toUpperCase().trim();

  // Remove reference numbers
  cleaned = cleaned.replace(/\b\d{6,}\b/g, "");
  cleaned = cleaned.replace(/REF[:\s]*\w+/gi, "");
  cleaned = cleaned.replace(/NARR[:\s]*\w+/gi, "");

  // Remove special characters but keep spaces and hyphens
  cleaned = cleaned.replace(/[^\w\s\-\/]/g, " ");

  // Collapse multiple spaces
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
}

function extractMerchant(cleaned: string): string {
  let merchant = cleaned;

  // Remove noise words
  for (const noise of NOISE_WORDS) {
    merchant = merchant.replace(new RegExp(noise, "gi"), "");
  }

  // Remove location keywords
  for (const loc of LOCATION_KEYWORDS) {
    merchant = merchant.replace(new RegExp(`\\b${loc}\\b`, "gi"), "");
  }

  // Remove numbers that look like card/terminal IDs
  merchant = merchant.replace(/\b\d{4,}\b/g, "");

  // Remove trailing/leading hyphens and spaces
  merchant = merchant.replace(/[\s\-]+/g, " ").trim();

  // If too short, use original
  if (merchant.length < 3) {
    merchant = cleaned;
  }

  return merchant;
}

function guessMerchant(merchant: string): string | undefined {
  const lower = merchant.toLowerCase();

  if (lower.includes("shoprite") || lower.includes("shop rite")) return "Shoprite";
  if (lower.includes("uber")) return "Uber";
  if (lower.includes("bolt")) return "Bolt";
  if (lower.includes("netflix")) return "Netflix";
  if (lower.includes("spotify")) return "Spotify";
  if (lower.includes("dstv")) return "Dstv";
  if (lower.includes("jumia")) return "Jumia";
  if (lower.includes("flutterwave") || lower.includes("rave")) return "Flutterwave";
  if (lower.includes("paystack")) return "Paystack";
  if (lower.includes("mtn")) return "MTN";
  if (lower.includes("airtel")) return "Airtel";
  if (lower.includes("glo")) return "Glo";
  if (lower.includes("9mobile") || lower.includes("etisalat")) return "9mobile";
  if (lower.includes("moniepoint")) return "Moniepoint";
  if (lower.includes("opay")) return "OPay";
  if (lower.includes("palmpay")) return "PalmPay";
  if (lower.includes("kuda")) return "Kuda";
  if (lower.includes("bet9ja")) return "Bet9ja";
  if (lower.includes("sportybet")) return "Sportybet";
  if (lower.includes("ikeja electric") || lower.includes("ikedc")) return "Ikeja Electric";
  if (lower.includes("eko electric") || lower.includes("ekedc")) return "Eko Electric";
  if (lower.includes("abuja electric") || lower.includes("aedc")) return "Abuja Electric";

  return undefined;
}

function guessCategory(merchantGuess: string | undefined, desc: string): string | undefined {
  const lower = (merchantGuess || desc).toLowerCase();

  if (["shoprite", "jumia"].some(m => lower.includes(m))) return "Supermarket";
  if (["uber", "bolt"].some(m => lower.includes(m))) return "Transport";
  if (["netflix", "spotify", "dstv"].some(m => lower.includes(m))) return "Subscription";
  if (["mtn", "airtel", "glo", "9mobile"].some(m => lower.includes(m))) return "Bills";
  if (["ikeja electric", "eko electric", "abuja electric"].some(m => lower.includes(m))) return "Bills";
  if (["flutterwave", "paystack"].some(m => lower.includes(m))) return "Business";
  if (["bet9ja", "sportybet", "betway"].some(m => lower.includes(m))) return "Others";
  if (lower.includes("salary") || lower.includes("sal")) return "Salary";
  if (lower.includes("rent")) return "Rent";
  if (lower.includes("school") || lower.includes("tuition")) return "School";
  if (lower.includes("hospital") || lower.includes("pharmacy") || lower.includes("medical")) return "Health";
  if (lower.includes("fuel") || lower.includes("petrol") || lower.includes("total") || lower.includes("mobil")) return "Fuel";
  if (lower.includes("transfer") || lower.includes("trf")) return "Transfer";
  if (lower.includes("atm")) return "ATM";
  if (lower.includes("pos")) return "POS";
  if (lower.includes("gift")) return "Gift";
  if (lower.includes("loan") || lower.includes("repay")) return "Loan";
  if (lower.includes("interest")) return "Interest";

  return undefined;
}

export function normalizeTransactions(transactions: ParsedTransaction[]): NormalizedTransaction[] {
  return transactions.map(tx => {
    const cleaned = cleanDescription(tx.description);
    const merchant = extractMerchant(cleaned);
    const merchantGuess = guessMerchant(cleaned);
    const categoryGuess = guessCategory(merchantGuess, cleaned);

    return {
      ...tx,
      normalizedDescription: merchant || cleaned,
      merchantGuess,
      categoryGuess,
    };
  });
}

export function cleanDescriptionRaw(desc: string): string {
  return cleanDescription(desc);
}

export function extractMerchantRaw(desc: string): string {
  const cleaned = cleanDescription(desc);
  return extractMerchant(cleaned);
}
