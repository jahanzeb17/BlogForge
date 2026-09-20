import logging
from pathlib import Path
import json

from langgraph.types import Command
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import BlogImage, BlogRun
from app.agents.graph import app as blog_graph

logger = logging.getLogger(__name__)


# ===== Helper: graph config ===============================================

def _graph_config(thread_id: str, workspace_dir: str) -> dict:
    return {
        "configurable": {
            "thread_id": thread_id,
            "workspace_dir": workspace_dir,
        }
    }


# ===== Helper: persist images from workspace into DB ======================

def _persist_images_to_db(
    run_id: str, workspace_dir: Path, db: Session,
) -> None:
    images_dir = workspace_dir / "images"
    if not images_dir.exists():
        return

    for img_path in images_dir.iterdir():
        if not img_path.is_file():
            continue

        ext = img_path.suffix.lower()

        if ext not in {".png", ".jpg", ".jpeg", ".webp", ".gif"}:
            continue

        content_type = f"image/{ext.lstrip('.')}"

        if content_type == "image/jpg":
            content_type = "image/jpeg"

        exists = (
            db.query(BlogImage)
            .filter(
                BlogImage.run_id == run_id,
                BlogImage.filename == img_path.name,
            )
            .first()
        )

        if not exists:
            db.add(
                BlogImage(
                    run_id=run_id,
                    filename=img_path.name,
                    content_type=content_type,
                    image_data=img_path.read_bytes(),
                )
            )

    db.commit()


# ===== Helper: extract graph result into DB ===============================

def _update_run_from_result(
    run: BlogRun, result: dict, db: Session,
) -> None:
    interrupts = result.get("__interrupt__")

    if interrupts:
        iv = interrupts[0].value

        run.status = "interrupted"
        run.interrupt_type = iv.get("type")
        run.interrupt_data_json = json.dumps(iv, default=str)

        if iv.get("type") == "research_plan_review":
            run.workflow_step = "outline-review"
        elif iv.get("type") == "final_draft_review":
            run.workflow_step = "final-review"

    else:
        run.status = "completed"
        run.interrupt_type = None
        run.interrupt_data_json = None

        if result.get("final"):
            run.workflow_step = "final-blog"

    # Plan
    plan = result.get("plan")

    if plan:
        if hasattr(plan, "model_dump"):
            run.plan_json = json.dumps(plan.model_dump(), default=str)
        elif isinstance(plan, dict):
            run.plan_json = json.dumps(plan, default=str)

    # Evidence
    evidence = result.get("evidence")

    if evidence:
        ev = [
            e.model_dump() if hasattr(e, "model_dump") else e
            for e in evidence
        ]

        run.evidence_json = json.dumps(ev, default=str)

    # Final markdown
    if result.get("final"):
        run.final_markdown = result["final"]

    # Image specs
    if result.get("image_specs"):
        run.image_specs_json = json.dumps(
            result["image_specs"],
            default=str,
        )

    db.commit()


# ===== Background tasks ===================================================

def _run_graph_task(
    run_id: str, inputs: dict, thread_id: str, workspace_dir: str,
) -> None:
    db = SessionLocal()

    try:
        run = db.query(BlogRun).filter(BlogRun.id == run_id).first()

        if not run:
            return

        run.status = "running"
        db.commit()

        config = _graph_config(thread_id, workspace_dir)

        result = blog_graph.invoke(
            inputs,
            config=config,
        )

        _update_run_from_result(run, result, db)
        _persist_images_to_db(
            run_id,
            Path(workspace_dir),
            db,
        )

    except Exception as e:
        logger.exception("Graph run failed for %s", run_id)

        run = db.query(BlogRun).filter(BlogRun.id == run_id).first()

        if run:
            run.status = "failed"
            run.error_message = str(e)[:2000]
            db.commit()

    finally:
        db.close()


def _resume_graph_task(
    run_id: str, resume_value: dict, thread_id: str, workspace_dir: str,
) -> None:
    db = SessionLocal()

    try:
        run = db.query(BlogRun).filter(BlogRun.id == run_id).first()

        if not run:
            return

        run.status = "running"
        run.interrupt_type = None
        run.interrupt_data_json = None
        run.error_message = None
        db.commit()

        config = _graph_config(thread_id, workspace_dir)

        result = blog_graph.invoke(
            Command(resume=resume_value),
            config=config,
        )

        _update_run_from_result(run, result, db)
        _persist_images_to_db(
            run_id,
            Path(workspace_dir),
            db,
        )

    except Exception as e:
        logger.exception("Graph resume failed for %s", run_id)

        run = db.query(BlogRun).filter(BlogRun.id == run_id).first()

        if run:
            run.status = "failed"
            run.error_message = str(e)[:2000]
            db.commit()

    finally:
        db.close()


