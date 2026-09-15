from __future__ import annotations

import logging
from typing import Optional

from database import SessionLocal
from models import BlogRun

logger = logging.getLogger(__name__)


def mark_workflow_step(run_id: Optional[str], step: str) -> None:
    """Persist the latest observed graph stage without failing the workflow."""
    if not run_id:
        return
    db = SessionLocal()
    try:
        run = db.query(BlogRun).filter(BlogRun.id == run_id).first()
        if run and run.status not in {"failed", "completed"}:
            run.workflow_step = step
            db.commit()
    except Exception:
        db.rollback()
        logger.exception("Could not persist workflow step %s for %s", step, run_id)
    finally:
        db.close()
