export const MERCHANT_PATTERNS: Record<string, { keywords: string[]; category: string }> = {
  "Shoprite": { keywords: ["shoprite", "shop rite"], category: "Supermarket" },
  "Uber": { keywords: ["uber"], category: "Transport" },
  "Bolt": { keywords: ["bolt"], category: "Transport" },
  "Netflix": { keywords: ["netflix"], category: "Subscription" },
  "Spotify": { keywords: ["spotify"], category: "Subscription" },
  "Dstv": { keywords: ["dstv", "dstvng", "dstv ng"], category: "Subscription" },
  "Jumia": { keywords: ["jumia", "jumia food"], category: "Shopping" },
  "Flutterwave": { keywords: ["flutterwave", "rave"], category: "Business" },
  "Paystack": { keywords: ["paystack"], category: "Business" },
  "MTN": { keywords: ["mtn", "mtn ng"], category: "Bills" },
  "Airtel": { keywords: ["airtel"], category: "Bills" },
  "Glo": { keywords: ["glo", "glo ng"], category: "Bills" },
  "9mobile": { keywords: ["9mobile", "etisalat"], category: "Bills" },
  "Ikeja Electric": { keywords: ["ikeja electric", "ikedc"], category: "Bills" },
  "Eko Electric": { keywords: ["eko electric", "ekedc"], category: "Bills" },
  "Abuja Electric": { keywords: ["abuja electric", "aedc"], category: "Bills" },
  "Port Harcourt Electric": { keywords: ["port harcourt", "phedc"], category: "Bills" },
  "Bet9ja": { keywords: ["bet9ja", "bet 9ja"], category: "Others" },
  "Sportybet": { keywords: ["sportybet", "sporty bet"], category: "Others" },
  "Betway": { keywords: ["betway", "bet way"], category: "Others" },
};

export const TRANSFER_KEYWORDS = [
  "transfer",
  "trf",
  "sent",
  "received",
  "funding",
  "self",
  "own",
  "wallet",
];

export const POS_KEYWORDS = ["pos purchase", "pos terminal", "pos trans"];

export const ATM_KEYWORDS = ["atm", "atm withdrawal", "atm cash"];

export const CARD_KEYWORDS = ["card", "card payment", "card purchase"];
