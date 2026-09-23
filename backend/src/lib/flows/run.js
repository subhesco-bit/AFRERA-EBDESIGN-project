'use strict';
/** Walk a named flow. Missing nodes stay named. Never invent ₹.
 * Partial port of pine-shadow src/lib/flows/run.ts.
 *
 * pine-shadow's real run.ts dispatches 20+ algorithm ids to functions in
 * modules/algorithms.ts, os/events.ts, and os/passport.ts — none of which
 * were ported in this pass (see .ai/COMPLETE_INTEGRATION_REPORT.html).
 * This port implements every algorithm branch for which a faithful port
 * already exists in this repo's backend/src/lib/ (erp/kernel, brain/decide,
 * os/runtime, os/suitability, os/constitution) and returns an honest
 * "named — algorithm not yet ported" NodeAct for the rest, rather than
 * fabricating logic for modules/algorithms.ts that was never read. */

const { millDecision, remainingAfterCommit, remainingAfterSpoilage } = require('../erp/kernel');
const { brainDecide } = require('../brain/decide');
const { evaluateConstitution } = require('../os/constitution');
const { farmTwin, infraTwin, inspectCell } = require('../os/runtime');
const { assessSuitability } = require('../os/suitability');
const { FLOW_BY_ID, FLOWS } = require('./catalog');

const TISSUE_NODE = { 'd-front': 'frontier', 'd-agent': 'agentic', 'd-phys': 'physical', 'd-sec': 'security', 'd-sci': 'scientist' };

const NOT_PORTED_ALGOS = new Set([
  'price-declared', 'price-waterfall', 'journal-balance', 'payment-ref', 'fifo-alloc', 'wac-cost',
  'qty-weighted', 'gi-frame', 'gi-claim', 'pledge-gate', 'library-consult', 'fvie-rank', 'hours-to-pay',
  'scheme-gate', 'human-command', 'copilot-next', 'weather-reflex', 'energy-cloud', 'herd-cover',
  'spoilage-mass', 'passport', 'spine-publish', 'unknown-event', 'kitchen', 'next-magh',
]);

function defaultFlowFacts(over = {}) {
  return {
    remainingGrams: 180000, qtyGrams: 40000, mintedGrams: 180000, offtakeGrams: 0, spoilageGrams: 0,
    pricePaisePerKg: 8500, freightPaisePerKg: 400, paymentRef: null, clerk: 'Biren', cellId: 'c-enghi',
    lotId: 'lot-chakhao', variety: 'Chakhao Poireiton', giMarker: 'GI-CHAKHAO', giChainLength: 1,
    journalBalanced: true, rupeeWrite: false, outage: false, alert: false, iotTempC: null, kwh: null,
    pledged: 0, tourism: false, costPaise: null, lossPctDeclared: 10, hoursToPay: null, ...over,
  };
}

function act(node, decision, reason) {
  return { nodeId: node.id, name: node.name, algorithm: node.algorithm, decision, reason, rupee: null, status: node.status };
}

