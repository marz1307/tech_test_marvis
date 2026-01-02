# Customer Insights Dashboard

A full-stack application that ingests customer/account usage data from a CSV file, exposes a FastAPI backend, and presents insights through an Angular dashboard with summary KPIs, ingestion reporting, Top 5 accounts bar chart, and filterable data tables.

---

## Features

### Frontend (Angular)
- **Summary cards** displaying:
  - Total Accounts, Total Records
  - Active/Inactive Accounts
  - User Seats, Read-Only Seats
- **Ingestion Report** section showing:
  - Loaded records count
  - Invalid rows count
  - Invalid samples count
- **Records section** with:
  - **Top 5 Accounts by Total Records** horizontal bar chart
  - **Filterable table** showing all customer records:
    - Search by **Account Label** (case-insensitive)
    - Filter by **Subscription Status** (active/inactive)
  - Locale-aware number formatting (e.g., `281,992`)

### Backend (FastAPI)
- CSV ingestion with Pydantic validation
- JSON API endpoints:
  - `GET /` - Root health message
  - `GET /health` - Health check
  - `GET /summary` - Aggregated KPI metrics
  - `GET /ingestion-report` - CSV loading results
  - `GET /records` - Paginated customer records with filtering
- CORS-enabled for local development
- In-memory data storage (10 customer records from CSV)

---

## Tech Stack

- **Frontend:** Angular 17 (standalone components), TypeScript, RxJS, Angular Signals
- **Backend:** Python 3.10+, FastAPI, Pydantic v2, Uvicorn
- **Testing:** Karma/Jasmine (frontend), Pytest (backend)
- **Data:** CSV ingestion with validation

---

## Project Structure

tech_test_marvis/
├── starter_template/
│ ├── backend/
│ │ ├── main.py # FastAPI application
│ │ ├── requirements.txt # Python dependencies
│ │ └── tests/
│ │ └── test_api.py # Backend tests
│ └── frontend/
│ ├── src/app/
│ │ ├── app.component.ts # Main dashboard component
│ │ ├── app.component.css # Styles
│ │ ├── app.component.spec.ts # Component tests (7 specs)
│ │ ├── app.service.ts # HTTP service layer
│ │ └── app.service.spec.ts # Service tests (3 specs)
│ ├── proxy.conf.json # Dev proxy config
│ └── package.json # npm dependencies
├── sample_data.csv # Customer data (10 records)
└── README.md


---

## Prerequisites

- **Node.js** (LTS v18+ recommended) + **npm**
- **Python 3.10+** (3.11/3.12 supported)
- **Git** for version control

---

## Setup & Run

### 1) Backend (FastAPI)

Open Terminal 1 in `starter_template/backend`:

