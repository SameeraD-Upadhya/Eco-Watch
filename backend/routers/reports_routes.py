import io
import csv
import json
import re
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, UploadFile, File, status
from fastapi.responses import StreamingResponse
from bson import ObjectId

from db import get_db, get_next_report_no, utc_now_iso, normalize_key
from config import ALLOWED_SEVERITIES, ALLOWED_STATUSES, VALID_STATUS_TRANSITIONS
from models import (
    ReportCreate,
    ReportResponse,
    ReportUpdateStatus,
    ResponseLogItem,
    PaginatedReportsResponse,
    BulkImportResponse,
    BulkImportRowError
)

router = APIRouter(prefix="/api/reports", tags=["Reports"])

def format_report_doc(doc: dict) -> ReportResponse:
    sla_h = doc.get("sla_hours", 48)
    is_overdue = False
    reported_at = doc.get("reported_at")
    status_val = doc.get("status", "Open")
    if reported_at and status_val != "Resolved":
        try:
            r_dt = datetime.fromisoformat(reported_at.replace("Z", "+00:00"))
            deadline = r_dt + timedelta(hours=sla_h)
            if datetime.now(timezone.utc) > deadline:
                is_overdue = True
        except Exception:
            pass

    return ReportResponse(
        id=str(doc["_id"]),
        report_no=doc["report_no"],
        citizen_name=doc["citizen_name"],
        category_id=str(doc.get("category_id", "")),
        category_name=doc["category_name"],
        location_id=str(doc.get("location_id", "")),
        location_name=doc["location_name"],
        landmark=doc.get("landmark", ""),
        lat=doc.get("lat"),
        lng=doc.get("lng"),
        description=doc["description"],
        severity=doc["severity"],
        status=status_val,
        reported_at=doc["reported_at"],
        resolved_at=doc.get("resolved_at"),
        authority_id=str(doc.get("authority_id", "")),
        authority_name=doc.get("authority_name", ""),
        evidence=doc.get("evidence", []),
        responses=[
            ResponseLogItem(
                action_taken=r["action_taken"],
                updated_by=r["updated_by"],
                updated_at=r["updated_at"]
            )
            for r in doc.get("responses", [])
        ],
        reopened_count=int(doc.get("reopened_count", 0)),
        parent_report_no=doc.get("parent_report_no"),
        corroborations=int(doc.get("corroborations", 0)),
        source=doc.get("source", "web"),
        is_overdue=is_overdue,
        sla_hours=sla_h
    )

def build_filter_query(
    status_filter: Optional[str] = None,
    category_name: Optional[str] = None,
    location_name: Optional[str] = None,
    severity: Optional[str] = None,
    search: Optional[str] = None
) -> dict:
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
        # Sanitize and escape search query, cap to 100 characters
        term = re.escape(search.strip()[:100])
        regex_pattern = {"$regex": term, "$options": "i"}
        or_clauses = [
            {"citizen_name": regex_pattern},
            {"description": regex_pattern},
            {"category_name": regex_pattern},
            {"location_name": regex_pattern},
            {"landmark": regex_pattern}
        ]
        if search.strip().isdigit():
            or_clauses.append({"report_no": int(search.strip())})
        query["$or"] = or_clauses

    return query

@router.get("", response_model=PaginatedReportsResponse)
def get_reports(
    status_filter: Optional[str] = Query(None, alias="status"),
    category_name: Optional[str] = None,
    location_name: Optional[str] = None,
    severity: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = Query("newest", enum=["newest", "oldest", "severity", "oldest_unresolved"]),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
):
    db = get_db()
    query = build_filter_query(status_filter, category_name, location_name, severity, search)

    # Determine sort order
    if sort_by == "oldest":
        sort_order = [("reported_at", 1)]
    elif sort_by == "oldest_unresolved":
        # Unresolved first, oldest first
        sort_order = [("status", 1), ("reported_at", 1)]
    elif sort_by == "severity":
        # High -> Medium -> Low
        sort_order = [("severity", 1), ("reported_at", -1)]
    else:
        sort_order = [("reported_at", -1)]

    total = db.reports.count_documents(query)
    skip = (page - 1) * page_size
    cursor = db.reports.find(query).sort(sort_order).skip(skip).limit(page_size)

    items = [format_report_doc(doc) for doc in cursor]
    return PaginatedReportsResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size
    )

