/**
 * Enterprise Memory Service
 *
 * AFRERA_CLAUDE_BUILD_DIRECTIVE.md §2.3 ("Brain System") names this the
 * "Hippocampus — enterprise memory, knowledge graph, case library, lessons
 * learned." The 2026-08-08 AI-orchestration audit found no implementation of
 * it anywhere in backend/src, and core/aiOrchestrator.js's `enterprise_memory`
 * capability returned an honest `{ok:false, status:'missing'}` as a result.
 * This file, plus migration 9997_enterprise_memory_schema.sql, is that
 * implementation.
 *
 * WHAT THIS IS: a retrievable case/episode log — "what happened before, and
 * what did we learn from it" — searchable by real Postgres full-text search
 * (to_tsvector/to_tsquery), the same pattern services/knowledgeGraphService.js
 * (searchKnowledgeNodes) and services/nutritionIntelligenceService.js
 * (searchFoodProfiles) already use. No embedding model is configured
 * anywhere in this codebase, so this is deliberately keyword search, not a
 * vector/semantic store.
 *
 * WHAT THIS IS NOT: a second copy of ai_outcomes / ai_prediction_log
 * (migration 990_ai_outcomes.sql). Those tables are the system of record for
 * effector reactions and scored predictions, with a real calibration loop on
 * top (core/outcomeResolver.js). enterprise_memory_entries holds only what
 * those tables cannot — free-text case narratives — and points AT the
 * originating ai_outcomes/ai_prediction_log row via a nullable FK rather than
 * copying its columns. recallSimilar()/recallByEntity() LEFT JOIN both tables
 * at query time, so a caller gets full case context (what was done, whether
 * it helped) without a second source of truth. See the migration file header
 * for the full reasoning.
 *
 * SIGNAL WIRING: subscribes directly to core/signalBus.js (read-only usage —
 * this file does not modify signalBus.js, effectors.js or outcomeSink.js) for
 * TEMPERATURE_BREACH, RECALL_ISSUED and FRAUD_SUSPECTED, the same three
 * signals core/effectors.js already reacts to (coldchain.breach_response,
 * recall.notification, fraud.hold_review). A memory entry is written the
 * moment the signal fires, then a BEST-EFFORT attempt links it to the
 * ai_outcomes row the matching effector will (almost certainly) have written
 * for the same signal. This is deliberately NOT a database transaction:
 * effectors.js persists via outcomeSink asynchronously and signalBus does not
 * await subscribers in order (signalBus.js _safeEmit fires every listener and
 * only .catch()es the promise — see its own comments), so there is a genuine
 * race between this module's handler and effectors.js's. Holding a DB
 * transaction open across a wait for that race to resolve would be exactly
 * the anti-pattern core/withTransaction.js's own header warns against
 * ("holds row locks across... whatever else the function happens to do").
 * So this is two independent, individually-parameterized statements, not one
 * atomic write — and the link is allowed to stay NULL if it loses the race,
 * which is honestly reported rather than silently guessed.
 */

'use strict';

const express = require('express');
const { logger } = require('..\/utils\/logger');
const { authMiddleware } = require('..\/middleware\/auth');
const pool = require('..\/database\/pool');
const { signalBus, SIGNAL, SEVERITY } = require('..\/core\/signalBus');

const router = express.Router();

const SEVERITY_LABELS = Object.fromEntries(Object.entries(SEVERITY).map(([k, v]) => [v, k]));
function severityLabel(v) {
  return v == null ? null : (SEVERITY_LABELS[v] || null);
}

// ============================================================================
// WRITE
// ============================================================================

/**
 * Record one case/event. This is the only write path — signal-triggered
 * auto-recording (below) calls the exact same function a human or another
 * service would call via POST /entries.
 */
