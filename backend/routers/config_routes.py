import json
from pathlib import Path
from fastapi import APIRouter, HTTPException, status
from bson import ObjectId
from pymongo.errors import DuplicateKeyError

from db import get_db, utc_now_iso, normalize_key
from config import DATABASE_NAME, ALLOWED_SEVERITIES, ALLOWED_STATUSES, DISPLAY_TIMEZONE
from models import (
    HealthResponse,
    EnumsResponse,
    AppConfigResponse,
    CategoryCreate,
    CategoryResponse,
    LocationCreate,
    LocationResponse,
    AuthorityCreate,
    AuthorityResponse,
    LandmarkResponse
)

router = APIRouter(prefix="/api", tags=["Configuration & Master Data"])

@router.get("/health", response_model=HealthResponse)
def get_health():
    db = get_db()
    connected = True
    counts = {}
    try:
        db.command("ping")
        counts = {
            "categories": db.categories.count_documents({}),
            "locations": db.locations.count_documents({}),
            "authorities": db.authorities.count_documents({}),
            "reports": db.reports.count_documents({}),
        }
    except Exception:
        connected = False

    return HealthResponse(
        status="healthy" if connected else "degraded",
        database=DATABASE_NAME,
        connected=connected,
        server_time=utc_now_iso(),
        display_timezone=DISPLAY_TIMEZONE,
        collection_counts=counts
    )

@router.get("/config/enums", response_model=EnumsResponse)
def get_enums():
    return EnumsResponse(
        severities=ALLOWED_SEVERITIES,
        statuses=ALLOWED_STATUSES,
        display_timezone=DISPLAY_TIMEZONE
    )

@router.get("/config/app", response_model=AppConfigResponse)
def get_app_config():
    db = get_db()
    cfg = db.app_config.find_one({"_id": "system_config"}) or {}
    return AppConfigResponse(
        display_timezone=cfg.get("display_timezone", DISPLAY_TIMEZONE),
        severities=ALLOWED_SEVERITIES,
        statuses=ALLOWED_STATUSES,
        default_zone=cfg.get("default_zone", "Central Zone"),
        default_officer_role=cfg.get("default_officer_role", "Ward Field Officer")
    )

# Authorities Endpoints
@router.get("/config/authorities", response_model=list[AuthorityResponse])
def list_authorities():
    db = get_db()
    cursor = db.authorities.find().sort("name", 1)
    results = []
    for doc in cursor:
        results.append(AuthorityResponse(
            id=str(doc["_id"]),
            name=doc["name"],
            short_name=doc.get("short_name", ""),
            scope=doc.get("scope", ""),
            contact_note=doc.get("contact_note", ""),
            source_url=doc.get("source_url", ""),
            created_at=doc.get("created_at", utc_now_iso())
        ))
    return results

@router.post("/config/authorities", response_model=AuthorityResponse, status_code=status.HTTP_201_CREATED)
def create_authority(payload: AuthorityCreate):
    db = get_db()
    name_key = normalize_key(payload.name)
    existing = db.authorities.find_one({"name_key": name_key})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "DUPLICATE_AUTHORITY", "message": f"Authority '{payload.name}' already exists (matches '{existing['name']}')"}
        )

    now = utc_now_iso()
    doc = {
        "name": payload.name.strip(),
        "name_key": name_key,
        "short_name": payload.short_name.strip(),
        "scope": payload.scope.strip(),
        "contact_note": payload.contact_note or "",
        "source_url": payload.source_url or "",
        "created_at": now
    }
    res = db.authorities.insert_one(doc)
    return AuthorityResponse(
        id=str(res.inserted_id),
        name=doc["name"],
        short_name=doc["short_name"],
        scope=doc["scope"],
        contact_note=doc["contact_note"],
        source_url=doc["source_url"],
        created_at=doc["created_at"]
    )

