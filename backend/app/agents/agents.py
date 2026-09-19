# from __future__ import annotations

# import logging
# import os
# import re
# from pathlib import Path
# from typing import Any, Callable, List, Optional, Union


# from langgraph.types import Send, interrupt

# from langchain_tavily import TavilySearch
# from langchain_core.messages import SystemMessage, HumanMessage
# from langchain_google_genai import ChatGoogleGenerativeAI
# from dotenv import load_dotenv

# from .agents_schemas import Task, Plan, EvidenceItem, EvidencePack, OutlineResult,RouterDecision, coerce_plan
# from .states import State
# from .prompts import (
#     RESEARCH_SYSTEM,
#     ORCH_SYSTEM,
#     WORKER_SYSTEM,
#     REVISE_SECTION_SYSTEM,
# )
# from .llms import get_llm
# from .guardrail import guardrail_check
# from .agents_schemas import GuardrailResult
# from workflow import mark_workflow_step

# logger = logging.getLogger(__name__)

# env_path = Path(__file__).resolve().parents[2] / ".env"
# load_dotenv(dotenv_path=env_path, override=True)





# # ============================================================
# # 1) Core Utilities (Injection Scrubbing & Structured Output)
# # ============================================================
# _INJECTION_PATTERNS = [
#     r"ignore\s+(all|any|the)?\s*(previous|prior|above)\s*instructions",
#     r"disregard\s+(all|any|the)?\s*(previous|prior|above)\s*(instructions|prompt)",
#     r"you\s+are\s+now\b",
#     r"new\s+instructions?\s*:",
#     r"system\s+prompt",
#     r"act\s+as\s+(an?|the)\b",
#     r"forget\s+(everything|all)\s*(above|before)?",
#     r"</?(system|assistant|user)>",
# ]
# _INJECTION_RE = re.compile("|".join(_INJECTION_PATTERNS), re.IGNORECASE)

# def _scrub_injection(text: Optional[str]) -> str:
#     if not text:
#         return text or ""
#     return _INJECTION_RE.sub("[redacted: instruction-like text removed]", text)

# def _invoke_structured(
#     structured_llm,
#     messages: list,
#     fallback: Union[Any, Callable[[], Any]],
#     node_name: str,
#     retries: int = 2,
# ):
#     last_err: Optional[Exception] = None
#     msgs = list(messages)
#     for attempt in range(retries + 1):
#         try:
#             return structured_llm.invoke(msgs)
#         except Exception as e:
#             last_err = e
#             if attempt < retries:
#                 msgs = msgs + [
#                     HumanMessage(
#                         content="Your previous response could not be parsed into the required schema. Respond again strictly matching the schema."
#                     )
#                 ]
#     logger.warning(f"[{node_name}] structured output failed: {last_err}")
#     return fallback() if callable(fallback) else fallback


# # ============================================================
# # 3) Workflow Nodes (Reordered for your new FYP architecture)
# # ============================================================

# def topic_guardrail_node(state: State) -> dict:
#     """Node 1: Topic is already validated by FastAPI, just pass it through."""
#     mark_workflow_step(state.get("run_id"), "guardrail")
#     return {"topic": state["topic"], "workflow_step": "guardrail"}


# def outline_generator_node(state: State) -> dict:
#     """Node 2: Generates max 4 subtopics from the safe topic."""
#     mark_workflow_step(state.get("run_id"), "outline")
#     llm = get_llm()
#     outline_llm = llm.with_structured_output(OutlineResult)
    
#     ### CHANGED: Replaced the old router node with this outline generator
#     decision = _invoke_structured(
#         outline_llm,
#         [
#             SystemMessage(content="You are an expert outline generator. Break the provided topic into exactly 1 to 4 specific subtopics for web research. Return only the JSON schema."),
#             HumanMessage(content=f"Topic: {state['topic']}")
#         ],
#         fallback=lambda: OutlineResult(subtopics=[state["topic"]]),
#         node_name="outline_generator_node"
#     )
    
#     # Defaults to hybrid recency for web research
#     return {
#         "queries": decision.subtopics,
#         "needs_research": True,
#         "workflow_step": "outline",
#         "mode": "hybrid",
#         "recency_days": 45
#     }


# def human_review_outline_node(state: State) -> dict:
#     """Node 3: HITL Checkpoint. User reviews/edits the 4 subtopics."""
#     mark_workflow_step(state.get("run_id"), "outline-review")
#     decision = interrupt(
#         {
#             "type": "research_plan_review",
#             "topic": state["topic"],
#             "queries": state.get("queries", []),
#         }
#     ) or {}

#     action = decision.get("action", "approve")

#     if action == "edit":
#         edited = [q.strip() for q in (decision.get("queries") or []) if q.strip()]
#         return {"queries": edited, "needs_research": bool(edited)}

