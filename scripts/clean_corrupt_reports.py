from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017/')
db = client['eco_monitor']

res = db.reports.delete_many({
    '$or': [
        {'location_name': {'$in': [None, '']}},
        {'category_name': {'$in': [None, '']}}
    ]
})
print(f"Deleted {res.deleted_count} corrupt reports with empty location or category.")
print(f"Remaining clean reports in eco_monitor: {db.reports.count_documents({})}")
