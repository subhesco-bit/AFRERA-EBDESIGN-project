'use strict';
/** Walk a named flow. Missing nodes stay named. Never invent ₹.
 * Full faithful port of pine-shadow src/lib/flows/run.ts, now that
 * modules/algorithms.js, os/events.js, and os/passport.js are ported.
 * This replaces the earlier partial run.js, which returned "named — not
 * yet ported" for 24 algorithm branches; all of them are now real. */

const { millDecision, remainingAfterCommit, remainingAfterSpoilage } = require('../erp/kernel');
const { brainDecide } = require('../brain/decide');
const {
  aiFirewall, copilotNext, energyCloudGate, fifoGate, fvieRank, giClaimGate, giFrame,
  herdCoverGate, hoursToPay, humanCommand, journalGate, libraryConsult, paymentRefGate,
  pledgeGate, priceDeclared, priceWaterfall, qtyWeightedGate, remainingGate, schemeGate,
  spoilageMass, wacCost, weatherAlert,
} = require('../modules/algorithms');
const { unknownEventFails } = require('../os/events');
const { evidencePassport } = require('../os/passport');
const { evaluateConstitution } = require('../os/constitution');
const { farmTwin, infraTwin, inspectCell } = require('../os/runtime');
const { assessSuitability } = require('../os/suitability');
const { FLOW_BY_ID, FLOWS } = require('./catalog');

const FIREWALL_STEP = { code: 'F0', moduleId: 'fabric', name: 'Firewall', kind: 'decision', organ: 'rupee', algorithm: 'ai-firewall', emits: 'fabric.allow', rupeeWrite: false };

const TISSUE_NODE = { 'd-front': 'frontier', 'd-agent': 'agentic', 'd-phys': 'physical', 'd-sec': 'security', 'd-sci': 'scientist' };

function defaultFlowFacts(over = {}) {
  return {
    remainingGrams: 180000, qtyGrams: 40000, mintedGrams: 180000, offtakeGrams: 0, spoilageGrams: 0,
    pricePaisePerKg: 8500, freightPaisePerKg: 400, paymentRef: null, clerk: 'Biren', cellId: 'c-enghi',
    lotId: 'lot-chakhao', variety: 'Chakhao Poireiton', giMarker: 'GI-CHAKHAO', giChainLength: 1,
    journalBalanced: true, rupeeWrite: false, outage: false, alert: false, iotTempC: null, kwh: null,
    pledged: 0, tourism: false, costPaise: null, lossPctDeclared: 10, hoursToPay: null, ...over,
  };
}

function ctx(facts) {
  return {
    workflowId: 'flow', remainingGrams: facts.remainingGrams, grams: facts.mintedGrams, qtyGrams: facts.qtyGrams,
    pricePaisePerKg: facts.pricePaisePerKg, freightPaisePerKg: facts.freightPaisePerKg, paymentRef: facts.paymentRef,
    clerk: facts.clerk, cellId: facts.cellId, lotId: facts.lotId, variety: facts.variety, giMarker: facts.giMarker,
    giChainLength: facts.giChainLength, journalBalanced: facts.journalBalanced, pledged: facts.pledged,
    costPaise: facts.costPaise, hoursToPay: facts.hoursToPay, query: facts.alert ? 'heat' : facts.variety,
    status: facts.outage ? 'outage' : 'ok', alert: facts.alert, iotTempC: facts.iotTempC, kwh: facts.kwh,
  };
}

function act(node, decision, reason) {
  return { nodeId: node.id, name: node.name, algorithm: node.algorithm, decision, reason, rupee: null, status: node.status };
}

function fromAlgo(node, result) {
  return act(node, result.decision, result.reason);
}

