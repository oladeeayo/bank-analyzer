# CONYEST: LinkedIn series (8 posts)

No headings inside the posts. Each one opens on a question, then goes straight into the problem. Separate posts with the horizontal rule when you copy them across.

---

How do you turn 25 incompatible bank formats into one table when nobody documents any of them?

Eleven banks I tested send twenty-five different layouts. Same country, same currency, same four facts in every single file: date, description, amount, balance. Not one of them agrees on where those facts live.

One CSV puts debits in a column called "Money Out". Another uses a single amount column where the sign carries all the meaning. An Excel export stores dates as serial numbers counting from 1900. A PDF puts everything into a text layer with no columns at all.

The usual answer is a special case per source. Twenty-five parsers that each know where the header starts and which column is which. It works until a bank ships a redesign, and then it works for eleven of your twenty-five files.

So I went schema-on-read. Every file gets parsed into one fixed target, and nothing downstream ever learns which bank it came from:

→ Find the header row, wherever the bank put it
→ Map columns by keyword, never by position
→ Normalise dates into ISO and amounts into one direction
→ Refuse rows that don't fit the target schema
→ Record why each refused row was refused

Finding the header took the longest. Some files put it on line 1. One had a bank logo, a paragraph of terms, and three promotional lines first, so the real header sat on line 14. Writing a rule per bank would mean 25 of them. Instead the parser scans the first 25 rows and scores each on how many header words it contains: date, description, narration, debit, credit, amount, balance, reference. First row with two or more matches wins.

Columns then map on keyword, because position is what a redesign changes and words are what stay. "Money out", "Withdrawal" and "Dr" all resolve to the same field.

**For example:**
📄 Layouts tested: 25, across 11 banks
🎯 Header found on: row 1 to row 14, no per-bank rules
🧾 Output schema: 7 fields, identical every time
🚫 Special cases leaking downstream: 0

Every chart, every aggregation and every test in this project sits on a shape that does not move. That decision is the reason the rest of it was buildable at all.

**If you're integrating sources nobody owns, agree on the target schema first and treat every parser as replaceable.**

---

What do you do when the file looks perfect and contains no readable words?

A PDF statement from Kuda opened fine, printed fine, looked completely normal on screen. Its text layer held this:

`0 2 / 0 3 / 2 6      1 0 , 0 0 0 . 0 0`

You read 02/03/26 and 10,000.00. My parser read seventeen separate characters and treated each one as its own field. It returned three rows from a file with four hundred, and the three it returned were nonsense.

The first day went into the wrong fix. I rewrote the cleanup step, added date regexes, stripped characters that looked like noise, tightened the amount patterns. Output barely moved. My confidence that I was close kept rising, which in hindsight was the clearest sign I was furthest away.

So I built a debug view that prints every text object with its x and y coordinates, grouped by line. The whole problem was visible in about two minutes. There are no words in this file. There are glyphs, and words have to be rebuilt from their positions.

→ Characters join into one line when they sit within 0.55 units vertically
→ Neighbours stitch into a word when the horizontal gap is under 0.85
→ Continuation lines merge only within 10 units of the running line
→ Dates, times and amounts get pattern guards so narration can't swallow them

Then the check that actually mattered. A parser returning plausible rows with the wrong count is worse than one returning nothing, because nothing gets investigated. So I compared row counts against the bank's own summary page across four different months and tuned until they agreed.

**For example:**
📄 Rows before: 3
📄 Rows after: 408
✅ Agrees with bank summary: 4 months running
⏱️ Time cost: two days, one of them wasted

The lesson I keep paying for. When the output makes no sense, read the input, not the code reading it.

**Validate a parser against the source's own totals, never against how reasonable the output looks.**

---

How do you make an ingestion job safe to run twice?

My first version hashed the file, saw it had been uploaded before, and refused it. Then someone exported the same month twice, got two files with different filenames and different byte sizes but identical transactions underneath, and imported both. The total doubled and nothing complained.

Double-counting is the worst failure mode in a finance pipeline because it doesn't look like a failure. The dashboard renders, the charts look plausible, the number is simply wrong.

Four checks now sit between the upload and the table:

→ SHA-256 of the raw file, stored with a unique constraint on bank and hash. Catches byte-identical re-uploads.
→ A business key per transaction: date, amount and the first 50 characters of description, or the bank reference number where one exists.
→ An extraction key of date, amount, type and 30 characters of description, so running extraction twice on the same page can't keep row 137 twice.
→ A composite unique index in Postgres as the last line of defence, for the day the application code has a hole in it.