#     if action == "skip_research":
#         return {"needs_research": False, "queries": []}

#     return {}


# def subtopic_guardrail_node(state: State) -> dict:
#     """Node 4: Subtopics were already validated by FastAPI before resume. Pass through."""
#     mark_workflow_step(state.get("run_id"), "safety")
#     return {"queries": state.get("queries", []), "workflow_step": "safety"}



# def _tavily_search(query: str, max_results: int = 5, include_domains: Optional[List[str]] = None) -> List[dict]:
#     if not os.getenv("TAVILY_API_KEY"):
#         return []
#     try:
#         kwargs = {"max_results": max_results}
#         if include_domains:
#             kwargs["include_domains"] = include_domains
#         tool = TavilySearch(**kwargs)
#         results = tool.invoke({"query": query})
#         out: List[dict] = []
#         for r in results or []:
#             out.append(
#                 {
#                     "title": _scrub_injection((r.get("title") or "")[:300]),
#                     "url": r.get("url") or "",
#                     "snippet": _scrub_injection((r.get("content") or r.get("snippet") or "")[:600]),
#                     "published_at": r.get("published_date") or r.get("published_at"),
#                 }
#             )
#         return out
#     except Exception:
#         return []



# def research_node(state: State) -> dict:
#     """Node 5: Scrapes the web and scopes evidence strictly to each safe subtopic."""
#     mark_workflow_step(state.get("run_id"), "research")
#     if not state.get("needs_research"):
#         return {"evidence": [], "workflow_step": "research"}
        
#     queries = (state.get("queries") or [])[:4] # Enforce max 4
#     all_scoped_evidence = []
#     seen_urls = set()
#     CREDIBLE_DOMAINS = ["arxiv.org", "scholar.google.com", "github.com", "ieee.org"]
    
#     llm = get_llm()
#     extractor = llm.with_structured_output(EvidencePack)

#     for q in queries:
#         search_q = f"{q} technical educational overview"
#         raw: List[dict] = []
        
#         for r in _tavily_search(search_q, max_results=3, include_domains=CREDIBLE_DOMAINS):
#             if r["url"] and r["url"] not in seen_urls:
#                 seen_urls.add(r["url"])
#                 raw.append(r)
#         for r in _tavily_search(search_q, max_results=2):
#             if r["url"] and r["url"] not in seen_urls:
#                 seen_urls.add(r["url"])
#                 raw.append(r)

#         if not raw:
#             continue

#         # Extract structured evidence for this specific query
#         pack = _invoke_structured(
#             extractor,
#             [
#                 SystemMessage(content=RESEARCH_SYSTEM),
#                 HumanMessage(content=f"Subtopic Focus: {q}\nRaw results:\n{raw[:15]}")
#             ],
#             fallback=lambda: EvidencePack(evidence=[]),
#             node_name=f"research_node_{q}",
#         )

#         # Tag each evidence item with the query it belongs to
#         for item in pack.evidence:
#             if item.url:
#                 item_dict = item.model_dump()
#                 item_dict["query"] = q  # Stamp with subtopic name
#                 all_scoped_evidence.append(EvidenceItem(**item_dict))

#     return {"evidence": all_scoped_evidence}



# def orchestrator_node(state: State) -> dict:
#     """Node 6: Plans the blog based on the research evidence."""
#     mark_workflow_step(state.get("run_id"), "research-plan")
#     llm = get_llm()
#     planner = llm.with_structured_output(Plan)
#     evidence = state.get("evidence", [])
#     queries = state.get("queries", []) # Get the 4 approved/safe subtopics

#     # Format the required tasks to pass to the LLM
#     required_tasks = "\n".join([f"- {q}" for q in queries])

#     plan = _invoke_structured(
#         planner,
#         [
#             SystemMessage(content=ORCH_SYSTEM),
#             HumanMessage(content=(
#                 f"Topic: {state['topic']}\n\n"
#                 f"CRITICAL INSTRUCTION: You MUST create exactly {len(queries)} Tasks (sections) for this blog. "
#                 f"The 'title' of each Task MUST be EXACTLY these subtopics. Do not invent new headings:\n"
#                 f"{required_tasks}\n\n"
#                 f"Evidence:\n{[e.model_dump() for e in evidence][:10]}"
#             ))
#         ],
#         fallback=lambda: Plan(blog_title=state["topic"], audience="General", tone="Clear", blog_kind="explainer", tasks=[], constraints=[]),
#         node_name="orchestrator_node",
#     )
#     return {"plan": plan}



# def fanout(state: State):
#     """Node 7 (Edge): Spawns a worker for each task with strictly scoped evidence."""
#     all_evidence = state.get("evidence", [])
    
#     tasks_payload = []
#     for task in state["plan"].tasks:
#         # Filter evidence specifically for this task's title/subtopic
#         scoped_evidence = [
#             e.model_dump() for e in all_evidence 
#             if getattr(e, "query", None) == task.title
#         ]
        
