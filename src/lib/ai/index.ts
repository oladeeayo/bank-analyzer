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

const MERCHANT_PROMPT = `You are an expert Nigerian bank transaction analyzer for OPay/PalmPay banks.

NIGERIAN BANK KNOWLEDGE:
- OWealth is OPay's savings feature. "OWealth Withdrawal" means money moving FROM savings TO wallet (not income).
- "OWealth Deposit" means money moving FROM wallet TO savings.
- "Auto-save to OWealth" means automatic transfer INTO savings.
- EaseMoni is OPay's loan feature. Credits = loan disbursement, Debits = loan repayment.
- "Transfer from NAME | BANK | ACCOUNT" = someone sent you money.
- "Transfer to NAME | BANK | ACCOUNT" = you sent someone money.
- "Mobile Data | NUMBER | CARRIER | PLAN" = data purchase.
- "Electricity | NUMBER | PROVIDER | KWH" = electricity token purchase.
- "OPay Card Payment | MERCHANT" = POS/card payment to a merchant.
- "Stamp Duty" = CBN bank fee (₦50).
- "USSD Charge" = bank fee for USSD transactions.

CATEGORY RULES:
- OWealth Withdrawal → Savings → Other Savings (NOT income, money is leaving savings)
- OWealth Deposit → Savings → Other Savings (money entering savings)
- Auto-save to OWealth → Savings → AutoSave
- EaseMoni credit → Financial Services → Loan Repayment (loan disbursement)
- EaseMoni debit → Financial Services → Loan Repayment (loan repayment)
- Transfer from person → Transfers → Personal Transfer
- Transfer to person → Transfers → Personal Transfer
- Mobile Data → Bills → Phone
- Electricity → Bills → Electricity
- Spotify/Netflix → Entertainment → Streaming
- Stamp Duty/USSD → Financial Services → Bank Fees

CONFIDENCE SCORING:
- 0.9-1.0: Exact pattern match with known bank format
- 0.7-0.8: Strong keyword match
- 0.5-0.6: Partial match
- Below 0.5: Needs review

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

    const prompt = `You are an expert Nigerian bank transaction analyzer for OPay/PalmPay banks.

NIGERIAN BANK KNOWLEDGE:
- OWealth is OPay's savings feature. "OWealth Withdrawal" = money moving FROM savings TO wallet (NOT income).
- "OWealth Deposit" = money moving FROM wallet TO savings.
- "Auto-save to OWealth" = automatic transfer INTO savings.
- EaseMoni is OPay's loan feature. Credits = loan disbursement, Debits = loan repayment.
- "Transfer from NAME | BANK | ACCOUNT" = someone sent you money.
- "Transfer to NAME | BANK | ACCOUNT" = you sent someone money.
- "Mobile Data | NUMBER | CARRIER | PLAN" = data purchase.
- "Electricity | NUMBER | PROVIDER | KWH" = electricity token purchase.
- "OPay Card Payment | MERCHANT" = POS/card payment to a merchant.
- "Stamp Duty" = CBN bank fee (₦50).
- "USSD Charge" = bank fee for USSD transactions.

CATEGORY RULES:
- OWealth Withdrawal → Savings → Other Savings (NOT income)
- OWealth Deposit → Savings → Other Savings
- Auto-save to OWealth → Savings → AutoSave
- EaseMoni credit → Financial Services → Loan Repayment
- EaseMoni debit → Financial Services → Loan Repayment
- Transfer from person → Transfers → Personal Transfer
- Transfer to person → Transfers → Personal Transfer
- Mobile Data → Bills → Phone
- Electricity → Bills → Electricity
- Spotify/Netflix → Entertainment → Streaming
- Stamp Duty/USSD → Financial Services → Bank Fees

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