async function recordMemory(entry = {}) {
  const {
    occurredAt = null,
    source,
    category,
    tags = [],
    entityType = null,
    entityId = null,
    whatHappened,
    resolution = null,
    severity = null,
    sourcePredictionId = null,
    sourceOutcomeId = null,
  } = entry;

  if (!source || !String(source).trim()) throw new Error('recordMemory requires entry.source');
  if (!category || !String(category).trim()) throw new Error('recordMemory requires entry.category');
  if (!whatHappened || !String(whatHappened).trim()) {
    throw new Error('recordMemory requires entry.whatHappened');
  }
  if (!Array.isArray(tags)) throw new Error('recordMemory: entry.tags must be an array');

  try {
    const { rows } = await pool.query(
      `INSERT INTO enterprise_memory_entries
         (occurred_at, source, category, tags, entity_type, entity_id,
          what_happened, resolution, severity, source_prediction_id, source_outcome_id)
       VALUES (COALESCE($1, CURRENT_TIMESTAMP), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        occurredAt,
        String(source),
        String(category),
        tags.map(String),
        entityType == null ? null : String(entityType),
        entityId == null ? null : String(entityId),
        String(whatHappened),
        resolution == null ? null : String(resolution),
        severity == null ? null : String(severity),
        sourcePredictionId == null ? null : Number(sourcePredictionId),
        sourceOutcomeId == null ? null : Number(sourceOutcomeId),
      ]
    );
    return rows[0];
  } catch (error) {
    logger.error('enterpriseMemoryService:record_failed', { error: error.message, source, category });
    throw error;
  }
}

/**
 * Best-effort backfill of source_outcome_id after a signal-triggered write.
 * See the module header for why this is two statements, not a transaction.
 */
async function linkOutcome(memoryId, signalType, subjectId, sinceIso) {
  const { rows } = await pool.query(
    `SELECT id FROM ai_outcomes
      WHERE signal_type = $1 AND subject_id = $2 AND reacted_at >= $3
      ORDER BY reacted_at ASC LIMIT 1`,
    [signalType, subjectId, sinceIso]
  );
  if (!rows.length) return null;

  await pool.query(
    `UPDATE enterprise_memory_entries
        SET source_outcome_id = $2
      WHERE id = $1 AND source_outcome_id IS NULL`,
    [memoryId, rows[0].id]
  );
  return rows[0].id;
}

// ============================================================================
// SIGNAL WIRING — see module header for the full design rationale.
// ============================================================================

/**
 * One rule per signal this service remembers. Subject-extraction mirrors
 * core/effectors.js's REACTIONS handlers exactly (cited per-rule below) so the
 * memory's entity_id matches the ai_outcomes.subject_id the effector records,
 * which is what makes the best-effort linkOutcome() lookup above able to match.
 */
const SIGNAL_MEMORY_RULES = {
  [SIGNAL.TEMPERATURE_BREACH]: {
    category: 'cold_chain',
    entityType: () => 'shipment_or_lot',
    // Mirrors core/effectors.js REACTIONS['coldchain.breach_response'].handle()
    subject: (p) => p.shipmentId ?? p.batchId ?? p.lotId ?? p.deviceId ?? p.sensorId ?? null,
    describe: (signal, subject) => `Temperature breach reported${subject ? ` on ${subject}` : ''} `
      + `(source: ${signal.source}, severity: ${severityLabel(signal.severity)}).`,
  },
  [SIGNAL.RECALL_ISSUED]: {
    category: 'recall',
    entityType: () => 'batch',
    // Mirrors core/effectors.js REACTIONS['recall.notification'].handle()
    subject: (p) => p.batchId ?? null,
    describe: (signal, subject) => `Recall issued${subject ? ` for batch ${subject}` : ''} `
      + `(source: ${signal.source}).`,
  },
  [SIGNAL.FRAUD_SUSPECTED]: {
    category: 'fraud',
    entityType: (p) => (p.transactionId ? 'transaction' : 'user'),
    // Mirrors core/effectors.js REACTIONS['fraud.hold_review'].handle()
    subject: (p) => p.transactionId ?? p.userId ?? null,
    describe: (signal, subject) => `Fraud suspected${subject ? ` involving ${subject}` : ''} `
      + `(source: ${signal.source}, severity: ${severityLabel(signal.severity)}).`,
  },
};

let hooksInstalled = false;

/**
 * Subscribe to the bus. Called explicitly at boot (see src/index.js, next to
 * registerEffectors()/outcomeSink.install()) rather than on require, so this
 * module stays inert and unit-testable when nothing has opted in — the same
 * discipline core/effectors.js holds itself to with setOutcomeSink().
 * Idempotent, matching core/effectors.js registerEffectors().
 */
function installSignalHooks() {
  if (hooksInstalled) return 0;
  hooksInstalled = true;

  for (const [type, rule] of Object.entries(SIGNAL_MEMORY_RULES)) {
    signalBus.onSignal(type, async (signal) => {
      const payload = signal.payload || {};
      const subject = rule.subject(payload) ?? signal.entityId ?? null;
      const entityType = rule.entityType(payload);

      let entry;
      try {
        entry = await recordMemory({
          occurredAt: signal.timestamp,
          source: `signalBus:${type}`,
          category: rule.category,
          tags: [rule.category, type],
          entityType,
          entityId: subject == null ? null : String(subject),
          whatHappened: rule.describe(signal, subject),
          severity: severityLabel(signal.severity),
        });
      } catch (err) {
        // A subscriber must never break the emitting request path — the same
        // rule core/outcomeSink.js holds itself to. signalBus.js also catches
        // this (see _safeEmit), but logging here keeps the cause local.
        logger.error('enterpriseMemoryService:signal_record_failed', { type, message: err.message });
        return;
      }

      if (subject != null) {
        // Give the matching effector (core/effectors.js -> outcomeSink) a
        // moment to land its ai_outcomes row before looking for it. See
        // module header: this is a best-effort race, not a guarantee.
        setTimeout(() => {
          linkOutcome(entry.id, type, String(subject), signal.timestamp).catch((err) => {
            logger.error('enterpriseMemoryService:link_outcome_failed', {
              memoryId: entry.id, type, message: err.message,
            });
          });
        }, 250);
      }
    });
  }

  logger.info('enterpriseMemoryService: signal hooks installed', { signals: Object.keys(SIGNAL_MEMORY_RULES) });
  return Object.keys(SIGNAL_MEMORY_RULES).length;
}

// ============================================================================
// READ — full-text case retrieval
// ============================================================================

/** Normalises free text into a to_tsquery expression (AND of its terms). */
function toTsQuery(query) {
  return String(query)
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ''))
    .filter(Boolean)
    .join(' & ');
}

// LEFT JOINs, not copies — see module header ("what this is not").
const MEMORY_WITH_CONTEXT_SELECT = `
  SELECT m.*,
         o.action AS outcome_action, o.outcome_status, o.rationale AS outcome_rationale,
         o.outcome_notes AS outcome_notes,
         p.predicted_label, p.actual_label, p.stated_confidence
    FROM enterprise_memory_entries m
    LEFT JOIN ai_outcomes o ON o.id = m.source_outcome_id
    LEFT JOIN ai_prediction_log p ON p.id = m.source_prediction_id
`;

/**
 * Real full-text case retrieval. Matches the to_tsvector/to_tsquery pattern
 * used by services/knowledgeGraphService.js searchKnowledgeNodes() and
 * services/nutritionIntelligenceService.js searchFoodProfiles() — keyword
 * search, not semantic search (no embedding model exists in this codebase).
 */
async function recallSimilar(query, { category = null, limit = 20 } = {}) {
  if (!query || !String(query).trim()) throw new Error('recallSimilar requires a query string');
  const tsq = toTsQuery(query);
  if (!tsq) throw new Error('recallSimilar: query had no searchable terms after normalisation');

  try {
    const params = [tsq];
    let sql = `${MEMORY_WITH_CONTEXT_SELECT}
       WHERE to_tsvector('english',
               m.what_happened || ' ' || COALESCE(m.resolution, '') || ' ' ||
               COALESCE(array_to_string(m.tags, ' '), '')
             ) @@ to_tsquery('english', $1)`;

    if (category) {
      params.push(String(category));
      sql += ` AND m.category = $${params.length}`;
    }
    params.push(Math.min(Number(limit) || 20, 200));
    sql += ` ORDER BY m.occurred_at DESC LIMIT $${params.length}`;

    const { rows } = await pool.query(sql, params);
    return rows;
  } catch (error) {
    logger.error('enterpriseMemoryService:recall_similar_failed', { error: error.message, query });
    throw error;
  }
}

/**
 * What memories exist for a specific entity (farmer, shipment, lot, ...).
 * entityType/entityId follow the same shape core/signalBus.js's `entityId`
 * meta and ai_outcomes' subject_type/subject_id already use.
 */
async function recallByEntity(entityType, entityId, { limit = 50 } = {}) {
  if (!entityType || entityId == null || entityId === '') {
    throw new Error('recallByEntity requires entityType and entityId');
  }
  try {
    const { rows } = await pool.query(
      `${MEMORY_WITH_CONTEXT_SELECT}
        WHERE m.entity_type = $1 AND m.entity_id = $2
        ORDER BY m.occurred_at DESC LIMIT $3`,
      [String(entityType), String(entityId), Math.min(Number(limit) || 50, 200)]
    );
    return rows;
  } catch (error) {
    logger.error('enterpriseMemoryService:recall_by_entity_failed', { error: error.message, entityType, entityId });
    throw error;
  }
}

// ============================================================================
// ROUTES
// ============================================================================

/** Write a memory entry. Auth-gated like knowledgeGraphService's writes. */
router.post('/entries', authMiddleware, async (req, res) => {
  try {
    const result = await recordMemory(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Record enterprise memory API error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
});

/** GET /search?q=...&category=...&limit=... */
router.get('/search', async (req, res) => {
  try {
    const { q, category, limit } = req.query;
    if (!q) return res.status(400).json({ error: 'Query parameter q is required' });
    let result = await recallSimilar(q, {
      category: category || null,
      limit: limit ? Number(limit) : undefined,
    });
    return res.json(result);
  } catch (error) {
    logger.error('Recall similar memory API error', { error: error.message });
    return res.status(500).json({ error: 'Failed to search enterprise memory' });
  }
});

/** GET /entities/:entityType/:entityId */
router.get('/entities/:entityType/:entityId', async (req, res) => {
  try {
    let result = await recallByEntity(req.params.entityType, req.params.entityId);
    res.json(result);
  } catch (error) {
    logger.error('Recall memory by entity API error', { error: error.message });
    res.status(500).json({ error: 'Failed to recall enterprise memory by entity' });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

function isHealthy() {
  return pool.query('SELECT 1').then(() => true).catch(() => false);
}

module.exports = {
  router,
  recordMemory,
  recallSimilar,
  recallByEntity,
  installSignalHooks,
  isHealthy,
};


