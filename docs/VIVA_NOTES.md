# EcoWatch: System Architecture, Design Decisions & Viva Defense Guide

**Project Title:** EcoWatch: Community Environmental Monitoring & Citizen Reporting System  
**Focus Region:** Mysuru City Corporation (MCC) Jurisdictional Area  
**Academic Requirement:** "Design a simple citizen-reporting application and analyze recurring environmental issues."

---

## 1. Executive Summary & Assignment Alignment

EcoWatch is an end-to-end civic-tech environmental monitoring and response management platform designed for municipal environmental governance. It addresses the recurring civic challenges in Mysuru—such as underground drainage (UGD) overflows, illegal solid waste dumping, lake contamination, and festival-season noise pollution.

### Assignment Deliverables Matrix
| Assignment Component | EcoWatch Implementation |
|---|---|
| **Inputs** | Citizen observations (with photo evidence, severity, and landmark), issue categories (with SLA and assigned authority), locations (65 MCC wards across 9 zones), response records (audit log with action taken and officer identity). |
| **Tools** | Web/mobile PWA prototype (React + Vite + Tailwind design tokens), database (MongoDB `eco_monitor`), interactive analytical charts (Recharts + SVG Centroid Hotspot Map). |
| **Outputs** | Real-time community monitoring dashboard, recurrence ranking table, SLA compliance tracking, citizen reporting portal with duplicate nudge, response tracker with coordinator state machine. |

---

## 2. Tech Stack & Architectural Rationale

### Layer Breakdown
- **Frontend:** React 18, Vite 5, Tailwind CSS (semantic design tokens), Lucide React, Framer Motion, Recharts.
- **Backend:** Python 3.14, FastAPI, Pydantic v2, PyMongo 4.
- **Database:** Local MongoDB 8.x running on `mongodb://localhost:27017/`, database `eco_monitor`.
- **Styling Architecture:** Single warm paper civic theme (`#F6F2E9` canvas, `#1F2A24` ink, `#2F5D46` forest green). No raw Tailwind color classes; all visual values originate from CSS custom properties.
- **Typography:** Self-hosted `@fontsource/source-serif-4` (editorial serif headings) and `@fontsource/public-sans` (clear tabular sans-serif body). Zero external Google Fonts CDN requests.

### Architectural Rationale
1. **Why FastAPI over Flask / Django?**
   - Native asynchronous support and modern Python type hinting.
   - Pydantic v2 validation guarantees strict data contracts and generates real-time OpenAPI documentation.
   - Lightweight footprint with minimal boilerplate.
2. **Why MongoDB over a Relational Database?**
   - Civic environmental reports feature semi-structured attributes: nested response audit trails (`responses: [{ action_taken, updated_by, updated_at }]`), multiple evidence photo attachments, and varying civic metadata.
   - Powerful MongoDB Aggregation Pipeline (`$group`, `$facet`, `$project`, `$sort`) allows calculating real-time recurrence clusters, median intervals, and zone turnaround times without complex multi-table joins.
3. **Why React + Vite instead of Next.js?**
   - For an operational civic dashboard and citizen PWA, a single-page application (SPA) running entirely client-side with an independent FastAPI REST API provides cleaner microservice boundaries and simpler offline caching via standard Service Workers.

---

## 3. Strict Zero-Hardcoded Data Policy

EcoWatch enforces a strict zero-hardcoded-data policy:
1. **Zero Mock Arrays:** There are no `sampleReports`, `mockWards`, or `mockCategories` anywhere in the frontend or backend source code.
2. **Dynamic UI:** Every dropdown option in the Citizen Form, every category filter, every ward combobox item, every chart dataset, and every category color hex is queried dynamically from MongoDB.
3. **Permitted Constants:** Only schema structural enums (`Low`, `Medium`, `High` for severity; `Open`, `In Progress`, `Resolved` for status) exist in code and are served dynamically to the frontend via `GET /api/config/enums`.
4. **Automated Verification:** The project includes `audit_zero_hardcoded.py`, which dynamically extracts all category and ward names from `docs/data/` and scans all source code files, exiting with code 0 only when zero violations exist.

