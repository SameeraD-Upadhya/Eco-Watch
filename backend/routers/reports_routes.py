import io
import csv
import json
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, UploadFile, File, status
from bson import ObjectId
from db import get_db, get_next_report_no, utc_now_iso
from config import ALLOWED_SEVERITIES, ALLOWED_STATUSES
from models import (
    ReportCreate,
    ReportResponse,
    ReportUpdateStatus,
    ResponseLogItem,
    BulkImportResponse,
    BulkImportRowError
)

router = APIRouter(prefix="/api/reports", tags=["Reports"])

def format_report_doc(doc: dict) -> ReportResponse:
    return ReportResponse(
        id=str(doc["_id"]),
        report_no=doc["report_no"],
        citizen_name=doc["citizen_name"],
        category_id=str(doc.get("category_id", "")),
        category_name=doc["category_name"],
        location_id=str(doc.get("location_id", "")),
        location_name=doc["location_name"],
        description=doc["description"],
        severity=doc["severity"],
        status=doc["status"],
        reported_at=doc["reported_at"],
        responses=[
            ResponseLogItem(
                action_taken=r["action_taken"],
                updated_by=r["updated_by"],
                updated_at=r["updated_at"]
            )
            for r in doc.get("responses", [])
        ]
    )

@router.get("", response_model=List[ReportResponse])
def get_reports(
    status_filter: Optional[str] = Query(None, alias="status"),
    category_name: Optional[str] = None,
    location_name: Optional[str] = None,
    severity: Optional[str] = None,
    search: Optional[str] = None
):
    db = get_db()
    query = {}

    if status_filter:
        query["status"] = status_filter
    if category_name:
        query["category_name"] = category_name
    if location_name:
        query["location_name"] = location_name
    if severity:
        query["severity"] = severity

    if search and search.strip():
        term = search.strip()
        # Regex or text index search matching citizen_name, description, or report_no
        regex_pattern = {"$regex": term, "$options": "i"}
        or_clauses = [
            {"citizen_name": regex_pattern},
            {"description": regex_pattern},
            {"category_name": regex_pattern},
            {"location_name": regex_pattern}
        ]
        if term.isdigit():
            or_clauses.append({"report_no": int(term)})
        query["$or"] = or_clauses

    cursor = db.reports.find(query).sort("reported_at", -1)
    return [format_report_doc(doc) for doc in cursor]

@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(payload: ReportCreate):
    db = get_db()

    # 1. Resolve Category
    category_doc = None
    if payload.category_id:
        try:
            category_doc = db.categories.find_one({"_id": ObjectId(payload.category_id)})
        except Exception:
            category_doc = None
    if not category_doc and payload.category_name:
        category_doc = db.categories.find_one({"name": payload.category_name})

    if not category_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "CATEGORY_NOT_FOUND", "message": "Specified category does not exist in master data"}
        )

    # 2. Resolve Location
    location_doc = None
    if payload.location_id:
        try:
            location_doc = db.locations.find_one({"_id": ObjectId(payload.location_id)})
        except Exception:
            location_doc = None
    if not location_doc and payload.location_name:
        location_doc = db.locations.find_one({"ward_name": payload.location_name})

    if not location_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "LOCATION_NOT_FOUND", "message": "Specified ward/location does not exist in master data"}
        )

    # 3. Generate atomic report_no and insert
    report_no = get_next_report_no()
    now = utc_now_iso()

    doc = {
        "report_no": report_no,
        "citizen_name": payload.citizen_name.strip(),
        "category_id": str(category_doc["_id"]),
        "category_name": category_doc["name"],
        "location_id": str(location_doc["_id"]),
        "location_name": location_doc["ward_name"],
        "description": payload.description.strip(),
        "severity": payload.severity,
        "status": "Open",
        "reported_at": now,
        "responses": []
    }

    res = db.reports.insert_one(doc)
    doc["_id"] = res.inserted_id
    return format_report_doc(doc)

@router.patch("/{report_no}", response_model=ReportResponse)
def update_report_status(report_no: int, payload: ReportUpdateStatus):
    db = get_db()
    existing = db.reports.find_one({"report_no": report_no})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "REPORT_NOT_FOUND", "message": f"Report #{report_no} not found"}
        )

    response_entry = {
        "action_taken": payload.action_taken.strip(),
        "updated_by": payload.updated_by.strip(),
        "updated_at": utc_now_iso()
    }

    updated = db.reports.find_one_and_update(
        {"report_no": report_no},
        {
            "$set": {"status": payload.status},
            "$push": {"responses": response_entry}
        },
        return_document=True
    )
    return format_report_doc(updated)

