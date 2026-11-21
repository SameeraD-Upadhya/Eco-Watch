import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017/")
DATABASE_NAME = os.getenv("DATABASE_NAME", "eco_monitor")
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "8000"))

# Structural schema invariants (the only permitted backend constants)
ALLOWED_SEVERITIES = ["Low", "Medium", "High"]
ALLOWED_STATUSES = ["Open", "In Progress", "Resolved"]