#         # Fallback: if no exact tag match, give it all evidence to prevent empty context
#         if not scoped_evidence:
#             scoped_evidence = [e.model_dump() for e in all_evidence]

#         tasks_payload.append(
#             Send("worker", {
#                 "task": task.model_dump(),
#                 "topic": state["topic"],
#                 "plan": state["plan"].model_dump(),
#                 "evidence": scoped_evidence, # Only scoped evidence sent to this worker!
#                 "run_id": state.get("run_id"),
#             })
#         )
        
#     return tasks_payload



# def worker_node(payload: dict) -> dict:
#     """Node 8 (Parallel): Generates a specific blog section strictly mapped to its task title."""
#     mark_workflow_step(payload.get("run_id"), "writing")
#     task = Task(**payload["task"])
#     try:
#         plan = Plan(**payload["plan"])
#         evidence = [EvidenceItem(**e) for e in payload.get("evidence", [])]
#         evidence_text = "\n".join(f"- {e.title} | {e.url} | {e.snippet}" for e in evidence)

#         llm = get_llm()
#         raw_content = llm.invoke([
#             SystemMessage(content=WORKER_SYSTEM),
#             HumanMessage(content=f"Section Title: {task.title}\nGoal: {task.goal}\nScoped Evidence:\n{evidence_text}")
#         ]).content.strip()

#         # Enforce that the section starts with the exact outline heading
#         if not raw_content.startswith("#"):
#             section_md = f"## {task.title}\n\n{raw_content}"
#         else:
#             section_md = raw_content

#         return {"sections": [(task.id, section_md)]}
#     except Exception as e:
#         logger.error(f"worker_node failed for {task.title}: {e}")
#         return {"sections": [(task.id, f"## {task.title}\n\n> Generation failed for this section.\n")]}
    

# def merge_content(state: State) -> dict:
#     """Node 9: Merges parallel worker sections into one markdown string."""
#     mark_workflow_step(state.get("run_id"), "merge")
#     ordered_sections = [md for _, md in sorted(state["sections"], key=lambda x: x[0])]
#     body = "\n\n".join(ordered_sections).strip()

#     evidence = state.get("evidence", [])
#     refs_md = ""
#     if evidence:
#         lines = [f"- [{e.title or e.url}]({e.url})" for e in evidence]
#         refs_md = "\n\n## References\n\n" + "\n".join(lines) + "\n"

#     merged_md = f"# {state['plan'].blog_title}\n\n{body}\n{refs_md}"
#     return {"merged_md": merged_md, "final": merged_md, "workflow_step": "merge"}


# def human_review_final_draft(state: State) -> dict:
#     """Node 10: HITL Checkpoint for final reading."""
#     mark_workflow_step(state.get("run_id"), "final-review")
#     decision = interrupt({
#         "type": "final_draft_review",
#         "final_md": state.get("final", ""),
#     }) or {}
    
#     action = decision.get("action", "approve")
#     if action == "revise":
#         return {"revision_request": (decision.get("instructions") or "").strip()}
#     return {"revision_request": None}



# # ============================================================
# # Final HITL: deterministic, section-isolated revision helpers
# # ============================================================
# def _markdown_sections(markdown: str) -> list[tuple[str, str, str]]:
#     """Return top-level ``##`` sections as (heading, full_text, body).

#     The returned full_text includes the original heading and all content up to
#     (but not including) the next top-level ``##`` heading. ``#`` title text and
#     ``## References`` are intentionally not treated as ordinary revision
#     targets by the resolver.
#     """
#     if not markdown:
#         return []

#     matches = list(re.finditer(r"(?m)^(##)\s+([^#].*?)\s*$", markdown))
#     sections: list[tuple[str, str, str]] = []
#     for index, match in enumerate(matches):
#         start = match.start()
#         end = matches[index + 1].start() if index + 1 < len(matches) else len(markdown)
#         full_text = markdown[start:end]
#         heading = match.group(2).strip()
#         body = full_text[match.end() - start:]
#         sections.append((heading, full_text, body))
#     return sections


# def _normalize_section_name(value: str) -> str:
#     value = re.sub(r"^#+\s*", "", value or "")
#     value = re.sub(r"^section\s*(?:number\s*)?\d+\s*[:.-]?\s*", "", value, flags=re.I)
#     value = re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()
#     return value


# def _resolve_revision_section(markdown: str, instruction: str) -> tuple[int, str, str, str]:
#     """Resolve one concrete ``##`` section from a human revision instruction.

#     Resolution is deterministic: explicit section numbers are preferred, then
#     exact heading matches, then a unique heading phrase match. References are
#     never selected as a normal revision target.
#     """
#     sections = [s for s in _markdown_sections(markdown)
#                 if _normalize_section_name(s[0]) != "references"]
#     if not sections:
#         raise ValueError("The current blog does not contain any editable sections.")

