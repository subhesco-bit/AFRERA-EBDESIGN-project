'use strict';
/** Ported from pine-shadow src/lib/library/diagnose.ts */

const { CONCEPTS } = require('../lattice/concepts');
const { BRIDGES } = require('../lattice/bridges');
const { WALK } = require('../lattice/walk');
const { bindingCount } = require('./match');
const { answerCanonicalQueries, CANONICAL_QUERY_COUNT } = require('./queries');
const { libraryCatalog } = require('./catalog');

function integrityOf(bridges) {
  if (!bridges.length) return 0;
  const living = bridges.filter((b) => b.status === 'living').length;
  const partial = bridges.filter((b) => b.status === 'partial').length;
  return Math.round(((living + partial * 0.45) / bridges.length) * 100);
}

function liveDegree() {
  const deg = {};
  for (const c of CONCEPTS) deg[c.id] = 0;
  for (const b of BRIDGES) {
    if (b.status === 'missing') continue;
    if (deg[b.from] !== undefined) deg[b.from] += 1;
    if (deg[b.to] !== undefined) deg[b.to] += 1;
  }
  return deg;
}

function diagnose(cards = libraryCatalog()) {
  const livingLigaments = BRIDGES.filter((b) => b.status === 'living').length;
  const partialLigaments = BRIDGES.filter((b) => b.status === 'partial').length;
  const missingLigaments = BRIDGES.filter((b) => b.status === 'missing').length;
  const deg = liveDegree();
  const isolated = CONCEPTS.filter((c) => (deg[c.id] ?? 0) === 0).map((c) => c.id);
  const weak = CONCEPTS.filter((c) => {
    const d = deg[c.id] ?? 0;
    return d > 0 && d <= 2;
  }).map((c) => c.id);
  const bindings = bindingCount(cards);
  const unbound = cards.filter((c) => c.organs.length === 0).length;
  const priority = WALK.filter((h) => {
    if (!h.bridgeId) return true;
    const b = BRIDGES.find((x) => x.id === h.bridgeId);
    return !b || b.status !== 'living';
  }).map((h) => ({ id: h.id, title: h.title, organId: h.organId, signal: h.signal, should: h.should }));

  const answers = answerCanonicalQueries();
  const reflexesAnswered = answers.filter((a) => !a.missing).length;
  const reflexesMissing = CANONICAL_QUERY_COUNT - reflexesAnswered;

  const ready = cards.length > 0 && bindings > 0 && reflexesMissing === 0;
  const verdict = ready
    ? `Library indexed ${cards.length} cards, wrote ${bindings} bindings, and answered ${reflexesAnswered}/${CANONICAL_QUERY_COUNT} reflex queries without a prompt. Auto-operation can fire. The GitHub body still has ${missingLigaments} missing ligaments — the library remembers them.`
    : reflexesMissing > 0
      ? `Library has ${cards.length} cards but ${reflexesMissing} of ${CANONICAL_QUERY_COUNT} reflex queries are missing. Auto-operation cannot claim the nerve is live.`
      : 'Library is empty. Auto-operation cannot fire: there is no memory to consult.';

  return {
    integrity: integrityOf(BRIDGES), missingLigaments, partialLigaments, livingLigaments,
    isolatedOrgans: isolated, weakOrgans: weak, unboundCards: unbound, cards: cards.length, bindings,
    reflexesAnswered, reflexesMissing, priority, verdict,
  };
}

function composeLibraryReading(query, hits, diagnosis) {
  const lines = [];
  lines.push(`Query: ${query.trim() || '(auto)'}`);
  lines.push(diagnosis.verdict);
  if (diagnosis.priority.length) {
    const top = diagnosis.priority.slice(0, 4);
    lines.push('Named repairs the catalog already holds:');
    for (const p of top) lines.push(`- ${p.title} · ${p.signal}`);
  }
  if (hits.length) {
    lines.push('Memory used:');
    for (const h of hits.slice(0, 6)) {
      const signal = h.signal ? ` [${h.signal}]` : '';
      lines.push(`- (${h.kind}) ${h.title}${signal}: ${h.body.slice(0, 220)}`);
    }
  } else {
    lines.push('No catalog card matched. The nerve has nothing to fire.');
  }
  return lines.join('\n');
}

module.exports = { diagnose, composeLibraryReading };
