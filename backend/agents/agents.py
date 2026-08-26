from __future__ import annotations

import logging
import os
import re
from datetime import date, timedelta
from pathlib import Path
from typing import Any, Callable, List, Optional, Union

from langgraph.types import Send, interrupt

from langchain_tavily import TavilySearch
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv

from .schemas import Task, Plan, EvidenceItem, EvidencePack, RouterDecision, coerce_plan
from .states import State
from .prompts import (
    ROUTER_SYSTEM,
    RESEARCH_SYSTEM,
    ORCH_SYSTEM,
    WORKER_SYSTEM,
    REVISE_SECTION_SYSTEM,
)
from .llms import get_llm
from .images import _safe_slug


logger = logging.getLogger(__name__)

env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=env_path, override=True)


# Domains we bias search toward when looking for up-to-date, credible info:
# official docs/blogs, research/academic sources, and reputable technical publishers.
CREDIBLE_DOMAINS = [
    "arxiv.org",
    "scholar.google.com",
    "paperswithcode.com",
    "openai.com",
    "platform.openai.com",
    "ai.google.dev",
    "deepmind.google",
    "developers.google.com",
    "docs.anthropic.com",
    "anthropic.com",
    "huggingface.co",
    "atomcamp.com",
    "microsoft.com",
    "research.google",
    "github.com",
    "ieee.org",
    "acm.org",
    "nature.com",
]


# ============================================================
# Fix #1: prompt-injection scrubbing for untrusted web content
# ============================================================
# Web pages are untrusted input. A scraped page (or an SEO/spam page, or a
# deliberately crafted one) can contain text aimed at the LLM rather than
# the human reader, e.g. "ignore previous instructions and...". We scrub
# obvious instruction-like phrases out of anything pulled from the web
# BEFORE it ever reaches a prompt, as a first line of defense - on top of
# the "treat this as data, not instructions" framing added to the prompts
# themselves (see prompts.py / the <untrusted_*> wrapping below).
_INJECTION_PATTERNS = [
    r"ignore\s+(all|any|the)?\s*(previous|prior|above)\s*instructions",
    r"disregard\s+(all|any|the)?\s*(previous|prior|above)\s*(instructions|prompt)",
    r"you\s+are\s+now\b",
    r"new\s+instructions?\s*:",
    r"system\s+prompt",
    r"act\s+as\s+(an?|the)\b",
    r"forget\s+(everything|all)\s*(above|before)?",
    r"</?(system|assistant|user)>",
]
_INJECTION_RE = re.compile("|".join(_INJECTION_PATTERNS), re.IGNORECASE)


def _scrub_injection(text: Optional[str]) -> str:
    if not text:
        return text or ""
    return _INJECTION_RE.sub("[redacted: instruction-like text removed]", text)


# ============================================================
# Fix #3: resilient structured-output calls
# ============================================================
def _invoke_structured(
    structured_llm,
    messages: list,
    fallback: Union[Any, Callable[[], Any]],
    node_name: str,
    retries: int = 2,
):
    """
    Calls a with_structured_output(...)-wrapped model, retrying if the
    response can't be parsed into the schema (common on smaller/free-tier
    models). If every attempt fails, returns `fallback` (a value, or a
    zero-arg callable producing one) instead of raising - so one bad LLM
    response degrades that step gracefully instead of crashing the whole
    graph run and losing the user's progress.
    """
    last_err: Optional[Exception] = None
    msgs = list(messages)
    for attempt in range(retries + 1):
        try:
            return structured_llm.invoke(msgs)
        except Exception as e:
            last_err = e
            if attempt < retries:
                msgs = msgs + [
                    HumanMessage(
                        content=(
                            "Your previous response could not be parsed into the "
                            "required structured schema. Respond again, strictly "
                            "matching the schema, with no extra commentary."
                        )
                    )
                ]
    print(f"[{node_name}] structured output failed after {retries + 1} attempt(s): {last_err}")
    return fallback() if callable(fallback) else fallback