# Categories Endpoints
@router.get("/config/categories", response_model=list[CategoryResponse])
def list_categories():
    db = get_db()
    cursor = db.categories.find().sort("name", 1)
    results = []
    # Fetch authority names for mapping
    auth_map = {str(a["_id"]): a["name"] for a in db.authorities.find()}

    for doc in cursor:
        auth_id = str(doc.get("responsible_authority_id", "")) if doc.get("responsible_authority_id") else None
        results.append(CategoryResponse(
            id=str(doc["_id"]),
            name=doc["name"],
            description=doc.get("description", ""),
            color_hex=doc.get("color_hex", "#2F5D46"),
            icon=doc.get("icon", "Tag"),
            responsible_authority_id=auth_id,
            responsible_authority_name=auth_map.get(auth_id) if auth_id else None,
            sla_hours=int(doc.get("sla_hours", 48)),
            created_at=doc.get("created_at", utc_now_iso())
        ))
    return results

@router.post("/config/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(payload: CategoryCreate):
    db = get_db()
    name_key = normalize_key(payload.name)
    existing = db.categories.find_one({"name_key": name_key})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "DUPLICATE_CATEGORY", "message": f"Category '{payload.name}' already exists (matches '{existing['name']}')"}
        )

    auth_name = None
    if payload.responsible_authority_id:
        try:
            auth_doc = db.authorities.find_one({"_id": ObjectId(payload.responsible_authority_id)})
            if auth_doc:
                auth_name = auth_doc["name"]
        except Exception:
            pass

    now = utc_now_iso()
    doc = {
        "name": payload.name.strip(),
        "name_key": name_key,
        "description": payload.description or "",
        "color_hex": payload.color_hex,
        "icon": payload.icon or "Tag",
        "responsible_authority_id": payload.responsible_authority_id,
        "sla_hours": payload.sla_hours or 48,
        "created_at": now
    }
    try:
        res = db.categories.insert_one(doc)
        return CategoryResponse(
            id=str(res.inserted_id),
            name=doc["name"],
            description=doc["description"],
            color_hex=doc["color_hex"],
            icon=doc["icon"],
            responsible_authority_id=doc["responsible_authority_id"],
            responsible_authority_name=auth_name,
            sla_hours=doc["sla_hours"],
            created_at=doc["created_at"]
        )
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "DUPLICATE_CATEGORY", "message": f"Category '{payload.name}' already exists"}
        )

# Landmarks Endpoint
@router.get("/config/landmarks", response_model=list[LandmarkResponse])
def list_landmarks():
    db = get_db()
    cursor = db.landmarks.find({}, {"_id": 0})
    return list(cursor)

# Locations / Wards Endpoints
@router.get("/config/locations", response_model=list[LocationResponse])
def list_locations():
    db = get_db()
    cursor = db.locations.find().sort([("ward_no", 1), ("ward_name", 1)])
    results = []
    for doc in cursor:
        results.append(LocationResponse(
            id=str(doc["_id"]),
            ward_no=doc.get("ward_no"),
            ward_name=doc["ward_name"],
            zone=doc.get("zone", ""),
            localities=doc.get("localities", []),
            lat=doc.get("lat"),
            lng=doc.get("lng"),
            verified=doc.get("verified", True),
            verification_status=doc.get("verification_status", "verified"),
            source_url=doc.get("source_url", ""),
            source_retrieved_on=doc.get("source_retrieved_on", ""),
            geometry_note=doc.get("geometry_note", ""),
            source_note=doc.get("source_note", ""),
            created_at=doc.get("created_at", utc_now_iso())
        ))
    return results

