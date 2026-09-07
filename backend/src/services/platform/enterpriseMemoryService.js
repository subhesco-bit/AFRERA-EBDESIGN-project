/**
 * Enterprise Memory Service.
 *
 * Strategy Card
 * Purpose:  Answer "what happened last time this kind of thing occurred, and
 *           how did it resolve?" — a retrievable case log, not a log file.
 * Actors:   effectors/signalBus (system, write path), ops/admin (human, read
 *           path via search and entity lookup).
 * Decision: none itself — it is the memory an operator or a future agent
 *           reads before deciding, not a decision-maker.
 * Algorithm: full-text search over enterprise_memory_entries using Postgres
 *           to_tsvector/to_tsquery (same pattern as knowledge_nodes and
 *           food_nutrition_profiles elsewhere in this codebase) — no
 *           embedding model is configured anywhere in this codebase, so this
 *           is deliberately keyword search, not fabricated semantic search.
 * Data:     enterprise_memory_entries (migration 9997_enterprise_memory_schema.sql,
 *           already present before this pass) — occurred_at, source,
 *           category, tags, entity_type/entity_id, what_happened,
 *           resolution, severity, source_outcome_id, source_prediction_id.
 * AI role:  none — retrieval is exact keyword search, not a language model.
 * Status:   real.
 *
 * WHY installSignalHooks() IS A READ-ONLY SUBSCRIBER
 * This module only ever calls signalBus.onSignal() — it never emits, never
 * touches core/effectors.js or core/outcomeSink.js. Case entries and
 * ai_outcomes rows are written independently by two separate subscribers to
 * the same signal, so linking them (source_outcome_id) is necessarily
 * best-effort: there is no shared transaction, and signalBus's async
 * subscribers are not ordered relative to each other (see signalBus.js's
 * _safeEmit — it fires listeners but does not await them). The short delay
 * before the link lookup in linkToOutcome() exists to let the effector's
 * INSERT (core/outcomeSink.js persistOutcome) land first; if it hasn't,
 * losing the link is an acceptable degradation — the memory entry itself is
 * never lost.
 */

const express = require('express');
const router = express.Router();
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus, SIGNAL, SEVERITY } = require('../../core/signalBus');
const { authMiddleware } = require('../../middleware/auth');

// Only these three signals are watched, per the original design directive
// (installSignalHooks() docstring in index.js's initializeDecisionLayer):
// TEMPERATURE_BREACH / RECALL_ISSUED / FRAUD_SUSPECTED. Not every signal
// deserves a case entry — see core/effectors.js's header on why most of the
// platform's modules are deliberately left unwired; the same "would this be
// signal or noise" judgement applies here.
const WATCHED_SIGNALS = [SIGNAL.TEMPERATURE_BREACH, SIGNAL.RECALL_ISSUED, SIGNAL.FRAUD_SUSPECTED];

const SEVERITY_LABEL = Object.entries(SEVERITY)
  .reduce((acc, [label, value]) => ({ ...acc, [value]: label.toLowerCase() }), {});

/** Same subject-extraction precedence core/effectors.js's REACTIONS use. */
function extractSubject(signal) {
  const p = signal.payload || {};
  return p.shipmentId ?? p.batchId ?? p.lotId ?? p.deviceId ?? p.sensorId
    ?? p.transactionId ?? p.userId ?? p.claimId ?? p.riskCode ?? p.incidentCode ?? null;
}

function categoryFor(signalType) {
  switch (signalType) {
    case SIGNAL.TEMPERATURE_BREACH: return 'cold_chain';
    case SIGNAL.RECALL_ISSUED: return 'recall';
    case SIGNAL.FRAUD_SUSPECTED: return 'fraud';
    default: return 'general';
  }
}

