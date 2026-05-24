# Design System Strategy: The Institutional Precision System

## 1. Overview & Creative North Star: "The Analytical Sanctuary"

Most trading platforms are designed to trigger adrenaline—neon greens, flashing reds, and chaotic grids. This design system rejects that "gambling" aesthetic in favor of **The Analytical Sanctuary**.

The goal is an "Institutional-lite" experience: the gravitas of a Bloomberg Terminal distilled into the high-fidelity elegance of a modern SaaS. We break the "template" look through **intentional asymmetry**—using wide gutters (Scale 16-24) to let data breathe—and **tonal layering**, where depth is communicated through light and shadow rather than rigid lines. This is a system of quiet confidence, where precision is felt through white space and editorial-grade typography.

---

## 2. Colors & Surface Philosophy

The palette is rooted in deep, academic blues (`primary`) and expansive neutrals. The objective is "Atmospheric Clarity."

### The "No-Line" Rule

Traditional 1px solid borders are strictly prohibited for sectioning. To separate a sidebar from a main feed, do not draw a line. Instead, shift the background:

- **Main Canvas:** `surface` (#f7f9fb)
- **Sidebar/Navigation:** `surface-container-low` (#f2f4f6)
- **Primary Action Area:** `surface-container-lowest` (#ffffff)

### Surface Hierarchy & Nesting

Treat the UI as a physical stack of fine stationery.

- **Level 0 (Base):** `surface`
- **Level 1 (Sections):** `surface-container`
- **Level 2 (Interactive Cards):** `surface-container-lowest` (This creates a "pop" against the slightly darker base without needing a heavy shadow).

### The "Glass & Gradient" Rule

To elevate the "institutional" feel, use Glassmorphism for floating overlays (e.g., Command Palettes or Dropdowns).

- **Recipe:** `surface-container-lowest` at 80% opacity + 20px Backdrop Blur.
- **Signature Textures:** Apply a subtle linear gradient to Hero headers or Primary CTAs: `primary` (#246aac) to `primary-container` (#24567f) at a 135-degree angle. This adds "soul" and prevents the app from feeling like a flat wireframe.

---

## 3. Typography: Editorial Authority

We utilize a dual-font strategy to balance character with readability.

- **Display & Headlines (Manrope):** Chosen for its geometric precision. Use `display-md` for portfolio totals to give them a "monumental" feel.
- **Body & Labels (Inter):** The workhorse. Inter provides the high-legibility required for dense trading logs and execution data.

**Hierarchy as Identity:**
Always pair a `label-md` (uppercase, tracked out +5%) in `secondary` color above a `headline-sm` in `on-surface`. This "Overline" style mimics premium financial journals and signals professional-grade organization.

---

## 4. Elevation & Depth: Tonal Layering

We do not use structural lines to define data. We use light.

- **The Layering Principle:** Place a `surface-container-lowest` card on top of a `surface-container-low` background. The subtle 2-step delta in hex value creates a soft, natural lift.
- **Ambient Shadows:** For floating elements (Modals/Popovers), use an extra-diffused shadow: `0px 12px 32px rgba(25, 28, 30, 0.04)`. The shadow is tinted with the `on-surface` color to feel like natural ambient occlusion.
- **The "Ghost Border" Fallback:** If a border is required for accessibility in data tables, use `outline-variant` (#c0c8cc) at **15% opacity**. It should be felt, not seen.

---

## 5. Components: Precision Primitives

### Buttons & Interaction

- **Primary:** Gradient of `primary` to `primary-container`. Corner radius: `md` (0.375rem), reflecting the default moderate roundedness. No shadow.
- **Secondary:** `surface-container-highest` background with `on-surface` text. This feels "integrated" into the UI rather than "pasted on."
- **Tertiary (Ghost):** No background. Use `primary` text. Reserved for low-emphasis actions like "Cancel" or "Clear Filters."

### Data Inputs & Fields

- **Text Inputs:** Use `surface-container-low` as the fill. On focus, transition the background to `surface-container-lowest` and apply a 1px `primary` ghost border (20% opacity).
- **Checkboxes/Radios:** Never use default browser styling. Use `primary` for the selected state to maintain the "Institutional-lite" vibe.

### Cards & Lists

- **The Divider Forbid:** Never use `
` tags or border-bottoms. Use Spacing Scale `5` (1.7rem) or `6` (2rem) to separate list items, adhering to the normal spacing.

- **Trading Journal Specifics:**
- **Performance Chips:** Use `secondary_container` for neutral trades. Avoid bright "Success Green"; instead, use `primary_fixed` for positive metrics to keep the vibe calm.
- **Metric Groups:** Group related data (e.g., Win Rate, Profit Factor) on a `surface-container-high` plinth to visually "set them apart" from the log.

---

## 6. Do’s and Don’ts

### Do

- **Do** use asymmetrical layouts. A wide left margin for a title followed by a condensed data column creates a high-end, bespoke feel.
- **Do** use `on-surface-variant` for helper text. It maintains readability while receding into the background hierarchy.
- **Do** lean into the Spacing Scale. If a layout feels "crowded," jump two steps up the scale (e.g., from `4` to `6`).

### Don’t

- **Don’t** use pure black (#000) or high-contrast grey borders. It breaks the "Institutional-lite" softness.
- **Don’t** use neon or high-vibrancy accents. Even for "Buy" signals, use the sophisticated `primary_fixed_dim` blue.
- **Don’t** use standard "Drop Shadows" (Offset 2px, Blur 4px). They feel dated. Use the Ambient Shadow recipe or Tonal Layering.
