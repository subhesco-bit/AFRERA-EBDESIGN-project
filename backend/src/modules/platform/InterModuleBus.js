/**
 * Inter-module communication bus
 * Publishes typed events between veterinary, nutrition, agro, pharmacy, legal.
 * In-process for now; swap to Redis/NATS later without API change.
 */

const { randomUUID } = require('crypto');

const subscribers = new Map(); // eventType -> Set<handler>
const eventLog = [];
const MAX_LOG = 500;

function subscribe(eventType, handler) {
  if (!subscribers.has(eventType)) subscribers.set(eventType, new Set());
  subscribers.get(eventType).add(handler);
  return () => subscribers.get(eventType)?.delete(handler);
}

function publish(eventType, payload = {}, meta = {}) {
  const event = {
    event_id: randomUUID(),
    type: eventType,
    payload,
    meta: {
      source_module: meta.source_module || 'unknown',
      correlation_id: meta.correlation_id || randomUUID(),
      at: new Date().toISOString(),
    },
  };
  eventLog.push(event);
  if (eventLog.length > MAX_LOG) eventLog.shift();

  const handlers = subscribers.get(eventType) || new Set();
  const wildcard = subscribers.get('*') || new Set();
  const results = [];
  for (const h of [...handlers, ...wildcard]) {
    try {
      results.push({ ok: true, result: h(event) });
    } catch (e) {
      results.push({ ok: false, error: e.message });
    }
  }
  return { event, delivered: results.length, results };
}

/** Standard event types */
const EVENT_TYPES = {
  VET_NOTIFIABLE: 'veterinary.notifiable_suspect',
  VET_ZOONOTIC: 'veterinary.zoonotic_flag',
  NUTRI_CLINICAL_FLAG: 'nutrition.clinical_flag',
  PHARMACY_MAJOR_INTERACTION: 'pharmacy.major_interaction',
  AGRO_OUTBREAK_CROP: 'agro.disease_cluster',
  AGRO_ORGANIC_CERT: 'agro.organic_cert_decision',
  LEGAL_PCICDA: 'legal.pcicda_report_path',
  UNIFIED_DECISION: 'unified.decision_ready',
  OUTCOME_RECORDED: 'platform.outcome_recorded',
};

/** Derive cross-module notifications from a unified operate result */
function fanOutFromUnified(unified = {}) {
  const published = [];
  const vet = unified.pillars?.veterinary;
  if (vet?.panel?.notifiable_suspect) {
    published.push(
      publish(EVENT_TYPES.VET_NOTIFIABLE, { panel: vet.panel?.panel_summary }, { source_module: 'veterinary' }),
    );
    published.push(
      publish(EVENT_TYPES.LEGAL_PCICDA, { path: 'S2_REPORT' }, { source_module: 'legal' }),
    );
  }
  if (vet?.panel?.differentials?.some((d) => (d.tags || []).includes('zoonotic_risk'))) {
    published.push(
      publish(
        EVENT_TYPES.VET_ZOONOTIC,
        { message: 'Farm family hygiene and medical awareness' },
        { source_module: 'veterinary' },
      ),
    );
  }
  published.push(
    publish(EVENT_TYPES.UNIFIED_DECISION, { continuum: unified.continuum }, { source_module: 'unified' }),
  );
  return published;
}

function recentEvents(limit = 50) {
  return eventLog.slice(-limit);
}

module.exports = {
  subscribe,
  publish,
  fanOutFromUnified,
  recentEvents,
  EVENT_TYPES,
};
