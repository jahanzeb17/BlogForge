import json
import logging
import time
from pathlib import Path
from typing import Callable, TypeVar

from langgraph.types import Command

from psycopg import InterfaceError as PsycopgInterfaceError
from psycopg import OperationalError as PsycopgOperationalError
from psycopg_pool import PoolTimeout

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import (
    SessionLocal,
    database_recovery_lock,
    engine,
    ensure_database_ready,
)
from app.models import BlogImage, BlogRun

from app.agents.graph import (
    app as blog_graph,
    wake_checkpointer_database,
)


logger = logging.getLogger(__name__)


MAX_DB_RECOVERY_ATTEMPTS = 5

DB_RECOVERY_DELAYS = (
    1,
    2,
    4,
    8,
    12,
)


T = TypeVar("T")


# ===== Helper: graph config ===============================================

def _graph_config(
    thread_id: str,
    workspace_dir: str,
) -> dict:
    return {
        "configurable": {
            "thread_id": thread_id,
            "workspace_dir": workspace_dir,
        }
    }


# ===== Database error classification =====================================

def _is_transient_database_error(
    exc: BaseException,
) -> bool:
    """
    Identify PostgreSQL connection/server lifecycle errors that are safe
    to recover from.

    This intentionally does NOT retry normal application/LLM errors.
    """
    current = exc
    seen = set()

    while (
        current is not None
        and id(current) not in seen
    ):
        seen.add(id(current))

        sqlstate = getattr(
            current,
            "sqlstate",
            None,
        )

        orig = getattr(
            current,
            "orig",
            None,
        )

        if sqlstate is None and orig is not None:
            sqlstate = getattr(
                orig,
                "sqlstate",
                None,
            )

        # Psycopg connection-level failures.
        if isinstance(
            current,
            (
                PsycopgOperationalError,
                PsycopgInterfaceError,
                PoolTimeout,
            ),
        ):
            return True

        # PostgreSQL connection/server lifecycle errors.
        if sqlstate:
            if (
                sqlstate.startswith("08")
                or sqlstate in {
                    "57P01",  # admin_shutdown
                    "57P02",  # crash_shutdown
                    "57P03",  # cannot_connect_now
                    "57P05",  # idle_session_timeout
                    "58030",  # io_error
                }
            ):
                return True

        # Some connection errors are surfaced without a useful SQLSTATE.
        if isinstance(
            current,
            SQLAlchemyError,
        ):
            message = str(current).lower()

            transient_phrases = (
                "terminating connection",
                "connection refused",
                "connection reset",
                "connection closed",
                "server closed the connection",
                "could not connect",
                "connection timed out",
                "connection timeout",
                "ssl connection has been closed",
                "broken pipe",
            )

            if any(
                phrase in message
                for phrase in transient_phrases
            ):
                return True

        current = (
            getattr(
                current,
                "__cause__",
                None,
            )
            or getattr(
                current,
                "__context__",
                None,
            )
            or orig
        )

    return False


# ===== Database recovery ==================================================

def _recover_database(
    run_id: str,
    attempt: int,
) -> None:
    """
    Wake Neon and rebuild unhealthy client-side connections.

    This function does NOT recreate the LangGraph graph or start the
    workflow from the beginning.
    """
    delay = DB_RECOVERY_DELAYS[
        min(
            attempt,
            len(DB_RECOVERY_DELAYS) - 1,
        )
    ]

    logger.warning(
        "Recovering PostgreSQL for run %s; "
        "retrying in %ss.",
        run_id,
        delay,
    )

    time.sleep(delay)

    with database_recovery_lock:
        # Remove stale SQLAlchemy connections.
        engine.dispose()

        # A real query wakes a suspended Neon compute.
        ensure_database_ready(
            max_attempts=1,
        )

        # Refresh LangGraph's independent psycopg pool.
        wake_checkpointer_database()

    logger.info(
        "PostgreSQL recovery succeeded for run %s.",
        run_id,
    )


# ===== Checkpoint helpers =================================================

def _checkpoint_exists(
    config: dict,
) -> bool:
    state = blog_graph.get_state(config)

    if not state:
        return False

    checkpoint_config = getattr(
        state,
        "config",
        None,
    )

    if not checkpoint_config:
        return False

    configurable = checkpoint_config.get(
        "configurable",
        {},
    )

    return bool(
        configurable.get("checkpoint_id")
    )


def _checkpoint_has_pending_work(
    config: dict,
) -> bool:
    state = blog_graph.get_state(config)

    return bool(
        getattr(
            state,
            "next",
            (),
        )
    )


# ===== Graph invocation recovery =========================================

