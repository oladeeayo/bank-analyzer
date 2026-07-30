// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFParser = require("pdf2json");
import { ParsedTransaction, ParseResult, BankFormat } from "./types";
import { detectBankNameFromFormat, extractAccountNumber, extractAccountName } from "./bank-detection";

function detectBankFormat(text: string): BankFormat {
  const lower = text.toLowerCase();
  if (lower.includes("gtbank") || lower.includes("gtb") || lower.includes("gtco") || lower.includes("guaranty trust")) return "gtbank-pdf";
  if (lower.includes("sterling") || lower.includes("onebank")) return "sterling-pdf";
  if (lower.includes("access bank")) return "access-pdf";
  if (lower.includes("uba") || lower.includes("united bank for africa")) return "uba-pdf";
  if (lower.includes("opay") || lower.includes("owealth") || lower.includes("paycom")) return "opay-pdf";
  if (lower.includes("kuda") || lower.includes("kuda microfinance")) return "kuda-pdf";
  if (lower.includes("moniepoint")) return "moniepoint-pdf";
  if (lower.includes("first bank") || lower.includes("firstbank")) return "firstbank-pdf";
  if (lower.includes("zenith") || lower.includes("zenithbank")) return "zenith-pdf";
  if (lower.includes("palmpay") || lower.includes("palm pay")) return "palmpay-pdf";
  if (lower.includes("wema") || lower.includes("alat")) return "generic-pdf";
  if (lower.includes("fidelity")) return "generic-pdf";
  if (lower.includes("fcmb")) return "generic-pdf";
  return "generic-pdf";
}

const BRANCH_BLACKLIST = ['ILESA', 'E-CHANNELS', 'HEAD OFFICE', 'MAIN BRANCH', 'LAGOS', 'ABUJA', 'PORT HARCOURT', 'ORE', 'IBADAN'];

