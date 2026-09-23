'use strict';
/** Real port of pine-shadow src/lib/lattice/index.ts. Replaces the earlier
 * fabricated latticeEngine.js (generic "concept nodes / path finding" graph
 * engine), which did not reflect pine-shadow's actual 32-concept / 33+-bridge
 * organism map of THIS codebase's real and missing integrations. */

const { CONCEPTS } = require('./concepts');
const { BRIDGES } = require('./bridges');
const { WALK, WALK_TITLE, WALK_LEDE } = require('./walk');

const CONCEPT_BY_ID = Object.fromEntries(CONCEPTS.map((c) => [c.id, c]));
const BRIDGE_BY_ID = Object.fromEntries(BRIDGES.map((b) => [b.id, b]));

function conceptRole(c) {
  return c.role ?? 'organ';
}

function bridgesFor(conceptId) {
  return BRIDGES.filter((b) => b.from === conceptId || b.to === conceptId);
}

function conceptStatusVariant(status) {
  if (status === 'living') return 'live';
  if (status === 'partial') return 'partial';
  return 'gap';
}

function bridgeStatusVariant(status) {
  if (status === 'living') return 'live';
  if (status === 'partial') return 'partial';
  return 'gap';
}

function degreeMap() {
  const deg = {};
  for (const c of CONCEPTS) deg[c.id] = 0;
  for (const b of BRIDGES) {
    if (deg[b.from] !== undefined) deg[b.from] += 1;
    if (deg[b.to] !== undefined) deg[b.to] += 1;
  }
  return deg;
}

function livingDegreeMap() {
  const deg = {};
  for (const c of CONCEPTS) deg[c.id] = 0;
  for (const b of BRIDGES) {
    if (b.status === 'missing') continue;
    if (deg[b.from] !== undefined) deg[b.from] += 1;
    if (deg[b.to] !== undefined) deg[b.to] += 1;
  }
  return deg;
}

function isolatedConcepts() {
  const deg = livingDegreeMap();
  return CONCEPTS.filter((c) => (deg[c.id] ?? 0) === 0);
}

function weakConcepts() {
  const deg = livingDegreeMap();
  return CONCEPTS.filter((c) => (deg[c.id] ?? 0) > 0 && (deg[c.id] ?? 0) <= 2);
}

function latticeStats() {
  const missingOrgans = CONCEPTS.filter((c) => c.status === 'missing').length;
  const living = BRIDGES.filter((b) => b.status === 'living').length;
  const partial = BRIDGES.filter((b) => b.status === 'partial').length;
  const missing = BRIDGES.filter((b) => b.status === 'missing').length;
  const weighted = living * 1 + partial * 0.45;
  const integrity = BRIDGES.length ? Math.round((weighted / BRIDGES.length) * 100) : 0;
  const liveDeg = livingDegreeMap();
  const isolated = CONCEPTS.filter((c) => (liveDeg[c.id] ?? 0) === 0).length;
  const weak = CONCEPTS.filter((c) => {
    const d = liveDeg[c.id] ?? 0;
    return d > 0 && d <= 2;
  }).length;
  return {
    organs: CONCEPTS.filter((c) => conceptRole(c) === 'organ').length,
    bridgeConcepts: CONCEPTS.filter((c) => conceptRole(c) === 'bridge').length,
    missingOrgans, bridges: BRIDGES.length, living, partial, missing,
    technical: BRIDGES.filter((b) => b.kind === 'technical').length,
    thoughtful: BRIDGES.filter((b) => b.kind === 'thoughtful').length,
    integrity, isolated, weak,
  };
}

function filterBridges(opts) {
  const q = opts.query.trim().toLowerCase();
  return BRIDGES.filter((b) => {
    if (opts.status !== 'all' && b.status !== opts.status) return false;
    if (opts.kind !== 'all' && b.kind !== opts.kind) return false;
    if (opts.conceptId && b.from !== opts.conceptId && b.to !== opts.conceptId) return false;
    if (!q) return true;
    const from = CONCEPT_BY_ID[b.from];
    const to = CONCEPT_BY_ID[b.to];
    const hay = `${b.name} ${b.signal} ${b.thought} ${b.contract} ${from?.name ?? ''} ${to?.name ?? ''}`.toLowerCase();
    return hay.includes(q);
  });
}

const LIGAMENT_STATUS_ORDER = ['living', 'missing', 'partial', 'all'];

function groupBridges(rows) {
  const order = ['living', 'missing', 'partial'];
  return order.map((status) => ({ status, rows: rows.filter((b) => b.status === status) })).filter((g) => g.rows.length > 0);
}

const VIEWBOX = { w: 1000, h: 640 };

function bindTargets(c) {
  return (c.binds ?? []).map((id) => CONCEPT_BY_ID[id]).filter(Boolean);
}

module.exports = {
  CONCEPTS, BRIDGES, WALK, WALK_TITLE, WALK_LEDE, CONCEPT_BY_ID, BRIDGE_BY_ID,
  conceptRole, bridgesFor, conceptStatusVariant, bridgeStatusVariant, degreeMap,
  livingDegreeMap, isolatedConcepts, weakConcepts, latticeStats, filterBridges,
  LIGAMENT_STATUS_ORDER, groupBridges, VIEWBOX, bindTargets,
};