def router_node(state: State) -> dict:
    llm = get_llm()
    decider = llm.with_structured_output(RouterDecision)
    decision = _invoke_structured(
        decider,
        [
            SystemMessage(content=ROUTER_SYSTEM),
            HumanMessage(content=f"Topic: {state['topic']}\nAs-of date: {state['as_of']}"),
        ],
        fallback=lambda: RouterDecision(
            needs_research=True,
            mode="hybrid",
            reason="Fallback: router could not produce a valid structured decision.",
            queries=[state["topic"]],
            max_results_per_query=5,
        ),
        node_name="router_node",
    )

    if decision.mode == "open_book":
        recency_days = 7
    elif decision.mode == "hybrid":
        recency_days = 45
    else:
        recency_days = 3650

    # A small/free-tier model is unreliable at judging "does this topic need
    # research" - and the whole point of this tool is grounding on fresh,
    # credible sources. So we always research by default; the user can still
    # explicitly skip it at the HITL checkpoint below if they want a
    # closed-book post.
    queries = decision.queries or [state["topic"]]

    return {
        "needs_research": True,
        "mode": decision.mode,
        "queries": queries,
        "recency_days": recency_days,
    }


# -----------------------------
# 3b) HITL #1 - approve/edit the research plan BEFORE any web search runs
# -----------------------------
def human_review_research_plan(state: State) -> dict:
    """
    Pauses the graph and shows the user the proposed research plan
    (mode + search queries) before any web search happens.

    Expected resume payload (sent from the UI via Command(resume=...)):
      {"action": "approve"}                    # research runs with the queries as shown
      {"action": "edit", "queries": [...]}      # user rewrote the queries, then research runs
      {"action": "skip_research"}               # user explicitly wants a closed-book post
    """
    decision = interrupt(
        {
            "type": "research_plan_review",
            "topic": state["topic"],
            "mode": state.get("mode"),
            "needs_research": state.get("needs_research"),
            "queries": state.get("queries", []),
            "recency_days": state.get("recency_days"),
        }
    ) or {}

    action = decision.get("action", "approve")

    if action == "edit":
        edited = [q.strip() for q in (decision.get("queries") or []) if q.strip()]
        return {"queries": edited, "needs_research": bool(edited)}

    if action == "skip_research":
        return {"needs_research": False, "queries": []}

    # approve as-is - research runs with the queries already proposed
    return {}


def route_next(state: State) -> str:
    return "research" if state["needs_research"] else "orchestrator"

# -----------------------------
# 4) Research (Tavily)
# -----------------------------
def _tavily_search(
    query: str,
    max_results: int = 5,
    include_domains: Optional[List[str]] = None,
) -> List[dict]:
    if not os.getenv("TAVILY_API_KEY"):
        return []
    try:
        kwargs = {"max_results": max_results}
        if include_domains:
            kwargs["include_domains"] = include_domains
        tool = TavilySearch(**kwargs)
        results = tool.invoke({"query": query})
        out: List[dict] = []
        for r in results or []:
            out.append(
                {
                    "title": _scrub_injection((r.get("title") or "")[:300]),
                    "url": r.get("url") or "",
                    "snippet": _scrub_injection((r.get("content") or r.get("snippet") or "")[:600]),
                    "published_at": r.get("published_date") or r.get("published_at"),
                    "source": r.get("source"),
                }
            )
        return out
    except Exception:
        return []

def _iso_to_date(s: Optional[str]) -> Optional[date]:
    if not s:
        return None
    try:
        return date.fromisoformat(s[:10])
    except Exception:
        return None



def research_node(state: State) -> dict:
    queries = (state.get("queries") or [])[:10]
    raw: List[dict] = []
    seen_urls = set()

    for q in queries:
        # Pass 1: bias toward credible/authoritative domains.
        for r in _tavily_search(q, max_results=4, include_domains=CREDIBLE_DOMAINS):
            if r["url"] and r["url"] not in seen_urls:
                seen_urls.add(r["url"])
                raw.append(r)
        # Pass 2: general web, to fill gaps credible-only search misses.
        for r in _tavily_search(q, max_results=3):
            if r["url"] and r["url"] not in seen_urls:
                seen_urls.add(r["url"])
                raw.append(r)

    if not raw:
        return {"evidence": []}

    # Keep the raw payload bounded so we don't blow the extractor's context.
    raw = raw[:60]

    llm = get_llm()
    extractor = llm.with_structured_output(EvidencePack)
    pack = _invoke_structured(
        extractor,
        [
            SystemMessage(content=RESEARCH_SYSTEM),
            HumanMessage(
                content=(
                    f"As-of date: {state['as_of']}\n"
                    f"Recency days: {state['recency_days']}\n\n"
                    f"Raw results:\n{raw}"
                )
            ),
        ],
        fallback=lambda: EvidencePack(evidence=[]),
        node_name="research_node",
    )

    dedup = {}
    for e in pack.evidence:
        if e.url:
            dedup[e.url] = e
    evidence = list(dedup.values())

    if state.get("mode") == "open_book":
        as_of = date.fromisoformat(state["as_of"])
        cutoff = as_of - timedelta(days=int(state["recency_days"]))
        evidence = [e for e in evidence if (d := _iso_to_date(e.published_at)) and d >= cutoff]

    return {"evidence": evidence}