The business key is the interesting one. Before writing anything, the pipeline loads every transaction already stored in that date range and diffs the keys. No overlap, clean insert. Overlap stops the upload and returns a choice: merge, replace or cancel. Partial overlap is flagged separately, so you can see that 38 of your 412 rows already exist before you decide what to do about it.

**For example:**
📄 File: same month, new filename, 62 KB instead of 58 KB
🔁 Overlap detected: 38 transactions
➡️ Options returned: merge / replace / cancel
✅ Rows written: 0 until you choose

Each layer exists because the one above it couldn't see the problem. The hash can't see a re-export. The business key can't see a re-extraction. The index is there for when both get bypassed.

**A pipeline you can run twice for free is the difference between a tool and a demo.**

---

How do you know a total is right?

Not how do you compute it. How do you know it, and how would you prove it to someone who doesn't trust your code?

Every file passes quality gates before a single row reaches the database:

→ Amounts above ₦50,000,000 are dropped. Across every statement I've seen, that's never a real transaction. It's a balance sitting in an amount column.
→ Reference codes with ten or more digits and no decimal point go for the same reason.
→ Dates beyond five years back or one year forward fail the whole file rather than inserting nonsense.
→ Rows with no date, no description or a zero amount are rejected individually, each carrying an error code and the offending value.

The rule I'm happiest with does real reconciliation. When a file carries a running balance column, the pipeline checks whether the arithmetic works. If swapping the debit and credit labels brings the total within one naira of the reported balance, it swaps them. Three transactions minimum, both balance endpoints present. It catches exports that ship an amount column and nothing else, with an undocumented sign convention.

Rejected rows never vanish silently. The response returns the first ten with their error codes, so whoever uploaded the file can see exactly what was refused and why.

**For example:**
📄 Rows read: 412
🚫 Rejected: 4, all balance sitting in amount
🔁 Auto-corrected: 11, sign convention flipped
💰 Balance check: matches to the naira
🔎 Rows silently dropped: 0

Silent row loss is the failure I care about most in any pipeline. If you can't say how many rows you dropped, you can't say what your number means.

**Publish the reject count next to the total. Trust comes from showing what you threw away.**

---

How does a system tell rent from a one-off payment?

Both are money leaving. Both can repeat. The difference is statistical, and getting it wrong makes every forecast built on top of it useless.

The detector groups transactions by merchant and direction, then looks back six months. A group qualifies only when three thresholds hold:

→ At least three occurrences. Two is a coincidence, not a pattern.
→ Amounts within 25% of their own mean. Rent doesn't vary. Money sent to a friend does.
→ Consistent intervals: standard deviation of the gaps over their average, below 0.4.

Cadence is then read from the mean interval against fixed windows: 0.5 to 1.5 days for daily, 5 to 9 for weekly, 12 to 16 for biweekly, 25 to 35 for monthly, 80 to 100 for quarterly, 350 to 380 for yearly. A mean that falls outside every window is rejected rather than snapped to the nearest one. Twice in January and again in April is not a pattern, and the system says so.

Confidence comes from a formula instead of a feeling: min(0.95, 0.5 + 0.05 × count + 0.3 × (1 − amount CV)). More occurrences and steadier amounts produce a higher score.

Then the part that changes behaviour. Every cadence gets an annualiser: 365, 52, 26, 12, 4, 1. A ₦1,200 charge becomes ₦14,400 a year and sits in the same units as rent, which is the only reason anyone ever notices it.

An AI pass runs last to remove false positives, mostly payments to people and one-off purchases that happen to repeat. The prompt is deliberately conservative: when in doubt about a payment to a person, mark it as not recurring.

**For example:**
📅 Cadence: monthly, 30-day average gap
📊 Occurrences: 7, amount spread 0.9%, interval CV 0.06
💰 Average: ₦1,200
📆 Annualised: ₦14,400
💯 Confidence: 0.86
➡️ Next expected: 12 Oct

**Three thresholds, six windows, one formula. Everything after that is presentation.**

---

How do you categorise transactions when you have no training data?

No labelled dataset of Nigerian bank statements exists. Nobody has published one. So the question becomes what evidence is available at the moment a row lands.

Mine runs eight stages in order and stops at the first hit:

→ Your own manual correction, confidence 0.95
→ A rule you saved, 0.90
→ Nigerian-specific context rules, 0.88 to 1.00
→ Built-in keyword patterns, 0.60 to 0.95
→ Existing merchant match, exact then fuzzy
→ Creating a new merchant, 0.70
→ General pattern guess, 0.50
→ Nothing matched, confidence 0, category "Others"

