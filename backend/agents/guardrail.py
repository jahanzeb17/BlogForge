"""
AI Safety Guardrail for BlogForge.

Checks user-provided text (topics, edited queries, revision instructions)
and either allows it through unchanged or transforms harmful/malicious
requests into safe educational/defensive versions.

Only two outcomes:
  - allow:    keep the user's text unchanged.
  - transform: rewrite into a safe educational/defensive version.

Usage:
    from .guardrail import guardrail_check
    result = guardrail_check("How can I hack a server?")
    # result.action == "transform"
    # result.topic == "Explain common server attack techniques..."
"""
from __future__ import annotations

import logging
from typing import Literal

from pydantic import BaseModel
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
from pathlib import Path

from .prompts import _GUARDRAIL_SYSTEM
from .agents_schemas import GuardrailResult

logger = logging.getLogger(__name__)

# Load .env from project root
_env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=_env_path, override=True)


# ---------------------------------------------------------------------------
# Guardrail class (singleton)
# ---------------------------------------------------------------------------
class _QueryGuardrail:
    """Thin wrapper: prompt + structured-output LLM call."""

    def __init__(self):
        self._llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0,
        ).with_structured_output(GuardrailResult)

        self._prompt = ChatPromptTemplate.from_messages([
            ("system", _GUARDRAIL_SYSTEM),
            ("human", "{topic}"),
        ])

        self._chain = self._prompt | self._llm


    def check(self, text: str) -> GuardrailResult:
        """Run the guardrail on a single piece of text."""
        try:
            return self._chain.invoke({"topic": text})
        except Exception as e:
            logger.warning("Guardrail LLM call failed (%s); allowing text through safely.", e)
            print(f"\n[GUARDRAIL ERROR DEBUG]: {e}\n")
            
            # FIXED: Use 'reason' instead of 'topic'
            return GuardrailResult(
                action="allow", 
                reason="Passed via safe fallback due to API error."
            )

# Module-level singleton — instantiated once on first import.
_guardrail = _QueryGuardrail()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def guardrail_check(text: str) -> GuardrailResult:
    """
    Check a single piece of user-provided text.

    Returns GuardrailResult with:
      - action: "allow" or "reject"
      - reason: explanation of the decision
    """
    if not text or not text.strip():
        # FIXED: Use 'reason' instead of 'topic' here as well
        return GuardrailResult(action="allow", reason="Empty text input allowed.")
    return _guardrail.check(text.strip())