function cleanNarration(text: string): string {
  let cleaned = text.replace(/\n/g, ' ').replace(/\r/g, '');
  cleaned = cleaned.replace(/\d{15,}/g, '');
  cleaned = cleaned.replace(/REF:\s*\d+/gi, '').replace(/REF\s*\d+/gi, '');
  cleaned = cleaned.replace(/\|+/g, ' ').replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/^[\s|:\-\']+/g, '').trim();

  // Sterling: "OneBank Transfer from X to Y" (may have line breaks/spaces)
  const oneBankMatch = cleaned.match(/OneBank\s+Transfer\s+from\s+(.+?)\s+to\s+(.+)/i);
  if (oneBankMatch) {
    const recipient = oneBankMatch[2].trim();
    if (recipient.length > 3 && recipient.length < 80) return recipient;
  }

  // Fallback: if text contains "OneBank Transfer" but pattern didn't match,
  // try to extract any name-like text after "to"
  if (/OneBank\s+Transfer/i.test(cleaned)) {
    const toMatch = cleaned.match(/\bto\s+([A-Z][A-Z\s,\.]+?)(?:\s+Ref|\s+00000|\s*$)/i);
    if (toMatch && toMatch[1].trim().length > 3) {
      return toMatch[1].trim();
    }
  }

  const gt737Match = cleaned.match(/737\s+MERCHANT PAYMENTS\s+.+?from\s+(.+?)\s+to\s+(.+)/i);
  if (gt737Match) {
    const merchant = gt737Match[2].trim();
    if (merchant.length > 3 && merchant.length < 80) return merchant;
  }

  const gtMobMatch = cleaned.match(/TRANSFER BETWEEN CUSTOMERS\s+.+?\|?MOB\/(.+?)\//i);
  if (gtMobMatch) {
    const name = gtMobMatch[1].trim();
    if (name.length > 3 && name.length < 80) return name;
  }

  const gtUssdMatch = cleaned.match(/TRANSFER BETWEEN CUSTOMERS\s+.+?\|?USSD-NIP\/(?:To|FROM)\s+(.+)/i);
  if (gtUssdMatch) {
    const name = gtUssdMatch[1].trim();
    if (name.length > 3 && name.length < 80) return name;
  }

  const gtPipeTransfer = cleaned.match(/TRANSFER BETWEEN CUSTOMERS\s+.+?\|\s*(.+?)(?:\s+REF|\s*$)/i);
  if (gtPipeTransfer) {
    const name = gtPipeTransfer[1].trim();
    if (name.length > 3 && name.length < 80 && !/^\d+$/.test(name)) return name;
  }

  const atmMatch = cleaned.match(/CASH WITHDRAWAL FROM OTHER ATM\s+.+?-(.+?)(?:\s+TD|\s+NG|\s*$)/i);
  if (atmMatch) {
    const location = atmMatch[1].trim();
    if (location.length > 3 && location.length < 80) return location;
  }

  const posMatch = cleaned.match(/POS\/WEB PURCHASE TRANSACTION\s+.+?-(.+?)(?:\s+LANG|\s+NG|\s+LA|\s*$)/i);
  if (posMatch) {
    const merchant = posMatch[1].trim();
    if (merchant.length > 3 && merchant.length < 80) return merchant;
  }

  const airtimeMatch = cleaned.match(/AIRTIME PURCHASE\s+(.+?)(?:\s*$)/i);
  if (airtimeMatch) {
    const merchant = airtimeMatch[1].trim();
    if (merchant.length > 3 && merchant.length < 80) return merchant;
  }

  const billMatch = cleaned.match(/(?:BILL|UTILITY) PAYMENT\s+(.+?)(?:\s*$)/i);
  if (billMatch) {
    const merchant = billMatch[1].trim();
    if (merchant.length > 3 && merchant.length < 80) return merchant;
  }

  // UBA: "TNF-MIRACLE/Paid with Paga www.mypaga.com..."
  const tnfMatch = cleaned.match(/TNF-(.+?)\/Paid with\s+(.+?)(?:\s+www\.|\s*$)/i);
  if (tnfMatch) {
    const merchant = tnfMatch[2].trim();
    if (merchant.length > 3 && merchant.length < 80) return merchant;
  }

  // UBA: "MOB/UTU/OLADIPOPO OLA/3508457..." - extract name after MOB/UTU/
  const ubaMobMatch = cleaned.match(/MOB\/UTU\/(.+?)(?:\s+OLA\/|\s*$)/i);
  if (ubaMobMatch) {
    const name = ubaMobMatch[1].trim();
    if (name.length > 3 && name.length < 80) return name;
  }

  // UBA: "FGN STAMP DUTY..." - return as bank charge
  const fgnMatch = cleaned.match(/FGN STAMP DUTY/i);
  if (fgnMatch) {
    return 'CBN Stamp Duty';
  }

  // UBA: "WHT ON Interest..." or "Interest Paid..."
  const interestMatch = cleaned.match(/(?:WHT ON Interest|Interest Paid)\s+(.+?)(?:\s*$)/i);
  if (interestMatch) {
    return 'Interest Payment';
  }

  cleaned = cleaned.replace(/^(TRANSFER BETWEEN CUSTOMERS|CASH WITHDRAWAL|POS\/WEB PURCHASE TRANSACTION|AIRTIME PURCHASE|BILL PAYMENT|SALARY PAYMENT|INFLOWS|OUTFLOWS|737 MERCHANT PAYMENTS)\s*/i, "");
  cleaned = cleaned.replace(/^(OneBank Transfer|Transfer|TRF)\s+(from|FROM)\s+.+?\s+(to|TO)\s+/i, "");
  cleaned = cleaned.replace(/^[\s\-]+|[\s\-]+$/g, "");

  for (const branch of BRANCH_BLACKLIST) {
    const regex = new RegExp(`\\b${branch}\\b`, 'gi');
    cleaned = cleaned.replace(regex, '');
  }
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  if (cleaned.length > 60) cleaned = cleaned.substring(0, 60).trim();
  return cleaned || text.substring(0, 60).trim();
}

const UBA_BLACKLIST = ['OPENING BALANCE', 'CLOSING BALANCE', 'Africa\'s global bank', 'United Bank for Africa', 'OLADIPUPO', 'OLADAYO', 'ACCOUNT STATEMENT'];

function parseUBARows(rows: string[][]): ParseResult {
  const transactions: ParsedTransaction[] = [];
  const errors: string[] = [];
  const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}[\/\-]\w{3,9}[\/\-]\d{2,4})/;

  let headerIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    const combined = rows[i].join(" ").toLowerCase();
    if (combined.includes("trans date") || combined.includes("narration")) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) headerIdx = 0;
  const headerRow = rows[headerIdx];
  console.log(`[UBA] Header row ${headerIdx}: ${headerRow.join(" | ")}`);

  for (let i = headerIdx + 1; i < rows.length; i++) {
    try {
      const row = rows[i];
      if (row.length < 5) continue;

      let dateStr = "";
      for (const cell of row) {
        if (datePattern.test(cell)) { const m = cell.match(datePattern); if (m) { dateStr = m[1]; break; } }
      }
      if (!dateStr) continue;

      const combinedRow = row.join(" ").toUpperCase();
      const isBlacklisted = UBA_BLACKLIST.some(term => combinedRow.includes(term.toUpperCase()));
      if (isBlacklisted) continue;

      // UBA: TRANS DATE | VALUE DATE | NARRATION | CHQ. NO | DEBIT | CREDIT | BALANCE
      // Narration spans multiple cells, find it between dates and numeric columns
      let narrationRaw = "";
      let dateCount = 0;
      let narrationStart = -1;
      let narrationEnd = -1;
      for (let j = 0; j < row.length; j++) {
        if (datePattern.test(row[j])) {
          dateCount++;
          if (dateCount === 1) narrationStart = j + 1;
          if (dateCount === 2) { narrationEnd = j; break; }
        }
      }
      if (narrationStart >= 0 && narrationEnd > narrationStart) {
        narrationRaw = row.slice(narrationStart, narrationEnd).join(" ");
      } else if (row.length > 2) {
        narrationRaw = row[2] || row[1] || "";
      }

      let description = cleanNarration(narrationRaw);
      if (!description) continue;

      // Skip if description is just a number or too short
      if (description.length < 3 || /^\d+[\.,]?\d*$/.test(description)) continue;

      let debit = 0, credit = 0;
      for (let j = 0; j < row.length; j++) {
        const cell = row[j].trim();
        const header = (headerRow[j] || "").toLowerCase();
        const cleaned = cell.replace(/[^0-9.]/g, "");
        const val = parseFloat(cleaned);
        if (isNaN(val) || val === 0) continue;
        if (header.includes("debit")) debit = val;
        else if (header.includes("credit")) credit = val;
      }

      const amount = debit > 0 ? debit : credit;
      const type: "debit" | "credit" = debit > 0 ? "debit" : "credit";
      if (amount === 0) continue;

      const date = parseDate(dateStr);
      if (isNaN(date.getTime())) continue;

      if (i - headerIdx <= 5) {
        console.log(`[UBA] Raw narration: ${narrationRaw.substring(0, 100)}`);
        console.log(`[UBA] Cleaned: ${description}`);
      }

      transactions.push({ date: date.toISOString(), description, amount, type, narration: description });
    } catch (err) { errors.push(`Row ${i + 1}: ${err}`); }
  }

  const dates = transactions.map(t => new Date(t.date).getTime()).sort((a, b) => a - b);
  return {
    transactions, errors,
    metadata: { fileName: "", fileType: "pdf", totalRows: rows.length, parsedRows: transactions.length,
      dateRange: dates.length > 0 ? { start: new Date(dates[0]).toISOString(), end: new Date(dates[dates.length - 1]).toISOString() } : undefined },
  };
}

