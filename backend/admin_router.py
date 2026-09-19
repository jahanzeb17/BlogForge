from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import BlogRun, SecurityAuditLog, User
from auth import get_current_admin, is_super_admin, SUPER_ADMIN_EMAIL


router = APIRouter(
    prefix="/api/admin",
    tags=["Admin Dashboard"],
)


class RoleUpdateRequest(BaseModel):
    is_admin: bool


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
        query = query.filter(
            BlogRun.status == status_filter
        )

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
            "username": (
                run.user.username
                if run.user
                else "Unknown"
            ),
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
    Return persisted security guardrail events.

    Each record explicitly identifies whether the guarded input was the
    original topic, a subtopic, or a revision. Topic and subtopic are returned
    as separate fields so the Admin Security page never has to infer their
    meaning from a combined message.
    """

    events = (
        db.query(SecurityAuditLog)
        .order_by(SecurityAuditLog.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "id": event.id,
            "run_id": event.run_id,
            "user_id": event.user_id,
            "username": event.username,
            "email": event.email,
            "input_type": event.input_type,
            "topic": event.topic,
            "subtopic": event.subtopic,
            "guardrail_category": event.guardrail_category,
            "guardrail_message": event.guardrail_message,
            "action": event.action,
            "timestamp": (
                event.created_at.isoformat()
                if event.created_at
                else None
            ),
        }
        for event in events
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
            "email": user.email,
            "is_admin": user.is_admin,
            "is_super_admin": is_super_admin(user),
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
        "email": user.email,
        "is_admin": user.is_admin,
        "is_super_admin": is_super_admin(user),
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


@router.patch("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    req: RoleUpdateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Promote a user to administrator or demote an administrator
    to a normal user. Admin access only.

    The protected Super Admin can never be demoted.
    """

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

    # The protected Super Admin can never be demoted.
    if is_super_admin(user) and not req.is_admin:
        raise HTTPException(
            status_code=403,
            detail=(
                f"The protected Super Admin account "
                f"({SUPER_ADMIN_EMAIL}) cannot be demoted."
            ),
        )

    # Do not allow an administrator to remove their own
    # administrator privileges.
    if user.id == admin.id and not req.is_admin:
        raise HTTPException(
            status_code=400,
            detail="You cannot remove your own administrator access.",
        )

    # Do not allow the last administrator to be demoted.
    if user.is_admin and not req.is_admin:
        admin_count = (
            db.query(User)
            .filter(User.is_admin.is_(True))
            .count()
        )

        if admin_count <= 1:
            raise HTTPException(
                status_code=400,
                detail="The platform must have at least one administrator.",
            )

    user.is_admin = req.is_admin

    db.commit()
    db.refresh(user)

    return {
        "user_id": user.id,
        "username": user.username,
        "is_admin": user.is_admin,
        "is_super_admin": is_super_admin(user),
    }


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Permanently delete a user and their associated BlogForge data.

    The protected Super Admin account can never be deleted.
    """

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

    # The protected Super Admin can never be deleted.
    if is_super_admin(user):
        raise HTTPException(
            status_code=403,
            detail=(
                f"The protected Super Admin account "
                f"({SUPER_ADMIN_EMAIL}) cannot be deleted."
            ),
        )

    # Keep the existing self-protection behavior. An administrator must not
    # accidentally remove the account they are currently using.
    if user.id == admin.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot delete your own administrator account.",
        )

    deleted_user_id = user.id
    deleted_username = user.username
    deleted_email = user.email

    db.delete(user)
    db.commit()

    return {
        "detail": "User deleted successfully",
        "user_id": deleted_user_id,
        "username": deleted_username,
        "email": deleted_email,
    }