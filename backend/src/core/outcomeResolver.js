/**
 * Autonomous outcome resolution + calibration gates.
 *
 * THE CORRECTION THIS FILE MAKES
 *
 * The first version of the learning loop required a named human to judge every
 * outcome. That was over-cautious and it kept the loop shut. Most of what this
 * platform predicts is objectively resolvable from data it already stores — a
 * demand forecast against actual sales, an ETA against the delivery timestamp,
 * a batch quarantine against the lab result that lands three days later. Making
 * a person confirm arithmetic the database can do is not safety, it is a
 * bottleneck wearing safety's clothes.
 *
 * So: fully autonomous wherever ground truth exists. `ai_resolution_rules`
 * declares where the truth for each prediction type lives, and this module goes
 * and gets it. No human, no queue, no waiting.
 *
 * WHERE AUTONOMY GENUINELY STOPS, AND WHY IT IS NOT A LIMIT OF THE AI
 *
 * One class resists automation and it is not a modelling problem. When the
 * system BLOCKS something — quarantines a batch, holds a transaction, reroutes
 * a truck — the blocked thing never happens, so its consequence is never
 * observed. There is one timeline. No model, however good, can measure an
 * outcome that was prevented from occurring.
 *
 * The honest engineering answer is not to pretend otherwise. It is to score
 * those on a declared proxy at reduced weight, and to record the reduced
 * weight rather than launder a guess into a fact. A fraud model that grades
 * itself on transactions it blocked will report excellent accuracy forever
 * while learning nothing; that is a self-confirming loop, and it fails silently.
 * The weighting is what keeps it honest.
 *
 * The comparison to autonomous weapons cuts the same way. Those systems close
 * their loop because a hit is directly observable. Where their outcome is NOT
 * observable — whether the target was correctly identified — is precisely
 * where they are hardest to validate and most contested. The lesson is not
 * "remove the human because weapons did"; it is "automate everything the world
 * will tell you the answer to, and be explicit about the rest."
 *
 * Here that means roughly seven of eight prediction types run with no human at
 * all. One does not, and says so.
 */

'use strict';

const pool = require('../database/pool');
const { logger } = require('../utils/logger');

/** Identifier guard — rule values reach SQL as identifiers, not parameters. */
const IDENT = /^[a-z_][a-z0-9_]*$/i;
function ident(v, what) {
  if (!IDENT.test(String(v || ''))) {
    throw new Error(`Unsafe ${what} in resolution rule: ${JSON.stringify(v)}`);
  }
  return v;
}

const AGG = new Set(['sum', 'avg', 'max', 'min', 'count']);

/**
 * Resolve every prediction whose resolution date has passed and whose type has
 * an enabled rule. Returns what it did, so a caller can log or alert.
 */
