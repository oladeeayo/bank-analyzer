import Papa from "papaparse";
import { ParsedTransaction, ParseResult, BankFormat } from "./types";
import { detectBankNameFromFormat, extractAccountNumber, extractAccountName } from "./bank-detection";

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

  let match = clean.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
  }

  match = clean.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
  }

  match = clean.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (match) {
    return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
  }

  match = clean.match(/(\d{1,2})\s+(\w{3})\s+(\d{4})/);
  if (match) {
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const monthIdx = months.indexOf(match[2].toLowerCase());
    if (monthIdx >= 0) {
      return new Date(parseInt(match[3]), monthIdx, parseInt(match[1]));
    }
  }

  match = clean.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (match) {
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const monthName = match[2].toLowerCase();
    const monthIdx = months.findIndex(m => monthName.startsWith(m));
    if (monthIdx >= 0) {
      return new Date(parseInt(match[3]), monthIdx, parseInt(match[1]));
    }
  }

  // Try DD/MM/YY (2-digit year)
  const shortYearMatch = clean.match(/(\d{1,2})\/(\d{1,2})\/(\d{2})\b/);
  if (shortYearMatch) {
    const year = 2000 + parseInt(shortYearMatch[3]);
    return new Date(year, parseInt(shortYearMatch[2]) - 1, parseInt(shortYearMatch[1]));
  }

  return new Date(clean);
}

function normalizeAmount(val: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/[^\d.,\-]/g, "").replace(/,/g, "");
  return Math.abs(parseFloat(cleaned) || 0);
}

