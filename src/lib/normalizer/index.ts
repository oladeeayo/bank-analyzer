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
  "internet",
  "itf",
  "ibt",
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
  "nigeria",
  "ng",
];

const MERCHANT_DB: Record<string, { name: string; category: string; keywords: string[] }> = {
  // Supermarkets & Groceries
  shoprite: { name: "Shoprite", category: "Supermarket", keywords: ["shoprite", "shop rite", "shoprite hypermarket"] },
  spar: { name: "Spar", category: "Supermarket", keywords: ["spar", "spar express"] },
  hubmart: { name: "Hubmart", category: "Supermarket", keywords: ["hubmart", "hub mart"] },
  lifesize: { name: "Lifesize", category: "Supermarket", keywords: ["lifesize", "life size"] },
  panteka: { name: "Panteka", category: "Supermarket", keywords: ["panteka"] },
  citydia: { name: "Citydia", category: "Supermarket", keywords: ["citydia", "city dia"] },
  bienvenue: { name: "Bienvenue", category: "Supermarket", keywords: ["bienvenue"] },
  figue: { name: "Figue", category: "Supermarket", keywords: ["figue"] },
  market: { name: "Market", category: "Supermarket", keywords: ["market", "market place", "open market"] },
  chicken: { name: "Chicken Republic", category: "Food & Dining", keywords: ["chicken republic", "chicken rep"] },
  kfc: { name: "KFC", category: "Food & Dining", keywords: ["kfc", "kfc Nigeria"] },
  dominos: { name: "Dominos Pizza", category: "Food & Dining", keywords: ["dominos", "domino pizza", "dominos pizza"] },
  pizza: { name: "Pizza", category: "Food & Dining", keywords: ["pizza", "pizza hut", "papa john"] },
  burger: { name: "Burger", category: "Food & Dining", keywords: ["burger", "burger king", "mc donald"] },
  taco: { name: "Taco Bell", category: "Food & Dining", keywords: ["taco", "taco bell"] },
  subway: { name: "Subway", category: "Food & Dining", keywords: ["subway"] },
  starbucks: { name: "Starbucks", category: "Food & Dining", keywords: ["starbucks"] },
  coffee: { name: "Coffee Shop", category: "Food & Dining", keywords: ["coffee", "cafe", "cafeone", "buka"] },
  restaurant: { name: "Restaurant", category: "Food & Dining", keywords: ["restaurant", "restuarant", "eatery", "buka", "canteen", "bar", "lounge", "pub", "tavern"] },
  food: { name: "Food Purchase", category: "Food & Dining", keywords: ["food", "meal", "lunch", "dinner", "breakfast", "snack", "chops"] },
  
  // Transport & Ride Hailing
  uber: { name: "Uber", category: "Transport", keywords: ["uber", "uber trip", "uber eats", "uber bv"] },
  bolt: { name: "Bolt", category: "Transport", keywords: ["bolt", "bolt ride", "taxify"] },
  inDrive: { name: "InDrive", category: "Transport", keywords: ["indrive", "in drive"] },
  gokada: { name: "Gokada", category: "Transport", keywords: ["gokada"] },
  opay_transport: { name: "OPay Transport", category: "Transport", keywords: ["opay transport", "opay ride"] },
  lagbus: { name: "LagBus", category: "Transport", keywords: ["lagbus", "lag bus"] },
  BRT: { name: "BRT", category: "Transport", keywords: ["brt", "brt lagos"] },
  fuel: { name: "Fuel Station", category: "Fuel", keywords: ["fuel", "petrol", "petrol station", "filling station", "total", "total Nigeria", "mobil", "mobil Nigeria", " NNPC", " NNPC filling", "oando", "oando Nigeria", "atmc", "atmc Nigeria"] },
  
  // Telecoms
  mtn: { name: "MTN", category: "Bills & Subscriptions", keywords: ["mtn", "mtn ng", "mtn nigeria", "mtn airtime", "mtn data"] },
  airtel: { name: "Airtel", category: "Bills & Subscriptions", keywords: ["airtel", "airtel ng", "airtel nigeria"] },
  glo: { name: "Glo", category: "Bills & Subscriptions", keywords: ["glo", "glo ng", "glo nigeria", "glo data"] },
  mobile9: { name: "9mobile", category: "Bills & Subscriptions", keywords: ["9mobile", "etisalat", "etisalat nigeria"] },
  
  // Electricity
  ikeja_electric: { name: "Ikeja Electric", category: "Bills & Subscriptions", keywords: ["ikeja electric", "ikedc", "ikeja disco"] },
  eko_electric: { name: "Eko Electric", category: "Bills & Subscriptions", keywords: ["eko electric", "ekedc", "eko disco"] },
  abuja_electric: { name: "Abuja Electric", category: "Bills & Subscriptions", keywords: ["abuja electric", "aedc", "abuja disco"] },
  ph_electric: { name: "Port Harcourt Electric", category: "Bills & Subscriptions", keywords: ["port harcourt electric", "phedc", "ph disco"] },
  ibadan_electric: { name: "Ibadan Electric", category: "Bills & Subscriptions", keywords: ["ibadan electric", "ibedc"] },
  kaduna_electric: { name: "Kaduna Electric", category: "Bills & Subscriptions", keywords: ["kaduna electric", "kaduna"] },
  enugu_electric: { name: "Enugu Electric", category: "Bills & Subscriptions", keywords: ["enugu electric", "eedc"] },
  benin_electric: { name: "Benin Electric", category: "Bills & Subscriptions", keywords: ["benin electric", "bedc"] },
  warri_electric: { name: "Warri Electric", category: "Bills & Subscriptions", keywords: ["warri electric", "wedc"] },
  jos_electric: { name: "Jos Electric", category: "Bills & Subscriptions", keywords: ["jos electric", "jedc"] },
  kano_electric: { name: "Kano Electric", category: "Bills & Subscriptions", keywords: ["kano electric", "kedco"] },
  preyda: { name: "Prepaid Meter", category: "Bills & Subscriptions", keywords: ["prepaid", "prepaid meter", "preyda"] },
  
  // Streaming & Subscriptions
  netflix: { name: "Netflix", category: "Entertainment", keywords: ["netflix"] },
  spotify: { name: "Spotify", category: "Entertainment", keywords: ["spotify"] },
  dstv: { name: "Dstv", category: "Entertainment", keywords: ["dstv", "dstvng", "dstv ng", "multichoice", "multichoice Nigeria"] },
  showmax: { name: "Showmax", category: "Entertainment", keywords: ["showmax", "show max"] },
  youtube: { name: "YouTube", category: "Entertainment", keywords: ["youtube", "youtube premium"] },
  apple: { name: "Apple", category: "Entertainment", keywords: ["apple", "apple music", "apple tv", "itunes"] },
  amazon: { name: "Amazon", category: "Shopping", keywords: ["amazon", "amazon prime", "amazon web"] },
  
  // Shopping & E-commerce
  jumia: { name: "Jumia", category: "Shopping", keywords: ["jumia", "jumia food", "jumia pay", "jumia Nigeria"] },
  konga: { name: "Konga", category: "Shopping", keywords: ["konga", "konga pay"] },
  payport: { name: "PayPorte", category: "Shopping", keywords: ["payporte", "pay porte"] },
  
  // Fintech & Payments
  flutterwave: { name: "Flutterwave", category: "Financial Services", keywords: ["flutterwave", "rave", "flutter wave"] },
  paystack: { name: "Paystack", category: "Financial Services", keywords: ["paystack", "pay stack"] },
  interswitch: { name: "Interswitch", category: "Financial Services", keywords: ["interswitch", "inter switch", "quickteller", "verve"] },
  moniepoint: { name: "Moniepoint", category: "Financial Services", keywords: ["moniepoint", "monie point", "moniepoint mfb"] },
  opay: { name: "OPay", category: "Financial Services", keywords: ["opay", "opay Nigeria", "opay payment"] },
  palmpay: { name: "PalmPay", category: "Financial Services", keywords: ["palmpay", "palm pay"] },
  kuda: { name: "Kuda", category: "Financial Services", keywords: ["kuda", "kuda mfb", "kuda bank"] },
  carbon: { name: "Carbon", category: "Financial Services", keywords: ["carbon", "carbon finance", "carbon loan"] },
  fairmoney: { name: "FairMoney", category: "Financial Services", keywords: ["fairmoney", "fair money"] },
  renmoney: { name: "Renmoney", category: "Financial Services", keywords: ["renmoney", "ren money"] },
  branch: { name: "Branch", category: "Financial Services", keywords: ["branch", "branch finance"] },
  cowrywise: { name: "Cowrywise", category: "Financial Services", keywords: ["cowrywise", "cowry wise"] },
  piggyvest: { name: "PiggyVest", category: "Financial Services", keywords: ["piggyvest", "piggy vest", "piggybank"] },
  bundle: { name: "Bundle", category: "Financial Services", keywords: ["bundle", "bundle Africa"] },
  luno: { name: "Luno", category: "Financial Services", keywords: ["luno", "luno Nigeria"] },
  valr: { name: "Valr", category: "Financial Services", keywords: ["valr", "valr Nigeria"] },
  buycoins: { name: "BuyCoins", category: "Financial Services", keywords: ["buycoins", "buy coins"] },
  quidax: { name: "Quidax", category: "Financial Services", keywords: ["quidax"] },
  yellowcard: { name: "YellowCard", category: "Financial Services", keywords: ["yellowcard", "yellow card"] },
  chipper: { name: "Chipper Cash", category: "Financial Services", keywords: ["chipper", "chipper cash"] },
  
  // Betting & Gaming
  bet9ja: { name: "Bet9ja", category: "Others", keywords: ["bet9ja", "bet 9ja", "bet9ja old mobile"] },
  sportybet: { name: "Sportybet", category: "Others", keywords: ["sportybet", "sporty bet", "sportybet ng"] },
  betway: { name: "Betway", category: "Others", keywords: ["betway", "bet way"] },
  nairaBet: { name: "NairaBet", category: "Others", keywords: ["nairabet", "naira bet"] },
  merryBet: { name: "MerryBet", category: "Others", keywords: ["merrybet", "merry bet"] },
  betKing: { name: "BetKing", category: "Others", keywords: ["betking", "bet king"] },
  
  // Bills & Utilities
  dstv_payment: { name: "Dstv Subscription", category: "Bills & Subscriptions", keywords: ["dstv subscription", "dstv payment", "multichoice payment"] },
  gotv: { name: "GoTV", category: "Bills & Subscriptions", keywords: ["gotv", "go tv"] },
  startimes: { name: "StarTimes", category: "Bills & Subscriptions", keywords: ["startimes", "start times"] },
  waec: { name: "WAEC", category: "Bills & Subscriptions", keywords: ["waec", "waec result", "waec registration"] },
  jamb: { name: "JAMB", category: "Bills & Subscriptions", keywords: ["jamb", "jamb registration", "jamb utme"] },
  nimc: { name: "NIMC", category: "Bills & Subscriptions", keywords: ["nimc", "nimc national id", "nin"] },
  
  // Healthcare
  hospital: { name: "Hospital", category: "Healthcare", keywords: ["hospital", "medical", "clinic", "health care", "healthcare"] },
  pharmacy: { name: "Pharmacy", category: "Healthcare", keywords: ["pharmacy", "pharm", "drug", "medication"] },
  lab: { name: "Laboratory", category: "Healthcare", keywords: ["lab", "laboratory", "diagnostic", "test"] },
  health: { name: "Health Service", category: "Healthcare", keywords: ["health", "wellness", "therapy", "dental"] },
  
  // Education
  school: { name: "School Fees", category: "Education", keywords: ["school", "tuition", "fees", "university", "college", "academy"] },
  course: { name: "Online Course", category: "Education", keywords: ["course", "udemy", "coursera", "training", "certification"] },
  
  // Rent & Housing
  rent: { name: "Rent Payment", category: "Housing", keywords: ["rent", "house rent", "accommodation", "apartment"] },
  estate: { name: "Estate Payment", category: "Housing", keywords: ["estate", "property", "landlord", "agent"] },
  
  // Salary & Income
  salary: { name: "Salary", category: "Income", keywords: ["salary", "sal", "wage", "payroll", "income", "stipend", "allowance"] },
  freelance: { name: "Freelance Payment", category: "Income", keywords: ["freelance", "contract", "consulting", "service payment"] },
  
  // ATM & POS
  atm: { name: "ATM Withdrawal", category: "ATM & POS", keywords: ["atm", "atm withdrawal", "atm cash"] },
  pos: { name: "POS Transaction", category: "ATM & POS", keywords: ["pos", "pos purchase", "pos terminal", "pos trans"] },
  
  // Transfers
  transfer: { name: "Transfer", category: "Transfer", keywords: ["transfer", "trf", "sent", "received", "funding", "self", "own", "wallet"] },
  
  // Gift & Donations
  gift: { name: "Gift", category: "Gift", keywords: ["gift", "present", "donation", "charity", "tithe", "offering"] },
  
  // Loan & Credit
  loan: { name: "Loan", category: "Financial Services", keywords: ["loan", "credit", "borrow", "repay", "interest"] },
  
  // Government
  government: { name: "Government Payment", category: "Government", keywords: ["government", "tax", "levy", "fee", "penalty", "fine", "customs"] },
  
  // Insurance
  insurance: { name: "Insurance", category: "Insurance", keywords: ["insurance", "premium", "coverage", "policy"] },
  
  // Miscellaneous
  cashback: { name: "Cashback", category: "Income", keywords: ["cashback", "cash back", "reward", "bonus"] },
  refund: { name: "Refund", category: "Income", keywords: ["refund", "reversal", "chargeback"] },
  subscription: { name: "Subscription", category: "Bills & Subscriptions", keywords: ["subscription", "renewal", "membership"] },
  commission: { name: "Commission", category: "Income", keywords: ["commission", "referral", "affiliate"] },
};