@router.get("/export")
def export_reports(
    format: str = Query("csv", enum=["csv", "json"]),
    status_filter: Optional[str] = Query(None, alias="status"),
    category_name: Optional[str] = None,
    location_name: Optional[str] = None,
    severity: Optional[str] = None,
    search: Optional[str] = None
):
    db = get_db()
    query = build_filter_query(status_filter, category_name, location_name, severity, search)
    cursor = db.reports.find(query).sort("reported_at", -1)

    if format == "json":
        reports_list = [format_report_doc(doc).model_dump() for doc in cursor]
        json_str = json.dumps(reports_list, indent=2)
        return StreamingResponse(
            io.BytesIO(json_str.encode("utf-8")),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=ecowatch_reports.json"}
        )
    else:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Report #", "Citizen", "Category", "Ward", "Landmark",
            "Severity", "Status", "Reported At", "Resolved At", "Responses Count", "Authority"
        ])
        for doc in cursor:
            writer.writerow([
                doc["report_no"],
                doc["citizen_name"],
                doc["category_name"],
                doc["location_name"],
                doc.get("landmark", ""),
                doc["severity"],
                doc["status"],
                doc["reported_at"],
                doc.get("resolved_at", ""),
                len(doc.get("responses", [])),
                doc.get("authority_name", "")
            ])
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode("utf-8")),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=ecowatch_reports.csv"}
        )

@router.get("/similar", response_model=List[ReportResponse])
def get_similar_reports(
    ward: str = Query(..., min_length=2),
    category: str = Query(..., min_length=2)
):
    """Duplicate Nudge: Returns open reports matching the ward and category."""
    db = get_db()
    query = {
        "status": {"$in": ["Open", "In Progress"]},
        "location_name": {"$regex": f"^{re.escape(ward.strip())}$", "$options": "i"},
        "category_name": {"$regex": f"^{re.escape(category.strip())}$", "$options": "i"}
    }
    cursor = db.reports.find(query).sort("reported_at", -1).limit(5)
    return [format_report_doc(doc) for doc in cursor]