# ===== Failure recovery ===================================================
#
# This is different from _resume_graph_task().
#
# _resume_graph_task() is for intentional HITL interrupts such as:
# - outline review
# - final draft review
#
# _retry_graph_task() is for an unexpected node/tool failure.
#
# The same LangGraph thread_id is reused so the PostgreSQL checkpointer can
# continue from the latest durable checkpoint when one exists.
#
# If a checkpoint exists:
#     blog_graph.invoke(None, config=config)
#
# continues the existing LangGraph execution from its durable checkpoint.
#
# If no checkpoint exists:
#     the original run inputs are reconstructed from BlogRun and the graph
#     starts normally.
#
# This prevents:
# "Received no input for __start__"
#
# while preserving node-level failure recovery and HITL recovery separately.

def _retry_graph_task(
    run_id: str, thread_id: str, workspace_dir: str,
) -> None:
    db = SessionLocal()

    try:
        run = db.query(BlogRun).filter(BlogRun.id == run_id).first()

        if not run:
            return

        run.status = "running"
        run.error_message = None
        run.interrupt_type = None
        run.interrupt_data_json = None
        db.commit()

        config = _graph_config(thread_id, workspace_dir)

        # Check whether LangGraph has a durable checkpoint for this thread.
        #
        # If a checkpoint exists, we must NOT provide new input. Passing None
        # tells LangGraph to continue from the latest saved checkpoint.
        #
        # If no checkpoint exists, we reconstruct the original inputs below
        # and start the graph normally.
        checkpoint_exists = False

        try:
            state = blog_graph.get_state(config)

            if state:
                checkpoint_config = getattr(state, "config", None)

                if checkpoint_config:
                    configurable = checkpoint_config.get(
                        "configurable",
                        {},
                    )

                    checkpoint_exists = bool(
                        configurable.get("checkpoint_id")
                    )

        except Exception:
            # If the state lookup itself fails, fall back to a fresh graph
            # invocation rather than passing None and causing __start__ to
            # receive no input.
            logger.exception(
                "Could not inspect LangGraph checkpoint for %s",
                run_id,
            )

            checkpoint_exists = False

        if checkpoint_exists:
            logger.info(
                "Checkpoint found for run %s. Resuming existing graph.",
                run_id,
            )

            result = blog_graph.invoke(
                None,
                config=config,
            )

        else:
            logger.info(
                "No checkpoint found for run %s. Starting graph with "
                "reconstructed inputs.",
                run_id,
            )

            # Reconstruct the original graph input from the BlogRun record.
            inputs = {
                "run_id": run.id,
                "topic": run.topic,
                "audience_pref": run.audience_pref,
                "tone_pref": run.tone_pref,
                "blog_kind_pref": run.blog_kind_pref,
                "mode": "",
                "needs_research": False,
                "queries": [],
                "evidence": [],
                "plan": None,
                "as_of": run.as_of or "",
                "recency_days": 7,
                "sections": [],
                "merged_md": "",
                "md_with_placeholders": "",
                "image_specs": [],
                "final": "",
                "revision_request": None,
            }

            result = blog_graph.invoke(
                inputs,
                config=config,
            )

        _update_run_from_result(run, result, db)

        _persist_images_to_db(
            run_id,
            Path(workspace_dir),
            db,
        )

    except Exception as e:
        logger.exception("Graph retry failed for %s", run_id)

        run = db.query(BlogRun).filter(BlogRun.id == run_id).first()

        if run:
            run.status = "failed"
            run.error_message = str(e)[:2000]
            db.commit()

    finally:
        db.close()



# import logging
# from pathlib import Path
# import json

# from langgraph.types import Command
# from sqlalchemy.orm import Session

# from app.database import SessionLocal
# from app.models import BlogImage, BlogRun
# from app.agents.graph import app as blog_graph

# logger = logging.getLogger(__name__)


# # ===== Helper: graph config ===============================================

# def _graph_config(thread_id: str, workspace_dir: str) -> dict:
#     return {
#         "configurable": {
#             "thread_id": thread_id,
#             "workspace_dir": workspace_dir,
#         }
#     }


# # ===== Helper: persist images from workspace into DB ======================

# def _persist_images_to_db(
#     run_id: str, workspace_dir: Path, db: Session,
# ) -> None:
#     images_dir = workspace_dir / "images"
#     if not images_dir.exists():
#         return

#     for img_path in images_dir.iterdir():
#         if not img_path.is_file():
#             continue

#         ext = img_path.suffix.lower()

#         if ext not in {".png", ".jpg", ".jpeg", ".webp", ".gif"}:
#             continue

#         content_type = f"image/{ext.lstrip('.')}"

#         if content_type == "image/jpg":
#             content_type = "image/jpeg"

#         exists = (
#             db.query(BlogImage)
#             .filter(
#                 BlogImage.run_id == run_id,
#                 BlogImage.filename == img_path.name,
#             )
#             .first()
#         )

#         if not exists:
#             db.add(
#                 BlogImage(
#                     run_id=run_id,
#                     filename=img_path.name,
#                     content_type=content_type,
#                     image_data=img_path.read_bytes(),
#                 )
#             )

#     db.commit()


# # ===== Helper: extract graph result into DB ===============================

# def _update_run_from_result(
#     run: BlogRun, result: dict, db: Session,
# ) -> None:
#     interrupts = result.get("__interrupt__")

#     if interrupts:
#         iv = interrupts[0].value

