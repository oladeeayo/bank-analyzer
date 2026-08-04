import { ParsedTransaction, ParseResult } from "./types";
import { unspaceText } from "../utils/text-cleanup";

interface Token {
  x: number;
  y: number;
  text: string;
}

interface Line {
  y: number;
  tokens: Token[];
}

function decodeText(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

function parseAmount(text: string): number {
  if (!text) return 0;
  // Remove currency symbols (₦, #, N, commas, etc)
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

/**
 * Spatial X-coordinate Column Boundaries for Kuda Bank Statements (in pdf2json grid units ~0-50+):
 * - Date/Time: X < 10
 * - Money In: 10 <= X < 18
 * - Money Out: 18 <= X < 25
 * - Type / Narration / ToFrom: 25 <= X < 42
 * - Description: 42 <= X < 65
 * - Balance: X >= 65
 */

export function parseKudaFromPdfData(pdfData: any, fileName: string): ParseResult {
  const transactions: ParsedTransaction[] = [];
  const errors: string[] = [];
  const dateRegex = /\b(\d{2}\/\d{2}\/\d{2})\b/;

  const skipPatterns = [
    /^summary$/i, /^spend account$/i, /^type$/i,
    /^opening balance$/i, /^closing balance$/i, /^all statements$/i,
    /^account number/i, /^account date$/i, /^account\b.*\bdate\b/i,
    /^date\/time$/i, /^money in$/i, /^money out$/i,
    /^to \/ from$/i, /^description$/i, /^balance$/i,
    /^page \d/i, /Kuda MF Bank/i, /NDIC/i, /licensed by the Central Bank/i,
    /RC796975/i, /Finsbury Pavement/i, /Kuda.*Technologies/i,
    /Total Money In/i, /Total Money Out/i, /Statement Period/i
  ];

  for (const page of pdfData.Pages || []) {
    // 1. Group tokens on page by Y coordinate (line threshold ~0.6 units)
    const yMap: Record<number, Token[]> = {};

    for (const textObj of page.Texts || []) {
      if (!textObj.R || textObj.R.length === 0) continue;
      const rawText = decodeText(textObj.R[0].T || "").trim();
      if (!rawText) continue;

      const y = Math.round(textObj.y * 10) / 10;
      const x = Math.round(textObj.x * 10) / 10;

      if (!yMap[y]) yMap[y] = [];
      yMap[y].push({ x, y, text: rawText });
    }

    const sortedYs = Object.keys(yMap).map(Number).sort((a, b) => a - b);
    const lines: Line[] = sortedYs.map((y) => ({
      y,
      tokens: yMap[y].sort((a, b) => a.x - b.x),
    }));

    // 2. Detect column boundaries dynamically from transaction table header on this page
    let moneyInColX = 11;
    let moneyOutColX = 18;
    let toFromColX = 25;
    let descColX = 42;
    let balanceColX = 65;

    for (const line of lines) {
      const lineText = line.tokens.map(t => t.text).join(" ").toLowerCase();
      if (lineText.includes("date") && lineText.includes("money") && lineText.includes("balance")) {
        for (const tok of line.tokens) {
          const tLower = tok.text.toLowerCase();
          if (tLower.includes("money in")) moneyInColX = tok.x;
          else if (tLower.includes("money out") && moneyOutColX === 18) moneyOutColX = tok.x;
          else if (tLower.includes("to / from") || tLower.includes("to/from")) toFromColX = tok.x;
          else if (tLower.includes("description")) descColX = tok.x;
          else if (tLower.includes("balance")) balanceColX = tok.x;
        }
        break;
      }
    }

    // 3. Process lines to extract transactions
    let activeTx: {
      dateStr: string;
      moneyIn: number;
      moneyOut: number;
      txType: string;
      toFromParts: string[];
      descParts: string[];
      balance: number;
      lastY: number;
    } | null = null;

    const commitActiveTx = () => {
      if (!activeTx) return;

      const amount = activeTx.moneyIn > 0 ? activeTx.moneyIn : activeTx.moneyOut;
      if (amount > 0 && activeTx.dateStr) {
        const isCredit = activeTx.moneyIn > 0 || /inward|credit|received/i.test(activeTx.txType);
        const type: "credit" | "debit" = isCredit ? "credit" : "debit";

        const toFromCombined = activeTx.toFromParts.join(" ").trim();
        const descCombined = activeTx.descParts.join(" ").trim();

        let rawDescription = "";
        if (toFromCombined && descCombined && toFromCombined !== descCombined) {
          rawDescription = `${toFromCombined} - ${descCombined}`;
        } else {
          rawDescription = toFromCombined || descCombined || "Kuda Transfer";
        }

        const description = formatName(rawDescription);

        const date = parseDateDDMMYY(activeTx.dateStr);
        if (!isNaN(date.getTime()) && description.length >= 2) {
          transactions.push({
            date: date.toISOString(),
            description,
            amount,
            type,
            balance: activeTx.balance > 0 ? activeTx.balance : undefined,
            narration: description,
          });
        }
      }

      activeTx = null;
    };

    for (const line of lines) {
      const lineCombined = line.tokens.map(t => t.text).join(" ");
      if (skipPatterns.some(p => p.test(lineCombined.trim()))) continue;
      if (/OPENING BALANCE|CLOSING BALANCE|SPEND ACCOUNT|SUMMARY/i.test(lineCombined)) continue;

      // Find date token in line
      const dateToken = line.tokens.find(t => dateRegex.test(t.text));

      if (dateToken) {
        // Line has a DATE token -> Starts a NEW transaction
        commitActiveTx();

        const match = dateToken.text.match(dateRegex);
        const dateStr = match ? match[1] : "";

        let moneyIn = 0;
        let moneyOut = 0;
        let balance = 0;
        let txType = "";
        const toFromParts: string[] = [];
        const descParts: string[] = [];

        for (const tok of line.tokens) {
          const text = tok.text.trim();
          if (!text) continue;

          // Categorize token by X coordinate
          if (tok.x >= balanceColX - 3) {
            balance = parseAmount(text);
          } else if (tok.x >= descColX - 3) {
            if (!/^\d[\d,]*\.\d{2}$/.test(text) && !skipPatterns.some(p => p.test(text))) {
              descParts.push(text);
            }
          } else if (tok.x >= toFromColX - 3) {
            if (/inward|outward|transfer|loan|airtime|bills/i.test(text) && !txType) {
              txType = text;
            } else if (!skipPatterns.some(p => p.test(text))) {
              toFromParts.push(text);
            }
          } else if (tok.x >= moneyOutColX - 2 && tok.x < toFromColX - 3) {
            if (/inward|outward|transfer|loan|airtime|bills/i.test(text)) {
              txType = text;
            } else {
              const amt = parseAmount(text);
              if (amt > 0) moneyOut = amt;
            }
          } else if (tok.x >= moneyInColX - 2 && tok.x < moneyOutColX - 2) {
            const amt = parseAmount(text);
            if (amt > 0) moneyIn = amt;
          } else if (tok.x < moneyInColX - 2) {
            if (!dateRegex.test(text) && !/^\d{2}:\d{2}:\d{2}$/.test(text)) {
              toFromParts.push(text);
            }
          }
        }

        activeTx = {
          dateStr,
          moneyIn,
          moneyOut,
          txType,
          toFromParts,
          descParts,
          balance,
          lastY: line.y,
        };
      } else if (activeTx && Math.abs(line.y - activeTx.lastY) < 10) {
        // Line has NO date token -> Continuation line for active transaction
        activeTx.lastY = line.y;

        for (const tok of line.tokens) {
          const text = tok.text.trim();
          if (!text || dateRegex.test(text) || skipPatterns.some(p => p.test(text))) continue;

          // Check if token is in narration / toFrom / description columns
          if (tok.x >= toFromColX - 4 && tok.x < balanceColX - 2) {
            if (/inward|outward|transfer|loan|airtime|bills/i.test(text) && !activeTx.txType) {
              activeTx.txType = text;
            } else if (!/^\d[\d,]*\.\d{2}$/.test(text)) {
              if (tok.x >= descColX - 2) {
                activeTx.descParts.push(text);
              } else {
                activeTx.toFromParts.push(text);
              }
            }
          }
        }
      }
    }

    // Commit any remaining active transaction on page end
    commitActiveTx();
  }

  const dates = transactions
    .map((t) => new Date(t.date).getTime())
    .sort((a, b) => a - b);

  console.log(`[KudaPDFParser] Parsed ${transactions.length} transactions, ${errors.length} errors`);
  if (transactions.length > 0) {
    console.log(`[KudaPDFParser] First: ${transactions[0].date} | ${transactions[0].description} | ${transactions[0].amount} (${transactions[0].type})`);
    console.log(`[KudaPDFParser] Last: ${transactions[transactions.length - 1].date} | ${transactions[transactions.length - 1].description} | ${transactions[transactions.length - 1].amount} (${transactions[transactions.length - 1].type})`);
  }

  return {
    transactions,
    errors,
    metadata: {
      fileName,
      fileType: "pdf",
      detectedBank: "Kuda Bank",
      totalRows: transactions.length,
      parsedRows: transactions.length,
      dateRange:
        dates.length > 0
          ? { start: new Date(dates[0]).toISOString(), end: new Date(dates[dates.length - 1]).toISOString() }
          : undefined,
    },
  };
}

/**
 * Fallback parser for Kuda Bank Statements extracted via Markdown / @firecrawl/pdf-inspector.
 * Normalizes character-level spaces and parses transactions from Markdown tables or text lines.
 */
export function parseKudaFromMarkdown(markdownText: string, fileName: string): ParseResult {
  const transactions: ParsedTransaction[] = [];
  const errors: string[] = [];

  if (!markdownText || markdownText.trim().length === 0) {
    return { transactions: [], errors: ["Empty Markdown text"], metadata: { fileName, fileType: "pdf", totalRows: 0, parsedRows: 0 } };
  }

  // 1. Clean markdown pipe tables into space-separated text lines & un-space character spacing
  const lines = markdownText
    .split("\n")
    .map((line) => {
      let cleaned = line.replace(/\|/g, " ").trim();
      return unspaceText(cleaned);
    })
    .filter((l) => l.length > 0);

  const dateRegex = /\b(\d{2}\/\d{2}\/\d{2})\b/;
  const skipPatterns = [
    /^summary$/i, /^spend account$/i, /^type$/i,
    /^opening balance$/i, /^closing balance$/i, /^all statements$/i,
    /^account number/i, /^account date$/i, /^page \d/i,
    /Kuda MF Bank/i, /NDIC/i, /licensed by the Central Bank/i,
  ];

  let currentTx: {
    dateStr: string;
    amount: number;
    type: "debit" | "credit";
    descParts: string[];
    balance?: number;
  } | null = null;

  const commitTx = () => {
    if (!currentTx) return;
    if (currentTx.amount > 0 && currentTx.dateStr) {
      const description = formatName(currentTx.descParts.join(" "));
      const date = parseDateDDMMYY(currentTx.dateStr);

      if (!isNaN(date.getTime()) && description.length >= 2) {
        transactions.push({
          date: date.toISOString(),
          description,
          amount: currentTx.amount,
          type: currentTx.type,
          balance: currentTx.balance,
          narration: description,
        });
      }
    }
    currentTx = null;
  };

  for (const line of lines) {
    if (skipPatterns.some((p) => p.test(line))) continue;

    const dateMatch = line.match(dateRegex);

    if (dateMatch) {
      commitTx();

      const dateStr = dateMatch[1];

      // Match amount: e.g. ₦50,000.00, ₦4,340.08, ₦15,000.00, ₦8,000.00
      const amounts = line.match(/[₦#][+\-]?[\d,]+\.\d{2}/g) || line.match(/[\d,]+\.\d{2}/g) || [];
      const parsedAmounts = amounts.map((s: string) => parseAmount(s)).filter((a: number) => a > 0);

      const isCredit = /inward|credit|\+|received/i.test(line);
      const isDebit = /outward|debit|loan|charges|interest|\-/i.test(line);

      let amount = 0;
      let balance: number | undefined = undefined;

      if (parsedAmounts.length >= 2) {
        amount = parsedAmounts[0];
        balance = parsedAmounts[parsedAmounts.length - 1];
      } else if (parsedAmounts.length === 1) {
        amount = parsedAmounts[0];
      }

      const type: "debit" | "credit" = isCredit ? "credit" : isDebit ? "debit" : "debit";

      // Clean narration text from date & amount tokens
      let descText = line
        .replace(dateRegex, "")
        .replace(/\d{2}:\d{2}:\d{2}/, "")
        .replace(/[₦#][+\-]?[\d,]+\.\d{2}/g, "")
        .replace(/inward|outward|transfer|loan|airtime|bills/gi, "")
        .trim();

      currentTx = {
        dateStr,
        amount,
        type,
        descParts: descText ? [descText] : [],
        balance,
      };
    } else if (currentTx) {
      // Continuation line for active transaction narration
      let lineCleaned = line
        .replace(/[₦#][+\-]?[\d,]+\.\d{2}/g, "")
        .replace(/inward|outward|transfer|loan|airtime|bills/gi, "")
        .trim();

      if (lineCleaned && !skipPatterns.some((p) => p.test(lineCleaned))) {
        currentTx.descParts.push(lineCleaned);
      }
    }
  }

  commitTx();

  const dates = transactions.map((t) => new Date(t.date).getTime()).sort((a, b) => a - b);

  return {
    transactions,
    errors,
    metadata: {
      fileName,
      fileType: "pdf",
      detectedBank: "Kuda Bank (Markdown)",
      totalRows: transactions.length,
      parsedRows: transactions.length,
      dateRange:
        dates.length > 0
          ? { start: new Date(dates[0]).toISOString(), end: new Date(dates[dates.length - 1]).toISOString() }
          : undefined,
    },
  };
}