Every result stores two extra columns: where the answer came from, and how sure it is. That's the whole trick. A number with no provenance attached is a claim, not a measurement.

The domain rules are where the real work sits. Cash from a POS agent in Nigeria is never round. You withdraw ₦5,000, the agent adds a fee, the statement records ₦5,050. ₦10,000 comes out as ₦10,150, ₦50,000 as ₦50,500. I collected 31 of those amounts, and a row only counts as an agent withdrawal when money is leaving, the amount is on the list, and the description names an agent or a microfinance bank. Two out of three isn't enough, which is exactly what stops a ₦10,150 bank charge being filed as cash out.

Then the loop that makes it improve. One correction writes your override, generates a readable rule, and sweeps every other uncategorised row carrying the same name.

**For example:**
✏️ Corrected: 1 row
📜 Rule created: contains "FAITH EREZIOGHENE"
🔄 Similar rows updated: 37
⏱️ Time taken: one request
📖 Rules you can read and delete: all of them

No training run. No model file. No accuracy figure on a slide. Just a table of rules you own, growing one entry at a time.

**Pick auditable evidence over average accuracy whenever the user has to trust the output.**

---

What happens when two dashboards disagree about the same number?

I built average daily spend twice, by accident, and got two different answers from identical transactions.

The analytics endpoint divides total expenses by the number of calendar days in the period. The report endpoint divides by the number of days that had at least one transaction. In a month with one quiet week, the second number comes out meaningfully higher.

Nobody complained, because nobody loads both screens side by side. I found it while reading the code to explain the metric to someone else.

That's a definition problem, not an arithmetic problem, and it's the kind that quietly kills trust in a dashboard. The moment somebody spots the gap, every other number on the page becomes negotiable.

The fix is small:
→ Pick one denominator, calendar days, and put it in the field name
→ Compute it in one place that both endpoints call
→ Delete the second version instead of leaving both available
→ Return the definition alongside the number whenever the number is returned

The wider point is about derived metrics generally. Anything computed in more than one place will diverge, because the two copies were written at different times, under different assumptions, by someone who has since moved on to something else.

I ask about denominators now whenever a number arrives without one. It's a short question and the pause is usually informative.

**Write the definition next to the number. Two implementations of one metric is already a bug.**

---

What would I fix first if I started this again?

Not a rhetorical question. I keep a gap list, and the order on it matters more than the list itself.

First. One of my own rule sets never runs in production. The classifier takes an optional user argument that all three call sites omit, so the stage handling stamp duty, transfer levies, agent cash and family support matches nothing and falls through to keywords. Nothing crashes, the later stage covers most of those rows, so the numbers look fine. I found it by reading the pipeline to explain it to somebody else, weeks after writing it. The fix is one line at three call sites plus a test that fails today.

Second. Dashboards sum inside the application instead of in SQL. Correct for one person's year of transactions, wrong at a million rows. I know the move, push the sums down, group there, return rows rather than transactions. The report page already works that way, so both patterns live in the codebase and the boundary is a decision I'd want to re-measure under load.

Third. Counterparty grouping compares every description against every other description, with an edit distance inside each comparison. Rows squared. Fine at a few thousand, slow at a hundred thousand, and the fix is blocking on a normalised key before anything gets compared.

Fourth. No automated test suite. Four scratch scripts and nine hand-written classification cases. Enough to catch damage I do to myself, not enough to hand over.

**For example:**
✅ Ships today: 25 formats parsed, 4 dedup layers, 8 classification stages, 5 reporting periods
🐛 Open items: 4, listed above in fix order
🔧 Closest one: a weekend, if I'm honest about it

Collecting data is easy. Building data you can trust is the engineering part, and trust lives mostly in the things nobody sees.

**If your reports depend on exports that never line up, that's the part worth fixing. Send me a format you think will break it.**

---

## Posting notes

- Eight posts, every three or four days.
- Post 1 frames the whole series as a schema problem. Keep it first.
- Posts 4 and 5 are the analytics core. Post 6 is the one hiring managers quote.
- Post 8 gets the most comments. Answer with specifics, not gratitude.
- Two tags maximum, on posts 1 and 8 only.
- No "thoughts?" or "agree?" at the end. Post 8 already closes with an ask.
- If one runs long when you paste it, cut the last paragraph, not the middle.
