# CONYEST

**Financial intelligence for every naira.**

CONYEST is a full-stack personal finance manager built for the Nigerian banking ecosystem. Upload bank statements from 18+ Nigerian banks, and get instant clarity on where your money goes — with AI-powered categorization, recurring transaction detection, and multi-period analytics.

## Features

- **Multi-bank upload** — Import CSV, Excel, or PDF statements from GTBank, Access, OPay, Kuda, Moniepoint, First Bank, UBA, and more
- **Smart parsing** — Automatic format detection, transaction normalization, and merchant extraction
- **AI-powered classification** — Google Gemini categorizes each transaction (Food, Transport, Utilities, Entertainment, etc.) with confidence scores
- **Self-transfer detection** — Automatically identifies transfers between your own accounts
- **Recurring detection** — Algorithmic discovery of daily, weekly, monthly, and yearly patterns
- **Dashboards & analytics** — Cash flow charts, category breakdowns, bank comparisons, and spending trends
- **Budgeting & goals** — Per-category budgets and savings goal tracking
- **Multi-period reporting** — Daily, monthly, quarterly, yearly, and all-time views

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4, Radix UI, Recharts |
| Language | TypeScript (strict) |
| Database | PostgreSQL (Neon) |
| ORM | Prisma |
| Auth | Better Auth |
| AI | Google Gemini (`gemini-3.1-flash-lite`) |

## Getting started

### Prerequisites

- Node.js 20+
- A PostgreSQL database (Neon recommended)

### Setup

```bash
git clone https://github.com/oladeeayo/bank-analyzer.git
cd bank-analyzer
npm install
```

Create a `.env` file:

```env
DATABASE_URL=postgresql://...
GEMINI_API_KEY=your_gemini_key
```

Run the database migrations and seed:

```bash
npx prisma migrate dev
```

Start the development server:

```bash
npm run dev
```

## Architecture

```
src/
├── app/              # Next.js App Router pages and API routes
│   ├── (auth)/       # Login and registration
│   ├── api/          # 14 route groups (analytics, statements, transactions, etc.)
│   └── dashboard/    # Dashboard pages (home, upload, banks, budgets, goals, etc.)
├── components/
│   ├── layout/       # Dashboard layout and sidebar
│   └── ui/           # Shared UI components (button, card, badge, etc.)
└── lib/
    ├── ai/           # Gemini integration
    ├── classifier/   # Rule-based transaction classification
    ├── parser/       # Merchant extraction
    ├── parsers/      # CSV, Excel, PDF parsing
    └── normalizer/   # Transaction description normalization
```

## Supported banks

GTBank, Access Bank, OPay, Kuda, Moniepoint, First Bank, UBA, Zenith Bank, Fidelity Bank, Union Bank, Sterling Bank, FCMB, Stanbic IBTC, PalmPay, Wema Bank, Polaris Bank, Ecobank, and more.

## License

MIT