// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");
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

function parseDate(dateStr: string): Date {
  const clean = dateStr.trim();

  let match = clean.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));

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

  match = clean.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (match) {
    const monthIdx = months[match[2].toLowerCase().slice(0, 3)];
    if (monthIdx !== undefined) return new Date(parseInt(match[3]), monthIdx, parseInt(match[1]));
  }

  return new Date(clean);
}

function normalizeAmount(val: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/[^\d.,\-]/g, "").replace(/,/g, "");
  return Math.abs(parseFloat(cleaned) || 0);
}

function parsePalmPayPDF(text: string, fileName: string): ParseResult {
  console.log(`[PalmPayPDF] Raw text length: ${text.length}`);
  console.log(`[PalmPayPDF] First 2000 chars:\n${text.substring(0, 2000)}`);

  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  console.log(`[PalmPayPDF] Total lines: ${lines.length}`);
  if (lines.length > 0) console.log(`[PalmPayPDF] First 10 lines:`, lines.slice(0, 10));

  const transactions: ParsedTransaction[] = [];
  const errors: string[] = [];

  // PalmPay PDF has lines like:
  // "Transaction Date: 2025-06-01 12:00:00 | Description: Transfer to ... | Amount: 5000 | Type: Debit"
  // OR table-like format with pipe separators or tab-separated
  // Try to find transaction lines by looking for date patterns

  const datePattern = /(\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4}|\d{2}\s+\w{3}\s+\d{4})/;

  for (const line of lines) {
    // Skip header/metadata lines
    if (line.toLowerCase().includes("palmpay") && line.length < 50) continue;
    if (line.toLowerCase().includes("statement")) continue;
    if (line.toLowerCase().includes("account")) continue;
    if (line.toLowerCase().includes("total money")) continue;
    if (line.toLowerCase().includes("page")) continue;

    const dateMatch = line.match(datePattern);
    if (!dateMatch) continue;

    const date = parseDate(dateMatch[1]);
    if (isNaN(date.getTime())) continue;

    // Try to extract description and amount from the line
    // Common formats: pipe-separated, tab-separated, or space-separated
    let parts: string[] = [];
    if (line.includes("|")) {
      parts = line.split("|").map(p => p.trim());
    } else if (line.includes("\t")) {
      parts = line.split("\t").map(p => p.trim());
    } else {
      // Try to split by multiple spaces
      parts = line.split(/\s{2,}/).map(p => p.trim());
    }

    if (parts.length < 2) continue;

    // Find the amount (look for numbers with optional commas and decimals)
    let amount = 0;
    let type: "debit" | "credit" = "debit";
    let description = "";
    let balance: number | undefined;
    let reference: string | undefined;

    for (const part of parts) {
      const numMatch = part.match(/[\d,]+\.?\d*/);
      if (numMatch && !datePattern.test(part)) {
        const num = normalizeAmount(numMatch[0]);
        if (num > 0) {
          if (part.includes("-") || part.toLowerCase().includes("debit") || part.toLowerCase().includes("out")) {
            type = "debit";
            amount = num;
          } else if (part.includes("+") || part.toLowerCase().includes("credit") || part.toLowerCase().includes("in")) {
            type = "credit";
            amount = num;
          } else if (amount === 0) {
            amount = num;
          }
        }
      } else if (part.toLowerCase().includes("debit") || part.toLowerCase().includes("out")) {
        type = "debit";
      } else if (part.toLowerCase().includes("credit") || part.toLowerCase().includes("in")) {
        type = "credit";
      } else if (!datePattern.test(part) && part.length > 3) {
        if (!description) description = part;
        else description += " " + part;
      }
    }

    // If we still don't have a description, use the whole line minus date and amount
    if (!description) {
      description = line.replace(dateMatch[0], "").replace(/[\d,]+\.?\d*/g, "").trim();
    }

    if (amount === 0) {
      // Try to find amount in the line by looking for the last number
      const allNumbers = line.match(/[\d,]+\.?\d*/g);
      if (allNumbers && allNumbers.length > 0) {
        amount = normalizeAmount(allNumbers[allNumbers.length - 1]);
      }
    }

    if (amount === 0) {
      errors.push(`Line: Could not parse amount from "${line.substring(0, 80)}"`);
      continue;
    }

    transactions.push({
      date: date.toISOString(),
      description: description || "Unknown transaction",
      amount,
      type,
      balance,
      reference,
      narration: description,
    });
  }

  const dates = transactions.map(t => new Date(t.date).getTime()).sort((a, b) => a - b);

  console.log(`[PalmPayPDF] Parsed ${transactions.length} transactions, ${errors.length} errors`);
  if (transactions.length > 0) {
    console.log(`[PalmPayPDF] First transaction:`, transactions[0]);
    console.log(`[PalmPayPDF] Last transaction:`, transactions[transactions.length - 1]);
  }
  if (errors.length > 0) {
    console.log(`[PalmPayPDF] Errors:`, errors.slice(0, 5));
  }

  return {
    transactions,
    errors,
    metadata: {
      fileName,
      fileType: "pdf",
      totalRows: lines.length,
      parsedRows: transactions.length,
      dateRange: dates.length > 0
        ? { start: new Date(dates[0]).toISOString(), end: new Date(dates[dates.length - 1]).toISOString() }
        : undefined,
    },
  };
}

