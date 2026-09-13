# from fastapi import APIRouter, Depends, HTTPException, Query
# from sqlalchemy.orm import Session
# from sqlalchemy import func
# from typing import Optional

# from database import get_db
# from models import User, BlogRun
# # Import your get_current_admin dependency from wherever it's defined
# from auth import get_current_admin  

# router = APIRouter(prefix="/api/admin", tags=["Admin Dashboard"])

# # ── 1. PLATFORM ANALYTICS & METRICS ──
# @router.get("/metrics")
# def get_platform_metrics(
#     db: Session = Depends(get_db),
#     admin: User = Depends(get_current_admin)
# ):
#     total_users = db.query(User).count()
#     total_runs = db.query(BlogRun).count()
#     completed_runs = db.query(BlogRun).filter(BlogRun.status == "completed").count()
#     failed_runs = db.query(BlogRun).filter(BlogRun.status == "failed").count()
#     interrupted_runs = db.query(BlogRun).filter(BlogRun.status == "interrupted").count()

#     return {
#         "total_users": total_users,
#         "total_blogs_generated": total_runs,
#         "status_breakdown": {
#             "completed": completed_runs,
#             "failed": failed_runs,
#             "interrupted": interrupted_runs
#         },
#         "system_health": "Healthy (PostgreSQL Connected)"
#     }


# # ── 2. SYSTEM-WIDE RUN MONITORING ──
# @router.get("/runs")
# def get_all_runs(
#     status_filter: Optional[str] = Query(None, alias="status"),
#     db: Session = Depends(get_db),
#     admin: User = Depends(get_current_admin)
# ):
#     query = db.query(BlogRun)
#     if status_filter:
#         query = query.filter(BlogRun.status == status_filter)
    
#     runs = query.order_by(BlogRun.created_at.desc()).all()
    
#     # Format response to include username for global monitoring
#     results = []
#     for run in runs:
#         results.append({
#             "run_id": run.id,
#             "username": run.user.username if run.user else "Unknown",
#             "topic": run.topic,
#             "status": run.status,
#             "error_message": run.error_message,
#             "created_at": run.created_at
#         })
#     return results


# # ── 3. SAFETY & SECURITY AUDIT LOG (Guardrail Monitoring) ──
# @router.get("/audit-logs")
# def get_security_audit_logs(
#     db: Session = Depends(get_db),
#     admin: User = Depends(get_current_admin)
# ):
#     # Fetch runs where guardrail caught malicious input
#     flagged_runs = (
#         db.query(BlogRun)
#         .filter(BlogRun.guardrail_msg.isnot(None))
#         .order_by(BlogRun.created_at.desc())
#         .all()
#     )

#     logs = []
#     for run in flagged_runs:
#         logs.append({
#             "run_id": run.id,
#             "username": run.user.username if run.user else "Unknown",
#             "topic_attempted": run.topic,
#             "guardrail_message": run.guardrail_msg,
#             "timestamp": run.created_at
#         })
#     return logs


# # ── 4. USER MANAGEMENT ──
# @router.get("/users")
# def get_user_directory(
#     db: Session = Depends(get_db),
#     admin: User = Depends(get_current_admin)
# ):
#     users = db.query(User).all()
    
#     directory = []
#     for u in users:
#         blog_count = db.query(BlogRun).filter(BlogRun.user_id == u.id).count()
#         directory.append({
#             "user_id": u.id,
#             "username": u.username,
#             "is_admin": u.is_admin,
#             "total_blogs_created": blog_count,
#             "joined_at": u.created_at
#         })
#     return directory










from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models import BlogRun, User
from auth import get_current_admin


router = APIRouter(
    prefix="/api/admin",
    tags=["Admin Dashboard"],
)


@router.get("/metrics")
def get_platform_metrics(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Return platform-wide metrics. Admin access only."""

    total_users = db.query(User).count()
    total_runs = db.query(BlogRun).count()

    completed_runs = (
        db.query(BlogRun)
        .filter(BlogRun.status == "completed")
        .count()
    )

    failed_runs = (
        db.query(BlogRun)
        .filter(BlogRun.status == "failed")
        .count()
    )

    interrupted_runs = (
        db.query(BlogRun)
        .filter(BlogRun.status == "interrupted")
        .count()
    )

    running_runs = (
        db.query(BlogRun)
        .filter(BlogRun.status == "running")
        .count()
    )

    pending_runs = (
        db.query(BlogRun)
        .filter(BlogRun.status == "pending")
        .count()
    )

    return {
        "total_users": total_users,
        "total_blogs_generated": total_runs,
        "status_breakdown": {
            "completed": completed_runs,
            "failed": failed_runs,
            "interrupted": interrupted_runs,
            "running": running_runs,
            "pending": pending_runs,
        },
        "system_health": "Healthy",
    }


@router.get("/runs")
def get_all_runs(
    status_filter: Optional[str] = Query(
        default=None,
        alias="status",
    ),
    limit: int = Query(
        default=100,
        ge=1,
        le=500,
    ),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Return blog runs belonging to all users."""

    query = db.query(BlogRun)

    if status_filter:
        query = query.filter(BlogRun.status == status_filter)

    runs = (
        query
        .order_by(BlogRun.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "run_id": run.id,
            "user_id": run.user_id,
            "username": run.user.username if run.user else "Unknown",
            "topic": run.topic,
            "status": run.status,
            "error_message": run.error_message,
            "created_at": (
                run.created_at.isoformat()
                if run.created_at
                else None
            ),
            "updated_at": (
                run.updated_at.isoformat()
                if run.updated_at
                else None
            ),
        }
        for run in runs
    ]


@router.get("/audit-logs")
def get_security_audit_logs(
    limit: int = Query(
        default=100,
        ge=1,
        le=500,
    ),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Return blog runs that contain a recorded guardrail event.
    """

    flagged_runs = (
        db.query(BlogRun)
        .filter(BlogRun.guardrail_msg.isnot(None))
        .order_by(BlogRun.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "run_id": run.id,
            "user_id": run.user_id,
            "username": run.user.username if run.user else "Unknown",
            "topic_attempted": run.topic,
            "guardrail_message": run.guardrail_msg,
            "timestamp": (
                run.created_at.isoformat()
                if run.created_at
                else None
            ),
        }
        for run in flagged_runs
    ]


@router.get("/users")
def get_user_directory(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Return all registered users and their run counts."""

    users = (
        db.query(User)
        .order_by(User.created_at.desc())
        .all()
    )

    return [
        {
            "user_id": user.id,
            "username": user.username,
            "is_admin": user.is_admin,
            "total_blogs_created": len(user.runs),
            "joined_at": (
                user.created_at.isoformat()
                if user.created_at
                else None
            ),
        }
        for user in users
    ]


@router.get("/users/{user_id}")
def get_user_details(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Return one user's account information and run history."""

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    user_runs = sorted(
        user.runs,
        key=lambda item: item.created_at or 0,
        reverse=True,
    )

    return {
        "user_id": user.id,
        "username": user.username,
        "is_admin": user.is_admin,
        "joined_at": (
            user.created_at.isoformat()
            if user.created_at
            else None
        ),
        "runs": [
            {
                "run_id": run.id,
                "topic": run.topic,
                "status": run.status,
                "created_at": (
                    run.created_at.isoformat()
                    if run.created_at
                    else None
                ),
                "updated_at": (
                    run.updated_at.isoformat()
                    if run.updated_at
                    else None
                ),
                "error_message": run.error_message,
            }
            for run in user_runs
        ],
    }