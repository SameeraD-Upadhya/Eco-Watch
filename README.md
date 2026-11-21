# EcoWatch: Community Environmental Monitoring & Citizen Reporting System

A civic-tech environmental monitoring, citizen grievance reporting, and municipal remediation platform designed for the **Mysuru City Corporation (MCC)** jurisdictional area.

---

## 1. Overview & Core Features

EcoWatch bridges citizens, field officers, and municipal supervisors to detect, report, track, and analyze recurring civic environmental issues across 65 municipal wards and 9 administrative revenue zones in Mysuru.

- **Citizen Observation Portal:** Progressive Web App (PWA) with client-side image compression (HTML5 Canvas max 1600px), ward combobox with zone grouping and locality search, landmark precision, 3-tier civic severity indicators, and duplicate nudge with 1-click corroboration.
- **Offline Resilience:** Service Worker shell cache with local queueing in `localStorage` and automatic background synchronization upon network reconnection.
- **Response Tracker & Audit Trail:** Coordinator dashboard with server-side pagination, sorting, SLA countdown badges ("Within SLA" vs "Overdue"), evidence expansion modal, session-persisted coordinator identity, and finite-state machine transitions (`Open` → `In Progress` → `Resolved`, with reopen tracking).
- **Recurrence & Hotspot Analytics:** MongoDB aggregation pipelines computing top 10 recurrence clusters, median successive intervals, Chronic/Recurring/Isolated classifications, weekly intake velocity, monthly seasonality (highlighting Dasara festival surge), SLA compliance % per statutory authority, and lagging administrative zones.
- **Geographic Hotspot Map:** Interactive SVG centroid map of Mysuru wards with circles proportional to complaint volume, color-coded by prevailing environmental issue, and accessible data table alternative.
- **Zero Hardcoded Data Architecture:** Zero mock datasets or embedded locality/category arrays. All categories, wards, authorities, reports, and chart datasets load dynamically from MongoDB.
- **Warm Paper Civic Design System:** Thoughtful light-only palette (`#F6F2E9` canvas, `#1F2A24` ink, `#2F5D46` forest green) with self-hosted typography (`@fontsource/source-serif-4` and `@fontsource/public-sans`), WCAG AA contrast compliance, and `@media print` municipal report stylesheet.

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 5, Tailwind CSS, Lucide React, Framer Motion, Recharts |
| **Backend** | Python 3.14 / 3.10+, FastAPI, Pydantic v2, PyMongo 4, Uvicorn |
| **Database** | Local MongoDB 8.x (`mongodb://127.0.0.1:27017/eco_monitor`) |
| **Design System** | Warm Paper Civic Palette, 100% semantic CSS variables, self-hosted fonts |
| **PWA & Offline** | Web Manifest (`manifest.webmanifest`), Service Worker (`sw.js`), `localStorage` queue |

---

## 3. Monorepo Structure

