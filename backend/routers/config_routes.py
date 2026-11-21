from fastapi import APIRouter, HTTPException, status
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
from db import get_db, utc_now_iso
from config import DATABASE_NAME, ALLOWED_SEVERITIES, ALLOWED_STATUSES
from models import (
    HealthResponse,
    EnumsResponse,
    CategoryCreate,
    CategoryResponse,
    LocationCreate,
    LocationResponse
)

router = APIRouter(prefix="/api", tags=["Configuration & Master Data"])

def doc_to_dict(doc, id_key="id"):
    if not doc:
        return None
    d = dict(doc)
    d[id_key] = str(d.pop("_id"))
    return d

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
            "reports": db.reports.count_documents({}),
        }
    except Exception as e:
        connected = False

    return HealthResponse(
        status="healthy" if connected else "degraded",
        database=DATABASE_NAME,
        connected=connected,
        server_time=utc_now_iso(),
        collection_counts=counts
    )

@router.get("/config/enums", response_model=EnumsResponse)
def get_enums():
    return EnumsResponse(
        severities=ALLOWED_SEVERITIES,
        statuses=ALLOWED_STATUSES
    )

@router.get("/config/categories", response_model=list[CategoryResponse])
def list_categories():
    db = get_db()
    cursor = db.categories.find().sort("name", 1)
    results = []
    for doc in cursor:
        results.append(CategoryResponse(
            id=str(doc["_id"]),
            name=doc["name"],
            description=doc.get("description", ""),
            color_hex=doc.get("color_hex", "#10B981"),
            created_at=doc.get("created_at", utc_now_iso())
        ))
    return results

@router.post("/config/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(payload: CategoryCreate):
    db = get_db()
    now = utc_now_iso()
    doc = {
        "name": payload.name,
        "description": payload.description or "",
        "color_hex": payload.color_hex,
        "created_at": now
    }
    try:
        res = db.categories.insert_one(doc)
        return CategoryResponse(
            id=str(res.inserted_id),
            name=doc["name"],
            description=doc["description"],
            color_hex=doc["color_hex"],
            created_at=doc["created_at"]
        )
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "DUPLICATE_CATEGORY", "message": f"Category '{payload.name}' already exists"}
        )

@router.get("/config/locations", response_model=list[LocationResponse])
def list_locations():
    db = get_db()
    cursor = db.locations.find().sort("ward_name", 1)
    results = []
    for doc in cursor:
        results.append(LocationResponse(
            id=str(doc["_id"]),
            ward_name=doc["ward_name"],
            zone=doc.get("zone", ""),
            created_at=doc.get("created_at", utc_now_iso())
        ))
    return results

@router.post("/config/locations", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
def create_location(payload: LocationCreate):
    db = get_db()
    now = utc_now_iso()
    doc = {
        "ward_name": payload.ward_name,
        "zone": payload.zone or "",
        "created_at": now
    }
    try:
        res = db.locations.insert_one(doc)
        return LocationResponse(
            id=str(res.inserted_id),
            ward_name=doc["ward_name"],
            zone=doc["zone"],
            created_at=doc["created_at"]
        )
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "DUPLICATE_LOCATION", "message": f"Ward/Location '{payload.ward_name}' already exists"}
        )
