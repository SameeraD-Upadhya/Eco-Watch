import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017/")
DATABASE_NAME = os.getenv("DATABASE_NAME", "eco_monitor")
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "8000"))

# Allowed CORS origins
raw_cors = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173")
CORS_ORIGINS = [orig.strip() for orig in raw_cors.split(",") if orig.strip()]

# Server-side display timezone
DISPLAY_TIMEZONE = os.getenv("DISPLAY_TIMEZONE", "Asia/Kolkata")

# Structural schema invariants (the only permitted backend constants)
ALLOWED_SEVERITIES = ["Low", "Medium", "High"]
ALLOWED_STATUSES = ["Open", "In Progress", "Resolved"]

# Valid status transitions
VALID_STATUS_TRANSITIONS = {
    "Open": ["Open", "In Progress", "Resolved"],
    "In Progress": ["In Progress", "Resolved", "Open"],
    "Resolved": ["Resolved", "Open"]  # "Resolved -> Open" represents reopening
}
