# CONYEST (bank-analyzer) — Interview Case Study Pack

> Prepared for Data Analyst / Data Engineer interview answers.
> All numbers below are **measured from the repo**, not estimates. Cite them freely.

---

## 1. THE ELEVATOR PITCH (pick by time budget)

### 30 seconds
"I built CONYEST, a financial analytics platform for Nigerian bank data. You upload a statement from any of 18+ Nigerian banks — CSV, Excel, or PDF — and it parses it, normalizes it, classifies every transaction with a confidence score, and gives you cash-flow, category, merchant, and recurring-commitment analytics. It's full-stack: Next.js + Postgres + Prisma, with Gemini used only where rules aren't reliable. I shipped it solo in 12 days across 226 commits."

### 60 seconds (adds the hard part)
"...The hard problem was ingestion. There's no public spec for Nigerian bank statement formats — 11 banks have 25 distinct layouts, PDFs come out character-by-spaced-character, and some are scanned images. So I built a layered pipeline: bank format detection, positional PDF parsing with coordinate heuristics, a normalizer, a 6-stage merchant extractor, and an 8-stage classification cascade. When heuristic parser yield drops below 50%, a Gemini Vision OCR fallback takes over. De-duplication is 4-layered — file hash, transaction composite key, AI-output key, and a DB unique index."

### 2 minutes (the version for a technical panel)
Structure it as **problem → constraints → decisions → results → trade-offs**:
1. **Problem**: Nigerians juggle 4–6 bank accounts; data is siloed in incompatible statement formats; generic finance apps (Mint, YNAB) don't parse Nigerian layouts or understand NGN semantics (EMTL, stamp duty, agent-banking POS fees).
2. **Constraints**: solo build; no statement spec; unstructured PDFs; must be cheap to run (no per-row LLM calls); multi-tenant data privacy.
3. **Decisions**: deterministic-first architecture — rules do 100% of categorization, LLM does text normalization + OCR fallback only. Confidence-scored output at every stage so the UI can show trust.
4. **Results**: 18.6k LOC across 103 TS/TSX files, 35 API routes, 18 dashboard pages, 16 Prisma models, 9 indexes on the transaction table, 179k insertions over 226 commits.
5. **Trade-offs** (say these out loud — interviewers love it): analytics aggregation is in-memory rather than SQL; counterparty grouping is O(N²); no test framework yet. I'll cover what I'd change first.

---

## 2. STAR ANSWER — "Tell me about a time you showed high agency"

**Situation**
"I wanted to prove I could take a messy, real-world data problem from zero to a working product without anyone specifying requirements. Nigerian bank statements are the perfect example: no documentation, 11 different PDF layouts, character-level spacing bugs, scanned documents."

**Task**
"Own the entire thing end-to-end — data model, ingestion pipeline, classification logic, analytics API, and UI. No PM, no specs, no one to unblock me."

**Action** (this is where agency shows — enumerate *decisions you made unasked*)
- **Chose the architecture myself**: deterministic parsers first, LLM as fallback — because LLM-per-row would cost money and be non-deterministic.
- **Reverse-engineered formats**: wrote a PDF inspector dev harness (`/api/test-pdf-inspector`, 290 lines) to visually dump token coordinates, then tuned Y-grouping tolerance (0.55) and merge gap (0.85) against real statements.
- **Built a fallback ladder** instead of giving up on hard files: coordinate parser → markdown/text parser → Gemini Vision OCR. Trigger is measurable: row yield < 50%.
- **Instrumented quality**: every classified transaction carries `confidence` + `source` (override/rule/context/keyword/merchant/pattern/none) so nothing is a black box.
- **Moved fast with discipline**: 226 commits over 12 days, 55 on day one, with descriptive messages (`fix Kuda parser: add mergeCloseTexts, fix skip patterns, increase gap threshold`) — evidence of tight feedback loops.
- **Wrote my own test fixtures** when no framework existed: 4 scratch harnesses covering parser output, merchant extraction, and 9 Nigerian classification cases.

**Result**
"A working multi-tenant app: 35 API endpoints, 18 pages, 18.6k lines. Handles 18+ banks, 4 file formats, self-transfer detection, recurring-pattern detection with statistical confidence, and multi-period analytics. Deployed on Vercel with Neon Postgres. And I can talk in detail about 12 specific limitations I already know and would prioritise next."

**What I'd do differently**
"I'd push aggregation into SQL, add Vitest around the parsers (they're pure functions and trivially testable), and wire the Nigerian context rules into the production call path — right now they're built and verified but the callers don't pass the user identity object, so step 3 of the cascade is skipped. That's a real bug I found while prepping."

> ⚠️ That last sentence is a **huge** credibility signal. Knowing your own bug beats pretending you have none.

---

## 3. VERIFIED METRICS CHEAT SHEET