---

## 4. Recurrence & Hotspot Mathematical Logic

A central requirement of the project is analyzing **recurring environmental issues**.

### Mathematical Model
When citizen complaints are aggregated by `(location_name, category_name)`:
1. **Report Volume ($N$):** Count of reports logged for the pair.
2. **Date Range Span:** $\Delta T = T_{\text{last}} - T_{\text{first}}$.
3. **Successive Intervals:** For ordered reports $t_1, t_2, \dots, t_N$, the intervals are $g_i = t_{i+1} - t_i$ in days.
4. **Median Interval ($M_g$):** $\text{Median}(g_1, g_2, \dots, g_{N-1})$.

### Classification Rules
- **Chronic:** $N \ge 5$ (indicates systemic civic infrastructure failure, e.g. Ward 38 Agrahara UGD overflow).
- **Recurring:** $N \in [3, 4]$, or $M_g \le 30\text{ days}$, or $\sum \text{reopened\_count} > 0$.
- **Isolated:** $N \le 2$ with no reopen history.

### Hotspot Alert Trigger
A hotspot alert is automatically triggered when any `(location, category)` cluster reaches $N \ge 2$, surfacing a prominent remediation banner at the top of the analytics dashboard.

---

## 5. Official Mysuru Civic Delimitation & Data Sources

All geographical data in EcoWatch is sourced from official statutory records (documented in `docs/mysuru-sources.md`):
- **Wards:** 65 delimited municipal wards of the Mysuru City Corporation (MCC) established under the Karnataka Municipal Corporations Act, 1976 and MCC Gazette Delimitation.
- **Administrative Zones:** 9 revenue zones (Zone 1 to Zone 9), with zonal offices at Vijayanagar, Krishnamurthypuram, Devaraja Mohalla, Lashkar Mohalla, Vidyaranyapuram, etc.
- **Statutory Civic Authorities:**
  1. **MCC (Mysuru City Corporation):** Waste management, UGD, local parks, street cleanliness.
  2. **KSPCB (Karnataka State Pollution Control Board):** Industrial effluents, lake chemical contamination, severe air and water pollution.
  3. **MUDA (Mysuru Urban Development Authority):** Unapproved layout dumping, lake buffer zone protection, layout infrastructure.
  4. **CHESCOM (Chamundeshwari Electricity Supply Corporation):** Streetlight electrical safety, fallen power lines, civic lighting hazards.
  5. **Karnataka Forest Department (Mysuru Circle):** Tree falls, wild animal encroachment, illegal tree felling around Chamundi Hills.

---

## 6. Remediation Workflow & State Machine

EcoWatch implements a strict finite-state machine (FSM) for complaint tracking:

```
[Open] ------------> [In Progress] ------------> [Resolved]
  ^                                                 |
  |                                                 |
  +------------------- (Reopen) <-------------------+
```

### State Machine Rules
1. **Valid Transitions:**
   - `Open` $\to$ `In Progress`
   - `In Progress` $\to$ `Resolved`
   - `Resolved` $\to$ `In Progress` (Reopened)
   - `Resolved` $\to$ `Open` (Reopened)
2. **Invalid Transitions (Return HTTP 409 Conflict):**
   - Skipping from `Open` directly to `Resolved` without investigation.
   - Transitioning from a state to itself (redundant update).
   - Reopening an already open or in-progress incident.
3. **Turnaround Tracking:**
   - When marked `Resolved`, the server records `resolved_at = UTC_NOW()`.
   - Elapsed remediation turnaround is calculated as:
     $$\text{Turnaround Hours} = \frac{T_{\text{resolved}} - T_{\text{reported}}}{3600}$$
   - When a report is reopened, `resolved_at` is cleared (`None`), and `reopened_count` is incremented.

---

## 7. Civic SLA Compliance Framework

Each category has an authoritative Service Level Agreement (SLA) turnaround limit:
- **UGD & Water Contamination:** 24 Hours (Urgent Public Health Hazard).
- **Solid Waste Dumping & Road Hazards:** 48 Hours.
- **Noise Pollution & Park Maintenance:** 72 Hours.

