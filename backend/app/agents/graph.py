import os
from pathlib import Path

from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

from .states import State
from .agents import (
    topic_guardrail_node,
    outline_generator_node,
    human_review_outline_node,
    subtopic_guardrail_node,
    research_node,
    orchestrator_node,
    worker_node,
    merge_content,
    human_review_final_draft,
    revise_section_node,
    fanout,
    route_after_final_review,
)
from .images import decide_images, generate_and_place_images


reducer_graph = StateGraph(State)

reducer_graph.add_node("merge_content", merge_content)
reducer_graph.add_node("decide_images", decide_images)
reducer_graph.add_node("generate_and_place_images", generate_and_place_images)

reducer_graph.add_edge(START, "merge_content")
reducer_graph.add_edge("merge_content", "decide_images")
reducer_graph.add_edge("decide_images", "generate_and_place_images")
reducer_graph.add_edge("generate_and_place_images", END)

reducer_subgraph = reducer_graph.compile()


g = StateGraph(State)

g.add_node("topic_guardrail", topic_guardrail_node)
g.add_node("outline_generator", outline_generator_node)
g.add_node("human_review_outline", human_review_outline_node)
g.add_node("subtopic_guardrail", subtopic_guardrail_node)
g.add_node("research", research_node)
g.add_node("orchestrator", orchestrator_node)
g.add_node("worker", worker_node)
g.add_node("reducer", reducer_subgraph)
g.add_node("human_review_final_draft", human_review_final_draft)
g.add_node("revise_section", revise_section_node)

g.add_edge(START, "topic_guardrail")
g.add_edge("topic_guardrail", "outline_generator")
g.add_edge("outline_generator", "human_review_outline")
g.add_edge("human_review_outline", "subtopic_guardrail")
g.add_edge("subtopic_guardrail", "research")
g.add_edge("research", "orchestrator")

g.add_conditional_edges(
    "orchestrator",
    fanout,
    ["worker"],
)

g.add_edge("worker", "reducer")
g.add_edge("reducer", "human_review_final_draft")

g.add_conditional_edges(
    "human_review_final_draft",
    route_after_final_review,
    {
        "revise_section": "revise_section",
        "end": END,
    },
)

g.add_edge("revise_section", "human_review_final_draft")


_PROJECT_ROOT = Path(__file__).resolve().parents[2]

CHECKPOINT_DB_PATH = os.getenv(
    "BLOGFORGE_CHECKPOINT_DB",
    str(_PROJECT_ROOT / "blogforge_checkpoints.sqlite"),
)


from app.config import DATABASE_URL
from langgraph.checkpoint.postgres import PostgresSaver
from psycopg_pool import ConnectionPool


try:
    try:
        from langgraph.checkpoint.serde.jsonplus import JsonPlusSerializer

        # Allow LangGraph to restore the custom Pydantic models stored
        # inside the persisted State instead of returning them as dicts.
        _serde = JsonPlusSerializer(
            allowed_msgpack_modules=[
                ("agents.agents_schemas", "Plan"),
                ("agents.agents_schemas", "EvidenceItem"),
            ]
        )

    except Exception:
        _serde = None

    connection_kwargs = {
        "autocommit": True,
        "prepare_threshold": 0,
    }

    pool = ConnectionPool(
        conninfo=DATABASE_URL,
        kwargs=connection_kwargs,
        max_size=20,
    )

    if _serde:
        checkpointer = PostgresSaver(pool, serde=_serde)
    else:
        checkpointer = PostgresSaver(pool)

    checkpointer.setup()

    print("[graph] Connected to PostgreSQL checkpointer.")

except Exception as e:
    print(
        f"[graph] PostgresSaver unavailable ({e}); "
        "falling back to in-memory checkpointing."
    )

    checkpointer = MemorySaver()


app = g.compile(checkpointer=checkpointer)