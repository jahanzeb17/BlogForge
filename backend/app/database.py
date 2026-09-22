import logging
import threading
import time

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker, declarative_base

from .config import DATABASE_URL


logger = logging.getLogger(__name__)


engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


# Prevent many concurrent requests from all trying to wake/reconnect
# Neon at exactly the same time.
#
# RLock is used because the recovery flow can call another recovery-aware
# function which uses the same lock.
database_recovery_lock = threading.RLock()


def _sleep_for_retry(attempt: int) -> None:
    time.sleep(min(2 ** attempt, 8))


def ensure_database_ready(
    max_attempts: int = 5,
    initial_delay: float = 1.0,
) -> None:
    """
    Verify that PostgreSQL is reachable.

    A real SELECT 1 is intentionally used here because, when Neon has
    suspended its compute, a new query/connection wakes the compute.

    If an old SQLAlchemy connection is stale, dispose the idle pool so
    the next attempt creates fresh connections.
    """
    last_error = None

    for attempt in range(max_attempts):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))

            return

        except SQLAlchemyError as exc:
            last_error = exc

            logger.warning(
                "PostgreSQL is not ready "
                "(attempt %s/%s): %s",
                attempt + 1,
                max_attempts,
                exc,
            )

            # Remove stale idle connections.
            engine.dispose()

            if attempt + 1 < max_attempts:
                time.sleep(
                    min(
                        initial_delay * (2 ** attempt),
                        8,
                    )
                )

    raise last_error


def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


def init_db():
    """
    Create tables and apply the small additive schema updates used by the app.

    Startup DB initialization also gets retry/reconnect protection so a
    sleeping Neon compute does not immediately kill application startup.
    """
    last_error = None

    for attempt in range(5):
        try:
            Base.metadata.create_all(bind=engine)

            inspector = inspect(engine)

            columns = {
                c["name"]
                for c in inspector.get_columns("blog_runs")
            }

            if "workflow_step" not in columns:
                with engine.begin() as conn:
                    conn.execute(
                        text(
                            "ALTER TABLE blog_runs "
                            "ADD COLUMN workflow_step VARCHAR(50)"
                        )
                    )

            return

        except SQLAlchemyError as exc:
            last_error = exc

            logger.warning(
                "Database initialization failed "
                "(attempt %s/5): %s",
                attempt + 1,
                exc,
            )

            engine.dispose()

            if attempt < 4:
                _sleep_for_retry(attempt)

    raise last_error






# from sqlalchemy import create_engine, inspect, text
# from sqlalchemy.orm import sessionmaker, declarative_base

# from .config import DATABASE_URL


# engine = create_engine(
#     DATABASE_URL,
#     pool_pre_ping=True,
#     pool_recycle=300,
# )

# SessionLocal = sessionmaker(
#     autocommit=False,
#     autoflush=False,
#     bind=engine,
# )

# Base = declarative_base()


# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()


# def init_db():
#     """Create tables and apply the small additive schema updates used by the app."""
#     Base.metadata.create_all(bind=engine)

#     inspector = inspect(engine)
#     columns = {c["name"] for c in inspector.get_columns("blog_runs")}

#     if "workflow_step" not in columns:
#         with engine.begin() as conn:
#             conn.execute(
#                 text(
#                     "ALTER TABLE blog_runs "
#                     "ADD COLUMN workflow_step VARCHAR(50)"
#                 )
#             )