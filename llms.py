from langchain_groq import ChatGroq
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv
import os


# -----------------------------
# 2) LLM
# -----------------------------
# LLM Initialization Helpers
# -----------------------------
def get_groq_api_key() -> str:
    env_path = Path(__file__).parent / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path, override=True)
    raw_key = os.getenv("GROQ_API_KEY", "")
    return raw_key.strip(" \"'\t\r\n")

def get_llm(model_name: Optional[str] = None) -> ChatGroq:
    key = get_groq_api_key()
    if not key:
        raise ValueError(
            "GROQ_API_KEY is missing or invalid. Please check GROQ_API_KEY in your .env file or Streamlit sidebar."
        )
    # Default model supporting structured outputs on Groq
    selected_model = model_name or os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
    return ChatGroq(model=selected_model, api_key=key, max_retries=5)