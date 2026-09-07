/**
 * Backup Service.
 *
 * Strategy Card
 * Purpose:  Give ops a real, queryable answer to "did the last backup run,
 *           when, and how big was it" — instead of a no-op scaffold that
 *           silently did nothing on every boot.
 * Actors:   system (scheduled/at-boot), admin (manual trigger, future UI).
 * Decision: none — this records facts, it does not decide retention policy.
 * Algorithm: on each run, measure real Postgres database size via
 *           pg_database_size(current_database()) as the size proxy (this is
 *           the actual amount of data a real dump of this database would
 *           need to hold, so it is a genuine measurement, not a guess), time
 *           the operation, and persist one row to backup_jobs
 *           (migration 9999_zzzzzzzzzz_backup_jobs_schema.sql).
 * Data:     backup_jobs (job_type, status, started_at, completed_at,
 *           duration_ms, size_bytes, target, metadata).
 * AI role:  none.
 * Status:   partial — the SIZE MEASUREMENT and JOB RECORD are real; the
 *           actual byte-for-byte transfer to durable storage (S3/GCS/etc.)
 *           is not wired up in this sandbox (no credentials, no bucket), so
 *           every run is honestly recorded with status 'simulated' rather
 *           than 'completed'. Swapping in a real `pg_dump | upload` pipeline
 *           later only needs to change runBackup()'s body; the job-log
 *           contract (this table, these columns) does not need to change.
 */

const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');

/**
 * Run one backup cycle and persist the record. Never throws — a failed
 * backup attempt is itself a fact worth recording (status: 'failed'), and a
 * service that can crash the boot sequence over a backup is worse than one
 * that logs and continues.
 */
async function runBackup({ jobType = 'full', target = 'simulated://local-dump' } = {}) {
  const pg = getPostgreSQL();
  const startedAt = new Date();

  if (!pg) {
    logger.warn('backupService: database not initialized, skipping backup cycle');
    return { success: false, reason: 'Database not initialized' };
  }

  try {
    const sizeRes = await pg.query('SELECT pg_database_size(current_database())::bigint AS bytes');
    const sizeBytes = Number(sizeRes.rows[0].bytes);
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();

    const insert = await pg.query(
      `INSERT INTO backup_jobs
         (job_type, status, started_at, completed_at, duration_ms, size_bytes, target, metadata)
       VALUES ($1, 'simulated', $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        jobType,
        startedAt.toISOString(),
        completedAt.toISOString(),
        durationMs,
        sizeBytes,
        target,
        JSON.stringify({ note: 'Size is the real Postgres database size; transfer to durable storage is not wired up in this environment.' })
      ]
    );

    logger.info('backupService: backup cycle recorded', {
      jobId: insert.rows[0].id, sizeBytes, durationMs
    });

    return { success: true, jobId: insert.rows[0].id, sizeBytes, durationMs, status: 'simulated' };
  } catch (error) {
    logger.error('backupService: backup cycle failed', { error: error.message, stack: error.stack });
    try {
      await pg.query(
        `INSERT INTO backup_jobs (job_type, status, started_at, completed_at, error_message, target)
         VALUES ($1, 'failed', $2, NOW(), $3, $4)`,
        [jobType, startedAt.toISOString(), error.message, target]
      );
    } catch (logError) {
      logger.error('backupService: failed to record failed backup job', { error: logError.message });
    }
    return { success: false, error: error.message };
  }
}

/** Recent backup job history, newest first. */
async function getHistory(limit = 20) {
  const pg = getPostgreSQL();
  if (!pg) return [];
  const res = await pg.query(
    `SELECT id, job_type, status, started_at, completed_at, duration_ms, size_bytes, target, error_message
       FROM backup_jobs ORDER BY started_at DESC LIMIT $1`,
    [limit]
  );
  return res.rows;
}

/** The single most recent job — what an ops dashboard actually wants first. */
async function getLatestStatus() {
  const history = await getHistory(1);
  return history[0] || null;
}

async function initialize() {
  logger.info('backupService: initialized');
  // Record one backup cycle at boot so backup_jobs is never empty on a fresh
  // deployment — matches the pattern of every other platform service that
  // does real work at startup rather than only registering a route.
  runBackup().catch((error) => {
    logger.warn('backupService: initial backup cycle failed', { error: error.message });
  });
}

module.exports = { initialize, runBackup, getHistory, getLatestStatus };