function parseGTBankRows(rows: string[][]): ParseResult {
  const transactions: ParsedTransaction[] = [];
  const errors: string[] = [];
  const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}[\/\-]\w{3,9}[\/\-]\d{2,4})/;

  let headerIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    const combined = rows[i].join(" ").toLowerCase();
    if (combined.includes("trans. date") || combined.includes("debits") || combined.includes("remarks")) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) headerIdx = 0;
  const headerRow = rows[headerIdx];

  // Map column indices by header names
  const colMap: Record<string, number> = {};
  for (let j = 0; j < headerRow.length; j++) {
    const h = headerRow[j].toLowerCase().trim();
    if (h.includes("trans") || h.includes("date")) colMap.date = colMap.date ?? j;
    if (h.includes("debit")) colMap.debit = j;
    if (h.includes("credit")) colMap.credit = j;
    if (h.includes("remark") || h.includes("narration")) colMap.remarks = j;
    if (h.includes("balance")) colMap.balance = j;
  }
  console.log(`[GTBank] Column map:`, colMap);

  for (let i = headerIdx + 1; i < rows.length; i++) {
    try {
      const row = rows[i];
      if (row.length < 4) continue;

      let dateStr = "";
      if (colMap.date !== undefined && datePattern.test(row[colMap.date])) {
        const m = row[colMap.date].match(datePattern);
        if (m) dateStr = m[1];
      } else {
        for (const cell of row) {
          if (datePattern.test(cell)) { const m = cell.match(datePattern); if (m) { dateStr = m[1]; break; } }
        }
      }
      if (!dateStr) continue;

      const remarks = colMap.remarks !== undefined ? (row[colMap.remarks] || "") : (row[row.length - 1] || "");
      const description = cleanNarration(remarks);
      if (!description) continue;

      let debit = 0, credit = 0;
      if (colMap.debit !== undefined) {
        const val = parseFloat(row[colMap.debit]?.replace(/[^0-9.]/g, "") || "0");
        if (!isNaN(val) && val > 0) debit = val;
      }
      if (colMap.credit !== undefined) {
        const val = parseFloat(row[colMap.credit]?.replace(/[^0-9.]/g, "") || "0");
        if (!isNaN(val) && val > 0) credit = val;
      }

      const amount = debit > 0 ? debit : credit;
      const type: "debit" | "credit" = debit > 0 ? "debit" : "credit";
      if (amount === 0) continue;

      const date = parseDate(dateStr);
      if (isNaN(date.getTime())) continue;

      transactions.push({ date: date.toISOString(), description, amount, type, narration: description });
    } catch (err) { errors.push(`Row ${i + 1}: ${err}`); }
  }

  const dates = transactions.map(t => new Date(t.date).getTime()).sort((a, b) => a - b);
  return {
    transactions, errors,
    metadata: { fileName: "", fileType: "pdf", totalRows: rows.length, parsedRows: transactions.length,
      dateRange: dates.length > 0 ? { start: new Date(dates[0]).toISOString(), end: new Date(dates[dates.length - 1]).toISOString() } : undefined },
  };
}

