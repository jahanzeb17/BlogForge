from typing import TypedDict, List, Optional, Annotated
import operator
from .schemas import EvidenceItem, Plan


class State(TypedDict):
    topic: str

    # user-selected preferences (from the frontend picker buttons).
    # None/"" means "let the AI decide".
    audience_pref: Optional[str]
    tone_pref: Optional[str]
    blog_kind_pref: Optional[str]

    # routing / research
    mode: str
    needs_research: bool
    queries: List[str]
    evidence: List[EvidenceItem]
    plan: Optional[Plan]

    # recency
    as_of: str
    recency_days: int

    # workers
    sections: Annotated[List[tuple[int, str]], operator.add]  # (task_id, section_md)

    # reducer/image
    merged_md: str
    md_with_placeholders: str
    image_specs: List[dict]

    final: str

    # human-in-the-loop
    revision_request: Optional[str]