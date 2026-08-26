from __future__ import annotations

import json
import logging
import shutil
import uuid
from datetime import date
from pathlib import Path
from typing import List, Optional

from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from langgraph.types import Command

from config import STORAGE_DIR
from database import SessionLocal, get_db, init_db
from models import BlogImage, BlogRun, User
from auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from agents.graph import app as blog_graph

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(title="BlogForge API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup():
    init_db()


# ===== Pydantic request / response schemas ================================

class RegisterRequest(BaseModel):
    username: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str


class CreateRunRequest(BaseModel):
    topic: str
    as_of: Optional[str] = None
    audience_pref: Optional[str] = None
    tone_pref: Optional[str] = None
    blog_kind_pref: Optional[str] = None


class ResumeRequest(BaseModel):
    action: str
    queries: Optional[List[str]] = None
    instructions: Optional[str] = None


# ===== Auth endpoints =====================================================

@app.post("/auth/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    user = User(
        username=req.username,
        hashed_password=hash_password(req.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token, user_id=user.id, username=user.username
    )


@app.post("/auth/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token, user_id=user.id, username=user.username
    )


@app.get("/auth/me")
def me(user: User = Depends(get_current_user)):
    return {"id": user.id, "username": user.username}


# ===== Helper: graph config ===============================================

def _graph_config(thread_id: str, workspace_dir: str) -> dict:
    return {"configurable": {"thread_id": thread_id, "workspace_dir": workspace_dir}}


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
            .filter(BlogImage.run_id == run_id, BlogImage.filename == img_path.name)
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
    else:
        run.status = "completed"
        run.interrupt_type = None
        run.interrupt_data_json = None

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
        run.image_specs_json = json.dumps(result["image_specs"], default=str)

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
        result = blog_graph.invoke(inputs, config=config)

        _update_run_from_result(run, result, db)
        _persist_images_to_db(run_id, Path(workspace_dir), db)
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
        db.commit()

        config = _graph_config(thread_id, workspace_dir)
        result = blog_graph.invoke(Command(resume=resume_value), config=config)

        _update_run_from_result(run, result, db)
        _persist_images_to_db(run_id, Path(workspace_dir), db)
    except Exception as e:
        logger.exception("Graph resume failed for %s", run_id)
        run = db.query(BlogRun).filter(BlogRun.id == run_id).first()
        if run:
            run.status = "failed"
            run.error_message = str(e)[:2000]
            db.commit()
    finally:
        db.close()


# ===== Run CRUD endpoints =================================================

@app.post("/api/runs")
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


@app.get("/api/runs")
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


@app.get("/api/runs/{run_id}")
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


@app.post("/api/runs/{run_id}/resume")
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


@app.get("/api/runs/{run_id}/images/{filename}")
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


@app.post("/api/export/docx")
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


@app.post("/api/export/pdf")
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


@app.delete("/api/runs/{run_id}")
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
