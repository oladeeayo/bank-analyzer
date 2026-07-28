import { ParsedTransaction } from "@/lib/parsers/types";
import { extractCounterpartyInfo } from "@/lib/counterparty-matcher";

export interface NormalizedTransaction extends ParsedTransaction {
  normalizedDescription: string;
  merchantGuess?: string;
  categoryGuess?: string;
  counterpartyName?: string;
  counterpartyBank?: string;
  counterpartyAccount?: string;
  isSelfTransfer?: boolean;
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
  "send to",
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
  brent: { name: "Brent Stores", category: "Supermarket", keywords: ["brent stores", "brent"] },
  ebano: { name: "Ebano", category: "Supermarket", keywords: ["ebano", "ebano supermarket"] },
  blenco: { name: "Blenco", category: "Supermarket", keywords: ["blenco"] },
  prince_ebeano: { name: "Prince Ebeano", category: "Supermarket", keywords: ["prince ebeano", "ebeano"] },
  just_rite: { name: "Just Rite", category: "Supermarket", keywords: ["just rite"] },
  foodco: { name: "Foodco", category: "Supermarket", keywords: ["foodco", "foodco nigeria"] },
  chicken: { name: "Chicken Republic", category: "Food", keywords: ["chicken republic", "chicken rep"] },
  kfc: { name: "KFC", category: "Food", keywords: ["kfc", "kfc Nigeria"] },
  dominos: { name: "Dominos Pizza", category: "Food", keywords: ["dominos", "domino pizza", "dominos pizza"] },
  pizza: { name: "Pizza", category: "Food", keywords: ["pizza", "pizza hut", "papa john"] },
  burger: { name: "Burger", category: "Food", keywords: ["burger", "burger king", "mc donald"] },
  taco: { name: "Taco Bell", category: "Food", keywords: ["taco", "taco bell"] },
  subway: { name: "Subway", category: "Food", keywords: ["subway"] },
  starbucks: { name: "Starbucks", category: "Food", keywords: ["starbucks"] },
  kilimanjaro: { name: "Kilimanjaro", category: "Food", keywords: ["kilimanjaro"] },
  eatngo: { name: "Eat'N'Go", category: "Food", keywords: ["eat'ngo", "eat n go", "eatngo"] },
  sweet_sensation: { name: "Sweet Sensation", category: "Food", keywords: ["sweet sensation"] },
  tantalizers: { name: "Tantalizers", category: "Food", keywords: ["tantalizers"] },
  mega_chicken: { name: "Mega Chicken", category: "Food", keywords: ["mega chicken"] },
  the_place: { name: "The Place", category: "Food", keywords: ["the place"] },
  coffee: { name: "Coffee Shop", category: "Food", keywords: ["coffee", "cafe", "cafeone", "buka"] },
  restaurant: { name: "Restaurant", category: "Food", keywords: ["restaurant", "restuarant", "eatery", "buka", "canteen", "bar", "lounge", "pub", "tavern"] },
  food: { name: "Food Purchase", category: "Food", keywords: ["food", "meal", "lunch", "dinner", "breakfast", "snack", "chops"] },

  // Transport & Ride Hailing
  uber: { name: "Uber", category: "Transport", keywords: ["uber", "uber trip", "uber eats", "uber bv"] },
  bolt: { name: "Bolt", category: "Transport", keywords: ["bolt", "bolt ride", "taxify"] },
  inDrive: { name: "InDrive", category: "Transport", keywords: ["indrive", "in drive"] },
  gokada: { name: "Gokada", category: "Transport", keywords: ["gokada"] },
  opay_transport: { name: "OPay Transport", category: "Transport", keywords: ["opay transport", "opay ride"] },
  lagbus: { name: "LagBus", category: "Transport", keywords: ["lagbus", "lag bus"] },
  BRT: { name: "BRT", category: "Transport", keywords: ["brt", "brt lagos"] },
  peace_mass: { name: "Peace Mass Transit", category: "Transport", keywords: ["peace mass", "peace mass transit"] },
  gigm: { name: "GIG Logistics", category: "Transport", keywords: ["gigm", "gig logistics", "gig mobile"] },