@router.post("/config/locations", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
def create_location(payload: LocationCreate):
    db = get_db()
    ward_key = normalize_key(payload.ward_name)
    existing = db.locations.find_one({"ward_key": ward_key})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "DUPLICATE_LOCATION", "message": f"Ward/Location '{payload.ward_name}' already exists (matches '{existing['ward_name']}')"}
        )

    now = utc_now_iso()
    doc = {
        "ward_no": payload.ward_no,
        "ward_name": payload.ward_name.strip(),
        "ward_key": ward_key,
        "zone": payload.zone or "",
        "localities": payload.localities or [],
        "lat": payload.lat,
        "lng": payload.lng,
        "verified": payload.verified if payload.verified is not None else True,
        "verification_status": payload.verification_status or "verified",
        "source_url": payload.source_url or "",
        "source_retrieved_on": payload.source_retrieved_on or "",
        "geometry_note": payload.geometry_note or "",
        "source_note": payload.source_note or "",
        "created_at": now
    }
    try:
        res = db.locations.insert_one(doc)
        return LocationResponse(
            id=str(res.inserted_id),
            ward_no=doc["ward_no"],
            ward_name=doc["ward_name"],
            zone=doc["zone"],
            localities=doc["localities"],
            lat=doc["lat"],
            lng=doc["lng"],
            verified=doc["verified"],
            verification_status=doc["verification_status"],
            source_url=doc["source_url"],
            source_retrieved_on=doc["source_retrieved_on"],
            geometry_note=doc["geometry_note"],
            source_note=doc["source_note"],
            created_at=doc["created_at"]
        )
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "DUPLICATE_LOCATION", "message": f"Ward/Location '{payload.ward_name}' already exists"}
        )