function parseSterlingRows(rows: string[][]): ParseResult {
  const transactions: ParsedTransaction[] = [];
  const errors: string[] = [];
  const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}[\/\-]\w{3,9}[\/\-]\d{2,4})/;

  // Find the header row (contains "Trans Date" or "Narration")
  let headerIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    const combined = rows[i].join(" ").toLowerCase();
    if (combined.includes("trans date") || combined.includes("narration")) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) {
    console.log("[Sterling] No header row found, using row 0 as header");
    headerIdx = 0;
  }
  const headerRow = rows[headerIdx];
  console.log(`[Sterling] Header row ${headerIdx}: ${headerRow.join(" | ")}`);

  for (let i = headerIdx + 1; i < rows.length; i++) {
    try {
      const row = rows[i];
      if (row.length < 5) continue;

      // Debug: log first 5 transaction rows
      if (i - headerIdx <= 5) {
        console.log(`[Sterling] Row ${i}: ${row.join(" | ")}`);
      }

      let dateStr = "";
      for (const cell of row) {
        if (datePattern.test(cell)) { const m = cell.match(datePattern); if (m) { dateStr = m[1]; break; } }
      }
      if (!dateStr) continue;

      // Sterling: Trans Date | Narration | Value Date | Debit | Credit | Balance
      // Narration may span multiple cells due to PDF extraction splitting on pipes
      // Find the date cell index and value date cell index, join everything between as narration
      let dateCellIdx = -1;
      let valueDateIdx = -1;
      for (let j = 0; j < row.length; j++) {
        if (datePattern.test(row[j])) {
          if (dateCellIdx === -1) dateCellIdx = j;
          else if (valueDateIdx === -1) { valueDateIdx = j; break; }
        }
      }

      let narrationRaw = "";
      if (dateCellIdx >= 0 && valueDateIdx > dateCellIdx) {
        // Join all cells between first date and second date as narration
        narrationRaw = row.slice(dateCellIdx + 1, valueDateIdx).join(" | ");
      } else if (row.length > 1) {
        narrationRaw = row.slice(1).join(" | ");
      }

      let description = "";
      if (narrationRaw.includes("|")) {
        const parts = narrationRaw.split("|");
        description = parts.join(" ").trim();
      } else {
        description = narrationRaw;
      }
      description = cleanNarration(description);
      if (!description) continue;

      // Debug: log narration extraction for first 5 rows
      if (i - headerIdx <= 5) {
        console.log(`[Sterling] Raw narration: ${narrationRaw.substring(0, 100)}`);
        console.log(`[Sterling] Cleaned: ${description}`);
      }

      let debit = 0, credit = 0;
      for (let j = 0; j < row.length; j++) {
        const cell = row[j].trim();
        const header = (headerRow[j] || "").toLowerCase();
        const cleaned = cell.replace(/[^0-9.]/g, "");
        const val = parseFloat(cleaned);
        if (isNaN(val) || val === 0) continue;
        if (header.includes("debit")) debit = val;
        else if (header.includes("credit")) credit = val;
      }

      const amount = debit > 0 ? debit : credit;
      const type: "debit" | "credit" = debit > 0 ? "debit" : "credit";
      if (amount === 0) continue;

      const date = parseDate(dateStr);
      if (isNaN(date.getTime())) continue;

      transactions.push({ date: date.toISOString(), description, amount, type, narration: description });
    } catch (err) { errors.push(`Row ${i + 1}: ${err}`); }
  }

  const dates = transactions.map(t => new Date(t.date).getTime()).sort((a, b) => a - b);
  return {
    transactions, errors,
    metadata: { fileName: "", fileType: "pdf", totalRows: rows.length, parsedRows: transactions.length,
      dateRange: dates.length > 0 ? { start: new Date(dates[0]).toISOString(), end: new Date(dates[dates.length - 1]).toISOString() } : undefined },
  };
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

  // DD-Mon-YYYY (e.g., 01-Jan-2026)
  match = clean.match(/(\d{1,2})[\/\-](\w{3})[\/\-](\d{4})/);
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

