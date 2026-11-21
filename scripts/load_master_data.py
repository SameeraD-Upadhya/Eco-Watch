#!/usr/bin/env python3
"""
EcoWatch: Standalone CLI Master Data & Demonstration Dataset Loader
Populates local MongoDB 'eco_monitor' with authoritative Mysuru wards,
environmental categories, civic authorities, and demonstration reports.
"""

import sys
import os
import json
import argparse
from pathlib import Path
from pymongo import MongoClient

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR / "backend"))

from config import MONGODB_URI, DATABASE_NAME
from db import init_indexes, normalize_key, utc_now_iso, get_next_report_no

DATA_DIR = BASE_DIR / "docs" / "data"

def load_master_data(with_sample_reports: bool = False, uri: str = None, db_name: str = None):
    mongo_uri = uri or MONGODB_URI
    target_db_name = db_name or DATABASE_NAME

    print(f"Connecting to MongoDB at {mongo_uri} (database: {target_db_name})...")
    client = MongoClient(mongo_uri)
    db = client[target_db_name]

    # Ensure indexes are established
    print("Ensuring indexes are initialized...")
    init_indexes(db)

    counts_before = {
        "authorities": db.authorities.count_documents({}),
        "categories": db.categories.count_documents({}),
        "wards": db.locations.count_documents({}),
        "reports": db.reports.count_documents({})
    }

    print(f"Initial record counts: {counts_before}")

    # 1. Load Authorities
    auth_file = DATA_DIR / "mysuru-authorities.json"
    authorities_upserted = 0
    if auth_file.exists():
        with open(auth_file, "r", encoding="utf-8") as f:
            auth_data = json.load(f)
            for item in auth_data:
                key = normalize_key(item["name"])
                item["name_key"] = key
                item["created_at"] = item.get("created_at") or utc_now_iso()
                res = db.authorities.update_one({"name_key": key}, {"$set": item}, upsert=True)
                if res.upserted_id or res.modified_count:
                    authorities_upserted += 1
        print(f"Authorities: {authorities_upserted} synced.")
    else:
        print(f"Warning: {auth_file} not found.")

    # 2. Load Categories
    cat_file = DATA_DIR / "mysuru-categories.json"
    categories_upserted = 0
    if cat_file.exists():
        with open(cat_file, "r", encoding="utf-8") as f:
            cat_data = json.load(f)
            for item in cat_data:
                key = normalize_key(item["name"])
                item["name_key"] = key
                item["created_at"] = item.get("created_at") or utc_now_iso()
                if item.get("authority_short_name"):
                    a_doc = db.authorities.find_one({"short_name": item["authority_short_name"]})
                    if a_doc:
                        item["responsible_authority_id"] = str(a_doc["_id"])
                        item["responsible_authority_name"] = a_doc["name"]
                res = db.categories.update_one({"name_key": key}, {"$set": item}, upsert=True)
                if res.upserted_id or res.modified_count:
                    categories_upserted += 1
        print(f"Categories: {categories_upserted} synced.")
    else:
        print(f"Warning: {cat_file} not found.")

    # 3. Load Wards
    ward_file = DATA_DIR / "mysuru-wards.json"
    wards_upserted = 0
    unverified_count = 0
    if ward_file.exists():
        with open(ward_file, "r", encoding="utf-8") as f:
            ward_data = json.load(f)
            for item in ward_data:
                key = normalize_key(item["ward_name"])
                item["ward_key"] = key
                item["created_at"] = item.get("created_at") or utc_now_iso()
                if not item.get("verified", True):
                    unverified_count += 1
                res = db.locations.update_one({"ward_key": key}, {"$set": item}, upsert=True)
                if res.upserted_id or res.modified_count:
                    wards_upserted += 1
        print(f"Municipal Wards: {wards_upserted} synced ({unverified_count} unverified).")
    else:
        print(f"Warning: {ward_file} not found.")

    # 4. Load Sample Demonstration Reports (if flagged)
    reports_inserted = 0
    if with_sample_reports:
        rep_file = DATA_DIR / "mysuru-sample-reports.json"
        if rep_file.exists():
            with open(rep_file, "r", encoding="utf-8") as f:
                rep_data = json.load(f)
                for item in rep_data:
                    # Deduplicate by signature
                    sig_match = db.reports.find_one({
                        "citizen_name": item.get("citizen_name"),
                        "location_name": item.get("location_name"),
                        "reported_at": item.get("reported_at")
                    })
                    if sig_match:
                        continue

                    # Lookup category & ward
                    c_doc = db.categories.find_one({"name_key": normalize_key(item.get("category_name", ""))})
                    l_doc = db.locations.find_one({"ward_key": normalize_key(item.get("location_name", ""))})

                    rep_no = get_next_report_no(db)
                    doc = {
                        "report_no": rep_no,
                        "citizen_name": item.get("citizen_name", "Resident"),
                        "category_id": str(c_doc["_id"]) if c_doc else "",
                        "category_name": c_doc["name"] if c_doc else item.get("category_name", ""),
                        "location_id": str(l_doc["_id"]) if l_doc else "",
                        "location_name": l_doc["ward_name"] if l_doc else item.get("location_name", ""),
                        "landmark": item.get("landmark", ""),
                        "lat": item.get("lat"),
                        "lng": item.get("lng"),
                        "description": item.get("description", ""),
                        "severity": item.get("severity", "Medium"),
                        "status": item.get("status", "Open"),
                        "reported_at": item.get("reported_at", utc_now_iso()),
                        "resolved_at": item.get("resolved_at"),
                        "authority_id": str(c_doc.get("responsible_authority_id", "")) if c_doc else "",
                        "authority_name": item.get("authority_name", ""),
                        "evidence": item.get("evidence", []),
                        "responses": item.get("responses", []),
                        "reopened_count": int(item.get("reopened_count", 0)),
                        "corroborations": int(item.get("corroborations", 0)),
                        "source": item.get("source", "sample_dataset")
                    }
                    db.reports.insert_one(doc)
                    reports_inserted += 1
            print(f"Sample Reports: {reports_inserted} demonstration reports ingested.")
        else:
            print(f"Warning: {rep_file} not found.")

    counts_after = {
        "authorities": db.authorities.count_documents({}),
        "categories": db.categories.count_documents({}),
        "wards": db.locations.count_documents({}),
        "reports": db.reports.count_documents({})
    }

    print("\n=== MASTER DATA LOAD COMPLETE ===")
    print(f"Authorities: {counts_after['authorities']}")
    print(f"Categories:  {counts_after['categories']}")
    print(f"Wards:       {counts_after['wards']}")
    print(f"Reports:     {counts_after['reports']}")
    return counts_after

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="EcoWatch Master Data Ingestion Tool")
    parser.add_argument("--with-sample-reports", action="store_true", help="Ingest 150 demonstration reports")
    parser.add_argument("--mongo-uri", type=str, default=None, help="Custom MongoDB connection string")
    parser.add_argument("--db-name", type=str, default=None, help="Custom MongoDB database name")
    args = parser.parse_args()

    load_master_data(
        with_sample_reports=args.with_sample_reports,
        uri=args.mongo_uri,
        db_name=args.db_name
    )