### Scale & velocity
| Metric | Value |
|---|---|
| Commits | **226** (single author) |
| Build window | **2026-07-26 → 2026-08-06 = 12 calendar days, 10 active days** |
| Commit/day peak | **55 (day 1)**, then 30, 27, 38, 31, 19, 12, 2, 10, 2 |
| Source files | **103** `.ts`/`.tsx` under `src/` |
| Source LOC | **18,640** |
| Total insertions (excl. lockfile) | **179,720** |
| Tracked files | **487** |
| API routes | **35** |
| Dashboard pages | **18** |
| UI components | **15** |
| Prisma models | **16** |
| Indexes on `Transaction` | **9** |

### Largest modules (LOC) — use to show you know where the complexity lives
```
dashboard/transactions/page.tsx   1203
lib/parsers/pdf-parser.ts         1099   ← the hard problem
dashboard/page.tsx                 875
dashboard/analytics/page.tsx       802
dashboard/calendar/page.tsx        769
dashboard/upload/page.tsx          744
dashboard/settings/rules/page.tsx  652
lib/normalizer/index.ts            612
lib/counterparty-matcher/index.ts  539
lib/classifier/index.ts            465
lib/parsers/kuda-pdf-parser.ts     447
lib/parsers/excel-parser.ts        413
lib/ai/index.ts                    388
lib/parsers/ai-parser.ts           362
api/statements/upload/route.ts     357
lib/parsers/csv-parser.ts          356
lib/parser/merchant-extractor.ts   338
prisma/schema.prisma               319
```

### Domain coverage
| Metric | Value |
|---|---|
| Bank formats handled | **25 formats / 11 banks** + 3 generic parsers |
| Institutions recognized by name | **~27** |
| Bank logos shipped | **17** SVGs |
| Dedicated coordinate PDF parsers | Kuda, GTBank, UBA, Sterling, PalmPay, OPay, Access, Moniepoint, First Bank, Zenith |
| Seeded category tree | **218** categories (seed.ts), **423** rows in seed-full.sql (24 roots + 399 children), max depth 3 |
| Merchant dictionary | **~130** entries across ~14 verticals |
| Keyword pattern groups | **20** |
| Statutory/context rules | **9** statutory + **3** savings + **5** POS amount bands |
| POS amount fingerprints | **31** exact values |

---

## 4. THE INGESTION PIPELINE — your signature technical story

Use this for: *"walk me through the hardest technical problem"* / *"how would you ingest messy files"* / data-engineering screens.

### Stage-by-stage (name files; interviewers love file:line precision)