#     text = instruction.strip()
#     if not text:
#         raise ValueError("A revision instruction is required.")

#     # Explicit forms: "section 3", "section #3", "section number 3".
#     number_match = re.search(r"\bsection\s*(?:number\s*)?#?\s*(\d+)\b", text, flags=re.I)
#     if number_match:
#         number = int(number_match.group(1))
#         if 1 <= number <= len(sections):
#             heading, full_text, body = sections[number - 1]
#             return number - 1, heading, full_text, body
#         raise ValueError(f"Section {number} does not exist. The blog has {len(sections)} editable sections.")

#     normalized_instruction = _normalize_section_name(text)
#     candidates: list[tuple[int, str, str, str]] = []

#     for index, (heading, full_text, body) in enumerate(sections):
#         normalized_heading = _normalize_section_name(heading)
#         if normalized_heading and normalized_heading in normalized_instruction:
#             candidates.append((index, heading, full_text, body))
#         elif normalized_instruction and normalized_instruction in normalized_heading:
#             candidates.append((index, heading, full_text, body))

#     if len(candidates) == 1:
#         return candidates[0]
#     if len(candidates) > 1:
#         # Prefer the longest heading match; this avoids short generic words
#         # accidentally selecting multiple sections.
#         candidates.sort(key=lambda item: len(_normalize_section_name(item[1])), reverse=True)
#         top = candidates[0]
#         if len(_normalize_section_name(top[1])) > len(_normalize_section_name(candidates[1][1])):
#             return top

#     # Common UI phrasing: "Introduction: simplify..." / "Conclusion - ...".
#     for index, (heading, full_text, body) in enumerate(sections):
#         if re.search(rf"\b{re.escape(heading)}\b", text, flags=re.I):
#             return index, heading, full_text, body

#     raise ValueError(
#         "Could not identify the section to revise. Specify a section number "
#         "(for example, 'Revise section 3') or the section heading."
#     )


# def _replace_markdown_section(markdown: str, old_full_text: str, new_full_text: str) -> str:
#     """Replace exactly one previously extracted section, preserving everything else."""
#     first = markdown.find(old_full_text)
#     if first < 0:
#         raise ValueError("The target section changed before revision could be applied.")
#     second = markdown.find(old_full_text, first + 1)
#     if second >= 0:
#         raise ValueError("The target section text is not unique; refusing an unsafe replacement.")
#     return markdown[:first] + new_full_text + markdown[first + len(old_full_text):]


# def _clean_revised_section(
#     raw: str, original_heading: str, original_section: str = ""
# ) -> str:
#     """Normalize an LLM response into exactly one ``##`` section.

#     The original section's trailing whitespace is preserved so replacing the
#     target does not accidentally reformat the boundary before the next section.
#     """
#     raw = (raw or "").strip()
#     if not raw:
#         raise ValueError("The revision model returned an empty section.")

#     # The model is asked for only the section, but tolerate a leading heading.
#     heading_match = re.match(r"^##\s+(.+?)\s*(?:\n|$)", raw)
#     if heading_match:
#         raw_body = raw[heading_match.end():].lstrip("\n")
#     else:
#         first_line, _, remainder = raw.partition("\n")
#         if re.match(r"^#{1,6}\s+", first_line):
#             raw_body = remainder.lstrip("\n")
#         else:
#             raw_body = raw

#     # A revision must not accidentally create another top-level section.
#     if re.search(r"(?m)^##\s+", raw_body):
#         raise ValueError("The revision model returned another top-level section; refusing the revision.")

#     trailing_match = re.search(r"(\n[ \t]*)\Z", original_section or "")
#     trailing = trailing_match.group(1) if trailing_match else "\n"
#     return f"## {original_heading}\n\n{raw_body.strip()}{trailing}"


# def revise_section_node(state: State) -> dict:
#     """Node 11: Revise exactly one requested section and preserve all others."""
#     mark_workflow_step(state.get("run_id"), "final-review")
#     instruction = (state.get("revision_request") or "").strip()
#     current_md = state.get("final") or state.get("merged_md") or ""

#     section_index, heading, original_section, original_body = _resolve_revision_section(
#         current_md, instruction
#     )

#     llm = get_llm()
#     revised_raw = llm.invoke([
#         SystemMessage(content=REVISE_SECTION_SYSTEM),
#         HumanMessage(content=(
#             f"Blog section number: {section_index + 1}\n"
#             f"Exact section heading: ## {heading}\n\n"
#             f"Current section only:\n{original_section}\n\n"
#             f"User revision instruction:\n{instruction}\n\n"
#             "Return ONLY the revised content for this one section. Do not return "
#             "the blog title, other sections, References, or commentary. Keep the "
#             "section heading as exactly provided above."
#         ))
#     ]).content

