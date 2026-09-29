import fs from "fs";
import path from "path";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFParser = require("pdf2json");

const DIR = "C:\\Users\\User\\Desktop\\bank statement";
const target = process.argv[2] || "";
const limit = parseInt(process.argv[3] || "30", 10);

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
      const sorted = [...line];
      for (const item of sorted) {
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

function parseOnce(): Promise<any> {
  return new Promise((resolve, reject) => {
    const raw = fs.readFileSync(path.join(DIR, target));
    // Replicate app path: ArrayBuffer -> Buffer.from (copy)
    const ab = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer;
    const buf = Buffer.from(ab);
    const parser = new PDFParser();
    parser.on("pdfParser_dataReady", (pdfData: any) => resolve(pdfData));
    parser.on("pdfParser_dataError", (e: any) => reject(new Error(e?.parserError || "parse error")));
    parser.parseBuffer(buf);
  });
}

async function main() {
  let pdfData: any = null;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      pdfData = await parseOnce();
      break;
    } catch (e: any) {
      console.log(`attempt ${attempt} failed: ${e.message.slice(0, 80)}`);
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  if (!pdfData) { console.log("ALL ATTEMPTS FAILED"); process.exit(1); }
  const rows = extractRows(pdfData);
  console.log("Total rows:", rows.length);
  for (let i = 0; i < Math.min(rows.length, limit); i++) {
    console.log(`[${i}] ${JSON.stringify(rows[i])}`);
  }
  process.exit(0);
}

main();
