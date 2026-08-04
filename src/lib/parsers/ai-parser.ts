import { ParseResult, ParsedTransaction } from "./types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
].filter(Boolean) as string[];

const EXTRACTION_PROMPT = `You are an expert Nigerian bank statement OCR parser. Your ONLY job is to extract EXACTLY what you see in the bank statement PDF / text below.

CRITICAL RULES:
- Only extract transaction data that is EXPLICITLY present. Do NOT generate, fabricate, or guess any data.
- If you cannot find any transaction data, return: {"transactions": []}
- Do NOT use sample data, placeholder data, or invented examples.
- Every transaction MUST come from an actual line or table row in the statement.
- Ignore headers, disclaimers, account summaries, and page footers.
- Pay close attention to Nigerian Bank Statement layouts (Kuda Bank, GTBank, Zenith, Access, UBA, PalmPay, Moniepoint, OPay, Sterling).
- For Kuda statements specifically: money in is credit, money out is debit. Combine To/From and Description into a clean Narration.

For each transaction row you find, extract:
1. Date (format as YYYY-MM-DD or ISO string)
2. Description / Narration (the description, sender, receiver, or details)
3. Amount (numeric value, strictly positive)
4. Type: "debit" (money out) or "credit" (money in)
5. Balance (if present as a numeric value)
6. Reference (if present)

Output ONLY valid JSON matching this exact structure:
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "exact narration text from statement",
      "amount": 15000.00,
      "type": "debit",
      "balance": 250000.00,
      "reference": "ref if present"
    }
  ]
}

If there are NO transactions, output: {"transactions": []}`;

async function callGeminiVision(parts: Array<any>): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

  let lastError: any = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      console.log(`[GeminiVision] Attempting vision extraction with model: ${modelName}`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
        },
      });

      const result = await model.generateContent(parts);
      const text = result.response.text();
      if (text && text.trim().length > 0) {
        console.log(`[GeminiVision] Successfully received response from ${modelName}`);
        return text;
      }
    } catch (err: any) {
      console.warn(`[GeminiVision] Model ${modelName} failed: ${err?.message || err}`);
      lastError = err;
    }
  }

  throw new Error(`All Gemini candidate models failed. Last error: ${lastError?.message || lastError}`);
}

function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && date.getFullYear() >= 2000 && date.getFullYear() <= 2030;
}

function parseAIResponse(text: string): ParsedTransaction[] {
  let cleaned = text.trim();

  // Strip markdown code fences if present
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/) || cleaned.match(/(\{[\s\S]*\})/);
  if (jsonMatch) {
    cleaned = jsonMatch[1] || jsonMatch[0];
  }

  const parsed = JSON.parse(cleaned);
  const rawList = parsed.transactions || parsed.results || (Array.isArray(parsed) ? parsed : []);

  return rawList.map((tx: any) => {
    const rawAmt = Math.abs(parseFloat(String(tx.amount || tx.Amount || tx.debit || tx.credit || 0)));
    let dateStr = tx.date || tx.Date || "";
    if (dateStr && !dateStr.includes("-") && dateStr.includes("/")) {
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        let [d, m, y] = parts;
        if (y.length === 2) y = "20" + y;
        dateStr = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      }
    }

    const typeStr = String(tx.type || tx.Type || "").toLowerCase();
    const isCredit = typeStr.includes("credit") || typeStr.includes("in") || (tx.credit && parseFloat(tx.credit) > 0);
    const type: "debit" | "credit" = isCredit ? "credit" : "debit";

    const description = String(tx.description || tx.Description || tx.narration || tx.Narration || tx.details || "Transaction").trim();

    return {
      date: dateStr,
      description,
      amount: isNaN(rawAmt) ? 0 : rawAmt,
      type,
      balance: tx.balance || tx.Balance ? parseFloat(String(tx.balance || tx.Balance)) : undefined,
      reference: tx.reference || tx.Reference || tx.ref || tx.Ref || undefined,
      narration: description,
    };
  });
}

