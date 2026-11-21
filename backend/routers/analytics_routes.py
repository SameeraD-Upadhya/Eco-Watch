from datetime import datetime, timezone
import statistics
from fastapi import APIRouter
from db import get_db
from models import (
    AnalyticsResponse,
    CategoryCount,
    LocationCount,
    HotspotInfo,
    RecurrencePair,
    TimeTrendPoint,
    ZonePerformance,
    CategoryPerformance,
    OldestUnresolvedItem,
    AuthorityCompliance,
    WardMapPoint
)

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("", response_model=AnalyticsResponse)
def get_analytics():
    db = get_db()
    total_reports = db.reports.count_documents({})

    if total_reports == 0:
        empty_points = []
        unmapped_list = []
        for loc in db.locations.find().sort("ward_no", 1):
            lat = loc.get("lat")
            lng = loc.get("lng")
            is_m = bool(lat is not None and lng is not None)
            if not is_m:
                unmapped_list.append(loc["ward_name"])
            empty_points.append(WardMapPoint(
                ward_no=loc.get("ward_no"),
                ward_name=loc["ward_name"],
                zone=loc.get("zone", "General"),
                lat=lat,
                lng=lng,
                count=0,
                open_count=0,
                resolved_count=0,
                top_category="None",
                top_category_color="var(--border-subtle)",
                is_mapped=is_m
            ))

        return AnalyticsResponse(
            total_reports=0,
            counts_by_status={"Open": 0, "In Progress": 0, "Resolved": 0},
            resolution_rate=0.0,
            counts_by_category=[],
            counts_by_location=[],
            stacked_status_per_location=[],
            average_responses_per_report=0.0,
            average_turnaround_hours=None,
            median_turnaround_hours=None,
            reopen_rate=0.0,
            hotspot=HotspotInfo(
                has_hotspot=False,
                location_name=None,
                category_name=None,
                count=0,
                message="No recurring environmental pattern detected"
            ),
            top_recurrences=[],
            time_trend_weekly=[],
            time_trend_monthly=[],
            zone_performances=[],
            category_performances=[],
            authority_compliances=[],
            oldest_unresolved_reports=[],
            top_wards_by_volume=[],
            bottom_zones_by_resolution=[],
            ward_map_points=empty_points,
            unmapped_wards=unmapped_list,
            data_insights=["No incident reports currently recorded in the system."]
        )

    # 1. Status Counts & Reopen Rate
    status_counts = {"Open": 0, "In Progress": 0, "Resolved": 0}
    status_agg = db.reports.aggregate([
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ])
    for item in status_agg:
        if item["_id"] in status_counts:
            status_counts[item["_id"]] = item["count"]

    resolved_count = status_counts.get("Resolved", 0)
    resolution_rate = round((resolved_count / total_reports) * 100, 1)

    reopened_total = db.reports.count_documents({"reopened_count": {"$gt": 0}})
    reopen_rate = round((reopened_total / total_reports) * 100, 1)

    # 2. Category Counts & Palette Resolution
    category_colors = {c["name"]: c.get("color_hex", "#2F5D46") for c in db.categories.find()}
    cat_agg = db.reports.aggregate([
        {"$group": {"_id": "$category_name", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ])
    category_counts = []
    for item in cat_agg:
        c_name = item["_id"] or "Uncategorized"
        category_counts.append(CategoryCount(
            category_name=c_name,
            count=item["count"],
            color_hex=category_colors.get(c_name, "#2F5D46")
        ))

    # 3. Location Counts & Stacked Status per Location
    loc_agg = db.reports.aggregate([
        {"$group": {"_id": "$location_name", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ])
    location_counts = [
        LocationCount(location_name=item["_id"] or "Unknown", count=item["count"])
        for item in loc_agg
    ]

    stacked_agg = db.reports.aggregate([
        {
            "$group": {
                "_id": {"location": "$location_name", "status": "$status"},
                "count": {"$sum": 1}
            }
        }
    ])
    stacked_map = {}
    for item in stacked_agg:
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

    # 4. Turnaround Time Analysis (reported_at -> resolved_at)
    all_reports = list(db.reports.find({}, {
        "reported_at": 1, "resolved_at": 1, "status": 1, "responses": 1,
        "location_name": 1, "category_name": 1, "sla_hours": 1, "reopened_count": 1
    }))

    resolved_turnarounds_hours = []
    total_responses_count = 0
    cat_turnarounds = {}
    ward_zones = {loc["ward_name"]: loc.get("zone", "General") for loc in db.locations.find()}
    zone_turnarounds = {}

    for r in all_reports:
        total_responses_count += len(r.get("responses", []))
        if r.get("status") == "Resolved" and r.get("reported_at") and r.get("resolved_at"):
            try:
                t0 = datetime.fromisoformat(r["reported_at"].replace("Z", "+00:00"))
                t1 = datetime.fromisoformat(r["resolved_at"].replace("Z", "+00:00"))
                diff_h = (t1 - t0).total_seconds() / 3600.0
                if diff_h >= 0:
                    resolved_turnarounds_hours.append(diff_h)

                    # Category-level turnaround
                    cat = r.get("category_name", "Other")
                    cat_turnarounds.setdefault(cat, []).append((diff_h, r.get("sla_hours", 48)))

                    # Zone-level turnaround
                    z = ward_zones.get(r.get("location_name"), "General")
                    zone_turnarounds.setdefault(z, []).append(diff_h)
            except Exception:
                pass

    avg_turnaround = (
        round(statistics.mean(resolved_turnarounds_hours), 1)
        if resolved_turnarounds_hours
        else None
    )
    median_turnaround = (
        round(statistics.median(resolved_turnarounds_hours), 1)
        if resolved_turnarounds_hours
        else None
    )
    avg_responses = round(total_responses_count / total_reports, 1)

    # 5. Recurrence Ranking: Top 10 (ward + category) pairs
    pair_agg = db.reports.aggregate([
        {
            "$group": {
                "_id": {
                    "location_name": "$location_name",
                    "category_name": "$category_name"
                },
                "count": {"$sum": 1},
                "first_reported": {"$min": "$reported_at"},
                "last_reported": {"$max": "$reported_at"},
                "open_count": {
                    "$sum": {"$cond": [{"$in": ["$status", ["Open", "In Progress"]]}, 1, 0]}
                },
                "resolved_count": {
                    "$sum": {"$cond": [{"$eq": ["$status", "Resolved"]}, 1, 0]}
                },
                "reopened_sum": {"$sum": "$reopened_count"},
                "reported_dates": {"$push": "$reported_at"}
            }
        },
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ])

    top_recurrences: list[RecurrencePair] = []
    for item in pair_agg:
        loc = item["_id"]["location_name"]
        cat = item["_id"]["category_name"]
        cnt = item["count"]
        dates = sorted(item.get("reported_dates", []))

        # Calculate median gap in days between successive reports
        median_gap = None
        if len(dates) >= 2:
            gaps = []
            for i in range(len(dates) - 1):
                try:
                    d0 = datetime.fromisoformat(dates[i].replace("Z", "+00:00"))
                    d1 = datetime.fromisoformat(dates[i + 1].replace("Z", "+00:00"))
                    gaps.append(abs((d1 - d0).total_seconds()) / 86400.0)
                except Exception:
                    pass
            if gaps:
                median_gap = round(statistics.median(gaps), 1)

        # Recurrence criteria: count >= 3 or median gap <= 30 days or reopened
        is_rec = bool(cnt >= 3 or (median_gap is not None and median_gap <= 30.0) or item.get("reopened_sum", 0) > 0)
        reopened = bool(item.get("reopened_sum", 0) > 0)
        
        # Categorize recurrence tag
        if cnt >= 5:
            rec_tag = "Chronic"
        elif cnt >= 3:
            rec_tag = "Recurring"
        else:
            rec_tag = "Isolated"

        top_recurrences.append(RecurrencePair(
            location_name=loc,
            category_name=cat,
            count=cnt,
            first_reported=item.get("first_reported"),
            last_reported=item.get("last_reported"),
            median_gap_days=median_gap,
            open_count=item.get("open_count", 0),
            resolved_count=item.get("resolved_count", 0),
            is_recurring=is_rec,
            reopened=reopened,
            recurrence_tag=rec_tag
        ))

    # 6. Hotspot Banner Decision (Threshold: repeat count >= 2)
    hotspot_info = HotspotInfo(
        has_hotspot=False,
        location_name=None,
        category_name=None,
        count=0,
        message="No recurring environmental pattern detected"
    )
    if top_recurrences and top_recurrences[0].count >= 2:
        top_h = top_recurrences[0]
        hotspot_info = HotspotInfo(
            has_hotspot=True,
            location_name=top_h.location_name,
            category_name=top_h.category_name,
            count=top_h.count,
            message=f"Recurring hotspot: {top_h.category_name} in {top_h.location_name}, {top_h.count} repeat reports"
        )

    # 7. Time Trends (Weekly and Monthly)
    weekly_map = {}
    monthly_map = {}
    for r in all_reports:
        rep_at = r.get("reported_at")
        if not rep_at:
            continue
        try:
            dt = datetime.fromisoformat(rep_at.replace("Z", "+00:00"))
            w_key = f"{dt.year}-W{dt.isocalendar()[1]:02d}"
            m_key = f"{dt.year}-{dt.month:02d}"

            st = r.get("status", "Open")

            # Weekly
            if w_key not in weekly_map:
                weekly_map[w_key] = {"period": w_key, "Open": 0, "In Progress": 0, "Resolved": 0, "total": 0}
            if st in weekly_map[w_key]:
                weekly_map[w_key][st] += 1
            weekly_map[w_key]["total"] += 1

            # Monthly
            if m_key not in monthly_map:
                monthly_map[m_key] = {"period": m_key, "Open": 0, "In Progress": 0, "Resolved": 0, "total": 0}
            if st in monthly_map[m_key]:
                monthly_map[m_key][st] += 1
            monthly_map[m_key]["total"] += 1
        except Exception:
            pass

    time_trend_weekly = [TimeTrendPoint(**v) for k, v in sorted(weekly_map.items())[-8:]]
    time_trend_monthly = [TimeTrendPoint(**v) for k, v in sorted(monthly_map.items())[-6:]]

    # 8. Zone Performances & Lagging Zone Identification
    zone_reports_count = {}
    zone_resolved_count = {}
    for r in all_reports:
        z = ward_zones.get(r.get("location_name"), "Central Zone")
        zone_reports_count[z] = zone_reports_count.get(z, 0) + 1
        if r.get("status") == "Resolved":
            zone_resolved_count[z] = zone_resolved_count.get(z, 0) + 1

    zone_performances: list[ZonePerformance] = []
    max_turnaround = -1.0
    slowest_zone = None

    for z, tot in zone_reports_count.items():
        t_list = zone_turnarounds.get(z, [])
        avg_z = round(statistics.mean(t_list), 1) if t_list else None
        med_z = round(statistics.median(t_list), 1) if t_list else None
        res_cnt = zone_resolved_count.get(z, 0)
        res_rate = round((res_cnt / tot) * 100, 1) if tot > 0 else 0.0

        if avg_z is not None and avg_z > max_turnaround:
            max_turnaround = avg_z
            slowest_zone = z

        zone_performances.append(ZonePerformance(
            zone=z,
            total_reports=tot,
            resolved_reports=res_cnt,
            resolution_rate=res_rate,
            avg_turnaround_hours=avg_z,
            median_turnaround_hours=med_z,
            is_lagging=False
        ))

    # Mark lagging zone (either slowest turnaround or lowest resolution rate)
    for zp in zone_performances:
        if zp.zone == slowest_zone:
            zp.is_lagging = True

    zone_performances.sort(key=lambda x: x.total_reports, reverse=True)
    bottom_zones_by_resolution = sorted(zone_performances, key=lambda x: x.resolution_rate)[:5]

    # 9. Category Performances & SLA Compliance
    category_performances: list[CategoryPerformance] = []
    for cat_name, items in cat_turnarounds.items():
        times = [it[0] for it in items]
        sla_h = items[0][1] if items else 48
        compliant = sum(1 for t in times if t <= sla_h)
        rate = round((compliant / len(times)) * 100, 1) if times else 0.0
        avg_c = round(statistics.mean(times), 1) if times else None
        med_c = round(statistics.median(times), 1) if times else None

        category_performances.append(CategoryPerformance(
            category_name=cat_name,
            total_reports=len(times),
            avg_turnaround_hours=avg_c,
            median_turnaround_hours=med_c,
            sla_hours=sla_h,
            sla_compliance_rate=rate
        ))

    # 10. SLA Compliance per Civic Authority
    cat_authorities = {c["name"]: c.get("authority_short_name", "MCC") for c in db.categories.find()}
    auth_turnarounds = {}
    for r in all_reports:
        if r.get("status") == "Resolved" and r.get("reported_at") and r.get("resolved_at"):
            try:
                t0 = datetime.fromisoformat(r["reported_at"].replace("Z", "+00:00"))
                t1 = datetime.fromisoformat(r["resolved_at"].replace("Z", "+00:00"))
                diff_h = (t1 - t0).total_seconds() / 3600.0
                if diff_h >= 0:
                    auth = r.get("authority_name") or cat_authorities.get(r.get("category_name"), "MCC")
                    sla = r.get("sla_hours", 48)
                    auth_turnarounds.setdefault(auth, []).append((diff_h, sla))
            except Exception:
                pass

    authority_compliances: list[AuthorityCompliance] = []
    for auth, items in auth_turnarounds.items():
        compliant_n = sum(1 for (th, sla) in items if th <= sla)
        c_rate = round((compliant_n / len(items)) * 100, 1) if items else 0.0
        authority_compliances.append(AuthorityCompliance(
            authority_name=auth,
            total_resolved=len(items),
            compliant_count=compliant_n,
            compliance_rate=c_rate
        ))
    authority_compliances.sort(key=lambda x: x.total_resolved, reverse=True)

    # 11. Oldest Unresolved Reports (Backlog / Escalation Candidates)
    now_utc = datetime.now(timezone.utc)
    oldest_unresolved: list[OldestUnresolvedItem] = []
    unresolved_docs = list(db.reports.find(
        {"status": {"$in": ["Open", "In Progress"]}},
        {"report_no": 1, "citizen_name": 1, "category_name": 1, "location_name": 1, "severity": 1, "reported_at": 1}
    ).sort("reported_at", 1).limit(5))

    for doc in unresolved_docs:
        rep_at_str = doc.get("reported_at", "")
        age_d = 0.0
        try:
            dt = datetime.fromisoformat(rep_at_str.replace("Z", "+00:00"))
            age_d = round((now_utc - dt).total_seconds() / 86400.0, 1)
        except Exception:
            pass
        oldest_unresolved.append(OldestUnresolvedItem(
            report_no=doc.get("report_no", 0),
            citizen_name=doc.get("citizen_name", ""),
            category_name=doc.get("category_name", ""),
            location_name=doc.get("location_name", ""),
            severity=doc.get("severity", "Medium"),
            reported_at=rep_at_str,
            age_days=age_d
        ))

    # 12. Top Wards by Report Volume
    top_wards_by_volume = location_counts[:5]

    # 13. Centroid Map Points for Hotspot Visualization (All 65 wards + unmapped notice)
    locations_list = list(db.locations.find().sort("ward_no", 1))
    ward_cat_counts = {}
    ward_status_counts = {}
    for r in all_reports:
        loc_n = r.get("location_name")
        if not loc_n:
            continue
        c_n = r.get("category_name", "Other")
        ward_cat_counts.setdefault(loc_n, {}).setdefault(c_n, 0)
        ward_cat_counts[loc_n][c_n] += 1

        ward_status_counts.setdefault(loc_n, {"Open": 0, "In Progress": 0, "Resolved": 0})
        if r.get("status") == "Open":
            ward_status_counts[loc_n]["Open"] += 1
        elif r.get("status") == "In Progress":
            ward_status_counts[loc_n]["In Progress"] += 1
        elif r.get("status") == "Resolved":
            ward_status_counts[loc_n]["Resolved"] += 1

    ward_map_points: list[WardMapPoint] = []
    unmapped_wards: list[str] = []

    for loc in locations_list:
        loc_n = loc["ward_name"]
        cat_dict = ward_cat_counts.get(loc_n, {})
        st_counts = ward_status_counts.get(loc_n, {"Open": 0, "In Progress": 0, "Resolved": 0})
        total_w = sum(cat_dict.values())
        
        lat = loc.get("lat")
        lng = loc.get("lng")
        is_mapped = bool(lat is not None and lng is not None)
        if not is_mapped:
            unmapped_wards.append(loc_n)

        if total_w > 0 and cat_dict:
            top_cat = max(cat_dict.items(), key=lambda x: x[1])[0]
            color = category_colors.get(top_cat, "#2F5D46")
        else:
            top_cat = "None"
            color = "var(--border-subtle)"

        ward_map_points.append(WardMapPoint(
            ward_no=loc.get("ward_no"),
            ward_name=loc_n,
            zone=loc.get("zone", "General"),
            lat=lat,
            lng=lng,
            count=total_w,
            open_count=st_counts["Open"],
            in_progress_count=st_counts["In Progress"],
            resolved_count=st_counts["Resolved"],
            top_category=top_cat,
            top_category_color=color,
            is_mapped=is_mapped,
            has_boundary=True,
            boundary_source="KGIS / MCC Delimitation (ODbL-1.0)"
        ))
    ward_map_points.sort(key=lambda x: (x.count, x.ward_no or 0), reverse=True)

    # 14. Automated Data Insight Sentences
    data_insights = []
    if top_recurrences and top_recurrences[0].count >= 2:
        top_rec = top_recurrences[0]
        data_insights.append(
            f"Highest recurring environmental hazard is {top_rec.category_name} in {top_rec.location_name} with {top_rec.count} complaints logged ({top_rec.recurrence_tag} recurrence)."
        )

    if slowest_zone and max_turnaround > 0:
        data_insights.append(
            f"{slowest_zone} displays the longest turnaround time to remediation, averaging {max_turnaround} hours."
        )

    if authority_compliances:
        top_auth = authority_compliances[0]
        data_insights.append(
            f"{top_auth.authority_name} achieved {top_auth.compliance_rate}% SLA compliance across {top_auth.total_resolved} resolved incidents."
        )

    if reopen_rate > 0:
        data_insights.append(
            f"{reopen_rate}% of resolved incidents were subsequently reopened due to recurrent civic hazards."
        )
    elif resolution_rate > 0:
        data_insights.append(
            f"Municipal resolution efficiency stands at {resolution_rate}%, with a median turnaround time of {median_turnaround or 'N/A'} hours."
        )

    return AnalyticsResponse(
        total_reports=total_reports,
        counts_by_status=status_counts,
        resolution_rate=resolution_rate,
        counts_by_category=category_counts,
        counts_by_location=location_counts,
        stacked_status_per_location=stacked_list,
        average_responses_per_report=avg_responses,
        average_turnaround_hours=avg_turnaround,
        median_turnaround_hours=median_turnaround,
        reopen_rate=reopen_rate,
        hotspot=hotspot_info,
        top_recurrences=top_recurrences,
        time_trend_weekly=time_trend_weekly,
        time_trend_monthly=time_trend_monthly,
        zone_performances=zone_performances,
        category_performances=category_performances,
        authority_compliances=authority_compliances,
        oldest_unresolved_reports=oldest_unresolved,
        top_wards_by_volume=top_wards_by_volume,
        bottom_zones_by_resolution=bottom_zones_by_resolution,
        ward_map_points=ward_map_points,
        unmapped_wards=unmapped_wards,
        data_insights=data_insights
    )