def _invoke_graph_with_recovery(
    run_id: str,
    invoke_callable: Callable[[], dict],
    config: dict,
    *,
    allow_fresh_start: bool,
    resume_callable: Callable[[], dict] | None = None,
) -> dict:
    """
    Execute the graph and recover automatically from transient PostgreSQL
    connection failures.

    Initial execution:
        inputs -> START

    If DB dies after a checkpoint:
        None -> latest durable checkpoint

    HITL resume:
        Command(resume=...)

    If HITL resume already completed before the connection died:
        None -> saved completed state
    """
    last_error = None

    for attempt in range(
        MAX_DB_RECOVERY_ATTEMPTS
    ):
        try:
            return invoke_callable()

        except Exception as exc:
            last_error = exc

            # Do not turn LLM/API/application errors into DB retries.
            if not _is_transient_database_error(exc):
                raise

            logger.warning(
                "Transient PostgreSQL failure during run %s "
                "(attempt %s/%s): %s",
                run_id,
                attempt + 1,
                MAX_DB_RECOVERY_ATTEMPTS,
                exc,
            )

            if (
                attempt + 1
                >= MAX_DB_RECOVERY_ATTEMPTS
            ):
                break

            _recover_database(
                run_id,
                attempt,
            )

            if allow_fresh_start:
                # A failed graph call may have saved a checkpoint before
                # the connection was lost.
                #
                # If so, NEVER start from START again.
                if _checkpoint_exists(config):
                    invoke_callable = (
                        lambda: blog_graph.invoke(
                            None,
                            config=config,
                        )
                    )

            elif resume_callable is not None:
                # HITL resume is separate from unexpected retry.
                #
                # If the resume completed before the connection dropped,
                # don't send the same Command again.
                if _checkpoint_has_pending_work(
                    config
                ):
                    invoke_callable = resume_callable

                else:
                    invoke_callable = (
                        lambda: blog_graph.invoke(
                            None,
                            config=config,
                        )
                    )

    raise last_error


# ===== Persist images =====================================================

def _persist_images_to_db(
    run_id: str,
    workspace_dir: Path,
    db: Session,
) -> None:
    images_dir = workspace_dir / "images"

    if not images_dir.exists():
        return

    for img_path in images_dir.iterdir():
        if not img_path.is_file():
            continue

        ext = img_path.suffix.lower()

        if ext not in {
            ".png",
            ".jpg",
            ".jpeg",
            ".webp",
            ".gif",
        }:
            continue

        content_type = (
            f"image/{ext.lstrip('.')}"
        )

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


# ===== Extract graph result into DB =======================================

def _update_run_from_result(
    run: BlogRun,
    result: dict,
    db: Session,
) -> None:
    interrupts = result.get(
        "__interrupt__"
    )

    if interrupts:
        iv = interrupts[0].value

        run.status = "interrupted"

        run.interrupt_type = iv.get(
            "type"
        )

        run.interrupt_data_json = (
            json.dumps(
                iv,
                default=str,
            )
        )

        if iv.get("type") == (
            "research_plan_review"
        ):
            run.workflow_step = (
                "outline-review"
            )

        elif iv.get("type") == (
            "final_draft_review"
        ):
            run.workflow_step = (
                "final-review"
            )

    else:
        run.status = "completed"

        run.interrupt_type = None
        run.interrupt_data_json = None

        if result.get("final"):
            run.workflow_step = (
                "final-blog"
            )

    # Plan
    plan = result.get("plan")

    if plan:
        if hasattr(
            plan,
            "model_dump",
        ):
            run.plan_json = json.dumps(
                plan.model_dump(),
                default=str,
            )

        elif isinstance(
            plan,
            dict,
        ):
            run.plan_json = json.dumps(
                plan,
                default=str,
            )

    # Evidence
    evidence = result.get(
        "evidence"
    )

    if evidence:
        ev = [
            (
                e.model_dump()
                if hasattr(
                    e,
                    "model_dump",
                )
                else e
            )
            for e in evidence
        ]

        run.evidence_json = json.dumps(
            ev,
            default=str,
        )

    # Final markdown
    if result.get("final"):
        run.final_markdown = result[
            "final"
        ]

    # Image specs
    if result.get("image_specs"):
        run.image_specs_json = json.dumps(
            result["image_specs"],
            default=str,
        )

    db.commit()


# ===== General DB operation recovery =====================================

def _db_operation_with_recovery(
    run_id: str,
    operation: Callable[[Session], T],
) -> T:
    """
    Run a normal application DB operation with a fresh SQLAlchemy session.

    This protects BlogRun/BlogImage persistence separately from LangGraph
    checkpoint recovery.
    """
    last_error = None

    for attempt in range(
        MAX_DB_RECOVERY_ATTEMPTS
    ):
        db = SessionLocal()

        try:
            return operation(db)

        except Exception as exc:
            last_error = exc

            db.rollback()

            if not _is_transient_database_error(
                exc
            ):
                raise

            logger.warning(
                "Transient PostgreSQL failure while saving run %s "
                "(attempt %s/%s): %s",
                run_id,
                attempt + 1,
                MAX_DB_RECOVERY_ATTEMPTS,
                exc,
            )

            if (
                attempt + 1
                >= MAX_DB_RECOVERY_ATTEMPTS
            ):
                break

            _recover_database(
                run_id,
                attempt,
            )

        finally:
            db.close()

    raise last_error


