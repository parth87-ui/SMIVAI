-- ============================================================
-- SMIVAI — central PostgreSQL schema
-- Mirrors the on-device tables in js/core/db.js one-for-one, so a row
-- queued by the sync engine can be inserted without transformation.
-- ============================================================

CREATE TABLE IF NOT EXISTS caregivers (
    caregiver_id  TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    phone         TEXT,
    created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS doctors (
    doctor_id     TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    speciality    TEXT,
    created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patients (
    patient_id    TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    age           INTEGER,
    language      TEXT NOT NULL DEFAULT 'en',
    district      TEXT,
    caregiver_id  TEXT REFERENCES caregivers(caregiver_id),
    doctor_id     TEXT REFERENCES doctors(doctor_id),
    ability       JSONB DEFAULT '{}'::jsonb,   -- Rasch theta per activity
    difficulty    JSONB DEFAULT '{}'::jsonb,   -- level served per activity
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_patients_caregiver ON patients(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_patients_doctor    ON patients(doctor_id);

CREATE TABLE IF NOT EXISTS game_sessions (
    session_id        TEXT PRIMARY KEY,
    patient_id        TEXT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    game_type         TEXT NOT NULL,
    difficulty        TEXT NOT NULL CHECK (difficulty IN ('very_easy','easy','medium','hard','very_hard')),
    score             INTEGER NOT NULL,
    accuracy          REAL    NOT NULL,          -- 0..1
    response_time     REAL    NOT NULL,          -- seconds per action
    mistakes          INTEGER NOT NULL DEFAULT 0,
    attempts          INTEGER NOT NULL DEFAULT 0,
    completion_status TEXT    NOT NULL DEFAULT 'completed',
    duration_seconds  INTEGER DEFAULT 0,
    content_level     INTEGER DEFAULT 1,         -- 1 general · 2 NER · 3 personal
    source            TEXT    DEFAULT 'patient_app',
    session_date      DATE    NOT NULL,
    timestamp         TIMESTAMPTZ NOT NULL,
    updated_at        TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_patient_date ON game_sessions(patient_id, session_date);

CREATE TABLE IF NOT EXISTS reminders (
    reminder_id      TEXT PRIMARY KEY,
    patient_id       TEXT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    title            TEXT NOT NULL,
    description      TEXT,
    category         TEXT NOT NULL,
    reminder_date    DATE NOT NULL,
    reminder_time    TIME NOT NULL,
    repeat_rule      TEXT NOT NULL DEFAULT 'once',
    repeat_days      INTEGER[] DEFAULT '{}',
    priority         TEXT NOT NULL DEFAULT 'normal',
    status           TEXT NOT NULL DEFAULT 'active',   -- active | paused
    created_by_role  TEXT NOT NULL,                    -- caregiver | doctor
    created_by_id    TEXT NOT NULL,
    created_by_name  TEXT,
    voice_enabled    BOOLEAN DEFAULT TRUE,
    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reminders_patient ON reminders(patient_id);

-- One row per reminder occurrence that was acted on.
CREATE TABLE IF NOT EXISTS reminder_events (
    event_id     TEXT PRIMARY KEY,
    reminder_id  TEXT NOT NULL REFERENCES reminders(reminder_id) ON DELETE CASCADE,
    patient_id   TEXT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    event_date   DATE NOT NULL,
    status       TEXT NOT NULL CHECK (status IN ('completed','skipped','missed')),
    marked_at    TIMESTAMPTZ,
    marked_by    TEXT,
    updated_at   TIMESTAMPTZ DEFAULT now(),
    UNIQUE (reminder_id, event_date)
);
CREATE INDEX IF NOT EXISTS idx_rev_patient_date ON reminder_events(patient_id, event_date);

CREATE TABLE IF NOT EXISTS memory_bank (
    memory_id   TEXT PRIMARY KEY,
    patient_id  TEXT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    category    TEXT NOT NULL,
    title       TEXT NOT NULL,
    content     TEXT,
    icon        TEXT,
    created_by  TEXT,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_memory_patient ON memory_bank(patient_id);

CREATE TABLE IF NOT EXISTS cognitive_scores (
    score_id         TEXT PRIMARY KEY,
    patient_id       TEXT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    score_date       DATE NOT NULL,
    score            INTEGER NOT NULL,
    trend            TEXT NOT NULL DEFAULT 'stable',
    sessions_counted INTEGER DEFAULT 0,
    updated_at       TIMESTAMPTZ DEFAULT now(),
    UNIQUE (patient_id, score_date)
);

CREATE TABLE IF NOT EXISTS moods (
    mood_id     TEXT PRIMARY KEY,
    patient_id  TEXT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    mood_date   DATE NOT NULL,
    mood        TEXT NOT NULL CHECK (mood IN ('good','okay','low')),
    updated_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE (patient_id, mood_date)
);

-- A patient's own notepad. Private: written only by the patient
-- (see PRIVATE_TABLES in app/models.py), served by no read endpoint.
CREATE TABLE IF NOT EXISTS patient_notes (
    note_id     TEXT PRIMARY KEY,
    patient_id  TEXT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    text        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS patient_notes_patient ON patient_notes (patient_id);

CREATE TABLE IF NOT EXISTS care_notes (
    note_id         TEXT PRIMARY KEY,
    patient_id      TEXT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    created_by      TEXT NOT NULL,     -- caregiver | doctor
    created_by_name TEXT,
    content         TEXT NOT NULL,
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contacts (
    contact_id   TEXT PRIMARY KEY,
    patient_id   TEXT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    relation     TEXT,
    phone        TEXT,
    is_emergency BOOLEAN DEFAULT FALSE,
    updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS routines (
    routine_id  TEXT PRIMARY KEY,
    patient_id  TEXT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    routine_time TIME NOT NULL,
    title       TEXT NOT NULL,
    icon        TEXT,
    updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Audit of what each device pushed, so a sync can be replayed or inspected.
CREATE TABLE IF NOT EXISTS sync_log (
    log_id     BIGSERIAL PRIMARY KEY,
    device_id  TEXT NOT NULL,
    table_name TEXT NOT NULL,
    op         TEXT NOT NULL,
    pk         TEXT NOT NULL,
    queued_at  TIMESTAMPTZ,
    applied_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sync_log_device ON sync_log(device_id, applied_at);

-- ============================================================
-- SMIVAI v2 — accounts, care links and everyday services
-- ============================================================

-- New columns on existing tables (safe to re-run).
ALTER TABLE patients    ADD COLUMN IF NOT EXISTS gender     TEXT;
ALTER TABLE patients    ADD COLUMN IF NOT EXISTS plan       TEXT NOT NULL DEFAULT 'free';
ALTER TABLE patients    ADD COLUMN IF NOT EXISTS share_code TEXT;
ALTER TABLE caregivers  ADD COLUMN IF NOT EXISTS relation   TEXT;
ALTER TABLE caregivers  ADD COLUMN IF NOT EXISTS plan       TEXT NOT NULL DEFAULT 'free';
ALTER TABLE doctors     ADD COLUMN IF NOT EXISTS plan       TEXT NOT NULL DEFAULT 'free';
ALTER TABLE doctors     ADD COLUMN IF NOT EXISTS license_last4 TEXT;
-- 'prototype' until a real council register is wired in. Never claim more.
ALTER TABLE doctors     ADD COLUMN IF NOT EXISTS license_verified TEXT NOT NULL DEFAULT 'prototype';
ALTER TABLE memory_bank ADD COLUMN IF NOT EXISTS memory_group TEXT;
ALTER TABLE memory_bank ADD COLUMN IF NOT EXISTS memory_date  DATE;
ALTER TABLE memory_bank ADD COLUMN IF NOT EXISTS people       TEXT;
ALTER TABLE memory_bank ADD COLUMN IF NOT EXISTS place        TEXT;
ALTER TABLE memory_bank ADD COLUMN IF NOT EXISTS event        TEXT;
-- The photograph itself stays on the device; only the reference syncs.
ALTER TABLE memory_bank ADD COLUMN IF NOT EXISTS photo_media  TEXT;
ALTER TABLE memory_bank ADD COLUMN IF NOT EXISTS photo_scene  TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_share_code ON patients(share_code);

-- A sign-in. The identity number itself is never stored: only a salted
-- SHA-256 hash of it and the last four digits, which is all the UI shows.
CREATE TABLE IF NOT EXISTS accounts (
    account_id    TEXT PRIMARY KEY,
    role          TEXT NOT NULL CHECK (role IN ('patient','caregiver','doctor')),
    entity_id     TEXT NOT NULL,
    name          TEXT NOT NULL,
    id_type       TEXT NOT NULL CHECK (id_type IN ('aadhaar','abha','license')),
    id_hash       TEXT NOT NULL,
    id_last4      TEXT,
    phone_tail    TEXT,
    verification  TEXT NOT NULL DEFAULT 'prototype',
    created_at    TIMESTAMPTZ DEFAULT now(),
    last_login_at TIMESTAMPTZ,
    UNIQUE (role, id_hash)
);
CREATE INDEX IF NOT EXISTS idx_accounts_entity ON accounts(role, entity_id);

-- Who may see a patient. Created only from the care code the patient reads
-- out; this table is what every patient-scoped read is filtered by.
CREATE TABLE IF NOT EXISTS care_links (
    link_id    TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    actor_role TEXT NOT NULL CHECK (actor_role IN ('caregiver','doctor')),
    actor_id   TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    removed_at TIMESTAMPTZ,
    UNIQUE (patient_id, actor_role, actor_id)
);
CREATE INDEX IF NOT EXISTS idx_care_links_actor ON care_links(actor_role, actor_id, status);

CREATE TABLE IF NOT EXISTS appointments (
    appointment_id   TEXT PRIMARY KEY,
    patient_id       TEXT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    doctor_id        TEXT NOT NULL,
    doctor_name      TEXT NOT NULL,
    speciality       TEXT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    mode             TEXT NOT NULL DEFAULT 'video' CHECK (mode IN ('video','clinic','home')),
    status           TEXT NOT NULL DEFAULT 'scheduled'
                     CHECK (status IN ('scheduled','confirmed','completed','cancelled')),
    reason           TEXT,
    fee              INTEGER,
    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id, appointment_date);

-- Self-reported readings and photographed reports. SMIVAI records them;
-- it does not interpret them.
CREATE TABLE IF NOT EXISTS vitals (
    vital_id    TEXT PRIMARY KEY,
    patient_id  TEXT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    kind        TEXT NOT NULL,          -- bp | spo2 | weight | steps | document
    value       DOUBLE PRECISION,
    systolic    INTEGER,
    diastolic   INTEGER,
    unit        TEXT,
    label       TEXT,
    media_id    TEXT,                   -- device-side photo reference
    source      TEXT NOT NULL DEFAULT 'self',
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vitals_patient ON vitals(patient_id, kind, recorded_at);

CREATE TABLE IF NOT EXISTS alerts (
    alert_id    TEXT PRIMARY KEY,
    patient_id  TEXT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    kind        TEXT NOT NULL DEFAULT 'sos',
    severity    TEXT NOT NULL DEFAULT 'critical',
    title       TEXT NOT NULL,
    body        TEXT,
    status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
    resolved_by TEXT,
    resolved_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_alerts_open ON alerts(status, created_at);

CREATE TABLE IF NOT EXISTS notifications (
    notification_id TEXT PRIMARY KEY,
    recipient_role  TEXT NOT NULL,
    recipient_id    TEXT NOT NULL,
    patient_id      TEXT,
    kind            TEXT NOT NULL DEFAULT 'info',
    title           TEXT NOT NULL,
    body            TEXT,
    link            TEXT,
    read            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_to ON notifications(recipient_role, recipient_id, read);

-- Demo pharmacy orders: no pharmacy is contacted and no payment is taken.
CREATE TABLE IF NOT EXISTS orders (
    order_id           TEXT PRIMARY KEY,
    patient_id         TEXT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    items              JSONB NOT NULL DEFAULT '[]'::jsonb,
    address            TEXT,
    payment            TEXT,
    status             TEXT NOT NULL DEFAULT 'placed',
    reference          TEXT,
    eta                TEXT,
    prescription_media TEXT,
    created_at         TIMESTAMPTZ DEFAULT now(),
    updated_at         TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS care_requests (
    request_id   TEXT PRIMARY KEY,
    patient_id   TEXT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    service      TEXT NOT NULL,
    request_date DATE NOT NULL,
    request_time TIME NOT NULL,
    note         TEXT,
    status       TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','accepted','done','cancelled')),
    accepted_by  TEXT,
    created_at   TIMESTAMPTZ DEFAULT now(),
    updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Small daily engagements (daily fact read, skill finished) — feeds streaks.
CREATE TABLE IF NOT EXISTS activity_log (
    activity_id   TEXT PRIMARY KEY,
    patient_id    TEXT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    kind          TEXT NOT NULL,
    ref           TEXT,
    activity_date DATE NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_log_day ON activity_log(patient_id, activity_date);


-- ------------------------------------------------------------------
-- v3: five difficulty levels. For a database created before them, the
-- CREATE TABLE above is skipped, so widen its constraint here.
-- ------------------------------------------------------------------
ALTER TABLE game_sessions DROP CONSTRAINT IF EXISTS game_sessions_difficulty_check;
ALTER TABLE game_sessions ADD CONSTRAINT game_sessions_difficulty_check
    CHECK (difficulty IN ('very_easy','easy','medium','hard','very_hard'));
