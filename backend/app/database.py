import os
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create tables and apply the small additive schema updates used by the app."""
    Base.metadata.create_all(bind=engine)
    # ``create_all`` does not add columns to an existing table. Keep this
    # migration intentionally tiny and idempotent because the project does
    # not yet use a migration framework.
    inspector = inspect(engine)
    columns = {c["name"] for c in inspector.get_columns("blog_runs")}
    if "workflow_step" not in columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE blog_runs ADD COLUMN workflow_step VARCHAR(50)"))
