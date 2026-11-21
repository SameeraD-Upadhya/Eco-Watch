from datetime import datetime
from fastapi import APIRouter
from db import get_db
from models import (
    AnalyticsResponse,
    CategoryCount,
    LocationCount,
    HotspotInfo
)

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("", response_model=AnalyticsResponse)
def get_analytics():
    db = get_db()
    total_reports = db.reports.count_documents({})

    if total_reports == 0:
        return AnalyticsResponse(
            total_reports=0,
            counts_by_status={"Open": 0, "In Progress": 0, "Resolved": 0},
            resolution_rate=0.0,
            counts_by_category=[],
            counts_by_location=[],
            stacked_status_per_location=[],
            average_responses_per_report=0.0,
            average_turnaround_hours=None,
            hotspot=HotspotInfo(
                has_hotspot=False,
                location_name=None,
                category_name=None,
                count=0,
                message="No recurring environmental pattern detected"
            )
        )

    # Pure MongoDB Facet Aggregation
    facet_pipeline = [
        {
            "$facet": {
                "status_counts": [
                    {"$group": {"_id": "$status", "count": {"$sum": 1}}}
                ],
                "category_counts": [
                    {"$group": {"_id": "$category_name", "count": {"$sum": 1}}},
                    {"$sort": {"count": -1}}
                ],
                "location_counts": [
                    {"$group": {"_id": "$location_name", "count": {"$sum": 1}}},
                    {"$sort": {"count": -1}}
                ],
                "stacked_status": [
                    {
                        "$group": {
                            "_id": {"location": "$location_name", "status": "$status"},
                            "count": {"$sum": 1}
                        }
                    }
                ],
                "response_stats": [
                    {
                        "$project": {
                            "response_count": {"$size": {"$ifNull": ["$responses", []]}},
                            "status": "$status",
                            "reported_at": "$reported_at",
                            "last_response": {"$arrayElemAt": ["$responses", -1]}
                        }
                    }
                ],
                "hotspot_pairs": [
                    {
                        "$group": {
                            "_id": {
                                "location_name": "$location_name",
                                "category_name": "$category_name"
                            },
                            "count": {"$sum": 1}
                        }
                    },
                    {"$sort": {"count": -1}},
                    {"$limit": 1}
                ]
            }
        }
    ]

    agg_result = list(db.reports.aggregate(facet_pipeline))[0]

    # 1. Status Counts
    status_dict = {"Open": 0, "In Progress": 0, "Resolved": 0}
    for item in agg_result.get("status_counts", []):
        if item["_id"] in status_dict:
            status_dict[item["_id"]] = item["count"]

    resolved_count = status_dict.get("Resolved", 0)
    resolution_rate = round((resolved_count / total_reports) * 100, 1) if total_reports > 0 else 0.0

    # 2. Category Counts with color_hex lookup
    # Build lookup table of colors from DB categories
    category_colors = {c["name"]: c.get("color_hex", "#10B981") for c in db.categories.find()}
    category_counts = []
    for c in agg_result.get("category_counts", []):
        cat_name = c["_id"] or "Uncategorized"
        category_counts.append(CategoryCount(
            category_name=cat_name,
            count=c["count"],
            color_hex=category_colors.get(cat_name, "#10B981")
        ))

    # 3. Location Counts
    location_counts = [
        LocationCount(location_name=l["_id"] or "Unknown", count=l["count"])
        for l in agg_result.get("location_counts", [])
    ]

    # 4. Stacked Status per Location
    stacked_map = {}
    for item in agg_result.get("stacked_status", []):
        loc = item["_id"]["location"] or "Unknown"
        st = item["_id"]["status"]
        cnt = item["count"]
        if loc not in stacked_map:
            stacked_map[loc] = {"location_name": loc, "Open": 0, "In Progress": 0, "Resolved": 0, "total": 0}
        if st in stacked_map[loc]:
            stacked_map[loc][st] += cnt
        stacked_map[loc]["total"] += cnt

    stacked_list = list(stacked_map.values())
    stacked_list.sort(key=lambda x: x["total"], reverse=True)

    # 5. Average Responses and Turnaround Hours
    total_responses = 0
    resolved_turnarounds_hours = []

    for r in agg_result.get("response_stats", []):
        total_responses += r.get("response_count", 0)
        if r.get("status") == "Resolved" and r.get("last_response"):
            try:
                t0 = datetime.fromisoformat(r["reported_at"].replace("Z", "+00:00"))
                t1 = datetime.fromisoformat(r["last_response"]["updated_at"].replace("Z", "+00:00"))
                diff_hours = (t1 - t0).total_seconds() / 3600.0
                if diff_hours >= 0:
                    resolved_turnarounds_hours.append(diff_hours)
            except Exception:
                pass

    avg_responses = round(total_responses / total_reports, 1) if total_reports > 0 else 0.0
    avg_turnaround = (
        round(sum(resolved_turnarounds_hours) / len(resolved_turnarounds_hours), 1)
        if resolved_turnarounds_hours
        else None
    )

    # 6. Hotspot Pair Evaluation (Threshold: count >= 2)
    hotspot_info = HotspotInfo(
        has_hotspot=False,
        location_name=None,
        category_name=None,
        count=0,
        message="No recurring environmental pattern detected"
    )

    hotspot_pairs = agg_result.get("hotspot_pairs", [])
    if hotspot_pairs:
        top_pair = hotspot_pairs[0]
        pair_count = top_pair["count"]
        loc_name = top_pair["_id"]["location_name"]
        cat_name = top_pair["_id"]["category_name"]

        if pair_count >= 2:
            hotspot_info = HotspotInfo(
                has_hotspot=True,
                location_name=loc_name,
                category_name=cat_name,
                count=pair_count,
                message=f"Recurring hotspot: {cat_name} in {loc_name}, {pair_count} repeat reports"
            )

    return AnalyticsResponse(
        total_reports=total_reports,
        counts_by_status=status_dict,
        resolution_rate=resolution_rate,
        counts_by_category=category_counts,
        counts_by_location=location_counts,
        stacked_status_per_location=stacked_list,
        average_responses_per_report=avg_responses,
        average_turnaround_hours=avg_turnaround,
        hotspot=hotspot_info
    )