# ===== Run status helpers =================================================

def _mark_running(
    run_id: str,
) -> None:
    def operation(
        db: Session,
    ) -> None:
        run = (
            db.query(BlogRun)
            .filter(
                BlogRun.id == run_id
            )
            .first()
        )

        if not run:
            return

        run.status = "running"

        db.commit()

    _db_operation_with_recovery(
        run_id,
        operation,
    )


def _persist_result(
    run_id: str,
    result: dict,
    workspace_dir: str,
) -> None:
    def operation(
        db: Session,
    ) -> None:
        run = (
            db.query(BlogRun)
            .filter(
                BlogRun.id == run_id
            )
            .first()
        )

        if not run:
            return

        _update_run_from_result(
            run,
            result,
            db,
        )

        _persist_images_to_db(
            run_id,
            Path(workspace_dir),
            db,
        )

    _db_operation_with_recovery(
        run_id,
        operation,
    )


def _save_failure(
    run_id: str,
    exc: Exception,
) -> None:
    def operation(
        db: Session,
    ) -> None:
        run = (
            db.query(BlogRun)
            .filter(
                BlogRun.id == run_id
            )
            .first()
        )

        if run:
            run.status = "failed"
            run.error_message = str(exc)[
                :2000
            ]

            db.commit()

    try:
        _db_operation_with_recovery(
            run_id,
            operation,
        )

    except Exception:
        logger.exception(
            "Could not persist failure state "
            "for run %s.",
            run_id,
        )


# ===== Initial DB wake ====================================================

def _wake_database_before_graph(
    run_id: str,
) -> None:
    """
    Wake/check both PostgreSQL connection layers before graph execution.
    """
    try:
        with database_recovery_lock:
            ensure_database_ready()
            wake_checkpointer_database()

        return

    except Exception as exc:
        if not _is_transient_database_error(
            exc
        ):
            raise

        logger.warning(
            "Initial database wake failed for run %s: %s",
            run_id,
            exc,
        )

    _recover_database(
        run_id,
        0,
    )


# ===== Background graph execution ========================================

def _run_graph_task(
    run_id: str,
    inputs: dict,
    thread_id: str,
    workspace_dir: str,
) -> None:
    try:
        _mark_running(run_id)

        _wake_database_before_graph(
            run_id
        )

        config = _graph_config(
            thread_id,
            workspace_dir,
        )

        result = _invoke_graph_with_recovery(
            run_id,
            lambda: blog_graph.invoke(
                inputs,
                config=config,
            ),
            config,
            allow_fresh_start=True,
        )

        _persist_result(
            run_id,
            result,
            workspace_dir,
        )

    except Exception as exc:
        logger.exception(
            "Graph run failed for %s",
            run_id,
        )

        _save_failure(
            run_id,
            exc,
        )


# ===== HITL resume ========================================================

def _resume_graph_task(
    run_id: str,
    resume_value: dict,
    thread_id: str,
    workspace_dir: str,
) -> None:
    try:
        def mark_resume_running(
            db: Session,
        ) -> None:
            run = (
                db.query(BlogRun)
                .filter(
                    BlogRun.id == run_id
                )
                .first()
            )

            if not run:
                return

            run.status = "running"

            run.interrupt_type = None
            run.interrupt_data_json = None
            run.error_message = None

            db.commit()

        _db_operation_with_recovery(
            run_id,
            mark_resume_running,
        )

        _wake_database_before_graph(
            run_id
        )

        config = _graph_config(
            thread_id,
            workspace_dir,
        )

        resume_callable = (
            lambda: blog_graph.invoke(
                Command(
                    resume=resume_value
                ),
                config=config,
            )
        )

        result = _invoke_graph_with_recovery(
            run_id,
            resume_callable,
            config,
            allow_fresh_start=False,
            resume_callable=resume_callable,
        )

        _persist_result(
            run_id,
            result,
            workspace_dir,
        )

    except Exception as exc:
        logger.exception(
            "Graph resume failed for %s",
            run_id,
        )

        _save_failure(
            run_id,
            exc,
        )


# ===== Unexpected graph failure retry ====================================

