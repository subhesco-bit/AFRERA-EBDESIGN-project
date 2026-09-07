/**
 * Outcome sink — closes the learning loop.
 *
 * `core/effectors.js` has always exposed `setOutcomeSink()`. Nothing ever
 * supplied one, so every reaction was logged and then forgotten. That is why
 * the AI learning loop measured 0% in every audit: not because the design was
 * missing, but because one wire was never connected.
 *
 * This module is that wire. It persists to `ai_outcomes` (migration 990) and
 * lets a human later record whether the reaction actually helped.
 *
 * TWO RULES THIS FILE OBEYS
 *
 * 1. It must never break the request that emitted the signal. A failure to
 *    record an outcome is a lost lesson, not a lost order. Every write is
 *    wrapped and swallowed with a log.
 *
 * 2. It records what happened, never a judgement. `outcome_status` starts NULL
 *    and only a named human sets it. An agent grading its own homework is not
 *    a feedback loop — it is a mirror.
 */

'use strict';

const pool = require('../database/pool');
const { logger } = require('../utils/logger');

/**
 * Persist one effector reaction. Matches the entry shape that
 * effectors.record() builds.
 */
async function persistOutcome(entry) {
  const o = entry.outcome || {};
  try {
    const { rows } = await pool.query(
      `INSERT INTO ai_outcomes
         (actor_id, actor_kind, signal_type, severity, source, action,
          subject_type, subject_id, escalated, rationale, payload, reacted_at)
       VALUES ($1,'effector',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id`,
      [
        entry.reactionId,
        entry.signalType ?? null,
        entry.severity ?? null,
        entry.source ?? null,
        o.action ?? 'unknown',
        o.incidentType ?? o.scope ?? null,
        o.subject == null ? null : String(o.subject),
        Boolean(entry.escalated),
        entry.rationale ?? 'no rationale recorded',
        JSON.stringify(o),
        entry.at ?? new Date().toISOString(),
      ]
    );
    return rows[0]?.id ?? null;
  } catch (err) {
    // Deliberately swallowed. See rule 1 in the header.
    logger.error('outcomeSink:persist_failed', {
      reactionId: entry.reactionId, message: err.message,
    });
    return null;
  }
}

/**
 * Record a prediction so it can be scored later.
 *
 * `statedConfidence` is captured at prediction time on purpose. Comparing it
 * to realised accuracy is what distinguishes an inaccurate agent from an
 * OVERCONFIDENT one — different faults, different fixes.
 */
async function recordPrediction({
  actorId, predictionType, subjectType, subjectId,
  predictedValue, predictedLabel, statedConfidence, inputQuality,
  horizonDays, resolvesOn,
}) {
  if (!actorId || !predictionType) {
    throw new Error('recordPrediction requires actorId and predictionType');
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO ai_prediction_log
         (actor_id, prediction_type, subject_type, subject_id,
          predicted_value, predicted_label, stated_confidence, input_quality,
          horizon_days, resolves_on)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [actorId, predictionType, subjectType ?? null,
        subjectId == null ? null : String(subjectId),
        predictedValue ?? null, predictedLabel ?? null,
        statedConfidence ?? null, inputQuality ?? null,
        horizonDays ?? null, resolvesOn ?? null]
    );
    return rows[0]?.id ?? null;
  } catch (err) {
    logger.error('outcomeSink:prediction_failed', { actorId, message: err.message });
    return null;
  }
}

/**
 * A human judges an outcome. This is the only path that may set
 * outcome_status, and the reviewer is required — an unattributed judgement
 * cannot be questioned later, which defeats the purpose of recording it.
 */
async function judgeOutcome({ outcomeId, status, value, notes, reviewedBy }) {
  const allowed = ['pending', 'helped', 'no_effect', 'harmed', 'wrong_call', 'not_actioned', 'superseded'];
  if (!allowed.includes(status)) {
    throw new Error(`Unknown outcome status "${status}"`);
  }
  if (!reviewedBy) {
    throw new Error('An outcome judgement must record who made it');
  }
  // Mirrors the DB constraint so the caller gets a useful message rather than
  // a raw constraint violation.
  if (['harmed', 'wrong_call'].includes(status) && (!notes || !notes.trim())) {
    throw new Error(
      'Recording a negative outcome requires notes. Knowing the system got it '
      + 'wrong without knowing how tells you to distrust the agent but not what to fix.'
    );
  }

  const { rows } = await pool.query(
    `UPDATE ai_outcomes
        SET outcome_status = $2, outcome_value = $3, outcome_notes = $4,
            outcome_recorded_by = $5, outcome_recorded_at = CURRENT_TIMESTAMP
      WHERE id = $1 RETURNING *`,
    [outcomeId, status, value ?? null, notes ?? null, reviewedBy]
  );
  if (rows.length === 0) throw new Error(`Outcome ${outcomeId} not found`);
  return rows[0];
}

/** Resolve a prediction against what actually happened. */
async function resolvePrediction({ predictionId, actualValue, actualLabel }) {
  const { rows } = await pool.query(
    `UPDATE ai_prediction_log
        SET actual_value = $2, actual_label = $3, resolved_at = CURRENT_TIMESTAMP
      WHERE id = $1 RETURNING *`,
    [predictionId, actualValue ?? null, actualLabel ?? null]
  );
  if (rows.length === 0) throw new Error(`Prediction ${predictionId} not found`);
  return rows[0];
}

/** Everything the system did that nobody has judged yet. */
async function listPendingJudgement(limit = 50) {
  const { rows } = await pool.query(
    'SELECT * FROM v_ai_outcomes_pending LIMIT $1', [limit]
  );
  return rows;
}

/** Live accuracy per actor, derived from outcomes rather than stored. */
async function getAccuracy() {
  const { rows } = await pool.query('SELECT * FROM v_ai_actor_accuracy ORDER BY total DESC');
  return rows.map((r) => ({
    ...r,
    // An actor with no judged outcomes has UNKNOWN accuracy, not good accuracy.
    // Reporting null as 100% is how a system convinces itself it is working.
    helpfulness_pct: r.helpfulness_pct === null ? null : Number(r.helpfulness_pct),
    note: r.helpfulness_pct === null
      ? 'No judged outcomes yet — accuracy is unknown, not good.'
      : null,
  }));
}

/** Calibration: stated confidence vs realised accuracy. */
async function getCalibration() {
  const { rows } = await pool.query('SELECT * FROM v_ai_calibration ORDER BY calibration_gap DESC NULLS LAST');
  return rows.map((r) => ({
    ...r,
    verdict: r.calibration_gap === null ? 'insufficient data'
      : Number(r.calibration_gap) > 15 ? 'overconfident'
        : Number(r.calibration_gap) < -15 ? 'underconfident'
          : 'well calibrated',
  }));
}

/** Install this sink into the effector layer. Called once at boot. */
function install() {
  // Required lazily to avoid a require cycle: effectors does not know about
  // persistence, and must not.
  const { setOutcomeSink } = require('./effectors');
  setOutcomeSink(persistOutcome);
  logger.info('outcome sink installed — learning loop is now recording');
}

module.exports = {
  install,
  persistOutcome,
  recordPrediction,
  resolvePrediction,
  judgeOutcome,
  listPendingJudgement,
  getAccuracy,
  getCalibration,
};