  // Fuel Stations
  fuel: { name: "Fuel Station", category: "Fuel", keywords: ["petrol station", "filling station", "fuel station", "fuel purchase"] },
  total: { name: "Total Energies", category: "Fuel", keywords: ["total nigeria", "total energ"] },
  mobil: { name: "Mobil", category: "Fuel", keywords: ["mobil nigeria", "mobil oil"] },
  oando: { name: "Oando", category: "Fuel", keywords: ["oando nigeria", "oando filling"] },
  bovas: { name: "Bovas", category: "Fuel", keywords: ["bovas", "bovas filling"] },
  conoil: { name: "Conoil", category: "Fuel", keywords: ["conoil"] },
  enyo: { name: "Enyo", category: "Fuel", keywords: ["enyo", "enyo energy"] },
  nipco: { name: "NIPCO", category: "Fuel", keywords: ["nipco"] },
  arnova: { name: "Arnova", category: "Fuel", keywords: ["arnova"] },

  // Telecoms
  mtn: { name: "MTN", category: "Bills", keywords: ["mtn", "mtn ng", "mtn nigeria", "mtn airtime", "mtn data"] },
  airtel: { name: "Airtel", category: "Bills", keywords: ["airtel", "airtel ng", "airtel nigeria"] },
  glo: { name: "Glo", category: "Bills", keywords: ["glo", "glo ng", "glo nigeria", "glo data"] },
  mobile9: { name: "9mobile", category: "Bills", keywords: ["9mobile", "etisalat", "etisalat nigeria"] },

  // Internet & Cable
  smile: { name: "Smile Communications", category: "Bills", keywords: ["smile", "smile communications"] },
  spectranet: { name: "Spectranet", category: "Bills", keywords: ["spectranet"] },
  starlink: { name: "Starlink", category: "Bills", keywords: ["starlink", "starlink internet"] },

  // Electricity
  ikeja_electric: { name: "Ikeja Electric", category: "Bills", keywords: ["ikeja electric", "ikedc", "ikeja disco"] },
  eko_electric: { name: "Eko Electric", category: "Bills", keywords: ["eko electric", "ekedc", "eko disco"] },
  abuja_electric: { name: "Abuja Electric", category: "Bills", keywords: ["abuja electric", "aedc", "abuja disco"] },
  ph_electric: { name: "Port Harcourt Electric", category: "Bills", keywords: ["port harcourt electric", "phedc", "ph disco"] },
  ibadan_electric: { name: "Ibadan Electric", category: "Bills", keywords: ["ibadan electric", "ibedc"] },
  kaduna_electric: { name: "Kaduna Electric", category: "Bills", keywords: ["kaduna electric", "kaduna"] },
  enugu_electric: { name: "Enugu Electric", category: "Bills", keywords: ["enugu electric", "eedc"] },
  benin_electric: { name: "Benin Electric", category: "Bills", keywords: ["benin electric", "bedc"] },
  warri_electric: { name: "Warri Electric", category: "Bills", keywords: ["warri electric", "wedc"] },
  jos_electric: { name: "Jos Electric", category: "Bills", keywords: ["jos electric", "jedc"] },
  kano_electric: { name: "Kano Electric", category: "Bills", keywords: ["kano electric", "kedco"] },
  preyda: { name: "Prepaid Meter", category: "Bills", keywords: ["prepaid", "prepaid meter", "preyda"] },

  // Streaming & Subscriptions
  netflix: { name: "Netflix", category: "Entertainment", keywords: ["netflix"] },
  spotify: { name: "Spotify", category: "Entertainment", keywords: ["spotify"] },
  dstv: { name: "Dstv", category: "Subscription", keywords: ["dstv", "dstvng", "dstv ng", "multichoice", "multichoice Nigeria"] },
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
  bet9ja: { name: "Bet9ja", category: "Entertainment", keywords: ["bet9ja", "bet 9ja", "bet9ja old mobile"] },
  sportybet: { name: "Sportybet", category: "Entertainment", keywords: ["sportybet", "sporty bet", "sportybet ng"] },
  betway: { name: "Betway", category: "Entertainment", keywords: ["betway", "bet way"] },
  nairaBet: { name: "NairaBet", category: "Entertainment", keywords: ["nairabet", "naira bet"] },
  merryBet: { name: "MerryBet", category: "Entertainment", keywords: ["merrybet", "merry bet"] },
  betKing: { name: "BetKing", category: "Entertainment", keywords: ["betking", "bet king"] },

