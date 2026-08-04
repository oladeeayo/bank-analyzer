import { ParsedTransaction, ParseResult } from "./types";

interface TextItem {
  x: number;
  y: number;
  w: number;
  text: string;
}

interface TextLine {
  y: number;
  items: TextItem[];
}

function decodeText(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

function mergeCloseTexts(items: { x: number; text: string }[]): { x: number; text: string }[] {
  if (items.length === 0) return [];
  const sorted = [...items].sort((a, b) => a.x - b.x);
  const merged: { x: number; text: string }[] = [{ x: sorted[0].x, text: sorted[0].text }];

  for (let i = 1; i < sorted.length; i++) {
    const prev = merged[merged.length - 1];
    // In pdf2json, 1 character width is roughly 0.45 to 0.6 grid units
    const prevEnd = prev.x + (prev.text.length * 0.5);
    const gap = sorted[i].x - prevEnd;

    // Only merge if gap between text fragments is very small (< 1.5 grid units)
    if (gap < 1.5) {
      prev.text += (gap > 0.4 ? " " : "") + sorted[i].text;
    } else {
      merged.push({ x: sorted[i].x, text: sorted[i].text });
    }
  }
  return merged;
}

function extractTextLines(pdfData: any): TextLine[] {
  const allLines: TextLine[] = [];

  for (const page of pdfData.Pages || []) {
    const yMap: Record<number, { x: number; text: string }[]> = {};

    for (const textObj of page.Texts || []) {
      if (!textObj.R || textObj.R.length === 0) continue;
      const decoded = decodeText(textObj.R[0].T || "").trim();
      if (!decoded) continue;

      const y = Math.round(textObj.y * 10) / 10;
      const x = Math.round(textObj.x * 10) / 10;

      if (!yMap[y]) yMap[y] = [];
      yMap[y].push({ x, text: decoded });
    }

    const sortedYs = Object.keys(yMap).map(Number).sort((a, b) => a - b);

    for (const y of sortedYs) {
      const merged = mergeCloseTexts(yMap[y]);
      allLines.push({ y, items: merged.map(m => ({ x: m.x, y, w: 0, text: m.text })) });
    }
  }

  return allLines;
}

function mergeMultilineTransactions(lines: TextLine[]): string[][] {
  const datePattern = /(\d{2}\/\d{2}\/\d{2})/;
  const result: string[][] = [];
  let currentCells: string[] = [];
  let currentY = 0;

  for (const line of lines) {
    const cells = line.items.map((i) => i.text);
    const combined = cells.join(" ");

    const hasDate = cells.some((c) => datePattern.test(c));
    const hasAmount = /[₦#][\d,]+/.test(combined) || /[\d,]+\.\d{2}/.test(combined);

    if (hasDate) {
      if (currentCells.length > 0) {
        result.push(currentCells);
      }
      currentCells = [...cells];
      currentY = line.y;
    } else if (hasAmount && currentCells.length === 0) {
      currentCells = [...cells];
      currentY = line.y;
    } else if (currentCells.length > 0 && Math.abs(line.y - currentY) < 12) {
      currentCells.push(...cells);
    } else if (currentCells.length > 0) {
      result.push(currentCells);
      currentCells = [...cells];
      currentY = line.y;
    }
  }

  if (currentCells.length > 0) {
    result.push(currentCells);
  }

  return result;
}

function findColumnIndices(headerCells: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (let i = 0; i < headerCells.length; i++) {
    const h = headerCells[i].toLowerCase().trim();
    if (h.includes("date") || h.includes("time")) map.date = i;
    if (h.includes("money in") || h === "in") map.moneyIn = i;
    if (h.includes("money out") || h === "out") {
      if (map.moneyOut === undefined) map.moneyOut = i;
      else map.type = i;
    }
    if (h.includes("to") && h.includes("from")) map.toFrom = i;
    if (h.includes("description") || h.includes("desc")) map.description = i;
    if (h.includes("balance") || h.includes("bal")) map.balance = i;
    if (h === "type") map.type = i;
  }
  return map;
}

function parseAmount(text: string): number {
  const cleaned = text.replace(/[^0-9.\-]/g, "");
  if (!cleaned || cleaned === "." || cleaned === "-" || cleaned === "--") return 0;
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.abs(num);
}

function formatName(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

function parseKudaRows(rows: string[][]): ParseResult {
  const transactions: ParsedTransaction[] = [];
  const errors: string[] = [];
  const datePattern = /(\d{2}\/\d{2}\/\d{2})/;

  let headerIdx = -1;
  let colMap: Record<string, number> = {};

  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const combined = rows[i].join(" ").toLowerCase();
    if (combined.includes("date") && (combined.includes("money") || combined.includes("balance"))) {
      headerIdx = i;
      colMap = findColumnIndices(rows[i]);
      break;
    }
  }

  if (headerIdx === -1) {
    headerIdx = 0;
    colMap = { date: 0, moneyIn: 1, moneyOut: 2, type: 3, toFrom: 4, description: 5, balance: 6 };
  }

  console.log(`[Kuda] Header row ${headerIdx}: ${rows[headerIdx].join(" | ")}`);
  console.log(`[Kuda] Column map:`, colMap);

  const skipPatterns = [
    /^summary$/i, /^spend account$/i, /^type$/i,
    /^opening balance$/i, /^closing balance$/i, /^all statements$/i,
    /^account number/i, /^account date$/i, /^account\b.*\bdate\b/i,
    /^date\/time$/i, /^money in$/i, /^money out$/i,
    /^to \/ from$/i, /^description$/i, /^balance$/i,
    /^page \d/i, /Kuda MF Bank.*NDIC/i, /licensed by the Central Bank/i,
    /RC796975/i, /Finsbury Pavement/i, /Kuda.*Technologies.*LTD/i,
  ];

  for (let i = headerIdx + 1; i < rows.length; i++) {
    try {
      const row = rows[i];
      const combined = row.join(" ");

      if (row.length < 3) continue;
      if (skipPatterns.some((p) => p.test(combined))) continue;

      let dateStr = "";
      for (const cell of row) {
        const m = cell.match(datePattern);
        if (m) { dateStr = m[1]; break; }
      }
      if (!dateStr) continue;

      const moneyIn = colMap.moneyIn !== undefined ? parseAmount(row[colMap.moneyIn] || "") : 0;
      const moneyOut = colMap.moneyOut !== undefined ? parseAmount(row[colMap.moneyOut] || "") : 0;
      const balanceRaw = colMap.balance !== undefined ? row[colMap.balance] || "" : "";
      const balance = parseAmount(balanceRaw);

      let amount = 0;
      let type: "debit" | "credit" = "debit";

      if (moneyIn > 0) {
        amount = moneyIn;
        type = "credit";
      } else if (moneyOut > 0) {
        amount = moneyOut;
        type = "debit";
      } else {
        // Fallback: search row for any amount cell (excluding date & balance)
        for (let j = 0; j < row.length; j++) {
          if (j === colMap.date || j === colMap.balance) continue;
          const cell = row[j].trim();
          const val = parseAmount(cell);
          if (val > 0 && /[₦#\d]/.test(cell)) {
            amount = val;
            type = cell.includes("+") || combined.toLowerCase().includes("inward") ? "credit" : "debit";
            break;
          }
        }
      }

      if (amount === 0) continue;

      let description = "";
      if (colMap.description !== undefined && row[colMap.description]) {
        description = row[colMap.description];
      }
      if (colMap.toFrom !== undefined && row[colMap.toFrom]) {
        const toFrom = row[colMap.toFrom].trim();
        if (toFrom && toFrom !== description) {
          description = description ? `${toFrom} - ${description}` : toFrom;
        }
      }

      if (!description) {
        for (let j = 0; j < row.length; j++) {
          if (j === colMap.date) continue;
          if (colMap.moneyIn !== undefined && j === colMap.moneyIn) continue;
          if (colMap.moneyOut !== undefined && j === colMap.moneyOut) continue;
          if (colMap.balance !== undefined && j === colMap.balance) continue;
          const cell = row[j].trim();
          if (cell && !datePattern.test(cell) && !/^\d[\d,]*\.?\d*$/.test(cell)) {
            description = cell;
            break;
          }
        }
      }

      description = formatName(description);
      if (!description || description.length < 2) continue;

      let txType = type;
      if (colMap.type !== undefined && row[colMap.type]) {
        const typeText = row[colMap.type].toLowerCase();
        if (/inward|credit|received|in\b/i.test(typeText)) txType = "credit";
        else if (/outward|debit|sent|out\b/i.test(typeText)) txType = "debit";
      }

      const combinedRow = combined.toUpperCase();
      if (/OPENING BALANCE|CLOSING BALANCE|SUMMARY/.test(combinedRow)) continue;

      transactions.push({
        date: parseDateDDMMYY(dateStr).toISOString(),
        description,
        amount,
        type: txType,
        balance: balance || undefined,
        narration: description,
      });
    } catch (err) {
      errors.push(`Row ${i + 1}: ${err}`);
    }
  }

  const dates = transactions
    .map((t) => new Date(t.date).getTime())
    .sort((a, b) => a - b);

  return {
    transactions,
    errors,
    metadata: {
      fileName: "",
      fileType: "pdf",
      totalRows: rows.length,
      parsedRows: transactions.length,
      dateRange:
        dates.length > 0
          ? { start: new Date(dates[0]).toISOString(), end: new Date(dates[dates.length - 1]).toISOString() }
          : undefined,
    },
  };
}

function parseDateDDMMYY(dateStr: string): Date {
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{2})/);
  if (match) {
    const day = parseInt(match[1]);
    const month = parseInt(match[2]);
    let year = parseInt(match[3]);
    if (year < 100) year += 2000;
    return new Date(year, month - 1, day);
  }
  return new Date(dateStr);
}

export function parseKudaFromPdfData(pdfData: any, fileName: string): ParseResult {
  console.log(`[KudaPDFParser] Pages: ${(pdfData.Pages || []).length}`);

  const lines = extractTextLines(pdfData);
  console.log(`[KudaPDFParser] Extracted ${lines.length} text lines`);

  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    console.log(`[KudaPDFParser] Line y=${lines[i].y}: ${lines[i].items.map(it => it.text).join(" | ")}`);
  }

  const rows = mergeMultilineTransactions(lines);
  console.log(`[KudaPDFParser] Merged into ${rows.length} rows`);

  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    console.log(`[KudaPDFParser] Row ${i}: ${rows[i].join(" | ")}`);
  }

  const result = parseKudaRows(rows);
  result.metadata.fileName = fileName;
  result.metadata.detectedBank = "Kuda Bank";

  console.log(`[KudaPDFParser] Parsed ${result.transactions.length} transactions, ${result.errors.length} errors`);

  return result;
}
