---
name: CONYEST
description: Financial intelligence for every naira
colors:
  primary: "#003527"
  primary-container: "#064e3b"
  primary-light: "#95d3ba"
  accent: "#416900"
  accent-vibrant: "#acf847"
  accent-bright: "#91db2a"
  ink-black: "#17191c"
  paper-white: "#ffffff"
  mist-gray: "#f2f2f3"
  fog-white: "#fafafb"
  slate-gray: "#777b86"
  ash-gray: "#979799"
  smoke-gray: "#a3a6af"
  blush-peach: "#fbe1d1"
  sienna-brown: "#5d2a1a"
  error: "#ba1a1a"
  error-container: "#ffdad6"
  success: "#416900"
  pending: "#b45309"
  surface: "#f9f9ff"
  surface-dim: "#d3daea"
  surface-lowest: "#ffffff"
  surface-low: "#f0f3ff"
  surface-container: "#e7eefe"
  surface-high: "#e2e8f8"
  surface-highest: "#dce2f3"
typography:
  display:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontWeight: 400
    letterSpacing: "-1.2px"
    lineHeight: 1.15
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontWeight: 400
    lineHeight: 1.6
  mono:
    fontFamily: "JetBrains Mono, monospace"
    fontWeight: 500
    fontFeatureSettings: "tnum"
rounded:
  cards: "24px"
  elevated: "20px"
  inputs: "16px"
  buttons: "9999px"
  lg: "12px"
  xl: "16px"
  sm: "0.01px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.buttons}"
    padding: "8px 32px"
  button-primary-hover:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.buttons}"
  button-success:
    backgroundColor: "{colors.accent-vibrant}"
    textColor: "{colors.primary}"
    rounded: "{rounded.buttons}"
  button-outline:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.buttons}"
    padding: "8px 32px"
  card:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.cards}"
    padding: "24px"
---

# Design System: CONYEST

## Overview

**Creative North Star: "The Sharp Edge"**

CONYEST is data made legible. The design speaks with the precision of a financial instrument — clean lines, purposeful color, and a layout that lets numbers breathe. The forest green carries trust and institutional weight; the neon lime cuts through with energy at moments of action and success. This is not a playful finance app — it is a sharp, confident tool for people who take their money seriously.

The aesthetic lives in the tension between grounded and electric. Dark forest surfaces anchor the dashboard, while lime accents draw the eye to what matters: a positive cash flow, a savings milestone, an active navigation state. Typography alternates between the editorial warmth of Source Serif for headlines and the clinical clarity of Inter for data-dense surfaces. The result feels both human and precise — a ledger you actually want to read.

**Key Characteristics:**
- Balanced duality: forest green for trust, neon lime for action and delight
- Pill-shaped buttons with tactile press feedback (scale 0.96)
- Hybrid elevation: subtle shadows at rest, lifted on hover
- Serif display type paired with a clean sans-serif body
- Data-forward: mono-spaced numbers, generous whitespace around figures
- Nigerian banking context: bank logos, NGN currency, local channel terminology

## Colors

The palette operates on a balanced duality: forest green carries trust and institutional weight, while neon lime delivers energy at moments of action. Neutrals are cool-toned to keep the interface clean and data-focused.