#     revised_section = _clean_revised_section(revised_raw, heading, original_section)
#     updated = _replace_markdown_section(current_md, original_section, revised_section)

#     return {
#         "final": updated,
#         "merged_md": updated,
#         "revision_request": None,
#     }



# def route_after_final_review(state: State) -> str:
#     """Routes the graph after the final HITL review."""
#     return "revise_section" if state.get("revision_request") else "end"











from __future__ import annotations

import logging
import os
import re
from pathlib import Path
from typing import Any, Callable, List, Optional, Union


from langgraph.types import Send, interrupt

from langchain_tavily import TavilySearch
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

from .agents_schemas import (
    Task,
    Plan,
    EvidenceItem,
    EvidencePack,
    OutlineResult,
    RouterDecision,
    coerce_plan,
)
from .states import State
from .prompts import (
    RESEARCH_SYSTEM,
    ORCH_SYSTEM,
    WORKER_SYSTEM,
    REVISE_SECTION_SYSTEM,
)
from .llms import get_llm
from .guardrail import guardrail_check
from .agents_schemas import GuardrailResult
from workflow import mark_workflow_step

logger = logging.getLogger(__name__)

env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=env_path, override=True)


# ============================================================
# 1) Core Utilities (Injection Scrubbing & Structured Output)
# ============================================================
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


def _invoke_structured(
    structured_llm,
    messages: list,
    fallback: Union[Any, Callable[[], Any]],
    node_name: str,
    retries: int = 2,
):
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
                        content="Your previous response could not be parsed into the required schema. Respond again strictly matching the schema."
                    )
                ]
    logger.warning(f"[{node_name}] structured output failed: {last_err}")
    return fallback() if callable(fallback) else fallback


# ============================================================
# 3) Workflow Nodes (Reordered for your new FYP architecture)
# ============================================================

def topic_guardrail_node(state: State) -> dict:
    """Node 1: Topic is already validated by FastAPI, just pass it through."""
    mark_workflow_step(state.get("run_id"), "guardrail")
    return {"topic": state["topic"], "workflow_step": "guardrail"}


def outline_generator_node(state: State) -> dict:
    """Node 2: Generates max 4 subtopics from the safe topic."""
    mark_workflow_step(state.get("run_id"), "outline")
    llm = get_llm()
    outline_llm = llm.with_structured_output(OutlineResult)

    ### CHANGED: Replaced the old router node with this outline generator
    decision = _invoke_structured(
        outline_llm,
        [
            SystemMessage(
                content="You are an expert outline generator. Break the provided topic into exactly 1 to 4 specific subtopics for web research. Return only the JSON schema."
            ),
            HumanMessage(content=f"Topic: {state['topic']}")
        ],
        fallback=lambda: OutlineResult(subtopics=[state["topic"]]),
        node_name="outline_generator_node"
    )

    # Defaults to hybrid recency for web research
    return {
        "queries": decision.subtopics,
        "needs_research": True,
        "workflow_step": "outline",
        "mode": "hybrid",
        "recency_days": 45
    }


def human_review_outline_node(state: State) -> dict:
    """Node 3: HITL Checkpoint. User reviews/edits the 4 subtopics."""
    mark_workflow_step(state.get("run_id"), "outline-review")
    decision = interrupt(
        {
            "type": "research_plan_review",
            "topic": state["topic"],
            "queries": state.get("queries", []),
        }
    ) or {}

    action = decision.get("action", "approve")

    if action == "edit":
        edited = [
            q.strip()
            for q in (decision.get("queries") or [])
            if q.strip()
        ]
        return {
            "queries": edited,
            "needs_research": bool(edited),
        }

    if action == "skip_research":
        return {
            "needs_research": False,
            "queries": [],
        }

    return {}


def subtopic_guardrail_node(state: State) -> dict:
    """Node 4: Subtopics were already validated by FastAPI before resume. Pass through."""
    mark_workflow_step(state.get("run_id"), "safety")
    return {
        "queries": state.get("queries", []),
        "workflow_step": "safety",
    }


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
                    "snippet": _scrub_injection(
                        (r.get("content") or r.get("snippet") or "")[:600]
                    ),
                    "published_at": r.get("published_date")
                    or r.get("published_at"),
                }
            )

        return out

    except Exception:
        return []


