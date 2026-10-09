"""SMIVAI — small, dependency-free schema migrations.

Why not Alembic: it would be a new dependency, and these changes are few
and purely additive. Rules every migration here must follow:

  * additive only — ADD COLUMN / CREATE INDEX; never DROP, RENAME or
    rewrite data. A column a migration adds must be nullable.
  * idempotent — a column that already exists (a fresh database created by
    ``create_all`` from the current models) is detected and skipped, and
    the version is still recorded.
  * recorded — each applied version is a row in ``schema_migrations``.
  * backed up — before the first pending migration touches a SQLite file,
    the file is copied to ``backend/backups/``. That copy contains personal
    data: keep it private and delete it when no longer needed.

``python -m app.migrations`` (from backend/) shows what is applied/pending.
The service applies pending migrations at startup, after ``create_all``.

Rollback: restore the backup file (SQLite), or drop the added column
manually (PostgreSQL: ``ALTER TABLE … DROP COLUMN …``) and delete the
version row. Nothing here ever removes data, so rollback is never needed
to recover existing records.
"""
from __future__ import annotations

import datetime as dt
import logging
import os
import shutil
from pathlib import Path

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

log = logging.getLogger("smivai.migrations")

BACKUP_DIR = Path(os.getenv("SMIVAI_BACKUP_DIR") or Path(__file__).resolve().parent.parent / "backups")

# (version, description, table, column, SQL type)
MIGRATIONS: list[tuple[int, str, str, str, str]] = [
    (1, "care-team permissions per link (Phase 7)", "care_links", "scopes", "JSON"),
    (2, "'always use this level' choices (Phase 3)", "patients", "level_lock", "JSON"),
    (3, "level each game led to (Rasch batch)", "game_sessions", "next_level", "VARCHAR"),
    (4, "how each game's level was chosen (Rasch batch)", "game_sessions", "level_source", "VARCHAR"),
]


def _ensure_table(engine: Engine) -> None:
    with engine.begin() as conn:
        conn.execute(text(
            "CREATE TABLE IF NOT EXISTS schema_migrations ("
            " version INTEGER PRIMARY KEY, description VARCHAR(200) NOT NULL,"
            " applied_at VARCHAR(40) NOT NULL)"
        ))


def applied_versions(engine: Engine) -> set[int]:
    _ensure_table(engine)
    with engine.connect() as conn:
        return {row[0] for row in conn.execute(text("SELECT version FROM schema_migrations"))}


def status(engine: Engine) -> list[dict]:
    """Read-only: never creates the tracking table or changes the database."""
    done: set[int] = set()
    if inspect(engine).has_table("schema_migrations"):
        with engine.connect() as conn:
            done = {row[0] for row in conn.execute(text("SELECT version FROM schema_migrations"))}
    return [{"version": v, "description": d, "applied": v in done} for v, d, *_ in MIGRATIONS]


def _backup_sqlite(engine: Engine, version: int) -> Path | None:
    if engine.url.get_backend_name() != "sqlite":
        return None
    db_file = engine.url.database
    if not db_file or db_file == ":memory:":
        return None
    src = Path(db_file)
    if not src.exists() or src.stat().st_size == 0:
        return None
    BACKUP_DIR.mkdir(exist_ok=True)
    stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    dest = BACKUP_DIR / f"{src.stem}-{stamp}-before-v{version}{src.suffix}"
    engine.dispose()                      # release file handles before copying
    shutil.copy2(src, dest)
    log.warning("Backed up %s to %s before migration v%s (contains personal data)", src.name, dest, version)
    return dest


def run(engine: Engine) -> list[int]:
    """Apply pending migrations. Returns the versions applied now."""
    done = applied_versions(engine)
    pending = [m for m in MIGRATIONS if m[0] not in done]
    if not pending:
        return []

    def needs_alter(table: str, column: str) -> bool:
        insp = inspect(engine)
        return insp.has_table(table) and column not in {c["name"] for c in insp.get_columns(table)}

    # Back up only when a column will really be added — a fresh database
    # already has every column from create_all, so there is nothing to protect.
    first_alter = next((m for m in pending if needs_alter(m[2], m[3])), None)
    if first_alter is not None:
        _backup_sqlite(engine, first_alter[0])

    applied = []
    for version, description, table, column, sqltype in pending:
        alter = needs_alter(table, column)
        with engine.begin() as conn:
            if alter:
                conn.execute(text(f'ALTER TABLE {table} ADD COLUMN {column} {sqltype}'))
                log.warning("Migration v%s: added %s.%s", version, table, column)
            conn.execute(
                text("INSERT INTO schema_migrations (version, description, applied_at) VALUES (:v, :d, :t)"),
                {"v": version, "d": description, "t": dt.datetime.now(dt.timezone.utc).isoformat()},
            )
        applied.append(version)
    return applied


if __name__ == "__main__":       # python -m app.migrations
    from .database import ACTIVE_URL, engine
    print("Database:", ACTIVE_URL.split("://")[0])
    for m in status(engine):
        print(f"  v{m['version']}  {'applied' if m['applied'] else 'PENDING'}  {m['description']}")
