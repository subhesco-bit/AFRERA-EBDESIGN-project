'use strict';
const assert = require('node:assert/strict');
const { CONCEPTS } = require('../lattice/concepts');
const { AI_SYSTEMS, systemsForOrgan } = require('../systems/index');
const { libraryCatalog } = require('./catalog');
const { bindingCount, cardsForOrgan, queryLibraryKnowledge } = require('./match');
const { composeLibraryReading, diagnose } = require('./diagnose');
const { CANONICAL_QUERIES, CANONICAL_QUERY_COUNT, answerCanonicalQueries, missingCanonicalQueries } = require('./queries');

describe('AI-integrated library', () => {
  it('indexes doctrine, organs, repairs, and contracts', () => {
    const cards = libraryCatalog();
    const kinds = new Set(cards.map((c) => c.kind));
    assert.ok(cards.length >= 50, `expected a working catalog, got ${cards.length}`);
    assert.ok(kinds.has('doctrine'));
    assert.ok(kinds.has('organ'));
    assert.ok(kinds.has('repair'));
    assert.ok(kinds.has('contract'));
    assert.ok(kinds.has('principle'));
  });

  it('queryLibraryKnowledge returns ranked memory without an LLM', () => {
    const hits = queryLibraryKnowledge('harvest lot mint chakhao');
    assert.ok(hits.length >= 3, 'library should recall harvest/lot cards');
    assert.ok(hits[0].relevance >= hits[hits.length - 1].relevance);
    assert.ok(hits.some((h) => h.organs.includes('lot') || h.signal?.includes('lot')));
  });

  it('binds every organ to at least one card', () => {
    for (const c of CONCEPTS) {
      const bound = cardsForOrgan(c.id);
      assert.ok(bound.length > 0, `${c.id} has no library memory`);
    }
    assert.ok(bindingCount() > CONCEPTS.length);
  });

  it('auto diagnosis fires from the catalog alone', () => {
    const d = diagnose();
    assert.equal(d.unboundCards, 0);
    assert.ok(d.cards > 0);
    assert.ok(d.bindings > 0);
    assert.ok(d.missingLigaments > 0, 'the GitHub body is still unintegrated');
    assert.match(d.verdict, /Auto-operation can fire/);
    assert.ok(d.priority.length >= 1, 'lifetime energy, live IoT, household baskets still stall');
    assert.equal(d.reflexesAnswered, CANONICAL_QUERY_COUNT);
    assert.equal(d.reflexesMissing, 0);
  });

  it('answers all named reflex queries without an LLM', () => {
    const answers = answerCanonicalQueries();
    assert.equal(answers.length, CANONICAL_QUERY_COUNT);
    const missing = missingCanonicalQueries(answers);
    assert.equal(missing.length, 0, `missing queries: ${missing.map((m) => m.id).join(', ')}`);
    assert.equal(diagnose().reflexesMissing, 0);
  });
});

describe('library auto-op integrates with the systems rack', () => {
  it('every reflex organ exists on the lattice', () => {
    const known = new Set(CONCEPTS.map((c) => c.id));
    for (const q of CANONICAL_QUERIES) {
      assert.ok(known.has(q.organId), `${q.id} names unknown organ ${q.organId}`);
    }
    assert.equal(CANONICAL_QUERY_COUNT, 22);
  });

  it('q16 agentic reflex hits the skeleton card the systems rack names', () => {
    const q16 = CANONICAL_QUERIES.find((q) => q.id === 'q16');
    assert.ok(q16);
    const hits = queryLibraryKnowledge(q16.query, { organId: 'module', limit: 8 });
    assert.ok(hits.length >= 1, 'q16 must recall module/agentic memory');
    assert.ok(
      hits.some((h) => h.id === 'lib-agentic-skeleton' || h.id === 'lib-module-synapse' || h.id === 'lib-wired-lie'),
      `q16 hits: ${hits.map((h) => h.id).join(', ')}`,
    );
    const agentic = AI_SYSTEMS.find((s) => s.id === 'agentic');
    assert.ok(agentic);
    assert.equal(agentic?.actual, 'skeleton');
    assert.equal(agentic?.liveCallers, 0);
    assert.ok(agentic?.organs.includes('lot'));
    assert.ok(agentic?.organs.includes('farmer'));
  });

  it('q17 recalls the module OS spinal cord', () => {
    const q17 = CANONICAL_QUERIES.find((q) => q.id === 'q17');
    assert.ok(q17);
    const hits = queryLibraryKnowledge(q17.query, { organId: 'module', limit: 8 });
    assert.ok(hits.some((h) => h.id === 'lib-module-os'), hits.map((h) => h.id).join(','));
  });

  it('q18 recalls the living companion', () => {
    const q18 = CANONICAL_QUERIES.find((q) => q.id === 'q18');
    assert.ok(q18);
    const hits = queryLibraryKnowledge(q18.query, { organId: 'module', limit: 8 });
    assert.ok(hits.some((h) => h.id === 'lib-agentic-living' || h.id === 'lib-module-os'), hits.map((h) => h.id).join(','));
  });

  it('q19 recalls the token economy', () => {
    const q19 = CANONICAL_QUERIES.find((q) => q.id === 'q19');
    assert.ok(q19);
    const hits = queryLibraryKnowledge(q19.query, { organId: 'ai', limit: 8 });
    assert.ok(hits.some((h) => h.id === 'lib-token-economy'), hits.map((h) => h.id).join(','));
  });

  it('every AI system organ has library memory', () => {
    for (const s of AI_SYSTEMS) {
      for (const organId of s.organs) {
        const bound = cardsForOrgan(organId);
        assert.ok(bound.length > 0, `${s.id} organ ${organId} has no library card`);
      }
    }
  });

  it('lot organ is a socket for both harvest memory and unplugged systems', () => {
    const lotCards = cardsForOrgan('lot');
    assert.ok(lotCards.some((c) => c.id === 'lib-lot-body' || c.signal?.includes('lot.mint')));
    const lotSystems = systemsForOrgan('lot');
    assert.ok(lotSystems.length >= 1, 'at least one AI system claims the lot socket');
    assert.ok(lotSystems.every((s) => s.isComplete === false));
  });

  it('coordinator still names queryLibraryKnowledge, and the catalog answers it', () => {
    const coordinator = AI_SYSTEMS.find((s) => s.id === 'coordinator');
    assert.ok(coordinator);
    assert.match(coordinator.silo, /queryLibraryKnowledge/);
    const hits = queryLibraryKnowledge('queryLibraryKnowledge auto-operation library boot', { limit: 6 });
    assert.ok(hits.length >= 1);
    const reading = composeLibraryReading('auto-operation library boot', hits, diagnose());
    assert.match(reading, /Auto-operation can fire/);
    assert.match(reading, /Memory used/);
  });
});
