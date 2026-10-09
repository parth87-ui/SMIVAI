"""Phase 8: additive migrations on an existing (older) database."""
import sqlite3

from sqlalchemy import create_engine, inspect

from app import migrations


def _old_database(path):
    """The two tables as they existed before Phase 7, with a row each."""
    con = sqlite3.connect(path)
    con.executescript("""
        CREATE TABLE patients (patient_id VARCHAR PRIMARY KEY, name VARCHAR NOT NULL, plan VARCHAR, ability JSON);
        CREATE TABLE care_links (link_id VARCHAR PRIMARY KEY, patient_id VARCHAR, actor_role VARCHAR,
                                 actor_id VARCHAR, status VARCHAR);
        INSERT INTO patients VALUES ('pat_1', 'Ramesh Das', 'free', '{}');
        INSERT INTO care_links VALUES ('lnk_1', 'pat_1', 'caregiver', 'cg_1', 'active');
    """)
    con.commit()
    con.close()


def test_old_database_is_upgraded_backed_up_and_untouched(tmp_path, monkeypatch):
    monkeypatch.setattr(migrations, "BACKUP_DIR", tmp_path / "backups")
    db = tmp_path / "old.db"
    _old_database(db)
    engine = create_engine(f"sqlite:///{db.as_posix()}")

    assert migrations.run(engine) == [1, 2, 3, 4]
    insp = inspect(engine)
    assert "scopes" in {c["name"] for c in insp.get_columns("care_links")}
    assert "level_lock" in {c["name"] for c in insp.get_columns("patients")}

    con = sqlite3.connect(db)
    assert con.execute("SELECT name, plan FROM patients").fetchall() == [("Ramesh Das", "free")]
    assert con.execute("SELECT status, scopes FROM care_links").fetchall() == [("active", None)]   # None = shared
    con.close()

    backups = list((tmp_path / "backups").glob("old-*-before-v1.db"))
    assert len(backups) == 1
    old = sqlite3.connect(backups[0])
    assert "scopes" not in {r[1] for r in old.execute("PRAGMA table_info(care_links)")}   # the pre-migration copy
    old.close()

    assert migrations.run(engine) == []                      # idempotent
    assert all(m["applied"] for m in migrations.status(engine))


def test_status_is_read_only(tmp_path):
    db = tmp_path / "untouched.db"
    _old_database(db)
    before = db.read_bytes()
    engine = create_engine(f"sqlite:///{db.as_posix()}")
    assert not any(m["applied"] for m in migrations.status(engine))
    engine.dispose()
    assert db.read_bytes() == before                         # nothing created or changed
    assert "schema_migrations" not in inspect(create_engine(f"sqlite:///{db.as_posix()}")).get_table_names()


def test_fresh_database_records_versions_without_altering_or_backing_up(tmp_path, monkeypatch):
    monkeypatch.setattr(migrations, "BACKUP_DIR", tmp_path / "backups")
    db = tmp_path / "fresh.db"
    con = sqlite3.connect(db)
    con.executescript("CREATE TABLE patients (patient_id VARCHAR PRIMARY KEY, level_lock JSON);"
                      "CREATE TABLE care_links (link_id VARCHAR PRIMARY KEY, scopes JSON);")
    con.close()
    engine = create_engine(f"sqlite:///{db.as_posix()}")
    assert migrations.run(engine) == [1, 2, 3, 4]
    assert not (tmp_path / "backups").exists()
