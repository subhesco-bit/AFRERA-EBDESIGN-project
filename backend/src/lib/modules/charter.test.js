'use strict';
const assert = require('node:assert/strict');
const { AI_SYSTEMS } = require('../systems/catalog');
const { CONCEPTS } = require('../lattice/concepts');
const { CRITERIA, DECISION_LAWS, composeCharter, coordinationHops, moduleCharter } = require('./charter');

describe('module charter', () => {
  it('scores every named AI against all 18 criteria', () => {
    const snap = composeCharter();
    assert.equal(CRITERIA.length, 18);
    assert.equal(DECISION_LAWS.length, 12);
    assert.equal(snap.modules.length, AI_SYSTEMS.length);
    assert.equal(snap.concepts.length, CONCEPTS.length);
    for (const m of snap.modules) {
      assert.equal(m.checks.length, 18, `${m.id} missing criteria`);
      assert.equal(m.living + m.partial + m.missing, 18);
    }
  });

  it('never allows an AI rupee write and never claims GitHub is complete', () => {
    const snap = composeCharter();
    for (const m of snap.modules) {
      const boundary = m.checks.find((c) => c.id === 'boundary');
      assert.equal(boundary?.status, 'living', `${m.id} must not write rupees`);
      const impl = m.checks.find((c) => c.id === 'implement');
      assert.notEqual(impl?.status, 'living', `${m.id} GitHub is not a living implementation`);
    }
  });

  it('plugs every module into at least one workflow with coordination hops', () => {
    const hops = coordinationHops();
    assert.ok(hops.length >= 20);
    const snap = composeCharter();
    for (const m of snap.modules) {
      assert.ok(m.workflows.length >= 1, `${m.id} has no workflow`);
      const wf = m.checks.find((c) => c.id === 'workflow');
      assert.equal(wf?.status, 'living');
    }
    const agentic = moduleCharter(AI_SYSTEMS.find((s) => s.id === 'agentic'));
    assert.ok(agentic.peers.includes('copilot') || agentic.peers.includes('coordinator'));
    assert.ok(agentic.living >= 8);
  });

  it('names isolated concepts instead of pretending the lattice is whole', () => {
    const snap = composeCharter();
    assert.ok(snap.isolated >= 0);
    assert.ok(snap.lattice.integrity < 100);
    assert.ok(snap.hops.every((h) => h.from && h.to && h.workflowId));
  });
});
