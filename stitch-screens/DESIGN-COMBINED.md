# Nigerian Financial Intelligence System — Combined Design System

> Merging Forest Intelligence color palette with Steep editorial typography and layout

---

## Brand & Style

This design system combines the **Forest Intelligence** color palette (deep forest greens with vibrant lime accents) with **Steep's editorial typography** (serif headlines, generous spacing, pill-shaped controls) to create a sophisticated financial analytics interface that feels both authoritative and modern.

The aesthetic is **Editorial Finance** — serif headlines whisper authority while forest green tones convey stability and growth. Cards float like magazine artifacts on a clean white canvas, with peach accents punctuating key insights.

---

## Tokens — Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Ink Black | `#17191c` | `--color-ink-black` | Primary text, filled button background — the only dark surface in the system |
| Paper White | `#ffffff` | `--color-paper-white` | Page canvas, button text, elevated card surfaces |
| Mist Gray | `#f2f2f3` | `--color-mist-gray` | Card surfaces, secondary backgrounds, input fills |
| Fog White | `#fafafb` | `--color-fog-white` | Secondary page background for alternating sections |
| Slate Gray | `#777b86` | `--color-slate-gray` | Link color, muted helper text, footer copy |
| Ash Gray | `#979799` | `--color-ash-gray` | Tertiary labels, category tags |
| Smoke Gray | `#a3a6af` | `--color-smoke-gray` | Placeholder text, disabled labels |
| Blush Peach | `#fbe1d1` | `--color-blush-peach` | Accent card background, warm highlight wash |
| Sienna Brown | `#5d2a1a` | `--color-sienna-brown` | Text and stroke on peach surfaces |
| **Forest Primary** | `#003527` | `--color-forest-primary` | Primary brand color, navigation anchors |
| **Forest Container** | `#064e3b` | `--color-forest-container` | Primary containers, bank card gradients |
| **Lime Accent** | `#416900` | `--color-lime-accent` | Secondary actions, success indicators |
| **Lime Vibrant** | `#acf847` | `--color-lime-vibrant` | Status chips, growth indicators |
| **Lime Bright** | `#91db2a` | `--color-lime-bright` | Hover states, secondary fixed |
| Surface Tint | `#2b6954` | `--color-surface-tint` | Subtle surface tinting |

---

## Tokens — Typography

### Signifier — Display and headline serif
Used exclusively for H1/H2 at three sizes. Weight stays at 400 (regular) at every scale — the serif whispers authority rather than shouting in bold.

- **Substitute:** GT Sectra, Tiempos Headline, Source Serif 4, or ui-serif/Georgia as fallback
- **Weights:** 400
- **Sizes:** 44px, 64px, 90px
- **Line height:** 1.30
- **Letter spacing:** -2.25px at 90px, -0.96px at 64px, -0.66px at 44px

### Sohne — Body, UI, and navigation sans
The workhorse covering everything from 14px metadata to 26px subheads. The half-step weights (430, 450, 480) create fine-grained hierarchy without jumping to bold.

- **Substitute:** Inter, Söhne (Klim Type Foundry), or ui-sans-serif/system-ui stack
- **Weights:** 400, 430, 450, 480, 500
- **Sizes:** 14px, 15px, 16px, 17px, 18px, 20px, 22px, 26px
- **Line height:** 1.00–1.50
- **Letter spacing:** -0.234px at 26px, -0.162px at 18px, 0 at body sizes

### Mono — Financial data
JetBrains Mono for transaction IDs, account numbers, and numerical data.

- **Weights:** 500
- **Sizes:** 14px
- **Line height:** 20px

### Type Scale

| Role | Size | Line Height | Letter Spacing | Font |
|------|------|-------------|----------------|------|
| caption | 15px | 1.5 | — | Sohne |
| body | 17px | 1.35 | — | Sohne |
| body-md | 14px | 1.43 | — | Sohne |
| body-lg | 20px | 1.35 | — | Sohne |
| subheading | 22px | 1.5 | — | Sohne |
| heading-sm | 26px | 1.18 | -0.23px | Sohne |
| heading | 44px | 1.3 | -0.66px | Signifier |
| heading-lg | 64px | 1.3 | -0.96px | Signifier |
| display | 90px | 1.3 | -2.25px | Signifier |
| mono-data | 14px | 1.43 | — | JetBrains Mono |

---

## Tokens — Spacing & Shapes

**Base unit:** 4px

**Density:** comfortable

### Spacing Scale

| Name | Value | Token |
|------|-------|-------|
| 4 | 4px | `--spacing-4` |
| 8 | 8px | `--spacing-8` |
| 12 | 12px | `--spacing-12` |
| 16 | 16px | `--spacing-16` |
| 20 | 20px | `--spacing-20` |
| 24 | 24px | `--spacing-24` |
| 28 | 28px | `--spacing-28` |
| 32 | 32px | `--spacing-32` |
| 40 | 40px | `--spacing-40` |
| 64 | 64px | `--spacing-64` |
| 80 | 80px | `--spacing-80` |
| 96 | 96px | `--spacing-96` |