### Compliance Calculation
$$\text{Authority SLA Compliance \%} = \frac{\text{Count of Resolved Reports where Turnaround} \le \text{SLA Hours}}{\text{Total Resolved Reports}} \times 100$$

The dashboard identifies lagging zones (e.g. Zone 9 with low resolution rates) and displays the top 5 oldest unresolved incident backlog tickets for supervisory intervention.

---

## 8. Security & Engineering Hardening

1. **Search Sanitization:** User search inputs are sanitized using `re.escape()` to prevent Regular Expression Denial of Service (ReDoS) and injection attacks, with length capped at 100 characters.
2. **CORS Restrictions:** Allowed origins are loaded from `.env` (defaulting to the Vite development origin), removing permissive wildcard origins combined with credentials.
3. **Normalized Unique Keys:** Categories and wards utilize case-insensitive normalized keys (`name_key`, `ward_key`) with unique indexes, returning clear duplicate conflict errors naming the conflicting record.
4. **Photo Upload Path Traversal Defense:** Uploaded filenames are sanitized with UUIDs and checked with `os.path.commonpath` to ensure uploaded assets cannot escape the designated `backend/uploads/` directory.
5. **PWA Offline Resilience:** Equipped with a standard Service Worker (`sw.js`) and Web Manifest (`manifest.webmanifest`). Offline submissions are cached locally in `localStorage` (`ecowatch_offline_reports`) and automatically synchronized when network connectivity is re-established.

---

## 9. Common Viva Questions & Model Answers

### Q1: How does your application satisfy the assignment prompt?
> **Answer:** The assignment requires designing a citizen-reporting application and analyzing recurring environmental issues using observations, categories, locations, response records, a database, and charts. EcoWatch implements this end-to-end: citizens submit observations with photo evidence across 10 Mysuru categories and 65 MCC wards; coordinators record audited response logs; MongoDB aggregates recurrence pairs, median gaps, and SLA compliance; and the frontend visualizes these through a recurrence table, time trends, and an interactive centroid dot map.

### Q2: How does the system prevent duplicate citizen complaints?
> **Answer:** In `CitizenForm.jsx`, whenever a citizen selects a category and a ward, a debounced query is dispatched to `GET /api/reports/similar?ward={ward}&category={category}`. If active unresolved tickets exist for that ward and hazard, a "Duplicate Nudge" panel appears showing existing report cards with a 1-click "Corroborate Observation" button. Corroborating increments the existing ticket's corroboration score and appends the citizen's observation note rather than creating redundant tickets.

### Q3: Why is there no dark mode in the application?
> **Answer:** In civic governance and municipal public sector applications, clarity, legibility, and high contrast under daylight conditions are paramount. EcoWatch adheres to an intentional, editorial "warm paper" civic design system (`#F6F2E9` canvas, `#1F2A24` ink) with full WCAG AA contrast compliance (7.0+:1 for body text) and a `@media print` municipal report stylesheet. Dark mode was intentionally removed to ensure a clean, cohesive, single production aesthetic.

### Q4: How do you mathematically identify that an environmental issue is "recurring"?
> **Answer:** In `analytics_routes.py`, reports are grouped by `(location_name, category_name)`. The server calculates the total volume, the date range, and the median elapsed days between successive report timestamps. If a pair has 5 or more reports, it is tagged as "Chronic"; if it has 3 to 4 reports or a median interval of 30 days or less, or has been reopened, it is tagged as "Recurring". This identifies persistent municipal failures, such as UGD overflows in Ward 38 Agrahara.

### Q5: How is zero hardcoded data verified?
> **Answer:** We have an automated script, `audit_zero_hardcoded.py`, which dynamically parses all category and ward names from `docs/data/` and scans all source files in `/frontend/src` and `/backend`. It checks for mock array declarations, literal category/ward strings, raw Tailwind color classes, dark mode classes, and emojis. It exits with code 0 only when all checks pass with zero violations.
