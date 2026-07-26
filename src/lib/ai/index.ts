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

const MERCHANT_PROMPT = `You are a Nigerian bank transaction analyzer. Extract the merchant/person name and classify the transaction.

RULES:
- For "Transfer to/from NAME | BANK | ACCOUNT" → the merchant is NAME (the person/entity)
- For "Mobile Data | NUMBER | CARRIER | PLAN" → merchant is the CARRIER (e.g., "MTN")
- For "Electricity | NUMBER | PROVIDER | KWH" → merchant is the PROVIDER (e.g., "IBEDC")
- For "OPay Card Payment | MERCHANT" → merchant is the second part
- For POS/ATM: extract the terminal name or location
- For subscriptions: extract the service name (Spotify, Netflix, etc.)

CLASSIFY the merchant type:
- "person": Individual person (for transfers)
- "business": Named business/company
- "service": Utility/service provider (MTN, IBEDC, etc.)
- "platform": Payment platform (OPay, PalmPay, Paystack, etc.)
- "unknown": Cannot determine

Respond in JSON only:
{
  "merchant": "EXTRACTED NAME",
  "merchantType": "person|business|service|platform|unknown",
  "category": "Category from the list",
  "subcategory": "Subcategory from the list",
  "confidence": 0.0-1.0,
  "reason": "Brief explanation"
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
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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

    const prompt = `Classify each transaction. Respond with a JSON object keyed by transaction id.

For each transaction:
- Extract the merchant/person name
- Classify merchant type (person, business, service, platform, unknown)
- Suggest category and subcategory from this list:
${CATEGORY_LIST}

Respond in JSON only:
{
  "results": {
    "tx_id": {
      "merchant": "NAME",
      "merchantType": "person|business|service|platform|unknown",
      "category": "Category",
      "subcategory": "Subcategory",
      "confidence": 0.0-1.0,
      "reason": "Brief explanation"
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