function narrativeFor(signal) {
  const subject = extractSubject(signal);
  const sevLabel = SEVERITY_LABEL[signal.severity] || 'info';
  const from = signal.source ? ` from ${signal.source}` : '';
  switch (signal.type) {
    case SIGNAL.TEMPERATURE_BREACH:
      return `Temperature breach (${sevLabel})${from}${subject ? ` on ${subject}` : ''}.`;
    case SIGNAL.RECALL_ISSUED:
      return `Recall issued (${sevLabel})${from}${subject ? ` for batch ${subject}` : ''}.`;
    case SIGNAL.FRAUD_SUSPECTED:
      return `Fraud suspected (${sevLabel})${from}${subject ? ` involving ${subject}` : ''}.`;
    default:
      return `${signal.type} (${sevLabel})${from}.`;
  }
}

/** Write the case entry the instant the signal fires. Never throws. */
async function recordCase(signal) {
  const pg = getPostgreSQL();
  if (!pg) {
    logger.warn('enterpriseMemoryService: database not initialized, dropping signal-triggered case entry', { type: signal.type });
    return null;
  }
  const subject = extractSubject(signal);
  const category = categoryFor(signal.type);
  const tags = [signal.type, signal.source].filter(Boolean);
  try {
    const res = await pg.query(
      `INSERT INTO enterprise_memory_entries
         (occurred_at, source, category, tags, entity_type, entity_id, what_happened, severity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        signal.timestamp || new Date().toISOString(),
        `signalBus:${signal.type}`,
        category,
        tags,
        subject ? category : null,
        subject,
        narrativeFor(signal),
        SEVERITY_LABEL[signal.severity] || null
      ]
    );
    return res.rows[0].id;
  } catch (error) {
    logger.error('enterpriseMemoryService: failed to record signal-triggered case', { error: error.message, type: signal.type });
    return null;
  }
}

/** Best-effort: point the entry at the ai_outcomes row the effector wrote for the same signal. */
async function linkToOutcome(entryId, signal) {
  const pg = getPostgreSQL();
  if (!pg || !entryId) return;
  try {
    const subject = extractSubject(signal);
    const res = await pg.query(
      `SELECT id FROM ai_outcomes
        WHERE signal_type = $1
          AND ($2::text IS NULL OR subject_id = $2)
          AND reacted_at >= $3::timestamp - interval '30 seconds'
        ORDER BY reacted_at DESC
        LIMIT 1`,
      [signal.type, subject, signal.timestamp || new Date().toISOString()]
    );
    if (res.rows[0]) {
      await pg.query(
        `UPDATE enterprise_memory_entries SET source_outcome_id = $1 WHERE id = $2`,
        [res.rows[0].id, entryId]
      );
    }
  } catch (error) {
    // Losing the link is an acceptable degradation — see module header.
    logger.warn('enterpriseMemoryService: best-effort outcome link failed', { error: error.message, entryId });
  }
}

/**
 * Subscribe to the decision layer's signal bus. Called once from
 * index.js's initializeDecisionLayer(). Idempotent-ish in practice because
 * index.js only calls it once at boot; repeated calls would double-subscribe
 * (same caveat core/effectors.js documents for registerEffectors()).
 */
function installSignalHooks() {
  WATCHED_SIGNALS.forEach((type) => {
    signalBus.onSignal(type, async (signal) => {
      const entryId = await recordCase(signal);
      if (entryId) {
        // Give the effector's outcomeSink insert (core/outcomeSink.js) a
        // window to land before attempting the link. See module header.
        const timer = setTimeout(() => {
          linkToOutcome(entryId, signal).catch(() => { /* already logged inside */ });
        }, 1500);
        if (typeof timer.unref === 'function') timer.unref();
      }
    });
  });
  logger.info('enterpriseMemoryService: signal hooks installed', { watching: WATCHED_SIGNALS });
}

/**
 * Full-text search. The to_tsvector expression MUST match the expression in
 * migration 9997's idx_enterprise_memory_fts index exactly (see that
 * migration's comment) or Postgres will not use the index.
 */
async function recallSimilar(queryText, { limit = 20 } = {}) {
  const pg = getPostgreSQL();
  if (!pg) return [];
  if (!queryText || !queryText.trim()) return [];
  const res = await pg.query(
    `SELECT e.*, o.action AS outcome_action, o.outcome_status, o.outcome_notes,
            p.predicted_label, p.actual_label
       FROM enterprise_memory_entries e
       LEFT JOIN ai_outcomes o ON o.id = e.source_outcome_id
       LEFT JOIN ai_prediction_log p ON p.id = e.source_prediction_id
      WHERE to_tsvector('english',
              e.what_happened || ' ' || COALESCE(e.resolution, '') || ' ' ||
              COALESCE(array_to_string(e.tags, ' '), '')
            ) @@ plainto_tsquery('english', $1)
      ORDER BY e.occurred_at DESC
      LIMIT $2`,
    [queryText, limit]
  );
  return res.rows;
}

/** What happened before, for this exact entity. */
async function recallByEntity(entityType, entityId, { limit = 20 } = {}) {
  const pg = getPostgreSQL();
  if (!pg) return [];
  const res = await pg.query(
    `SELECT e.*, o.action AS outcome_action, o.outcome_status, o.outcome_notes,
            p.predicted_label, p.actual_label
       FROM enterprise_memory_entries e
       LEFT JOIN ai_outcomes o ON o.id = e.source_outcome_id
       LEFT JOIN ai_prediction_log p ON p.id = e.source_prediction_id
      WHERE e.entity_type = $1 AND e.entity_id = $2
      ORDER BY e.occurred_at DESC
      LIMIT $3`,
    [entityType, entityId, limit]
  );
  return res.rows;
}

async function listRecent({ category = null, limit = 50 } = {}) {
  const pg = getPostgreSQL();
  if (!pg) return [];
  const res = category
    ? await pg.query(
      `SELECT * FROM enterprise_memory_entries WHERE category = $1 ORDER BY occurred_at DESC LIMIT $2`,
      [category, limit]
    )
    : await pg.query(
      `SELECT * FROM enterprise_memory_entries ORDER BY occurred_at DESC LIMIT $1`,
      [limit]
    );
  return res.rows;
}

/** A human recording a case manually — no signal required. */
async function recordManualNote({ category, whatHappened, resolution, severity, entityType, entityId, tags = [], recordedBy }) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  if (!whatHappened || !whatHappened.trim()) throw new Error('what_happened is required');
  const res = await pg.query(
    `INSERT INTO enterprise_memory_entries
       (source, category, tags, entity_type, entity_id, what_happened, resolution, severity)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      `manual:${recordedBy || 'ops-team'}`,
      category || 'manual_note',
      tags,
      entityType || null,
      entityId || null,
      whatHappened,
      resolution || null,
      severity || null
    ]
  );
  return res.rows[0];
}

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const data = await listRecent({ category: req.query.category || null, limit });
    res.json({ success: true, data });
  } catch (error) {
    logger.error('enterpriseMemoryService: list failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    const data = await recallSimilar(q, { limit: Math.min(Number(req.query.limit) || 20, 100) });
    res.json({ success: true, query: q, data });
  } catch (error) {
    logger.error('enterpriseMemoryService: search failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/entity/:type/:id', async (req, res) => {
  try {
    const data = await recallByEntity(req.params.type, req.params.id, {
      limit: Math.min(Number(req.query.limit) || 20, 100)
    });
    res.json({ success: true, data });
  } catch (error) {
    logger.error('enterpriseMemoryService: entity recall failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const entry = await recordManualNote({ ...req.body, recordedBy: req.user?.email || req.user?.id });
    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    logger.error('enterpriseMemoryService: manual note failed', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = {
  router,
  installSignalHooks,
  recordCase,
  linkToOutcome,
  recallSimilar,
  recallByEntity,
  listRecent,
  recordManualNote
};
