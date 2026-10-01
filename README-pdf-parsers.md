# PDF Statement Parsing — Markdown-First, Balance-Chain Verified

How CONYEST parses the glued-column PDF statements that Nigerian banks
generate, and why the parser is built the way it is.

## Architecture: markdown first, arithmetic decides

The parser never trusts either of two unreliable sources on its own:

1. **The printed columns** — banks misplace movements. Ecobank prints
   fixed-deposit debits nowhere at all; Fidelity prints credits in the
   Debit column (`NPDC OML 42` rows); Globus tears whole credit cells away.
2. **Text extraction order** — the PDFs draw overlapping tokens, so text
   extraction glues debit+credit+balance into one string.

Instead:

1. `@firecrawl/pdf-inspector` (Rust, napi-rs) converts each page to
   **Markdown with real pipe-tables** — amounts land in separate columns.
2. Wide statements render as **two strip tables per page** (dates+
   description | amounts+balance). A zipper pairs them row-by-row, with a
   DP alignment that maximizes chain-closing adjacencies when counts differ.
3. Every row is re-verified against the **balance chain**
   (prev − debit + credit = balance, to the cent). The printed column is
   only a hypothesis; the sign of the balance change decides direction.
4. Rows that cannot be verified are settled against the printed header
   totals (Total Credit/Debit/Lodgements/Withdrawals) by brute-force over
   per-row interpretation options — never silently accepted.
5. Anything still unresolved is **reported in `result.errors`**, not
   guessed at.

## The core problem (why the legacy parser exists)

Narration reference numbers glue into amount columns (Providus:
`...TRF/...4305,429,235.28` — a phantom 5,429,235,280.00). Coordinate
splitting fails on overlapping tokens. The legacy `parseNigerianStandardRows`
(pdf2json rows + chain solver) remains as a fallback for text PDFs the
markdown engine cannot handle.

## Bank-specific quirks (8 real statements)

| Bank | Quirks | Result |
|---|---|---|
| **Ecobank** | 5-page layout where pages tear into 3 strips (D/C table, dates+description table, bare balance list); first row garbled in the PDF itself — resolved as a forced zero-net 125.09 pair (presented-and-returned cheque) against printed totals | 223 tx, all anchors PASS |
| **Fidelity** | Balances tear mid-number onto the next row (`...947.1` + `1`); credits printed in Debit column; 10 pages of strips | 455 tx, closing PASS, chain closes |
| **First Bank** | Entire table collapses into one prose paragraph; account number interleaves every record; dates glue to narration refs | 6 tx, all anchors PASS |
| **Globus** | Credit column cells tear away entirely (dropped credits); trailing numeric paragraph holds the real lodgements | 18 tx, all anchors PASS |
| **Providus** | 107 pages, 106 strip pairs, 4,483 rows; narration continuation lines; dateless stamp-duty rows | 3,963 tx, closing PASS |
| **Wema** | Fee+salary in one printed row; header cells tear into the first table | 85 tx, all anchors PASS |
| **Zenith** | Cleanest layout; credit-list + balance-list paragraphs interleave with the table | 50 tx, all anchors PASS |
| **Kuda** | Text shattered to **single glyphs** with overlapping baselines; narration letters interleave digit-by-digit (`4,340.lo0a8n`); minus signs tear anywhere (`o-l2a3da,1y8o5.20`); two text streams overprinted at the *identical* baseline get merged in x-order; Chrome-printed `[Image: ImN]` alt-text rows at page top/bottom; each printed row is its own chain step | `kuda-positional-parser.ts`: glyph de-interleaving + chain walk; `[Image:…]` and `AllStatements` furniture rows dropped; tight letter+digit mixes de-woven in narrations; `transfeXr` → `transferX` repair; closing balance exact; residual Money In/Out mismatch (2 rows illegible in the PDF) reported, not fabricated |

## Safety nets

- `parsePDF` retries transient pdf2json XRef failures (First Bank's PDF
  fails intermittently on a cold parse) and enforces a 90 s timeout so
  uploads never wedge.
- `src/lib/parsers/index.ts` never lets the Gemini AI fallback "improve" a
  balance-chain-verified statement — the AI once replaced 6 exact interest
  credits with 471-million phantom debits.
- Upload route date range widened to 15 years (Ecobank's archive statements).

## Merchant + categorisation pipeline

Correct narrations flow downstream into the existing extraction stack, in
order:

1. `lib/parser/merchant-extractor.ts` — rule-based exact-merchant extraction
   (prefixes like `TRF TO`, slash patterns `NAME/ACCOUNT/BANK`, Paystack/
   Interswitch/Flutterwave markers).
2. `lib/counterparty-matcher/index.ts` — counterparty profiles, fuzzy
   matching and dedupe across uploads.
3. `lib/normalizer/index.ts` — ~200-key Nigerian merchant DB (supermarkets,
   food, transport, utilities…) with category guesses.
4. `lib/ai/index.ts` (Gemini, optional via `GEMINI_API_KEY`) — only
   classifies; `parseStatement`'s AI-fallback guard ensures it can never
   rewrite a balance-chain-verified transaction set.

Because every transaction now carries the bank's own printed narration
(intact, not truncated by glued-amount parsing), merchant extraction and
categorisation receive dramatically cleaner input than before.

## Verification

```bash
npm run verify:all    # all 8 statements through parseStatement vs every printed anchor
npm run verify:pdfs   # legacy raw-row parser, check sums + closing balances
npm run e2e:pdfs      # full pipeline through parseStatement (routing, AI guard)
npx tsx scripts/dump-markdown.ts "Bank Name"   # inspect firecrawl markdown
```

All scripts read the PDFs in `C:\Users\User\Desktop\bank statement` and
print PASS/FAIL per bank against the statements' own printed header totals.
`verify:all` also walks the balance chain across the emitted transactions
and reports any break.

Latest full-suite result: 7 of 8 statements match every printed anchor
exactly; Kuda matches its printed closing balance (−37,049.58) and reports
its two unreadable (garbled-in-the-PDF) figures as errors instead of
inventing figures for them.
