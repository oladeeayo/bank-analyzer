/**
 * Test the markdown-ledger parser on all 8 statements and compare every
 * figure against the printed anchors.
 */
import fs from "fs";
import path from "path";
import { parseMarkdownLedger } from "../src/lib/parsers/markdown-ledger-parser";

const DIR = "C:\\Users\\User\\Desktop\\bank statement";

const EXPECTED: Record<
  string,
  { totalCredit?: number; totalDebit?: number; opening?: number; closing?: number }
> = {
  "Eco bank statement.pdf": {
    opening: 0,
    closing: 271825.04,
    totalCredit: 7686663687.14,
    totalDebit: 7686391862.10,
  },
  "Fidelity Bank Statement.pdf": {
    opening: 2123769019.11,
    closing: 142356208.63,
  },
  "First Bank Statement.pdf": { opening: 5153.72, closing: 5153.98, totalCredit: 0.26, totalDebit: 0 },
  "Globus Bank Statement.pdf": {
    opening: 0,
    closing: 547407657.10,
    totalCredit: 557480000.00,
    totalDebit: 10072342.90,
  },
  "Kuda Statement.pdf": {
    opening: -39252.46,
    closing: -37049.58,
    totalCredit: 151639.75,
    totalDebit: 149436.87,
  },
  "Providus Bank Statement.pdf": { opening: 0, closing: 22202810.13 },
  "WEMA BANK STATEMENT.pdf": {
    opening: 248.67,
    closing: 101612.41,
    totalCredit: 3818245.75,
    totalDebit: 3716882.01,
  },
  "Zenith Bank Statetement.pdf": {
    opening: 5034401.98,
    closing: 711631.75,
    totalCredit: 1500000.00,
    totalDebit: 5822770.23,
  },
};

async function main() {
  for (const file of Object.keys(EXPECTED)) {
    const exp = EXPECTED[file];
    const buf = fs.readFileSync(path.join(DIR, file));
    const res = parseMarkdownLedger(buf, file);
    const txs = res.transactions;
    const credits = txs.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
    const debits = txs.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);
    const out: Record<string, unknown> = { file: file.replace(".pdf", ""), tx: txs.length };
    if (exp.totalCredit !== undefined)
      out.credit =
        Math.abs(credits - exp.totalCredit) < 0.01
          ? "PASS"
          : `FAIL(${credits.toFixed(2)} vs ${exp.totalCredit})`;
    if (exp.totalDebit !== undefined)
      out.debit =
        Math.abs(debits - exp.totalDebit) < 0.01
          ? "PASS"
          : `FAIL(${debits.toFixed(2)} vs ${exp.totalDebit})`;
    if (exp.closing !== undefined) {
      const lastBalanced = [...txs].reverse().find((t) => t.balance !== undefined);
      out.closing =
        lastBalanced && Math.abs(lastBalanced.balance! - exp.closing) < 0.01
          ? "PASS"
          : `FAIL(${lastBalanced?.balance} vs ${exp.closing})`;
    }
    if (res.errors.length) out.errors = res.errors.slice(0, 4);
    // flag suspicious transactions for audit
    const suspicious = txs.filter((t) => Math.abs(t.amount - 125.09) < 0.02);
    if (suspicious.length > 0) out.suspicious = suspicious.map((t) => ({ d: t.date.slice(0, 10), a: t.amount, ty: t.type, desc: t.description.slice(0, 40) }));
    console.log(JSON.stringify(out));
  }
}

main();