```
/Eco-Watch
├── README.md                          # Production deployment & usage guide
├── DESIGN_SYSTEM.md                   # Tokens, component specs & WCAG contrast table
├── audit_zero_hardcoded.py            # Automated architectural compliance scanner
├── run_app.py                         # Unified cross-platform single run script
├── run_app.bat                        # Windows batch wrapper
├── run_app.ps1                        # PowerShell wrapper
├── /backend
│   ├── .env                           # Backend environment variables
│   ├── .env.example                   # Environment template
│   ├── requirements.txt               # Python package dependencies
│   ├── main.py                        # FastAPI entrypoint, CORS, lifespan & upload endpoints
│   ├── config.py                      # App settings & structural schema enums
│   ├── db.py                          # MongoDB connection & index initialization
│   ├── models.py                      # Pydantic v2 schemas & request/response envelopes
│   ├── test_backend.py                # Automated backend test suite (15 tests)
│   ├── uploads/                       # Safe media upload directory
│   └── routers/
│       ├── config_routes.py           # Health, enums, categories, locations, master loader
│       ├── reports_routes.py          # Report CRUD, status FSM, export, similar search
│       └── analytics_routes.py        # Real-time MongoDB recurrence & performance aggregation
├── /frontend
│   ├── .env                           # Frontend environment variables
│   ├── package.json                   # Dependencies & scripts
│   ├── vite.config.js                 # Vite bundler configuration
│   ├── tailwind.config.js             # Semantic CSS token mappings
│   ├── index.html                     # HTML5 shell with PWA manifest & self-hosted fonts
│   ├── public/                        # PWA manifest, service worker, icons (192px, 512px, SVG)
│   └── src/
│       ├── main.jsx                   # React DOM root & service worker registration
│       ├── App.jsx                    # Root coordinator, tab routing, offline banner & queue sync
│       ├── index.css                  # Design tokens, typography & @media print styles
│       ├── services/api.js            # Central REST client (no URLs in components)
│       ├── hooks/                     # Custom hooks: useConfig, useReports, useAnalytics
│       └── components/
│           ├── common/                # CategoryIcon, StatusSpine, Modals
│           ├── layout/                # Shell, Sidebar (200px rail), Topbar (48px header)
│           ├── citizen/               # CitizenForm, WardCombobox, EmptyMasterDataPrompt
│           ├── tracker/               # ResponseTracker, ReportCard, CoordinatorActionModal
│           ├── master/                # MasterDataManager, CategoryManager, LocationManager
│           └── dashboard/             # AnalyticsDashboard, RecurrenceTable, HotspotMap, TrendChart...
├── /scripts
│   └── load_master_data.py            # Idempotent master data & demo reports loader CLI
└── /docs
    ├── mysuru-sources.md              # Official citations: MCC 65 wards, 9 zones, authorities
    ├── VIVA_NOTES.md                  # Comprehensive viva defense & architectural guide
    └── data/
        ├── mysuru-authorities.json    # 5 statutory civic authorities (MCC, KSPCB, MUDA...)
        ├── mysuru-categories.json     # 10 verified environmental hazard categories with SLAs
        ├── mysuru-wards.json          # 65 verified wards with centroids and localities
        └── mysuru-sample-reports.json # 150 realistic reports with recurrence pairs & Dasara spike
```

---

## 4. Quick Start (Single Command)

### Prerequisites
1. **Python 3.10+** (Tested on Python 3.14)
2. **Node.js 18+** (Tested on Node.js v24)
3. **MongoDB Service** running on `mongodb://127.0.0.1:27017`

### Starting MongoDB
```powershell
# Windows
Start-Service MongoDB

# Linux
sudo systemctl start mongod

# macOS
brew services start mongodb-community
```

### Run Everything with One Command
Execute the cross-platform run script from the project root:

```bash
# Using Python
python run_app.py

# Or on Windows PowerShell
.\run_app.ps1

# Or on Windows Command Prompt
run_app.bat
```

The script will:
1. Verify MongoDB connectivity on `localhost:27017`.
2. Start the FastAPI backend on `http://127.0.0.1:8000`.
3. Start the Vite frontend on `http://127.0.0.1:5173`.
4. Wait for both servers to be ready.
5. Automatically open `http://localhost:5173` in your default browser.
6. Gracefully shut down both processes when you press `Ctrl+C`.

---

## 5. Manual Setup & Independent Execution

### 5.1 Backend Setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend API Documentation will be available at:
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

### 5.2 Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend development server will be available at: `http://127.0.0.1:5173`.

---

## 6. Master Data & Demo Dataset Ingestion

EcoWatch contains no embedded data in source code. To populate Mysuru's 5 civic authorities, 10 environmental categories, 65 municipal wards, and 150 demonstration reports:

### Option A: From the Web UI
1. Navigate to the **Master Data** tab (`http://127.0.0.1:5173/?tab=master`).
2. Click the **Load Mysuru Demo Data** button in the header.

