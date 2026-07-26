import * as XLSX from "xlsx";
import { ParsedTransaction, ParseResult } from "./types";

function parseDate(dateStr: string | number | Date): Date {
  if (dateStr instanceof Date) return dateStr;

  if (typeof dateStr === "number") {
    const epoch = new Date(1900, 0, 1);
    return new Date(epoch.getTime() + (dateStr - 1) * 86400000);
  }

  const clean = String(dateStr).trim();

  // DD Mon YYYY HH:MM:SS (e.g., "01 Jan 2026 01:42:14")
  const months: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };
  let match = clean.match(/(\d{1,2})\s+(\w{3})\s+(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})/);
  if (match) {
    const month = months[match[2].toLowerCase()];
    if (month !== undefined) {
      return new Date(parseInt(match[3]), month, parseInt(match[1]), parseInt(match[4]), parseInt(match[5]), parseInt(match[6]));
    }
  }

  // DD Mon YYYY (no time)
  match = clean.match(/(\d{1,2})\s+(\w{3})\s+(\d{4})/);
  if (match) {
    const month = months[match[2].toLowerCase()];
    if (month !== undefined) {
      return new Date(parseInt(match[3]), month, parseInt(match[1]));
    }
  }

  match = clean.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));

  match = clean.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));

  return new Date(clean);
}

function normalizeAmount(val: string | number): number {
  if (typeof val === "number") return Math.abs(val);
  if (!val || val === "--" || val === "-") return 0;
  const cleaned = String(val).replace(/[^\d.,\-]/g, "").replace(/,/g, "");
  return Math.abs(parseFloat(cleaned) || 0);
}

function findHeaderRow(rows: any[][]): number {
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i];
    if (!row) continue;
    const joined = row.map((c) => String(c || "").toLowerCase().trim()).join("|");
    if (
      joined.includes("trans") && joined.includes("date") ||
      joined.includes("description") && (joined.includes("debit") || joined.includes("amount")) ||
      joined.includes("narration") ||
      joined.includes("transaction date")
    ) {
      return i;
    }
  }
  return -1;
}

function mapColumns(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  headers.forEach((h, i) => {
    const lower = h.toLowerCase().trim();
    if (lower.includes("trans") && lower.includes("date")) map.date = i;
    else if (lower === "date" || lower.includes("value date") || lower.includes("transaction date")) {
      if (map.date === undefined) map.date = i;
    }
    else if (lower.includes("description") || lower.includes("narration") || lower.includes("details")) map.description = i;
    else if (lower.includes("debit")) map.debit = i;
    else if (lower.includes("credit")) map.credit = i;
    else if (lower.includes("amount") && map.debit === undefined) map.amount = i;
    else if (lower.includes("balance")) map.balance = i;
    else if (lower.includes("reference") || lower.includes("ref")) map.reference = i;
    else if (lower.includes("channel") || lower.includes("type")) map.type = i;
  });
  return map;
}

