# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 (App Router), React 19, Tailwind CSS v4, Radix UI, Recharts, TypeScript (strict), PostgreSQL (Neon), Prisma, Better Auth, Google Gemini AI

## Users

Small business owners and financially active individuals in Nigeria who manage money across multiple bank accounts. They mix personal and business transactions and need to understand where their money goes — without manually sifting through CSVs or spreadsheets.

## Product Purpose

CONYEST provides financial clarity for the Nigerian banking ecosystem. Users upload bank statements from 18+ Nigerian banks, and the product automatically parses, categorizes, and analyzes transactions — turning scattered bank data into actionable insight about spending patterns, recurring commitments, and cash flow.

## Positioning

CONYEST is the only finance tool built specifically for Nigerian bank statement formats, NGN workflows, and the realities of managing money across GTBank, Access, OPay, Kuda, Moniepoint, First Bank, UBA, Zenith, and 10+ other institutions. Manual spreadsheets can't match the AI-powered categorization; generic finance apps don't understand Nigerian bank formats.

## Operating Context

- Users export statements as CSV, Excel, or PDF from their bank's mobile app or internet banking
- Statements arrive in varying formats per bank; parsing must handle 18+ distinct layouts
- Transactions include Nigerian-specific channels: POS, agent banking, direct transfers, utility payments, system charges, gateway transactions
- Currency is NGN throughout; values are meaningful in naira context
- Users typically upload statements monthly or quarterly to maintain a running financial picture
- Budgeting and savings goals are per-category and time-bound

## Capabilities and Constraints

- Multi-bank upload with automatic format detection for 18+ Nigerian banks
- Smart parsing: transaction normalization, merchant extraction, self-transfer detection
- AI-powered classification via Google Gemini with confidence scores and rule-based fallback
- Recurring transaction detection (daily, weekly, monthly, yearly patterns)
- Dashboard analytics: cash flow charts, category breakdowns, bank comparisons, spending trends
- Budgeting per category and savings goal tracking
- Multi-period reporting: daily, monthly, quarterly, yearly, all-time
- Authentication via Better Auth with email/password
- PostgreSQL database (Neon)
- No mobile app — web only, responsive for mobile browsers

## Brand Commitments

Product name: CONYEST. Tagline: "Financial intelligence for every naira." No established visual identity, color palette, or typography system yet — the current UI is the starting point for design work.

## Evidence on Hand

- Full working application with upload, parsing, classification, dashboards, budgets, and goals
- Prisma schema covering users, banks, statements, transactions, merchants, categories, classification rules, manual overrides, recurring transactions, budgets, and goals
- README with feature list, tech stack, and architecture overview
- No deployed instance confirmed; development environment setup documented

## Product Principles

1. Nigerian banking formats are first-class — every parser must handle real statement layouts from actual banks
2. AI augments but does not replace human judgment — users can override classifications and merchants
3. Multi-bank clarity over single-institution depth — the value is the unified view
4. Data belongs to the user — self-hosted, no third-party data sharing
5. Simplicity over feature density — the interface should feel clean even with complex data

## Accessibility & Inclusion

Standard WCAG AA compliance. No product-specific accessibility requirements established beyond baseline web accessibility.
