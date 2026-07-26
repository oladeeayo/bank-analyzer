import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface AIClassification {
  merchant: string;
  merchantType: "person" | "business" | "service" | "platform" | "unknown";
  category: string;
  subcategory: string;
  confidence: number;
  reason: string;
}

export interface AISimilarGroup {
  groupId: string;
  transactionIds: string[];
  reason: string;
}

const CATEGORY_LIST = `Income: Salary, Freelance, Business Income, Gift Received, Refund, Interest, Dividend, Other Income
Savings: AutoSave, Goal Savings, Fixed Deposit, Emergency Fund, Other Savings
Food: Restaurant, Fast Food, Groceries, Snacks, Drinks, Coffee, Other Food
Transport: Ride Hailing, Bus/Train, Fuel, Parking, Toll, Other Transport
Bills: Electricity, Water, Internet, Phone, Cable TV, Waste, Other Bills
Shopping: Electronics, Clothing, Home, Beauty, Gifts, Online, Other Shopping
Healthcare: Hospital, Pharmacy, Clinic, Lab, Insurance, Other Health
Education: School Fees, Books, Courses, Exams, Other Education
Housing: Rent, Mortgage, Maintenance, Cleaning, Other Housing
Entertainment: Streaming, Games, Events, Sports, Hobbies, Other Entertainment
Financial Services: Bank Fees, Loan Repayment, Investment, Insurance Premium, Other Financial
Transfers: Personal Transfer, Family Support, Business Transfer, Self Transfer, Other Transfer
Government: Tax, Fine, Registration, License, Other Government
Others: Uncategorized, Miscellaneous, Unknown`;

const MERCHANT_PROMPT = `You are an expert Nigerian bank transaction analyzer. Your job is to extract the merchant/person name and categorize the transaction intelligently.

PATTERN RECOGNITION RULES:
1. TRANSFERS: "Transfer to/from NAME | BANK | ACCOUNT"
   - Merchant = NAME (the person or business receiving/sending)
   - Type = "person" for individuals, "business" for companies
   - Category = "Transfers" → subcategory: "Personal Transfer" (individuals), "Business Transfer" (companies)

2. BILLS: "Electricity | NUMBER | PROVIDER | KWH" or "Water | NUMBER | PROVIDER"
   - Merchant = PROVIDER (e.g., "IBEDC", "IKEJA ELECTRIC", "PHED")
   - Type = "service"
   - Category = "Bills" → subcategory: "Electricity" or "Water"

3. DATA/AIRTIME: "Mobile Data | NUMBER | CARRIER | PLAN" or "Airtime | NUMBER | CARRIER"
   - Merchant = CARRIER (e.g., "MTN", "GLO", "AIRTEL", "9MOBILE")
   - Type = "service"
   - Category = "Bills" → subcategory: "Phone" or "Internet"

4. SUBSCRIPTIONS: "OPay Card Payment | SERVICE" or descriptions with "Spotify", "Netflix", etc.
   - Merchant = SERVICE name
   - Type = "business" or "platform"
   - Category = "Entertainment" → subcategory: "Streaming"

5. POS/ATM: Terminal name or location
   - Merchant = terminal name/location
   - Category = appropriate based on context

6. SALARY: "SALARY", "WAGES", "PAYROLL"
   - Merchant = "Salary"
   - Category = "Income" → subcategory: "Salary"

7. SAVINGS: "AUTOSAVE", "SAVE", "OWEALTH"
   - Merchant = "Savings"
   - Category = "Savings" → subcategory: "AutoSave"

MERCHANT TYPE CLASSIFICATION:
- "person": Individual human (e.g., "OLADEJI ISAIAH", "FAITH EREZIOGHENE")
- "business": Registered company (e.g., "IKEOLUWA UNIQUE ENTERPRISE", "CHECKOUT LIMITED")
- "service": Utility/service (MTN, IBEDC, DSTV, Spotify)
- "platform": Payment platform (OPay, PalmPay, Paystack, Flutterwave)
- "unknown": Cannot determine

CONFIDENCE SCORING:
- 0.9-1.0: Clear pattern match (exact bank format)
- 0.7-0.8: Strong keyword match
- 0.5-0.6: Partial match, some ambiguity
- 0.3-0.4: Weak match, needs review
- 0.1-0.2: Guessing

Respond in JSON only:
{
  "merchant": "EXTRACTED NAME",
  "merchantType": "person|business|service|platform|unknown",
  "category": "Category from the list",
  "subcategory": "Subcategory from the list",
  "confidence": 0.0-1.0,
  "reason": "Brief explanation of how you determined this"
}

Available categories and subcategories:
${CATEGORY_LIST}`;

