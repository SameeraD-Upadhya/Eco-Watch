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
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse
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
