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

# Enums response
class EnumsResponse(BaseModel):
    severities: List[str]
    statuses: List[str]

# Health Model
class HealthResponse(BaseModel):
    status: str
    database: str
    connected: bool
    server_time: str
    collection_counts: Dict[str, int]

# Category Models
class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field("", max_length=500)
    color_hex: str = Field(..., description="Hex color code like #10B981")

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
            raise ValueError("color_hex must be a valid hex color like #10B981 or #10B")
        return s

class CategoryResponse(BaseModel):
    id: str
    name: str
    description: str
    color_hex: str
    created_at: str

# Location Models
class LocationCreate(BaseModel):
    ward_name: str = Field(..., min_length=2, max_length=150)
    zone: Optional[str] = Field("", max_length=100)

    @field_validator("ward_name")
    @classmethod
    def clean_ward(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Ward name cannot be empty")
        return s

class LocationResponse(BaseModel):
    id: str
    ward_name: str
    zone: str
    created_at: str

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
    description: str = Field(..., min_length=5, max_length=2000)
    severity: str

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
    description: str
    severity: str
    status: str
    reported_at: str
    responses: List[ResponseLogItem] = []

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
    color_hex: Optional[str] = "#10B981"

class LocationCount(BaseModel):
    location_name: str
    count: int

class StackedStatusPerLocation(BaseModel):
    location_name: str
    Open: int = 0
    In_Progress: int = Field(0, serialization_alias="In Progress")
    Resolved: int = 0
    total: int = 0

class HotspotInfo(BaseModel):
    has_hotspot: bool
    location_name: Optional[str] = None
    category_name: Optional[str] = None
    count: int = 0
    message: str

class AnalyticsResponse(BaseModel):
    total_reports: int
    counts_by_status: Dict[str, int]
    resolution_rate: float
    counts_by_category: List[CategoryCount]
    counts_by_location: List[LocationCount]
    stacked_status_per_location: List[Dict[str, Any]]
    average_responses_per_report: float
    average_turnaround_hours: Optional[float] = None
    hotspot: HotspotInfo
