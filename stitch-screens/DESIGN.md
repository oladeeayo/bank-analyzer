---
name: Forest Intelligence
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daea'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eefe'
  surface-container-high: '#e2e8f8'
  surface-container-highest: '#dce2f3'
  on-surface: '#151c27'
  on-surface-variant: '#404944'
  inverse-surface: '#2a313d'
  inverse-on-surface: '#ebf1ff'
  outline: '#707974'
  outline-variant: '#bfc9c3'
  surface-tint: '#2b6954'
  primary: '#003527'
  on-primary: '#ffffff'
  primary-container: '#064e3b'
  on-primary-container: '#80bea6'
  inverse-primary: '#95d3ba'
  secondary: '#416900'
  on-secondary: '#ffffff'
  secondary-container: '#acf847'
  on-secondary-container: '#457000'
  tertiary: '#2c2f30'
  on-tertiary: '#ffffff'
  tertiary-container: '#424546'
  on-tertiary-container: '#b0b2b3'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b0f0d6'
  primary-fixed-dim: '#95d3ba'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#0b513d'
  secondary-fixed: '#acf847'
  secondary-fixed-dim: '#91db2a'
  on-secondary-fixed: '#102000'
  on-secondary-fixed-variant: '#304f00'
  tertiary-fixed: '#e1e3e4'
  tertiary-fixed-dim: '#c5c7c8'
  on-tertiary-fixed: '#191c1d'
  on-tertiary-fixed-variant: '#454748'
  background: '#f9f9ff'
  on-background: '#151c27'
  surface-variant: '#dce2f3'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  display-md:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  mono-data:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-margin: 24px
  gutter: 16px
  card-padding: 20px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system is engineered for high-performance financial intelligence. It prioritizes **clarity, trust, and surgical precision**, evoking a sense of institutional reliability while maintaining a modern, accessible edge. The aesthetic is a refined blend of **Corporate Modern** and **Functional Minimalism**, specifically tailored for Business Intelligence (BI) dashboards where information density is paramount.

By utilizing a deep, sophisticated "Forest Green" as the primary anchor, the interface suggests stability and growth. This is contrasted by "Vibrant Lime" for success states and growth indicators, creating a clear visual hierarchy for performance metrics. The overall experience is designed to feel calm under pressure, turning complex transactional data into actionable insights through ample white space and precise geometric alignment.

## Colors

The palette is rooted in a professional "Forest Green" (#064E3B), used for primary branding, navigation anchors, and significant data groupings. "Lime Green" (#84CC16) serves as the primary success indicator and interactive accent, providing a high-visibility contrast against the deep primary and neutral backgrounds.

- **Backgrounds:** Use `#F9FAFB` for the main canvas and `#FFFFFF` for content cards to create subtle elevation.
- **Data Status:** 
    - **Completed:** Lime Green background (10% opacity) with Lime Green text.
    - **Pending:** Amber background (10% opacity) with Amber text.
    - **Failed:** Red background (10% opacity) with Red text.
    - **Internal Transfer:** Forest Green background (10% opacity) with Forest Green text.
- **Grayscale:** Use a tight range of cool grays for borders (`#E5E7EB`) and secondary text (`#6B7280`) to keep the interface crisp and modern.

## Typography

This design system uses **Inter** for all standard UI elements to ensure maximum legibility at small sizes. For numerical financial data and transaction IDs within tables, **JetBrains Mono** is recommended to maintain tabular alignment and prevent digit jumping.

- **Display Levels:** Used for hero metrics like "Total Balance." These should always use a bold weight with tight letter spacing.
- **Body Text:** Standardized at 14px for dashboards to allow for high information density without sacrificing readability.
- **Labels:** Used for table headers and status tags. These should be in semi-bold to distinguish them from data rows.
- **Mobile Scale:** On mobile devices, `display-lg` should scale down to 28px/34px to avoid text wrapping in metric cards.

## Layout & Spacing

The layout utilizes a **12-column fluid grid** for the main dashboard area, allowing for flexible card widths (e.g., 3-column metric cards, 8-column charts, 4-column side panels). 

- **Sidebar:** Fixed at 260px on desktop, collapsing to a 64px icon rail on smaller screens.
- **Margins:** A consistent 24px outer margin ensures the UI feels breathable even when data-heavy.
- **Information Density:** Use an 8px spacing system. For BI-style tables, use "Compact" vertical padding (8px) to maximize the visible row count.
- **Breakpoints:**
    - Desktop: 1200px+ (12 columns)
    - Tablet: 768px - 1199px (8 columns, cards wrap to 2x2)
    - Mobile: <767px (4 columns, all cards stack vertically)

## Elevation & Depth

To maintain a clean, professional aesthetic, this design system avoids heavy shadows, instead using **tonal layers** and **soft outlines**.

- **Surface Levels:** The primary background is tinted light gray (#F9FAFB). Interactive cards and containers use pure white (#FFFFFF).
- **Outlines:** All cards and input fields use a 1px solid border (#E5E7EB). This provides structure without the visual "weight" of a shadow.
- **Interactive Elevation:** On hover, cards may transition to a very soft ambient shadow (0px 4px 20px rgba(0, 0, 0, 0.05)) and a Primary-colored border-bottom (2px) to indicate focus.
- **Overlays:** Modals and dropdowns use a medium-diffusion shadow (0px 10px 30px rgba(0,0,0,0.1)) to clearly separate them from the data grid.

## Shapes

The shape language is consistently "Rounded," striking a balance between the precision of a financial tool and the approachability of a modern SaaS platform.

- **Standard Elements:** Metric cards, input fields, and buttons use a 0.5rem (8px) radius.
- **Large Elements:** Featured "Pro" cards or promotional banners use a 1.5rem (24px) radius to draw the eye.
- **Small Elements:** Status tags and chips use a "Pill" shape (fully rounded) to differentiate them from functional buttons and structural cards.

## Components

### Buttons
- **Primary:** Forest Green background with White text. No border.
- **Secondary:** White background with Forest Green border (1px) and text.
- **Success:** Lime Green background with deep green text (for "Add Funds" or "Complete").

### Data Visualization
- **Bar Charts:** Use Forest Green for primary series and Lime Green for "Target" or "Growth" series.
- **Trend Lines:** Use a 2px stroke width. Positive trends use Lime Green; negative trends use Red.
- **Empty States:** Use monochromatic line icons with light gray fills.

### Status Chips
Small, low-profile labels with capitalized text.
- `Pending`: Amber text on Amber-50 background.
- `Completed`: Lime text on Lime-50 background.
- `Failed`: Red text on Red-50 background.

### Bank Icons
Use a standardized 32x32px container with 8px rounding. Icons should be simplified monochrome glyphs in Forest Green or the bank's specific brand color at 80% saturation.

### Input Fields
- **Default:** White background, 1px Gray-200 border, 14px text.
- **Focus:** 1px Forest Green border with a 2px soft Lime Green outer glow (ring).