**Create virtual environment:**
```bash
python -m venv .venv
Activate virtual environment:

Windows (cmd):

text
.venv\Scripts\activate
Windows (PowerShell):

powershell
.\.venv\Scripts\Activate.ps1
macOS/Linux:

bash
source .venv/bin/activate
Install dependencies:

bash
pip install -r requirements.txt
Run the API:

bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
 Backend running at: http://127.0.0.1:8000
 API docs at: http://127.0.0.1:8000/docs

2) Frontend (Angular)
Open Terminal 2 in starter_template/frontend:

Install dependencies:

bash
npm install --legacy-peer-deps
Start development server:

bash
npm run start
OR

bash
npx ng serve
 Frontend running at: http://localhost:4200

Note: The project uses proxy.conf.json to route API calls from Angular dev server to the backend without CORS issues.

API Endpoints
GET /
Root health message.

Response:

json
{
  "message": "Dashboard Page"
}
GET /health
Health check endpoint.

Response:

json
{
  "status": "ok"
}
GET /summary
Returns aggregated KPI metrics.

Response:

json
{
  "total_accounts": 10,
  "active_accounts": 7,
  "inactive_accounts": 3,
  "total_records_sum": 281992,
  "user_seats_sum": 58,
  "read_only_seats_sum": 14
}
GET /ingestion-report
Returns CSV ingestion results.

Response:

json
{
  "loaded_records": 10,
  "invalid_rows": 0,
  "invalid_samples": []
}
GET /records?limit=<number>&offset=<number>&subscription_status=<status>&q=<search>
Returns paginated customer records with optional filters.

Query Parameters:

limit (int, default 20, max 100) - page size

offset (int, default 0) - page offset

subscription_status (optional) - filter by active or inactive

q (optional) - case-insensitive search on Account Label and Workflow Title

Response:

json
{
  "total": 10,
  "items": [
    {
      "Account UUID": "550e8400-e29b-41d4-a716-446655440000",
      "Account Label": "Atlas Systems",
      "Subscription Status": "active",
      "Admin Seats": 2,
      "User Seats": 6,
      "Read Only Seats": 1,
      "Total Records": 18450,
      "Automation Count": 12,
      "Workflow Title": "Onboarding Flow",
      "Messages Processed": 4512,
      "Notifications Sent": 3204,
      "Notifications Billed": 2980
    }
  ]
}
Data Models
Backend (Pydantic)
CustomerRecord - validated CSV row:

account_uuid: UUID

account_label: string (min length 1)

subscription_status: Literal["active", "inactive"]

admin_seats, user_seats, read_only_seats: non-negative integers

total_records, automation_count: non-negative integers

workflow_title: optional string

messages_processed, notifications_sent, notifications_billed: non-negative integers

CSV Ingestion Process:

Reads sample_data.csv from repository root on startup

Validates each row using Pydantic models

Normalizes subscription status to lowercase

Converts numeric strings to integers

Stores valid records in memory (DATA)

Tracks invalid rows (INVALID_ROWS) for inspection

Running Tests
Frontend Tests (Karma/Jasmine)
From starter_template/frontend:

Run all tests:

bash
npm test
OR

bash
npx ng test --watch=false
Run specific test suites:

AppService tests (3 specs):

bash
npx ng test --watch=false --include="**/app.service.spec.ts"
AppComponent tests (7 specs):

bash
npx ng test --watch=false --include="**/app.component.spec.ts"
Test Coverage:

✓ Loads 10 rows by default (no filters)

✓ Filters by active status (7 rows)

✓ Filters by inactive status (3 rows)

✓ Case-insensitive account label search

✓ Combined search + status filters

✓ Top 5 chart sorted by Total Records descending

✓ Bar width percentage calculation (0-100)

✓ HTTP service calls correct endpoints

✓ Query parameters included in requests

Expected output:

text
Executed 10 of 10 SUCCESS
Backend Tests (Pytest)
From starter_template/backend (with venv activated):

bash
pytest -v
OR quick mode:

bash
pytest -q
Frontend Implementation Details
Angular Signals (Reactive State)
State Management:

typescript
loading = signal<boolean>(true);
error = signal<string>('');
ingestionReport = signal<IngestionReport | null>(null);
records = signal<RecordsResponse | null>(null);
summary = signal<SummaryResponse | null>(null);
Computed Signals:

filteredItems() - applies search and status filters to records

top5() - returns top 5 accounts by Total Records (sorted descending)

Filter Properties:

searchText (string) - case-insensitive account label search

statusFilter ('active' | 'inactive' | '') - subscription status filter

Number Formatting
Uses Intl.NumberFormat('en-GB') for thousands separators:

Input: 281992

Output: 281,992

Handles mixed string/number inputs safely via toNumber() helper.

Notes & Assumptions
Data Storage: In-memory for simplicity (10 records). Production would use a database.

CSV Validation: Strict validation on backend - invalid rows excluded from analytics but reported via /ingestion-report.

CSV Location: Fixed at repository root (sample_data.csv). Can be made configurable via environment variables.

Dashboard Design: Prioritizes clarity over visual polish. Uses CSS-only horizontal bars instead of charting libraries.

Filters: Case-insensitive search on Account Label and Workflow Title. Status filter exact-matches normalized lowercase values.

Number Safety: Frontend handles both numeric and string values from API responses.

Troubleshooting
1) "ng is not recognized" (Windows)
Solution: Use npx to run Angular CLI:


npx ng serve
npx ng test --watch=false
2) Backend running but frontend can't fetch data
Check:

Backend accessible: http://127.0.0.1:8000/summary

Frontend using correct terminal in starter_template/frontend

proxy.conf.json exists and points to port 8000

3) npm install fails with peer dependency errors
Solution: Use legacy peer deps flag:

bash
npm install --legacy-peer-deps
4) Python module not found
Solution: Ensure virtual environment is activated:


.venv\Scripts\activate  # Windows
source .venv/bin/activate  # macOS/Linux
5) Tests show "Executed 0 of 0 SUCCESS"
Solution: Check glob pattern matches file names:

bash
npx ng test --watch=false --include="**/app.component.spec.ts"
Git Workflow
Initial commit:

bash
git init
git add .
git commit -m "Initial commit: Customer Insights Dashboard"
git branch -M main
git remote add origin https://github.com/yourusername/tech_test_marvis.git
git push -u origin main
Final submission commit:

bash
git status
git add .
git commit -m "Complete tech test: backend API, frontend dashboard, tests, documentation"
git push origin main
Submission Checklist
 Backend main.py with CSV ingestion and 5 API endpoints

 Frontend dashboard with summary cards, chart, and filters

 10 customer records loaded from sample_data.csv

 Frontend tests: 10 specs (7 component + 3 service)

 Backend tests: pytest suite

 README.md with setup instructions

 Both servers running and tested locally

 Code pushed to GitHub

License
This project is provided for technical assessment purposes.

Author: Marvis Osazuwa
Date: January 2026
Tech Stack: Angular 17 + FastAPI + Python 3.10+