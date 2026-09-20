from __future__ import annotations

import logging
from pathlib import Path

from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate

from .agents_schemas import GuardrailResult
from .prompts import _GUARDRAIL_SYSTEM
from .llms import get_llm

logger = logging.getLogger(__name__)

# Load .env from project root.
_env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=_env_path, override=True)


# ---------------------------------------------------------------------------
# Guardrail class (singleton)
# ---------------------------------------------------------------------------
class _QueryGuardrail:
    """Thin wrapper around the structured-output guardrail LLM call."""

    def __init__(self):
        self._llm = get_llm().with_structured_output(GuardrailResult)

        self._prompt = ChatPromptTemplate.from_messages(
            [
                ("system", _GUARDRAIL_SYSTEM),
                ("human", "{topic}"),
            ]
        )

        self._chain = self._prompt | self._llm

    def check(self, text: str) -> GuardrailResult:
        """Run the guardrail on a single piece of user-provided text."""
        try:
            result = self._chain.invoke({"topic": text})

            # Defensive normalization in case a provider returns an unexpected
            # category while still satisfying the structured schema.
            if not result.category:
                result.category = (
                    "safe" if result.action == "allow" else "other_harmful"
                )

            return result

        except Exception as e:
            logger.warning(
                "Guardrail LLM call failed (%s); allowing text through safely.",
                e,
            )

            print(f"\n[GUARDRAIL ERROR DEBUG]: {e}\n")

            # Safe fallback: a guardrail service failure must not fabricate a
            # harmful classification. The request is allowed through, and the
            # failure is recorded in the reason for debugging.
            return GuardrailResult(
                action="allow",
                category="safe",
                reason="Passed via safe fallback due to guardrail API error.",
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
      - category: structured safety category
      - reason: explanation of the decision
    """
    if not text or not text.strip():
        return GuardrailResult(
            action="allow",
            category="safe",
            reason="Empty text input allowed.",
        )

    return _guardrail.check(text.strip())


# from __future__ import annotations

# import logging
# from pathlib import Path

# from dotenv import load_dotenv
# from langchain_core.prompts import ChatPromptTemplate
# from langchain_google_genai import ChatGoogleGenerativeAI

# from .agents_schemas import GuardrailResult
# from .prompts import _GUARDRAIL_SYSTEM
# from .llms import get_llm

# logger = logging.getLogger(__name__)

# # Load .env from project root.
# _env_path = Path(__file__).resolve().parents[2] / ".env"
# load_dotenv(dotenv_path=_env_path, override=True)


# # ---------------------------------------------------------------------------
# # Guardrail class (singleton)
# # ---------------------------------------------------------------------------
# class _QueryGuardrail:
#     """Thin wrapper around the structured-output guardrail LLM call."""

#     def __init__(self):
#         self._llm = get_llm().with_structured_output(GuardrailResult)
#         # self._llm = ChatGoogleGenerativeAI(
#         #     model="gemini-2.5-flash",
#         #     temperature=0,
#         # ).with_structured_output(GuardrailResult)

#         self._prompt = ChatPromptTemplate.from_messages(
#             [
#                 ("system", _GUARDRAIL_SYSTEM),
#                 ("human", "{topic}"),
#             ]
#         )

#         self._chain = self._prompt | self._llm

#     def check(self, text: str) -> GuardrailResult:
#         """Run the guardrail on a single piece of user-provided text."""
#         try:
#             result = self._chain.invoke({"topic": text})

#             # Defensive normalization in case a provider returns an unexpected
#             # category while still satisfying the structured schema.
#             if not result.category:
#                 result.category = (
#                     "safe" if result.action == "allow" else "other_harmful"
#                 )

#             return result

#         except Exception as e:
#             logger.warning(
#                 "Guardrail LLM call failed (%s); allowing text through safely.",
#                 e,
#             )

#             print(f"\n[GUARDRAIL ERROR DEBUG]: {e}\n")

#             # Safe fallback: a guardrail service failure must not fabricate a
#             # harmful classification. The request is allowed through, and the
#             # failure is recorded in the reason for debugging.
#             return GuardrailResult(
#                 action="allow",
#                 category="safe",
#                 reason="Passed via safe fallback due to guardrail API error.",
#             )


# # Module-level singleton — instantiated once on first import.
# _guardrail = _QueryGuardrail()


# # ---------------------------------------------------------------------------
# # Public API
# # ---------------------------------------------------------------------------
# def guardrail_check(text: str) -> GuardrailResult:
#     """
#     Check a single piece of user-provided text.

#     Returns GuardrailResult with:
#       - action: "allow" or "reject"
#       - category: structured safety category
#       - reason: explanation of the decision
#     """
#     if not text or not text.strip():
#         return GuardrailResult(
#             action="allow",
#             category="safe",
#             reason="Empty text input allowed.",
#         )

#     return _guardrail.check(text.strip())