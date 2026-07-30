import * as XLSX from "xlsx";
import { ParsedTransaction, ParseResult } from "./types";
import { extractBankNameFromText, extractAccountNumber, extractAccountName } from "./bank-detection";

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
  const HEADER_TRIGGERS = [
    "trans.*date", "transaction date", "posting date",
    "description", "narration", "details", "particulars", "remarks",
    "debit", "credit", "money in", "money out",
    "inflow", "outflow", "paid in", "paid out",
    "date", "balance", "reference",
    "to / from", "to/from", "beneficiary",
  ];

  for (let i = 0; i < Math.min(rows.length, 25); i++) {
    const row = rows[i];
    if (!row) continue;
    const joined = row.map((c) => String(c || "").toLowerCase().trim()).join("|");

    let matches = 0;
    for (const trigger of HEADER_TRIGGERS) {
      if (joined.includes(trigger)) matches++;
      if (matches >= 2) return i;
    }
  }
  return -1;
}

function mapColumns(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  headers.forEach((h, i) => {
    const lower = h.toLowerCase().trim();

    // Date
    if (lower.includes("trans") && lower.includes("date")) map.date = i;
    else if ((lower === "date" || lower.includes("value date") || lower.includes("transaction date") || lower.includes("posting date") || lower.includes("time")) && map.date === undefined) map.date = i;

    // Description
    if (lower.includes("description") || lower.includes("narration") || lower.includes("details") || lower.includes("particulars") || lower.includes("remarks") || lower.includes("memo") || lower.includes("to / from") || lower.includes("to/from") || lower.includes("beneficiary") || lower.includes("sender")) {
      if (map.description === undefined) map.description = i;
    }

    // Debit
    if (lower.includes("debit") || lower.includes("money out") || lower.includes("outflow") || lower.includes("paid out") || lower.includes("withdrawal") || lower.includes("dr")) {
      if (map.debit === undefined) map.debit = i;
    }

    // Credit
    if (lower.includes("credit") || lower.includes("money in") || lower.includes("inflow") || lower.includes("paid in") || lower.includes("deposit") || lower.includes("cr")) {
      if (map.credit === undefined) map.credit = i;
    }

    // Amount (fallback if no debit/credit found)
    if ((lower.includes("amount") || lower.includes("sum")) && map.debit === undefined && map.credit === undefined) {
      if (map.amount === undefined) map.amount = i;
    }

    // Balance
    if (lower.includes("balance") || lower.includes("running balance") || lower.includes("closing balance") || lower.includes("book balance") || lower.includes("bal")) {
      if (map.balance === undefined) map.balance = i;
    }

    // Reference
    if (lower.includes("reference") || lower.includes("ref") || lower.includes("transaction id") || lower.includes("trans id") || lower.includes("txn id")) {
      if (map.reference === undefined) map.reference = i;
    }

    if (lower.includes("channel") || lower.includes("type")) map.type = i;
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
    // Detect bank/account info from all rows
    const fullText = allRows.map(r => r.map(c => String(c || "")).join(" ")).join("\n");
    const detectedBank = extractBankNameFromText(fullText) || (extractAccountNumber(fullText) ? "Unknown" : undefined);
    const detectedAccountNumber = extractAccountNumber(fullText) || undefined;
    const detectedAccountName = extractAccountName(fullText) || undefined;

    function withBankMeta(result: ParseResult): ParseResult {
      result.metadata.detectedBank = result.metadata.detectedBank || detectedBank;
      result.metadata.detectedAccountNumber = result.metadata.detectedAccountNumber || detectedAccountNumber;
      result.metadata.detectedAccountName = result.metadata.detectedAccountName || detectedAccountName;
      return result;
    }

    const headerIdx = findHeaderRow(allRows);
    console.log(`[ExcelParser] Header row index: ${headerIdx}`);

    if (headerIdx === -1) {
      // Detect OPay format: date in col 0, description in col 2, debit/credit in cols 3/4
      const sample = allRows[0];
      if (sample && sample.length >= 6 && sample[0] && sample[2]) {
        const testDate = parseDate(sample[0]);
        if (!isNaN(testDate.getTime())) {
          console.log("[ExcelParser] Detected OPay headerless format, using hardcoded columns");
          const transactions: ParsedTransaction[] = [];
          const errors: string[] = [];

          for (let i = 0; i < allRows.length; i++) {
            try {
              const row = allRows[i];
              if (!row || row.length < 5) continue;

              const dateVal = row[0];
              const desc = String(row[2] || "").trim();
              const debitRaw = row[3];
              const creditRaw = row[4];
              const balanceVal = row[5];
              const refVal = row[7] ? String(row[7]).trim() : undefined;

              if (!dateVal || !desc) continue;

              const date = parseDate(dateVal);
              if (isNaN(date.getTime())) continue;

              const debit = normalizeAmount(debitRaw);
              const credit = normalizeAmount(creditRaw);

              let amount = 0;
              let type: "debit" | "credit";

              if (debit > 0 && credit === 0) {
                amount = debit;
                type = "debit";
              } else if (credit > 0 && debit === 0) {
                amount = credit;
                type = "credit";
              } else if (debit > 0 && credit > 0) {
                amount = debit;
                type = "debit";
              } else {
                continue;
              }

              if (amount === 0) continue;

              const balance = balanceVal ? normalizeAmount(balanceVal) : undefined;

              transactions.push({
                date: date.toISOString(),
                description: desc,
                amount,
                type,
                balance,
                reference: refVal || undefined,
                narration: desc,
              });
            } catch (err) {
              errors.push(`Row ${i + 1}: Parse error`);
            }
          }

          validateBalanceConsistency(transactions);

          const dates = transactions.map((t) => new Date(t.date).getTime()).sort((a, b) => a - b);
          console.log(`[ExcelParser] OPay format: ${transactions.length} transactions, ${errors.length} errors`);

          return withBankMeta({
            transactions,
            errors,
            metadata: {
              fileName,
              fileType: "excel",
              totalRows: allRows.length,
              parsedRows: transactions.length,
              dateRange: dates.length > 0
                ? { start: new Date(dates[0]).toISOString(), end: new Date(dates[dates.length - 1]).toISOString() }
                : undefined,
            },
          });
        }
      }

      // Fallback: try CSV conversion
      const csvContent = XLSX.utils.sheet_to_csv(sheet);
      return withBankMeta(parseCSVFromExcel(csvContent, fileName));
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

    // Post-parse: validate balance consistency to detect swapped debit/credit
    const corrected = validateBalanceConsistency(transactions);
    if (corrected > 0) {
      console.log(`[ExcelParser] Auto-corrected ${corrected} transactions (swapped debit/credit based on balance check)`);
    }

    const dates = transactions.map((t) => new Date(t.date).getTime()).sort((a, b) => a - b);

    console.log(`[ExcelParser] Parsed ${transactions.length} transactions, ${errors.length} errors`);

    return withBankMeta({
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
    });
  } catch (error) {
    return {
      transactions: [],
      errors: [`Excel parse error: ${error}`],
      metadata: { fileName, fileType: "excel", totalRows: 0, parsedRows: 0 },
    };
  }
}

function validateBalanceConsistency(transactions: ParsedTransaction[]): number {
  if (transactions.length < 3) return 0;

  let corrections = 0;
  for (let i = 1; i < transactions.length; i++) {
    const prev = transactions[i - 1];
    const curr = transactions[i];

    if (prev.balance === undefined || curr.balance === undefined) continue;

    const expected = prev.balance + (curr.type === "credit" ? curr.amount : -curr.amount);
    const swappedExpected = prev.balance + (curr.type === "debit" ? curr.amount : -curr.amount);

    const currentDiff = Math.abs(curr.balance - expected);
    const swappedDiff = Math.abs(curr.balance - swappedExpected);

    if (swappedDiff < currentDiff && swappedDiff < 1) {
      curr.type = curr.type === "debit" ? "credit" : "debit";
      corrections++;
    }
  }

  return corrections;
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
