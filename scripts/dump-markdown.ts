/**
 * Dump full markdown of one PDF to a file for inspection.
 * Usage: npx tsx scripts/dump-markdown.ts "Globus" [outPath]
 */
import fs from "fs";
import path from "path";
import { processPdf } from "@firecrawl/pdf-inspector";

const DIR = "C:\\Users\\User\\Desktop\\bank statement";
const filter = process.argv[2] ?? "Globus";
const out = process.argv[3] ?? `scripts/tmp-md-${filter.toLowerCase()}.txt`;

const file = fs
  .readdirSync(DIR)
  .find((f) => f.toLowerCase().includes(filter.toLowerCase()));
if (!file) {
  console.error(`No file matching ${filter} in ${DIR}`);
  process.exit(1);
}

const buf = fs.readFileSync(path.join(DIR, file));
const res = processPdf(buf);
fs.writeFileSync(out, res.markdown ?? "");
console.log(`Wrote ${out} (${(res.markdown ?? "").length} chars, ${res.pageCount} pages, tables on ${JSON.stringify(res.pagesWithTables)})`);
