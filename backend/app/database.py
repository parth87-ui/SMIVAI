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



def normalise_url(url: str) -> str:
    """Hosted PostgreSQL (Render, Heroku, …) hands out ``postgres://`` or
    ``postgresql://`` URLs; this service uses the psycopg 3 driver."""
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix):]
    return url


DATABASE_URL = normalise_url(os.getenv(
    "SMIVAI_DATABASE_URL",
    "postgresql+psycopg://smivai:smivai@localhost:5432/smivai",
))
# In production set SMIVAI_REQUIRE_DATABASE=1: a hosted server must never
# fall back to a SQLite file that disappears on the next deploy.
REQUIRE_DATABASE = os.getenv("SMIVAI_REQUIRE_DATABASE") == "1"

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
        if REQUIRE_DATABASE:
            raise RuntimeError(f"Database unavailable and SMIVAI_REQUIRE_DATABASE=1 ({type(exc).__name__})") from exc
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