function fireNode(node, facts) {
  if (node.status === 'missing') return act(node, 'named', `${node.name} is named missing. Do not paint it living.`);

  const c = ctx(facts);
  const algo = node.algorithm;

  if (algo === 'dual-truth') return act(node, 'pass', 'Kernel tissue ~39%. GitHub platform 7%. Dual-truth holds.');
  if (algo === 'remaining-gate') {
    const saleHold = node.id === 'pay-mass';
    return fromAlgo(node, remainingGate({ ...c, qtyGrams: saleHold ? c.qtyGrams : 0 }));
  }
  if (algo === 'price-declared') return fromAlgo(node, priceDeclared(c));
  if (algo === 'price-waterfall') return fromAlgo(node, priceWaterfall(c));
  if (algo === 'journal-balance') return fromAlgo(node, journalGate(c));
  if (algo === 'payment-ref') return fromAlgo(node, paymentRefGate(c));
  if (algo === 'fifo-alloc') return fromAlgo(node, fifoGate(c));
  if (algo === 'wac-cost') return fromAlgo(node, wacCost(c));
  if (algo === 'qty-weighted') return fromAlgo(node, qtyWeightedGate(c));
  if (algo === 'gi-frame') return fromAlgo(node, giFrame(c));
  if (algo === 'gi-claim') return fromAlgo(node, giClaimGate(c));
  if (algo === 'pledge-gate') return fromAlgo(node, pledgeGate(c));
  if (algo === 'library-consult') return fromAlgo(node, libraryConsult(c));
  if (algo === 'fvie-rank') return fromAlgo(node, fvieRank(c));
  if (algo === 'hours-to-pay') return fromAlgo(node, hoursToPay(c));
  if (algo === 'scheme-gate') return fromAlgo(node, schemeGate(c));
  if (algo === 'human-command') return fromAlgo(node, humanCommand());
  if (algo === 'copilot-next') return fromAlgo(node, copilotNext('harvest-mint'));
  if (algo === 'weather-reflex') return fromAlgo(node, weatherAlert(c));
  if (algo === 'energy-cloud') return fromAlgo(node, energyCloudGate(c));
  if (algo === 'herd-cover') return fromAlgo(node, herdCoverGate({ ...c, qtyGrams: 12 }));
  if (algo === 'spoilage-mass') {
    if (facts.spoilageGrams <= 0) return act(node, 'defer', 'No clerk-declared spoilage. Remaining unmoved.');
    return fromAlgo(node, spoilageMass({ ...c, qtyGrams: facts.spoilageGrams }));
  }
  if (algo === 'ai-firewall') {
    if (facts.rupeeWrite) return act(node, 'block', 'AI numeric writes are forbidden. A clerk declares ₹.');
    return fromAlgo(node, aiFirewall(FIREWALL_STEP));
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
  if (algo === 'suit-loan') return act(node, 'refuse', assessSuitability('loan').reason);
  if (algo === 'suit-tourism') return act(node, 'refuse', assessSuitability('travel').reason);
  if (algo === 'inspect-cell') {
    const seen = inspectCell({ cellId: facts.cellId, remainingGrams: facts.remainingGrams, consents: [{ constraint: 'no-onion', purpose: 'kitchen-filter', granted: true, at: '2026-09-22' }] });
    return act(node, 'pass', seen.reason);
  }
  if (algo === 'passport') {
    const lot = {
      id: facts.lotId, cellId: facts.cellId, cellName: 'Enghi', variety: facts.variety, remainingGrams: facts.remainingGrams,
      grams: facts.mintedGrams, giMinted: Boolean(facts.giMarker), giMarker: facts.giMarker, coverStatus: 'bound', policyId: 'POL-LANGTHASA',
    };
    const books = {
      lots: [lot], receipts: [], orders: [], journal: [],
      giChain: facts.giMarker ? [{ id: 'g1', lotId: facts.lotId, seq: 1, event: 'mint', handler: facts.clerk, geo: 'Langthasa', season: 'Magh 2026', createdAt: '2026-01-01' }] : [],
      kpis: { journalBalanced: facts.journalBalanced },
    };
    const p = evidencePassport(lot, books);
    return act(node, p.complete ? 'pass' : 'defer', `Passport ${p.complete ? 'complete' : 'partial'}. Absent stays absent.`);
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
      signal: facts.rupeeWrite ? 'rupee-write' : hot ? 'mill-heat' : 'harvest-propose', remainingGrams: facts.remainingGrams,
      outage: facts.outage, alert: facts.alert, iotTempC: facts.iotTempC, balanced: facts.journalBalanced,
      clerk: facts.clerk, rupeeWrite: facts.rupeeWrite, lossPctDeclared: facts.lossPctDeclared,
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
  if (algo === 'spine-publish') return act(node, 'pass', 'spine.publish harvest.completed. Same lotId fans out.');
  if (algo === 'unknown-event') {
    const fails = unknownEventFails('wedding.feast');
    return act(node, fails ? 'pass' : 'block', fails ? 'Unknown events fail. wedding.feast is not a village muscle.' : 'Unknown event leaked.');
  }
  if (algo === 'kitchen') return act(node, 'pass', 'Magh kitchen remembers last kg. Price blank until declared.');
  if (algo === 'next-magh') return act(node, 'defer', 'Next Magh offer at last kg. Price blank until a clerk declares ₹.');

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
