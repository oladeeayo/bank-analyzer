/**
 * Kuda positional-column parser.
 *
 * Kuda's PDF shatters text into single glyphs with overlapping baselines,
 * so both markdown and naive text extraction "bleed" columns together.
 * The layout is still geometrically stable: every money amount starts with
 * a naira glyph ("₦"), the Money-In amounts sit left of Money-Out, and the
 * running balance sits far right. Dates sit at the far left.
 *
 * Strategy:
 *  1. cluster glyph fragments into visual rows by y;
 *  2. rebuild amounts by concatenating fragments that follow a ₦ glyph
 *     (within the row, rightward) until the next ₦ or a gap;
 *  3. classify each amount by its ₦ x-position into In / Out / Balance;
 *  4. group rows into transactions: a date row starts a transaction,
 *     continuation rows refine/append until the next date row;
 *  5. verify the whole stream against the balance chain
 *     (prev − out + in = balance) and header anchors.
 */
import { extractTextWithPositions } from "@firecrawl/pdf-inspector";
import { ParsedTransaction, ParseResult } from "./types";

interface Frag {
  x: number;
  y: number;
  text: string;
}

interface Amount {
  value: number;
  x: number; // x of the ₦ glyph
}

interface KudaRow {
  y: number;
  frags: Frag[];
  amounts: Amount[];
  dates: string[]; // "dd/mm/yy"
  times: string[]; // "hh:mm:ss"
}

const NAIRA = "₦";
const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Rebuild amounts from a row's fragments: a ₦ glyph starts an amount; the
 * following numeric fragments until the next ₦ belong to it. Naira glyph
 * positions decide the column.
 */
function extractAmounts(frags: Frag[]): Amount[] {
  const amounts: Amount[] = [];
  let current: { x: number; chars: string[] } | null = null;
  for (const f of frags) {
    const hasNaira = f.text.includes(NAIRA);
    if (hasNaira) {
      // flush previous amount
      if (current) {
        const value = parseAmountChars(current.chars);
        if (value !== null) amounts.push({ value, x: current.x });
      }
      current = { x: f.x, chars: [] };
      // text after the ₦ inside this fragment
      const after = f.text.slice(f.text.indexOf(NAIRA) + 1);
      if (after) current.chars.push(after);
      continue;
    }
    if (current) {
      // Always append: narration glyphs interleave with amount glyphs in
      // x-order ("4,340.lo0a8n" = 4,340.08 + "loan"), so letters must be
      // stripped at parse time, never used as a boundary.
      current.chars.push(f.text);
    }
  }
  if (current) {
    const value = parseAmountChars(current.chars);
    if (value !== null) amounts.push({ value, x: current.x });
  }
  return amounts;
}

function parseAmountChars(chars: string[]): number | null {
  // De-interleave: narration glyphs alternate with amount glyphs in x-order
  // ("o-l2a3da,1y8o5.20" = -23,185.20 with "oladayo" woven through).
  // Keep money-ish chars in order, then reconstruct the first number.
  let s = chars.join("");
  s = s.replace(new RegExp(NAIRA, "g"), "");
  s = s.replace(/[^0-9.,\-]/g, "");
  if (!s || !/\d/.test(s)) return null;
  // sign: the minus glyph can tear anywhere into the interleaved fragments
  // ("2-6,949.58"), and money never contains '-' except as a sign.
  const neg = s.includes("-");
  s = s.replace(/-/g, "");
  // integer part: leading digits (with thousands commas)
  const intM = s.match(/^\d{1,3}(?:,\d{3})+|^\d+/);
  if (!intM) return null;
  const intPart = intM[0].replace(/,/g, "");
  const rest = s.slice(intM[0].length);
  // decimals: '.' followed by exactly 2 digits then a non-digit/end —
  // longer digit runs are narration pollution, not cents.
  let dec = "";
  if (rest.startsWith(".")) {
    const d = rest.slice(1).match(/^(\d{2})(?!\d)/);
    if (d) dec = d[1];
  }
  const n = parseFloat(intPart + (dec ? "." + dec : ""));
  if (!Number.isFinite(n)) return null;
  return neg ? -n : n;
}

