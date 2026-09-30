/**
 * Markdown-first ledger parser for Nigerian bank statement PDFs.
 *
 * Pipeline ("ingest as markdown first"):
 *  1. @firecrawl/pdf-inspector converts each PDF page to Markdown with real
 *     pipe-tables — Debit/Credit/Balance land in separate columns instead of
 *     one glued string.
 *  2. Wide statements render as TWO strip tables per page (dates+description |
 *     amounts+balance); we zip them back into single ledger rows, including
 *     narration-continuation rows. Amount strips may also appear as numeric
 *     paragraphs (D/C list, balance list) which are paired by layout.
 *  3. Every row is re-verified against the printed balance chain
 *     (prevBalance − debit + credit = balance, to the cent). The printed
 *     column assignment is only a HYPOTHESIS: banks misplace movements
 *     (Ecobank prints fixed-deposit debits nowhere at all; Fidelity prints
 *     credits in the Debit column), so arithmetic decides the direction.
 *  4. Rows that cannot be reconciled are reported — never silently accepted —
 *     and header anchors (Opening/Closing Balance, printed totals) are used
 *     to settle genuinely ambiguous rows.
 */
import { extractPagesMarkdown, classifyPdf } from "@firecrawl/pdf-inspector";
import { ParsedTransaction, ParseResult } from "./types";

const CENT = 0.005;
const r2 = (n: number) => Math.round(n * 100) / 100;

interface Movement {
  amount: number;
  type: "debit" | "credit";
}

// ---------------------------------------------------------------------------
// Money + dates
// ---------------------------------------------------------------------------

/**
 * Parse a printed money cell. Handles thousands separators, stray interior
 * spaces from column tearing ("2,123,768,947.1 1" → 2123768947.11), a
 * currency symbol and an optional sign.
 */
function moneyCell(raw: string): number | undefined {
  const s = raw.replace(/\s+/g, "").replace(/[₦€$]/g, "");
  if (!s || s === "-") return undefined;
  if (!/^-?[\d,]*(?:\.\d+)?$/.test(s)) return undefined;
  if (!/\d/.test(s)) return undefined;
  const n = parseFloat(s.replace(/,/g, ""));
  if (!Number.isFinite(n)) return undefined;
  return n;
}

function isMoneyCell(raw: string): boolean {
  return moneyCell(raw) !== undefined;
}

const DATE_SLASH = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/;
const DATE_MON = /^(\d{1,2})[-/]([A-Za-z]{3})[-/](\d{2,4})$/;
const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

export function isDateLike(s: string): boolean {
  return DATE_SLASH.test(s.trim()) || DATE_MON.test(s.trim());
}