function isDateOnly(cell: string): boolean {
  const d = cell.trim();
  return /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(d)
    || /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(d)
    || /^\d{1,2}[\/\-]\w{3,9}[\/\-]\d{2,4}$/.test(d)
    || /^\d{1,2}\s+\w{3}\s+\d{4}$/.test(d)
    || /^\d{1,2}\s+\w{3}\s+\d{2}$/.test(d);
}

function isReferenceCode(s: string): boolean {
  const digitsOnly = s.replace(/[^0-9]/g, "");
  if (digitsOnly.length >= 10 && !s.includes(".")) return true;
  if (/^0{5,}/.test(s.replace(/[^0-9]/g, ""))) return true;
  return false;
}

function isValidAmount(s: string): number | null {
  const cleaned = s.replace(/[^0-9.\-]/g, "").replace(/,/g, "");
  if (!cleaned || cleaned === ".") return null;
  if (isReferenceCode(s)) return null;
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  if (Math.abs(num) > 50_000_000) return null;
  return num;
}

function aggregateLinesToBlocks(rows: string[][]): string[][] {
  const datePattern = /^\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}|\d{1,2}[\/\-]\w{3,9}[\/\-]\d{2,4}|\d{1,2}\s+\w{3}\s+\d{4}|\d{1,2}\s+\w{3}\s+\d{2})/;
  const blocks: string[][] = [];
  let current: string[] = [];

  for (const row of rows) {
    const combined = row.join(" ").trim();
    if (!combined) continue;
    const firstCell = (row[0] || "").trim();
    if (datePattern.test(firstCell) || datePattern.test(combined)) {
      if (current.length > 0) blocks.push(current);
      current = [...row];
    } else {
      current.push(...row);
    }
  }
  if (current.length > 0) blocks.push(current);
  return blocks;
}

