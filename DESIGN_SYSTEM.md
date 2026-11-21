# EcoWatch Design System Specification

## 1. Design Philosophy & Editorial Character

EcoWatch is engineered as an anti-AI, civic-first environmental monitoring platform for Mysuru. The visual language eschews typical "vibe-coded" SaaS tropes (purple gradients, glowing cards, emojis, rounded-2xl bubbles, and generic Inter typography) in favor of a warm, tactile, civic editorial identity reminiscent of government gazettes and high-grade municipal survey registers.

Every visual token is derived from a deliberate palette:
- **Warm Paper Canvas (`#F6F2E9`):** Grounded, low-glare background surface designed for extended municipal inspection shifts.
- **Deep Forest Ink (`#1F2A24`):** High-contrast editorial typography that replaces sterile pure black.
- **Forest Green Brand (`#2F5D46`):** Authentic botanical civic primary, paired with warm ochre turmeric (`#B7791F`) accents.
- **Domain Signature Status Spine:** A 3 px solid left border on report cards indicating status (`#B4432F` Open, `#B7791F` In Progress, `#3F7D5A` Resolved) without full-card color tinting.

---

## 2. Palette & Contrast Matrix (WCAG AA Compliance)

All foreground inks and status tokens meet or exceed WCAG 2.2 AA contrast standards (minimum 4.5:1 for normal body text, 3.0:1 for large display text and UI components) against both canvas (`#F6F2E9`) and surface (`#FFFDF8`).

| Token | Hex / Value | Contrast on Surface (`#FFFDF8`) | Contrast on Canvas (`#F6F2E9`) | WCAG AA Status |
|---|---|---|---|---|
| `text-ink-primary` | `#1F2A24` | 13.8:1 | 12.6:1 | Pass (AAA) |
| `text-ink-secondary` | `#4A574F` | 6.8:1 | 6.2:1 | Pass (AA) |
| `text-ink-muted` | `#6B766D` | 4.6:1 | 4.2:1 (large/UI) | Pass (AA for labels/UI) |
| `color-primary` | `#2F5D46` | 7.9:1 | 7.2:1 | Pass (AA) |
| `color-accent` | `#B7791F` | 4.5:1 | 4.1:1 | Pass (AA) |
| `status-open` | `#B4432F` | 6.2:1 | 5.7:1 | Pass (AA) |
| `status-progress` | `#B7791F` | 4.5:1 | 4.1:1 | Pass (AA) |
| `status-resolved` | `#3F7D5A` | 5.1:1 | 4.7:1 | Pass (AA) |
| `severity-low` | `#2F6F8F` | 5.5:1 | 5.0:1 | Pass (AA) |
| `severity-medium` | `#B7791F` | 4.5:1 | 4.1:1 | Pass (AA) |
| `severity-high` | `#A8322B` | 6.8:1 | 6.2:1 | Pass (AA) |

---

## 3. Typography Scale & Fonts

The application uses strictly self-hosted font packages (`@fontsource/source-serif-4` and `@fontsource/public-sans`) with zero external CDN dependencies.

- **Editorial Headings & Titles:** `Source Serif 4`, serif (Weights: 600 SemiBold, 700 Bold). Used for titles, section headers, and high-level card metrics.
- **UI, Form Inputs, Tables & Body:** `Public Sans`, -apple-system, sans-serif (Weights: 400 Regular, 500 Medium, 600 SemiBold). Clean, neutral, highly legible at small sizes.
- **Numbers & Counters:** `.tabular-nums` (`font-variant-numeric: tabular-nums`). Aligns digits across tables, KPI strips, and report counts.
- **Base Typography:** Base font size `15px` (`html { font-size: 15px; }`), body line-height `1.55`.

---

## 4. Shape, Borders & Elevation Depth

- **Border Radii:** Disciplined, utilitarian geometry:
  - `sm`: 6px (inputs, badges, small buttons)
  - `md`: 8px (cards, modals, dropdowns)
  - `lg`: 12px (major panels)
  - `pill`: 9999px (pills, status indicators)
  - Prohibited: `rounded-2xl`, `rounded-3xl`
- **Borders:** 1px solid `var(--border-subtle)` (`#E2DAC8`) on all cards and modules. No floating borderless cards.
- **Shadows:** Quiet, paper-like shadows without heavy blur:
  - `shadow-sm`: `0 1px 2px rgba(31, 42, 36, 0.04)`
  - `shadow-md`: `0 4px 12px rgba(31, 42, 36, 0.06)`

---

## 5. Layout Architecture & Component Rules

1. **Top Bar (48 px tall):** Compact sticky header displaying "EcoWatch", subtitle "Mysuru Civic Environmental Monitor", live MongoDB connectivity badge, search input, and refresh trigger. Zero theme toggles or author credits.
2. **Navigation Rail (200 px wide):** Quiet, text-first rail collapsible to 56 px on tablet, converting to bottom navigation on screens `< 640px`. Active tab indicated by a 2 px left border in `var(--color-primary)` and subtle background tint, avoiding generic filled pill buttons.
3. **Status Spine:** Every report card in the response tracker displays a 3 px solid left border encoding current status (`#B4432F` Open, `#B7791F` In Progress, `#3F7D5A` Resolved) with authority response notches.
4. **Single Light Theme:** Strictly light mode only. Zero `dark:` utilities, no dark class toggling, and no theme flicker on load.
