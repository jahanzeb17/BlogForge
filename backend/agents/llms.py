from langchain_groq import ChatGroq
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv
import os


# Load .env from project root (two levels up from backend/agents/)
_PROJECT_ROOT = Path(__file__).resolve().parents[2]
_env_path = _PROJECT_ROOT / ".env"
if _env_path.exists():
    load_dotenv(dotenv_path=_env_path, override=True)


def get_groq_api_key() -> str:
    raw_key = os.getenv("GROQ_API_KEY", "")
    return raw_key.strip(" \"'\t\r\n")


def get_llm(model_name: Optional[str] = None) -> ChatGroq:
    key = get_groq_api_key()
    if not key:
        raise ValueError(
            "GROQ_API_KEY is missing. Set it in the .env file at the project root."
        )
    selected_model = model_name or os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
    return ChatGroq(model=selected_model, api_key=key, max_retries=5)