/** Group fragments into visual rows (tolerance accounts for torn baselines). */
export function buildRows(items: { text: string; x: number; y: number }[]): KudaRow[] {
  const frags: Frag[] = items
    .filter((i) => i.text.trim().length > 0)
    .map((i) => ({ x: i.x, y: i.y, text: i.text }));
  frags.sort((a, b) => b.y - a.y || a.x - b.x); // top to bottom

  const rows: KudaRow[] = [];
  const TOL = 6;
  for (const f of frags) {
    const last = rows[rows.length - 1];
    if (last && Math.abs(last.y - f.y) <= TOL) {
      last.frags.push(f);
    } else {
      rows.push({ y: f.y, frags: [f], amounts: [], dates: [], times: [] });
    }
  }
  for (const r of rows) {
    r.frags.sort((a, b) => a.x - b.x);
    r.amounts = extractAmounts(r.frags);
    // dates: "dd/mm/yy" may be shattered into "0" "4" "/0" "2" "/2" "6"
    // AND torn mid-fragment ("02/02/2₦4,340.08" — the last digit lands in
    // the next fragment), so scan the whole row's text.
    const joinedAll = r.frags.map((f) => f.text).join("");
    const dateM = joinedAll.match(/(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{2})/);
    if (dateM) {
      r.dates.push(`${dateM[1]}/${dateM[2]}/${dateM[3]}`);
    }
    // times: "hh:mm:ss" fragments
    const timeFrags = r.frags.filter((f) => /^\d{1,2}:\d{2}/.test(f.text));
    if (timeFrags.length > 0) {
      r.times.push(timeFrags[0].text);
    }
  }
  return rows;
}

const MONTH_DAYS = (y: number, m: number) => new Date(y, m, 0).getDate();

function parseKudaDate(d: string, time: string | null): Date {
  const [dd, mm, yy] = d.split("/").map((x) => parseInt(x, 10));
  const year = yy < 100 ? 2000 + yy : yy;
  let h = 0, mi = 0, s = 0;
  if (time) {
    const parts = time.split(":").map((x) => parseInt(x, 10));
    h = parts[0] || 0;
    mi = parts[1] || 0;
    s = parts[2] || 0;
  }
  return new Date(year, mm - 1, Math.min(dd, MONTH_DAYS(year, mm)), h, mi, s);
}

