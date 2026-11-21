# EcoWatch: Community Environmental Monitoring & Citizen Reporting System

**Academic Context:** CSE Final / Capstone Project  
**Candidate:**  | **USN:**   
**Regional Focus:** Mysuru Municipal Corporation (Dynamic MongoDB Data Architecture)

---

## 1. Architectural Overview & System Governance

EcoWatch is a civic-tech environmental monitoring platform connecting citizens with municipal authorities. It provides an operational response queue, real-time analytics, and localized hotspot detection for civic environmental hazards (solid waste accumulation, water body contamination, industrial effluent, noise hazards, and illegal clearing).

### Core Engineering Invariants
- **Zero Hardcoded Data:** There are zero hardcoded categories, localities, wards, report arrays, or mock datasets in the codebase. Every dropdown option, table row, chart bar, and KPI figure is queried dynamically from MongoDB.
- **Pure Dynamic Enums:** Only structural schema invariants (`Low`, `Medium`, `High` for severity; `Open`, `In Progress`, `Resolved` for status) are defined as constants and are served dynamically to the frontend via `GET /api/config/enums`.
- **Pure MongoDB Analytics Aggregation:** Real-time aggregation pipelines using `$facet`, `$group`, `$sort`, and `$project` compute KPIs, ward breakdowns, category shares, and automated hotspot alerts (triggered when repeat occurrences of a location-category pair reach `count >= 2`).

---

## 2. Monorepo Structure

```
/Eco-Watch
├── README.md                          # Production deployment & usage guide
├── DESIGN_SYSTEM.md                   # Tokens, component specs & signature detail
├── audit_zero_hardcoded.py            # Automated audit scanner
├── .gitignore                         # Git exclusion rules (including ponytail*)
├── /docs
│   ├── sample-reports.json            # Import template (JSON format)
│   └── sample-reports.csv             # Import template (CSV format)
├── /backend
│   ├── .env                           # Environment configuration
│   ├── .env.example                   # Environment configuration template
│   ├── requirements.txt               # Backend dependencies
│   ├── main.py                        # FastAPI entrypoint & CORS middleware
│   ├── config.py                      # Configuration & schema constants
│   ├── db.py                          # MongoDB connection & index initializer
│   ├── models.py                      # Pydantic v2 schemas & error envelopes
│   ├── test_phase1.py                 # Automated backend verification test suite
│   └── routers/
│       ├── config_routes.py           # Health, enums, categories, wards
│       ├── reports_routes.py          # CRUD & multipart bulk ingestion
│       └── analytics_routes.py        # Real-time MongoDB aggregation
└── /frontend
    ├── .env                           # Frontend environment configuration
    ├── .env.example                   # Frontend environment template
    ├── package.json                   # Dependencies (React, Vite, Tailwind, Recharts)
    ├── vite.config.js                 # Vite configuration
    ├── tailwind.config.js             # Tailwind design token mapping
    ├── index.html                     # HTML shell
    └── src/
        ├── main.jsx                   # React DOM root
        ├── App.jsx                    # Application coordinator & tab routing
        ├── index.css                  # CSS variables for light & dark themes
        ├── theme.jsx                  # Persistent dark mode manager
        ├── services/api.js            # Central API client (no fetch in components)
        ├── hooks/                     # Custom hooks (useConfig, useReports, useAnalytics)
        └── components/
            ├── common/                # StatusSpine, Badge, Modal, Skeleton
            ├── layout/                # Shell, Sidebar, Topbar, HeaderBadge
            ├── citizen/               # Citizen observation submission form
            ├── tracker/               # Report feed, filters, coordinator action modal
            ├── master/                # Categories, wards, bulk dataset ingestion
            └── dashboard/             # Hotspot banner, KPI strip, Recharts
```

---

## 3. Getting Started: Exact Terminal Commands

### Step 3.1: Start MongoDB Service

#### Windows
Ensure the local MongoDB service is running (default port `27017`):
```powershell
# Check MongoDB service status
Get-Service MongoDB

# If stopped, start the service
Start-Service MongoDB
```

#### Linux (systemd)
```bash
sudo systemctl start mongod
sudo systemctl status mongod
```

#### macOS (Homebrew)
```bash
brew services start mongodb-community
```

---

### Step 3.2: Set Up and Run FastAPI Backend

```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment (if not already created)
python -m venv venv

# Activate virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Windows (cmd):
venv\Scripts\activate.bat
# On Linux/macOS:
source venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Run backend test suite to verify connectivity and schema indexes
python test_phase1.py

# Launch FastAPI backend with Uvicorn
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend runs on `http://127.0.0.1:8000`. Interactive OpenAPI documentation is available at `http://127.0.0.1:8000/docs`.*

---

### Step 3.3: Set Up and Run Vite Frontend

Open a separate terminal window:
```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Run Vite development server
npm run dev
```
*Frontend runs on `http://127.0.0.1:5173`.*

---

## 4. First-Time User Operation Sequence

Because EcoWatch enforces a strict zero-hardcoded-data policy, follow this operational sequence when launching against a clean database:

1. **Check System Health:** Open `http://localhost:5173`. Observe the sticky topbar indicator badge displaying `MongoDB: Connected (eco_monitor)` with live collection counts.
2. **Observe Guided Empty Prompt:** Navigate to the **Citizen Portal**. Notice that because no categories or wards exist yet, the system displays the "Master Data Setup Required" prompt directing you to setup master data.
3. **Register Master Data:**
   - Click **Master Data & Ingestion** in the sidebar.
   - Register environmental categories (e.g. `Solid Waste Dumping` with `#10B981`, `Water Body Contamination` with `#0284C7`).
   - Register municipal wards (e.g. `Kuvempunagar`, `Gokulam`, `Jayalakshmipuram`).
4. **Ingest Sample Dataset (Optional):**
   - In the **Master Data & Ingestion** view, click "Download Template .json" or "Template .csv".
   - Drag and drop `/docs/sample-reports.json` or `/docs/sample-reports.csv` into the ingestion zone.
   - Click **Ingest Dataset**. The backend automatically validates each row, creates missing categories/wards on the fly, and returns the inserted/skipped summary with a per-row error table.
5. **Lodge Citizen Observations:**
   - Switch to the **Citizen Portal**. The dynamic dropdowns now populate directly from MongoDB.
   - Submit an observation report. The report automatically increments `report_no` atomically and queues with `Open` status.
6. **Track and Remediate:**
   - Switch to the **Response Tracker**.
   - Use the multi-tiered filter bar to filter by status, category, ward, severity, or free-text search.
   - Observe the **Status Spine** signature detail: vertical rail displaying status color with circular notches for every logged action.
   - Click **Log Authority Action** to record officer intervention notes and transition the status to `In Progress` or `Resolved`.
7. **Monitor Real-Time Analytics:**
   - Switch to **Live Analytics**.
   - Observe the 4-cell KPI strip with tabular figures and animated count-up.
   - When any `(ward, category)` pair has 2 or more reports, notice the amber **Municipal Hotspot Alert** banner trigger automatically.
   - Review the Category BarChart (rendered with database color hexes), Locality Donut, and Stacked Status composition per ward.

---

## 5. Automated Verification & Auditing Commands

Run the zero-hardcoded audit scanner to prove that no mock arrays or literal locality names exist in source code:
```bash
python audit_zero_hardcoded.py
```

Run the complete backend integration test suite:
```bash
python backend/test_phase1.py
```

Test production frontend compilation:
```bash
cd frontend && npm run build
```