**Stage 0 — Client** `src/app/dashboard/upload/page.tsx`
Accepts `.csv/.xlsx/.xls/.pdf`, `FormData` POST to `/api/statements/upload`. (Honest note: the progress bar is a cosmetic animator — 4 fake steps with `800 + random(600)`ms delays — I'd replace it with real server-sent stage events.)

**Stage 1 — API gateway** `src/app/api/statements/upload/route.ts` (357 lines)
1. Session auth → 401
2. 50 MB size gate → 413
3. **SHA-256 file hash** → dedup against `UploadLog` → 409 `duplicate`
4. `parseStatement()` dispatch
5. Empty result → 400 `No transactions found` + first 10 parser errors
6. **Date-range sanity**: transactions must be within 5 years past / 1 year future → 400 `invalid_date_range`
7. `findOrCreateBank()` keyed on `userId + bankName + accountNumber`
8. **Content-overlap dedup**: build key `ref_<reference>` or `composite_<YYYY-MM-DD>_<amount>_<desc[0..50]>`, diff against existing statements in the same date range → 409 `duplicate` or `partial_overlap` with options `merge|replace|cancel`
9. **AI narration cleanup** in batches of 50 (inner batch 20)
10. `normalizeTransactions()` → `classifyBatch()` → `groupSimilarTransactions()`
11. `statement.create` → `transaction.createMany({ skipDuplicates: true })` → `uploadLog.create`
12. Returns summary: credits/debits/net, date range, classified count, counterparty groups

**Stage 2 — Format dispatch** `src/lib/parsers/index.ts` (122 lines)
Extension → `parseCSV` / `parseExcel` / `parsePDF`, else structured "unsupported file type".

**Stage 3 — Bank format detection**
- CSV/Excel: `BANK_DETECTION_PATTERNS` matches against `(headers + first row).toLowerCase()`.
- **Header row discovery**: scan first **25 rows**, accept the first row containing **≥2** of 16 header keywords. This is what makes it robust to statements that start with a bank logo / 10 lines of preamble.
- PDF: ordered regex list over extracted text (`gtbank|gtco|guaranty trust → gtbank-pdf`, `sterling|onebank`, `access bank`, `uba`, `opay|owealth|paycom`, `kuda`, `moniepoint`, `first bank`, `zenith`, `palmpay`, else `generic-pdf`).

**Stage 4 — Parsing** (the meat)
- **CSV** (356 lines): day-first date parsing `D/M/YYYY`, `DD Mon YYYY`, `DD/MM/YY → 2000+yy`; amount scrub `[^\d.,\-]` → strip commas → `Math.abs(parseFloat)`; debit/credit from column, sign, or keyword `detectType`.
- **Excel** (413 lines): handles Excel **serial dates** (`1900-01-01 + (n-1)*86400000`), a **headerless OPay heuristic** (≥6 sample rows, column hardcode date=0/desc=2/debit=3/credit=4/balance=5/ref=7), plus `sheet_to_csv` last-resort.
- **PDF** (1099 lines): `pdf2json` → tokens `{x, y, text}` → `groupPageTokensByY(page, yTolerance = 0.55)` → `mergeCloseTexts(maxGap = 0.85)` → `extractTableRows` → per-bank row parsers. PalmPay gets a format sniff (`isPalmPayFormat` scans first 40 rows).

**Stage 5 — AI fallback** `src/lib/parsers/index.ts:60-104`
```
isKuda           = detectedBank includes "kuda"
isLowConfidence  = rows == 0 OR (transactions / totalRows) < 0.5
if ((isLowConfidence || isKuda) && GEMINI_API_KEY) → Gemini path
```
- PDF → `parsePdfWithGeminiVision` (whole file base64 inlined, `responseMimeType: application/json`)
- Non-PDF → raw text chunked at **25,000 chars**, sequential
- **Model fallback loop**: `GEMINI_MODEL` env → `gemini-2.0-flash` → `gemini-1.5-flash` → `gemini-2.0-flash-lite` → `gemini-1.5-pro` → `gemini-2.5-flash`; throws only after all fail
- **Adoption rule**: use AI result only if `transactions.length` is **strictly greater** than heuristic result. The better parser wins — no blind trust.
- Anti-hallucination prompt contract: "Do NOT generate, fabricate, or guess"; rows with invalid dates (outside 2000–2030), <2-char descriptions, or missing amounts are dropped; output dedup key `date_amount_type_desc[0..30]`.

**Stage 6 — Normalization** `src/lib/normalizer/index.ts` (612 lines)
- `cleanDescription`: strips 6+ digit reference numbers, `REF|NARR|TRANSACTION|CHANNEL` labels, keeps only `[^\w\s\-\/]`
- `extractMerchant`: ordered heuristics — pipe transfers, Kuda hyphen suffix, `Transfer to/from`, `Send to`, `Received from`, pipe non-transfer, PalmPay service regexes
- Strips **33 noise words** + **42 Nigerian location keywords** (Lagos, Abuja, Lekki, Ikeja, VI, Surulere…)
- `fuzzyMatch` against merchant DB: substring OR **≥70% keyword-word coverage**
- 15-branch `guessCategory` cascade

**Stage 7 — Merchant extraction** `src/lib/parser/merchant-extractor.ts` (338 lines) — **6 stages**
1. Brand charge detection (27 brands, gated on `/charge|fee|vat|stamp|sms/`)
2. Utility/system interception (data, airtime, electricity, stamp duty, EMTL, USSD, savings interest)
3. Slash-format `NAME/ACCOUNT/BANK` splitting (phone `^\d{7,14}$`, bank keyword list)
4. **6 grammar regexes** for `X - Inward Transfer`, `Transfer to X VIA…`, `POS/WEB PURCHASE…-X`, etc.
5. **Legal-suffix entity anchors** — 26 suffixes (`LTD, PLC, VENTURES, SUPERMARKET, PHARMACY, LOGISTICS, TECHNOLOGIES…`); take 2 words before the suffix
6. Pipe/slash structurization → `{institution, accountOrPhone, memo, channelTag}` where `channelTag ∈ POS_AGENT | DIRECT_TRANSFER | UTILITY | SYSTEM_CHARGE | GATEWAY`
- Title-casing with a **32-acronym whitelist** (GTB, UBA, MTN, POS, EMTL, CBN, DISCO codes…) so acronyms don't get mangled.

### Four-layer duplicate prevention (great "idempotency" answer)
| Layer | Mechanism |
|---|---|
| 1. Byte identity | SHA-256 file hash vs `UploadLog` → 409 |
| 2. Content overlap | Composite key `ref_…` / `date+amount+desc[0..50]` diffed against overlapping statements → 409 with `merge/replace/cancel` |
| 3. AI output | Key `date_amount_type_desc[0..30]` inside the parser |
| 4. Database | `createMany({skipDuplicates:true})` + composite index `@@index([bankId, amount, date, description(100)])` |

### Self-correcting logic (great "domain knowledge" answer)
`validateBalanceConsistency` in both CSV and Excel parsers: if running-balance deltas imply the debit/credit labels are swapped and the swapped total is within **< ₦1** of the actual balance, flip them. Requires ≥3 transactions with balances present. This catches banks that export amount-only columns.

### Sanity guards (data-quality answer)
- Reject amounts `> ₦50,000,000`; GTBank parser zeroes amounts `> ₦1,000,000,000` (balance leaking into amount column)
- Reject 10+ digit reference codes with no decimal
- UBA blacklists `OPENING/CLOSING BALANCE`, marketing lines, `ACCOUNT STATEMENT`
- GTBank multi-line block aggregation (rows ≤2 cells merge; ≥5 cells start new block)
- Drop rows with invalid dates, <2 char descriptions, zero amounts — each logged as a structured parser error, first 10 surfaced to the user

### Interview one-liner
"I treated parsing as a **recall problem with a measurable confidence signal**: heuristics run first, and if row-yield drops below 50% I escalate to a vision model. The system is never silently wrong — it either produces rows or it tells you which 10 rows failed and why."

---

## 5. CLASSIFICATION ENGINE — your "machine learning without ML" answer

Use for: *"how would you categorize transactions"* / *"rules vs ML"* / *"how do you handle cold start"*.

### 8-stage cascade, first non-null wins
| # | Stage | Confidence | Source |
|---|---|---|---|
| 1 | Manual override (keyed on `normalizedKey`) | 0.95 | `override` |
| 2 | User's DB rules (`contains`/`equals`/`regex`, priority DESC) | 0.90 | `rule` |
| 3 | Nigerian context rules | 0.88–1.00 | `context` |
| 4 | Built-in keyword patterns (20 groups) | 0.60–0.95 | `keyword` |
| 5 | Existing merchant lookup + fuzzy | 0.60–0.95 | `merchant` |
| 6 | Create new merchant from guess | 0.70 | `merchant` |
| 7 | Normalizer pattern guess | 0.50 | `pattern` |
| 8 | Fallback → `Others` | 0.00 | `none` |

**Everything is cache-first**: one `Promise.all` of 5 queries builds override maps, rules, merchants, categories, and a `groupBy(merchantId, categoryId)` majority-vote map. Zero N+1.

### Why this design (say it explicitly)
- **Rules are auditable and cheap.** A user can see *why* something was categorized and override it.
- **Confidence is exposed to the UI**, so low-confidence rows can be flagged for review instead of being wrong silently.
- **Direction-aware guard**: 11 `SPENDING_CATEGORIES` are skipped on credit transactions so refunds/reversals don't get categorized as spending. `Income`/`Savings`/`Family` deliberately excluded.

### Nigerian domain rules (differentiator)
- **POS cash withdrawal**: requires *all three* — debit, amount in a **31-value fingerprint set** (₦5,050/5,100/10,150/20,300/50,500/100,500 … these are principal + agent fee), and a POS keyword (`MONIEPOINT`, `GBENGA POS`, `AGENT`, `MFB`, `9PSB`, `POCKETAPP`…). Confidence 0.88. This encodes real-world knowledge no generic classifier has.
- **Statutory fees** with graded confidence: Stamp Duty 1.0, EMTL 1.0, SMS alert 0.98, VAT/account maintenance/ledger fee/overdraft interest 0.95, commission 0.90.
- **Savings yield**: OWealth/Cashbox interest 1.0, auto-save 0.95.
- **Family transfer**: surname ≥3 chars present in description but full name absent → `Family` @ 0.92.
- **Self-transfer**: full name contained → 1.0; first+last token overlap → 0.98.

### The active-learning loop (great "product + data" answer)
One user edit on `PUT /api/transactions/[id]` triggers three writes:
1. Upsert `ManualOverride` keyed on `normalizedKey` (stable: lowercased, non-alphanumerics → `_`)
2. Auto-create a `ClassificationRule` (`type:"contains"`, sanitized pattern min length 3, `priority = max + 1`)
3. **Backfill**: bulk-update every other uncategorized transaction whose description contains that counterparty (targets `categoryId IS NULL OR category = 'Others'`), returning `updatedSimilarCount`

So each correction teaches the system permanently — human-in-the-loop without a training pipeline.

### AI's actual role (be precise; interviewers probe this)
- **Rules own categorization.** `classifyBatch` never calls Gemini.
- **AI owns text normalization**: ingest-time narration → merchant cleaning (batch 50 / inner 20), with a guard that refuses to overwrite a real person/business name with a generic bank name (`opay|palmpay|gtb|access bank|zenith bank|kuda bank|moniepoint`).
- **AI validates recurring candidates** (batch 8) with an explicitly conservative prompt: *"When in doubt about transfers to people, mark as NOT truly recurring."*
- **AI writes the narrative report** (Gemini, JSON-only, 7 sections: overview/strengths/concerns/recommendations/savingsOpportunities/spendingPattern/nextSteps), with graceful degradation to data-only if the call fails.

**Sound bite**: *"Deterministic where it must be auditable, generative where nuance lives. And the LLM is behind a `>`-comparison, not a `trust-me`."*

---

## 6. ANALYTICS & RECURRING DETECTION — data analyst territory

### Aggregations available (`GET /api/analytics`, 216 lines)
`summary` (currentBalance, totalIncome, totalExpenses, netCashFlow, **savingsRate**, averageDailySpend, biggestExpense), `categoryBreakdown`, `merchantRanking` (top 20), `bankComparison`, `dailySpending`, `dailyCredits`, `weeklySpending`, `monthlyChart`, **`intensity`** (day-of-week × hour heatmap), `transactionCount`, `daysInPeriod`.

Periods: monthly / quarterly / yearly / all-time. Daily & weekly granularity are *inside* a period (that's a design decision worth defending: "weekly" as a top-level period is meaningless without a date anchor").

### Other endpoints
- `/api/analytics/breakdown?groupBy=merchant|category|subcategory` — includes per-month series per group
- `/api/analytics/drilldown?type=category|merchant&name=…` — row-level drill-through
- `/api/report` — SQL `groupBy` for category/merchant/income + AI narrative + budget health + recurring
- `/api/merchants/summary`, `/api/merchants/[id]/analytics`
- `/api/transactions/counterparties`, `/api/transactions/similar`

### Recurring detection — statistical, not rule-of-thumb
Group key: `merchantId + type`. Look-back **6 months**. All gates must pass:

| Gate | Threshold |
|---|---|
| Min transactions per group | **≥ 3** |
| Amount spread `(max−min)/mean` | **≤ 25%** |
| Gap regularity `CV = σ(gaps)/mean(gaps)` | **≤ 0.40** |
| Trend (OLS slope) | `< 3%` ⇒ label `stable` |

**Cadence windows** (mean gap in days): daily 0.5–1.5 · weekly 5–9 · biweekly 12–16 · monthly 25–35 · quarterly 80–100 · yearly 350–380. Anything outside → rejected, not guessed.

**Confidence formula**: `min(0.95, 0.5 + 0.05·n + 0.3·(1 − CV_amount))`

**Annualizers**: 365/52/26/12/4/1 → `annualCost` (this is the number that makes rent vs. Netflix comparable).

**AI validation pass** filters false positives (random POS, ATM, one-off purchases, person-to-person transfers) and enriches with category/tag/insight. Fallback if no API key: pass-through as `isTrulyRecurring: true`.

### Counterparty resolution — hybrid fuzzy matching
```
score = max( tokenScore, levenshteinScore × 0.8 )   ← Lev deliberately discounted
tokenScore = (exactMatches + 0.7 × partialMatches) / max(|w1|,|w2|)
```
Matching tiers: exact account **1.0** · name sim = 1.0 → **0.95** · sim ≥ **0.85** → that value · shared "key identifier" (first+last, corporate fillers like `ltd|limited|ventures|nigeria|services` stripped) → **0.75**.
Grouping threshold: **≥ 0.80**, or equal last-4 account digits + same known bank, or identical first+last token.
Account masking rules: full digits shown only if **≥8 digits and no `*`**; otherwise last-4 only. *(Good privacy detail to mention.)*

### SQL vs in-memory — know this cold, you'll be asked
- **Pushed to SQL**: `/api/report` and `/api/merchants/summary` use Prisma `groupBy`/`aggregate` with `_sum`, `_count`, `orderBy`.
- **In-memory**: `/api/analytics` and `/breakdown` do one indexed `findMany` then JS `Map`/`reduce`.
- **Indexes**: 9 on `Transaction` — `date`, `bankId`, `merchantId`, `categoryId`, `type`, `channelTag`, `institution`, `[bankId, reference]`, composite `[bankId, amount, date, description(100)]`.

**Say this if asked about scale**:
"At the scale this app targets — one user, a few thousand to low-hundreds-of-thousands of rows per period — one indexed read plus JS reduce is *faster* than a round-trip per aggregation, and it keeps the logic in one typed place. The moment you need cross-user dashboards or 10M+ rows, you move to materialized views: `SUM ... GROUP BY` in Postgres, or a nightly rollup table per (user, day, category). I'd benchmark with `EXPLAIN ANALYZE` before migrating, and I'd fix `bankComparison` first — it currently re-filters the array once per bank, which is O(banks × rows)."

**Complexity you should be able to name**:
- analytics: O(N) per aggregation
- `bankComparison`: O(B × N)
- counterparty grouping: O(N²) with an O(L²) Levenshtein inside → the first thing I'd optimize (blocking by normalized key / n-gram index, or pg_trgm `similarity()`)

---

## 7. DATA MODEL — for SQL / modeling questions

16 models. The ones that matter:

```
User ─1:N─ Bank ─1:N─ Statement ─1:N─ Transaction
  │           │  (@@unique userId+bankName+accountNumber)
  │           └─ openingBalance, currency "NGN"
  ├─1:N─ Category (self-relation parentId → 3-level tree, isSystem, slug/icon/color/sortOrder)
  ├─1:N─ Merchant (normalizedName @unique, displayName)
  ├─1:N─ ClassificationRule (type contains|equals|regex, pattern, priority, isActive)
  ├─1:N─ ManualOverride (@@unique userId+description, @@index userId+normalizedKey)
  ├─1:N─ Budget (@@unique userId+categoryId+month+year)
  ├─1:N─ Goal (targetAmount, currentAmount, deadline, isCompleted)
  └─ auth: Session, Account, Verification

Transaction: date, description, normalizedDescription, memo, institution,
             accountOrPhone, channelTag, amount, type, balance, reference, narration,
             isTransfer, isSelfTransfer, isRecurring, notes, tags, merchantId?, categoryId?
UploadLog: fileHash (sha256), @@unique(bankId, fileHash)
StagedTransaction: import review queue — pending|accepted|rejected|edited
RecurringTransaction: frequency, avgAmount, nextExpectedDate
```

**Modeling points to make:**
- **Category as a self-referencing tree** gives you rollup (parent) and drill-down (child) from one table — analytics can group at either level, which is exactly what `breakdown?groupBy=category|subcategory` does.
- **`normalizedName` unique on Merchant** is the join key for fuzzy results — normalization happens once at write, not on every read.
- **`UploadLog.fileHash`** is a natural idempotency key; `@@unique(bankId, fileHash)` makes the DB the last line of defense.
- **Composite index `(bankId, amount, date, description(100))`** exists specifically to make the overlap-dedup lookup index-only.
- **Partial/functional concerns to raise**: `Statement @@unique(bankId, month, year)` enforces one statement per bank-month (good), but statements with overlapping date ranges across months rely on application-level dedup.
- **Cascade deletes**: `User → Bank → Statement → Transaction` — clean tenant isolation for `clear-data`/`clear-statements` endpoints.

**Schema size**: 319 lines, 16 models, 9 transaction indexes, cascade rules on 4 relations.

**Seed**: `prisma/seed.ts` = 218 system categories, 18–22 roots, 40 with children, depth 3. `seed-full.sql` = 423 rows (its own header comment says 293 — stale, and I noticed; measured 423).

---

## 8. KNOWN LIMITATIONS → "what would you improve?"

**Lead with these. Having 3–4 ready is better than claiming perfection.**

| # | Limitation | Fix I'd ship | Priority |
|---|---|---|---|
| 1 | **Nigerian context rules are skipped in production** — `classifyBatch` is called with 2 args at all 3 call sites, so the optional `user` param is `undefined` and step 3 never runs. The rules themselves are verified and work in the test harness. | Pass `UserIdentity` at `upload:272`, `reprocess:50`, `reclassify:61` + a regression test | **Critical (it's a bug, not a design)** |
| 2 | **Analytics computed in Node, not SQL** | Move to `SUM/GROUP BY` + a nightly rollup table once rows > ~1M; fix `bankComparison` O(B·N) today | High at scale |
| 3 | **Counterparty grouping is O(N²)** with O(L²) Levenshtein | Blocking via normalized-key bucket or `pg_trgm` GIN index | High at scale |
| 4 | **No test framework** — only 4 ad-hoc `tmp_test_*` scripts | Vitest over parsers (pure functions, trivially fixture-testable), golden-file tests per bank format | High |
| 5 | **Every Kuda PDF is sent to Gemini** even when heuristics succeed | Only escalate when yield < threshold; add per-bank override + cache | Cost/latency |
| 6 | **`isSelfTransfer` not persisted at upload** — analytics filters on it but it's only settable via `PUT /api/transactions/[id]` | Persist during ingest | Correctness |
| 7 | **`/api/report` doesn't filter `isSelfTransfer`** while analytics/breakdown/drilldown do → inconsistent totals | Unify the filter | Correctness |
| 8 | **Two `averageDailySpend` definitions** — analytics uses calendar days, report uses active days | Pick one, name it | Metric hygiene |
| 9 | Dead code: `kuda-parser.ts`, `constants/patterns.ts`, `transfer-detector`, unused `POST /api/ai/classify` | Delete or wire up | Cleanup |
| 10 | Fake upload progress bar (client-side animation) | SSE/websocket stage events from the 6 real stages | UX honesty |
| 11 | `RecurringTransaction` model is never written — detector returns in-memory only | Persist with `isActive`/`nextExpectedDate` for cron sweeps | Feature completion |
| 12 | `sterling-pdf` missing from `BANK_FORMAT_TO_NAME` → `detectedBank` undefined for Sterling PDFs | One-line map entry | Trivial |

**Also**: no `prisma/migrations` directory exists (schema managed via `db push`), and `seed-full.sql` isn't wired to any npm script.

---

## 9. LIKELY QUESTIONS + ANSWERS

### Q: "Tell me about this project."
→ §1 60-second pitch, then pause. Let them pick the thread.

### Q: "What was the hardest part?"
→ **PDF parsing.** "No spec, 11 layouts, character-level spacing (`0 2 /0 2 /2 6` → `02/02/26`), scanned images. I built a coordinate inspector harness first, then tuned Y-tolerance 0.55 and merge-gap 0.85 against real files, then built a 3-tier fallback ending in vision OCR. The key insight: I made failure *measurable* (row-yield ratio) instead of guessing."

### Q: "Rules or ML?"
→ "Rules first, because I need auditability and users can override. My cascade returns `confidence` + `source` on every row, so the UI can surface 'review this'. I use a vision LLM for OCR (where rules genuinely can't work) and for narrating reports. Each user edit auto-generates a rule and backfills similar rows — that's my active-learning loop, without a training pipeline."

### Q: "How would you categorize 10M transactions?"
→ "Offline, not at request time. Batch the classification with a warm cache (I already build one `Promise.all` of 5 queries — zero N+1), push aggregates to Postgres with `GROUP BY`, and materialize daily rollups. I'd partition on `date` and add a covering index `(bankId, date, categoryId) INCLUDE (amount)`. My current in-memory reduce is fine for one user's period but wouldn't survive that."

### Q: "Write a SQL query: top 5 spending categories last month."
```sql
SELECT c.name, SUM(t.amount) AS spend, COUNT(*) AS n
FROM "Transaction" t
JOIN "Category" c ON c.id = t."categoryId"
WHERE t.type = 'debit'
  AND t."isSelfTransfer" = false
  AND t.date >= date_trunc('month', CURRENT_DATE - interval '1 month')
  AND t.date <  date_trunc('month', CURRENT_DATE)
GROUP BY c.name
ORDER BY spend DESC
LIMIT 5;
```
Follow-ups to expect: *what index?* → `(type, date)` or composite `(bankId, date, categoryId)`; *what if uncategorized?* → `LEFT JOIN` + `COALESCE(c.name, 'Uncategorized')`; *percent share?* → window function `SUM() OVER ()`.

### Q: "How do you detect recurring payments?"
→ "Group by merchant+type over 6 months; require ≥3 txs, amount spread ≤25% of mean, gap coefficient of variation ≤0.4; classify cadence by mean-gap windows (0.5–1.5d daily, 25–35d monthly, …); confidence = `min(0.95, 0.5 + 0.05n + 0.3(1−CV_amount))`; annualize with 365/52/26/12/4/1; then an LLM pass filters false positives (person transfers, random POS). Fail closed — no API key means pass-through with a flag, never silent wrong data."

### Q: "How do you handle data quality?"
→ Layered: 4 dedup layers (SHA-256 → composite key → AI key → DB unique index); date-range sanity (5y back / 1y forward); amount sanity (>₦50M rejected, 10+ digit ref codes rejected); balance-consistency auto-fix (flip debit/credit if within ₦1); structured per-row errors with first 10 surfaced; `skipDuplicates` on `createMany`; every stage returns `errors[]` rather than throwing.

### Q: "How do you handle duplicates in a pipeline?"
→ Idempotency at four levels — content hash for files, composite business key for rows, output key for the LLM, unique index as the backstop. Plus `UploadLog @@unique(bankId, fileHash)` so the DB enforces it even if app logic is bypassed.

### Q: "How would you make it production-ready?"
→ Vitest + golden fixtures per bank; CI (typecheck + lint + tests); push aggregations to SQL; wire the context rules; rate-limit + cache Gemini calls; `prisma migrate` instead of `db push`; SSE upload progress; E2E on one real statement per bank; observability on parse yield per format (alert if a bank's yield drops after they change their template).

### Q: "Why Postgres/Prisma/Next.js?"
→ Postgres for real transactions + JSON flexibility + `pg_trgm` when I need fuzzy search in SQL. Prisma for type-safe queries end-to-end (TS types flow from schema to UI). Next.js App Router because API routes and UI colocate, and the whole thing deploys to one Vercel project. Driver adapter `@prisma/adapter-pg` for serverless connection handling on Neon.

### Q: "Behavioral: disagreement / ambiguity / failure?"
- **Ambiguity**: no statement format spec existed → I built a visual PDF inspector harness to *observe* the data before writing parsers. Don't wait for documentation that doesn't exist.
- **Failure**: my first Kuda parser produced garbage because pdf2json emits character-level spacing → I wrote `unspaceText` with date/currency-specific repair regexes and a threshold (if >35% of tokens are single-char, apply character-level cleanup).
- **Speed vs quality**: 226 commits in 12 days — small, message-documented commits so I could revert surgically (`revert to positions reconstruction with better gap detection` is a real commit; I tried 3 approaches and kept the winner).

### Q: "What does high agency mean to you?"
→ "Deciding what to build when nobody tells you. I chose the Nigerian-market niche myself, defined the scope, picked the LLM-vs-rules boundary myself, found my own bug, and wrote my own acceptance fixtures. Agency is having a bias for shipping *and* a bias for knowing what's wrong with what you shipped."

### Q: "Data analyst vs engineer — which are you?"
→ "The project needed both. The analyst side: designing the confidence-scored taxonomy, savings rate / annualized recurring cost / intensity heatmap, multi-period drill-down. The engineer side: the ingestion pipeline, idempotency, indexing, and a cache that eliminates N+1. I like the loop where the analysis reveals a data problem and the engineering fixes it."

---

## 10. IMPRESSIVE SPECIFICS (drop these to sound like you actually built it)

- "PDF tokens are grouped into lines with a **0.55 y-tolerance** and merged with a **0.85 gap threshold** because Kuda exports text character-by-character."
- "The Kuda column boundaries default to x = **11 / 18 / 25 / 42 / 65** but get **overridden from the detected header row** at runtime."
- "There are **31 exact POS amounts** like ₦5,050 / ₦10,150 / ₦50,500 because those encode principal + agent fee — matching them is how you detect agent-banking cash withdrawals."
- "Stamp Duty and EMTL classify at **confidence 1.0** because they're statutory and unambiguous."
- "The fallback compares `heuristic.length > ai.length` — AI output is adopted only if it beats the heuristic."
- "Levenshtein similarity is **discounted 20%** (`lev × 0.8`) because edit distance over short names produces false positives; token overlap is more reliable."
- "Amount parsing rejects anything **> ₦50M** and 10-digit reference codes — those are balance/reference columns leaking into amount."
- "I have a **balance-consistency validator** that flips debit/credit when the swapped total is within ₦1 of the running balance."
- "Header detection scans the first **25 rows** and needs **≥2 keyword hits** because Nigerian statements start with logos and legal disclaimers."
- "The recurring detector rejects any cadence whose mean gap falls outside six windows — it refuses to guess."
- "One user edit writes 3 things: an override, a generated rule, and a backfill of all similar uncategorized rows."

---

## 11. RESUME BULLET OPTIONS

- Architected an end-to-end financial data platform ingesting statements from **18+ banks / 25 distinct formats** (CSV, Excel, PDF), normalizing and classifying transactions with a confidence-scored **8-stage rules cascade**.
- Built a **3-tier PDF parsing fallback** (coordinate heuristics → text reconstruction → Gemini Vision OCR) with a measurable row-yield confidence gate at **50%**, handling character-level spacing corruption and scanned documents.
- Designed **4-layer idempotent ingestion** (SHA-256 file hash, composite transaction keys, LLM output keys, DB unique index) eliminating duplicate imports on re-upload.
- Implemented **statistical recurring-payment detection**: ≥3 occurrences, amount spread ≤25%, gap CV ≤0.4, cadence classified across 6 windows, confidence `min(0.95, 0.5+0.05n+0.3(1−CV))`.
- Shipped **35 REST endpoints** and **18 dashboard views** over a 16-model Postgres schema with 9 transaction indexes, in-memory multi-period analytics (daily/weekly/monthly/quarterly/yearly) and SQL-side aggregations.
- Reduced LLM dependency to **OCR fallback + narrative generation only** — deterministic rules own categorization, cutting per-row cost and making every classification auditable.
- Solo-shipped **18.6k LOC across 103 files in 12 days** (226 commits).

---

## 12. QUESTIONS TO ASK THEM

- "How do you handle data quality failures downstream — dead-letter queue, retries, or alerting?"
- "What's your current p95 for the ingestion path, and where does it spend time?"
- "Do you push aggregations to the warehouse or compute in the app layer? What made you choose?"
- "How do you version a schema when 20 upstream sources can change their format without notice?" ← directly maps to your bank-format problem
- "How is confidence scored and surfaced to users — do analysts see it?"
- "What does the testing strategy look like for data transformations?"
- "Is there a metrics layer / semantic layer, or do analysts write ad-hoc SQL?"

---

## 13. QUICK NUMBERS TO MEMORIZE

**226** commits · **12** days · **18,640** LOC · **103** files · **35** routes · **18** pages · **16** models · **9** indexes · **25** bank formats · **27** banks recognized · **218** categories · **~130** merchants · **20** keyword groups · **31** POS fingerprints · **50%** AI escalation gate · **50 MB** upload cap · **5 yr** date window · **4** dedup layers · **8** classification stages · **6** merchant-extraction stages · **≤25%** amount spread · **≤0.4** gap CV · **≥0.85** match / **≥0.80** group similarity · **0.55** Y-tolerance · **0.85** merge gap · **179,720** insertions.
