import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column, Integer, String, Text, DateTime, LargeBinary, ForeignKey,
)
from sqlalchemy.orm import relationship

from database import Base


def _utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=_utcnow)

    runs = relationship("BlogRun", back_populates="user", cascade="all, delete-orphan")


class BlogRun(Base):
    __tablename__ = "blog_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    thread_id = Column(String(36), default=lambda: str(uuid.uuid4()), index=True)

    topic = Column(Text, nullable=False)
    status = Column(String(20), default="pending")  # pending | running | interrupted | completed | failed
    as_of = Column(String(10))

    audience_pref = Column(String(100), nullable=True)
    tone_pref = Column(String(100), nullable=True)
    blog_kind_pref = Column(String(50), nullable=True)

    # Serialised graph output — stored as JSON text
    plan_json = Column(Text, nullable=True)
    evidence_json = Column(Text, nullable=True)
    final_markdown = Column(Text, nullable=True)
    image_specs_json = Column(Text, nullable=True)

    # HITL interrupt state
    interrupt_type = Column(String(50), nullable=True)
    interrupt_data_json = Column(Text, nullable=True)

    error_message = Column(Text, nullable=True)
    guardrail_msg = Column(Text, nullable=True)

    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    user = relationship("User", back_populates="runs")
    images = relationship("BlogImage", back_populates="run", cascade="all, delete-orphan")


class BlogImage(Base):
    __tablename__ = "blog_images"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String(36), ForeignKey("blog_runs.id"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    alt_text = Column(Text, nullable=True)
    caption = Column(Text, nullable=True)
    content_type = Column(String(50), default="image/png")
    image_data = Column(LargeBinary, nullable=False)
    created_at = Column(DateTime, default=_utcnow)

    run = relationship("BlogRun", back_populates="images")