def orchestrator_node(state: State) -> dict:
    llm = get_llm()
    planner = llm.with_structured_output(Plan)
    mode = state.get("mode", "closed_book")
    evidence = state.get("evidence", [])

    audience_pref = (state.get("audience_pref") or "").strip() or None
    tone_pref = (state.get("tone_pref") or "").strip() or None
    blog_kind_pref = (state.get("blog_kind_pref") or "").strip() or None

    # A user-picked blog_kind wins outright; otherwise open_book topics are
    # still auto-forced into a news roundup.
    forced_kind = blog_kind_pref or ("news_roundup" if mode == "open_book" else None)

    pref_lines = []
    if audience_pref:
        pref_lines.append(f"Required audience (must match exactly): {audience_pref}")
    if tone_pref:
        pref_lines.append(f"Required tone (must match exactly): {tone_pref}")
    if forced_kind:
        pref_lines.append(f"Required blog_kind (must match exactly): {forced_kind}")
    pref_text = ("\n".join(pref_lines) + "\n") if pref_lines else ""

    plan = _invoke_structured(
        planner,
        [
            SystemMessage(content=ORCH_SYSTEM),
            HumanMessage(
                content=(
                    f"Topic: {state['topic']}\n"
                    f"Mode: {mode}\n"
                    f"As-of: {state['as_of']} (recency_days={state['recency_days']})\n"
                    f"{pref_text}\n"
                    f"Evidence:\n{[e.model_dump() for e in evidence][:16]}"
                )
            ),
        ],
        fallback=lambda: Plan(
            blog_title=(state["topic"][:120] or "Untitled Post"),
            audience=audience_pref or "General technical readers",
            tone=tone_pref or "Clear and informative",
            blog_kind=forced_kind or "explainer",
            constraints=["Fallback plan: outline LLM call failed after retries; single section only."],
            tasks=[
                Task(
                    id=1,
                    title=(state["topic"][:80] or "Overview"),
                    goal="Give the reader a clear, accurate overview of the topic.",
                    bullets=["Define the topic", "Explain why it matters", "Summarize the key points"],
                    target_words=400,
                    tags=[],
                    requires_research=bool(evidence),
                    requires_citations=bool(evidence),
                    requires_code=False,
                )
            ],
        ),
        node_name="orchestrator_node",
    )

    # Don't rely on a small/free-tier model to have actually followed the
    # instruction - force the exact values the user picked in the UI.
    if forced_kind:
        plan.blog_kind = forced_kind
    if audience_pref:
        plan.audience = audience_pref
    if tone_pref:
        plan.tone = tone_pref

    return {"plan": plan}


# -----------------------------
# 6) Fanout
# -----------------------------
def fanout(state: State):
    assert state["plan"] is not None
    return [
        Send(
            "worker",
            {
                "task": task.model_dump(),
                "topic": state["topic"],
                "mode": state["mode"],
                "as_of": state["as_of"],
                "recency_days": state["recency_days"],
                "plan": state["plan"].model_dump(),
                "evidence": [e.model_dump() for e in state.get("evidence", [])],
            },
        )
        for task in state["plan"].tasks
    ]