@router.delete("/{report_no}", status_code=status.HTTP_200_OK)
def delete_report(report_no: int):
    db = get_db()
    res = db.reports.delete_one({"report_no": report_no})
    if res.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "REPORT_NOT_FOUND", "message": f"Report #{report_no} not found"}
        )
    return {"success": True, "message": f"Report #{report_no} deleted successfully"}

@router.post("/bulk-import", response_model=BulkImportResponse)
async def bulk_import_reports(file: UploadFile = File(...)):
    filename = file.filename.lower() if file.filename else ""
    contents = await file.read()

    rows = []
    if filename.endswith(".json"):
        try:
            data = json.loads(contents.decode("utf-8"))
            if isinstance(data, list):
                rows = data
            elif isinstance(data, dict) and "reports" in data:
                rows = data["reports"]
            else:
                rows = [data]
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "INVALID_JSON", "message": f"Malformed JSON file: {str(e)}"}
            )
    elif filename.endswith(".csv"):
        try:
            decoded = contents.decode("utf-8")
            reader = csv.DictReader(io.StringIO(decoded))
            rows = list(reader)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "INVALID_CSV", "message": f"Malformed CSV file: {str(e)}"}
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "UNSUPPORTED_FORMAT", "message": "Only .json and .csv files are supported for bulk import"}
        )

    db = get_db()
    inserted_count = 0
    skipped_count = 0
    errors: List[BulkImportRowError] = []

    # Palette of clean pastel colors to auto-assign for auto-created categories
    default_colors = ["#10B981", "#059669", "#0284C7", "#D97706", "#7C3AED", "#DB2777"]

    for idx, row in enumerate(rows, start=1):
        try:
            citizen_name = (row.get("citizen_name") or "").strip()
            cat_name = (row.get("category_name") or row.get("category") or "").strip()
            loc_name = (row.get("location_name") or row.get("ward_name") or row.get("ward") or "").strip()
            desc = (row.get("description") or "").strip()
            sev = (row.get("severity") or "Medium").strip().capitalize()

            if not citizen_name:
                raise ValueError("Missing citizen_name")
            if not cat_name:
                raise ValueError("Missing category_name")
            if not loc_name:
                raise ValueError("Missing location_name (ward)")
            if not desc or len(desc) < 5:
                raise ValueError("Description must be at least 5 characters")
            if sev not in ALLOWED_SEVERITIES:
                raise ValueError(f"Invalid severity '{sev}'. Must be one of {ALLOWED_SEVERITIES}")

            # Resolve or create category
            cat_doc = db.categories.find_one({"name": cat_name})
            if not cat_doc:
                color_hex = default_colors[db.categories.count_documents({}) % len(default_colors)]
                cat_doc = {
                    "name": cat_name,
                    "description": f"Auto-created from import row {idx}",
                    "color_hex": color_hex,
                    "created_at": utc_now_iso()
                }
                c_res = db.categories.insert_one(cat_doc)
                cat_doc["_id"] = c_res.inserted_id

            # Resolve or create location
            loc_doc = db.locations.find_one({"ward_name": loc_name})
            if not loc_doc:
                loc_doc = {
                    "ward_name": loc_name,
                    "zone": row.get("zone", "General").strip() or "General",
                    "created_at": utc_now_iso()
                }
                l_res = db.locations.insert_one(loc_doc)
                loc_doc["_id"] = l_res.inserted_id

            # Generate report
            report_no = get_next_report_no()
            status_val = (row.get("status") or "Open").strip()
            if status_val not in ALLOWED_STATUSES:
                status_val = "Open"

            reported_at_val = row.get("reported_at") or utc_now_iso()

            # Optional responses array if present in row
            responses_list = []
            if "responses" in row and isinstance(row["responses"], list):
                for resp in row["responses"]:
                    if isinstance(resp, dict) and "action_taken" in resp:
                        responses_list.append({
                            "action_taken": resp.get("action_taken", ""),
                            "updated_by": resp.get("updated_by", "Authority Officer"),
                            "updated_at": resp.get("updated_at", utc_now_iso())
                        })

            report_doc = {
                "report_no": report_no,
                "citizen_name": citizen_name,
                "category_id": str(cat_doc["_id"]),
                "category_name": cat_doc["name"],
                "location_id": str(loc_doc["_id"]),
                "location_name": loc_doc["ward_name"],
                "description": desc,
                "severity": sev,
                "status": status_val,
                "reported_at": reported_at_val,
                "responses": responses_list
            }

            db.reports.insert_one(report_doc)
            inserted_count += 1
        except Exception as e:
            skipped_count += 1
            errors.append(BulkImportRowError(
                row=idx,
                error=str(e),
                data={k: v for k, v in row.items() if isinstance(v, (str, int, float, bool))}
            ))

    return BulkImportResponse(
        total_rows=len(rows),
        inserted=inserted_count,
        skipped=skipped_count,
        errors=errors
    )