@router.get("/{report_no}", response_model=ReportResponse)
def get_single_report(report_no: int):
    db = get_db()
    doc = db.reports.find_one({"report_no": report_no})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "REPORT_NOT_FOUND", "message": f"Report #{report_no} not found"}
        )
    return format_report_doc(doc)

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
        category_doc = db.categories.find_one({"name_key": normalize_key(payload.category_name)})

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
        location_doc = db.locations.find_one({"ward_key": normalize_key(payload.location_name)})

    if not location_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "LOCATION_NOT_FOUND", "message": "Specified ward/location does not exist in master data"}
        )

    # 3. Handle corroboration / parent report if specified
    if payload.parent_report_no:
        parent = db.reports.find_one({"report_no": payload.parent_report_no})
        if parent:
            db.reports.update_one(
                {"report_no": payload.parent_report_no},
                {
                    "$inc": {"corroborations": 1},
                    "$push": {
                        "responses": {
                            "action_taken": f"Corroborating observation added by {payload.citizen_name}: {payload.description[:100]}...",
                            "updated_by": "System Corroboration Engine",
                            "updated_at": utc_now_iso()
                        }
                    }
                }
            )

    # 4. Generate atomic report_no and insert
    report_no = get_next_report_no()
    now = utc_now_iso()

    # Resolve responsible authority
    auth_name = ""
    auth_id = category_doc.get("responsible_authority_id")
    if auth_id:
        try:
            auth_doc = db.authorities.find_one({"_id": ObjectId(auth_id)})
            if auth_doc:
                auth_name = auth_doc["name"]
        except Exception:
            pass

    doc = {
        "report_no": report_no,
        "citizen_name": payload.citizen_name.strip(),
        "category_id": str(category_doc["_id"]),
        "category_name": category_doc["name"],
        "location_id": str(location_doc["_id"]),
        "location_name": location_doc["ward_name"],
        "landmark": payload.landmark.strip() if payload.landmark else "",
        "lat": payload.lat or location_doc.get("lat"),
        "lng": payload.lng or location_doc.get("lng"),
        "description": payload.description.strip(),
        "severity": payload.severity,
        "status": "Open",
        "reported_at": now,
        "resolved_at": None,
        "authority_id": str(auth_id) if auth_id else "",
        "authority_name": auth_name,
        "evidence": payload.evidence or [],
        "responses": [],
        "reopened_count": 0,
        "parent_report_no": payload.parent_report_no,
        "corroborations": 0,
        "source": "web",
        "sla_hours": int(category_doc.get("sla_hours", 48))
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

    current_status = existing["status"]
    target_status = payload.status

    # Validate status workflow state machine
    allowed_targets = VALID_STATUS_TRANSITIONS.get(current_status, [])
    if target_status not in allowed_targets:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "INVALID_STATUS_TRANSITION",
                "message": f"Cannot transition report #{report_no} from '{current_status}' to '{target_status}'. Allowed transitions: {allowed_targets}"
            }
        )

    now = utc_now_iso()
    update_ops = {}
    action_note = payload.action_taken.strip()

    # Resolution tracking
    if target_status == "Resolved" and current_status != "Resolved":
        update_ops["$set"] = {
            "status": "Resolved",
            "resolved_at": now
        }
    elif current_status == "Resolved" and target_status == "Open":
        # Reopening a resolved report
        update_ops["$set"] = {
            "status": "Open",
            "resolved_at": None
        }
        update_ops["$inc"] = {"reopened_count": 1}
        action_note = f"[REOPENED] {action_note}"
    else:
        update_ops["$set"] = {"status": target_status}

    response_entry = {
        "action_taken": action_note,
        "updated_by": payload.updated_by.strip(),
        "updated_at": now
    }
    update_ops["$push"] = {"responses": response_entry}

    updated = db.reports.find_one_and_update(
        {"report_no": report_no},
        update_ops,
        return_document=True
    )
    return format_report_doc(updated)