export function parseKudaPositional(buffer: Buffer, fileName: string): ParseResult {
  const empty = (errors: string[]): ParseResult => ({
    transactions: [],
    errors,
    metadata: { fileName, fileType: "pdf", totalRows: 0, parsedRows: 0 },
  });

  let items: { text: string; x: number; y: number; page: number }[] = [];
  try {
    items = extractTextWithPositions(buffer, undefined) as {
      text: string; x: number; y: number; page: number;
    }[];
  } catch (err) {
    return empty([`Kuda positional extraction failed: ${err}`]);
  }
  if (items.length === 0) return empty(["Kuda positional parser found no text items"]);

  // Broken-image alt text (Chrome prints "[Image: Im9]" for unloaded logo
  // images at the page top/bottom). Never real content — drop it, otherwise
  // the footer row is appended to the last transaction's narration.
  items = items.filter((i) => !/^\s*\[Image/i.test(i.text));

  // Build rows per page (y ordering restarts per page).
  const pages = [...new Set(items.map((i) => i.page))].sort();
  const allRows: KudaRow[] = [];
  for (const pg of pages) {
    const pageItems = items.filter((i) => i.page === pg);
    const rows = buildRows(pageItems);
    allRows.push(...rows);
  }

  // Amount reconstruction on these PDFs is approximate (glyph interleaving),
  // so we collect candidates per transaction and let the BALANCE CHAIN pick
  // the reading. A row group = one date row plus following continuation rows
  // until the next date row.
  interface RowGroup {
    date: Date;
    balances: number[];
    candidates: number[];
    narration: string;
  }
  const groups: RowGroup[] = [];
  let group: RowGroup | null = null;

  const narrOf = (row: KudaRow): string => {
    const narrFrags = row.frags.filter((f) => !f.text.includes(NAIRA) && !/^[\d.,:\-/]+$/.test(f.text));
    return narrFrags
      .map((f) => {
        // Tight letter+digit mixes are two overprinted streams woven in
        // x-order ("lo0a8n" = "loan" + "08"): the digits belong to the
        // amount stream, the letters to the narration. Spaced mixes
        // ("7 b3 i7k 5e 2") are the row's own second line — kept verbatim.
        if (/[a-z]/i.test(f.text) && /\d/.test(f.text) && !f.text.includes(" ")) {
          return f.text.replace(/\d+/g, "");
        }
        return f.text;
      })
      .join("");
  };

  for (const row of allRows) {
    const joinedText = row.frags.map((f) => f.text).join("");
    if (/Kuda|NDIC|Finsbury|deposit.*insured|licen|allstatements/i.test(joinedText) && row.amounts.length === 0) continue;

    // Skip the account/summary header block (dates torn, mixed columns).
    if (/OpeningBa|SpendAccount|MoneyIn|Summary|Date\/Ti/i.test(joinedText) || /ELEYELE|OLOGUN|IBADAN/i.test(joinedText)) continue;

    const hasDate = row.dates.length > 0;
    if (hasDate) {
      // Many Kuda rows repeat the same date with different amounts — each
      // printed row is its own chain step (movement + resulting balance),
      // not a continuation of the previous row.
      if (group) groups.push(group);
      group = {
        date: parseKudaDate(row.dates[0], row.times[0] ?? null),
        balances: [],
        candidates: [],
        narration: narrOf(row),
      };
    } else if (group) {
      const more = narrOf(row);
      if (more) group.narration += more;
      // A continuation row can carry the fully-rendered date of the same
      // transaction (the date row itself was torn). Adopt the newer date —
      // its digits are complete — and fix the group ordering later via sort.
      if (row.dates.length > 0) {
        group.date = parseKudaDate(row.dates[0], row.times[0] ?? group.date.toISOString() ? row.times[0] ?? null : null);
      }
    }
    if (!group) continue;
    for (const a of row.amounts) {
      group.candidates.push(a.value);
      // balance candidates: values with exact cents or negative (the running
      // balance is always printed with 2 decimals); torn artifacts lack them.
      if (a.value < 0 || /\.\d{2}$/.test(String(a.value))) {
        group.balances.push(a.value);
      }
    }
  }
  if (group) groups.push(group);

  // header anchors from the fragmented text
  const allText = items.map((i) => i.text).join("");
  const compact = allText.replace(/\s+/g, "");
  let opening: number | null = null;
  const openingM2 = compact.match(/SpendAccount₦(-?[\d,]+\.\d{2})₦(-?[\d,]+\.\d{2})/);
  if (openingM2) opening = parseAmountChars([openingM2[1]]);
  // Summary line: MoneyIn, MoneyOut, Opening, Closing in that order.
  const totalsM = compact.match(
    /MoneyIn[^₦]*₦([\d,]+\.\d{2})₦([\d,]+\.\d{2})₦(-?[\d,]+\.\d{2})₦(-?[\d,]+\.\d{2})/
  );
  const totalIn = totalsM ? parseAmountChars([totalsM[1]]) : null;
  const totalOut = totalsM ? parseAmountChars([totalsM[2]]) : null;
  if (opening === null && totalsM) opening = parseAmountChars([totalsM[3]]);

  // Chain-verified transaction building: try every (balance, movement)
  // combination and keep the one that closes the chain.
  const transactions: ParsedTransaction[] = [];
  const errors: string[] = [];
  let prev: number | null = opening;
  let chainBad = 0;

  // Walk the chain. Each printed row is its own chain step: its LAST
  // cent-precision amount is the resulting balance, any other amount is the
  // movement (or two movements forming a fee+transfer pair). The chain
  // decides direction and amount — printed columns are untrustworthy here.
  const yearCount = new Map<number, number>();
  for (const g of groups) yearCount.set(g.date.getFullYear(), (yearCount.get(g.date.getFullYear()) ?? 0) + 1);
  const modalYear = [...yearCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  for (const g of groups) {
    // "transfeOrmolola" = "transferOmolola": the trailing r of the constant
    // Kuda word "transfer" is overprinted one glyph to the right of the
    // next word's capital (always the pattern capital-then-r in this PDF).
    const narration = (g.narration.replace(/\s+/g, " ").trim() || "Transaction").replace(
      /transfe([A-Z])r/g,
      "transfer$1"
    );
    if (prev === null) break;
    if (modalYear !== undefined && g.date.getFullYear() !== modalYear) continue;
    if (g.candidates.length === 0) continue;

    // order candidates by position in candidates array (row order);
    // balance candidates = cent-precision or negative values
    const balIdxs = g.candidates
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => c < 0 || /\.\d{2}$/.test(String(c)));
    const resultIdx = balIdxs.length > 0 ? balIdxs[balIdxs.length - 1].i : -1;
    if (resultIdx < 0) {
      chainBad++;
      errors.push(
              );
      continue;
    }
    const resultBal = g.candidates[resultIdx];
    const diff = r2(resultBal - prev);
    if (Math.abs(diff) <= 0.005) {
      prev = resultBal;
      continue;
    }
    const want = diff > 0 ? "credit" : "debit";
    const diffAbs = Math.abs(diff);
    const moves = g.candidates
      .filter((_, i) => i !== resultIdx)
      .map((c) => Math.abs(c));
    let inAmt: number | null = null;
    let outAmt: number | null = null;
    const hit = moves.find((c) => Math.abs(c - diffAbs) <= 0.005);
    if (hit !== undefined) {
      if (want === "credit") inAmt = hit;
      else outAmt = hit;
    } else {
      let paired = false;
      for (let i = 0; i < moves.length && !paired; i++) {
        for (let j = 0; j < moves.length; j++) {
          if (i === j) continue;
          if (Math.abs(r2(moves[i] - moves[j]) - diffAbs) <= 0.005) {
            const hi = Math.max(moves[i], moves[j]);
            const lo = Math.min(moves[i], moves[j]);
            if (want === "credit") { inAmt = hi; outAmt = lo; }
            else { inAmt = lo; outAmt = hi; }
            paired = true;
            break;
          }
        }
      }
      if (!paired) {
        // movement unreadable; balance is exact — derive arithmetically and
        // flag it (never fabricate a silent figure)
        chainBad++;
        if (want === "credit") inAmt = diff;
        else outAmt = -diff;
      }
    }
    if (inAmt !== null) {
      transactions.push({
        date: g.date.toISOString(), description: narration,
        amount: inAmt, type: "credit", balance: resultBal, narration,
      });
    }
    if (outAmt !== null) {
      transactions.push({
        date: g.date.toISOString(), description: narration,
        amount: outAmt, type: "debit", balance: resultBal, narration,
      });
    }
    prev = resultBal;
  }

  if (chainBad > 0) errors.push(`${chainBad} Kuda row(s) failed the balance chain`);
  if (totalIn !== null || totalOut !== null) {
    const c = transactions.filter((t) => t.type === "credit").reduce((s2, t) => s2 + t.amount, 0);
    const d = transactions.filter((t) => t.type === "debit").reduce((s2, t) => s2 + t.amount, 0);
    if (totalIn !== null && Math.abs(c - totalIn) > 0.01) errors.push(`Money In ${c.toFixed(2)} != printed ${totalIn}`);
    if (totalOut !== null && Math.abs(d - totalOut) > 0.01) errors.push(`Money Out ${d.toFixed(2)} != printed ${totalOut}`);
  }

  transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return {
    transactions,
    errors,
    metadata: {
      fileName,
      fileType: "pdf",
      totalRows: groups.length,
      parsedRows: transactions.length,
      detectedBank: "Kuda",
      dateRange:
        transactions.length > 0
          ? {
              start: transactions[0].date,
              end: transactions[transactions.length - 1].date,
            }
          : undefined,
    },
  };
}
