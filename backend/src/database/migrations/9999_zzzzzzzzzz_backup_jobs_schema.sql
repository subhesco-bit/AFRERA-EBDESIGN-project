-- ============================================================================
-- 9999_zzzzzzzzzz_backup_jobs_schema.sql
--
-- BACKUP JOB LOG — backupService.js was a no-op scaffold with no record of
-- whether a backup ever ran, when, or how big it was. This table is the
-- system of record for that, even while the underlying backup mechanism
-- (pg_dump / cloud snapshot / etc.) is simulated rather than wired to real
-- storage — see services/platform/backupService.js's module header for why
-- simulating the transfer while recording it honestly (status: 'simulated')
-- is preferable to fabricating a fake successful transfer.
-- ============================================================================

CREATE TABLE IF NOT EXISTS backup_jobs (
    id BIGSERIAL PRIMARY KEY,
    job_type VARCHAR(40) NOT NULL DEFAULT 'full',       -- 'full' | 'incremental'
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'running', 'completed', 'failed', 'simulated')),
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    duration_ms INTEGER,
    size_bytes BIGINT,
    target VARCHAR(120),           -- where it was (or would be) written
    error_message TEXT,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_backup_jobs_started_at ON backup_jobs (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_jobs_status ON backup_jobs (status);
