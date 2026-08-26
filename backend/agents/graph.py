import sqlite3
import os
from pathlib import Path

from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

from .states import State
from .agents import (
    router_node,
    human_review_research_plan,
    research_node,
    orchestrator_node,
    worker_node,
    merge_content,
    human_review_final_draft,
    revise_section_node,
    route_next,
    fanout,
    route_after_final_review,
)
from .images import decide_images, generate_and_place_images


# -----------------------------
# Reducer subgraph: merge_content -> decide_images -> generate_and_place_images
# -----------------------------
reducer_graph = StateGraph(State)
reducer_graph.add_node("merge_content", merge_content)
reducer_graph.add_node("decide_images", decide_images)
reducer_graph.add_node("generate_and_place_images", generate_and_place_images)
reducer_graph.add_edge(START, "merge_content")
reducer_graph.add_edge("merge_content", "decide_images")
reducer_graph.add_edge("decide_images", "generate_and_place_images")
reducer_graph.add_edge("generate_and_place_images", END)
reducer_subgraph = reducer_graph.compile()


# -----------------------------
# Build main graph
# -----------------------------
g = StateGraph(State)
g.add_node("router", router_node)
g.add_node("human_review_research_plan", human_review_research_plan)
g.add_node("research", research_node)
g.add_node("orchestrator", orchestrator_node)
g.add_node("worker", worker_node)
g.add_node("reducer", reducer_subgraph)
g.add_node("human_review_final_draft", human_review_final_draft)
g.add_node("revise_section", revise_section_node)

g.add_edge(START, "router")
g.add_edge("router", "human_review_research_plan")
g.add_conditional_edges(
    "human_review_research_plan", route_next, {"research": "research", "orchestrator": "orchestrator"}
)
g.add_edge("research", "orchestrator")

g.add_conditional_edges("orchestrator", fanout, ["worker"])
g.add_edge("worker", "reducer")
g.add_edge("reducer", "human_review_final_draft")
g.add_conditional_edges(
    "human_review_final_draft", route_after_final_review, {"revise": "revise_section", "end": END}
)
g.add_edge("revise_section", "human_review_final_draft")

# Checkpointer — required for interrupt()/Command(resume=...) HITL.
# Use project root for checkpoint DB path.
_PROJECT_ROOT = Path(__file__).resolve().parents[2]
CHECKPOINT_DB_PATH = os.getenv(
    "BLOGFORGE_CHECKPOINT_DB", str(_PROJECT_ROOT / "blogforge_checkpoints.sqlite")
)

try:
    from langgraph.checkpoint.sqlite import SqliteSaver

    try:
        from langgraph.checkpoint.serde.jsonplus import JsonPlusSerializer
        _serde = JsonPlusSerializer(allowed_msgpack_modules=["schemas"])
    except Exception:
        _serde = None

    _conn = sqlite3.connect(CHECKPOINT_DB_PATH, check_same_thread=False)
    checkpointer = SqliteSaver(_conn, serde=_serde) if _serde else SqliteSaver(_conn)
    checkpointer.setup()
except Exception as e:
    print(f"[graph] SqliteSaver unavailable ({e}); falling back to in-memory checkpointing.")
    checkpointer = MemorySaver()

app = g.compile(checkpointer=checkpointer)