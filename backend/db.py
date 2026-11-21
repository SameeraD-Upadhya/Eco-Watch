import pymongo
from pymongo import MongoClient, ReturnDocument
from datetime import datetime, timezone
from config import MONGODB_URI, DATABASE_NAME

client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=3000)
db = client[DATABASE_NAME]

def get_db():
    return db

def init_indexes():
    """Initializes required unique, compound, and text indexes for collections."""
    try:
        # categories: unique name
        db.categories.create_index("name", unique=True)

        # locations: unique ward_name
        db.locations.create_index("ward_name", unique=True)

        # reports: unique report_no, compound, status, reported_at, text search
        db.reports.create_index("report_no", unique=True)
        db.reports.create_index([("location_name", pymongo.ASCENDING), ("category_name", pymongo.ASCENDING)])
        db.reports.create_index("status")
        db.reports.create_index("reported_at")
        db.reports.create_index([("description", pymongo.TEXT), ("citizen_name", pymongo.TEXT)])

        # counters: ensure sequence document exists
        if db.counters.count_documents({"_id": "report_no"}) == 0:
            db.counters.insert_one({"_id": "report_no", "seq": 0})
    except Exception as e:
        print(f"[DB Index Init Warning] {e}")

# Ensure indexes are established on startup
init_indexes()


def get_next_report_no() -> int:
    """Atomically increments and returns the next integer report_no."""
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