### Option B: From the Terminal CLI
```bash
# Ingest master data + 150 demonstration reports
python scripts/load_master_data.py --with-sample-reports

# Or reset database completely and re-seed
python scripts/load_master_data.py --reset --with-sample-reports
```

---

## 7. Automated Verification & Testing

EcoWatch includes comprehensive automated test and audit suites:

### 1. Architectural & Compliance Audit
Scans for zero hardcoded data, zero author credit leakage, zero raw Tailwind colors, zero dark mode classes, and zero emojis:
```bash
python audit_zero_hardcoded.py
```
*Expected Result:* `100% COMPLIANT: ALL ARCHITECTURAL RULES SATISFIED!` (Exit Code `0`).

### 2. Backend Automated Test Suite
Runs 15 end-to-end integration tests covering index initialization, CORS restrictions, regex sanitization, case-insensitive uniqueness, FSM status transitions, pagination, duplicate nudge, and export against an isolated test database:
```bash
python backend/test_backend.py
```
*Expected Result:* `>>> ALL BACKEND HARDENING TESTS PASSED (100%)! <<<`

### 3. Frontend Production Build
Verifies that all JSX templates, Tailwind tokens, and self-hosted fonts compile cleanly:
```bash
npm --prefix frontend run build
```
*Expected Result:* Clean Vite bundle in `frontend/dist` with 0 errors.

---

## 8. REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | MongoDB connection status and collection document counts |
| `GET` | `/api/config/enums` | Structural schema enums (`severity`, `status`) |
| `GET` | `/api/config/app` | Server configuration (`display_timezone: "Asia/Kolkata"`) |
| `GET` | `/api/config/categories` | List active issue categories with SLA and icons |
| `POST` | `/api/config/categories` | Create new category (validates unique normalized key and hex color) |
| `GET` | `/api/config/locations` | List 65 wards with zones and localities |
| `POST` | `/api/config/locations` | Create new ward (validates unique normalized key) |
| `POST` | `/api/config/load-master` | Ingest official Mysuru master datasets |
| `GET` | `/api/reports` | Paginated reports feed with filters and sorting |
| `POST` | `/api/reports` | Lodge new citizen observation (auto-increment report number) |
| `GET` | `/api/reports/{report_no}` | Retrieve single report detail |
| `PATCH` | `/api/reports/{report_no}` | Update status with audited response log (enforces FSM state machine) |
| `GET` | `/api/reports/similar` | Real-time duplicate lookup (`?ward=&category=`) |
| `POST` | `/api/reports/{report_no}/corroborate` | Increment corroboration score and append observation |
| `GET` | `/api/reports/export` | Export reports as CSV or JSON (`?format=csv\|json`) |
| `POST` | `/api/reports/bulk-import` | Multipart CSV / JSON batch report ingestion |
| `POST` | `/api/uploads` | Upload evidence photo attachment |
| `GET` | `/api/uploads/{filename}` | Retrieve uploaded photo with path-traversal protection |
| `GET` | `/api/analytics` | Recurrence clusters, trends, SLA compliance, and centroid map points |

---

## 9. Design System & Documentation Links

- **Design System Specification:** See [DESIGN_SYSTEM.md](file:///D:/Projects/Eco-Watch/DESIGN_SYSTEM.md) for full token architecture, signature design patterns, and WCAG AA contrast ratio table.
- **Viva Defense & Architectural Guide:** See [docs/VIVA_NOTES.md](file:///D:/Projects/Eco-Watch/docs/VIVA_NOTES.md) for detailed viva questions, schema rationale, and recurrence mathematical models.
- **Official Mysuru Citations:** See [docs/mysuru-sources.md](file:///D:/Projects/Eco-Watch/docs/mysuru-sources.md) for gazette references, ward lists, and civic authority jurisdictions.