def research_node(state: State) -> dict:
    """Node 5: Scrapes the web and scopes evidence strictly to each safe subtopic."""
    mark_workflow_step(state.get("run_id"), "research")

    if not state.get("needs_research"):
        return {
            "evidence": [],
            "workflow_step": "research",
        }

    queries = (state.get("queries") or [])[:4]  # Enforce max 4
    all_scoped_evidence = []
    seen_urls = set()

    CREDIBLE_DOMAINS = [
        "arxiv.org",
        "scholar.google.com",
        "github.com",
        "ieee.org",
    ]

    llm = get_llm()
    extractor = llm.with_structured_output(EvidencePack)

    for q in queries:
        search_q = f"{q} technical educational overview"
        raw: List[dict] = []

        for r in _tavily_search(
            search_q,
            max_results=3,
            include_domains=CREDIBLE_DOMAINS,
        ):
            if r["url"] and r["url"] not in seen_urls:
                seen_urls.add(r["url"])
                raw.append(r)

        for r in _tavily_search(search_q, max_results=2):
            if r["url"] and r["url"] not in seen_urls:
                seen_urls.add(r["url"])
                raw.append(r)

        if not raw:
            continue

        # Extract structured evidence for this specific query
        pack = _invoke_structured(
            extractor,
            [
                SystemMessage(content=RESEARCH_SYSTEM),
                HumanMessage(
                    content=f"Subtopic Focus: {q}\nRaw results:\n{raw[:15]}"
                ),
            ],
            fallback=lambda: EvidencePack(evidence=[]),
            node_name=f"research_node_{q}",
        )

        # Tag each evidence item with the query it belongs to
        for item in pack.evidence:
            if item.url:
                item_dict = item.model_dump()
                item_dict["query"] = q  # Stamp with subtopic name
                all_scoped_evidence.append(EvidenceItem(**item_dict))

    return {"evidence": all_scoped_evidence}


def orchestrator_node(state: State) -> dict:
    """Node 6: Plans the blog based on the research evidence."""
    mark_workflow_step(state.get("run_id"), "research-plan")
    llm = get_llm()
    planner = llm.with_structured_output(Plan)

    evidence = state.get("evidence", [])
    queries = state.get("queries", [])  # Get the 4 approved/safe subtopics

    # Format the required tasks to pass to the LLM
    required_tasks = "\n".join([f"- {q}" for q in queries])

    plan = _invoke_structured(
        planner,
        [
            SystemMessage(content=ORCH_SYSTEM),
            HumanMessage(
                content=(
                    f"Topic: {state['topic']}\n\n"
                    f"CRITICAL INSTRUCTION: You MUST create exactly {len(queries)} Tasks (sections) for this blog. "
                    f"The 'title' of each Task MUST be EXACTLY these subtopics. Do not invent new headings:\n"
                    f"{required_tasks}\n\n"
                    f"Evidence:\n{[e.model_dump() for e in evidence][:10]}"
                )
            ),
        ],
        fallback=lambda: Plan(
            blog_title=state["topic"],
            audience="General",
            tone="Clear",
            blog_kind="explainer",
            tasks=[],
            constraints=[],
        ),
        node_name="orchestrator_node",
    )

    return {"plan": plan}


def fanout(state: State):
    """Node 7 (Edge): Spawns a worker for each task with strictly scoped evidence."""
    all_evidence = state.get("evidence", [])

    # Checkpoint recovery can restore Pydantic models as dictionaries.
    # Normalize the persisted plan before accessing its fields.
    plan = coerce_plan(state["plan"])

    tasks_payload = []

    for task in plan.tasks:
        # Filter evidence specifically for this task's title/subtopic
        scoped_evidence = [
            e.model_dump()
            for e in all_evidence
            if getattr(e, "query", None) == task.title
        ]

        # Fallback: if no exact tag match, give it all evidence to prevent empty context
        if not scoped_evidence:
            scoped_evidence = [
                e.model_dump()
                for e in all_evidence
            ]

        tasks_payload.append(
            Send(
                "worker",
                {
                    "task": task.model_dump(),
                    "topic": state["topic"],
                    "plan": plan.model_dump(),
                    "evidence": scoped_evidence,
                    # Only scoped evidence sent to this worker!
                    "run_id": state.get("run_id"),
                },
            )
        )

    return tasks_payload


def worker_node(payload: dict) -> dict:
    """Node 8 (Parallel): Generates a specific blog section strictly mapped to its task title."""
    mark_workflow_step(payload.get("run_id"), "writing")
    task = Task(**payload["task"])

    try:
        plan = Plan(**payload["plan"])
        evidence = [
            EvidenceItem(**e)
            for e in payload.get("evidence", [])
        ]

        evidence_text = "\n".join(
            f"- {e.title} | {e.url} | {e.snippet}"
            for e in evidence
        )

        llm = get_llm()

        raw_content = llm.invoke(
            [
                SystemMessage(content=WORKER_SYSTEM),
                HumanMessage(
                    content=(
                        f"Section Title: {task.title}\n"
                        f"Goal: {task.goal}\n"
                        f"Scoped Evidence:\n{evidence_text}"
                    )
                ),
            ]
        ).content.strip()

        # Enforce that the section starts with the exact outline heading
        if not raw_content.startswith("#"):
            section_md = f"## {task.title}\n\n{raw_content}"
        else:
            section_md = raw_content

        return {
            "sections": [
                (task.id, section_md)
            ]
        }

    except Exception as e:
        logger.error(
            f"worker_node failed for {task.title}: {e}"
        )

        return {
            "sections": [
                (
                    task.id,
                    f"## {task.title}\n\n"
                    f"> Generation failed for this section.\n",
                )
            ]
        }


