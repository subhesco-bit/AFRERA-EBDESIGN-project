'use strict';
const assert = require('node:assert/strict');
const { CONCEPTS } = require('../lattice/concepts');
const { AI_SYSTEMS } = require('./catalog');
const { filterSystems, systemStats } = require('./index');

describe('AI systems as modules', () => {
  it('ids are unique and organs exist on the lattice', () => {
    const ids = AI_SYSTEMS.map((s) => s.id);
    assert.equal(ids.length, new Set(ids).size);
    assert.ok(AI_SYSTEMS.length >= 20, `expected a rack, got ${AI_SYSTEMS.length}`);
    const known = new Set(CONCEPTS.map((c) => c.id));
    for (const s of AI_SYSTEMS) {
      assert.ok(s.organs.length >= 1, s.id);
      for (const organId of s.organs) {
        assert.ok(known.has(organId), `${s.id} plugs unknown ${organId}`);
      }
    }
  });

  it('none of the systems is a living plug', () => {
    const stats = systemStats();
    assert.equal(stats.livingPlugs, 0);
    assert.ok(stats.wiredButSkeleton >= 10, `wired-but-skeleton ${stats.wiredButSkeleton}`);
    assert.ok(stats.stubs >= 8, `stubs ${stats.stubs}`);
    assert.ok(stats.duplicates >= 1);
    assert.equal(stats.moduleDirs, 544);
  });

  it('agentic companion is a WIRED skeleton with no live callers', () => {
    const agentic = AI_SYSTEMS.find((s) => s.id === 'agentic');
    assert.ok(agentic);
    assert.equal(agentic?.declared, 'WIRED');
    assert.equal(agentic?.actual, 'skeleton');
    assert.equal(agentic?.isComplete, false);
    assert.equal(agentic?.liveCallers, 0);
    assert.ok((agentic?.bytesCanonical ?? 0) < 2000);
    assert.ok((agentic?.bytesLegacy ?? 0) > 20000);
    assert.ok(agentic?.organs.includes('farmer'));
    assert.ok(agentic?.organs.includes('lot'));
  });

  it('filters by family without dropping the agentic module', () => {
    const agents = filterSystems({ family: 'agent', actual: 'all', query: '' });
    assert.ok(agents.some((s) => s.id === 'agentic'));
    const hits = filterSystems({ family: 'all', actual: 'all', query: 'WIRED skeleton' });
    assert.ok(hits.length >= 1);
  });
});
