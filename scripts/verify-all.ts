/**
 * Final full-suite verification: all 8 statements through parseStatement
 * (the production entry point) checked against every printed anchor.
 */
import fs from "fs";
import path from "path";
import { parseStatement } from "../src/lib/parsers";

const DIR = "C:\\Users\\User\\Desktop\\bank statement";

const EXPECTED: Record<
  string,
  { totalCredit?: number; totalDebit?: number; opening?: number; closing?: number }
> = {
  "Eco bank statement.pdf": {
    opening: 0,
    closing: 271825.04,
    totalCredit: 7686663687.14,
    totalDebit: 7686391862.1,
  },
  "Fidelity Bank Statement.pdf": { opening: 2123769019.11, closing: 142356208.63 },
  "First Bank Statement.pdf": { opening: 5153.72, closing: 5153.98, totalCredit: 0.26, totalDebit: 0 },
  "Globus Bank Statement.pdf": {
    opening: 0,
    closing: 547407657.1,
    totalCredit: 557480000.0,
    totalDebit: 10072342.9,
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
    totalCredit: 1500000.0,
    totalDebit: 5822770.23,
  },
};

async function main() {
  let pass = 0;
  let fail = 0;
  for (const file of Object.keys(EXPECTED)) {
    const exp = EXPECTED[file];
    const buf = fs.readFileSync(path.join(DIR, file));
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
    const res = await parseStatement(ab, file);
    const txs = res.transactions;
    const credits = txs.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
    const debits = txs.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);
    const out: Record<string, unknown> = { file: file.replace(".pdf", ""), tx: txs.length };
    let allOk = true;
    if (exp.totalCredit !== undefined) {
      const ok = Math.abs(credits - exp.totalCredit) < 0.01;
      out.credit = ok ? "PASS" : `FAIL(${credits.toFixed(2)} vs ${exp.totalCredit})`;
      allOk &&= ok;
    }
    if (exp.totalDebit !== undefined) {
      const ok = Math.abs(debits - exp.totalDebit) < 0.01;
      out.debit = ok ? "PASS" : `FAIL(${debits.toFixed(2)} vs ${exp.totalDebit})`;
      allOk &&= ok;
    }
    if (exp.closing !== undefined) {
      const last = [...txs].reverse().find((t) => t.balance !== undefined);
      const ok = last !== undefined && Math.abs(last.balance! - exp.closing) < 0.01;
      out.closing = ok ? "PASS" : `FAIL(${last?.balance} vs ${exp.closing})`;
      allOk &&= ok;
    }
    // balance chain continuity check (every consecutive balanced tx)
    let chainBreaks = 0;
    let prevB: number | null = exp.opening ?? null;
    const sorted = [...txs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    for (const t of sorted) {
      if (t.balance === undefined) continue;
      if (prevB !== null) {
        const diff = Math.round((t.balance - prevB) * 100) / 100;
        const mv = t.type === "credit" ? t.amount : -t.amount;
        if (Math.abs(diff - mv) > 0.011) chainBreaks++;
      }
      prevB = t.balance;
    }
    out.chainBreaks = chainBreaks;
    out.bank = res.metadata.detectedBank;
    out.acct = res.metadata.detectedAccountNumber;
    console.log(JSON.stringify(out));
    if (allOk) pass++;
    else fail++;
  }
  console.log(`\n${pass} fully PASS, ${fail} with residual failures`);
}

main();
