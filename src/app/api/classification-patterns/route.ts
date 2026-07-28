import { NextResponse } from "next/server";

const KEYWORD_PATTERNS = [
  { patterns: ["auto-save", "savings to/from", "save to/into", "owealth balance"], categoryName: "Savings", confidence: 0.85 },
  { patterns: ["salary", "wages", "payroll", "income"], categoryName: "Income", confidence: 0.9 },
  { patterns: ["electricity", "power supply/bill/payment", "ikeja electric", "bedc", "ibedc", "aedc", "kedco", "phcn", "prepaid meter", "capricorn", "kwh"], categoryName: "Utilities", confidence: 0.95 },
  { patterns: ["water board/supply/bill/payment", "water vendor"], categoryName: "Utilities", confidence: 0.9 },
  { patterns: ["airtime", "data bundle/plan/purchase", "recharge", "vtu", "glo data", "mtn data", "9mobile", "airtel data"], categoryName: "Utilities", confidence: 0.9 },
  { patterns: ["spotify", "netflix", "showmax", "dstv", "youtube premium/music", "apple music/tv", "prime video", "hulu", "disney+", "iroll", "tv subscription"], categoryName: "Entertainment", confidence: 0.95 },
  { patterns: ["restaurant", "food vendor/court/delivery", "chicken republic", "pizza", "dominos", "kfc", "burger king", "eatwell", "buka", "mama put", "canteen"], categoryName: "Food & Dining", confidence: 0.85 },
  { patterns: ["uber", "bolt", "taxify", "ride share/hailing", "transport fare/payment", "bus fare/ticket", "danfo", "keke", "okada"], categoryName: "Transportation", confidence: 0.9 },
  { patterns: ["shoprite", "jumia", "konga", "slot", "computer village", "market", "mall", "store", "retail"], categoryName: "Shopping", confidence: 0.8 },
  { patterns: ["hospital", "pharmacy", "clinic", "medical", "health care/insurance", "drug", "lab test/result"], categoryName: "Healthcare", confidence: 0.85 },
  { patterns: ["school", "university", "college", "tuition", "course", "exam", "jamb", "waec", "neco"], categoryName: "Education", confidence: 0.85 },
  { patterns: ["rent", "landlord", "accommodation", "house rent/payment", "mortgage"], categoryName: "Housing", confidence: 0.85 },
  { patterns: ["investment", "dividend", "mutual fund", "stock", "treasury bills", "fixed deposit", "bond", "crypto", "bitcoin"], categoryName: "Savings & Investments", confidence: 0.85 },
  { patterns: ["bet9ja", "sportybet", "betway", "betting", "gambling", "casino", "lottery"], categoryName: "Entertainment", confidence: 0.8 },
  { patterns: ["pos purchase/terminal/trans", "atm withdrawal/cash", "card purchase/payment"], categoryName: "Banking & Financial", confidence: 0.7 },
  { patterns: ["transfer", "trf", "sent to", "received from"], categoryName: "Banking & Financial", confidence: 0.6 },
];

export async function GET() {
  return NextResponse.json(KEYWORD_PATTERNS);
}
