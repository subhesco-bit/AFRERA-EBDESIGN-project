-- ---------------------------------------------------------------------------
-- RECONCILIATION NOTE (added 2026-09-23)
--
-- One or more table names in this file are also defined by another migration
-- with a different column set. `CREATE TABLE IF NOT EXISTS` then does NOTHING
-- on a clean run, and this file's later INSERT / CREATE INDEX statements failed
-- on columns that were never added. Verified on a clean PostgreSQL 16 run of
-- the full migration set.
--
-- Per the project rule, a collision is reconciled and not resolved by dropping
-- one side. Each CREATE TABLE below is followed by ADD COLUMN IF NOT EXISTS for
-- its own columns: a no-op where this file really created the table, and the
-- missing columns where it did not.
--
-- NOT NULL, PRIMARY KEY, UNIQUE and REFERENCES are deliberately not carried
-- over -- the table may already hold rows from the other definition that cannot
-- satisfy them, and a referenced column's type often differs from what this
-- file declares. Where that hides a real type mismatch, it is a reconciliation
-- still owed, not a fix.
-- ---------------------------------------------------------------------------

-- Schema recovery for the genuinely-real, genuinely-unique parts of
-- M012 (backend/src/modules/M012/service.js): session management, device
-- fingerprinting, and security-event logging. These three tables were
-- referenced by real, working, non-fabricated queries but never created by
-- any migration - same "relation does not exist" class of bug as the M010/
-- M078/M104/M107 recovery migration. Columns taken directly from M012's own
-- INSERT/SELECT statements. login()/register()/refresh-token()/logout() -
-- the parts of M012 that duplicated the canonical authService.js with a
-- weaker (hardcoded-fallback-secret) JWT implementation - are blocked at
-- the route level instead of getting a schema; see routes.js.

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(128) UNIQUE NOT NULL,
    device_info JSONB DEFAULT '{}',
    ip_address VARCHAR(64),
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    invalidated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS session_token VARCHAR(128);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}';
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ip_address VARCHAR(64);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS invalidated_at TIMESTAMP;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

-- 2026-08-31: renamed from idx_sessions_user - 014_platform_foundation_
-- modules.sql already creates an index of that exact name on the unrelated
-- user_sessions table and runs first; since this file's CREATE INDEX uses
-- IF NOT EXISTS, the name collision meant this table's own index silently
-- never got created.
CREATE INDEX IF NOT EXISTS idx_m012_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);

CREATE TABLE IF NOT EXISTS device_fingerprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fingerprint VARCHAR(255) NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(64),
    seen_count INTEGER DEFAULT 1,
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, fingerprint)
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE device_fingerprints ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE device_fingerprints ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE device_fingerprints ADD COLUMN IF NOT EXISTS fingerprint VARCHAR(255);
ALTER TABLE device_fingerprints ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE device_fingerprints ADD COLUMN IF NOT EXISTS ip_address VARCHAR(64);
ALTER TABLE device_fingerprints ADD COLUMN IF NOT EXISTS seen_count INTEGER DEFAULT 1;
ALTER TABLE device_fingerprints ADD COLUMN IF NOT EXISTS first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE device_fingerprints ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE device_fingerprints ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_device_fingerprints_user ON device_fingerprints(user_id);

CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    ip_address VARCHAR(64),
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE security_events ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE security_events ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE security_events ADD COLUMN IF NOT EXISTS event_type VARCHAR(50);
ALTER TABLE security_events ADD COLUMN IF NOT EXISTS ip_address VARCHAR(64);
ALTER TABLE security_events ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';
ALTER TABLE security_events ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