  // Bills & Utilities
  dstv_payment: { name: "Dstv Subscription", category: "Subscription", keywords: ["dstv subscription", "dstv payment", "multichoice payment"] },
  gotv: { name: "GoTV", category: "Subscription", keywords: ["gotv", "go tv"] },
  startimes: { name: "StarTimes", category: "Subscription", keywords: ["startimes", "start times"] },
  waec: { name: "WAEC", category: "Education", keywords: ["waec", "waec result", "waec registration"] },
  jamb: { name: "JAMB", category: "Education", keywords: ["jamb", "jamb registration", "jamb utme"] },
  nimc: { name: "NIMC", category: "Government", keywords: ["nimc", "nimc national id", "nin"] },

  // Healthcare
  hospital: { name: "Hospital", category: "Health", keywords: ["hospital", "medical", "clinic", "health care", "healthcare"] },
  pharmacy: { name: "Pharmacy", category: "Health", keywords: ["pharmacy", "pharm", "drug", "medication"] },
  medplus: { name: "Medplus", category: "Health", keywords: ["medplus", "med plus"] },
  healthplus: { name: "Healthplus", category: "Health", keywords: ["healthplus", "health plus"] },
  lab: { name: "Laboratory", category: "Health", keywords: ["lab", "laboratory", "diagnostic", "test"] },
  health: { name: "Health Service", category: "Health", keywords: ["health", "wellness", "therapy", "dental"] },

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
  atm: { name: "ATM Withdrawal", category: "ATM", keywords: ["atm", "atm withdrawal", "atm cash"] },
  pos: { name: "POS Transaction", category: "POS", keywords: ["pos", "pos purchase", "pos terminal", "pos trans"] },

  // Gift & Donations
  gift: { name: "Gift", category: "Gift", keywords: ["gift", "present", "donation", "charity", "tithe", "offering"] },

  // Loan & Credit
  loan: { name: "Loan", category: "Financial Services", keywords: ["loan", "credit", "borrow", "repay", "interest"] },

  // Government
  government: { name: "Government Payment", category: "Tax", keywords: ["government", "tax", "levy", "fee", "penalty", "fine", "customs"] },

  // Insurance
  insurance: { name: "Insurance", category: "Insurance", keywords: ["insurance", "premium", "coverage", "policy"] },

  // Miscellaneous
  cashback: { name: "Cashback", category: "Income", keywords: ["cashback", "cash back", "reward", "bonus"] },
  refund: { name: "Refund", category: "Income", keywords: ["refund", "reversal", "chargeback"] },
  subscription: { name: "Subscription", category: "Subscription", keywords: ["subscription", "renewal", "membership"] },
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
  // Handle pipe-separated transfer descriptions
  // "Transfer from TEMITOPEMARY AYEOYENKAN | POCKETAPP | 191****823"
  // "Transfer to IKEOLUWA UNIQUE ENTERPRISE  | OPay | 7071750698"
  const pipeTransferMatch = cleaned.match(/^Transfer\s+(to|from)\s+(.+?)\s*\|/i);
  if (pipeTransferMatch) {
    const name = pipeTransferMatch[2].trim();
    if (name.length >= 3) {
      return name.toUpperCase();
    }
  }

  // Handle non-pipe transfer descriptions (OPay)
  // "Transfer from OLADEJI ISAIAH OLADIPUPO | OPay"
  const transferMatch = cleaned.match(/^Transfer\s+(to|from)\s+(.+?)$/i);
  if (transferMatch) {
    const name = transferMatch[2].trim();
    if (name.length >= 3) {
      return name.toUpperCase();
    }
  }

