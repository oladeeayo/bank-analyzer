import Papa from "papaparse";
import { ParsedTransaction, ParseResult, BankFormat } from "./types";

const BANK_DETECTION_PATTERNS: Record<string, BankFormat> = {
  "GTBank": "gtbank-csv",
  "GTB": "gtbank-csv",
  "Access Bank": "access-csv",
  "Access": "access-csv",
  "UBA": "uba-csv",
  "OPay": "opay-csv",
  "Palmpay": "palmpay-csv",
  "Moniepoint": "moniepoint-csv",
  "Kuda": "kuda-csv",
  "First Bank": "firstbank-csv",
  "FirstBank": "firstbank-csv",
  "Zenith": "zenith-csv",
};

function detectBankFormat(headers: string[], firstRow: string[]): BankFormat {
  const headerStr = headers.join(" ").toLowerCase();
  const rowStr = firstRow.join(" ").toLowerCase();
  const combined = headerStr + " " + rowStr;

  for (const [pattern, format] of Object.entries(BANK_DETECTION_PATTERNS)) {
    if (combined.includes(pattern.toLowerCase())) {
      return format;
    }
  }

  if (combined.includes("transaction date") || combined.includes("posting date")) {
    if (combined.includes("gtbank") || combined.includes("gtb")) return "gtbank-csv";
    return "generic-csv";
  }

  return "generic-csv";
}

function parseDate(dateStr: string): Date {
  const clean = dateStr.trim();

  // Try DD/MM/YYYY
  let match = clean.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
  }

  // Try YYYY-MM-DD
  match = clean.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
  }

  // Try DD-MM-YYYY
  match = clean.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (match) {
    return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
  }

  // Try DD MMM YYYY
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  match = clean.match(/(\d{1,2})\s+(\w{3})\s+(\d{4})/);
  if (match) {
    const monthIdx = months.indexOf(match[2].toLowerCase());
    if (monthIdx >= 0) {
      return new Date(parseInt(match[3]), monthIdx, parseInt(match[1]));
    }
  }

  // Try DD MMM YYYY with full month name
  match = clean.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (match) {
    const monthIdx = months.findIndex(m => match[2].toLowerCase().startsWith(m));
    if (monthIdx >= 0) {
      return new Date(parseInt(match[3]), monthIdx, parseInt(match[1]));
    }
  }

  return new Date(clean);
}

function normalizeAmount(val: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/[^\d.,\-]/g, "").replace(/,/g, "");
  return Math.abs(parseFloat(cleaned) || 0);
}

function detectType(row: Record<string, string>, amount: number): "debit" | "credit" {
  const debitFields = ["debit", "withdrawal", "dr", "outflow", "payment"];
  const creditFields = ["credit", "deposit", "cr", "inflow", "receipt"];

  for (const key of Object.keys(row)) {
    const lower = key.toLowerCase();
    const value = (row[key] || "").toLowerCase();

    if (debitFields.some(f => lower.includes(f)) && value) return "debit";
    if (creditFields.some(f => lower.includes(f)) && value) return "credit";
  }

  // Check if amount is negative
  const rawVal = Object.values(row).find(v =>
    typeof v === "string" && /[\-]/.test(v) && /\d/.test(v)
  );
  if (rawVal && typeof rawVal === "string" && rawVal.includes("-")) return "debit";

  return amount > 0 ? "credit" : "debit";
}

function findField(row: Record<string, string>, candidates: string[]): string {
  for (const key of Object.keys(row)) {
    const lower = key.toLowerCase();
    if (candidates.some(c => lower.includes(c))) {
      return row[key] || "";
    }
  }
  return "";
}

export function parseCSV(content: string, fileName: string): ParseResult {
  const result = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  });

  if (result.errors.length > 0) {
    console.warn("PapaParse warnings (non-fatal):", result.errors.map(e => e.message).join("; "));
  }

  const headers = result.meta.fields || [];
  const firstRow = result.data[0] ? Object.values(result.data[0]) : [];
  const bankFormat = detectBankFormat(headers, firstRow);

  const transactions: ParsedTransaction[] = [];
  const errors: string[] = [];

  for (let i = 0; i < result.data.length; i++) {
    try {
      const row = result.data[i] as Record<string, string>;

      const dateStr = findField(row, ["date", "transaction date", "posting date", "value date", "trans date"]);
      const description = findField(row, ["description", "narration", "details", "transaction description", "trans. description", "particulars", "remarks"]);
      const amountStr = findField(row, ["amount", "transaction amount", "trans amount", "sum"]);
      const debitStr = findField(row, ["debit", "withdrawal", "dr"]);
      const creditStr = findField(row, ["credit", "deposit", "cr"]);
      const balanceStr = findField(row, ["balance", "running balance", "closing balance", "available balance"]);
      const reference = findField(row, ["reference", "ref", "transaction id", "trans id", "txn id"]);

      if (!dateStr || !description) {
        errors.push(`Row ${i + 1}: Missing date or description`);
        continue;
      }

      let amount = 0;
      let type: "debit" | "credit";

      if (debitStr && parseFloat(debitStr.replace(/[^\d.\-]/g, "")) > 0) {
        amount = normalizeAmount(debitStr);
        type = "debit";
      } else if (creditStr && parseFloat(creditStr.replace(/[^\d.\-]/g, "")) > 0) {
        amount = normalizeAmount(creditStr);
        type = "credit";
      } else {
        amount = normalizeAmount(amountStr);
        type = detectType(row, amount);
      }

      if (amount === 0) {
        errors.push(`Row ${i + 1}: Zero amount`);
        continue;
      }

      const date = parseDate(dateStr);
      if (isNaN(date.getTime())) {
        errors.push(`Row ${i + 1}: Invalid date "${dateStr}"`);
        continue;
      }

      const balance = balanceStr ? normalizeAmount(balanceStr) : undefined;

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
      fileType: "csv",
      totalRows: result.data.length,
      parsedRows: transactions.length,
      dateRange: dates.length > 0
        ? { start: new Date(dates[0]).toISOString(), end: new Date(dates[dates.length - 1]).toISOString() }
        : undefined,
    },
  };
}
