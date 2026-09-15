import os
from pathlib import Path

from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

from .states import State

### CHANGED: Updated the imports to match the new node names from agents.py.
### Removed 'router_node' and 'route_next' as they were replaced by the outline generator.
from .agents import (
    topic_guardrail_node,          # NEW: First security check
    outline_generator_node,        # NEW: Generates max 4 subtopics
    human_review_outline_node,     # NEW: HITL checkpoint for outline edits
    subtopic_guardrail_node,       # NEW: Second security check after human edits
    research_node,
    orchestrator_node,
    worker_node,
    merge_content,
    human_review_final_draft,
    revise_section_node,
    fanout,
    route_after_final_review
)
from .images import decide_images, generate_and_place_images

# -----------------------------
# Reducer subgraph: merge_content -> decide_images -> generate_and_place_images
# -----------------------------
### KEPT AS-IS: Your original image pipeline remains untouched.
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

### CHANGED: Registered the new guardrail and outline nodes.
g.add_node("topic_guardrail", topic_guardrail_node)
g.add_node("outline_generator", outline_generator_node)
g.add_node("human_review_outline", human_review_outline_node)
g.add_node("subtopic_guardrail", subtopic_guardrail_node)

### KEPT AS-IS: Original drafting and research nodes.
g.add_node("research", research_node)
g.add_node("orchestrator", orchestrator_node)
g.add_node("worker", worker_node)
g.add_node("reducer", reducer_subgraph)
g.add_node("human_review_final_draft", human_review_final_draft)
g.add_node("revise_section", revise_section_node)

### CHANGED: Rewired the edges to enforce the new secure execution sequence.
g.add_edge(START, "topic_guardrail")
g.add_edge("topic_guardrail", "outline_generator")
g.add_edge("outline_generator", "human_review_outline")

### CHANGED: After human pauses, it MUST go through the subtopic guardrail before research.
g.add_edge("human_review_outline", "subtopic_guardrail")
g.add_edge("subtopic_guardrail", "research")
g.add_edge("research", "orchestrator")

### KEPT AS-IS: Parallel workers mapping to your reducer image subgraph.
g.add_conditional_edges("orchestrator", fanout, ["worker"])
g.add_edge("worker", "reducer")
g.add_edge("reducer", "human_review_final_draft")

### CHANGED: Updated mapping dictionary to match the return string from agents.py exactly.
g.add_conditional_edges(
    "human_review_final_draft", 
    route_after_final_review, 
    {"revise_section": "revise_section", "end": END}
)
g.add_edge("revise_section", "human_review_final_draft")

# Checkpointer — required for interrupt()/Command(resume=...) HITL.
# Use project root for checkpoint DB path.
_PROJECT_ROOT = Path(__file__).resolve().parents[2]
CHECKPOINT_DB_PATH = os.getenv(
    "BLOGFORGE_CHECKPOINT_DB", str(_PROJECT_ROOT / "blogforge_checkpoints.sqlite")
)

# Make sure to import DATABASE_URL from your updated config
from config import DATABASE_URL 
from langgraph.checkpoint.memory import MemorySaver

# --- NEW IMPORTS FOR POSTGRES ---
from langgraph.checkpoint.postgres import PostgresSaver
from psycopg_pool import ConnectionPool


# ---------------------------------------------------------
# CHECKPOINTER SETUP (PostgreSQL Unified Database)
# ---------------------------------------------------------
try:
    # Keep the custom serializer so LangGraph can serialize your Pydantic schemas
    try:
        from langgraph.checkpoint.serde.jsonplus import JsonPlusSerializer
        _serde = JsonPlusSerializer(allowed_msgpack_modules=["schemas", "agents_schemas"])
    except Exception:
        _serde = None

    # Configure the connection pool using the same DATABASE_URL as SQLAlchemy
    connection_kwargs = {
        "autocommit": True,
        "prepare_threshold": 0,
    }
    pool = ConnectionPool(
        conninfo=DATABASE_URL, 
        kwargs=connection_kwargs, 
        max_size=10
    )
    
    # Initialize the Postgres checkpointer
    if _serde:
        checkpointer = PostgresSaver(pool, serde=_serde)
    else:
        checkpointer = PostgresSaver(pool)
        
    # This automatically creates the checkpoints, writes, and blobs tables in Postgres
    checkpointer.setup() 
    print("[graph] Connected to PostgreSQL checkpointer.")
    
except Exception as e:
    print(f"[graph] PostgresSaver unavailable ({e}); falling back to in-memory checkpointing.")
    checkpointer = MemorySaver()


app = g.compile(checkpointer=checkpointer)