### Border Radius

| Element | Value |
|---------|-------|
| cards | 24px |
| images | 12px |
| inputs | 16px |
| buttons | 9999px |
| smallCards | 16px |
| elevatedCards | 20px |
| statusChips | 9999px |

### Shadows

| Name | Value | Token |
|------|-------|-------|
| subtle | `oklab(0 0 0 / 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.08) 0px 4px 24px 0px` | `--shadow-subtle` |
| subtle-2 | `oklab(0 0 0 / 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 8px 40px 0px` | `--shadow-subtle-2` |
| subtle-3 | `rgba(4, 23, 43, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 20px 25px -5px, rgba(0, 0, 0, 0.1) 0px 8px 10px -6px` | `--shadow-subtle-3` |
| elevated | `0 0 0 1px rgba(4,23,43,0.05), 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)` | `--shadow-elevated` |

### Layout

- **Page max-width:** 1200px
- **Section gap:** 80px
- **Card padding:** 20px
- **Element gap:** 8px
- **Sidebar width:** 260px

---

## Surfaces

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 0 | Canvas | `#ffffff` | Default page background |
| 1 | Card Mist | `#f2f2f3` | Quietly nested content blocks, feature cards |
| 2 | Section Fog | `#fafafb` | Alternating section bands |
| 3 | Accent Blush | `#fbe1d1` | Editorial accent cards (use sparingly) |
| 4 | Elevated White | `#ffffff` | Floating product UI artifacts with shadow |
| 5 | Forest Primary | `#003527` | Primary brand surfaces, hero cards |
| 6 | Lime Vibrant | `#acf847` | Success states, active indicators |

---

## Components

### Pill Button — Filled
**Role:** Primary call-to-action

Background `#003527` (Forest Primary), text `#ffffff`, border-radius 9999px, padding 0 20px, height auto with text. Sohne 16px weight 400. No shadow.

### Pill Button — Ghost
**Role:** Secondary action paired with filled primary

Background transparent, text `#003527`, border 1px solid `#003527`, border-radius 9999px, padding 0 20px. Sohne 16px weight 400.

### Pill Button — Lime
**Role:** Success/confirmation actions

Background `#416900` (Lime Accent), text `#ffffff`, border-radius 9999px. Used for "Get Pro" and positive actions.

### Text Link with Arrow
**Role:** Inline navigation

No background, no border, text `#003527`, Sohne 16px weight 400, padding 20px 0. Arrow glyph (→) is part of the label.

### Nav Link
**Role:** Sidebar navigation items

No background or border by default, text `#777b86`, Sohne 16px weight 400. Active state: background `#acf847`, text `#457000`, font-weight 600.

### Neutral Card
**Role:** Feature blocks, content containers

Background `#f2f2f3`, border-radius 24px, no shadow, no border, padding varies. The default workhorse card.

### Accent Peach Card
**Role:** Editorial highlight or callout panel

Background `#fbe1d1`, text and strokes `#5d2a1a`, border-radius 24px, no shadow, no border. Use at most once per page.

### Forest Card
**Role:** Primary brand surfaces, hero metrics

Background `#003527` (Forest Primary), text `#ffffff`, border-radius 24px. Used for total balance cards and primary CTAs.

### Floating Product Artifact
**Role:** Hero and section visual elements

Background `#ffffff`, border-radius 20px, subtle box-shadow: `0 0 0 1px rgba(4,23,43,0.05), 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)`, padding 16px 20px 12px 12px.

### Status Chip
**Role:** Transaction status indicators

Border-radius 9999px (pill), padding 4px 12px, font-size 12px, font-weight 600.
- **Completed:** Background `rgba(172, 248, 71, 0.2)`, text `#457000`
- **Pending:** Background `rgba(251, 191, 36, 0.1)`, text `#b45309`
- **Failed:** Background `rgba(255, 218, 214, 1)`, text `#93000a`

### Input / Search
**Role:** Search and data entry

Background `#f2f2f3`, border 1px solid `#ececec`, border-radius 9999px (search) or 16px (form inputs), padding 16px, placeholder text `#a3a6af`.

### Stat Card with Chart
**Role:** Data display fragment

White floating artifact surface with a bold metric in Sohne 20px weight 500 `#17191c`, a delta line in Sohne 14px `#777b86`, and minimal chart in `#003527` or `#416900` stroke.

### Bank Card
**Role:** Connected account display

Background: linear-gradient(135deg, `#003527` 0%, `#064e3b` 100%), text `#ffffff`, border-radius 24px, padding 24px. Contains balance in JetBrains Mono, account number, and bank logo.

### Tag / Category Label
**Role:** Section or content category markers

No background, no border, text in Sohne 14px weight 400 `#979799`. Intentionally ghost-like — typographic tags, not badges.

---

## Do's and Don'ts

