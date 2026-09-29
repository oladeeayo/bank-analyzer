# PDF Statement Parsing — Balance-Chain Design

How CONYEST parses the glued-column PDF statements that Nigerian banks
generate, and why the parser is built the way it is.

## The core problem

Ecobank, Fidelity, First Bank, Globus, Providus, Wema and Zenith all export
PDFs whose table rows lose their column boundaries. A row renders as one
glued string:

```
03-Aug-2601-Aug-26OthersSMS ALERT CHARGES 31JUL 26 72.000.002,123,768,947.11
\___trans date__/                      \debit/credit/\___balance___/
          \_value date_/
```

Narration reference numbers frequently glue into the amount columns
(Providus: `...TRF/...4305,429,235.28` — the trailing `5` belongs to the
narration, making a phantom `5,429,235,280.00`). Coordinate-based splitting
fails because these PDFs draw overlapping tokens, and a plain regex split
once produced a 2.3e27 phantom debit.

## The balance-chain solution

Every row of a real statement satisfies:

```
prevBalance - debit + credit = balance   (exactly, to the cent)
```

`parseNigerianStandardRows` in `src/lib/parsers/pdf-parser.ts` exploits this:

1. Read the header's **Opening Balance** to anchor the chain.
2. For each row, strip leading glued dates, then enumerate *all* plausible
   numeric tokens in the row tail (the same characters can read as several
   different amounts).
3. Try spans of 1–3 adjacent printed amounts whose **sum** equals the
   balance change. The **sign of the balance change decides debit vs
   credit** — never column order, which cannot be trusted.
4. The printed balance anchors the next row, so a single odd row cannot
   poison the rest of the statement.
5. Rows that cannot be anchored (usually the first, when the opening
   balance is missing from the PDF) are settled against the header's
   printed **Total Credit / Total Debit**.
6. Rows with several printed amounts that all sum to the balance change
   emit several transactions — Wema packs a ₦10 fee and a ₦412,192 salary
   into one printed row.

## Bank-specific quirks (7 real statements)

| Bank | Quirks |
|---|---|
| **Ecobank** | `DD/MM/YYYYDD/MM/YYYY` glued dates; no narration on some rows; separate cells `4310786`, `0.00`, `2`; 3-year statement (2012–2015) |
| **Fidelity** | `DD-Mon-YY` glued dates ×2–3 (`03-Aug-2603-Aug-2603-Aug-26`); channel words (`Others`, `OnlineBanking`); fee rows between transfers; narration glued to amounts |
| **First Bank** | `DD-Mon-YYYY` ×2 glued; ref+account glue `S471432672008523309:`; `Ref26012026` glue; USD statement; 6 interest credits totaling exactly 0.26 |
| **Globus** | `DD-MM-YYYY` ×2 glued; narration refs glue `MARIN0.00`; `VAT BG`/`BG Charges` rows; 2.5-year statement |
| **Providus** | `DD-MM-YYYY` ×2 glued; 4,400+ rows; narration continuation lines; dateless stamp-duty lines that inherit the previous row's date |
| **Wema** | Single `DD-Mon-YYYY`; ref `S96444838` glued; **fee+salary in one printed row**; stamp-duty rows in separate cells |
| **Zenith** | `DD/MM/YYYY` ×2 glued; separate cells for narration/amounts/balance on some rows; `FGN Stamp Duty//` prefix |

## Safety nets

- `parsePDF` retries transient pdf2json XRef failures (First Bank's PDF
  fails intermittently on a cold parse) and enforces a 90 s timeout so
  uploads never wedge.
- `src/lib/parsers/index.ts` never lets the Gemini AI fallback "improve" a
  balance-chain-verified statement — the AI once replaced 6 exact interest
  credits with 471-million phantom debits.
- Upload route date range widened to 15 years (Ecobank's archive statements).

## Verification

```bash
npm run verify:pdfs   # parse raw rows directly, check sums + closing balances
npm run e2e:pdfs      # full pipeline through parseStatement (routing, AI guard)
```

Both scripts read the PDFs in `C:\Users\User\Desktop\bank statement` and
print PASS/FAIL per bank against the statements' own printed header totals.