def merge_content(state: State) -> dict:
    """Node 9: Merges parallel worker sections into one markdown string."""
    mark_workflow_step(state.get("run_id"), "merge")

    ordered_sections = [
        md
        for _, md in sorted(
            state["sections"],
            key=lambda x: x[0],
        )
    ]

    body = "\n\n".join(ordered_sections).strip()

    evidence = state.get("evidence", [])
    refs_md = ""

    if evidence:
        lines = [
            f"- [{e.title or e.url}]({e.url})"
            for e in evidence
        ]

        refs_md = (
            "\n\n## References\n\n"
            + "\n".join(lines)
            + "\n"
        )

    # Checkpoint recovery can restore the Plan model as a dictionary.
    # Normalize it before accessing blog_title.
    plan = coerce_plan(state["plan"])

    merged_md = (
        f"# {plan.blog_title}\n\n"
        f"{body}\n"
        f"{refs_md}"
    )

    return {
        "merged_md": merged_md,
        "final": merged_md,
        "workflow_step": "merge",
    }


def human_review_final_draft(state: State) -> dict:
    """Node 10: HITL Checkpoint for final reading."""
    mark_workflow_step(state.get("run_id"), "final-review")

    decision = interrupt(
        {
            "type": "final_draft_review",
            "final_md": state.get("final", ""),
        }
    ) or {}

    action = decision.get("action", "approve")

    if action == "revise":
        return {
            "revision_request": (
                decision.get("instructions") or ""
            ).strip()
        }

    return {
        "revision_request": None
    }


# ============================================================
# Final HITL: deterministic, section-isolated revision helpers
# ============================================================
def _markdown_sections(markdown: str) -> list[tuple[str, str, str]]:
    """Return top-level ``##`` sections as (heading, full_text, body).

    The returned full_text includes the original heading and all content up to
    (but not including) the next top-level ``##`` heading. ``#`` title text and
    ``## References`` are intentionally not treated as ordinary revision
    targets by the resolver.
    """
    if not markdown:
        return []

    matches = list(
        re.finditer(
            r"(?m)^(##)\s+([^#].*?)\s*$",
            markdown,
        )
    )

    sections: list[tuple[str, str, str]] = []

    for index, match in enumerate(matches):
        start = match.start()

        end = (
            matches[index + 1].start()
            if index + 1 < len(matches)
            else len(markdown)
        )

        full_text = markdown[start:end]
        heading = match.group(2).strip()
        body = full_text[match.end() - start:]

        sections.append(
            (
                heading,
                full_text,
                body,
            )
        )

    return sections


def _normalize_section_name(value: str) -> str:
    value = re.sub(
        r"^#+\s*",
        "",
        value or "",
    )

    value = re.sub(
        r"^section\s*(?:number\s*)?\d+\s*[:.-]?\s*",
        "",
        value,
        flags=re.I,
    )

    value = re.sub(
        r"[^a-z0-9]+",
        " ",
        value.lower(),
    ).strip()

    return value


def _resolve_revision_section(
    markdown: str,
    instruction: str,
) -> tuple[int, str, str, str]:
    """Resolve one concrete ``##`` section from a human revision instruction.

    Resolution is deterministic: explicit section numbers are preferred, then
    exact heading matches, then a unique heading phrase match. References are
    never selected as a normal revision target.
    """
    sections = [
        s
        for s in _markdown_sections(markdown)
        if _normalize_section_name(s[0]) != "references"
    ]

    if not sections:
        raise ValueError(
            "The current blog does not contain any editable sections."
        )

    text = instruction.strip()

    if not text:
        raise ValueError(
            "A revision instruction is required."
        )

    # Explicit forms: "section 3", "section #3", "section number 3".
    number_match = re.search(
        r"\bsection\s*(?:number\s*)?#?\s*(\d+)\b",
        text,
        flags=re.I,
    )

    if number_match:
        number = int(number_match.group(1))

        if 1 <= number <= len(sections):
            heading, full_text, body = sections[number - 1]

            return (
                number - 1,
                heading,
                full_text,
                body,
            )

        raise ValueError(
            f"Section {number} does not exist. "
            f"The blog has {len(sections)} editable sections."
        )

    normalized_instruction = _normalize_section_name(text)
    candidates: list[tuple[int, str, str, str]] = []

    for index, (
        heading,
        full_text,
        body,
    ) in enumerate(sections):

        normalized_heading = _normalize_section_name(heading)

        if (
            normalized_heading
            and normalized_heading in normalized_instruction
        ):
            candidates.append(
                (
                    index,
                    heading,
                    full_text,
                    body,
                )
            )

        elif (
            normalized_instruction
            and normalized_instruction in normalized_heading
        ):
            candidates.append(
                (
                    index,
                    heading,
                    full_text,
                    body,
                )
            )

    if len(candidates) == 1:
        return candidates[0]

    if len(candidates) > 1:
        # Prefer the longest heading match; this avoids short generic words
        # accidentally selecting multiple sections.
        candidates.sort(
            key=lambda item: len(
                _normalize_section_name(item[1])
            ),
            reverse=True,
        )

        top = candidates[0]

        if (
            len(_normalize_section_name(top[1]))
            > len(_normalize_section_name(candidates[1][1]))
        ):
            return top

    # Common UI phrasing: "Introduction: simplify..." / "Conclusion - ...".
    for index, (
        heading,
        full_text,
        body,
    ) in enumerate(sections):

        if re.search(
            rf"\b{re.escape(heading)}\b",
            text,
            flags=re.I,
        ):
            return (
                index,
                heading,
                full_text,
                body,
            )

    raise ValueError(
        "Could not identify the section to revise. Specify a section number "
        "(for example, 'Revise section 3') or the section heading."
    )


