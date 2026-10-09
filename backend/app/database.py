"""SMIVAI — database session management.

PostgreSQL is the intended central store. If DATABASE_URL is not set the
service falls back to a local SQLite file so the API can be run and
demonstrated without a database server.
"""
from __future__ import annotations

import logging
import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = os.getenv(
    "SMIVAI_DATABASE_URL",
    "postgresql+psycopg://smivai:smivai@localhost:5432/smivai",
)

# Fallback used when no PostgreSQL is reachable (local demo / CI). The file
# always sits next to backend/, whatever directory the server is started from.
log = logging.getLogger("smivai.database")

FALLBACK_PATH = Path(__file__).resolve().parent.parent / "smivai_local.db"
FALLBACK_URL = f"sqlite:///{FALLBACK_PATH.as_posix()}"


def _make_engine():
    try:
        eng = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)
        eng.connect().close()
        return eng, DATABASE_URL
    except Exception as exc:  # noqa: BLE001 - any driver/connection problem falls back
        log.warning("Database %s unavailable (%s); using local SQLite at %s",
                    DATABASE_URL.split("://")[0], type(exc).__name__, FALLBACK_PATH)
        eng = create_engine(FALLBACK_URL, connect_args={"check_same_thread": False}, future=True)
        return eng, FALLBACK_URL


engine, ACTIVE_URL = _make_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