function cleanDescription(desc: string): string {
  let cleaned = desc.toUpperCase().trim();

  // Remove reference numbers (long numeric strings)
  cleaned = cleaned.replace(/\b\d{6,}\b/g, "");
  cleaned = cleaned.replace(/REF[:\s]*\w+/gi, "");
  cleaned = cleaned.replace(/NARR[:\s]*\w+/gi, "");
  cleaned = cleaned.replace(/TRANSACTION[:\s]*\w+/gi, "");
  cleaned = cleaned.replace(/CHANNEL[:\s]*\w+/gi, "");

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
    const escaped = noise.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    merchant = merchant.replace(new RegExp(escaped, "gi"), "");
  }

  // Remove location keywords
  for (const loc of LOCATION_KEYWORDS) {
    const escaped = loc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    merchant = merchant.replace(new RegExp(`\\b${escaped}\\b`, "gi"), "");
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

function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function fuzzyMatch(input: string, keywords: string[]): boolean {
  const normalized = normalizeForMatch(input);
  
  for (const keyword of keywords) {
    const normalizedKeyword = normalizeForMatch(keyword);
    
    // Exact match
    if (normalized.includes(normalizedKeyword)) {
      return true;
    }
    
    // Check if most words match (for slight variations)
    const inputWords = normalized.split(" ");
    const keywordWords = normalizedKeyword.split(" ");
    
    if (keywordWords.length <= inputWords.length) {
      let matchCount = 0;
      for (const kw of keywordWords) {
        if (inputWords.some(iw => iw.includes(kw) || kw.includes(iw))) {
          matchCount++;
        }
      }
      if (matchCount >= Math.ceil(keywordWords.length * 0.7)) {
        return true;
      }
    }
  }
  
  return false;
}

function guessMerchant(merchant: string): { name: string; category: string } | undefined {
  const normalized = normalizeForMatch(merchant);
  
  // Check each merchant in the database
  for (const [, info] of Object.entries(MERCHANT_DB)) {
    if (fuzzyMatch(normalized, info.keywords)) {
      return { name: info.name, category: info.category };
    }
  }
  
  return undefined;
}

function guessCategory(merchantGuess: string | undefined, desc: string): string | undefined {
  const lower = (merchantGuess || desc).toLowerCase();

  // Food & Dining patterns
  if (lower.includes("restaurant") || lower.includes("eatery") || lower.includes("buka") || 
      lower.includes("canteen") || lower.includes("bar ") || lower.includes("lounge") ||
      lower.includes("food") || lower.includes("meal") || lower.includes("snack") ||
      lower.includes("chops") || lower.includes("dinner") || lower.includes("lunch") ||
      lower.includes("breakfast") || lower.includes("pizza") || lower.includes("burger") ||
      lower.includes("chicken") || lower.includes("grill") || lower.includes("酒") ||
      lower.includes("sharwama") || lower.includes("shawarma")) {
    return "Food & Dining";
  }

  // Transport patterns
  if (lower.includes("uber") || lower.includes("bolt") || lower.includes("indrive") ||
      lower.includes("gokada") || lower.includes("ride") || lower.includes("taxi") ||
      lower.includes("transport") || lower.includes("bus") || lower.includes("brt") ||
      lower.includes("lagbus")) {
    return "Transport";
  }

  // Bills & Subscriptions
  if (lower.includes("mtn") || lower.includes("airtel") || lower.includes("glo") ||
      lower.includes("9mobile") || lower.includes("etisalat") ||
      lower.includes("electric") || lower.includes("ikedc") || lower.includes("ekedc") ||
      lower.includes("aedc") || lower.includes("phedc") || lower.includes("ibedc") ||
      lower.includes("prepaid") || lower.includes("meter") ||
      lower.includes("dstv") || lower.includes("gotv") || lower.includes("startimes") ||
      lower.includes("netflix") || lower.includes("spotify") || lower.includes("youtube") ||
      lower.includes("subscription") || lower.includes("renewal")) {
    return "Bills & Subscriptions";
  }

  // Shopping
  if (lower.includes("shoprite") || lower.includes("spar") || lower.includes("hubmart") ||
      lower.includes("jumia") || lower.includes("konga") || lower.includes("amazon") ||
      lower.includes("store") || lower.includes("shop") || lower.includes("mall") ||
      lower.includes("supermarket") || lower.includes("market")) {
    return "Shopping";
  }

  // Financial Services
  if (lower.includes("flutterwave") || lower.includes("paystack") || lower.includes("interswitch") ||
      lower.includes("moniepoint") || lower.includes("opay") || lower.includes("palmpay") ||
      lower.includes("kuda") || lower.includes("carbon") || lower.includes("fairmoney") ||
      lower.includes("renmoney") || lower.includes("cowrywise") || lower.includes("piggyvest") ||
      lower.includes("transfer") || lower.includes("trf") || lower.includes("loan") ||
      lower.includes("credit") || lower.includes("borrow") || lower.includes("repay")) {
    return "Financial Services";
  }

  // Healthcare
  if (lower.includes("hospital") || lower.includes("pharmacy") || lower.includes("medical") ||
      lower.includes("health") || lower.includes("drug") || lower.includes("clinic") ||
      lower.includes("lab") || lower.includes("diagnostic") || lower.includes("dental")) {
    return "Healthcare";
  }

  // Education
  if (lower.includes("school") || lower.includes("tuition") || lower.includes("university") ||
      lower.includes("college") || lower.includes("academy") || lower.includes("course") ||
      lower.includes("udemy") || lower.includes("coursera") || lower.includes("training")) {
    return "Education";
  }

  // Housing
  if (lower.includes("rent") || lower.includes("house") || lower.includes("estate") ||
      lower.includes("property") || lower.includes("landlord") || lower.includes("agent")) {
    return "Housing";
  }

  // ATM & POS
  if (lower.includes("atm") || lower.includes("pos")) {
    return "ATM & POS";
  }

  // Salary & Income
  if (lower.includes("salary") || lower.includes("sal") || lower.includes("wage") ||
      lower.includes("payroll") || lower.includes("income") || lower.includes("stipend")) {
    return "Income";
  }

  // Gift & Donations
  if (lower.includes("gift") || lower.includes("donation") || lower.includes("charity") ||
      lower.includes("tithe") || lower.includes("offering")) {
    return "Gift";
  }

  // Government
  if (lower.includes("government") || lower.includes("tax") || lower.includes("levy") ||
      lower.includes("customs") || lower.includes("penalty") || lower.includes("fine")) {
    return "Government";
  }

  // Insurance
  if (lower.includes("insurance") || lower.includes("premium") || lower.includes("coverage")) {
    return "Insurance";
  }

  // Entertainment
  if (lower.includes("entertainment") || lower.includes("game") || lower.includes("gaming") ||
      lower.includes("bet") || lower.includes("casino") || lower.includes("betting")) {
    return "Entertainment";
  }

  return undefined;
}

export function normalizeTransactions(transactions: ParsedTransaction[]): NormalizedTransaction[] {
  return transactions.map(tx => {
    const cleaned = cleanDescription(tx.description);
    const merchant = extractMerchant(cleaned);
    const merchantResult = guessMerchant(cleaned);
    const merchantGuess = merchantResult?.name;
    const categoryGuess = merchantResult?.category || guessCategory(merchantGuess, cleaned);

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