def _retry_graph_task(
    run_id: str,
    thread_id: str,
    workspace_dir: str,
) -> None:
    try:
        def mark_retry_running(
            db: Session,
        ) -> None:
            run = (
                db.query(BlogRun)
                .filter(
                    BlogRun.id == run_id
                )
                .first()
            )

            if not run:
                return

            run.status = "running"
            run.error_message = None

            run.interrupt_type = None
            run.interrupt_data_json = None

            db.commit()

        _db_operation_with_recovery(
            run_id,
            mark_retry_running,
        )

        _wake_database_before_graph(
            run_id
        )

        config = _graph_config(
            thread_id,
            workspace_dir,
        )

        try:
            checkpoint_exists = (
                _checkpoint_exists(config)
            )

        except Exception as exc:
            if not _is_transient_database_error(
                exc
            ):
                raise

            logger.warning(
                "Initial checkpoint lookup failed "
                "for %s; recovering database.",
                run_id,
            )

            _recover_database(
                run_id,
                0,
            )

            checkpoint_exists = (
                _checkpoint_exists(config)
            )

        if checkpoint_exists:
            # Resume from the latest durable checkpoint.
            invoke_callable = (
                lambda: blog_graph.invoke(
                    None,
                    config=config,
                )
            )

            allow_fresh_start = False

        else:
            # No checkpoint exists, so reconstruct the original input.
            db = SessionLocal()

            try:
                run = (
                    db.query(BlogRun)
                    .filter(
                        BlogRun.id == run_id
                    )
                    .first()
                )

                if not run:
                    return

                inputs = {
                    "run_id": run.id,
                    "topic": run.topic,
                    "audience_pref": (
                        run.audience_pref
                    ),
                    "tone_pref": (
                        run.tone_pref
                    ),
                    "blog_kind_pref": (
                        run.blog_kind_pref
                    ),
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

            finally:
                db.close()

            invoke_callable = (
                lambda: blog_graph.invoke(
                    inputs,
                    config=config,
                )
            )

            allow_fresh_start = True

        result = _invoke_graph_with_recovery(
            run_id,
            invoke_callable,
            config,
            allow_fresh_start=allow_fresh_start,
        )

        _persist_result(
            run_id,
            result,
            workspace_dir,
        )

    except Exception as exc:
        logger.exception(
            "Graph retry failed for %s",
            run_id,
        )

        _save_failure(
            run_id,
            exc,
        )





#####################################################################################################################################################


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
# # continue from the latest durable checkpoint when one exists.
# #
# # If a checkpoint exists:
# #     blog_graph.invoke(None, config=config)
# #
# # continues the existing LangGraph execution from its durable checkpoint.
# #
# # If no checkpoint exists:
# #     the original run inputs are reconstructed from BlogRun and the graph
# #     starts normally.
# #
# # This prevents:
# # "Received no input for __start__"
# #
# # while preserving node-level failure recovery and HITL recovery separately.

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

#         # Check whether LangGraph has a durable checkpoint for this thread.
#         #
#         # If a checkpoint exists, we must NOT provide new input. Passing None
#         # tells LangGraph to continue from the latest saved checkpoint.
#         #
#         # If no checkpoint exists, we reconstruct the original inputs below
#         # and start the graph normally.
#         checkpoint_exists = False

#         try:
#             state = blog_graph.get_state(config)

#             if state:
#                 checkpoint_config = getattr(state, "config", None)

#                 if checkpoint_config:
#                     configurable = checkpoint_config.get(
#                         "configurable",
#                         {},
#                     )

#                     checkpoint_exists = bool(
#                         configurable.get("checkpoint_id")
#                     )

#         except Exception:
#             # If the state lookup itself fails, fall back to a fresh graph
#             # invocation rather than passing None and causing __start__ to
#             # receive no input.
#             logger.exception(
#                 "Could not inspect LangGraph checkpoint for %s",
#                 run_id,
#             )

#             checkpoint_exists = False

#         if checkpoint_exists:
#             logger.info(
#                 "Checkpoint found for run %s. Resuming existing graph.",
#                 run_id,
#             )

#             result = blog_graph.invoke(
#                 None,
#                 config=config,
#             )

#         else:
#             logger.info(
#                 "No checkpoint found for run %s. Starting graph with "
#                 "reconstructed inputs.",
#                 run_id,
#             )

#             # Reconstruct the original graph input from the BlogRun record.
#             inputs = {
#                 "run_id": run.id,
#                 "topic": run.topic,
#                 "audience_pref": run.audience_pref,
#                 "tone_pref": run.tone_pref,
#                 "blog_kind_pref": run.blog_kind_pref,
#                 "mode": "",
#                 "needs_research": False,
#                 "queries": [],
#                 "evidence": [],
#                 "plan": None,
#                 "as_of": run.as_of or "",
#                 "recency_days": 7,
#                 "sections": [],
#                 "merged_md": "",
#                 "md_with_placeholders": "",
#                 "image_specs": [],
#                 "final": "",
#                 "revision_request": None,
#             }

#             result = blog_graph.invoke(
#                 inputs,
#                 config=config,
#             )

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




#############################################################################################################################################




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