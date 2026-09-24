/**
 * Shared 10x Domain Operating System helpers
 * confidence · safety_floor · erp_hooks · panel · metrics · sessions
 */

'use strict';

const { randomUUID } = require('crypto');

function makeMetrics() {
  return {
    requestsProcessed: 0,
    successCount: 0,
    errorCount: 0,
    panelRuns: 0,
    outcomesLogged: 0,
  };
}

function envelope({ moduleId, capability, result, sessionId, safety_floor }) {
  return {
    success: true,
    moduleId,
    capability,
    sessionId: sessionId || null,
    result,
    meta: {
      confidence: result?.confidence ?? null,
      safety_floor: safety_floor || result?.safety_floor || 'advisory_operate',
      timestamp: new Date().toISOString(),
      standard: 'AFRERA_ENTERPRISE_10X',
    },
  };
}

function rankPanel(lenses, contextKeys = []) {
  return lenses
    .map((l) => {
      let relevance = 0.35;
      for (const k of contextKeys) {
        if ((l.tags || []).some((t) => String(k).toLowerCase().includes(t))) relevance += 0.15;
      }
      return { ...l, relevance: Math.min(1, relevance) };
    })
    .sort((a, b) => b.relevance - a.relevance);
}

function buildPanelOpinions(ranked, context = {}) {
  return ranked.slice(0, 6).map((l) => ({
    lens_id: l.id,
    lens_name: l.name,
    relevance: Math.round(l.relevance * 100) / 100,
    opinion: typeof l.opinion === 'function' ? l.opinion(context) : l.opinion || l.focus,
    safety_note: l.safety_note || 'Advisory — domain authority retains decision rights.',
  }));
}

function newSession(map, payload) {
  const id = randomUUID();
  map.set(id, { last: payload, history: [payload], created: Date.now() });
  return id;
}

module.exports = {
  makeMetrics,
  envelope,
  rankPanel,
  buildPanelOpinions,
  newSession,
};