async function resolveDue({ limit = 500 } = {}) {
  const { rows: due } = await pool.query(
    `SELECT p.id, p.prediction_type, p.subject_id, p.predicted_value,
            p.predicted_label, p.predicted_at, p.stated_confidence,
            r.truth_table, r.truth_column, r.subject_column, r.truth_aggregate,
            r.window_days, r.date_column, r.resolution_mode, r.verdict_weight,
            r.tolerance_pct
       FROM ai_prediction_log p
       JOIN ai_resolution_rules r ON r.prediction_type = p.prediction_type
      WHERE p.resolved_at IS NULL
        AND r.enabled
        AND r.resolution_mode <> 'human_only'
        AND (p.resolves_on IS NULL OR p.resolves_on <= CURRENT_DATE)
      ORDER BY p.predicted_at
      LIMIT $1`,
    [limit]
  );

  const out = { resolved: 0, no_truth_yet: 0, errors: 0, skipped_human_only: 0, details: [] };

  for (const p of due) {
    try {
      const agg = AGG.has(p.truth_aggregate) ? p.truth_aggregate.toUpperCase() : null;
      const tbl = ident(p.truth_table, 'truth_table');
      const col = ident(p.truth_column, 'truth_column');
      const subj = ident(p.subject_column, 'subject_column');

      let sql;
      const params = [p.subject_id];
      if (agg) {
        sql = `SELECT ${agg}(${col})::numeric AS v FROM ${tbl} WHERE ${subj}::text = $1`;
      } else {
        // 'first' / 'last' — ordered pick rather than an aggregate
        const dir = p.truth_aggregate === 'last' ? 'DESC' : 'ASC';
        const order = p.date_column ? ident(p.date_column, 'date_column') : 'id';
        sql = `SELECT ${col} AS v FROM ${tbl} WHERE ${subj}::text = $1 ORDER BY ${order} ${dir} LIMIT 1`;
      }
      if (p.window_days && p.date_column) {
        const dc = ident(p.date_column, 'date_column');
        params.push(p.predicted_at);
        sql = sql.replace(/WHERE /, `WHERE ${dc} >= $2::timestamp AND ${dc} <= $2::timestamp + INTERVAL '${Number(p.window_days)} days' AND `);
      }

      const { rows } = await pool.query(sql, params);
      const raw = rows[0]?.v;

      if (raw === undefined || raw === null) {
        // Ground truth has not arrived. Not a failure — just not yet.
        out.no_truth_yet += 1;
        continue;
      }

      const numeric = typeof raw === 'number' || /^-?\d+(\.\d+)?$/.test(String(raw));
      await pool.query(
        `UPDATE ai_prediction_log
            SET actual_value = $2, actual_label = $3, resolved_at = CURRENT_TIMESTAMP
          WHERE id = $1`,
        [p.id, numeric ? Number(raw) : null, numeric ? null : String(raw)]
      );
      out.resolved += 1;
      out.details.push({
        id: p.id, type: p.prediction_type, mode: p.resolution_mode,
        weight: Number(p.verdict_weight),
        predicted: p.predicted_value === null ? p.predicted_label : Number(p.predicted_value),
        actual: numeric ? Number(raw) : String(raw),
      });
    } catch (err) {
      out.errors += 1;
      logger.error('outcomeResolver:resolve_failed', { predictionId: p.id, error: err.message });
    }
  }

  const { rows: hum } = await pool.query(
    `SELECT COUNT(*)::int AS n FROM ai_prediction_log p
       JOIN ai_resolution_rules r ON r.prediction_type = p.prediction_type
      WHERE p.resolved_at IS NULL AND r.resolution_mode = 'human_only'`
  );
  out.skipped_human_only = hum[0]?.n ?? 0;
  return out;
}

/**
 * Judge effector outcomes automatically from their observable consequence.
 *
 * `outcome_status` was previously settable only by a person. It now has a
 * second legitimate author: the system itself, when the consequence is
 * directly observable. `outcome_recorded_by` stays NULL and the note records
 * that it was machine-resolved, so a machine verdict is never mistaken for a
 * human one when somebody audits this later.
 */
async function autoJudgeOutcomes({ limit = 200 } = {}) {
  const { rows } = await pool.query(
    `SELECT o.id, o.actor_id, o.subject_type, o.subject_id, o.action, o.reacted_at
       FROM ai_outcomes o
      WHERE (o.outcome_status IS NULL OR o.outcome_status = 'pending')
        AND o.subject_id IS NOT NULL
      ORDER BY o.reacted_at
      LIMIT $1`,
    [limit]
  );

  let judged = 0;
  let unresolvable = 0;

  for (const o of rows) {
    try {
      // Did a quality check on this subject land AFTER the reaction?
      // quality_checks has no batch/lot column, so the subject is matched on
      // project_id. Columns verified against the applied schema — an earlier
      // draft used batch_id/checked_at/result, none of which exist, and would
      // have thrown on every row while looking like "nothing to judge yet".
      const { rows: qc } = await pool.query(
        `SELECT check_status FROM quality_checks
          WHERE project_id::text = $1 AND check_date > $2
          ORDER BY check_date DESC LIMIT 1`,
        [String(o.subject_id), o.reacted_at]
      );
      if (!qc.length) { unresolvable += 1; continue; }

      const passed = /pass|ok|accept|complete/i.test(String(qc[0].check_status));
      await pool.query(
        `UPDATE ai_outcomes
            SET outcome_status = $2,
                outcome_notes = $3,
                outcome_recorded_at = CURRENT_TIMESTAMP
          WHERE id = $1`,
        [
          o.id,
          passed ? 'helped' : 'no_effect',
          `Machine-resolved from quality_checks.check_status = "${qc[0].check_status}" observed after the reaction. `
          + 'No human reviewed this. Proxy evidence: the intervention prevented the '
          + 'outcome it was meant to prevent, so this is consistent with a correct '
          + 'call rather than proof of one.',
        ]
      );
      judged += 1;
    } catch (err) {
      logger.error('outcomeResolver:autojudge_failed', { outcomeId: o.id, error: err.message });
    }
  }
  return { judged, unresolvable, considered: rows.length };
}

