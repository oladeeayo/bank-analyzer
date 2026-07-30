import { ParseResult, ParsedTransaction } from "./types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const EXTRACTION_PROMPT = `You are a Nigerian bank statement parser. Your ONLY job is to extract EXACTLY what you see in the raw text below.

CRITICAL RULES:
- Only extract data that is EXPLICITLY present in the text. Do NOT generate, fabricate, or guess any data.
- If you cannot find any transaction data in the text, return an empty transactions array: {"transactions": []}
- Do NOT use sample data, placeholder data, or invented examples.
- Every transaction MUST come from an actual line in the provided text.
- If the text contains metadata (account info, balances, headers), skip those and only extract transaction rows.

For each transaction row you find, extract:
1. Date (as YYYY-MM-DD)
2. Description / Narration (exactly as written in the statement)
3. Amount (the actual number, cleaned of currency symbols)
4. Type: "debit" (money out) or "credit" (money in)
5. Balance (if present)
6. Reference (if present)

Output ONLY valid JSON:
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "exact text from statement",
      "amount": 15000.00,
      "type": "debit",
      "balance": 250000.00,
      "reference": "ref if present"
    }
  ]
}

If there are NO transactions in the text, output: {"transactions": []}

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

function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && date.getFullYear() >= 2000 && date.getFullYear() <= 2030;
}

function isGenericDescription(desc: string): boolean {
  const genericPatterns = [
    /^(opening balance|closing balance)$/i,
    /^(transfer to|transfer from)\s+\w+$/i,
    /^(salary credit|salary payment)$/i,
    /^(pos purchase|pos purchase \w+)$/i,
    /^(airtime purchase|data purchase|recharge)$/i,
    /^open$/i,
  ];
  return genericPatterns.some(p => p.test(desc.trim()));
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

    // Validate each transaction
    for (const tx of parsed) {
      if (!tx.date || !tx.description || tx.amount === 0) {
        errors.push(`Skipped row: missing date/description/amount`);
        continue;
      }
      if (!isValidDate(tx.date)) {
        errors.push(`Skipped row: invalid date "${tx.date}"`);
        continue;
      }
      if (tx.description.length < 3) {
        errors.push(`Skipped row: description too short "${tx.description}"`);
        continue;
      }
      transactions.push(tx);
    }

    // Validate uniqueness - filter out obvious duplicates
    const seen = new Set<string>();
    const unique: ParsedTransaction[] = [];
    for (const tx of transactions) {
      const key = `${tx.date}_${tx.amount}_${tx.type}_${tx.description.substring(0, 30)}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(tx);
      }
    }

    // Filter out rows where all dates are the same (fake data indicator)
    if (unique.length > 3) {
      const dates = new Set(unique.map(t => t.date));
      if (dates.size === 1) {
        errors.push("AI returned transactions with identical dates - likely fabricated data. Discarding all.");
        return { transactions: [], errors, metadata: { fileName, fileType: "ai-fallback", totalRows: 0, parsedRows: 0 } };
      }
    }

    // Replace with unique set
    return {
      transactions: unique,
      errors,
      metadata: {
        fileName,
        fileType: "ai-fallback",
        totalRows: unique.length,
        parsedRows: unique.length,
      },
    };
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
