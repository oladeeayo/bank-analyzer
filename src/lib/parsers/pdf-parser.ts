// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFParser = require("pdf2json");
import { ParsedTransaction, ParseResult, BankFormat } from "./types";

function detectBankFormat(text: string): BankFormat {
  const lower = text.toLowerCase();
  if (lower.includes("palmpay") || lower.includes("palm pay")) return "palmpay-pdf";
  if (lower.includes("gtbank") || lower.includes("gtb")) return "gtbank-pdf";
  if (lower.includes("access bank")) return "access-pdf";
  if (lower.includes("uba")) return "uba-pdf";
  if (lower.includes("opay")) return "opay-pdf";
  if (lower.includes("kuda")) return "kuda-pdf";
  if (lower.includes("moniepoint")) return "moniepoint-pdf";
  if (lower.includes("first bank") || lower.includes("firstbank")) return "firstbank-pdf";
  if (lower.includes("zenith")) return "zenith-pdf";
  return "generic-pdf";
}

function parseDate(dateStr: string, dateFormat?: "MM/DD/YYYY" | "DD/MM/YYYY"): Date {
  const clean = dateStr.trim();

  let match = clean.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})\s*(AM|PM)/i);
  if (match) {
    let hours = parseInt(match[4]);
    const minutes = parseInt(match[5]);
    const seconds = parseInt(match[6]);
    const ampm = match[7].toUpperCase();
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    let month: number, day: number;
    if (dateFormat === "MM/DD/YYYY") {
      month = parseInt(match[1]);
      day = parseInt(match[2]);
    } else {
      month = parseInt(match[2]);
      day = parseInt(match[1]);
    }
    return new Date(parseInt(match[3]), month - 1, day, hours, minutes, seconds);
  }

  match = clean.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) {
    let month: number, day: number;
    if (dateFormat === "MM/DD/YYYY") {
      month = parseInt(match[1]);
      day = parseInt(match[2]);
    } else {
      month = parseInt(match[2]);
      day = parseInt(match[1]);
    }
    return new Date(parseInt(match[3]), month - 1, day);
  }

  match = clean.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));

  match = clean.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (match) return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));

  const months: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };
  match = clean.match(/(\d{1,2})\s+(\w{3})\s+(\d{4})/);
  if (match) {
    const monthIdx = months[match[2].toLowerCase()];
    if (monthIdx !== undefined) return new Date(parseInt(match[3]), monthIdx, parseInt(match[1]));
  }

  return new Date(clean);
}

const DATE_PATTERN = /\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}\s*(AM|PM)/i;
const SIMPLE_DATE_PATTERN = /\d{2}\/\d{2}\/\d{4}/;
const AMOUNT_PATTERN = /^[+-]?[\d,]+\.?\d*$/;

const PALMPAY_TIMESTAMP_REGEX = /\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}\s+(?:AM|PM)/gi;

function extractTextFromPDF2Json(pdfData: any): string {
  const textItems: Array<{ y: number; x: number; text: string }> = [];
  if (pdfData.Pages) {
    for (const page of pdfData.Pages) {
      if (page.Texts) {
        for (const text of page.Texts) {
          if (text.R) {
            for (const r of text.R) {
              if (r.T) {
                textItems.push({
                  y: Math.round(text.y * 10) / 10,
                  x: Math.round(text.x * 10) / 10,
                  text: decodeURIComponent(r.T),
                });
              }
            }
          }
        }
      }
    }
  }
  // Sort by y (top to bottom), then x (left to right) for proper reading order
  textItems.sort((a, b) => a.y - b.y || a.x - b.x);
  return textItems.map(t => t.text).join("\n");
}

function extractTableRows(pdfData: any): string[][] {
  const allRows: string[][] = [];

  if (pdfData.Pages) {
    for (const page of pdfData.Pages) {
      if (!page.Texts) continue;

      const textsByY: Record<number, { x: number; text: string }[]> = {};

      for (const text of page.Texts) {
        if (!text.R || text.R.length === 0) continue;
        const decoded = decodeURIComponent(text.R[0].T || "").trim();
        if (!decoded) continue;
        const y = Math.round(text.y * 10) / 10;
        const x = Math.round(text.x * 10) / 10;
        if (!textsByY[y]) textsByY[y] = [];
        textsByY[y].push({ x, text: decoded });
      }

      const sortedYs = Object.keys(textsByY)
        .map(Number)
        .sort((a, b) => a - b);

      for (const y of sortedYs) {
        const cells = textsByY[y].sort((a, b) => a.x - b.x);
        if (cells.length > 0) {
          allRows.push(cells.map(c => c.text));
        }
      }
    }
  }

  return allRows;
}

