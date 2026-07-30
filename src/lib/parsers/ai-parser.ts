import { ParseResult, ParsedTransaction } from "./types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const EXTRACTION_PROMPT = `You are a Nigerian bank statement parser. Extract all transactions from the raw text below.

For each row, identify:
1. Date (in DD/MM/YYYY or YYYY-MM-DD format)
2. Description / Narration (the transaction details)
3. Debit amount (money going out, withdrawal)
4. Credit amount (money coming in, deposit)
5. Balance (running balance after transaction, if available)
6. Reference / Transaction ID (if available)

RULES:
- Clean currency symbols (N, #, NGN, ₦, $, comma separators) from amounts
- Convert all amounts to plain numbers
- Dates must be output as YYYY-MM-DD
- Merge multi-line descriptions into a single line
- Skip summary rows, totals, page headers/footers, and metadata
- A single amount column with negative sign = debit, positive = credit
- If a row has both debit AND credit amounts, use the non-zero one
- If balance is present, use it for validation: balance[n] should equal balance[n-1] + credit - debit

Output ONLY valid JSON in this exact format:
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "clean description text",
      "amount": 15000.00,
      "type": "debit",
      "balance": 250000.00,
      "reference": "optional ref"
    }
  ]
}

Raw statement data:
`;

async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

function parseAIResponse(text: string): ParsedTransaction[] {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
  if (!jsonMatch) throw new Error("No JSON found in AI response");

  const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
  const transactions = parsed.transactions || parsed.results || [];

  return transactions.map((tx: any) => ({
    date: tx.date || tx.Date || "",
    description: tx.description || tx.Description || tx.narration || tx.Narration || tx.details || "",
    amount: Math.abs(parseFloat(String(tx.amount || tx.Amount || tx.debit || tx.credit || 0))),
    type: (tx.type || tx.Type || (tx.debit && parseFloat(tx.debit) > 0 ? "debit" : "credit") || "debit").toLowerCase() as "debit" | "credit",
    balance: tx.balance || tx.Balance ? parseFloat(String(tx.balance || tx.Balance)) : undefined,
    reference: tx.reference || tx.Reference || tx.ref || tx.Ref || tx["transaction id"] || undefined,
    narration: tx.description || tx.Description || tx.narration || "",
  }));
}

export async function parseWithAI(
  rawContent: string,
  fileName: string,
  hint?: { bankName?: string }
): Promise<ParseResult> {
  const transactions: ParsedTransaction[] = [];
  const errors: string[] = [];

  try {
    const bankHint = hint?.bankName ? `Bank: ${hint.bankName}\n\n` : "";
    const prompt = EXTRACTION_PROMPT + bankHint + rawContent.slice(0, 30000);
    const response = await callGemini(prompt);
    const parsed = parseAIResponse(response);

    for (const tx of parsed) {
      if (!tx.date || !tx.description || tx.amount === 0) {
        errors.push(`Skipped row: missing date/description/amount`);
        continue;
      }
      transactions.push(tx);
    }
  } catch (err: any) {
    errors.push(`AI parse error: ${err?.message || err}`);
  }

  return {
    transactions,
    errors,
    metadata: {
      fileName,
      fileType: "ai-fallback",
      totalRows: transactions.length,
      parsedRows: transactions.length,
    },
  };
}
