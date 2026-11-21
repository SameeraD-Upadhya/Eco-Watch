# EcoWatch Design System Specification

## 1. Design Philosophy & Editorial Character

EcoWatch is engineered as an anti-vibe-coded, data-first civic environmental dashboard. Built with a calm editorial aesthetic, it is intentionally free of generic AI-generated design patterns (such as purple-to-blue neon gradients, glowing cards, decorative blobs, emojis, and stock 3D artwork).

Every visual choice serves hierarchy, clarity, or municipal utility. The interface is light-first, airy, compact, left-aligned, and structured for swift cognitive processing by municipal coordinators, ward inspectors, and citizens.

---

## 2. The 14 Anti-Vibe-Coded Design Directives

| # | Strictly Prohibited Pattern | Implemented Alternative |
|---|---|---|
| 1 | Purple-to-blue or neon gradients | One deep fresh green eco brand hue (`#059669` / `#10B981`). Gradient only on the active nav item and primary CTA with hue shift under 25 degrees. |
| 2 | Gradient text, glowing borders, universal glassmorphism | Flat surfaces, hairline 1px borders (`#E2E8F0` / `#1E293B`). Subtle backdrop blur permitted on sticky header only. |
| 3 | Emojis as icons or bullets | Lucide React icons with uniform 1.5–1.75px stroke width and standardized 16/20/24 size grid. |
| 4 | Uniform identical rounded cards | Structural variation: KPIs in a single divided strip, tables edge-to-edge in panels, charts in unequal column spans (2-col category chart, 1-col donut). |
| 5 | Nested cards inside cards inside cards | Strict maximum of two surface depth levels (canvas `bg-app` and container `bg-surface`). |
| 6 | Centered hero headings | Compact, left-aligned headers with contextual metadata badges. |
| 7 | Decorative blobs, stock 3D art, sparkles | Zero decoration without function. Only purposeful SVG line art for empty states. |
| 8 | Fake stats, testimonials, marketing strips | Completely excluded. Every single metric and KPI is derived from real MongoDB aggregations. |
| 9 | Random color usage | 90% neutral UI. Color is reserved strictly for primary actions, active navigation states, data chart series, and status tokens. |
| 10 | Stock component-library aesthetic | Custom styled primitives tailored to civic ergonomics. |
| 11 | Uniform 24px padding and 16px radius everywhere | Deliberate typographic rhythm: tight inside dense components, spacious between sections. |
| 12 | Hover animations on everything | Motion used strictly to explain state transitions (120–200ms cubic-bezier). Respects `prefers-reduced-motion`. |
| 13 | Pure black on pure white, washed-out greys | Tinted near-black (`#0F172A`), high-contrast muted text exceeding WCAG AA 4.5:1 ratio. |
| 14 | Inconsistent copy | Sentence case throughout, specific domain microcopy ("Log response and mark In Progress", not "Submit"). |

---

## 3. Design Tokens (CSS Variables & Tailwind Config)

### Color Palette (Light & Dark Mapping)

```css
:root {
  /* Brand Tokens - Deep Fresh Green */
  --color-primary: #059669;
  --color-primary-hover: #047857;
  --color-primary-soft: rgba(5, 150, 105, 0.08);
  --color-secondary: #4F46E5;

  /* Status Colors */
  --status-open: #E11D48;
  --status-open-bg: rgba(225, 29, 72, 0.08);
  --status-progress: #D97706;
  --status-progress-bg: rgba(217, 119, 6, 0.08);
  --status-resolved: #059669;
  --status-resolved-bg: rgba(5, 150, 105, 0.08);

  /* Severity Colors */
  --severity-low: #0284C7;
  --severity-low-bg: rgba(2, 132, 199, 0.08);
  --severity-medium: #D97706;
  --severity-medium-bg: rgba(217, 119, 6, 0.08);
  --severity-high: #DC2626;
  --severity-high-bg: rgba(220, 38, 38, 0.08);

  /* Canvas & Neutral Surfaces (Light Mode) */
  --bg-app: #F8FAF9;
  --bg-surface: #FFFFFF;
  --bg-sidebar: #FFFFFF;
  
  --text-primary: #0F172A;
  --text-secondary: #475569;
  --text-muted: #94A3B8;

  --border-subtle: #E2E8F0;
  --border-strong: #CBD5E1;

  --shadow-e1: 0 1px 2px rgba(16, 24, 40, 0.05);
  --shadow-e2: 0 4px 16px rgba(16, 24, 40, 0.06);
  --shadow-e3: 0 16px 40px rgba(16, 24, 40, 0.10);
}

.dark {
  /* Brand Tokens in Dark */
  --color-primary: #10B981;
  --color-primary-hover: #059669;
  --color-primary-soft: rgba(16, 185, 129, 0.12);
  --color-secondary: #6366F1;

  /* Status Colors in Dark */
  --status-open: #F43F5E;
  --status-open-bg: rgba(244, 63, 94, 0.12);
  --status-progress: #F59E0B;
  --status-progress-bg: rgba(245, 158, 11, 0.12);
  --status-resolved: #10B981;
  --status-resolved-bg: rgba(16, 185, 129, 0.12);

  /* Canvas & Neutral Surfaces (Dark Mode) */
  --bg-app: #0B0F12;
  --bg-surface: #131920;
  --bg-sidebar: #0E141B;

  --text-primary: #F1F5F9;
  --text-secondary: #94A3B8;
  --text-muted: #64748B;

  --border-subtle: #1E293B;
  --border-strong: #334155;

  --shadow-e1: 0 1px 3px rgba(0, 0, 0, 0.4);
  --shadow-e2: 0 4px 16px rgba(0, 0, 0, 0.45);
  --shadow-e3: 0 16px 40px rgba(0, 0, 0, 0.6);
}
```

