import pymongo
from pymongo import MongoClient, ReturnDocument
from datetime import datetime, timezone
import re
from config import MONGODB_URI, DATABASE_NAME

client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=3000)
_current_db_name = DATABASE_NAME

def set_database_name(db_name: str):
    global _current_db_name
    _current_db_name = db_name

def get_db(db_name: str = None):
    target = db_name or _current_db_name
    return client[target]

def normalize_key(text: str) -> str:
    """Normalizes a string for case-insensitive and whitespace-invariant matching."""
    if not text:
        return ""
    return re.sub(r"\s+", " ", text.strip().lower())

def init_indexes(target_db=None):
    """Initializes required unique, compound, and text indexes for collections.
    Called strictly once during application lifespan startup."""
    db = target_db if target_db is not None else get_db()
    try:
        # categories: unique normalized name_key
        db.categories.create_index("name_key", unique=True)
        db.categories.create_index("name")

        # locations: unique normalized ward_key
        db.locations.create_index("ward_key", unique=True)
        db.locations.create_index("ward_name")
        db.locations.create_index("ward_no")

        # authorities: unique normalized name_key
        db.authorities.create_index("name_key", unique=True)

        # reports: unique report_no, compound, status, timestamps, text search
        db.reports.create_index("report_no", unique=True)
        db.reports.create_index([("location_name", pymongo.ASCENDING), ("category_name", pymongo.ASCENDING)])
        db.reports.create_index("status")
        db.reports.create_index("reported_at")
        db.reports.create_index("resolved_at")
        db.reports.create_index([
            ("description", pymongo.TEXT),
            ("citizen_name", pymongo.TEXT),
            ("landmark", pymongo.TEXT)
        ])

        # counters: ensure sequence document exists
        if db.counters.count_documents({"_id": "report_no"}) == 0:
            db.counters.insert_one({"_id": "report_no", "seq": 0})

        # app_config: ensure system config document exists
        if db.app_config.count_documents({"_id": "system_config"}) == 0:
            db.app_config.insert_one({
                "_id": "system_config",
                "default_zone": "Central Zone",
                "default_officer_role": "Ward Field Officer",
                "default_category_colors": [
                    "#2F5D46", "#3F7D5A", "#2F6F8F", "#B7791F", "#B4432F", "#6B766D", "#7C3AED", "#0891B2"
                ],
                "display_timezone": "Asia/Kolkata",
                "recurrence_count_threshold": 2,
                "recurrence_window_days": 30
            })
    except Exception as e:
        print(f"[DB Index Init Warning] {e}")

def get_next_report_no(target_db=None) -> int:
    """Atomically increments and returns the next integer report_no."""
    db = target_db if target_db is not None else get_db()
    counter = db.counters.find_one_and_update(
        {"_id": "report_no"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER
    )
    return counter["seq"]

def utc_now_iso() -> str:
    """Returns current UTC time in standardized ISO-8601 string."""
    return datetime.now(timezone.utc).isoformat()