function detectType(row: Record<string, string>, amount: number): "debit" | "credit" {
  const debitFields = ["debit", "withdrawal", "dr", "outflow", "payment", "money out", "paid out"];
  const creditFields = ["credit", "deposit", "cr", "inflow", "receipt", "money in", "paid in"];

  for (const key of Object.keys(row)) {
    const lower = key.toLowerCase();
    const value = (row[key] || "").toLowerCase();

    if (debitFields.some(f => lower.includes(f)) && value && parseFloat(value.replace(/[^\d.\-]/g, "")) > 0) return "debit";
    if (creditFields.some(f => lower.includes(f)) && value && parseFloat(value.replace(/[^\d.\-]/g, "")) > 0) return "credit";
  }

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

const HEADER_KEYWORDS = [
  "date", "transaction date", "posting date", "value date", "trans date",
  "description", "narration", "details", "particulars", "remarks",
  "debit", "credit", "amount", "money in", "money out",
  "inflow", "outflow", "balance", "reference", "ref",
  "withdrawal", "deposit", "paid in", "paid out",
];

function findHeaderRowIndex(lines: string[][]): number {
  for (let i = 0; i < Math.min(lines.length, 25); i++) {
    const row = lines[i];
    if (!row || row.length < 2) continue;
    const joined = row.map(c => (c || "").toLowerCase().trim()).join(" ");
    let keywordCount = 0;
    for (const kw of HEADER_KEYWORDS) {
      if (joined.includes(kw)) keywordCount++;
    }
    if (keywordCount >= 2) return i;
  }
  return 0;
}

export function parseCSV(content: string, fileName: string): ParseResult {
  // First pass: parse without header assumption to detect header row
  const rawResult = Papa.parse(content, {
    header: false,
    skipEmptyLines: true,
  });

  const rawRows = rawResult.data as string[][];
  if (rawRows.length === 0) {
    return {
      transactions: [],
      errors: ["Empty file"],
      metadata: { fileName, fileType: "csv", totalRows: 0, parsedRows: 0 },
    };
  }

  const headerIdx = findHeaderRowIndex(rawRows);
  const rawHeaders = rawRows[headerIdx]?.map(h => (h || "").trim()) || [];
  const dataRows = rawRows.slice(headerIdx + 1).filter(row => {
    if (!row || row.length < 2) return false;
    const joined = row.map(c => (c || "").trim()).join("");
    return joined.length > 0;
  });

  // Build column index mapping from detected headers
  const colMap: Record<string, number> = {};
  rawHeaders.forEach((h, i) => {
    const lower = h.toLowerCase().trim();
    if (HEADER_DATE.some(c => lower.includes(c))) colMap.date = i;
    if (HEADER_DESC.some(c => lower.includes(c)) && colMap.description === undefined) colMap.description = i;
    if (HEADER_DEBIT.some(c => lower.includes(c))) colMap.debit = i;
    if (HEADER_CREDIT.some(c => lower.includes(c))) colMap.credit = i;
    if (HEADER_AMOUNT.some(c => lower.includes(c)) && colMap.debit === undefined && colMap.credit === undefined) colMap.amount = i;
    if (HEADER_BALANCE.some(c => lower.includes(c))) colMap.balance = i;
    if (HEADER_REF.some(c => lower.includes(c))) colMap.reference = i;
  });

  // If no description column found via headers, use "to / from" or longest text column
  if (colMap.description === undefined) {
    const toFromIdx = rawHeaders.findIndex(h => {
      const lower = h.toLowerCase().trim();
      return lower.includes("to / from") || lower.includes("to/from") || lower.includes("beneficiary") || lower.includes("sender") || lower.includes("from");
    });
    if (toFromIdx >= 0) colMap.description = toFromIdx;
  }

  // Build a record-like object for each row using detected column indices
  const fields = rawHeaders.length > 0 ? rawHeaders : dataRows[0]?.map((_, i) => `col_${i}`) || [];
  const rowsAsRecords = dataRows.map(row => {
    const rec: Record<string, string> = {};
    fields.forEach((f, i) => {
      rec[f] = row[i] !== undefined ? String(row[i]) : "";
    });
    // Also add aliases for positional access
    if (colMap.date !== undefined) rec["_date"] = row[colMap.date] || "";
    if (colMap.description !== undefined) rec["_description"] = row[colMap.description] || "";
    if (colMap.debit !== undefined) rec["_debit"] = row[colMap.debit] || "";
    if (colMap.credit !== undefined) rec["_credit"] = row[colMap.credit] || "";
    if (colMap.amount !== undefined) rec["_amount"] = row[colMap.amount] || "";
    if (colMap.balance !== undefined) rec["_balance"] = row[colMap.balance] || "";
    if (colMap.reference !== undefined) rec["_reference"] = row[colMap.reference] || "";
    return rec;
  });

  const headers = rawHeaders;
  const firstRow = dataRows[0] ? dataRows[0].map(c => String(c || "")) : [];
  const bankFormat = detectBankFormat(headers, firstRow);

  const transactions: ParsedTransaction[] = [];
  const errors: string[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    try {
      const row = rowsAsRecords[i];

      // Prefer positional mapping, fall back to header-based findField
      const dateStr = (colMap.date !== undefined ? row["_date"] : "") || findField(row, HEADER_DATE);
      const description = (colMap.description !== undefined ? row["_description"] : "") || findField(row, HEADER_DESC);
      const debitStr = (colMap.debit !== undefined ? row["_debit"] : "") || findField(row, HEADER_DEBIT);
      const creditStr = (colMap.credit !== undefined ? row["_credit"] : "") || findField(row, HEADER_CREDIT);
      const amountStr = (colMap.amount !== undefined ? row["_amount"] : "") || findField(row, HEADER_AMOUNT);
      const balanceStr = (colMap.balance !== undefined ? row["_balance"] : "") || findField(row, HEADER_BALANCE);
      const reference = (colMap.reference !== undefined ? row["_reference"] : "") || findField(row, HEADER_REF);

      if (!dateStr || !description) {
        errors.push(`Row ${i + 1}: Missing date or description`);
        continue;
      }

      let amount = 0;
      let type: "debit" | "credit";

      const debitVal = parseFloat(String(debitStr || "0").replace(/[^\d.\-]/g, ""));
      const creditVal = parseFloat(String(creditStr || "0").replace(/[^\d.\-]/g, ""));

      if (debitVal > 0 && creditVal === 0) {
        amount = normalizeAmount(String(debitStr));
        type = "debit";
      } else if (creditVal > 0 && debitVal === 0) {
        amount = normalizeAmount(String(creditStr));
        type = "credit";
      } else if (debitVal > 0 && creditVal > 0) {
        // Both present - use larger one as amount, check if we should swap type
        if (debitVal >= creditVal) {
          amount = normalizeAmount(String(debitStr));
          type = "debit";
        } else {
          amount = normalizeAmount(String(creditStr));
          type = "credit";
        }
      } else {
        amount = normalizeAmount(String(amountStr));
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

      const balance = balanceStr ? normalizeAmount(String(balanceStr)) : undefined;

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

  // Post-parse: validate balance consistency to detect swapped debit/credit
  const corrected = validateBalanceConsistency(transactions);
  if (corrected > 0) {
    console.log(`[CSVParser] Auto-corrected ${corrected} transactions (swapped debit/credit based on balance check)`);
  }

  const dates = transactions.map(t => new Date(t.date).getTime()).sort((a, b) => a - b);

  // Extract bank name, account number, account name from metadata rows above header
  const metadataRows = rawRows.slice(0, headerIdx).map(r => r.join(" ")).join("\n");
  const fullText = rawRows.map(r => r.join(" ")).join("\n");
  const bankDisplayName = detectBankNameFromFormat(bankFormat) || extractAccountNumber(fullText) ? detectBankNameFromFormat(bankFormat) : undefined;
  const detectedAccountNumber = extractAccountNumber(metadataRows || fullText);
  const detectedAccountName = extractAccountName(metadataRows || fullText);

  return {
    transactions,
    errors,
    metadata: {
      fileName,
      fileType: "csv",
      totalRows: dataRows.length,
      parsedRows: transactions.length,
      dateRange: dates.length > 0
        ? { start: new Date(dates[0]).toISOString(), end: new Date(dates[dates.length - 1]).toISOString() }
        : undefined,
      detectedBank: bankDisplayName || undefined,
      detectedAccountNumber: detectedAccountNumber || undefined,
      detectedAccountName: detectedAccountName || undefined,
    },
  };
}

// Extended header candidate lists for reuse across parsers
export const HEADER_DATE = ["date", "transaction date", "posting date", "value date", "trans date", "trans. date", "time"];
export const HEADER_DESC = ["description", "narration", "details", "transaction description", "trans. description", "particulars", "remarks", "memo", "to / from", "to/from", "beneficiary", "sender", "from"];
export const HEADER_AMOUNT = ["amount", "transaction amount", "trans amount", "sum"];
export const HEADER_DEBIT = ["debit", "withdrawal", "withdrawals", "dr", "outflow", "money out", "paid out", "debit amount"];
export const HEADER_CREDIT = ["credit", "deposit", "deposits", "cr", "inflow", "money in", "paid in", "credit amount"];
export const HEADER_BALANCE = ["balance", "running balance", "closing balance", "available balance", "book balance", "bal"];
export const HEADER_REF = ["reference", "ref", "transaction id", "trans id", "txn id", "reference id", "ref no"];

// Check if swapping debit/credit for a transaction gives better balance continuity
function validateBalanceConsistency(transactions: ParsedTransaction[]): number {
  if (transactions.length < 3) return 0;

  let corrections = 0;
  for (let i = 1; i < transactions.length; i++) {
    const prev = transactions[i - 1];
    const curr = transactions[i];

    if (prev.balance === undefined || curr.balance === undefined) continue;

    // Expected balance: prev.balance + credit - debit
    const expected = prev.balance + (curr.type === "credit" ? curr.amount : -curr.amount);

    // If swapping type gives a closer balance, swap it
    const swappedExpected = prev.balance + (curr.type === "debit" ? curr.amount : -curr.amount);

    const currentDiff = Math.abs(curr.balance - expected);
    const swappedDiff = Math.abs(curr.balance - swappedExpected);

    if (swappedDiff < currentDiff && swappedDiff < 1) {
      // Swap is better and within rounding error
      curr.type = curr.type === "debit" ? "credit" : "debit";
      corrections++;
    }
  }

  return corrections;
}