export function parseMdDate(s: string): Date | undefined {
  const t = s.trim();
  let m = t.match(DATE_MON);
  if (m) {
    const day = parseInt(m[1], 10);
    const mon = MONTHS[m[2].toLowerCase()];
    let year = parseInt(m[3], 10);
    if (mon === undefined || !(day >= 1 && day <= 31)) return undefined;
    if (year < 100) year += year < 70 ? 2000 : 1900;
    return new Date(year, mon, day);
  }
  m = t.match(DATE_SLASH);
  if (m) {
    const day = parseInt(m[1], 10);
    const mon = parseInt(m[2], 10) - 1;
    let year = parseInt(m[3], 10);
    if (!(mon >= 0 && mon <= 11) || !(day >= 1 && day <= 31)) return undefined;
    if (year < 100) year += year < 70 ? 2000 : 1900;
    return new Date(year, mon, day);
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Header anchors
// ---------------------------------------------------------------------------

export interface LedgerAnchors {
  opening?: number;
  closing?: number;
  totalCredit?: number;
  totalDebit?: number;
  accountName?: string;
  accountNumber?: string;
}

const LABEL_PATTERNS: [("opening" | "closing" | "totalCredit" | "totalDebit"), RegExp][] = [
  ["opening", /(?:Opening|Beginning)\s*Balance/i],
  ["closing", /(?:Closing|Ending)\s*Balance/i],
  ["totalCredit", /Total\s+(?:Credits?|Lodgements?|Deposits?)\b/i],
  ["totalDebit", /Total\s+(?:Debits?|Withdrawals?)\b/i],
];

/**
 * Harvest anchors label-by-label, line-by-line. Numbers are assigned to
 * labels in document order within each line, which survives torn cells like
 * "|Total Debit: Closing Balance:|3,716,882.01 101,612.41|" (debit ← first,
 * closing ← second).
 */
export function harvestAnchors(md: string): LedgerAnchors {
  const out: LedgerAnchors = {};
  const lines = md.split("\n");
  for (const line of lines) {
    const labels: { key: keyof LedgerAnchors; at: number; end: number }[] = [];
    for (const [key, re] of LABEL_PATTERNS) {
      const m = line.match(re);
      if (m && m.index !== undefined) {
        labels.push({ key, at: m.index, end: m.index + m[0].length });
      }
    }
    if (labels.length === 0) continue;
    labels.sort((a, b) => a.at - b.at);
    const numbers: { at: number; value: number }[] = [];
    for (const m of line.matchAll(/-?\d[\d,]*(?:\.\d+)?/g)) {
      const v = parseFloat(m[0].replace(/,/g, ""));
      if (Number.isFinite(v)) numbers.push({ at: m.index ?? 0, value: v });
    }
    let ni = 0;
    for (const label of labels) {
      while (ni < numbers.length && numbers[ni].at < label.end) ni++;
      if (ni < numbers.length) {
        const key = label.key;
        if (out[key] === undefined) (out as Record<string, number | undefined>)[key] = numbers[ni].value;
        ni++;
      }
    }
  }
  const name = md.match(/\*{0,2}Account Name:?\*{0,2}\s*\|?\s*([A-Z][A-Z0-9 .,&'/-]{2,80})/i);
  if (name) out.accountName = name[1].trim();
  const num = md.match(/Account Number:?\*{0,2}\s*\|?\s*(\d{6,12})/i);
  if (num) out.accountNumber = num[1];
  return out;
}

// ---------------------------------------------------------------------------
// Markdown block parsing
// ---------------------------------------------------------------------------

interface MdTable {
  kind: "table";
  header: string[];
  rows: string[][];
}
interface MdPara {
  kind: "para";
  text: string;
  numbers: { value: number; index: number }[];
}
type MdBlock = MdTable | MdPara;

function splitPipeRow(line: string): string[] {
  const t = line.trim();
  const inner = t.startsWith("|") ? t.slice(1) : t;
  const cells = inner.endsWith("|") ? inner.slice(0, -1).split("|") : inner.split("|");
  return cells.map((c) => c.trim());
}

function isSeparatorRow(line: string): boolean {
  return /^\|\s*-{2,}/.test(line.trim());
}

function parseBlocks(pageMd: string): MdBlock[] {
  const blocks: MdBlock[] = [];
  const lines = pageMd.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith("|")) {
      const header = splitPipeRow(line);
      i++;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        if (!isSeparatorRow(lines[i])) rows.push(splitPipeRow(lines[i]));
        i++;
      }
      blocks.push({ kind: "table", header, rows });
      continue;
    }
    const paraLines: string[] = [];
    while (i < lines.length && !lines[i].trim().startsWith("|")) {
      if (lines[i].trim()) paraLines.push(lines[i].trim());
      i++;
    }
    if (paraLines.length > 0) {
      const paraTextRaw = paraLines.join(" ");
      let text = paraTextRaw;
      // Date-like tokens (26-Jan-2026, 03/08/2026) must not leak their
      // pieces ("26", "03") into the number stream.
      const dateTokens: { at: number; len: number }[] = [];
      // No trailing \b: dates are often glued to narration
      // ("26-01-2026Ref26012026S47143267") and must still be blanked.
      for (const m of text.matchAll(/(?<![A-Za-z\d])\d{1,2}[-/][A-Za-z]{3}[-/]\d{2,4}|(?<![A-Za-z\d])\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/g)) {
        dateTokens.push({ at: m.index ?? 0, len: m[0].length });
      }
      for (const dt of dateTokens.reverse()) {
        text = text.slice(0, dt.at) + " ".repeat(dt.len) + text.slice(dt.at + dt.len);
      }
      // Numbers not glued to letters (avoids account digits inside words
      // like "KIPGLOBUS1000213896MARIN").
      const numbers: { value: number; index: number }[] = [];
      for (const m of text.matchAll(/(?<![A-Za-z\d])[-+]?₦?\s?\d[\d,]*(?:\.\d+)?/g)) {
        const v = moneyCell(m[0]);
        if (v !== undefined) numbers.push({ value: v, index: m.index ?? 0 });
      }
      // Keep the un-blanked text for record detection: dates inside it tell
      // us this paragraph is a collapsed table (First Bank style).
      blocks.push({ kind: "para", text: paraTextRaw, numbers });
    }
  }
  return blocks;
}

// ---------------------------------------------------------------------------
// Row assembly
// ---------------------------------------------------------------------------

interface PageRow {
  dates: Date[];
  narration: string;
  nums: number[];
  source: "table" | "para";
}

// Statement header/metadata lines — never transactions.
const HEADER_ROW_RE =
  /account name|account number|account type|account class|statement period|period\s*:|currency|branch address|^address|opening balance|closing balance|beginning balance|ending balance|total credit|total debit|total lodgement|total withdrawal|total deposit|available balance|statement of account/i;

const COLUMN_HEADER_RE =
  /^(trans(?:action)?\s*date|date\s*posted|txn\s*date|post\s*date|value\s*date|ref(?:erence|\.)?|description|transaction\s*details|remarks|debit|credit|balance|money\s*in|money\s*out|to\s*\/?\s*from)+[\s|]*$/i;

function rowNumericTail(cells: string[]): { narrCells: string[]; nums: number[] } {
  const nums: number[] = [];
  let end = cells.length;
  let emptyRun = 0;
  const hasMoneyBefore = (idx: number) =>
    cells.slice(0, idx).some((c) => c !== "" && isMoneyCell(c));
  while (end > 0) {
    const c = cells[end - 1];
    if (c === "") {
      emptyRun++;
      // Empty cells can sit where a column tore away; cross at most two
      // when more money exists further left (e.g. "|0.00||102,500,000.00|").
      if (emptyRun <= 2 && hasMoneyBefore(end - 1)) {
        end--;
        continue;
      }
      break;
    }
    // A torn cell can carry several printed values separated by spaces
    // ("0.00 2,023,768,947.1" where the credit|balance boundary collapsed)
    // — accept any cell whose whitespace parts are all money.
    const wsParts = c.split(/\s+/).filter((x) => x !== "");
    if (wsParts.length > 0 && wsParts.every((x) => isMoneyCell(x))) {
      emptyRun = 0;
      for (const part of wsParts.reverse()) nums.unshift(moneyCell(part)!);
      end--;
      continue;
    }
    break;
  }
  // Torn cent fragment: "..., 1773768551.8, 6" (balance's last cent torn
  // onto the next cell) — merge into 1773768551.86.
  while (nums.length >= 2) {
    const lastN = nums[nums.length - 1];
    const prevN = nums[nums.length - 2];
    if (
      Number.isInteger(lastN) &&
      lastN >= 0 &&
      lastN < 10 &&
      /\.\d$/.test(String(prevN))
    ) {
      nums.splice(nums.length - 2, 2, parseFloat(String(prevN) + String(lastN)));
    } else {
      break;
    }
  }
  return { narrCells: cells.slice(0, end), nums };
}

const CHANNEL_LEAD = /^(?:(?:Others?|Online|Banking|Internet|Mobile|ATM|POS|USSD|Web)\s*)+/i;

function cleanNarration(raw: string): string {
  let s = raw.replace(/\s+/g, " ").trim();
  s = s.replace(CHANNEL_LEAD, "");
  s = s.replace(/\b\d{1,2}[-/][A-Za-z]{3}[-/]\d{2,4}\b/g, " "); // date echoes
  s = s.replace(/\s+/g, " ").trim();
  s = s.replace(/^[|:\-,'\s]+/, "");
  return s;
}

function assemblePageRows(blocks: MdBlock[]): PageRow[] {
  const rows: PageRow[] = [];

  const tableIsAccountHeader = (t: MdTable) => {
    const joined = t.rows.map((r) => r.join(" ")).join(" ");
    const dateishRows = t.rows.filter((r) => r.some((c) => isDateLike(c))).length;
    return dateishRows === 0 && HEADER_ROW_RE.test(joined);
  };

  for (const block of blocks) {
    if (block.kind === "table") {
      if (tableIsAccountHeader(block)) continue;
      for (const cells of block.rows) {
        const joined = cells.join(" ");
        // Column-header / metadata rows inside data tables (torn merges).
        if (HEADER_ROW_RE.test(joined) && !cells.some((c) => isDateLike(c))) continue;
        if (COLUMN_HEADER_RE.test(joined)) continue;
        const { narrCells, nums } = rowNumericTail(cells);
        // Torn balance fragment: a row that is only 1-2 stray digits (the
        // cent of the previous row's balance). Re-attach to the previous row.
        const joinedFrag = cells.filter((c2) => c2 !== "").join(" ");
        if (
          /^\d{1,2}$/.test(joinedFrag) &&
          rows.length > 0 &&
          rows[rows.length - 1].source === "table" &&
          rows[rows.length - 1].nums.length > 0
        ) {
          const lastRow = rows[rows.length - 1];
          const lastNum = lastRow.nums[lastRow.nums.length - 1];
          // Torn cent digits: either the whole cents (lastNum integer) or the
          // last cent digit (lastNum ends with a single decimal digit).
          const lastStr = String(lastNum);
          const singleDecimal = /\.\d$/.test(lastStr);
          if (lastNum > 0 && (Number.isInteger(lastNum) || singleDecimal)) {
            const mergedBal = singleDecimal
              ? parseFloat(lastStr + joinedFrag)
              : parseFloat(`${lastStr}.${joinedFrag.padStart(2, "0")}`);
            if (Number.isFinite(mergedBal)) {
              lastRow.nums[lastRow.nums.length - 1] = mergedBal;
              continue;
            }
          }
        }
        const dates: Date[] = [];
        const rest: string[] = [];
        for (const c of narrCells) {
          const d = isDateLike(c) ? parseMdDate(c) : undefined;
          if (d && dates.length < 2) dates.push(d);
          else rest.push(c);
        }
        const narration = cleanNarration(rest.join(" "));
        if (narration.length > 0 && narration.length <= 4 && nums.length === 0 && dates.length === 0) {
          // narration-continuation fragment ("DEBO", "IKRD")
          const target = [...rows].reverse().find((r) => r.source === "table" && r.narration.length > 0);
          if (target) target.narration = `${target.narration} ${narration}`.trim();
          continue;
        }
        rows.push({ dates, narration, nums, source: "table" });
      }
      continue;
    }
    // paragraph
    rows.push({
      dates: [],
      narration: block.text,
      nums: block.numbers.map((n) => n.value),
      source: "para",
      // keep raw numbers+indices for flat-paragraph record splitting
      ...(block.numbers.length > 0 ? { paraNumbers: block.numbers, paraText: block.text } : {}),
    } as PageRow & { paraNumbers?: { value: number; index: number }[]; paraText?: string });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Zipper: pair left rows (dates+narration) with right rows (amounts)
// ---------------------------------------------------------------------------

interface ZippedRow {
  page: number;
  dates: Date[];
  narration: string;
  nums: number[];
}

function isContinuation(r: PageRow): boolean {
  return r.dates.length === 0 && r.nums.length === 0 && r.narration.length > 0;
}

function zipPageRows(
  pageRowsRaw: PageRow[],
  page: number,
  ctx: { prev: number | null; carryRows?: PageRow[] }
): {
  rows: ZippedRow[];
  orphans: number[];
  carryRows: PageRow[];
} {
  const pageRows = [...(ctx.carryRows ?? []), ...pageRowsRaw];
  const rows: ZippedRow[] = [];
  const orphans: number[] = [];

  const lefts: PageRow[] = [];
  const tableRights: PageRow[] = [];
  const fullRows: PageRow[] = [];
  const paraGroups: number[][] = [];

  for (const r of pageRows) {
    if (r.source === "para") {
      // Flat-records paragraphs (First Bank: the table collapsed into prose)
      // carry many numbers and dates; header/metadata paragraphs do not.
      const dateHits = (r.narration.match(/\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b|\b\d{1,2}[-/][A-Za-z]{3}[-/]\d{2,4}\b/g) ?? []).length;
      const looksLikeRecords = r.nums.length >= 6 && dateHits >= 2;
      if (r.nums.length > 0 && (looksLikeRecords || !HEADER_ROW_RE.test(r.narration))) {
        paraGroups.push(r.nums);
      }
      continue;
    }
    if (isContinuation(r)) continue; // narration continuations already merged
    if (r.dates.length > 0 && r.nums.length > 0) {
      fullRows.push(r); // all columns in one table
      continue;
    }
    if (r.nums.length > 0 && r.dates.length === 0) {
      // numeric strip row
      tableRights.push(r);
      continue;
    }
    lefts.push(r);
  }

  for (const r of fullRows) {
    rows.push({ page, dates: r.dates, narration: r.narration, nums: r.nums });
  }

  // ------------------------------------------------------------------
  // Left/right strip alignment: pair by position first; when counts
  // disagree, align with a DP that maximizes chain-closing adjacencies.
  // ------------------------------------------------------------------
  if (lefts.length > 0 && tableRights.length > 0 && lefts.length !== tableRights.length) {
    const closable = (left: PageRow, right: PageRow): boolean => {
      void left;
      const cells = right.nums;
      if (cells.length === 0) return false;
      const effPrev = dpPrev ?? ctx.prev;
      if (effPrev === null) return true;
      const last = cells[cells.length - 1];
      const mids = cells.slice(0, cells.length - 1);
      const diff = r2(last - effPrev);
      if (mids.length === 0) return Math.abs(diff) <= CENT; // balance echo
      if (mids.length >= 1) {
        const sum = r2(mids.reduce((s, v) => s + Math.abs(v), 0));
        if (Math.abs(sum - Math.abs(diff)) <= CENT) return true;
        const hit = mids.some((v) => Math.abs(Math.abs(v) - Math.abs(diff)) <= CENT);
        if (hit) return true;
        // derived: one mid + implied other movement
        const printed = Math.abs(mids[0]);
        const hidden = r2(Math.abs(diff) - printed);
        if (mids.length === 1 && hidden > CENT && printed < Math.abs(diff)) return true;
      }
      return false;
    };
    const N = lefts.length, M = tableRights.length;
    let dpPrev: number | null = ctx.prev;
    const NEG = -1e9;
    const dp: number[][] = Array.from({ length: N + 1 }, () => new Array(M + 1).fill(NEG));
    const bt: number[][] = Array.from({ length: N + 1 }, () => new Array(M + 1).fill(-1)); // 0=skip L,1=skip R,2=pair
    dp[0][0] = 0;
    for (let i = 0; i <= N; i++) {
      for (let j = 0; j <= M; j++) {
        if (i < N && dp[i + 1][j] < dp[i][j]) {
          dp[i + 1][j] = dp[i][j];
          bt[i + 1][j] = 0;
        }
        if (j < M && dp[i][j + 1] < dp[i][j]) {
          dp[i][j + 1] = dp[i][j];
          bt[i][j + 1] = 1;
        }
        if (i < N && j < M) {
          const gain = closable(lefts[i], tableRights[j]) ? 2 : 0;
          if (dp[i + 1][j + 1] < dp[i][j] + gain) {
            dp[i + 1][j + 1] = dp[i][j] + gain;
            bt[i + 1][j + 1] = 2;
          }
        }
      }
    }
    const pairs: [PageRow, PageRow][] = [];
    const orphanRights: PageRow[] = [];
    let i = N, j = M;
    while (i > 0 || j > 0) {
      const op = bt[i][j];
      if (op === 2) {
        pairs.push([lefts[i - 1], tableRights[j - 1]]);
        const rb = tableRights[j - 1].nums;
        const rbBal = rb.length > 0 ? rb[rb.length - 1] : undefined;
        if (rbBal !== undefined) dpPrev = rbBal;
        i--; j--;
      }
      else if (op === 0) { i--; }
      else if (op === 1) { orphanRights.push(tableRights[j - 1]); j--; }
      else break;
    }
    pairs.reverse();
    orphanRights.reverse();
    // lefts skipped by the alignment keep their narration but lose their row;
    // emit them (they are usually torn fragments) as narration-only rows so
    // the count stays honest.
    const skippedLefts = lefts.filter((l) => !pairs.some((p) => p[0] === l));
    for (const [l, r] of pairs) {
      rows.push({ page, dates: l.dates, narration: l.narration, nums: r.nums });
    }
    for (const l of skippedLefts) {
      rows.push({ page, dates: l.dates, narration: l.narration, nums: [] });
    }
    for (const r of orphanRights) orphans.push(...r.nums);
  } else {
    const n = Math.max(lefts.length, tableRights.length);
    for (let k = 0; k < n; k++) {
      const left = lefts[k];
      const right = tableRights[k];
      if (left && right) {
        rows.push({ page, dates: left.dates, narration: left.narration, nums: right.nums });
      } else if (left) {
        rows.push({ page, dates: left.dates, narration: left.narration, nums: [] });
      } else if (right) {
        orphans.push(...right.nums);
      }
    }
  }

  // ------------------------------------------------------------------
  // Numeric paragraph groups: attach to rows still missing numbers using
  // chain-guided groupings, else First-Bank-style flat segmentation.
  // ------------------------------------------------------------------
  if (paraGroups.length > 0) {
    const need = rows.filter((r) => r.nums.length === 0 && r.dates.length > 0);
    const N = need.length;
    void N;
    const g1 = paraGroups[0];
    const g2 = paraGroups[1];
    let consumed = false;

    if (paraGroups.length === 1 && N > 0 && g1.length === N * 3) {
      for (let k = 0; k < N; k++) need[k].nums = g1.slice(k * 3, (k + 1) * 3);
      consumed = true;
    } else if (paraGroups.length === 2 && N > 0 && g2 && g1.length === N * 2 && g2.length === N) {
      for (let k = 0; k < N; k++) need[k].nums = [g1[2 * k], g1[2 * k + 1], g2[k]];
      consumed = true;
    } else if (paraGroups.length === 1 && N > 0 && g1.length === N * 2) {
      for (let k = 0; k < N; k++) need[k].nums = g1.slice(k * 2, (k + 1) * 2);
      consumed = true;
    } else if (paraGroups.length === 2 && N > 0 && g2 && g1.length === N && g2.length === N) {
      for (let k = 0; k < N; k++) need[k].nums = [g1[k], g2[k]];
      consumed = true;
    } else if (paraGroups.length === 1 && N > 0 && g1.length === N) {
      for (let k = 0; k < N; k++) need[k].nums = [g1[k]];
      consumed = true;
    } else if (N === 0 && ctx.prev !== null) {
      // First-Bank-style flat paragraph(s): consecutive windows of 3 numbers
      // [a, b, bal] where the chain closes belong to one record. Header
      // paragraphs can also carry dates+numbers, so try every group and use
      // the first that segments into a chain-closing record set.
      for (const g of paraGroups) {
        if (g.length < 6) continue;
        const flat = segmentFlatRecords(
          pageRows.find((r) => r.source === "para" && r.nums.length === g.length) as
            | (PageRow & { paraText?: string; paraNumbers?: { value: number; index: number }[] })
            | undefined,
          ctx.prev
        );
        if (flat && flat.length > 0) {
          for (const rec of flat) {
            rows.push({ page, dates: rec.dates, narration: rec.narration, nums: rec.nums });
          }
          consumed = true;
          break;
        }
      }
    }
    if (!consumed) orphans.push(...paraGroups.flat());
  }

  // Cross-page carry: trailing rows without numbers wait for the next
  // page's numbers (strip torn across the page boundary). Numeric strips
  // without narration at the tail become carry numbers instead of orphans.
  let carryRows: PageRow[] = [];
  for (let k = rows.length - 1; k >= 0; k--) {
    const r = rows[k];
    if (r.nums.length === 0 && r.dates.length > 0 && r.narration.length > 0) {
      carryRows.unshift({ dates: r.dates, narration: r.narration, nums: [], source: "table" });
      rows.splice(k, 1);
    } else {
      break;
    }
  }
  if (carryRows.length > 3) {
    // Snowballed carries mean misalignment, not page tears: give up on them.
    carryRows = carryRows.slice(-3);
  }
  return { rows, orphans, carryRows };
}

/**
 * Segment a flat paragraph (table collapsed into prose — First Bank) into
 * records. Numbers arrive as [D, C, B] triples per record; the printed
 * balance chain confirms each triple boundary. Narration is the text
 * between records.
 */
function segmentFlatRecords(
  para: (PageRow & { paraText?: string; paraNumbers?: { value: number; index: number }[] }) | undefined,
  chainPrev: number | null
): { dates: Date[]; narration: string; nums: number[] }[] | null {
  if (!para || !para.paraText || !para.paraNumbers) return null;
  const nums = para.paraNumbers;
  const text = para.paraText;
  if (nums.length < 3) return null;

  const records: { dates: Date[]; narration: string; nums: number[] }[] = [];
  // Find the offset where the triple chain begins. Prefer a triple that
  // continues the running balance (chainPrev) over a [0,0,B] echo, which
  // can false-match zero-runs in header debris.
  let start = -1;
  let prev: number | null = null;
  if (chainPrev !== null) {
    for (let offset = 0; offset + 2 < nums.length; offset++) {
      const [d, c, b] = [nums[offset].value, nums[offset + 1].value, nums[offset + 2].value];
      if (Math.abs(r2(chainPrev - d + c - b)) <= CENT) {
        start = offset;
        prev = chainPrev;
        break;
      }
    }
  }
  if (start === -1) {
    for (let offset = 0; offset + 2 < nums.length; offset++) {
      const [d, c, b] = [nums[offset].value, nums[offset + 1].value, nums[offset + 2].value];
      if (Math.abs(r2(b - (d === 0 ? 0 : d))) < CENT && c === 0 && d === 0) {
        start = offset;
        prev = b;
        break;
      }
    }
  }
  if (start === -1 && chainPrev !== null) {
    // No opening echo: find the first triple that continues from chainPrev.
    for (let offset = 0; offset + 2 < nums.length; offset++) {
      const [d, c, b] = [nums[offset].value, nums[offset + 1].value, nums[offset + 2].value];
      if (Math.abs(r2(chainPrev - d + c - b)) <= CENT) {
        start = offset;
        prev = chainPrev;
        break;
      }
    }
  }
  if (start === -1) return null;

  let cursor = start + 3;
  while (cursor + 2 < nums.length + 1) {
    if (cursor + 2 >= nums.length + 1) break;
    let d = nums[cursor]?.value;
    let c = nums[cursor + 1]?.value;
    let b = nums[cursor + 2]?.value;
    if (d === undefined || c === undefined || b === undefined) break;
    if (prev !== null && Math.abs(r2(prev - d + c - b)) > CENT) {
      // Chain broken: the triple boundary slid (e.g. an account number
      // polluted the numbers). Try resyncing: shift the window by one or
      // two numbers and re-test.
      let resynced = false;
      for (const shift of [1, 2]) {
        const d2 = nums[cursor + shift]?.value;
        const c2 = nums[cursor + shift + 1]?.value;
        const b2 = nums[cursor + shift + 2]?.value;
        if (d2 === undefined || c2 === undefined || b2 === undefined) continue;
        if (Math.abs(r2(prev - d2 + c2 - b2)) <= CENT) {
          cursor += shift;
          resynced = true;
          break;
        }
      }
      if (!resynced) return records.length > 0 ? records : null;
      // Re-read the triple at the shifted cursor before emitting it.
      d = nums[cursor].value;
      c = nums[cursor + 1].value;
      b = nums[cursor + 2].value;
    }
    // narration = text between previous triple's balance number and this triple's start
    const prevBalIdx = cursor > 0 ? nums[cursor - 1].index : nums[start + 2].index;
    const from = prevBalIdx + String(nums[cursor - 1]?.value ?? "").length;
    const to = nums[cursor].index;
    const chunk = text.slice(from, to);
    const dates: Date[] = [];
    for (const m of chunk.matchAll(/\b\d{1,2}[-/][A-Za-z]{3}[-/]\d{2,4}\b|\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/g)) {
      const dte = parseMdDate(m[0]);
      if (dte) dates.push(dte);
    }
    records.push({
      dates,
      narration: cleanNarration(chunk.replace(/\b\d{1,2}[-/][A-Za-z]{3}[-/]\d{2,4}\b|\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/g, " ")),
      nums: [d, c, b],
    });
    prev = b;
    cursor += 3;
  }
  return records;
}

// ---------------------------------------------------------------------------
// Balance-chain solver
// ---------------------------------------------------------------------------

interface Interpretation {
  movements: Movement[];
  balance?: number;
  verified: boolean;
  method: string;
}

function mv(total: number, type: "debit" | "credit"): Movement[] {
  return [{ amount: r2(total), type }];
}

function interpretRow(nums: number[], prev: number | null, veryFirstRow: boolean): Interpretation | null {
  const cells = nums.filter((n) => Number.isFinite(n));
  if (cells.length === 0) return null;
  const last = cells[cells.length - 1];

  if (cells.length >= 3) {
    const bal = last;
    const mids = cells.slice(0, cells.length - 1).filter((v) => Math.abs(v) > CENT);
    if (prev !== null) {
      const diff = r2(bal - prev);
      // 1) printed columns as-is
      if (mids.length === 1 && Math.abs(Math.abs(mids[0]) - Math.abs(diff)) <= CENT) {
        return { movements: mv(Math.abs(diff), diff < 0 ? "debit" : "credit"), balance: bal, verified: true, method: "chain" };
      }
      // 2) mis-assigned column: the movement appears in the wrong column
      if (mids.length >= 1 && mids.length <= 2) {
        const hit = mids.find((v) => Math.abs(Math.abs(v) - Math.abs(diff)) <= CENT);
        if (hit !== undefined) {
          return { movements: mv(Math.abs(diff), diff < 0 ? "debit" : "credit"), balance: bal, verified: true, method: "chain-column-fix" };
        }
      }
      // 3) several printed movements summing to the change
      if (mids.length >= 2 && mids.length <= 3) {
        const sum = r2(mids.reduce((s, v) => s + Math.abs(v), 0));
        if (Math.abs(sum - Math.abs(diff)) <= CENT) {
          return {
            movements: mids.map((v) => ({ amount: r2(Math.abs(v)), type: (diff < 0 ? "debit" : "credit") as "debit" | "credit" })),
            balance: bal,
            verified: true,
            method: "chain-multi",
          };
        }
        // fee + reversal pair: the DIFFERENCE of two printed amounts closes
        // the chain (e.g. debit 100,000 + credit 95,114.68 => net -4,885.32)
        if (mids.length === 2) {
          const hi = Math.max(Math.abs(mids[0]), Math.abs(mids[1]));
          const lo = Math.min(Math.abs(mids[0]), Math.abs(mids[1]));
          if (Math.abs(r2(hi - lo) - Math.abs(diff)) <= CENT && lo > CENT) {
            const dir = (diff < 0 ? "debit" : "credit") as "debit" | "credit";
            return {
              movements: [
                { amount: r2(hi), type: dir },
                { amount: r2(lo), type: dir === "debit" ? "credit" : "debit" },
              ],
              balance: bal,
              verified: true,
              method: "chain-pair",
            };
          }
        }
      }
      // 4) one printed movement + one implied (hidden) movement
      if (mids.length === 1) {
        const printed = Math.abs(mids[0]);
        const hidden = r2(Math.abs(diff) - printed);
        if (hidden > CENT && printed <= Math.abs(diff) && hidden < 1e13) {
          const printedType = (diff < 0 ? "debit" : "credit") as "debit" | "credit";
          return {
            movements: [
              { amount: hidden, type: printedType === "debit" ? "credit" : "debit" },
              { amount: printed, type: printedType },
            ],
            balance: bal,
            verified: true,
            method: "chain-derived",
          };
        }
      }
      // 5) fallback: printed D/C as-is (unverified)
      if (mids.length === 2) {
        return {
          movements: [
            { amount: r2(Math.abs(mids[0])), type: "debit" },
            { amount: r2(Math.abs(mids[1])), type: "credit" },
          ],
          balance: bal,
          verified: false,
          method: "printed-dc",
        };
      }
      if (mids.length === 1) {
        return { movements: mv(Math.abs(mids[0]), diff < 0 ? "debit" : "credit"), balance: bal, verified: false, method: "diff-fallback" };
      }
      if (mids.length === 0) {
        return { movements: [], balance: bal, verified: true, method: "balance-only" };
      }
      return null;
    }
    // very first row without anchors
    if (veryFirstRow) {
      if (mids.length === 2) {
        return {
          movements: [
            { amount: r2(Math.abs(mids[0])), type: "debit" },
            { amount: r2(Math.abs(mids[1])), type: "credit" },
          ],
          balance: bal,
          verified: false,
          method: "printed-dc-first",
        };
      }
      if (mids.length === 1) {
        return { movements: mv(Math.abs(mids[0]), cells[0] === 0 ? "credit" : "debit"), balance: bal, verified: false, method: "printed-first" };
      }
      if (mids.length === 0) {
        return { movements: [], balance: bal, verified: true, method: "balance-only" };
      }
    }
    return null;
  }

  if (cells.length === 2) {
    const [a, b] = cells;
    if (prev !== null) {
      const diff = r2(b - prev);
      if (Math.abs(Math.abs(a) - Math.abs(diff)) <= CENT) {
        return { movements: mv(Math.abs(diff), diff < 0 ? "debit" : "credit"), balance: b, verified: true, method: "chain" };
      }
      // A printed zero amount means the movement column tore away; the
      // balance change itself is the movement (chain-verified).
      if (Math.abs(a) <= CENT) {
        return { movements: mv(Math.abs(diff), diff < 0 ? "debit" : "credit"), balance: b, verified: true, method: "chain" };
      }
      const hidden = r2(Math.abs(diff) - Math.abs(a));
      if (hidden > CENT && Math.abs(a) < Math.abs(diff) && hidden < 1e13) {
        const aType = (diff < 0 ? "debit" : "credit") as "debit" | "credit";
        return {
          movements: [
            { amount: hidden, type: aType === "debit" ? "credit" : "debit" },
            { amount: r2(Math.abs(a)), type: aType },
          ],
          balance: b,
          verified: true,
          method: "chain-derived",
        };
      }
      return {
        movements: [
          { amount: r2(Math.abs(a)), type: "debit" },
          { amount: r2(Math.abs(b)), type: "credit" },
        ],
        verified: false,
        method: "printed-2",
      };
    }
    if (veryFirstRow) {
      return {
        movements: [
          { amount: r2(Math.abs(a)), type: "debit" },
          { amount: r2(Math.abs(b)), type: "credit" },
        ],
        verified: false,
        method: "printed-2-first",
      };
    }
    return null;
  }

  // single number
  const a = cells[0];
  if (prev !== null) {
    const diff = r2(a - prev);
    if (Math.abs(diff) <= CENT) {
      return { movements: [], balance: a, verified: true, method: "balance-only" };
    }
    if (Math.abs(a) < 1e13) {
      return { movements: mv(Math.abs(a), a > prev ? "credit" : "debit"), verified: false, method: "single-movement" };
    }
    return null;
  }
  if (veryFirstRow) {
    return { movements: mv(Math.abs(a), "credit"), verified: false, method: "single-credit-first" };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main parse
// ---------------------------------------------------------------------------

export interface MarkdownLedgerOptions {
  /** Force a known opening balance when the header anchor is missing. */
  openingOverride?: number;
}

export function parseMarkdownLedger(buffer: Buffer, fileName: string, options: MarkdownLedgerOptions = {}): ParseResult {
  const empty = (errors: string[]): ParseResult => ({
    transactions: [],
    errors,
    metadata: { fileName, fileType: "pdf", totalRows: 0, parsedRows: 0 },
  });

  let perPage;
  try {
    const cls = classifyPdf(buffer);
    if (cls.pdfType !== "TextBased") {
      return empty([`PDF is ${cls.pdfType}; markdown ledger parser requires text-based PDFs`]);
    }
    perPage = extractPagesMarkdown(buffer, undefined);
  } catch (err) {
    return empty([`Markdown extraction failed: ${err}`]);
  }

  const errors: string[] = [];
  let fullMd = "";

  // First pass over the markdown for anchors only (printed Opening/Closing
  // Balance and totals) so the zipper and solver can use them.
  for (const page of perPage.pages) fullMd += `\n${page.markdown}`;
  const anchors = harvestAnchors(fullMd);
  const opening = options.openingOverride ?? anchors.opening ?? null;

  const transactions: ParsedTransaction[] = [];
  let prev: number | null = opening;
  let lastDate: Date | null = null;
  let chainFailures = 0;
  const deferred: { row: ZippedRow; interp: Interpretation; diff: number | null }[] = [];
  const allRows: ZippedRow[] = [];
  let orphans: number[] = [];
  let totalRows = 0;
  let carryRows: PageRow[] = [];

  const push = (row: ZippedRow, date: Date, interp: Interpretation) => {
    for (const m of interp.movements) {
      if (m.amount <= CENT) continue;
      transactions.push({
        date: date.toISOString(),
        description: row.narration || "Transaction",
        amount: m.amount,
        type: m.type,
        balance: interp.balance,
        narration: row.narration || "Transaction",
      });
    }
  };

  const solveRow = (row: ZippedRow): void => {
    if (row.narration && HEADER_ROW_RE.test(row.narration) && row.dates.length === 0) return;
    const veryFirstRow = transactions.length === 0 && deferred.length === 0;
    const interp = interpretRow(row.nums, prev, veryFirstRow);
    if (!interp) {
      if (row.dates.length > 0) lastDate = row.dates[0];
      return;
    }
    const date = row.dates[0] ?? row.dates[1] ?? lastDate;
    if (!date) {
      // Undated row: only accept when it continues the chain cleanly.
      if (interp.verified) {
        // keep previous date
      } else {
        return;
      }
    }
    const effectiveDate = (date ?? lastDate)!;
    if (!interp.verified && interp.balance === undefined && prev !== null) {
      // single-movement: defer; the NEXT verified row's chain check would
      // fail if this movement were wrong, but we lack the balance here.
      deferred.push({ row, interp, diff: null });
      lastDate = effectiveDate;
      return;
    }
    if (!interp.verified && interp.balance !== undefined && prev !== null) {
      deferred.push({ row, interp, diff: r2(interp.balance - prev) });
      prev = interp.balance;
      lastDate = effectiveDate;
      return;
    }
    push(row, effectiveDate, interp);
    if (interp.balance !== undefined) prev = interp.balance;
    else chainFailures++;
    lastDate = effectiveDate;
  };

  // Zip + solve page by page: strip alignment uses the running chain.
  for (const page of perPage.pages) {
    if (page.needsOcr) {
      errors.push(`Page ${page.page + 1} needs OCR (reason: ${page.ocrReason ?? "unknown"}); rows on it were skipped`);
      continue;
    }
    const blocks = parseBlocks(page.markdown);
    const pageRows = assemblePageRows(blocks);
    const zippedPage = zipPageRows(pageRows, page.page, { prev, carryRows });
    allRows.push(...zippedPage.rows);
    orphans = orphans.concat(zippedPage.orphans);
    totalRows += zippedPage.rows.length;
    for (const row of zippedPage.rows) solveRow(row);
    carryRows = zippedPage.carryRows;
  }

  // Flush any rows still waiting for numbers after the final page.
  for (const r of carryRows) {
    solveRow({ page: -1, dates: r.dates, narration: r.narration, nums: [] });
  }
  carryRows = [];

  const droppedRows: { row: ZippedRow; date: Date }[] = [];

  // ---------------------------------------------------------------------------
  // Settle deferred (chain-unverified) rows against the printed header
  // totals. Each row offers several arithmetically plausible readings; the
  // combination whose credit AND debit sums best match BOTH printed totals
  // wins. Rows may also be dropped entirely (garbled fragments).
  // ---------------------------------------------------------------------------
  if (deferred.length > 0) {
    interface Option {
      movements: Movement[];
      err: number; // penalty when dropped
    }
    const optionsPerRow: Option[][] = deferred.map(({ interp, diff }) => {
      const printed = interp.movements;
      const swapped = printed.map((m) => ({
        ...m,
        type: (m.type === "debit" ? "credit" : "debit") as Movement["type"],
      }));
      const opts: Option[] = [
        { movements: printed, err: 0 },
        { movements: swapped, err: 0 },
      ];
      if (diff !== null && Math.abs(diff) > CENT) {
        const t = (diff < 0 ? "debit" : "credit") as Movement["type"];
        opts.push({ movements: mv(Math.abs(diff), t), err: 0 });
        opts.push({ movements: mv(Math.abs(diff), t === "debit" ? "credit" : "debit"), err: 0 });
        // Two real movements sharing one printed cell: printed X plus the
        // implied opposite movement Y that closes the chain
        // (prev - X + Y = B => Y = X + diff, or prev + X - Y = B => Y = X - diff).
        const x = Math.abs(printed[0]?.amount ?? 0);
        if (x > CENT) {
          const y1 = r2(x + diff);
          if (y1 > CENT) {
            opts.push({
              movements: [
                { amount: x, type: "debit" },
                { amount: y1, type: "credit" },
              ],
              err: 0,
            });
          }
          const y2 = r2(x - diff);
          if (y2 > CENT) {
            opts.push({
              movements: [
                { amount: x, type: "credit" },
                { amount: y2, type: "debit" },
              ],
              err: 0,
            });
          }
          // fee+reversal pair printed as two amounts: difference closes chain
          if (printed.length === 2 && diff !== null) {
            const a = printed[0].amount, b = printed[1].amount;
            const hi = Math.max(a, b), lo = Math.min(a, b);
            if (lo > CENT && Math.abs(r2(hi - lo) - Math.abs(diff)) <= CENT) {
              const dir = (diff < 0 ? "debit" : "credit") as Movement["type"];
              opts.push({
                movements: [
                  { amount: r2(hi), type: dir },
                  { amount: r2(lo), type: dir === "debit" ? ("credit" as const) : ("debit" as const) },
                ],
                err: 0,
              });
            }
          }
          void t;
        }
      }
      // garbled fragment (e.g. truncated balance row): no movement at all
      opts.push({ movements: [], err: 0.01 });
      return opts;
    });

    const settleOn: "credit" | "debit" | null =
      anchors.totalCredit !== undefined ? "credit" : anchors.totalDebit !== undefined ? "debit" : null;

    if (settleOn) {
      const targetCredit = anchors.totalCredit ?? 0;
      const targetDebit = anchors.totalDebit ?? 0;
      const baseCredits = r2(transactions.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0));
      const baseDebits = r2(transactions.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0));

      // Cap the brute force; fall back to greedy per-row choice when huge.
      const MAX_BRUTE = 9;
      const pick = new Array<number>(deferred.length).fill(0);

      const scorePick = (picks: number[]): number => {
        let c = baseCredits;
        let d = baseDebits;
        let penalty = 0;
        for (let k = 0; k < picks.length; k++) {
          const opt = optionsPerRow[k][picks[k]];
          for (const m of opt.movements) {
            if (m.type === "credit") c = r2(c + m.amount);
            else d = r2(d + m.amount);
          }
          penalty += opt.err;
        }
        return Math.abs(r2(c - targetCredit)) + Math.abs(r2(d - targetDebit)) + penalty;
      };

      if (deferred.length <= MAX_BRUTE) {
        let bestScore = Infinity;
        let bestPicks = pick.slice();
        const total = optionsPerRow.reduce((acc, opts) => acc * opts.length, 1);
        for (let combo = 0; combo < total; combo++) {
          let rem = combo;
          for (let k = 0; k < deferred.length; k++) {
            pick[k] = rem % optionsPerRow[k].length;
            rem = Math.floor(rem / optionsPerRow[k].length);
          }
          const sc = scorePick(pick);
          if (sc < bestScore) {
            bestScore = sc;
            bestPicks = pick.slice();
          }
        }
        for (let k = 0; k < deferred.length; k++) pick[k] = bestPicks[k];
      } else {
        // greedy: pick the best option per row given everything else fixed
        for (let k = 0; k < deferred.length; k++) {
          let bestScore = Infinity;
          let bestOpt = 0;
          for (let o = 0; o < optionsPerRow[k].length; o++) {
            const saved = pick[k];
            pick[k] = o;
            const sc = scorePick(pick);
            pick[k] = saved;
            if (sc < bestScore) {
              bestScore = sc;
              bestOpt = o;
            }
          }
          pick[k] = bestOpt;
        }
      }

      for (let k = 0; k < deferred.length; k++) {
        const { row } = deferred[k];
        const date = row.dates[0] ?? lastDate ?? new Date();
        for (const m of optionsPerRow[k][pick[k]].movements) {
          if (m.amount <= CENT) continue;
          transactions.push({
            date: date.toISOString(),
            description: row.narration || "Transaction",
            amount: m.amount,
            type: m.type,
            narration: row.narration || "Transaction",
          });
        }
        if (optionsPerRow[k][pick[k]].movements.length === 0) {
          droppedRows.push({ row, date });
        }
      }
    } else {
      // No printed totals: keep the printed-column reading, flagged.
      for (const { row, interp } of deferred) {
        const date = row.dates[0] ?? lastDate ?? new Date();
        push(row, date, interp);
      }
      chainFailures += deferred.length;
    }
  }

  // ---------------------------------------------------------------------------
  // Residual-pair synthesis: when the settled totals miss BOTH printed totals
  // by the same amount R, the only arithmetic reading is a zero-net pair
  // (debit R + credit R) on one of the dropped rows — e.g. a presented and
  // returned cheque. The balance chain stays closed and the printed totals
  // become exact.
  // ---------------------------------------------------------------------------
  if (droppedRows.length > 0) {
    const residualCredit = r2((anchors.totalCredit ?? 0) - r2(transactions.filter((t) => t.type === "credit").reduce((s2, t) => s2 + t.amount, 0)));
    const residualDebit = r2((anchors.totalDebit ?? 0) - r2(transactions.filter((t) => t.type === "debit").reduce((s2, t) => s2 + t.amount, 0)));
    if (
      droppedRows.length === 1 &&
      Math.abs(residualCredit) > CENT &&
      Math.abs(residualCredit - residualDebit) <= CENT
    ) {
      const { row, date } = droppedRows[0];
      const rAmt = Math.abs(residualCredit);
      transactions.push({
        date: date.toISOString(),
        description: row.narration || "Transaction",
        amount: rAmt,
        type: "debit",
        narration: row.narration || "Transaction",
      });
      transactions.push({
        date: date.toISOString(),
        description: row.narration || "Transaction",
        amount: rAmt,
        type: "credit",
        narration: row.narration || "Transaction",
      });
      errors.push(
        `Row on ${date.toISOString().slice(0, 10)} ("${row.narration.slice(0, 40)}") printed garbled; totals force a zero-net pair of ${rAmt.toFixed(2)} (debit+credit)`
      );
    } else {
      for (const { row, date } of droppedRows) {
        errors.push(`Row on ${date.toISOString().slice(0, 10)} ("${row.narration.slice(0, 40)}") could not be reconciled; dropped`);
      }
    }
  }

  transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (chainFailures > 0) {
    errors.push(`${chainFailures} row(s) could not be verified against the balance chain`);
  }
  const realOrphans = orphans.filter((v) => Math.abs(v) > 0.004);
  if (realOrphans.length > 0) {
    errors.push(`${realOrphans.length} printed amount(s) outside any recognized row: ${realOrphans.slice(0, 4).join(", ")}`);
  }

  const credits = r2(transactions.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0));
  const debits = r2(transactions.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0));
  if (anchors.totalCredit !== undefined && Math.abs(credits - anchors.totalCredit) > 0.01) {
    errors.push(`Credit total ${credits.toFixed(2)} != printed ${anchors.totalCredit.toFixed(2)}`);
  }
  if (anchors.totalDebit !== undefined && Math.abs(debits - anchors.totalDebit) > 0.01) {
    errors.push(`Debit total ${debits.toFixed(2)} != printed ${anchors.totalDebit.toFixed(2)}`);
  }

  const dates = transactions.map((t) => new Date(t.date).getTime()).sort((a, b) => a - b);
  return {
    transactions,
    errors,
    metadata: {
      fileName,
      fileType: "pdf",
      totalRows: totalRows,
      parsedRows: transactions.length,
      dateRange:
        dates.length > 0
          ? { start: new Date(dates[0]).toISOString(), end: new Date(dates[dates.length - 1]).toISOString() }
          : undefined,
      detectedAccountName: anchors.accountName,
      detectedAccountNumber: anchors.accountNumber,
    },
  };
}

// Exposed for verification scripts/tests — not part of the public API.
export const __internals = {
  parseBlocks,
  assemblePageRows,
  zipPageRows,
  interpretRow,
  harvestAnchors,
  moneyCell,
  cleanNarration,
};