#         run.status = "interrupted"
#         run.interrupt_type = iv.get("type")
#         run.interrupt_data_json = json.dumps(iv, default=str)

#         if iv.get("type") == "research_plan_review":
#             run.workflow_step = "outline-review"
#         elif iv.get("type") == "final_draft_review":
#             run.workflow_step = "final-review"

#     else:
#         run.status = "completed"
#         run.interrupt_type = None
#         run.interrupt_data_json = None

#         if result.get("final"):
#             run.workflow_step = "final-blog"

#     # Plan
#     plan = result.get("plan")

#     if plan:
#         if hasattr(plan, "model_dump"):
#             run.plan_json = json.dumps(plan.model_dump(), default=str)
#         elif isinstance(plan, dict):
#             run.plan_json = json.dumps(plan, default=str)

#     # Evidence
#     evidence = result.get("evidence")

#     if evidence:
#         ev = [
#             e.model_dump() if hasattr(e, "model_dump") else e
#             for e in evidence
#         ]

#         run.evidence_json = json.dumps(ev, default=str)

#     # Final markdown
#     if result.get("final"):
#         run.final_markdown = result["final"]

#     # Image specs
#     if result.get("image_specs"):
#         run.image_specs_json = json.dumps(
#             result["image_specs"],
#             default=str,
#         )

#     db.commit()


# # ===== Background tasks ===================================================

# def _run_graph_task(
#     run_id: str, inputs: dict, thread_id: str, workspace_dir: str,
# ) -> None:
#     db = SessionLocal()

#     try:
#         run = db.query(BlogRun).filter(BlogRun.id == run_id).first()

#         if not run:
#             return

#         run.status = "running"
#         db.commit()

#         config = _graph_config(thread_id, workspace_dir)

#         result = blog_graph.invoke(
#             inputs,
#             config=config,
#         )

#         _update_run_from_result(run, result, db)
#         _persist_images_to_db(
#             run_id,
#             Path(workspace_dir),
#             db,
#         )

#     except Exception as e:
#         logger.exception("Graph run failed for %s", run_id)

#         run = db.query(BlogRun).filter(BlogRun.id == run_id).first()

#         if run:
#             run.status = "failed"
#             run.error_message = str(e)[:2000]
#             db.commit()

#     finally:
#         db.close()


# def _resume_graph_task(
#     run_id: str, resume_value: dict, thread_id: str, workspace_dir: str,
# ) -> None:
#     db = SessionLocal()

#     try:
#         run = db.query(BlogRun).filter(BlogRun.id == run_id).first()

#         if not run:
#             return

#         run.status = "running"
#         run.interrupt_type = None
#         run.interrupt_data_json = None
#         run.error_message = None
#         db.commit()

#         config = _graph_config(thread_id, workspace_dir)

#         result = blog_graph.invoke(
#             Command(resume=resume_value),
#             config=config,
#         )

#         _update_run_from_result(run, result, db)
#         _persist_images_to_db(
#             run_id,
#             Path(workspace_dir),
#             db,
#         )

#     except Exception as e:
#         logger.exception("Graph resume failed for %s", run_id)

#         run = db.query(BlogRun).filter(BlogRun.id == run_id).first()

#         if run:
#             run.status = "failed"
#             run.error_message = str(e)[:2000]
#             db.commit()

#     finally:
#         db.close()


# # ===== Failure recovery ===================================================
# #
# # This is different from _resume_graph_task().
# #
# # _resume_graph_task() is for intentional HITL interrupts such as:
# # - outline review
# # - final draft review
# #
# # _retry_graph_task() is for an unexpected node/tool failure.
# #
# # The same LangGraph thread_id is reused so the PostgreSQL checkpointer can
# # continue from the latest durable checkpoint instead of starting a new
# # BlogRun from the beginning.

# def _retry_graph_task(
#     run_id: str, thread_id: str, workspace_dir: str,
# ) -> None:
#     db = SessionLocal()

#     try:
#         run = db.query(BlogRun).filter(BlogRun.id == run_id).first()

#         if not run:
#             return

#         run.status = "running"
#         run.error_message = None
#         run.interrupt_type = None
#         run.interrupt_data_json = None
#         db.commit()

#         config = _graph_config(thread_id, workspace_dir)

#         # Reuse the existing LangGraph checkpoint for this thread.
#         #
#         # Passing None tells LangGraph to continue from the durable
#         # checkpoint rather than creating a brand-new graph execution.
#         # This is specifically for recovering from an unexpected node/tool
#         # failure, not for HITL Command(resume=...) interactions.
#         result = blog_graph.invoke(
#             None,
#             config=config,
#         )

#         _update_run_from_result(run, result, db)

#         _persist_images_to_db(
#             run_id,
#             Path(workspace_dir),
#             db,
#         )

#     except Exception as e:
#         logger.exception("Graph retry failed for %s", run_id)

#         run = db.query(BlogRun).filter(BlogRun.id == run_id).first()

#         if run:
#             run.status = "failed"
#             run.error_message = str(e)[:2000]
#             db.commit()

#     finally:
#         db.close()