/**
 * Direct Gemini Multimodal PDF Vision Extraction.
 * Reads PDF buffer directly via inline Base64 data with application/pdf MIME type.
 */
export async function parsePdfWithGeminiVision(
  pdfBuffer: Buffer | ArrayBuffer,
  fileName: string
): Promise<ParseResult> {
  const transactions: ParsedTransaction[] = [];
  const errors: string[] = [];

  try {
    const buffer = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
    const base64Data = buffer.toString("base64");

    const parts = [
      {
        inlineData: {
          data: base64Data,
          mimeType: "application/pdf",
        },
      },
      { text: EXTRACTION_PROMPT },
    ];

    const responseText = await callGeminiVision(parts);
    const parsed = parseAIResponse(responseText);

    for (const tx of parsed) {
      if (!tx.date || !tx.description || tx.amount === 0) {
        errors.push(`Skipped row: missing date (${tx.date}), description (${tx.description}), or amount (${tx.amount})`);
        continue;
      }
      if (!isValidDate(tx.date)) {
        errors.push(`Skipped row: invalid date "${tx.date}"`);
        continue;
      }
      if (tx.description.length < 2) {
        errors.push(`Skipped row: description too short "${tx.description}"`);
        continue;
      }
      transactions.push(tx);
    }

    // Filter out obvious duplicate entries
    const seen = new Set<string>();
    const unique: ParsedTransaction[] = [];
    for (const tx of transactions) {
      const key = `${tx.date}_${tx.amount}_${tx.type}_${tx.description.substring(0, 30)}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(tx);
      }
    }

    const dates = unique
      .map((t) => new Date(t.date).getTime())
      .filter((d) => !isNaN(d))
      .sort((a, b) => a - b);

    console.log(`[GeminiVision] Parsed ${unique.length} transactions from PDF ${fileName}`);

    return {
      transactions: unique,
      errors,
      metadata: {
        fileName,
        fileType: "pdf-ocr-vision",
        detectedBank: "Gemini Vision OCR",
        totalRows: unique.length,
        parsedRows: unique.length,
        dateRange:
          dates.length > 0
            ? { start: new Date(dates[0]).toISOString(), end: new Date(dates[dates.length - 1]).toISOString() }
            : undefined,
      },
    };
  } catch (err: any) {
    console.error("[GeminiVision] Failed to parse PDF via Gemini Vision:", err);
    errors.push(`Gemini Vision OCR error: ${err?.message || err}`);
  }

  return {
    transactions,
    errors,
    metadata: {
      fileName,
      fileType: "pdf-ocr-vision",
      totalRows: 0,
      parsedRows: 0,
    },
  };
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
    const CHUNK_SIZE = 25000;
    const chunks: string[] = [];

    if (rawContent.length <= CHUNK_SIZE) {
      chunks.push(rawContent);
    } else {
      for (let i = 0; i < rawContent.length; i += CHUNK_SIZE) {
        chunks.push(rawContent.slice(i, i + CHUNK_SIZE));
      }
    }

    for (const chunk of chunks) {
      const parts = [{ text: EXTRACTION_PROMPT + bankHint + chunk }];
      const response = await callGeminiVision(parts);
      const parsed = parseAIResponse(response);

      for (const tx of parsed) {
        if (!tx.date || !tx.description || tx.amount === 0) {
          errors.push(`Skipped row: missing date/description/amount`);
          continue;
        }
        if (!isValidDate(tx.date)) {
          errors.push(`Skipped row: invalid date "${tx.date}"`);
          continue;
        }
        if (tx.description.length < 2) {
          errors.push(`Skipped row: description too short "${tx.description}"`);
          continue;
        }
        transactions.push(tx);
      }
    }

    const seen = new Set<string>();
    const unique: ParsedTransaction[] = [];
    for (const tx of transactions) {
      const key = `${tx.date}_${tx.amount}_${tx.type}_${tx.description.substring(0, 30)}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(tx);
      }
    }

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

