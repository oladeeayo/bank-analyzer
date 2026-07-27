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

function extractTextFromPDF2Json(pdfData: any): string {
  const lines: string[] = [];

  if (pdfData.Pages) {
    for (const page of pdfData.Pages) {
      if (page.Texts) {
        for (const text of page.Texts) {
          if (text.R) {
            for (const r of text.R) {
              if (r.T) {
                lines.push(decodeURIComponent(r.T));
              }
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
        const decoded = decodeURIComponent(text.R[0].T || "");
        if (!decoded.trim()) continue;
        const y = Math.round(text.y * 10) / 10;
        const x = Math.round(text.x * 10) / 10;
        if (!textsByY[y]) textsByY[y] = [];
        textsByY[y].push({ x, text: decoded.trim() });
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

function parseTransactionsFromRows(rows: string[][], bankFormat: BankFormat, fileName: string): ParseResult {
  const transactions: ParsedTransaction[] = [];
  const errors: string[] = [];

  const datePattern = /(\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4}|\d{2}\s+\w{3}\s+\d{4})/;

  let headerIdx = -1;
  let dateCol = -1;
  let descCol = -1;
  let debitCol = -1;
  let creditCol = -1;
  let amountCol = -1;
  let balanceCol = -1;
  let refCol = -1;

  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i];
    const joined = row.join(" ").toLowerCase();
    if (
      (joined.includes("date") && (joined.includes("description") || joined.includes("narration"))) ||
      (joined.includes("trans") && joined.includes("date"))
    ) {
      headerIdx = i;
      for (let j = 0; j < row.length; j++) {
        const h = row[j].toLowerCase();
        if (h.includes("date")) dateCol = j;
        else if (h.includes("description") || h.includes("narration") || h.includes("details")) descCol = j;
        else if (h.includes("debit") || h.includes("withdrawal")) debitCol = j;
        else if (h.includes("credit") || h.includes("deposit")) creditCol = j;
        else if (h.includes("amount") && debitCol === -1) amountCol = j;
        else if (h.includes("balance")) balanceCol = j;
        else if (h.includes("reference") || h.includes("ref")) refCol = j;
      }
      break;
    }
  }

  const startRow = headerIdx >= 0 ? headerIdx + 1 : 0;

  for (let i = startRow; i < rows.length; i++) {
    try {
      const row = rows[i];
      if (row.length < 2) continue;

      let dateStr = "";
      let description = "";
      let amount = 0;
      let type: "debit" | "credit" = "debit";
      let balance: number | undefined;
      let reference: string | undefined;

      if (headerIdx >= 0) {
        dateStr = dateCol >= 0 ? row[dateCol] || "" : "";
        description = descCol >= 0 ? row[descCol] || "" : "";

        if (debitCol >= 0 && row[debitCol]) {
          const debit = normalizeAmount(row[debitCol]);
          if (debit > 0) { amount = debit; type = "debit"; }
        }
        if (creditCol >= 0 && row[creditCol]) {
          const credit = normalizeAmount(row[creditCol]);
          if (credit > 0) { amount = credit; type = "credit"; }
        }
        if (amount === 0 && amountCol >= 0 && row[amountCol]) {
          amount = normalizeAmount(row[amountCol]);
          type = row[amountCol].includes("-") ? "debit" : "credit";
        }
        if (balanceCol >= 0 && row[balanceCol]) balance = normalizeAmount(row[balanceCol]);
        if (refCol >= 0 && row[refCol]) reference = row[refCol];
      } else {
        for (const cell of row) {
          if (!dateStr && datePattern.test(cell)) {
            const m = cell.match(datePattern);
            if (m) dateStr = m[1];
          }
        }
        for (const cell of row) {
          if (cell.match(/[\d,]+\.?\d*/) && !datePattern.test(cell) && cell.length < 30) {
            const num = normalizeAmount(cell);
            if (num > 0) {
              if (amount === 0) {
                amount = num;
                type = cell.includes("-") || cell.toLowerCase().includes("dr") ? "debit" : "credit";
              }
            }
          } else if (!datePattern.test(cell) && cell.length > 2 && !cell.match(/^[\d,]+\.?\d*$/)) {
            if (!description) description = cell;
            else description += " " + cell;
          }
        }
      }

      if (!dateStr) {
        for (const cell of row) {
          if (datePattern.test(cell)) {
            const m = cell.match(datePattern);
            if (m) { dateStr = m[1]; break; }
          }
        }
      }

      if (!dateStr || !description) continue;

      const date = parseDate(dateStr);
      if (isNaN(date.getTime())) {
        errors.push(`Row ${i + 1}: Invalid date "${dateStr}"`);
        continue;
      }

      if (amount === 0) {
        errors.push(`Row ${i + 1}: Zero amount`);
        continue;
      }

      transactions.push({
        date: date.toISOString(),
        description: description.trim(),
        amount,
        type,
        balance,
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
      fileName,
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
          if (rows.length > 0) {
            console.log(`[PDFParser] First 20 rows:`);
            for (let i = 0; i < Math.min(20, rows.length); i++) {
              console.log(`  Row ${i}: ${JSON.stringify(rows[i])}`);
            }
          }
          // Also log rows that look like they contain dates
          const dateRows = rows.filter(r => r.some(c => /\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4}/.test(c)));
          console.log(`[PDFParser] Rows with dates: ${dateRows.length}`);
          if (dateRows.length > 0) {
            console.log(`[PDFParser] First 10 date rows:`);
            for (let i = 0; i < Math.min(10, dateRows.length); i++) {
              console.log(`  ${JSON.stringify(dateRows[i])}`);
            }
          }

          const result = parseTransactionsFromRows(rows, bankFormat, fileName);
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
