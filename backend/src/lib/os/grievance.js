'use strict';
/** Digital grievance spine. Village cases from exceptions. No fake government close.
 * Ported from pine-shadow src/lib/os/grievance.ts */

function stageOf(g) {
  if (g.severity === 'block') return 'evidence';
  if (g.severity === 'defer') return 'ack';
  return 'complaint';
}

function grievancesFrom(gates) {
  return gates.filter((g) => g.code !== 'G9').map((g) => ({ id: `gv-${g.code}`, subject: g.title, stage: stageOf(g), source: g.code, href: g.href, inventsRupee: false }));
}

const GRIEVANCE_FLOW = ['complaint', 'ack', 'evidence', 'decision', 'escalation', 'appeal', 'closure'];

function canClose(c) {
  return c.stage === 'decision' || c.stage === 'closure';
}

module.exports = { grievancesFrom, GRIEVANCE_FLOW, canClose };
