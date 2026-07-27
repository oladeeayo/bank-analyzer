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

function parseDate(dateStr: string): Date {
  const clean = dateStr.trim();

  let match = clean.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})\s*(AM|PM)/i);
  if (match) {
    let hours = parseInt(match[4]);
    const minutes = parseInt(match[5]);
    const seconds = parseInt(match[6]);
    const ampm = match[7].toUpperCase();
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]), hours, minutes, seconds);
  }

  match = clean.match(/(\d{2})\/(\d{2})\/(\d{4})/);
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

  return new Date(clean);
}

const DATE_PATTERN = /\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}\s*(AM|PM)/i;
const SIMPLE_DATE_PATTERN = /\d{2}\/\d{2}\/\d{4}/;
const AMOUNT_PATTERN = /^[+-]?[\d,]+\.?\d*$/;

function extractTextFromPDF2Json(pdfData: any): string {
  const lines: string[] = [];
  if (pdfData.Pages) {
    for (const page of pdfData.Pages) {
      if (page.Texts) {
        for (const text of page.Texts) {
          if (text.R) {
            for (const r of text.R) {
              if (r.T) lines.push(decodeURIComponent(r.T));
            }
          }
        }
      }
    }
  }
  return lines.join("\n");
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
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const joined = rows[i].join(" ").toLowerCase();
    if (joined.includes("transaction date") && joined.includes("transaction detail")) return true;
    if (joined.includes("palmpay")) return true;
  }
  return false;
}

function parsePalmPayRows(rows: string[][]): ParseResult {
  const transactions: ParsedTransaction[] = [];
  const errors: string[] = [];

  let headerIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const joined = rows[i].join(" ").toLowerCase();
    if (joined.includes("transaction date") && joined.includes("transaction detail")) {
      headerIdx = i;
      break;
    }
  }

  if (headerIdx === -1) {
    return {
      transactions: [],
      errors: ["Could not find PalmPay transaction header row"],
      metadata: { fileName: "", fileType: "pdf", totalRows: rows.length, parsedRows: 0 },
    };
  }

  const dataRows = rows.slice(headerIdx + 1);

  let pendingDetail = "";

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    if (row.length === 0) continue;

    const firstCell = row[0];
    const hasDate = DATE_PATTERN.test(firstCell) || SIMPLE_DATE_PATTERN.test(firstCell);

    if (!hasDate) {
      const text = row.join(" ").trim();
      if (text && !text.startsWith("PalmPay") && !text.startsWith("Digital Finance") &&
          !text.includes("Account Statement") && !text.includes("Total Money") &&
          !text.includes("Statement Period") && !text.includes("Print Time") &&
          !text.includes("Transaction Date") && !text.includes("support@") &&
          !text.includes("www.palmpay") && !text.includes("018886888") &&
          !text.includes("20 Opebi") && !text.includes("Phone Number") &&
          !text.includes("Account Number") && !text.includes("NGN")) {
        pendingDetail += (pendingDetail ? " " : "") + text;
      }
      continue;
    }

    let dateStr = firstCell;
    const date = parseDate(dateStr);
    if (isNaN(date.getTime())) {
      errors.push(`Row ${headerIdx + i + 2}: Invalid date "${dateStr}"`);
      continue;
    }

    let detail = "";
    let amount = 0;
    let type: "debit" | "credit" = "debit";
    let reference = "";

    if (row.length === 2) {
      const cell1 = row[1];
      if (AMOUNT_PATTERN.test(cell1)) {
        amount = Math.abs(parseFloat(cell1.replace(/,/g, "")));
        type = cell1.startsWith("-") || (!cell1.startsWith("+") && amount > 0) ? "debit" : "credit";
      }
    } else if (row.length === 3) {
      const cell1 = row[1];
      const cell2 = row[2];
      if (AMOUNT_PATTERN.test(cell1)) {
        amount = Math.abs(parseFloat(cell1.replace(/,/g, "")));
        type = cell1.startsWith("-") || (!cell1.startsWith("+") && amount > 0) ? "debit" : "credit";
        reference = AMOUNT_PATTERN.test(cell2) ? "" : cell2;
      } else if (AMOUNT_PATTERN.test(cell2)) {
        detail = cell1;
        amount = Math.abs(parseFloat(cell2.replace(/,/g, "")));
        type = cell2.startsWith("-") || (!cell2.startsWith("+") && amount > 0) ? "debit" : "credit";
      }
    } else if (row.length === 4) {
      detail = row[1];
      const cell2 = row[2];
      const cell3 = row[3];
      if (AMOUNT_PATTERN.test(cell2)) {
        amount = Math.abs(parseFloat(cell2.replace(/,/g, "")));
        type = cell2.startsWith("-") || (!cell2.startsWith("+") && amount > 0) ? "debit" : "credit";
        reference = cell3;
      } else if (AMOUNT_PATTERN.test(cell3)) {
        amount = Math.abs(parseFloat(cell3.replace(/,/g, "")));
        type = cell3.startsWith("-") || (!cell3.startsWith("+") && amount > 0) ? "debit" : "credit";
      }
    } else if (row.length >= 5) {
      detail = row[1];
      const cell2 = row[2];
      const cell3 = row[3];
      reference = row[4] || "";
      if (AMOUNT_PATTERN.test(cell2)) {
        amount = Math.abs(parseFloat(cell2.replace(/,/g, "")));
        type = cell2.startsWith("-") || (!cell2.startsWith("+") && amount > 0) ? "debit" : "credit";
      } else if (AMOUNT_PATTERN.test(cell3)) {
        amount = Math.abs(parseFloat(cell3.replace(/,/g, "")));
        type = cell3.startsWith("-") || (!cell3.startsWith("+") && amount > 0) ? "debit" : "credit";
      }
    }

    if (pendingDetail && !detail) {
      detail = pendingDetail;
      pendingDetail = "";
    } else if (pendingDetail && detail) {
      detail = pendingDetail + " " + detail;
      pendingDetail = "";
    }

    if (!detail) detail = "Unknown transaction";

    if (amount === 0) {
      errors.push(`Row ${headerIdx + i + 2}: Zero or missing amount for "${detail.substring(0, 40)}"`);
      continue;
    }

    transactions.push({
      date: date.toISOString(),
      description: detail.trim(),
      amount,
      type,
      reference: reference || undefined,
      narration: detail.trim(),
    });
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
      totalRows: rows.length,
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
          console.log(`[PDFParser] Extracted text length: ${text.length}`);

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

          const rows = extractTableRows(pdfData);
          console.log(`[PDFParser] Extracted ${rows.length} table rows`);

          let result: ParseResult;

          if (bankFormat === "palmpay-pdf" || isPalmPayFormat(rows)) {
            console.log(`[PDFParser] Using PalmPay parser`);
            result = parsePalmPayRows(rows);
          } else {
            console.log(`[PDFParser] Using generic parser`);
            result = parseGenericRows(rows);
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