function parseGenericRows(rows: string[][]): ParseResult {
  const transactions: ParsedTransaction[] = [];
  const errors: string[] = [];

  const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}|\d{1,2}[\/\-]\w{3}[\/\-]\d{2,4}|\d{1,2}[\/\-]\w{3,9}[\/\-]\d{2,4}|\d{1,2}\s+\w{3}\s+\d{4}|\d{1,2}\s+\w{3}\s+\d{2})/;

  const blocks = aggregateLinesToBlocks(rows);
  console.log(`[GenericParser] Aggregated ${rows.length} rows into ${blocks.length} blocks`);

  for (let i = 0; i < blocks.length; i++) {
    try {
      const block = blocks[i];
      const combined = block.join(" ");
      if (combined.trim().length < 3) continue;

      let dateStr = "";
      let description = "";
      let amount = 0;
      let type: "debit" | "credit" = "debit";

      const dm = combined.match(datePattern);
      if (dm) dateStr = dm[1];

      const amounts: { val: number; raw: string; col: number }[] = [];
      for (let j = 0; j < block.length; j++) {
        const cell = block[j].trim();
        if (!cell || isReferenceCode(cell)) continue;
        if (isDateOnly(cell)) continue;
        const val = isValidAmount(cell);
        if (val !== null && val !== 0) {
          amounts.push({ val: Math.abs(val), raw: cell, col: j });
        }
      }

      const textParts: string[] = [];
      for (const cell of block) {
        const trimmed = cell.trim();
        if (!trimmed) continue;
        if (isDateOnly(trimmed)) continue;
        if (isReferenceCode(trimmed)) continue;
        if (isValidAmount(trimmed) !== null) continue;
        if (datePattern.test(trimmed)) continue;
        if (trimmed.length > 2 && !/^\d+$/.test(trimmed)) {
          textParts.push(trimmed);
        }
      }
      description = textParts.join(" ").replace(/\s+/g, " ").trim();

      if (amounts.length === 0) {
        for (const cell of block) {
          const val = isValidAmount(cell);
          if (val !== null && val !== 0) {
            amounts.push({ val: Math.abs(val), raw: cell, col: block.indexOf(cell) });
          }
        }
      }

      if (amounts.length >= 2) {
        const debitIdx = amounts.findIndex(a => {
          const hasMinus = a.raw.trim().startsWith("-");
          const colHeader = block[a.col - 1]?.toLowerCase() || "";
          return hasMinus || colHeader.includes("debit") || colHeader.includes("out");
        });
        const creditIdx = amounts.findIndex(a => {
          const colHeader = block[a.col - 1]?.toLowerCase() || "";
          return colHeader.includes("credit") || colHeader.includes("in");
        });

        if (debitIdx >= 0 && amounts[debitIdx].val > 0) {
          amount = amounts[debitIdx].val;
          type = "debit";
        } else if (creditIdx >= 0 && amounts[creditIdx].val > 0) {
          amount = amounts[creditIdx].val;
          type = "credit";
        } else {
          const nonZero = amounts.filter(a => a.val > 0);
          if (nonZero.length === 1) {
            amount = nonZero[0].val;
            type = nonZero[0].raw.trim().startsWith("-") ? "debit" : "credit";
          } else if (nonZero.length >= 2) {
            if (nonZero[0].val > 0 && nonZero[1].val === 0) {
              amount = nonZero[0].val;
              type = "debit";
            } else if (nonZero[0].val === 0 && nonZero[1].val > 0) {
              amount = nonZero[1].val;
              type = "credit";
            } else {
              amount = nonZero[0].val;
              type = "debit";
            }
          }
        }
      } else if (amounts.length === 1) {
        amount = amounts[0].val;
        type = amounts[0].raw.trim().startsWith("-") ? "debit" : "credit";
      }

      if (!dateStr || !description || amount === 0) continue;

      const date = parseDate(dateStr);
      if (isNaN(date.getTime())) continue;

      transactions.push({
        date: date.toISOString(),
        description: description.trim(),
        amount,
        type,
        narration: description.trim(),
      });
    } catch (err) {
      errors.push(`Block ${i + 1}: Parse error - ${err}`);
    }
  }

  const dates = transactions.map(t => new Date(t.date).getTime()).sort((a, b) => a - b);

  return {
    transactions,
    errors,
    metadata: {
      fileName: "",
      fileType: "pdf",
      totalRows: blocks.length,
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
            } else if (bankFormat === "uba-pdf") {
              console.log(`[PDFParser] Using UBA parser`);
              result = parseUBARows(rows);
            } else if (bankFormat === "gtbank-pdf") {
              console.log(`[PDFParser] Using GTBank parser`);
              result = parseGTBankRows(rows);
            } else if (bankFormat === "sterling-pdf") {
              console.log(`[PDFParser] Using Sterling parser`);
              result = parseSterlingRows(rows);
            } else {
              console.log(`[PDFParser] Using generic parser`);
              result = parseGenericRows(rows);
            }
          }

          result.metadata.fileName = fileName;

          const bankDisplayName = detectBankNameFromFormat(bankFormat) || undefined;
          result.metadata.detectedBank = bankDisplayName;
          result.metadata.detectedAccountNumber = extractAccountNumber(text) || undefined;
          result.metadata.detectedAccountName = extractAccountName(text) || undefined;

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
