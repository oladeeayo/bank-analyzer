import fs from "fs";
import path from "path";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFParser = require("pdf2json");
import { parseNigerianStandardRows } from "../src/lib/parsers/pdf-parser";

const DIR = "C:\\Users\\User\\Desktop\\bank statement";

function extractRows(pdfData: any): string[][] {
  const rows: string[][] = [];
  for (const page of pdfData.Pages || []) {
    const tokens: { x: number; y: number; text: string }[] = [];
    for (const t of page.Texts || []) {
      if (!t.R) continue;
      for (const r of t.R) {
        if (!r.T) continue;
        try {
          const decoded = decodeURIComponent(r.T).trim();
          if (decoded) tokens.push({ x: t.x, y: t.y, text: decoded });
        } catch {
          const raw = r.T.trim();
          if (raw) tokens.push({ x: t.x, y: t.y, text: raw });
        }
      }
    }
    tokens.sort((a, b) => a.y - b.y || a.x - b.x);
    const lines: { x: number; text: string }[][] = [];
    let current: typeof tokens = [];
    for (const tok of tokens) {
      if (current.length === 0) { current = [tok]; continue; }
      const avgY = current.reduce((s, t2) => s + t2.y, 0) / current.length;
      if (Math.abs(tok.y - avgY) <= 0.55) current.push(tok);
      else { current.sort((a, b) => a.x - b.x); lines.push(current); current = [tok]; }
    }
    if (current.length) { current.sort((a, b) => a.x - b.x); lines.push(current); }
    for (const line of lines) {
      const merged: { x: number; text: string }[] = [];
      for (const item of line) {
        const prev = merged[merged.length - 1];
        if (!prev) { merged.push({ ...item }); continue; }
        const prevEnd = prev.x + prev.text.length * 0.45;
        const gap = item.x - prevEnd;
        if (gap < 0.85) prev.text += (gap > 0.3 ? " " : "") + item.text;
        else merged.push({ ...item });
      }
      rows.push(merged.map((m) => m.text));
    }
  }
  return rows;
}

function parseOne(file: string): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const raw = fs.readFileSync(path.join(DIR, file));
    const ab = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer;
    const parser = new PDFParser();
    parser.on("pdfParser_dataReady", (pdfData: any) => resolve(extractRows(pdfData)));
    parser.on("pdfParser_dataError", (e: any) => reject(new Error(e?.parserError)));
    parser.parseBuffer(Buffer.from(ab));
  });
}

const EXPECTED: Record<string, { totalCredit?: number; totalDebit?: number; opening?: number; closing?: number }> = {
  "Eco bank statement.pdf": { opening: 0, closing: 271825.04 },
  "Fidelity Bank Statement.pdf": { opening: 2123769019.11, closing: 142356208.63 },
  "First Bank Statement.pdf": { totalCredit: 0.26, totalDebit: 0, opening: 5153.72 },
  "Globus Bank Statement.pdf": { opening: 0, closing: 547407657.1, totalDebit: 10072342.9 },
  "Providus Bank Statement.pdf": { opening: 0, closing: 22202810.13 },
  "WEMA BANK STATEMENT.pdf": { totalCredit: 3818245.75, totalDebit: 3716882.01, opening: 412450.67 },
  "Zenith Bank Statetement.pdf": { totalCredit: 1500000.0, totalDebit: 5822770.23, opening: 5034401.98 },
};

async function main() {
  for (const file of Object.keys(EXPECTED)) {
    let rows: string[][] | null = null;
    for (let a = 0; a < 3 && !rows; a++) {
      try { rows = await parseOne(file); } catch { await new Promise((r) => setTimeout(r, 200)); }
    }
    if (!rows) { console.log(JSON.stringify({ file, error: "unparseable" })); continue; }
    const res = parseNigerianStandardRows(rows);
    console.log("ROWS for", file, rows.length, "errors:", JSON.stringify(res.errors.slice(0, 3)));
    const txs = res.transactions;
    const credits = txs.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
    const debits = txs.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);
    const exp = EXPECTED[file];
    const out: any = { file: file.replace(" Statement.pdf", "").replace(" BANK STATEMENT.pdf", "").replace(" Bank Statetement.pdf", "").replace(" bank statement.pdf", ""), tx: txs.length };
    if (exp.totalCredit !== undefined) out.credit = Math.abs(credits - exp.totalCredit) < 0.01 ? "PASS" : `${credits.toFixed(2)} vs ${exp.totalCredit}`;
    if (exp.totalDebit !== undefined) out.debit = Math.abs(debits - exp.totalDebit) < 0.01 ? "PASS" : `${debits.toFixed(2)} vs ${exp.totalDebit}`;
    if (exp.closing !== undefined) {
      const last = txs[txs.length - 1];
      out.closing = last && last.balance !== undefined && Math.abs(last.balance - exp.closing) < 0.01 ? "PASS" : `FAIL(${last?.balance} vs ${exp.closing})`;
    }
    console.log(JSON.stringify(out));
  }
}
main();
