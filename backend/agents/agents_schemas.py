from pydantic import BaseModel, Field
from typing import List, Literal, Optional


class Task(BaseModel):
    id: int
    title: str
    goal: str = Field(..., description="One sentence describing what the reader should do/understand.")
    bullets: List[str] = Field(..., min_length=3, max_length=6)
    target_words: int = Field(..., description="Target words (120–550).")

    tags: List[str] = Field(default_factory=list)
    requires_research: bool = False
    requires_citations: bool = False
    requires_code: bool = False


class Plan(BaseModel):
    blog_title: str
    audience: str
    tone: str
    blog_kind: Literal["explainer", "tutorial", "news_roundup", "comparison", "system_design"] = "explainer"
    constraints: List[str] = Field(default_factory=list)
    tasks: List[Task]


class EvidenceItem(BaseModel):
    title: str
    url: str
    published_at: Optional[str] = None  # ISO "YYYY-MM-DD" preferred
    snippet: Optional[str] = None
    source: Optional[str] = None
    query: Optional[str] = None  # <--- NEW: Tracks which subtopic gathered this evidence

    

class RouterDecision(BaseModel):
    needs_research: bool
    mode: Literal["closed_book", "hybrid", "open_book"]
    reason: str
    queries: List[str] = Field(default_factory=list)
    max_results_per_query: int = Field(5)


class EvidencePack(BaseModel):
    evidence: List[EvidenceItem] = Field(default_factory=list)


# ---- Image planning schema (ported from your image flow) ----
# class ImageSpec(BaseModel):
#     placeholder: str = Field(..., description="e.g. [[IMAGE_1]]")
#     filename: str = Field(..., description="Save under images/, e.g. qkv_flow.png")
#     alt: str
#     caption: str
#     prompt: str = Field(..., description="Prompt to send to the image model.")
#     size: Literal["1024x1024", "1024x1536", "1536x1024"] = "1024x1024"
#     quality: Literal["low", "medium", "high"] = "medium"


class ImageSpec(BaseModel):
    section_title: str = Field(..., description="Exact title of the markdown section (e.g., 'Self-Attention Mechanics') where this image belongs.")
    filename: str = Field(..., description="Save under images/, e.g. self_attention_flow.png")
    alt: str
    caption: str
    prompt: str = Field(..., description="Prompt to send to the image model.")
    size: Literal["1024x1024", "1024x1536", "1536x1024"] = "1024x1024"
    quality: Literal["low", "medium", "high"] = "medium"


# class GlobalImagePlan(BaseModel):
#     md_with_placeholders: str
#     images: List[ImageSpec] = Field(default_factory=list)



# class ImagePlanOutput(BaseModel):
#     images: List[ImageSpec] = Field(default_factory=list)


class ImagePlanOutput(BaseModel):
    images: List[ImageSpec] = Field(
        default_factory=list,
        description="Strictly AT MOST 1 key illustrative image for the entire blog post. Do not include multiple images.",
        max_length=1  # <--- This is the hard programmatic enforcement
    )


def coerce_plan(value) -> Optional["Plan"]:
    """
    LangGraph's checkpoint serde can round-trip a Pydantic model back into a
    plain dict on resume (see graph.py's note on 'Deserializing unregistered
    type'). Any node that reads state["plan"] as an object - not just as a
    dict - must pass it through this first, since it may be running after a
    resume rather than in the same invoke() that created the Plan.
    """
    if value is None:
        return None
    if isinstance(value, Plan):
        return value
    if isinstance(value, dict):
        return Plan(**value)
    raise TypeError(f"Unexpected type for plan: {type(value)!r}")





class GuardrailResult(BaseModel):
    action: Literal["allow", "reject"]
    reason: str = Field(description="If rejected, a brief 1-sentence reason why. If allowed, just output 'safe'.")



# ==========================================
# NEW: Outline Schema for the Outline Generator
# ==========================================
class OutlineResult(BaseModel):
    subtopics: List[str] = Field(
        description="A list of 1 to 4 subtopics based on the main topic.",
        min_length=1,
        max_length=4
    )