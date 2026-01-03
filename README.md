# Customer Insights Dashboard - Tech Test

Full-stack data analytics application built with FastAPI (backend) and Angular (frontend) for analyzing subscription and account data.

## Project Overview
This application provides a comprehensive dashboard for analyzing customer subscription data, featuring:

Summary Statistics: Total accounts, active/inactive counts, seat allocation

Data Ingestion Report: Validation metrics and error tracking

Interactive Records Table: Filterable by account name and subscription status

Top 5 Visualization: Bar chart showing accounts by total records

RESTful API: FastAPI backend over a CSV-derived dataset

Comprehensive Testing: 15 tests passing (5 backend pytest + 10 frontend Jasmine/Karma)

## Tech Stack
### Backend
FastAPI - Modern Python web framework

Pandas - Data processing and CSV ingestion

Uvicorn - ASGI server

Pytest - Testing framework

httpx - HTTP client for testing

### Frontend
Angular 19 - Standalone components with Signals

TypeScript - Type-safe development

RxJS - Reactive programming

Jasmine & Karma - Testing framework

## Project Structure
```
starter_template/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── requirements.txt        # Python dependencies
│   ├── sample_data.csv         # Source data
│   └── tests/
│       ├── __init__.py
│       └── test_api.py         # API tests (5 passing)
│
└── frontend/
    ├── src/
    │   └── app/
    │       ├── app.component.ts        # Main dashboard component
    │       ├── app.component.spec.ts   # Component tests (7 passing)
    │       ├── app.component.css       # Force24-inspired styling
    │       ├── app.service.ts          # HTTP service
    │       └── app.service.spec.ts     # Service tests (3 passing)
    ├── package.json
    └── angular.json
```

## Data Validation & Normalization
### Schema Definition
Data is validated using Pydantic models with strict type constraints:

Account UUID: Valid UUID format required

Account Label: Non-empty string (min_length=1)

Subscription Status: Must be exactly "active" or "inactive" (Literal type)

Numeric Fields: All integers >= 0 (Admin Seats, User Seats, Read Only Seats, Total Records, Automation Count, Messages Processed, Notifications Sent, Notifications Billed)

Workflow Title: Optional string field (can be None)

### Data Normalization
The _to_int() helper function handles missing/malformed numeric data:

None or empty strings → converted to 0

Whitespace is stripped from all values

Subscription Status normalized to lowercase

Workflow Title set to None if empty string

### Invalid Data Handling
Rows that fail Pydantic validation are:

Excluded from the main dataset

Tracked in INVALID_ROWS with row number, raw data, and error message

Reported via /ingestion-report endpoint (up to 5 samples shown)

### CSV Loading
Loaded at application startup via @app.on_event("startup")

File location: sample_data.csv at repository root

UTF-8-sig encoding to handle BOM characters

All valid rows stored in-memory as CustomerRecord objects

## Setup Instructions
### Prerequisites
Python 3.8+

Node.js 18+

npm 9+

### Backend Setup
Navigate to backend directory

```bash
cd starter_template/backend
```
Create virtual environment

```bash
python -m venv .venv
```
Activate virtual environment

Windows (PowerShell):

```powershell
.\.venv\Scripts\Activate.ps1
```
macOS/Linux:

```bash
source .venv/bin/activate
```
Install dependencies

```bash
pip install -r requirements.txt
```

### Frontend Setup
Navigate to frontend directory

```bash
cd starter_template/frontend
```
Install dependencies

```bash
npm install
```

## Running the Application
Start Backend Server

```bash
cd starter_template/backend
uvicorn main:app --reload
```
Backend runs on: http://localhost:8000

Start Frontend Server

```bash
cd starter_template/frontend
npm start
```
Frontend runs on: http://localhost:4200

## Testing
### Backend Tests (pytest)
5 API endpoint tests covering:

Health check validation

Data ingestion reporting

Records pagination and filtering

Subscription status filtering

Summary statistics aggregation

Run tests:

```bash
cd starter_template/backend
pytest -v
```
Expected output:

```
============================= test session starts ==============================
platform win32 -- Python 3.14.2, pytest-9.0.2, pluggy-1.6.0 -- C:\Users\marvi\Documents\GitHub\tech_test_marvis\starter_template\backend\.venv\Scripts\python.exe
cachedir: .pytest_cache
rootdir: C:\Users\marvi\Documents\GitHub\tech_test_marvis\starter_template\backend
plugins: anyio-4.12.0
collected 5 items

tests/test_api.py::test_health_ok PASSED                                  [ 20%]
tests/test_api.py::test_ingestion_report_shape PASSED                     [ 40%]
tests/test_api.py::test_records_returns_items PASSED                      [ 60%]
tests/test_api.py::test_records_filter_by_status_active PASSED            [ 80%]
tests/test_api.py::test_summary_endpoint PASSED                           [100%]

============================== 5 passed in 0.63s ===============================
```

### Frontend Tests (Karma/Jasmine)
10 comprehensive tests covering:

Component filtering logic (search + status)

Top 5 chart calculation

Bar width percentage validation

HTTP service method calls

Mock data handling

Run tests:

```bash
cd starter_template/frontend
npm test
```
Expected output:

```
Chrome 143.0.0.0 (Windows 10): Executed 10 of 10 SUCCESS
TOTAL: 10 SUCCESS
```

## Test Coverage Summary
| Layer               | Tests | Status | Time  | Coverage                          |
|---------------------|-------|--------|-------|-----------------------------------|
| Backend API         | 5     | PASS   | 0.63s | All public endpoints covered      |
| Frontend Component  | 7     | PASS   | 0.12s | Filters, computed data, chart util|
| Frontend Service    | 3     | PASS   | 0.12s | All HTTP methods and params       |
| **Total**           | 15    | PASS   | ~0.75s| Comprehensive coverage            |

## API Endpoints
Method | Endpoint | Description | Parameters
--- | --- | --- | ---
GET | /health | Health check | None
GET | /ingestion-report | Data validation report | None
GET | /records | Paginated records | limit, offset, subscription_status, q (optional)
GET | /summary | Aggregate statistics | None

### Example API Calls
Get Summary:

```bash
curl http://localhost:8000/summary
```
Filter Active Accounts:

```bash
curl "http://localhost:8000/records?subscription_status=active&limit=10"
```
Search Accounts:

```bash
curl "http://localhost:8000/records?q=atlas"
```
Ingestion Report:

```bash
curl http://localhost:8000/ingestion-report
```

## Dashboard Features
Summary Cards
- Total Accounts
- Total Records
- Active/Inactive Accounts
- User Seats & Read-Only Seats

Ingestion Report
- Loaded records count
- Invalid rows count
- Sample invalid data (up to 5 examples with error details)

Interactive Filters
- Search by Account Label or Workflow Title (case-insensitive)
- Filter by Subscription Status (Active/Inactive/All)

Top 5 Visualization
- Horizontal bar chart
- Sorted by Total Records (descending)
- Percentage-based width calculation

Responsive Data Table
- Live filtering
- Hover effects
- Mobile-friendly overflow scrolling

## Design & Styling
Custom CSS inspired by Force24 design system:
- Soft lavender background (#f5f2ff)
- Deep navy accents (#17132a)
- Clean card layout with subtle shadows
- Responsive grid system
- Force24-themed purple highlights

## Dependencies
### Backend (requirements.txt)
```
fastapi
uvicorn
pandas
httpx
pytest
```

### Frontend (package.json highlights)
```json
{
  "dependencies": {
    "@angular/core": "^19.0.0",
    "@angular/common": "^19.0.0",
    "rxjs": "~7.8.0"
  },
  "devDependencies": {
    "jasmine-core": "~5.4.0",
    "karma": "~6.4.0"
  }
}
```

## Implementation Notes
### Backend Architecture
- FastAPI with startup event for CSV data loading
- Pydantic models for type-safe validation and serialization
- In-memory data storage (no database required)
- Query parameter validation for filtering and pagination
- Comprehensive error tracking with invalid row reporting

### Frontend Architecture
- Angular Signals for reactive state management
- Standalone components (no NgModules)
- Computed signals for derived data (filters, top5)
- HttpClient with RxJS Observables
- Type-safe interfaces matching backend Pydantic models

## Quality Assurance
- 100% Test Coverage on API endpoints
- Type Safety throughout (TypeScript + Python type hints + Pydantic)
- Error Handling for failed API calls and invalid data
- Responsive Design for mobile/tablet/desktop
- Accessibility considerations (semantic HTML, ARIA labels)
- Data Validation with Pydantic schema enforcement

## License
This project was developed as part of a technical assessment and is intended for evaluation purposes.

## Author
Marvis Osazuwa
GitHub: https://github.com/marvi/tech_test_marvis