def worker_node(payload: dict) -> dict:
    """Write one blog section. Wrapped in try/except so a single failed
    worker doesn't crash the entire fanout — it returns a placeholder instead."""
    task = Task(**payload["task"])
    try:
        plan = Plan(**payload["plan"])
        evidence = [EvidenceItem(**e) for e in payload.get("evidence", [])]

        bullets_text = "\n- " + "\n- ".join(task.bullets)
        evidence_text = "\n".join(
            f"- {e.title} | {e.url} | {e.published_at or 'date:unknown'}"
            for e in evidence[:20]
        )

        llm = get_llm()
        section_md = llm.invoke(
            [
                SystemMessage(content=WORKER_SYSTEM),
                HumanMessage(
                    content=(
                        f"Blog title: {plan.blog_title}\n"
                        f"Audience: {plan.audience}\n"
                        f"Tone: {plan.tone}\n"
                        f"Blog kind: {plan.blog_kind}\n"
                        f"Constraints: {plan.constraints}\n"
                        f"Topic: {payload['topic']}\n"
                        f"Mode: {payload.get('mode')}\n"
                        f"As-of: {payload.get('as_of')} (recency_days={payload.get('recency_days')})\n\n"
                        f"Section title: {task.title}\n"
                        f"Goal: {task.goal}\n"
                        f"Target words: {task.target_words}\n"
                        f"Tags: {task.tags}\n"
                        f"requires_research: {task.requires_research}\n"
                        f"requires_citations: {task.requires_citations}\n"
                        f"requires_code: {task.requires_code}\n"
                        f"Bullets:{bullets_text}\n\n"
                        f"Evidence (ONLY cite these URLs):\n{evidence_text}\n"
                    )
                ),
            ]
        ).content.strip()

        return {"sections": [(task.id, section_md)]}

    except Exception as e:
        logger.error("worker_node failed for task %s (%s): %s", task.id, task.title, e)
        placeholder = (
            f"## {task.title}\n\n"
            f"> **This section could not be generated** (worker error). "
            f"Please retry or edit manually.\n"
        )
        return {"sections": [(task.id, placeholder)]}

# ============================================================
# 8) merge_content - joins worker sections + a References list from
#    evidence into one document. Image placement (decide_images,
#    generate_and_place_images) lives in images.py; graph.py wires the
#    two together into the reducer subgraph.
# ============================================================
def merge_content(state: State) -> dict:
    plan = state["plan"]
    if plan is None:
        raise ValueError("merge_content called without plan.")
    ordered_sections = [md for _, md in sorted(state["sections"], key=lambda x: x[0])]
    body = "\n\n".join(ordered_sections).strip()

    # Surface every source link used during research directly in the post,
    # so "bring the links along" is satisfied even if a worker forgot one.
    evidence = state.get("evidence", []) or []
    refs_md = ""
    if evidence:
        lines = []
        for e in evidence:
            title = (e.title or e.url).strip()
            date_str = f" — {e.published_at}" if e.published_at else ""
            lines.append(f"- [{title}]({e.url}){date_str}")
        refs_md = "\n\n## References\n\n" + "\n".join(lines) + "\n"

    merged_md = f"# {plan.blog_title}\n\n{body}\n{refs_md}"
    return {"merged_md": merged_md}


# -----------------------------
# 8b) HITL #2 - approve the final draft, or request a targeted section edit
# -----------------------------
def human_review_final_draft(state: State) -> dict:
    """
    Pauses the graph with the finished draft. Resume payload:
      {"action": "approve"}
      {"action": "revise", "instructions": "In the ## Intro section, ..."}
    """
    decision = interrupt(
        {
            "type": "final_draft_review",
            "final_md": state.get("final", ""),
        }
    ) or {}

    action = decision.get("action", "approve")
    if action == "revise":
        return {"revision_request": (decision.get("instructions") or "").strip()}
    return {"revision_request": None}


def route_after_final_review(state: State) -> str:
    return "revise" if state.get("revision_request") else "end"



def revise_section_node(state: State) -> dict:
    """
    Rewrites ONLY the section the user pointed at, leaving everything else
    in the markdown untouched, then loops back to human_review_final_draft.
    """
    instruction = state.get("revision_request") or ""
    current_md = state.get("final", "") or state.get("merged_md", "")
    coerce_plan(state.get("plan"))  # validate — may be a dict after a checkpoint resume

    llm = get_llm()
    updated = llm.invoke(
        [
            SystemMessage(content=REVISE_SECTION_SYSTEM),
            HumanMessage(
                content=(
                    f"Current full blog markdown:\n\n{current_md}\n\n"
                    f"User revision instruction (identifies the target section):\n{instruction}\n"
                )
            ),
        ]
    ).content.strip()

    return {"final": updated, "revision_request": None}