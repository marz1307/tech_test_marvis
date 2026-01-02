from __future__ import annotations

import csv
from pathlib import Path
from typing import Any, Optional, Literal
from uuid import UUID

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError

# ---- existing app setup (kept) ----
app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:4200",
    "http://127.0.0.1",
    "http://127.0.0.1:4200",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- existing endpoints (kept) ----
@app.get("/")
async def root():
    return {"message": "Dashboard Page"}


@app.get("/health")
def health():
    return {"status": "ok"}


# ============================
# NEW: CSV ingestion + schema
# ============================

class CustomerRecord(BaseModel):
    account_uuid: UUID = Field(..., alias="Account UUID")
    account_label: str = Field(..., min_length=1, alias="Account Label")
    subscription_status: Literal["active", "inactive"] = Field(..., alias="Subscription Status")

    admin_seats: int = Field(..., ge=0, alias="Admin Seats")
    user_seats: int = Field(..., ge=0, alias="User Seats")
    read_only_seats: int = Field(..., ge=0, alias="Read Only Seats")
    total_records: int = Field(..., ge=0, alias="Total Records")
    automation_count: int = Field(..., ge=0, alias="Automation Count")
    workflow_title: Optional[str] = Field(None, alias="Workflow Title")
    messages_processed: int = Field(..., ge=0, alias="Messages Processed")
    notifications_sent: int = Field(..., ge=0, alias="Notifications Sent")
    notifications_billed: int = Field(..., ge=0, alias="Notifications Billed")

    class Config:
        populate_by_name = True


class RecordsResponse(BaseModel):
    total: int
    items: list[CustomerRecord]

class SummaryResponse(BaseModel):
    total_accounts: int
    active_accounts: int
    inactive_accounts: int
    total_records_sum: int
    user_seats_sum: int
    read_only_seats_sum: int

DATA: list[CustomerRecord] = []
INVALID_ROWS: list[dict[str, Any]] = []


def _to_int(value: Any) -> int:
    if value is None:
        return 0
    s = str(value).strip()
    if s == "":
        return 0
    return int(float(s))


def load_csv() -> None:
    global DATA, INVALID_ROWS
    DATA = []
    INVALID_ROWS = []

    # sample_data.csv is at the repo root (same level as /backend and /frontend)
    csv_path = Path(__file__).resolve().parent.parent / "sample_data.csv"

    with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)

        for idx, row in enumerate(reader, start=1):
            try:
                # normalise status + optional text
                row["Subscription Status"] = (row.get("Subscription Status") or "").strip().lower()
                wt = (row.get("Workflow Title") or "").strip()
                row["Workflow Title"] = wt if wt else None

                # normalise numerics
                for k in [
                    "Admin Seats",
                    "User Seats",
                    "Read Only Seats",
                    "Total Records",
                    "Automation Count",
                    "Messages Processed",
                    "Notifications Sent",
                    "Notifications Billed",
                ]:
                    row[k] = _to_int(row.get(k))

                rec = CustomerRecord.model_validate(row)
                DATA.append(rec)

            except (ValidationError, ValueError) as e:
                INVALID_ROWS.append({"row_number": idx, "row": row, "error": str(e)})


@app.on_event("startup")
def _startup() -> None:
    load_csv()


# ---- NEW: API endpoints the frontend can call ----
@app.get("/records", response_model=RecordsResponse)
def get_records(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    subscription_status: Optional[Literal["active", "inactive"]] = None,
    q: Optional[str] = None,
) -> RecordsResponse:
    items = DATA

    if subscription_status:
        items = [r for r in items if r.subscription_status == subscription_status]

    if q:
        q2 = q.strip().lower()
        items = [
            r
            for r in items
            if (q2 in r.account_label.lower())
            or (r.workflow_title and q2 in r.workflow_title.lower())
        ]

    total = len(items)
    page = items[offset : offset + limit]
    return RecordsResponse(total=total, items=page)


@app.get("/ingestion-report")
def ingestion_report() -> dict[str, Any]:
    return {
        "loaded_records": len(DATA),
        "invalid_rows": len(INVALID_ROWS),
        "invalid_samples": INVALID_ROWS[:5],
    }
@app.get("/summary", response_model=SummaryResponse)
def get_summary() -> SummaryResponse:
    records = DATA

    total_accounts = len(records)
    active_accounts = sum(1 for r in records if r.subscription_status == "active")
    inactive_accounts = sum(1 for r in records if r.subscription_status == "inactive")

    total_records_sum = sum(r.total_records for r in records)
    user_seats_sum = sum(r.user_seats for r in records)
    read_only_seats_sum = sum(r.read_only_seats for r in records)

    return SummaryResponse(
        total_accounts=total_accounts,
        active_accounts=active_accounts,
        inactive_accounts=inactive_accounts,
        total_records_sum=total_records_sum,
        user_seats_sum=user_seats_sum,
        read_only_seats_sum=read_only_seats_sum,
    )