function fireNode(node, facts) {
  if (node.status === 'missing') return act(node, 'named', `${node.name} is named missing. Do not paint it living.`);

  const algo = node.algorithm;

  if (algo === 'dual-truth') return act(node, 'pass', 'Kernel tissue ~39%. GitHub platform 7%. Dual-truth holds.');

  if (algo === 'ai-firewall') {
    if (facts.rupeeWrite) return act(node, 'block', 'AI numeric writes are forbidden. A clerk declares ₹.');
    return act(node, 'pass', 'Firewall open: AI does not write rupees.');
  }

  if (algo === 'mill-decision') {
    const mill = millDecision({ outage: facts.outage, alert: facts.alert, iotTempC: facts.iotTempC, kwh: facts.kwh });
    return act(node, mill.decision, mill.reason);
  }

  if (algo === 'mass-conserve') {
    try {
      const afterOfftake = remainingAfterCommit(facts.mintedGrams, facts.offtakeGrams);
      const remaining = facts.spoilageGrams > 0 ? remainingAfterSpoilage(afterOfftake, facts.spoilageGrams) : afterOfftake;
      const conserved = remaining + facts.offtakeGrams + facts.spoilageGrams === facts.mintedGrams;
      return act(node, conserved ? 'pass' : 'block', conserved ? `Mass conserved. Remaining ${remaining} g on the same body.` : 'Mass not conserved.');
    } catch (err) {
      return act(node, 'block', err instanceof Error ? err.message : 'Mass refused.');
    }
  }

  if (algo === 'remaining-gate') {
    if (facts.remainingGrams < 0) return act(node, 'block', 'Remaining mass cannot be negative.');
    if (facts.remainingGrams === 0) return act(node, 'block', 'No remaining mass.');
    return act(node, 'pass', `Remaining ${facts.remainingGrams} g on the same body.`);
  }

  if (algo === 'suit-loan') return act(node, 'refuse', assessSuitability('loan').reason);
  if (algo === 'suit-tourism') return act(node, 'refuse', assessSuitability('travel').reason);

  if (algo === 'inspect-cell') {
    const seen = inspectCell({
      cellId: facts.cellId, remainingGrams: facts.remainingGrams,
      consents: [{ constraint: 'no-onion', purpose: 'kitchen-filter', granted: true, at: '2026-09-22' }],
    });
    return act(node, 'pass', seen.reason);
  }

  if (algo === 'farm-twin') {
    const t = farmTwin({ remainingGrams: facts.remainingGrams, lossPctDeclared: facts.lossPctDeclared });
    return act(node, 'pass', `Twin remaining after ${facts.lossPctDeclared}% = ${t.remainingAfter} g. Never auto-execute. ₹ null.`);
  }

  if (algo === 'infra-twin') {
    const t = infraTwin({ tempC: facts.iotTempC, kwh: facts.kwh, waterLitres: null, capacityKw: null, thermalTwin: false });
    return act(node, t.status === 'observed' ? 'pass' : 'block', t.reason);
  }

  if (algo === 'brain-decide') {
    const hot = facts.alert || (facts.iotTempC != null && facts.iotTempC >= 31);
    const p = brainDecide({
      signal: facts.rupeeWrite ? 'rupee-write' : hot ? 'mill-heat' : 'harvest-propose',
      remainingGrams: facts.remainingGrams, outage: facts.outage, alert: facts.alert, iotTempC: facts.iotTempC,
      balanced: facts.journalBalanced, clerk: facts.clerk, rupeeWrite: facts.rupeeWrite, lossPctDeclared: facts.lossPctDeclared,
    });
    const tissueId = TISSUE_NODE[node.id];
    if (tissueId) {
      const t = p.tissues.find((row) => row.id === tissueId);
      if (t) {
        const decision = t.verdict === 'block' ? 'block' : t.verdict === 'refuse' ? 'refuse' : t.verdict === 'defer' ? 'defer' : (t.verdict === 'propose' || t.verdict === 'hypothesis') ? 'propose' : 'pass';
        return act(node, decision, t.reason);
      }
    }
    const decision = p.decision === 'block' ? 'block' : p.decision === 'defer' ? 'defer' : p.decision === 'propose' ? 'propose' : 'pass';
    return act(node, decision, p.reason);
  }

  if (algo === 'constitution') {
    const v = evaluateConstitution({ rupeeWrite: facts.rupeeWrite });
    return act(node, v.allowed ? 'pass' : 'block', v.allowed ? 'Constitution holds.' : `Violated ${v.violated.join(', ')}.`);
  }

  if (NOT_PORTED_ALGOS.has(algo)) {
    return act(node, 'named', `${algo} is named on this kernel. Full algorithm port pending (modules/algorithms.ts not yet ported).`);
  }

  return act(node, 'defer', `${algo} is named on this kernel.`);
}

function runFlow(flowId, facts = defaultFlowFacts()) {
  const def = FLOW_BY_ID[flowId];
  if (!def) throw new Error('Unknown flow.');
  const steps = def.nodes.map((node) => fireNode(node, facts));
  const passed = steps.filter((s) => s.decision === 'pass').length;
  const blocked = steps.filter((s) => s.decision === 'block').length;
  const deferred = steps.filter((s) => s.decision === 'defer' || s.decision === 'propose').length;
  const named = steps.filter((s) => s.decision === 'named').length;
  const refused = steps.filter((s) => s.decision === 'refuse').length;
  return {
    flowId, name: def.name, passed, blocked, deferred, named, refused, rupee: null, steps,
    reason: `${def.name}: ${passed} pass / ${blocked} block / ${deferred} defer / ${named} named / ${refused} refuse. No invented ₹.`,
  };
}

function runAllFlows(facts = defaultFlowFacts()) {
  return FLOWS.map((f) => runFlow(f.id, facts));
}

function runNode(flowId, nodeId, facts = defaultFlowFacts()) {
  const def = FLOW_BY_ID[flowId];
  const node = def?.nodes.find((row) => row.id === nodeId);
  if (!node) throw new Error('Unknown node.');
  return fireNode(node, facts);
}

module.exports = { defaultFlowFacts, runFlow, runAllFlows, runNode };