@router.post("/{report_no}/corroborate", response_model=ReportResponse)
def corroborate_report(report_no: int, payload: dict = None):
    db = get_db()
    existing = db.reports.find_one({"report_no": report_no})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "REPORT_NOT_FOUND", "message": f"Report #{report_no} not found"}
        )

    citizen_name = (payload or {}).get("citizen_name", "Anonymous Citizen")
    note = (payload or {}).get("note", "Resident corroborated active observation.")
    now = utc_now_iso()

    db.reports.update_one(
        {"report_no": report_no},
        {
            "$inc": {"corroborations": 1},
            "$push": {
                "responses": {
                    "action_taken": f"Corroborating observation by {citizen_name}: {note}",
                    "updated_by": "Citizen Corroboration Engine",
                    "updated_at": now
                }
            }
        }
    )
    updated = db.reports.find_one({"report_no": report_no})
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

    # Enforce file size limit: 5MB
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={"code": "FILE_TOO_LARGE", "message": "Bulk import file exceeds maximum allowed size of 5MB"}
        )

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

    # Enforce row limit: 1000 rows
    if len(rows) > 1000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "ROW_LIMIT_EXCEEDED", "message": f"Bulk import exceeds maximum of 1000 rows (received {len(rows)})"}
        )

    db = get_db()
    # Read default config values from app_config collection
    cfg = db.app_config.find_one({"_id": "system_config"}) or {}
    default_colors = cfg.get("default_category_colors", [
        "#2F5D46", "#3F7D5A", "#2F6F8F", "#B7791F", "#B4432F", "#6B766D"
    ])
    default_zone = cfg.get("default_zone", "Central Zone")
    default_officer = cfg.get("default_officer_role", "Ward Field Officer")

    inserted_count = 0
    skipped_count = 0
    errors: List[BulkImportRowError] = []
    now_dt = datetime.now(timezone.utc)

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

            # Validate & normalize reported_at
            raw_date = row.get("reported_at")
            if raw_date:
                try:
                    rep_dt = datetime.fromisoformat(str(raw_date).replace("Z", "+00:00"))
                    if rep_dt.tzinfo is None:
                        rep_dt = rep_dt.replace(tzinfo=timezone.utc)
                    # Reject future dates beyond a 5-minute clock skew threshold
                    if rep_dt > now_dt + timedelta(minutes=5):
                        raise ValueError(f"reported_at date cannot be in the future: {raw_date}")
                    reported_at_iso = rep_dt.isoformat()
                except Exception as ex:
                    raise ValueError(f"Invalid reported_at timestamp '{raw_date}': {str(ex)}")
            else:
                reported_at_iso = utc_now_iso()

            # Status workflow validation
            status_val = (row.get("status") or "Open").strip()
            if status_val not in ALLOWED_STATUSES:
                status_val = "Open"

            resolved_at_iso = None
            if status_val == "Resolved":
                raw_resolved = row.get("resolved_at")
                if raw_resolved:
                    try:
                        res_dt = datetime.fromisoformat(str(raw_resolved).replace("Z", "+00:00"))
                        resolved_at_iso = res_dt.isoformat()
                    except Exception:
                        resolved_at_iso = utc_now_iso()
                else:
                    resolved_at_iso = utc_now_iso()

            # Resolve or create category
            cat_key = normalize_key(cat_name)
            cat_doc = db.categories.find_one({"name_key": cat_key})
            if not cat_doc:
                color_hex = default_colors[db.categories.count_documents({}) % len(default_colors)]
                cat_doc = {
                    "name": cat_name,
                    "name_key": cat_key,
                    "description": f"Created via dataset import",
                    "color_hex": color_hex,
                    "icon": "Tag",
                    "sla_hours": 48,
                    "created_at": utc_now_iso()
                }
                c_res = db.categories.insert_one(cat_doc)
                cat_doc["_id"] = c_res.inserted_id

            # Resolve or create location
            loc_key = normalize_key(loc_name)
            loc_doc = db.locations.find_one({"ward_key": loc_key})
            if not loc_doc:
                loc_doc = {
                    "ward_name": loc_name,
                    "ward_key": loc_key,
                    "zone": (row.get("zone") or default_zone).strip(),
                    "localities": [loc_name],
                    "verified": False,
                    "source_note": "Created via dataset import",
                    "created_at": utc_now_iso()
                }
                l_res = db.locations.insert_one(loc_doc)
                loc_doc["_id"] = l_res.inserted_id

            # Process responses array if present
            responses_list = []
            if "responses" in row and isinstance(row["responses"], list):
                for resp in row["responses"]:
                    if isinstance(resp, dict) and "action_taken" in resp:
                        responses_list.append({
                            "action_taken": resp.get("action_taken", ""),
                            "updated_by": resp.get("updated_by", default_officer),
                            "updated_at": resp.get("updated_at", utc_now_iso())
                        })

            report_no = get_next_report_no()
            report_doc = {
                "report_no": report_no,
                "citizen_name": citizen_name,
                "category_id": str(cat_doc["_id"]),
                "category_name": cat_doc["name"],
                "location_id": str(loc_doc["_id"]),
                "location_name": loc_doc["ward_name"],
                "landmark": row.get("landmark", ""),
                "lat": float(row["lat"]) if row.get("lat") else loc_doc.get("lat"),
                "lng": float(row["lng"]) if row.get("lng") else loc_doc.get("lng"),
                "description": desc,
                "severity": sev,
                "status": status_val,
                "reported_at": reported_at_iso,
                "resolved_at": resolved_at_iso,
                "authority_id": str(cat_doc.get("responsible_authority_id", "")),
                "authority_name": row.get("authority_name", ""),
                "evidence": row.get("evidence", []),
                "responses": responses_list,
                "reopened_count": int(row.get("reopened_count", 0)),
                "corroborations": int(row.get("corroborations", 0)),
                "source": "bulk_import",
                "sla_hours": int(cat_doc.get("sla_hours", 48))
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