### Primary
- **Forest Green** (#003527): The anchor color. Used for primary buttons, sidebar active states, hero metric cards, chart bars (income), and the logo mark. This color signals trust and stability.
- **Forest Container** (#064e3b): Deeper variant for button hover states and elevated primary surfaces. Slightly more saturated than the base forest.

### Secondary
- **Lime Vibrant** (#acf847): The action color. Used for success badges, active navigation highlights, the savings progress bar, and CTA buttons on dark backgrounds. Its brightness demands attention without competing with the primary.
- **Lime** (#416900): Mid-tone green for secondary buttons and chart accent bars. Bridges the gap between forest and vibrant lime.
- **Lime Bright** (#91db2a): Expense chart bars and secondary data visualization accents.

### Tertiary
- **Blush Peach** (#fbe1d1): Warm accent for highlights and subtle background tints. Reserved for moments that need warmth without competing with the green system.
- **Sienna Brown** (#5d2a1a): Deep warm accent for text on blush surfaces.

### Neutral
- **Ink Black** (#17191c): Primary text color. Near-black with a slight cool cast for readability.
- **Paper White** (#ffffff): Card and surface backgrounds. Clean, high-contrast base.
- **Mist Gray** (#f2f2f3): Table header backgrounds, secondary button hover states, and filter chips. Lightest neutral for subtle differentiation.
- **Fog White** (#fafafb): Alternate surface tint for depth variation.
- **Slate Gray** (#777b86): Secondary text, descriptions, and placeholder copy.
- **Ash Gray** (#979799): Tertiary text, timestamps, chart axis labels. Used where text should recede.
- **Smoke Gray** (#a3a6af): Disabled states and very subtle borders.

### Named Rules
**The Balanced Duality Rule.** Forest green is the voice of trust; neon lime is the voice of action. Never use lime for passive elements or forest for call-to-action highlights. Their rarity relative to each other is the point — lime earns attention by appearing only where it matters.

**The One-Surface Rule.** Cards and surfaces are always paper-white or surface-lowest. The dashboard background is the only place where tinted surfaces appear. Never use colored backgrounds on cards except for semantic status (error containers, success containers).

## Typography

**Display Font:** Source Serif 4 (with Georgia, serif fallback)
**Body Font:** Inter (with system-ui, sans-serif fallback)
**Mono Font:** JetBrains Mono (with monospace fallback)

**Character:** The serif display carries editorial warmth — it says "this is a publication about your money." The sans-serif body delivers clinical precision for data-dense surfaces. The mono font gives numbers and currency values the weight they deserve.

### Hierarchy
- **Display** (400 weight, clamp(44px, 6vw, 76px), line-height 1.15): Hero headlines on landing page and section headers. Letter-spacing -1.2px for tight, confident feel.
- **Headline** (400 weight, 36px–44px, line-height 1.2): Section titles within the dashboard ("Cash Flow", "Recent Activity"). Source Serif, always.
- **Title** (500 weight, 20px, line-height 1.3): Card titles and sidebar brand name. Source Serif or Inter depending on context.
- **Body** (400 weight, 14px–17px, line-height 1.5–1.6): All descriptive text, form labels, and paragraph copy. Inter.
- **Label** (600 weight, 11px, uppercase, tracking-wider): Table column headers, section metadata, and filter labels. Inter. Always uppercase with wide letter-spacing.
- **Mono** (500 weight, 14px–28px, tabular-nums): Currency values, transaction amounts, and any number that changes. JetBrains Mono with font-variant-numeric: tabular-nums.

### Named Rules
**The Numbers Rule.** All currency and numerical data uses JetBrains Mono with tabular-nums. This prevents layout shift when values update and gives financial data the precision it deserves.

**The Serif Headline Rule.** All major section headings use Source Serif 4. Inter is for data and body copy only. This separation keeps the editorial voice distinct from the data voice.

## Layout

The layout follows a sidebar-plus-content model: a fixed 260px sidebar on the left with navigation, and a fluid content area that expands to fill the remaining space. Maximum content width is 1200px, centered within the content area.

The sidebar is compact with pill-shaped navigation items. Active states use lime-vibrant backgrounds with forest text — the brightest element in the sidebar, drawing attention to location. The sidebar collapses to a slide-over on mobile with a blurred backdrop overlay.

Content pages use a single-column layout for most screens, with a 3-column grid for the dashboard's analytics section (2:1 ratio for chart + donut). Metric cards use a 4-column grid on desktop, stacking to 1-column on mobile.

Spacing rhythm is based on 8px increments: 16px between related items, 24px between groups, 32px between sections. Cards use 24px internal padding. The layout breathes — whitespace is generous around data-dense elements.

## Elevation & Depth

The system uses a hybrid elevation model: subtle shadows at rest, stronger shadows on hover and elevated states. This creates a tactile feel without visual clutter.

### Shadow Vocabulary
- **Subtle** (rest state): `oklab(0 0 0 / 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.08) 0px 4px 24px 0px` — A 1px border shadow plus a soft ambient glow. Used on cards, dropdowns, and surfaces at rest.
- **Subtle 2** (hover state): `oklab(0 0 0 / 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 8px 40px 0px` — Stronger ambient shadow for hover states on cards and interactive surfaces.
- **Elevated** (prominent elements): `rgba(4, 23, 43, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 20px 25px -5px, rgba(0, 0, 0, 0.1) 0px 8px 10px -6px` — Double-layered shadow for hero metric cards and floating elements.

### Named Rules
**The Lift Rule.** Cards lift on hover with a -3px translateY and a shadow transition. Buttons lift -1px. This is the primary tactile feedback — no scale animation on cards, only translate and shadow.

**The Border Rule.** Every shadowed surface also carries a 1px border (#ececec). The border provides structure at rest when the shadow is too subtle to see; the shadow provides depth on hover. Never use shadow without border, or border without shadow on cards.

## Shapes

The form language is defined by two radii: the pill (9999px) for buttons and badges, and the generous round (24px) for cards and containers. This creates a soft, approachable silhouette without feeling bubbly.

- **Pill** (9999px): All buttons, badges, and status chips. The pill shape is the dominant interactive silhouette — it says "this is an action."
- **Card** (24px): All card containers, metric cards, and floating elements. Large enough to feel substantial, small enough to not dominate the content.
- **Input** (16px): Form fields and select dropdowns. Slightly tighter than cards to feel contained.
- **Elevated** (20px): Modal dialogs and elevated panels. Between card and input radius.
- **Large** (12px): Smaller internal elements like chart tooltips and mini badges.
- **Sharp** (0.01px): Rarely used — only for elements that need to feel geometric and precise.

### Named Rules
**The Concentric Radius Rule.** Outer radius = inner radius + padding. A card with 24px radius containing a button with 9999px radius is fine — the pill breaks the constraint intentionally. But a 16px-radius card containing a 16px-radius inner element must have the inner element at 8px (24 - 16 = 8px padding).

## Components

### Buttons
- **Shape:** Pill (9999px radius), tactile press feedback with scale(0.96)
- **Primary:** Forest background (#003527), white text, 8px 32px padding. Hover shifts to forest-container (#064e3b).
- **Success:** Lime-vibrant background (#acf847), forest text. Used for CTAs on dark surfaces (hero sections).
- **Outline:** White background, ink-black text, 1px #ececec border. Hover shifts to mist-gray.
- **Ghost:** Transparent background, slate-gray text. Hover shows mist-gray background.
- **Destructive:** Error red (#ba1a1a), white text. Used sparingly for delete and remove actions.
- **Focus:** 2px lime-vibrant ring with 50% opacity, offset 2px.
- **Sizes:** sm (h-8), default (h-9), lg (h-10), icon (h-9 w-9).

### Cards
- **Corner Style:** 24px radius
- **Background:** Paper-white (#ffffff)
- **Shadow Strategy:** Subtle at rest, subtle-2 on hover. Hero metric cards use the elevated shadow.
- **Border:** 1px #ececec
- **Internal Padding:** 24px (p-6)
- **Hover:** translateY(-3px) with shadow transition

### Inputs / Fields
- **Style:** 1px border (#ececec), transparent background, 16px radius, 9px height (h-9)
- **Focus:** 1px ring (#ring color from HSL), outline shifts to ring color
- **Placeholder:** Muted foreground color (slate-gray)
- **Error:** Error border color with aria-describedby for error message

### Navigation (Sidebar)
- **Style:** 260px fixed width, paper-white background, 1px right border
- **Active State:** Lime-vibrant background (#acf847) with forest text, pill-shaped
- **Inactive State:** Slate-gray text, hover shows mist-gray background
- **Typography:** 14px Inter, medium weight (500)
- **Icons:** 20px Heroicons outline, same color as text

### Metric Cards (Dashboard)
- **Shape:** 24px radius, full-height (h-40/h-44)
- **Primary Card (Balance):** Forest background, white text, lime-vibrant accent badge
- **Secondary Cards (Income/Expenses/Savings):** Paper-white background, 1px border, subtle shadow
- **Values:** JetBrains Mono, 28px, tabular-nums
- **Labels:** 11px uppercase, tracking-wider, ash-gray

### Tables
- **Header:** Mist-gray background, 11px uppercase labels, ash-gray text
- **Rows:** Paper-white, 1px bottom border (#ececec)
- **Hover:** 50% mist-gray overlay
- **Cells:** 16px vertical padding, 24px horizontal padding

### Chips / Badges
- **Style:** Pill-shaped (9999px), small (10px text, 2px 8px padding)
- **Credit:** Lime-vibrant background (20% opacity), forest text
- **Debit:** Error-container background, error text
- **Neutral:** Mist-gray background, slate-gray text

## Do's and Don'ts

### Do:
- **Do** use JetBrains Mono for all currency and numerical data. Tabular-nums prevents layout shift.
- **Do** use Source Serif 4 for all major section headings. Keep the editorial voice distinct from data.
- **Do** use lime-vibrant (#acf847) only for active states, success indicators, and CTAs on dark backgrounds. Its power comes from restraint.
- **Do** keep card backgrounds paper-white. Colored backgrounds on cards are reserved for semantic status only.
- **Do** use the pill shape (9999px) for all buttons and badges consistently.
- **Do** maintain 16px between related items, 24px between groups, 32px between sections.

### Don't:
- **Don't** use lime for passive elements like labels, descriptions, or secondary text. It is an action color.
- **Don't** use forest green for call-to-action highlights. Forest is the anchor; lime is the spark.
- **Don't** add shadows without borders on cards. The border provides structure at rest.
- **Don't** use colored card backgrounds except for error/success containers.
- **Don't** mix serif and sans-serif in the same text block. Serif for headlines, sans-serif for body.
- **Don't** use font sizes below 11px for any readable text. Below that, use opacity or color to de-emphasize.
- **Don't** use `transition: all` on any component. Specify exact properties (transform, box-shadow, background-color).
