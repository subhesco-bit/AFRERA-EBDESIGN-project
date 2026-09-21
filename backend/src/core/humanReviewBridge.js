/**
 * humanReviewBridge — route decisions that need a person into the approval queue.
 *
 * decisionEngine already decides when a call is too consequential to make
 * alone: it stamps `requiresHuman: true` on the record and re-emits it as
 * DECISION_MADE. The platform also already has the queue those decisions
 * belong in — the `ai_proposals` table, surfaced through `v_ai_approval_queue`
 * and `v_pending_approvals`.
 *
 * Nothing connected the two. A decision could conclude "hold this shipment,
 * open a claim, and get a human to look at it", emit that conclusion, and no
 * human would ever see it. The flag was produced and discarded.
 *
 * This subscribes to DECISION_MADE and files the ones marked requiresHuman as
 * proposals, preserving the rationale and the causal chain so a reviewer can
 * see why the platform reached that conclusion rather than being handed a bare
 * instruction.
 *
 * Autonomous decisions are deliberately NOT filed. The queue is for things
 * awaiting a person; filling it with decisions that already executed would
 * bury the ones that need attention.
 */

'use strict';

const { signalBus, SIGNAL } = require('./signalBus');
const { getPostgreSQL } = require('../database/connection');
const { logger } = require('../utils/logger');

/** Which business domain a decision belongs to, from its rule id. */
function domainOf(record) {
  const rule = String(record.rule || '');
  const dot = rule.indexOf('.');
  if (dot > 0) return rule.slice(0, dot).slice(0, 50);
  return 'platform';
}

/**
 * Confidence is numeric(5,2) in the table and a 0..1 float on the decision.
 * Store it as a percentage so the column's scale is meaningful, and clamp so a
 * mis-scaled rule cannot overflow the column and abort the insert.
 */
function toPercent(confidence) {
  if (confidence === null || confidence === undefined) return null;
  const n = Number(confidence);
  if (!Number.isFinite(n)) return null;
  const pct = n <= 1 ? n * 100 : n;
  return Math.max(0, Math.min(999.99, Math.round(pct * 100) / 100));
}

async function fileForReview(signal) {
  const record = signal?.payload;
  if (!record || record.requiresHuman !== true) return null;

  const pool = getPostgreSQL();
  if (!pool) {
    // Never lose the decision silently just because the store is unavailable.
    logger.warn('humanReview: decision needs a person but the database is unavailable', {
      rule: record.rule,
      actions: record.actions,
      entityId: record.entityId,
    });
    return null;
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO ai_proposals
         (domain, proposal_type, subject_type, subject_id,
          proposed_value, rationale, confidence, model_reference, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'proposed')
       RETURNING id`,
      [
        domainOf(record),
        String(record.rule || 'decision').slice(0, 60),
        'signal_entity',
        record.entityId === null || record.entityId === undefined
          ? null
          : String(record.entityId).slice(0, 100),
        JSON.stringify({
          actions: record.actions || [],
          severity: record.severity ?? null,
          mode: record.mode ?? null,
          // The causal chain is the point: a reviewer needs to see which
          // signals led here, not just the instruction.
          causedBy: record.causedBy || [],
          decisionId: record.id ?? null,
        }),
        record.rationale || 'No rationale recorded.',
        toPercent(record.confidence),
        String(record.rule || 'decisionEngine').slice(0, 100),
      ],
    );

    const proposalId = rows[0]?.id ?? null;
    logger.info('humanReview: decision filed for approval', {
      proposalId,
      rule: record.rule,
      entityId: record.entityId,
      actions: record.actions,
    });
    return proposalId;
  } catch (error) {
    // A failure to file must not propagate into the emitter — a signal handler
    // that throws would break the bus for every other subscriber.
    logger.error('humanReview: could not file decision for approval', {
      error: error.message,
      rule: record.rule,
      entityId: record.entityId,
    });
    return null;
  }
}

let unsubscribe = null;

/** Attach to the bus. Idempotent. */
function start() {
  if (unsubscribe) return { alreadyStarted: true };
  unsubscribe = signalBus.onSignal(SIGNAL.DECISION_MADE, (signal) => {
    // Fire and forget: the bus is synchronous and must not wait on a write.
    fileForReview(signal).catch((e) =>
      logger.error('humanReview: unexpected failure', { error: e.message }));
  });
  logger.info('Human review bridge active — decisions marked requiresHuman are filed to ai_proposals');
  return { started: true };
}

function stop() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

/** What is waiting for a person right now. */
async function pending(limit = 50) {
  const pool = getPostgreSQL();
  if (!pool) return [];
  const { rows } = await pool.query(
    `SELECT id, domain, proposal_type, subject_id, proposed_value, rationale,
            confidence, created_at, hours_waiting
     FROM v_ai_approval_queue
     ORDER BY created_at
     LIMIT $1`,
    [limit],
  );
  return rows;
}

module.exports = { start, stop, fileForReview, pending };