function isPalmPayFormat(rows: string[][]): boolean {
  for (let i = 0; i < Math.min(rows.length, 40); i++) {
    const joined = rows[i].join(" ").toLowerCase();
    if (joined.includes("transaction date") && joined.includes("transaction detail")) return true;
    if (joined.includes("palmpay")) return true;
  }
  return false;
}

function extractAmountAndType(text: string): { amount: number; type: "debit" | "credit" } | null {
  if (!AMOUNT_PATTERN.test(text)) return null;
  const amount = Math.abs(parseFloat(text.replace(/,/g, "")));
  const type = text.startsWith("-") || (!text.startsWith("+") && amount > 0) ? "debit" : "credit";
  return { amount, type };
}

function parsePalmPayText(fullText: string): ParseResult {
  const transactions: ParsedTransaction[] = [];
  const errors: string[] = [];

  const cleanedText = fullText
    .replace(/Account Statement/gi, "")
    .replace(/Total Money In[\s\S]*?Print Time[^\n]*/gi, "")
    .replace(/Name\s+[^\n]*/gi, "")
    .replace(/Phone Number\s+[^\n]*/gi, "")
    .replace(/Account Number\s+[^\n]*/gi, "")
    .replace(/Statement Period\s+[^\n]*/gi, "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/support@\S+/gi, "")
    .replace(/\d{2}\s+Opebi Rd[^\n]*/gi, "")
    .replace(/Digital Finance[^\n]*/gi, "")
    .replace(/018886888#1/gi, "")
    .replace(/Transaction Date\s+Transaction Detail\s+Money In \(NGN\)\s+Money Out \(NGN\)\s+Transaction ID/gi, "");

  const timestampMatches = [...cleanedText.matchAll(PALMPAY_TIMESTAMP_REGEX)];

  console.log(`[PalmPay] Found ${timestampMatches.length} timestamp matches`);

  for (let i = 0; i < timestampMatches.length; i++) {
    const dateStr = timestampMatches[i][0];
    const startIndex = timestampMatches[i].index! + dateStr.length;
    const endIndex = timestampMatches[i + 1] ? timestampMatches[i + 1].index! : cleanedText.length;

    let block = cleanedText.substring(startIndex, endIndex);
    block = block.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();

    if (!block) continue;

    const amountMatch = block.match(/\s([+-]\d+(?:,\d{3})*(?:\.\d+)?)\s+([a-zA-Z0-9_]+(?:\s+[a-zA-Z0-9_]+)?)\s*$/);

    if (!amountMatch) {
      const simpleAmountMatch = block.match(/\s([+-]\d+(?:,\d{3})*(?:\.\d+)?)\s*$/);
      if (simpleAmountMatch) {
        const rawAmount = simpleAmountMatch[1];
        const amountVal = Math.abs(parseFloat(rawAmount.replace(/,/g, "")));
        const type: "debit" | "credit" = rawAmount.startsWith("+") ? "credit" : "debit";
        const description = block.substring(0, simpleAmountMatch.index).trim();

        if (amountVal > 0 && description) {
          transactions.push({
            date: parseDate(dateStr, "MM/DD/YYYY").toISOString(),
            description,
            amount: amountVal,
            type,
            narration: description,
          });
        }
      }
      continue;
    }

    const rawAmount = amountMatch[1];
    const rawTxId = amountMatch[2];
    const txId = rawTxId.replace(/\s+/g, "");
    const description = block.substring(0, amountMatch.index).trim();

    const amountVal = Math.abs(parseFloat(rawAmount.replace(/,/g, "")));
    const type: "debit" | "credit" = rawAmount.startsWith("+") ? "credit" : "debit";

    if (amountVal > 0 && description) {
      const date = parseDate(dateStr, "MM/DD/YYYY");
      if (isNaN(date.getTime())) {
        errors.push(`Invalid date "${dateStr}"`);
        continue;
      }

      transactions.push({
        date: date.toISOString(),
        description,
        amount: amountVal,
        type,
        reference: txId || undefined,
        narration: description,
      });
    }
  }

  const dates = transactions.map(t => new Date(t.date).getTime()).sort((a, b) => a - b);

  console.log(`[PalmPay] Parsed ${transactions.length} transactions, ${errors.length} errors`);
  if (transactions.length > 0) {
    console.log(`[PalmPay] First: ${transactions[0].date} - ${transactions[0].description}`);
    console.log(`[PalmPay] Last: ${transactions[transactions.length - 1].date} - ${transactions[transactions.length - 1].description}`);
  }

  return {
    transactions,
    errors,
    metadata: {
      fileName: "",
      fileType: "pdf",
      totalRows: timestampMatches.length,
      parsedRows: transactions.length,
      dateRange: dates.length > 0
        ? { start: new Date(dates[0]).toISOString(), end: new Date(dates[dates.length - 1]).toISOString() }
        : undefined,
    },
  };
}

function parseGenericRows(rows: string[][]): ParseResult {
  const transactions: ParsedTransaction[] = [];
  const errors: string[] = [];

  const datePattern = /(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2}|\d{2}-\d{2}-\d{4}|\d{2}\s+\w{3}\s+\d{4})/;

  for (let i = 0; i < rows.length; i++) {
    try {
      const row = rows[i];
      if (row.length < 2) continue;

      let dateStr = "";
      let description = "";
      let amount = 0;
      let type: "debit" | "credit" = "debit";
      let reference = "";

      for (const cell of row) {
        if (!dateStr && datePattern.test(cell)) {
          const m = cell.match(datePattern);
          if (m) dateStr = m[1];
        }
      }

      for (const cell of row) {
        if (AMOUNT_PATTERN.test(cell) && !datePattern.test(cell)) {
          const num = Math.abs(parseFloat(cell.replace(/,/g, "")));
          if (num > 0 && amount === 0) {
            amount = num;
            type = cell.startsWith("-") || (!cell.startsWith("+")) ? "debit" : "credit";
          }
        } else if (!datePattern.test(cell) && cell.length > 2 && !cell.match(/^[\d,]+\.?\d*$/)) {
          if (!description) description = cell;
          else description += " " + cell;
        }
      }

      if (!dateStr || !description) continue;

      const date = parseDate(dateStr);
      if (isNaN(date.getTime())) continue;
      if (amount === 0) continue;

      transactions.push({
        date: date.toISOString(),
        description: description.trim(),
        amount,
        type,
        reference: reference || undefined,
        narration: description.trim(),
      });
    } catch (err) {
      errors.push(`Row ${i + 1}: Parse error - ${err}`);
    }
  }

  const dates = transactions.map(t => new Date(t.date).getTime()).sort((a, b) => a - b);

  return {
    transactions,
    errors,
    metadata: {
      fileName: "",
      fileType: "pdf",
      totalRows: rows.length,
      parsedRows: transactions.length,
      dateRange: dates.length > 0
        ? { start: new Date(dates[0]).toISOString(), end: new Date(dates[dates.length - 1]).toISOString() }
        : undefined,
    },
  };
}

export async function parsePDF(buffer: ArrayBuffer, fileName: string): Promise<ParseResult> {
  return new Promise((resolve) => {
    try {
      const pdfParser = new PDFParser();

      pdfParser.on("pdfParser_dataError", (errData: any) => {
        console.error("[PDFParser] Error:", errData.parserError);
        resolve({
          transactions: [],
          errors: [`PDF parse error: ${errData.parserError}`],
          metadata: { fileName, fileType: "pdf", totalRows: 0, parsedRows: 0 },
        });
      });

      pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
        try {
          const text = extractTextFromPDF2Json(pdfData);
          const pageCount = pdfData.Pages ? pdfData.Pages.length : 0;
          console.log(`[PDFParser] Extracted text length: ${text.length}, pages: ${pageCount}`);

          if (!text || text.trim().length === 0) {
            resolve({
              transactions: [],
              errors: ["PDF contains no extractable text. It may be a scanned/image-based PDF."],
              metadata: { fileName, fileType: "pdf", totalRows: 0, parsedRows: 0 },
            });
            return;
          }

          const bankFormat = detectBankFormat(text);
          console.log(`[PDFParser] Detected bank format: ${bankFormat}`);

          let result: ParseResult;

          if (bankFormat === "palmpay-pdf") {
            console.log(`[PDFParser] Using PalmPay text-block parser`);
            result = parsePalmPayText(text);
          } else {
            const rows = extractTableRows(pdfData);
            console.log(`[PDFParser] Extracted ${rows.length} table rows`);

            for (let i = 0; i < Math.min(rows.length, 10); i++) {
              console.log(`[PDFParser] Pre-header row ${i}: ${rows[i].join(" | ")}`);
            }

            if (isPalmPayFormat(rows)) {
              console.log(`[PDFParser] Using PalmPay text-block parser (fallback)`);
              result = parsePalmPayText(text);
            } else {
              console.log(`[PDFParser] Using generic parser`);
              result = parseGenericRows(rows);
            }
          }

          result.metadata.fileName = fileName;
          console.log(`[PDFParser] Parsed ${result.transactions.length} transactions, ${result.errors.length} errors`);

          resolve(result);
        } catch (err) {
          console.error("[PDFParser] Processing error:", err);
          resolve({
            transactions: [],
            errors: [`PDF processing error: ${err}`],
            metadata: { fileName, fileType: "pdf", totalRows: 0, parsedRows: 0 },
          });
        }
      });

      pdfParser.parseBuffer(Buffer.from(buffer));
    } catch (error) {
      resolve({
        transactions: [],
        errors: [`PDF init error: ${error}`],
        metadata: { fileName, fileType: "pdf", totalRows: 0, parsedRows: 0 },
      });
    }
  });
}