export async function parsePDF(buffer: ArrayBuffer, fileName: string): Promise<ParseResult> {
  try {
    const data = await pdfParse(Buffer.from(buffer));
    const text = data.text;

    if (!text || text.trim().length === 0) {
      return {
        transactions: [],
        errors: ["PDF contains no extractable text. The PDF may be scanned/image-based. Please export as CSV or Excel."],
        metadata: { fileName, fileType: "pdf", totalRows: 0, parsedRows: 0 },
      };
    }

    const bankFormat = detectBankFormat(text);

    // For PalmPay PDFs, use the dedicated parser
    if (bankFormat === "palmpay-pdf") {
      return parsePalmPayPDF(text, fileName);
    }

    // For other banks, try generic table extraction
    // Look for lines that contain dates and amounts
    const lines = text.split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 5);
    const transactions: ParsedTransaction[] = [];
    const errors: string[] = [];

    const datePattern = /(\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4}|\d{2}\s+\w{3}\s+\d{4})/;

    for (const line of lines) {
      const dateMatch = line.match(datePattern);
      if (!dateMatch) continue;

      const date = parseDate(dateMatch[1]);
      if (isNaN(date.getTime())) continue;

      let parts: string[] = [];
      if (line.includes("|")) {
        parts = line.split("|").map((p: string) => p.trim());
      } else if (line.includes("\t")) {
        parts = line.split("\t").map((p: string) => p.trim());
      } else {
        parts = line.split(/\s{2,}/).map((p: string) => p.trim());
      }

      if (parts.length < 2) continue;

      let amount = 0;
      let type: "debit" | "credit" = "debit";
      let description = "";

      for (const part of parts) {
        const numMatch = part.match(/[\d,]+\.?\d*/);
        if (numMatch && !datePattern.test(part)) {
          const num = normalizeAmount(numMatch[0]);
          if (num > 0) {
            if (part.includes("-") || part.toLowerCase().includes("debit")) {
              type = "debit";
              amount = num;
            } else if (part.includes("+") || part.toLowerCase().includes("credit")) {
              type = "credit";
              amount = num;
            } else if (amount === 0) {
              amount = num;
            }
          }
        } else if (!datePattern.test(part) && part.length > 3 && !description) {
          description = part;
        }
      }

      if (!description) {
        description = line.replace(dateMatch[0], "").replace(/[\d,]+\.?\d*/g, "").trim();
      }

      if (amount === 0) {
        const allNumbers = line.match(/[\d,]+\.?\d*/g);
        if (allNumbers && allNumbers.length > 0) {
          amount = normalizeAmount(allNumbers[allNumbers.length - 1]);
        }
      }

      if (amount === 0) continue;

      transactions.push({
        date: date.toISOString(),
        description: description || "Unknown transaction",
        amount,
        type,
        narration: description,
      });
    }

    const dates = transactions.map(t => new Date(t.date).getTime()).sort((a, b) => a - b);

    return {
      transactions,
      errors,
      metadata: {
        fileName,
        fileType: "pdf",
        totalRows: lines.length,
        parsedRows: transactions.length,
        dateRange: dates.length > 0
          ? { start: new Date(dates[0]).toISOString(), end: new Date(dates[dates.length - 1]).toISOString() }
          : undefined,
      },
    };
  } catch (error) {
    return {
      transactions: [],
      errors: [`PDF parse error: ${error}`],
      metadata: { fileName, fileType: "pdf", totalRows: 0, parsedRows: 0 },
    };
  }
}