### Do
- Use Signifier weight 400 at 44/64/90px for all display and heading copy
- Use the peach `#fbe1d1` card surface at most once per page for editorial emphasis
- Set border-radius to 9999px on all buttons and 24px on all content cards
- Pair every filled pill button with a ghost pill button as a secondary action
- Use Sohne half-step weights (430, 450, 480) for body hierarchy before reaching weight 500
- Keep the 4px base unit: use 4/8/12/16/20/24px for component padding
- Use JetBrains Mono for all financial data (balances, transaction IDs, account numbers)

### Don't
- Don't use chromatic colors beyond the forest/lime/peach palette
- Don't use bold (600+) or semibold (500) weights in Signifier
- Don't apply heavy drop shadows to content cards — only floating artifacts earn elevation
- Don't use border-radius below 16px on cards or below 9999px on buttons
- Don't underline inline text links at rest — the arrow suffix carries the link affordance
- Don't place the peach card on a non-white section background

---

## Quick Color Reference

- text: `#17191c`
- background: `#ffffff`
- border: `#ececec`
- muted text: `#777b86`
- accent: `#fbe1d1`
- primary action: `#003527` (Forest Primary)
- secondary action: `#416900` (Lime Accent)
- success: `#acf847` (Lime Vibrant)
- error: `#ba1a1a`
- card surface: `#f2f2f3`

---

## CSS Custom Properties

```css
:root {
  /* Colors — Steep Foundation */
  --color-ink-black: #17191c;
  --color-paper-white: #ffffff;
  --color-mist-gray: #f2f2f3;
  --color-fog-white: #fafafb;
  --color-slate-gray: #777b86;
  --color-ash-gray: #979799;
  --color-smoke-gray: #a3a6af;
  --color-blush-peach: #fbe1d1;
  --color-sienna-brown: #5d2a1a;

  /* Colors — Forest Intelligence */
  --color-forest-primary: #003527;
  --color-forest-container: #064e3b;
  --color-lime-accent: #416900;
  --color-lime-vibrant: #acf847;
  --color-lime-bright: #91db2a;
  --color-surface-tint: #2b6954;
  --color-error: #ba1a1a;

  /* Typography — Font Families */
  --font-signifier: 'Signifier', 'Source Serif 4', ui-serif, Georgia, serif;
  --font-sohne: 'Inter', 'Söhne', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  /* Typography — Weights */
  --font-weight-regular: 400;
  --font-weight-w430: 430;
  --font-weight-w450: 450;
  --font-weight-w480: 480;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;

  /* Spacing */
  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-20: 20px;
  --spacing-24: 24px;
  --spacing-28: 28px;
  --spacing-32: 32px;
  --spacing-40: 40px;
  --spacing-64: 64px;
  --spacing-80: 80px;

  /* Border Radius */
  --radius-cards: 24px;
  --radius-images: 12px;
  --radius-inputs: 16px;
  --radius-buttons: 9999px;
  --radius-elevatedcards: 20px;

  /* Shadows */
  --shadow-subtle: oklab(0 0 0 / 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.08) 0px 4px 24px 0px;
  --shadow-elevated: 0 0 0 1px rgba(4,23,43,0.05), 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);

  /* Layout */
  --page-max-width: 1200px;
  --section-gap: 80px;
  --sidebar-width: 260px;
}
```

---

## Tailwind Config

```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        // Steep Foundation
        'ink-black': '#17191c',
        'paper-white': '#ffffff',
        'mist-gray': '#f2f2f3',
        'fog-white': '#fafafb',
        'slate-gray': '#777b86',
        'ash-gray': '#979799',
        'smoke-gray': '#a3a6af',
        'blush-peach': '#fbe1d1',
        'sienna-brown': '#5d2a1a',
        
        // Forest Intelligence
        'forest': {
          DEFAULT: '#003527',
          container: '#064e3b',
          light: '#95d3ba',
        },
        'lime': {
          DEFAULT: '#416900',
          vibrant: '#acf847',
          bright: '#91db2a',
        },
        
        // Surfaces
        surface: {
          DEFAULT: '#f9f9ff',
          dim: '#d3daea',
          bright: '#f9f9ff',
          lowest: '#ffffff',
          low: '#f0f3ff',
          container: '#e7eefe',
          high: '#e2e8f8',
          highest: '#dce2f3',
        },
        
        // Semantic
        error: '#ba1a1a',
        'error-container': '#ffdad6',
      },
      
      fontFamily: {
        signifier: ['Signifier', 'Source Serif 4', 'ui-serif', 'Georgia', 'serif'],
        sohne: ['Inter', 'Söhne', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      
      borderRadius: {
        'cards': '24px',
        'images': '12px',
        'inputs': '16px',
        'buttons': '9999px',
        'elevated': '20px',
      },
      
      spacing: {
        'container': '24px',
        'gutter': '16px',
        'card': '20px',
        'section': '80px',
      },
      
      boxShadow: {
        'subtle': 'oklab(0 0 0 / 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.08) 0px 4px 24px 0px',
        'elevated': '0 0 0 1px rgba(4,23,43,0.05), 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
      },
    },
  },
}
```
