import os
from pathlib import Path
from dotenv import load_dotenv

# Project root is two levels above app/
PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(dotenv_path=PROJECT_ROOT / ".env", override=True)

# Database
DATABASE_URL = os.getenv(
    "DATABASE_URL"
)

# JWT
SECRET_KEY = os.getenv("SECRET_KEY", "blogforge-dev-secret-change-in-production-xK9pL2mN7qR4")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours

# Temp workspace for graph execution (images written here before being persisted to DB)
STORAGE_DIR = PROJECT_ROOT / "storage"
STORAGE_DIR.mkdir(exist_ok=True)