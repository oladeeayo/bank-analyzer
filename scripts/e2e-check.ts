import fs from "fs";
import path from "path";
import { parseStatement } from "../src/lib/parsers";

const DIR = "C:\\Users\\User\\Desktop\\bank statement";

const EXPECTED: Record<string, { totalCredit?: number; totalDebit?: number; opening?: number; closing?: number }> = {
  "Eco bank statement.pdf": { closing: 271825.04 },
  "Fidelity Bank Statement.pdf": { closing: 142356208.63 },
  "First Bank Statement.pdf": { totalCredit: 0.26, totalDebit: 0 },
  "Globus Bank Statement.pdf": { closing: 547407657.1, totalDebit: 10072342.9 },
  "Providus Bank Statement.pdf": { closing: 22202810.13 },
  "WEMA BANK STATEMENT.pdf": { totalCredit: 3818245.75, totalDebit: 3716882.01 },
  "Zenith Bank Statetement.pdf": { totalCredit: 1500000.0, totalDebit: 5822770.23 },
};

async function main() {
  for (const file of Object.keys(EXPECTED)) {
    const buf = fs.readFileSync(path.join(DIR, file));
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
    const res = await parseStatement(ab, file);
    const txs = res.transactions;
    const credits = txs.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
    const debits = txs.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);
    const exp = EXPECTED[file];
    const out: any = {
      file: file.replace(".pdf", ""),
      bank: res.metadata.detectedBank,
      tx: txs.length,
    };
    if (exp.totalCredit !== undefined) out.credit = Math.abs(credits - exp.totalCredit) < 0.01 ? "PASS" : `FAIL(${credits.toFixed(2)})`;
    if (exp.totalDebit !== undefined) out.debit = Math.abs(debits - exp.totalDebit) < 0.01 ? "PASS" : `FAIL(${debits.toFixed(2)})`;
    if (exp.closing !== undefined) {
      const last = txs[txs.length - 1];
      out.closing = last && last.balance !== undefined && Math.abs(last.balance - exp.closing) < 0.01 ? "PASS" : `FAIL(${last?.balance})`;
    }
    out.acct = `${res.metadata.detectedAccountName ?? "?"} ${res.metadata.detectedAccountNumber ?? "?"}`;
    console.log(JSON.stringify(out));
  }
}
main();