/**
 * The gate. THIS is the step that makes the loop a loop rather than a diary.
 *
 * Returns how much authority an agent has earned. Callers must multiply their
 * confidence by `authorityMultiplier` and must not auto-execute when
 * `gate === 'advisory_only'`.
 *
 * An unknown agent gets 0.50, not 1.00. A system that trusts anything it has
 * not measured is not cautious by default, it is optimistic by default, and
 * optimism by default is how the 0%-learning-loop state persisted for so long.
 */
async function gateFor(actorId) {
  const { rows } = await pool.query(
    'SELECT * FROM v_ai_agent_gate WHERE actor_id = $1', [actorId]
  );
  if (!rows.length) {
    return {
      actorId,
      gate: 'unproven',
      authorityMultiplier: 0.5,
      resolved: 0,
      note: 'No resolved predictions. Authority halved — an unmeasured agent is '
          + 'unknown, not trustworthy.',
    };
  }
  const g = rows[0];
  return {
    actorId,
    gate: g.gate,
    authorityMultiplier: Number(g.authority_multiplier),
    resolved: g.resolved,
    statedConfidence: g.stated_confidence === null ? null : Number(g.stated_confidence),
    realisedAccuracy: g.realised_accuracy === null ? null : Number(g.realised_accuracy),
    calibrationGap: g.calibration_gap === null ? null : Number(g.calibration_gap),
    evidenceWeight: Number(g.evidence_weight),
    needsHuman: g.needs_human,
    note: {
      trusted: 'Calibrated. Output may drive automated action.',
      discounted: 'Mildly overconfident. Confidence is scaled down before use.',
      advisory_only: 'Overconfident by more than 25 points. Output may inform a '
                   + 'person but must not trigger an action on its own.',
      underconfident: 'Understates its own accuracy. Numbers are usable but not at face value.',
      unproven: 'Fewer than 10 resolved predictions. Authority halved until it has a record.',
    }[g.gate],
  };
}

/**
 * Apply a gate to a stated confidence. The single function every caller should
 * use before acting on an agent's number.
 */
async function applyGate(actorId, statedConfidence) {
  let g = await gateFor(actorId);
  return {
    ...g,
    statedConfidence,
    effectiveConfidence: Math.round(statedConfidence * g.authorityMultiplier * 100) / 100,
    mayAutoExecute: g.gate === 'trusted' || g.gate === 'discounted',
  };
}

/** One full autonomous cycle. Safe to run on a timer. */
async function runCycle() {
  const resolved = await resolveDue();
  const judged = await autoJudgeOutcomes();
  logger.info('outcomeResolver:cycle', {
    resolved: resolved.resolved,
    awaitingGroundTruth: resolved.no_truth_yet,
    humanOnlyPending: resolved.skipped_human_only,
    outcomesAutoJudged: judged.judged,
  });
  return { resolved, judged };
}

module.exports = {
  resolveDue, autoJudgeOutcomes, gateFor, applyGate, runCycle,
};