  // Handle PalmPay Send to/Received from patterns
  // "Send to NOC Integrated Service Ltd. (Ologuneru outlet)"
  // "Received from OLADAYO ISAAC OLADIPUPO"
  // "IYANUOLUWA OKE Send to ADAOBI CHRISTIANA" → extract "ADAOBI CHRISTIANA"
  const sendMatch = cleaned.match(/Send\s+to\s+(.+?)$/i);
  if (sendMatch) {
    const name = sendMatch[1].trim();
    if (name.length >= 3) {
      return name.toUpperCase();
    }
  }

  const receivedMatch = cleaned.match(/Received\s+from\s+(.+?)$/i);
  if (receivedMatch) {
    const name = receivedMatch[1].trim();
    if (name.length >= 3) {
      return name.toUpperCase();
    }
  }

  // Handle pipe-separated non-transfer descriptions
  // "Mobile Data | 8136167673 | MTN | 6GB Weekly Plan"
  // "Electricity | 70004967884 | capricorn_ibadan_prepaid | 100.67 kWh"
  // "OPay Card Payment | Spotify"
  const pipeMatch = cleaned.match(/^([^|]+)\s*\|/);
  if (pipeMatch) {
    const service = pipeMatch[1].trim();
    // For "OPay Card Payment | Spotify" → use the second part
    if (service.toLowerCase().includes("card payment")) {
      const secondPart = cleaned.split("|")[1]?.trim();
      if (secondPart && secondPart.length >= 2) {
        return secondPart.toUpperCase();
      }
    }
    // For "Electricity | ..." → "ELECTRICITY"
    // For "Mobile Data | ..." → "MOBILE DATA"
    if (service.length >= 3) {
      return service.toUpperCase();
    }
  }

  // Handle PalmPay-specific service descriptions
  // "CashBox Interest", "CashBox Auto Save", "Stamp Duty", "Betting Deposit"
  const palmPayServices = [
    /^CashBox\s+(.+)$/i,
    /^(Stamp\s+Duty)$/i,
    /^(Betting\s+Deposit)$/i,
    /^(Electronic\s+Money\s+Transfer\s+Levy)$/i,
    /^(Buy\s+Data\s+bundle)$/i,
  ];
  for (const pattern of palmPayServices) {
    const match = cleaned.match(pattern);
    if (match) {
      return (match[1] || match[0]).toUpperCase();
    }
  }

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

  // Food patterns
  if (lower.includes("restaurant") || lower.includes("eatery") || lower.includes("buka") || 
      lower.includes("canteen") || lower.includes("bar ") || lower.includes("lounge") ||
      lower.includes("food") || lower.includes("meal") || lower.includes("snack") ||
      lower.includes("chops") || lower.includes("dinner") || lower.includes("lunch") ||
      lower.includes("breakfast") || lower.includes("pizza") || lower.includes("burger") ||
      lower.includes("chicken") || lower.includes("grill") || lower.includes("sharwama") || 
      lower.includes("shawarma")) {
    return "Food";
  }

  // Transport patterns
  if (lower.includes("uber") || lower.includes("bolt") || lower.includes("indrive") ||
      lower.includes("gokada") || lower.includes("ride") || lower.includes("taxi") ||
      lower.includes("transport") || lower.includes("bus") || lower.includes("brt") ||
      lower.includes("lagbus")) {
    return "Transport";
  }

  // Bills patterns
  if (lower.includes("mtn") || lower.includes("airtel") || lower.includes("glo") ||
      lower.includes("9mobile") || lower.includes("etisalat") ||
      lower.includes("electric") || lower.includes("ikedc") || lower.includes("ekedc") ||
      lower.includes("aedc") || lower.includes("phedc") || lower.includes("ibedc") ||
      lower.includes("prepaid") || lower.includes("meter") ||
      lower.includes("dstv") || lower.includes("gotv") || lower.includes("startimes")) {
    return "Bills";
  }

