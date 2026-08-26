from __future__ import annotations

import json
import logging
import shutil
import uuid
from datetime import date
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session


from .config import STORAGE_DIR
from .database import get_db
from .models import BlogImage, BlogRun, User
from .auth import get_current_user
from .utilities import _resume_graph_task, _run_graph_task
from .schemas import ResumeRequest, CreateRunRequest

logger = logging.getLogger(__name__)


router = APIRouter()

# ===== Run CRUD endpoints =================================================

@router.post("/api/runs")
def create_run(
    req: CreateRunRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    run_id = str(uuid.uuid4())
    thread_id = str(uuid.uuid4())
    workspace_dir = str(STORAGE_DIR / run_id)
    Path(workspace_dir).mkdir(parents=True, exist_ok=True)

    as_of = req.as_of or date.today().isoformat()

    run = BlogRun(
        id=run_id,
        user_id=user.id,
        thread_id=thread_id,
        topic=req.topic,
        status="pending",
        as_of=as_of,
        audience_pref=req.audience_pref,
        tone_pref=req.tone_pref,
        blog_kind_pref=req.blog_kind_pref,
    )
    db.add(run)
    db.commit()

    inputs = {
        "topic": req.topic,
        "audience_pref": req.audience_pref,
        "tone_pref": req.tone_pref,
        "blog_kind_pref": req.blog_kind_pref,
        "mode": "",
        "needs_research": False,
        "queries": [],
        "evidence": [],
        "plan": None,
        "as_of": as_of,
        "recency_days": 7,
        "sections": [],
        "merged_md": "",
        "md_with_placeholders": "",
        "image_specs": [],
        "final": "",
        "revision_request": None,
    }

    background_tasks.add_task(
        _run_graph_task, run_id, inputs, thread_id, workspace_dir,
    )
    return {"run_id": run_id, "status": "pending"}


@router.get("/api/runs")
def list_runs(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    runs = (
        db.query(BlogRun)
        .filter(BlogRun.user_id == user.id)
        .order_by(BlogRun.created_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "topic": r.topic,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
        }
        for r in runs
    ]


@router.get("/api/runs/{run_id}")
def get_run(
    run_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    run = (
        db.query(BlogRun)
        .filter(BlogRun.id == run_id, BlogRun.user_id == user.id)
        .first()
    )
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return {
        "id": run.id,
        "topic": run.topic,
        "status": run.status,
        "as_of": run.as_of,
        "audience_pref": run.audience_pref,
        "tone_pref": run.tone_pref,
        "blog_kind_pref": run.blog_kind_pref,
        "plan": json.loads(run.plan_json) if run.plan_json else None,
        "evidence": json.loads(run.evidence_json) if run.evidence_json else None,
        "final_markdown": run.final_markdown,
        "image_specs": json.loads(run.image_specs_json) if run.image_specs_json else None,
        "interrupt_type": run.interrupt_type,
        "interrupt_data": json.loads(run.interrupt_data_json) if run.interrupt_data_json else None,
        "error_message": run.error_message,
        "created_at": run.created_at.isoformat() if run.created_at else None,
        "updated_at": run.updated_at.isoformat() if run.updated_at else None,
        "images": [
            {
                "filename": img.filename,
                "alt_text": img.alt_text,
                "caption": img.caption,
            }
            for img in run.images
        ],
    }


@router.post("/api/runs/{run_id}/resume")
def resume_run(
    run_id: str,
    req: ResumeRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    run = (
        db.query(BlogRun)
        .filter(BlogRun.id == run_id, BlogRun.user_id == user.id)
        .first()
    )
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    if run.status != "interrupted":
        raise HTTPException(
            status_code=400,
            detail=f"Run is not paused (current status: {run.status})",
        )

    resume_value: dict = {"action": req.action}
    if req.queries is not None:
        resume_value["queries"] = req.queries
    if req.instructions is not None:
        resume_value["instructions"] = req.instructions

    workspace_dir = str(STORAGE_DIR / run_id)
    Path(workspace_dir).mkdir(parents=True, exist_ok=True)

    background_tasks.add_task(
        _resume_graph_task, run_id, resume_value, run.thread_id, workspace_dir,
    )
    return {"run_id": run_id, "status": "resuming"}


@router.get("/api/runs/{run_id}/images/{filename}")
def get_image(
    run_id: str,
    filename: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    run = (
        db.query(BlogRun)
        .filter(BlogRun.id == run_id, BlogRun.user_id == user.id)
        .first()
    )
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    image = (
        db.query(BlogImage)
        .filter(BlogImage.run_id == run_id, BlogImage.filename == filename)
        .first()
    )
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    return Response(content=image.image_data, media_type=image.content_type)


class ExportRequest(BaseModel):
    markdown: str
    title: Optional[str] = "Blog"


@router.post("/api/export/docx")
def export_docx(req: ExportRequest, user: User = Depends(get_current_user)):
    from agents.exporters import markdown_to_docx_bytes
    try:
        docx_bytes = markdown_to_docx_bytes(req.markdown)
        return Response(
            content=docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{req.title or "export"}.docx"'}
        )
    except Exception as e:
        logger.exception("DOCX export failed")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/export/pdf")
def export_pdf(req: ExportRequest, user: User = Depends(get_current_user)):
    from agents.exporters import markdown_to_pdf_bytes
    try:
        pdf_bytes = markdown_to_pdf_bytes(req.markdown)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{req.title or "export"}.pdf"'}
        )
    except Exception as e:
        logger.exception("PDF export failed")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/api/runs/{run_id}")
def delete_run(
    run_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    run = (
        db.query(BlogRun)
        .filter(BlogRun.id == run_id, BlogRun.user_id == user.id)
        .first()
    )
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    workspace = STORAGE_DIR / run_id
    if workspace.exists():
        shutil.rmtree(workspace, ignore_errors=True)
    db.delete(run)
    db.commit()
    return {"detail": "Run deleted"}
