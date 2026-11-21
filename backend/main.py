import sys
import uuid
import time
from pathlib import Path

# Ensure backend root is in sys.path
backend_root = str(Path(__file__).resolve().parent)
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, UploadFile, File, status
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from starlette.exceptions import HTTPException as StarletteHTTPException

from config import CORS_ORIGINS
from db import init_indexes
from routers.config_routes import router as config_router
from routers.reports_routes import router as reports_router
from routers.analytics_routes import router as analytics_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ecowatch")

UPLOAD_DIR = Path(__file__).resolve().parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing EcoWatch backend and MongoDB indexes...")
    init_indexes()
    yield
    logger.info("EcoWatch backend shutting down.")

app = FastAPI(
    title="EcoWatch: Community Environmental Monitoring & Citizen Reporting API",
    description="Backend API for EcoWatch - Civic Environmental Monitoring and Reporting System for Mysuru",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for authorized frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Consistent Error Envelope: { error: { code, message, details } }
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    detail = exc.detail
    code = "HTTP_ERROR"
    message = str(detail)
    extra_details = None

    if isinstance(detail, dict):
        code = detail.get("code", "HTTP_ERROR")
        message = detail.get("message", "An error occurred")
        extra_details = detail.get("details")

    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": code, "message": message, "details": extra_details}}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "details": jsonable_encoder(exc.errors())
            }
        }
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An internal server error occurred",
                "details": str(exc)
            }
        }
    )

# Evidence Photo Uploads
@app.post("/api/uploads")
async def upload_evidence(file: UploadFile = File(...)):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_FILE_TYPE", "message": f"Unsupported image format '{ext}'. Allowed: .jpg, .jpeg, .png, .webp"}
        )
    
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "FILE_TOO_LARGE", "message": "Uploaded image exceeds 5MB limit"}
        )
    
    safe_filename = f"report-{int(time.time())}-{uuid.uuid4().hex[:8]}.jpg"
    target_path = UPLOAD_DIR / safe_filename
    with open(target_path, "wb") as f:
        f.write(content)
        
    return {
        "filename": safe_filename,
        "url": f"/api/uploads/{safe_filename}",
        "size_bytes": len(content)
    }

@app.get("/api/uploads/{filename}")
async def get_uploaded_evidence(filename: str):
    safe_name = Path(filename).name
    if safe_name != filename or ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_FILENAME", "message": "Illegal path traversal attempt"}
        )
    
    target_path = UPLOAD_DIR / safe_name
    if not target_path.exists() or not target_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "FILE_NOT_FOUND", "message": f"File '{safe_name}' not found"}
        )
        
    return FileResponse(target_path, media_type="image/jpeg")

# Register routers
app.include_router(config_router)
app.include_router(reports_router)
app.include_router(analytics_router)

@app.get("/")
def root():
    return {
        "title": "EcoWatch API",
        "status": "online",
        "docs_url": "/docs",
        "jurisdiction": "Mysuru City Corporation"
    }
