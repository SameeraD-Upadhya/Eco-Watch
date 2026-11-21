import re
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, field_validator
from config import ALLOWED_SEVERITIES, ALLOWED_STATUSES

HEX_COLOR_REGEX = re.compile(r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$")

# Error Envelope Standard
class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None

class ErrorResponse(BaseModel):
    error: ErrorDetail

# Enums and App Configuration Models
class EnumsResponse(BaseModel):
    severities: List[str]
    statuses: List[str]
    display_timezone: str = "Asia/Kolkata"

class AppConfigResponse(BaseModel):
    display_timezone: str
    severities: List[str]
    statuses: List[str]
    default_zone: str
    default_officer_role: str

# Health Model
class HealthResponse(BaseModel):
    status: str
    database: str
    connected: bool
    server_time: str
    display_timezone: str
    collection_counts: Dict[str, int]

# Authority Models
class AuthorityCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    short_name: str = Field(..., min_length=2, max_length=50)
    scope: str = Field(..., min_length=2, max_length=300)
    contact_note: Optional[str] = Field("", max_length=300)
    source_url: Optional[str] = Field("", max_length=500)

class AuthorityResponse(BaseModel):
    id: str
    name: str
    short_name: str
    scope: str
    contact_note: Optional[str] = ""
    source_url: Optional[str] = ""
    created_at: str

# Category Models
class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field("", max_length=500)
    color_hex: str = Field(..., description="Hex color code like #2F5D46")
    icon: Optional[str] = Field("Tag", max_length=50)
    responsible_authority_id: Optional[str] = None
    sla_hours: Optional[int] = Field(48, ge=1, le=720)

    @field_validator("name")
    @classmethod
    def clean_name(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Category name cannot be empty")
        return s

    @field_validator("color_hex")
    @classmethod
    def validate_hex(cls, v: str) -> str:
        s = v.strip()
        if not HEX_COLOR_REGEX.match(s):
            raise ValueError("color_hex must be a valid hex color like #2F5D46")
        return s

class CategoryResponse(BaseModel):
    id: str
    name: str
    description: str
    color_hex: str
    icon: Optional[str] = "Tag"
    responsible_authority_id: Optional[str] = None
    responsible_authority_name: Optional[str] = None
    sla_hours: int = 48
    created_at: str

# Location Models
class LocationCreate(BaseModel):
    ward_no: Optional[int] = None
    ward_name: str = Field(..., min_length=2, max_length=150)
    zone: Optional[str] = Field("", max_length=100)
    localities: Optional[List[str]] = []
    lat: Optional[float] = None
    lng: Optional[float] = None
    verified: Optional[bool] = True
    verification_status: Optional[str] = Field("verified", max_length=50)
    source_url: Optional[str] = Field("", max_length=500)
    source_retrieved_on: Optional[str] = Field("", max_length=50)
    geometry_note: Optional[str] = Field("", max_length=500)
    source_note: Optional[str] = Field("", max_length=500)

    @field_validator("ward_name")
    @classmethod
    def clean_ward(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Ward name cannot be empty")
        return s

class LocationResponse(BaseModel):
    id: str
    ward_no: Optional[int] = None
    ward_name: str
    zone: str
    localities: List[str] = []
    lat: Optional[float] = None
    lng: Optional[float] = None
    verified: bool = True
    verification_status: Optional[str] = "verified"
    source_url: Optional[str] = ""
    source_retrieved_on: Optional[str] = ""
    geometry_note: Optional[str] = ""
    source_note: Optional[str] = ""
    created_at: str

# Landmark Model
class LandmarkResponse(BaseModel):
    name: str
    type: str
    lat: float
    lng: float
    source_url: str

# Report Models
class ResponseLogItem(BaseModel):
    action_taken: str
    updated_by: str
    updated_at: str

class ReportCreate(BaseModel):
    citizen_name: str = Field(..., min_length=2, max_length=100)
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    location_id: Optional[str] = None
    location_name: Optional[str] = None
    landmark: Optional[str] = Field("", max_length=200)
    lat: Optional[float] = None
    lng: Optional[float] = None
    description: str = Field(..., min_length=5, max_length=2000)
    severity: str
    contact: Optional[str] = Field("", max_length=100)
    evidence: Optional[List[str]] = []
    parent_report_no: Optional[int] = None

    @field_validator("severity")
    @classmethod
    def validate_severity(cls, v: str) -> str:
        if v not in ALLOWED_SEVERITIES:
            raise ValueError(f"Severity must be one of {ALLOWED_SEVERITIES}")
        return v

class ReportUpdateStatus(BaseModel):
    status: str
    action_taken: str = Field(..., min_length=2, max_length=1000)
    updated_by: str = Field(..., min_length=2, max_length=100)

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ALLOWED_STATUSES:
            raise ValueError(f"Status must be one of {ALLOWED_STATUSES}")
        return v

class ReportResponse(BaseModel):
    id: str
    report_no: int
    citizen_name: str
    category_id: str
    category_name: str
    location_id: str
    location_name: str
    landmark: Optional[str] = ""
    lat: Optional[float] = None
    lng: Optional[float] = None
    description: str
    severity: str
    status: str
    reported_at: str
    resolved_at: Optional[str] = None
    authority_id: Optional[str] = None
    authority_name: Optional[str] = None
    evidence: List[str] = []
    responses: List[ResponseLogItem] = []
    reopened_count: int = 0
    parent_report_no: Optional[int] = None
    corroborations: int = 0
    source: str = "web"
    is_overdue: Optional[bool] = False
    sla_hours: Optional[int] = 48

class PaginatedReportsResponse(BaseModel):
    items: List[ReportResponse]
    total: int
    page: int
    page_size: int

# Bulk Import Models
class BulkImportRowError(BaseModel):
    row: int
    error: str
    data: Optional[Dict[str, Any]] = None

class BulkImportResponse(BaseModel):
    total_rows: int
    inserted: int
    skipped: int
    errors: List[BulkImportRowError]

# Analytics Models
class CategoryCount(BaseModel):
    category_name: str
    count: int
    color_hex: Optional[str] = "#2F5D46"

class LocationCount(BaseModel):
    location_name: str
    count: int

class HotspotInfo(BaseModel):
    has_hotspot: bool
    location_name: Optional[str] = None
    category_name: Optional[str] = None
    count: int = 0
    message: str

class RecurrencePair(BaseModel):
    location_name: str
    category_name: str
    count: int
    first_reported: Optional[str] = None
    last_reported: Optional[str] = None
    median_gap_days: Optional[float] = None
    open_count: int = 0
    resolved_count: int = 0
    is_recurring: bool = False
    reopened: bool = False
    recurrence_tag: str = "Isolated"

class TimeTrendPoint(BaseModel):
    period: str
    Open: int = 0
    In_Progress: int = Field(0, serialization_alias="In Progress")
    Resolved: int = 0
    total: int = 0

class ZonePerformance(BaseModel):
    zone: str
    total_reports: int
    resolved_reports: int
    resolution_rate: float = 0.0
    avg_turnaround_hours: Optional[float] = None
    median_turnaround_hours: Optional[float] = None
    is_lagging: bool = False

class CategoryPerformance(BaseModel):
    category_name: str
    total_reports: int
    avg_turnaround_hours: Optional[float] = None
    median_turnaround_hours: Optional[float] = None
    sla_hours: int = 48
    sla_compliance_rate: float = 0.0

class OldestUnresolvedItem(BaseModel):
    report_no: int
    citizen_name: str
    category_name: str
    location_name: str
    severity: str
    reported_at: str
    age_days: float

class AuthorityCompliance(BaseModel):
    authority_name: str
    total_resolved: int
    compliant_count: int
    compliance_rate: float

class WardMapPoint(BaseModel):
    ward_no: Optional[int] = None
    ward_name: str
    zone: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    count: int = 0
    open_count: int = 0
    resolved_count: int = 0
    top_category: str = "None"
    top_category_color: str = "var(--border-subtle)"
    is_mapped: bool = True

class AnalyticsResponse(BaseModel):
    total_reports: int
    counts_by_status: Dict[str, int]
    resolution_rate: float
    counts_by_category: List[CategoryCount]
    counts_by_location: List[LocationCount]
    stacked_status_per_location: List[Dict[str, Any]]
    average_responses_per_report: float
    average_turnaround_hours: Optional[float] = None
    median_turnaround_hours: Optional[float] = None
    reopen_rate: float = 0.0
    hotspot: HotspotInfo
    top_recurrences: List[RecurrencePair] = []
    time_trend_weekly: List[TimeTrendPoint] = []
    time_trend_monthly: List[TimeTrendPoint] = []
    zone_performances: List[ZonePerformance] = []
    category_performances: List[CategoryPerformance] = []
    authority_compliances: List[AuthorityCompliance] = []
    oldest_unresolved_reports: List[OldestUnresolvedItem] = []
    top_wards_by_volume: List[LocationCount] = []
    bottom_zones_by_resolution: List[ZonePerformance] = []
    ward_map_points: List[WardMapPoint] = []
    unmapped_wards: List[str] = []
    data_insights: List[str] = []