### Shape & Elevation Scale
- **Radius:** `sm`: 8px (inputs, controls), `md`: 12px (buttons, modals), `lg`: 16px (panels, cards), `pill`: 9999px (badges, search, nav pills).
- **Elevation:** `e1` (soft card border shadow), `e2` (dropdowns & tooltips), `e3` (modal dialogs).

### Typography Scale
- Primary Font: `Inter`, with fallbacks to `Manrope`, `system-ui`, `sans-serif`.
- Display: 32px / 40px, bold
- H1: 24px / 32px, bold, tracking `-0.01em`
- H2: 20px / 28px, semi-bold
- H3: 16px / 24px, semi-bold
- Body: 14px / 22px, regular
- Caption: 12px / 18px, medium
- Micro: 11px / 16px, medium
- Figures & Counts: `tabular-nums` for rock-solid tabular data alignment.

---

## 4. The Domain Signature Detail: The Status Spine

### Justification
> **The Status Spine is a vertical physical rail embedded along the margin of every incident card and operational timeline that instantly communicates both current lifecycle stage via color and cumulative municipal effort through tactile intervention notches.**

### Visual & Functional Behavior
1. **Color Encoding:**
   - **Rose (`#E11D48`):** `Open` status — newly reported, pending dispatch.
   - **Amber (`#D97706`):** `In Progress` status — inspection squad deployed or cleanup underway.
   - **Emerald (`#059669`):** `Resolved` status — site cleared and verified.
2. **Tactile Notches:**
   - Circular notches along the vertical rail represent discrete authority responses logged in MongoDB (`report.responses.length`).
   - Each notch provides immediate visual proof of municipal response activity without requiring the user to expand the full detail log.
   - Featured consistently across the **Response Tracker**, report cards, and the **Municipal Hotspot Banner**.

---

## 5. Component Specifications

### 1. Municipal Hotspot Banner
- Amber callout with 1px accent border, Lucide warning shield icon (zero emojis).
- Activates strictly when repeat reports for any `(location_name, category_name)` pair reach `count >= 2`.
- Text generated dynamically: `"Recurring hotspot: {category} in {ward}, {n} repeat reports"`.
- When `count < 2`, transforms into a calm neutral banner: `"No recurring environmental pattern detected across monitored wards."`

### 2. Divided KPI Strip
- One divided card featuring 4 distinct cells: Total Reports, Open Issues, In Progress, and Resolved (+ Resolution Rate %).
- Formatted with `tabular-nums` and animated via Framer Motion count-up on load.
- Displays auxiliary turnaround time (hours) and average responses per report.

### 3. Pure Database-Driven Recharts
- **Category BarChart:** Fill colors derived dynamically from the `color_hex` stored in each MongoDB category document. Rounded top caps, subtle horizontal gridlines, and pill tooltips.
- **Locality Donut:** Displays relative share of ward complaints with centered total count in the donut hole.
- **Stacked Status BarChart:** Visualizes workflow progression (Open, In Progress, Resolved) per ward.

### 4. Citizen Observation Portal
- Real-time client-side validation with inline error messages.
- Dynamic dropdowns populated strictly from MongoDB categories and wards.
- Severity segmented control with Sky / Amber / Red indicators.
- Live character counter on observation description (5 to 2000 characters).
- Guided empty prompt directing coordinators to master data setup if collections are empty.

### 5. Master Data & Bulk Ingestion Manager
- Side-by-side forms for category administration (with civic preset palette and hex picker) and ward management.
- Live collections list displaying registration date and counts.
- Drag-and-drop bulk ingestion panel supporting `.json` and `.csv` datasets with pre-import preview, reference resolution, and row-by-row error reporting.