  // Subscription patterns
  if (lower.includes("netflix") || lower.includes("spotify") || lower.includes("youtube") ||
      lower.includes("subscription") || lower.includes("renewal")) {
    return "Subscription";
  }

  // Shopping patterns
  if (lower.includes("shoprite") || lower.includes("spar") || lower.includes("hubmart") ||
      lower.includes("jumia") || lower.includes("konga") || lower.includes("amazon") ||
      lower.includes("store") || lower.includes("shop") || lower.includes("mall") ||
      lower.includes("supermarket") || lower.includes("market")) {
    return "Shopping";
  }

  // Financial Services patterns
  if (lower.includes("flutterwave") || lower.includes("paystack") || lower.includes("interswitch") ||
      lower.includes("moniepoint") || lower.includes("opay") || lower.includes("palmpay") ||
      lower.includes("kuda") || lower.includes("carbon") || lower.includes("fairmoney") ||
      lower.includes("renmoney") || lower.includes("cowrywise") || lower.includes("piggyvest") ||
      lower.includes("transfer") || lower.includes("trf") || lower.includes("loan") ||
      lower.includes("credit") || lower.includes("borrow") || lower.includes("repay")) {
    return "Financial Services";
  }

  // Health patterns
  if (lower.includes("hospital") || lower.includes("pharmacy") || lower.includes("medical") ||
      lower.includes("health") || lower.includes("drug") || lower.includes("clinic") ||
      lower.includes("lab") || lower.includes("diagnostic") || lower.includes("dental")) {
    return "Health";
  }

  // Education patterns
  if (lower.includes("school") || lower.includes("tuition") || lower.includes("university") ||
      lower.includes("college") || lower.includes("academy") || lower.includes("course") ||
      lower.includes("udemy") || lower.includes("coursera") || lower.includes("training")) {
    return "Education";
  }

  // Housing patterns
  if (lower.includes("rent") || lower.includes("house") || lower.includes("estate") ||
      lower.includes("property") || lower.includes("landlord") || lower.includes("agent")) {
    return "Housing";
  }

  // ATM & POS patterns
  if (lower.includes("atm")) return "ATM";
  if (lower.includes("pos")) return "POS";

  // Income patterns
  if (lower.includes("salary") || lower.includes("sal") || lower.includes("wage") ||
      lower.includes("payroll") || lower.includes("income") || lower.includes("stipend")) {
    return "Income";
  }

  // Gift patterns
  if (lower.includes("gift") || lower.includes("donation") || lower.includes("charity") ||
      lower.includes("tithe") || lower.includes("offering")) {
    return "Gift";
  }

  // Tax patterns
  if (lower.includes("government") || lower.includes("tax") || lower.includes("levy") ||
      lower.includes("customs") || lower.includes("penalty") || lower.includes("fine")) {
    return "Tax";
  }

  // Insurance patterns
  if (lower.includes("insurance") || lower.includes("premium") || lower.includes("coverage")) {
    return "Insurance";
  }

  // Entertainment patterns
  if (lower.includes("entertainment") || lower.includes("game") || lower.includes("gaming") ||
      lower.includes("bet") || lower.includes("casino") || lower.includes("betting")) {
    return "Entertainment";
  }

  return undefined;
}

export function normalizeTransactions(
  transactions: ParsedTransaction[],
  userOwnNames: string[] = []
): NormalizedTransaction[] {
  return transactions.map(tx => {
    const cleaned = cleanDescription(tx.description);
    const merchant = extractMerchant(cleaned);
    const merchantResult = guessMerchant(cleaned);
    const merchantGuess = merchantResult?.name;
    const categoryGuess = merchantResult?.category || guessCategory(merchantGuess, cleaned);

    const cp = extractCounterpartyInfo(tx.description, userOwnNames);

    return {
      ...tx,
      normalizedDescription: merchant || cleaned,
      merchantGuess,
      categoryGuess,
      counterpartyName: cp.name || undefined,
      counterpartyBank: cp.bank,
      counterpartyAccount: cp.accountNumber || cp.partialAccountNumber,
      isSelfTransfer: cp.isSelfTransfer,
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