export function parseExcel(buffer: ArrayBuffer, fileName: string): ParseResult {
  try {
    console.log(`[ExcelParser] Parsing ${fileName}, buffer size: ${buffer.byteLength}`);
    const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
    const sheetName = workbook.SheetNames[0];

    console.log(`[ExcelParser] Sheets: ${workbook.SheetNames.join(", ")}`);

    if (!sheetName) {
      return {
        transactions: [],
        errors: ["No sheets found in Excel file"],
        metadata: { fileName, fileType: "excel", totalRows: 0, parsedRows: 0 },
      };
    }

    const sheet = workbook.Sheets[sheetName];
    const allRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

    console.log(`[ExcelParser] Rows: ${allRows.length}`);
    if (allRows.length > 0) console.log(`[ExcelParser] Row 0:`, JSON.stringify(allRows[0]?.slice(0, 8)));
    if (allRows.length > 4) console.log(`[ExcelParser] Row 4:`, JSON.stringify(allRows[4]?.slice(0, 8)));
    if (allRows.length > 5) console.log(`[ExcelParser] Row 5:`, JSON.stringify(allRows[5]?.slice(0, 8)));

    if (allRows.length === 0) {
      return {
        transactions: [],
        errors: ["Sheet is empty"],
        metadata: { fileName, fileType: "excel", totalRows: 0, parsedRows: 0 },
      };
    }

    const headerIdx = findHeaderRow(allRows);
    console.log(`[ExcelParser] Header row index: ${headerIdx}`);
    if (headerIdx === -1) {
      // Fallback: try CSV conversion
      const csvContent = XLSX.utils.sheet_to_csv(sheet);
      return parseCSVFromExcel(csvContent, fileName);
    }

    const headers = allRows[headerIdx].map((h) => String(h || "").trim());
    const colMap = mapColumns(headers);
    const dataRows = allRows.slice(headerIdx + 1);

    const transactions: ParsedTransaction[] = [];
    const errors: string[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      try {
        const row = dataRows[i];
        if (!row || row.every((c) => !c && c !== 0)) continue;

        const dateVal = colMap.date !== undefined ? row[colMap.date] : null;
        const desc = colMap.description !== undefined ? String(row[colMap.description] || "") : "";
        const debitVal = colMap.debit !== undefined ? row[colMap.debit] : null;
        const creditVal = colMap.credit !== undefined ? row[colMap.credit] : null;
        const amountVal = colMap.amount !== undefined ? row[colMap.amount] : null;
        const balanceVal = colMap.balance !== undefined ? row[colMap.balance] : null;
        const refVal = colMap.reference !== undefined ? String(row[colMap.reference] || "") : undefined;

        if (!dateVal || !desc) continue;

        const date = parseDate(dateVal);
        if (isNaN(date.getTime())) {
          errors.push(`Row ${i + headerIdx + 2}: Invalid date "${dateVal}"`);
          continue;
        }

        const debit = debitVal ? normalizeAmount(debitVal) : 0;
        const credit = creditVal ? normalizeAmount(creditVal) : 0;

        let amount = 0;
        let type: "debit" | "credit";

        if (debit > 0 && credit === 0) {
          amount = debit;
          type = "debit";
        } else if (credit > 0 && debit === 0) {
          amount = credit;
          type = "credit";
        } else if (debit > 0 && credit > 0) {
          // Both present — shouldn't happen, but prioritize debit
          amount = debit;
          type = "debit";
        } else if (amountVal) {
          amount = normalizeAmount(amountVal);
          type = amount > 0 ? "credit" : "debit";
        } else {
          continue;
        }

        if (amount === 0) continue;

        const balance = balanceVal ? normalizeAmount(balanceVal) : undefined;

        transactions.push({
          date: date.toISOString(),
          description: desc.trim(),
          amount,
          type,
          balance,
          reference: refVal || undefined,
          narration: desc.trim(),
        });
      } catch (err) {
        errors.push(`Row ${i + headerIdx + 2}: Parse error`);
      }
    }

    const dates = transactions.map((t) => new Date(t.date).getTime()).sort((a, b) => a - b);

    console.log(`[ExcelParser] Parsed ${transactions.length} transactions, ${errors.length} errors`);

    return {
      transactions,
      errors,
      metadata: {
        fileName,
        fileType: "excel",
        totalRows: allRows.length,
        parsedRows: transactions.length,
        dateRange:
          dates.length > 0
            ? { start: new Date(dates[0]).toISOString(), end: new Date(dates[dates.length - 1]).toISOString() }
            : undefined,
      },
    };
  } catch (error) {
    return {
      transactions: [],
      errors: [`Excel parse error: ${error}`],
      metadata: { fileName, fileType: "excel", totalRows: 0, parsedRows: 0 },
    };
  }
}

function parseCSVFromExcel(csvContent: string, fileName: string): ParseResult {
  const lines = csvContent.split("\n");
  const transactions: ParsedTransaction[] = [];
  const errors: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].split(",").map((p) => p.trim());
    if (parts.length < 4) continue;
    // Try to parse as transaction
    const date = parseDate(parts[0]);
    if (isNaN(date.getTime())) continue;
    const desc = parts[2] || "";
    const amount = normalizeAmount(parts[3] || "0");
    if (amount > 0 && desc) {
      transactions.push({
        date: date.toISOString(),
        description: desc,
        amount,
        type: "debit",
      });
    }
  }

  return {
    transactions,
    errors,
    metadata: { fileName, fileType: "excel", totalRows: lines.length, parsedRows: transactions.length },
  };
}
