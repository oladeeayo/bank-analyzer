import { ParseResult, ParsedTransaction } from "./types";

function getGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY;
}

function getCandidateModels(): string[] {
  const models = [
    process.env.GEMINI_MODEL,
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-pro",
    "gemini-2.5-flash",
  ];
  return Array.from(new Set(models.filter(Boolean))) as string[];
}

const EXTRACTION_PROMPT = `You are an expert Nigerian bank statement OCR parser. Your ONLY job is to extract EXACTLY what you see in the bank statement PDF / text below.

CRITICAL RULES:
- Only extract transaction data that is EXPLICITLY present. Do NOT generate, fabricate, or guess any data.
- If you cannot find any transaction data, return: {"bankName": null, "accountName": null, "accountNumber": null, "transactions": []}
- Do NOT use sample data, placeholder data, or invented examples.
- Every transaction MUST come from an actual line or table row in the statement.
- Pay close attention to Nigerian Bank Statement layouts (Kuda Bank, GTBank, Zenith, Access, UBA, PalmPay, Moniepoint, OPay, Sterling).
- Extract Statement Header details if present:
  * "bankName": Bank issuing the statement (e.g. "Kuda Bank", "GTBank", "Zenith Bank", "Access Bank", "OPay", "PalmPay", "Moniepoint", "UBA", "First Bank")
  * "accountName": Full name of account holder (e.g. "OLADAYO ISAAC OLADIPUPO")
  * "accountNumber": Account number string (e.g. "2003792641")
- For Kuda statements specifically:
  * Money in is credit, money out is debit.
  * Extract BOTH Date AND Time from column 1! If date is '28/07/26' and time is '11:47:40', COMBINE them into ISO date time: '2026-07-28T11:47:40'. DO NOT drop the time!
  * If the statement has 'To / From' column (e.g. 'Interswitch/Lead City University Ibadan/6671844006/9psb' or 'Faith Erezioghene Awenede/7036202938/Opay Digital Services Limited') AND 'Description' column (e.g. 'statement of result', 'printing', 'bike', '500mb for 1 day purchase', 'pos', 'payment'), COMBINE them as:
    "ToFrom_Text | Description_Text" (for example: "Interswitch/Lead City University Ibadan/6671844006/9psb | statement of result" or "Peter Bamigboye/8030737527/Opay Digital Services Limited | bike").

For each transaction row you find, extract:
1. Date (format strictly as ISO string or YYYY-MM-DDTHH:mm:ss if time is present, e.g. "2026-07-28T11:47:40" or "2026-02-02T14:50:32". Include time whenever visible!)
2. Description / Narration (the full narration combining To/From counterparty, bank, account, and description memo)
3. Amount (numeric value, strictly positive)
4. Type: "debit" (money out) or "credit" (money in)
5. Balance (if present as a numeric value)
6. Reference (if present)

Output ONLY valid JSON matching this exact structure:
{
  "bankName": "Kuda Bank",
  "accountName": "OLADAYO ISAAC OLADIPUPO",
  "accountNumber": "2003792641",
  "transactions": [
    {
      "date": "2026-07-28T11:47:40",
      "description": "exact narration text from statement",
      "amount": 15000.00,
      "type": "debit",
      "balance": 250000.00,
      "reference": "ref if present"
    }
  ]
}

If there are NO transactions, output: {"bankName": null, "accountName": null, "accountNumber": null, "transactions": []}`;

async function callGeminiVision(parts: Array<any>): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);

  let lastError: any = null;
  const candidateModels = getCandidateModels();

  for (const modelName of candidateModels) {
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

interface AIResponsePayload {
  bankName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  transactions: ParsedTransaction[];
}

function parseAIResponse(text: string): AIResponsePayload {
  let cleaned = text.trim();

  // Strip markdown code fences if present
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/) || cleaned.match(/(\{[\s\S]*\})/);
  if (jsonMatch) {
    cleaned = jsonMatch[1] || jsonMatch[0];
  }

  const parsed = JSON.parse(cleaned);
  const rawList = parsed.transactions || parsed.results || (Array.isArray(parsed) ? parsed : []);

  const transactions = rawList.map((tx: any) => {
    const rawAmt = Math.abs(parseFloat(String(tx.amount || tx.Amount || tx.debit || tx.credit || 0)));
    let dateStr = String(tx.date || tx.Date || "").trim();
    
    // Parse DD/MM/YY HH:mm:ss or DD/MM/YYYY HH:mm:ss or YYYY-MM-DD HH:mm:ss
    if (dateStr) {
      const match = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:\s+[T]?(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
      if (match) {
        let [_, p1, p2, p3, hh = "00", mm = "00", ss = "00"] = match;
        let day: string, month: string, year: string;
        
        if (p1.length === 4) {
          // YYYY-MM-DD
          year = p1;
          month = p2.padStart(2, "0");
          day = p3.padStart(2, "0");
        } else {
          // DD/MM/YY or DD/MM/YYYY
          day = p1.padStart(2, "0");
          month = p2.padStart(2, "0");
          year = p3.length === 2 ? "20" + p3 : p3;
        }
        
        dateStr = `${year}-${month}-${day}T${hh.padStart(2, "0")}:${mm.padStart(2, "0")}:${ss.padStart(2, "0")}.000Z`;
      } else {
        // Fallback: try parsing directly into ISO string if valid
        const dObj = new Date(dateStr);
        if (!isNaN(dObj.getTime())) {
          dateStr = dObj.toISOString();
        }
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

  return {
    bankName: parsed.bankName || parsed.bank || null,
    accountName: parsed.accountName || parsed.account_name || null,
    accountNumber: parsed.accountNumber || parsed.account_number || null,
    transactions,
  };
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
    const parsedPayload = parseAIResponse(responseText);

    for (const tx of parsedPayload.transactions) {
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

    const detectedBank = parsedPayload.bankName || (fileName.toLowerCase().includes("kuda") ? "Kuda Bank" : "Kuda Bank");
    const detectedAccountName = parsedPayload.accountName || undefined;
    const detectedAccountNumber = parsedPayload.accountNumber || undefined;

    return {
      transactions: unique,
      errors,
      metadata: {
        fileName,
        fileType: "pdf-ocr-vision",
        detectedBank,
        detectedAccountName,
        detectedAccountNumber,
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

      for (const tx of parsed.transactions) {
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