const SIMILAR_PROMPT = `You are analyzing Nigerian bank transactions to group similar ones together.

RULES:
- Transfers to the SAME PERSON are similar (same name exactly)
- Transfers to DIFFERENT PEOPLE are NOT similar, even if same bank
- Same service with different plans (e.g., MTN 110MB vs 500MB) ARE similar
- Same merchant/store ARE similar
- Different merchants are NOT similar, even if same category

Group transactions that belong together. Each group should have a clear reason.

Respond in JSON only:
{
  "groups": [
    {
      "groupId": "group_1",
      "transactionIds": ["id1", "id2"],
      "reason": "Same person: JOHN DOE"
    }
  ]
}`;

async function callGemini(prompt: string, data: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
  const result = await model.generateContent(`${prompt}\n\nData:\n${data}`);
  const response = result.response;
  return response.text();
}

function parseJSON(text: string): any {
  // Extract JSON from response (may have markdown code blocks)
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
  if (!jsonMatch) throw new Error("No JSON found in AI response");
  return JSON.parse(jsonMatch[1] || jsonMatch[0]);
}

export async function classifyTransaction(
  description: string,
  amount: number,
  type: "credit" | "debit"
): Promise<AIClassification> {
  const data = JSON.stringify({ description, amount, type });
  const response = await callGemini(MERCHANT_PROMPT, data);
  return parseJSON(response);
}

export async function batchClassify(
  transactions: Array<{ id: string; description: string; amount: number; type: "credit" | "debit" }>
): Promise<Record<string, AIClassification>> {
  const BATCH_SIZE = 10;
  const results: Record<string, AIClassification> = {};

  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE);
    const data = JSON.stringify(batch, null, 2);

    const prompt = `You are an expert Nigerian bank transaction analyzer. Classify each transaction intelligently.

PATTERNS TO RECOGNIZE:
- "Transfer to/from NAME | BANK | ACCOUNT" → Merchant is the NAME (person/business)
- "Mobile Data | NUMBER | CARRIER | PLAN" → Merchant is CARRIER (MTN, GLO, etc.)
- "Electricity | NUMBER | PROVIDER | KWH" → Merchant is PROVIDER (IBEDC, etc.)
- "OPay Card Payment | SERVICE" → Merchant is SERVICE
- Salary/Payroll payments → Category is Income/Salary
- Savings/AutoSave → Category is Savings/AutoSave

For each transaction, determine:
1. WHO is the merchant/person? (extract the actual name)
2. WHAT type? (person, business, service, platform, unknown)
3. WHICH category fits best?
4. HOW confident are you?

Categories:
${CATEGORY_LIST}

Respond with JSON object keyed by transaction id:
{
  "results": {
    "tx_id": {
      "merchant": "EXTRACTED NAME",
      "merchantType": "person|business|service|platform|unknown",
      "category": "Category",
      "subcategory": "Subcategory",
      "confidence": 0.0-1.0,
      "reason": "How you determined this"
    }
  }
}`;

    const response = await callGemini(prompt, data);
    const parsed = parseJSON(response);

    for (const [id, classification] of Object.entries(parsed.results || {})) {
      results[id] = classification as AIClassification;
    }
  }

  return results;
}

export async function findSimilarGroups(
  transactions: Array<{ id: string; description: string; amount: number; type: "credit" | "debit" }>
): Promise<AISimilarGroup[]> {
  const BATCH_SIZE = 20;
  const allGroups: AISimilarGroup[] = [];

  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE);
    const data = JSON.stringify(batch, null, 2);
    const response = await callGemini(SIMILAR_PROMPT, data);
    const parsed = parseJSON(response);
    allGroups.push(...(parsed.groups || []));
  }

  return allGroups;
}
