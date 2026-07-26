import * as XLSX from "xlsx";
import { ParsedTransaction, ParseResult } from "./types";
import { parseCSV } from "./csv-parser";

function parseDate(dateStr: string | number | Date): Date {
  if (dateStr instanceof Date) return dateStr;

  if (typeof dateStr === "number") {
    // Excel serial date
    const epoch = new Date(1900, 0, 1);
    return new Date(epoch.getTime() + (dateStr - 1) * 86400000);
  }

  const clean = String(dateStr).trim();

  let match = clean.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));

  match = clean.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));

  return new Date(clean);
}

function normalizeAmount(val: string | number): number {
  if (typeof val === "number") return Math.abs(val);
  if (!val) return 0;
  const cleaned = String(val).replace(/[^\d.,\-]/g, "").replace(/,/g, "");
  return Math.abs(parseFloat(cleaned) || 0);
}

export function parseExcel(buffer: ArrayBuffer, fileName: string): ParseResult {
  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      return {
        transactions: [],
        errors: ["No sheets found in Excel file"],
        metadata: { fileName, fileType: "excel", totalRows: 0, parsedRows: 0 },
      };
    }

    const sheet = workbook.Sheets[sheetName];
    const csvContent = XLSX.utils.sheet_to_csv(sheet);

    return parseCSV(csvContent, fileName);
  } catch (error) {
    return {
      transactions: [],
      errors: [`Excel parse error: ${error}`],
      metadata: { fileName, fileType: "excel", totalRows: 0, parsedRows: 0 },
    };
  }
}