def _replace_markdown_section(
    markdown: str,
    old_full_text: str,
    new_full_text: str,
) -> str:
    """Replace exactly one previously extracted section, preserving everything else."""
    first = markdown.find(old_full_text)

    if first < 0:
        raise ValueError(
            "The target section changed before revision could be applied."
        )

    second = markdown.find(
        old_full_text,
        first + 1,
    )

    if second >= 0:
        raise ValueError(
            "The target section text is not unique; refusing an unsafe replacement."
        )

    return (
        markdown[:first]
        + new_full_text
        + markdown[first + len(old_full_text):]
    )


def _clean_revised_section(
    raw: str,
    original_heading: str,
    original_section: str = "",
) -> str:
    """Normalize an LLM response into exactly one ``##`` section.

    The original section's trailing whitespace is preserved so replacing the
    target does not accidentally reformat the boundary before the next section.
    """
    raw = (raw or "").strip()

    if not raw:
        raise ValueError(
            "The revision model returned an empty section."
        )

    # The model is asked for only the section, but tolerate a leading heading.
    heading_match = re.match(
        r"^##\s+(.+?)\s*(?:\n|$)",
        raw,
    )

    if heading_match:
        raw_body = raw[
            heading_match.end():
        ].lstrip("\n")

    else:
        first_line, _, remainder = raw.partition("\n")

        if re.match(
            r"^#{1,6}\s+",
            first_line,
        ):
            raw_body = remainder.lstrip("\n")
        else:
            raw_body = raw

    # A revision must not accidentally create another top-level section.
    if re.search(
        r"(?m)^##\s+",
        raw_body,
    ):
        raise ValueError(
            "The revision model returned another top-level section; refusing the revision."
        )

    trailing_match = re.search(
        r"(\n[ \t]*)\Z",
        original_section or "",
    )

    trailing = (
        trailing_match.group(1)
        if trailing_match
        else "\n"
    )

    return (
        f"## {original_heading}\n\n"
        f"{raw_body.strip()}"
        f"{trailing}"
    )


def revise_section_node(state: State) -> dict:
    """Node 11: Revise exactly one requested section and preserve all others."""
    mark_workflow_step(
        state.get("run_id"),
        "final-review",
    )

    instruction = (
        state.get("revision_request") or ""
    ).strip()

    current_md = (
        state.get("final")
        or state.get("merged_md")
        or ""
    )

    section_index, heading, original_section, original_body = (
        _resolve_revision_section(
            current_md,
            instruction,
        )
    )

    llm = get_llm()

    revised_raw = llm.invoke(
        [
            SystemMessage(
                content=REVISE_SECTION_SYSTEM
            ),
            HumanMessage(
                content=(
                    f"Blog section number: {section_index + 1}\n"
                    f"Exact section heading: ## {heading}\n\n"
                    f"Current section only:\n{original_section}\n\n"
                    f"User revision instruction:\n{instruction}\n\n"
                    "Return ONLY the revised content for this one section. Do not return "
                    "the blog title, other sections, References, or commentary. Keep the "
                    "section heading as exactly provided above."
                )
            ),
        ]
    ).content

    revised_section = _clean_revised_section(
        revised_raw,
        heading,
        original_section,
    )

    updated = _replace_markdown_section(
        current_md,
        original_section,
        revised_section,
    )

    return {
        "final": updated,
        "merged_md": updated,
        "revision_request": None,
    }


def route_after_final_review(state: State) -> str:
    """Routes the graph after the final HITL review."""
    return (
        "revise_section"
        if state.get("revision_request")
        else "end"
    )