# Load Master Data Trigger
@router.post("/config/load-master")
def load_master_data(include_samples: bool = False):
    """Loads Mysuru master data (wards, categories, authorities, landmarks, and optional demonstration reports)
    from files in docs/data/ idempotently without duplicates."""
    db = get_db()
    data_dir = Path(__file__).resolve().parent.parent.parent / "docs" / "data"
    counts_before = {
        "wards": db.locations.count_documents({}),
        "categories": db.categories.count_documents({}),
        "authorities": db.authorities.count_documents({}),
        "landmarks": db.landmarks.count_documents({}),
        "reports": db.reports.count_documents({})
    }

    wards_loaded = 0
    categories_loaded = 0
    authorities_loaded = 0
    landmarks_loaded = 0
    reports_loaded = 0
    verified_wards = 0
    approximate_wards = 0
    unverified_wards = 0

    # 1. Load Authorities
    auth_file = data_dir / "mysuru-authorities.json"
    if auth_file.exists():
        with open(auth_file, "r", encoding="utf-8") as f:
            auth_data = json.load(f)
            for item in auth_data:
                key = normalize_key(item["name"])
                item["name_key"] = key
                item["created_at"] = item.get("created_at") or utc_now_iso()
                res = db.authorities.update_one({"name_key": key}, {"$set": item}, upsert=True)
                if res.upserted_id or res.modified_count:
                    authorities_loaded += 1

    # 2. Load Categories
    cat_file = data_dir / "mysuru-categories.json"
    if cat_file.exists():
        with open(cat_file, "r", encoding="utf-8") as f:
            cat_data = json.load(f)
            for item in cat_data:
                key = normalize_key(item["name"])
                item["name_key"] = key
                item["created_at"] = item.get("created_at") or utc_now_iso()
                # Resolve authority ID if authority name provided
                if item.get("authority_short_name"):
                    a_doc = db.authorities.find_one({"short_name": item["authority_short_name"]})
                    if a_doc:
                        item["responsible_authority_id"] = str(a_doc["_id"])
                        item["responsible_authority_name"] = a_doc["name"]
                res = db.categories.update_one({"name_key": key}, {"$set": item}, upsert=True)
                if res.upserted_id or res.modified_count:
                    categories_loaded += 1

    # 3. Load Landmarks
    lm_file = data_dir / "mysuru-landmarks.json"
    if lm_file.exists():
        with open(lm_file, "r", encoding="utf-8") as f:
            lm_data = json.load(f)
            for item in lm_data:
                key = normalize_key(item["name"])
                item["name_key"] = key
                res = db.landmarks.update_one({"name_key": key}, {"$set": item}, upsert=True)
                if res.upserted_id or res.modified_count:
                    landmarks_loaded += 1

    # 4. Load Wards
    ward_file = data_dir / "mysuru-wards.json"
    if ward_file.exists():
        with open(ward_file, "r", encoding="utf-8") as f:
            ward_data = json.load(f)
            # Remove legacy wards that don't match 1..65 official MCC delimitation
            valid_ward_nos = [item["ward_no"] for item in ward_data]
            db.locations.delete_many({"ward_no": {"$nin": valid_ward_nos}})

            for item in ward_data:
                key = normalize_key(item["ward_name"])
                item["ward_key"] = key
                item["created_at"] = item.get("created_at") or utc_now_iso()
                v_stat = item.get("verification_status", "verified")
                if v_stat == "verified":
                    verified_wards += 1
                elif v_stat == "approximate":
                    approximate_wards += 1
                else:
                    unverified_wards += 1

                res = db.locations.update_one({"ward_no": item["ward_no"]}, {"$set": item}, upsert=True)
                if res.upserted_id or res.modified_count:
                    wards_loaded += 1

    # 5. Load Sample Demonstration Reports if requested
    if include_samples:
        reports_file = data_dir / "mysuru-sample-reports.json"
        if reports_file.exists():
            from db import get_next_report_no
            with open(reports_file, "r", encoding="utf-8") as f:
                rep_data = json.load(f)
                for item in rep_data:
                    c_name = item.get("category") or item.get("category_name", "")
                    l_name = item.get("ward_name") or item.get("location_name", "")

                    # Check if report already loaded by signature
                    sig_match = db.reports.find_one({
                        "citizen_name": item.get("citizen_name"),
                        "location_name": l_name,
                        "reported_at": item.get("reported_at")
                    })
                    if sig_match:
                        continue

                    # Resolve category and location
                    c_doc = db.categories.find_one({"name_key": normalize_key(c_name)})
                    l_doc = db.locations.find_one({"ward_no": item.get("ward_no")}) or db.locations.find_one({"ward_key": normalize_key(l_name)})

                    rep_no = get_next_report_no(db)
                    doc = {
                        "report_no": rep_no,
                        "citizen_name": item.get("citizen_name", "Resident"),
                        "contact": item.get("contact", ""),
                        "category_id": str(c_doc["_id"]) if c_doc else "",
                        "category_name": c_doc["name"] if c_doc else c_name,
                        "location_id": str(l_doc["_id"]) if l_doc else "",
                        "location_name": l_doc["ward_name"] if l_doc else l_name,
                        "ward_no": l_doc.get("ward_no") if l_doc else item.get("ward_no"),
                        "zone": l_doc.get("zone", "") if l_doc else "",
                        "landmark": item.get("landmark", ""),
                        "lat": item.get("lat") or (l_doc.get("lat") if l_doc else None),
                        "lng": item.get("lng") or (l_doc.get("lng") if l_doc else None),
                        "description": item.get("description", ""),
                        "severity": item.get("severity", "Medium"),
                        "status": item.get("status", "Open"),
                        "reported_at": item.get("reported_at", utc_now_iso()),
                        "resolved_at": item.get("resolved_at"),
                        "authority_id": str(c_doc.get("responsible_authority_id", "")) if c_doc else item.get("authority_id", ""),
                        "authority_name": item.get("authority_name") or (c_doc.get("responsible_authority_name", "") if c_doc else ""),
                        "evidence": item.get("evidence", []),
                        "response_actions": item.get("response_actions", []),
                        "reopened_count": int(item.get("reopened_count", 0)),
                        "corroborations": int(item.get("corroborations", 0)),
                        "source": item.get("source", "sample_dataset")
                    }
                    db.reports.insert_one(doc)
                    reports_loaded += 1

    counts_after = {
        "wards": db.locations.count_documents({}),
        "categories": db.categories.count_documents({}),
        "authorities": db.authorities.count_documents({}),
        "landmarks": db.landmarks.count_documents({}),
        "reports": db.reports.count_documents({})
    }

    return {
        "status": "success",
        "counts_before": counts_before,
        "counts_after": counts_after,
        "wards_loaded": wards_loaded,
        "categories_loaded": categories_loaded,
        "authorities_loaded": authorities_loaded,
        "landmarks_loaded": landmarks_loaded,
        "reports_loaded": reports_loaded,
        "verification_breakdown": {
            "verified": verified_wards,
            "approximate": approximate_wards,
            "unverified": unverified_wards
        }
    }
