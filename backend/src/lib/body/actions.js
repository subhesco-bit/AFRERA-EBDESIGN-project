'use strict';
/** Body gates. Remaining moves only on clerk-declared loss. No invented ₹.
 * Ported from pine-shadow src/lib/body/actions.ts */

const { millDecision, remainingAfterCommit, remainingAfterSpoilage } = require('../erp/kernel');
const { latticeStats } = require('../lattice/index');
const { climateAutopilot, closePeriod, inspectCell, travelPlan } = require('../os/runtime');
const { BODY_BY_ID, BODY_PARTS } = require('./anatomy');

const EMPTY = { part: 'skin', decision: 'pass', moved: false, remainingGrams: 0, rupee: null, freezeEmi: false, reason: '', signals: [] };

function act(part, facts, decision, reason, extra = {}) {
  return {
    ...EMPTY, part, decision, moved: extra.moved ?? false,
    remainingGrams: extra.remainingGrams ?? facts.remainingGrams, rupee: null, freezeEmi: false,
    reason, signals: extra.signals ?? [],
  };
}

function defaultFacts(over = {}) {
  return {
    remainingGrams: 180000, clerk: 'Biren', cellId: 'c-enghi', outage: false, alert: false,
    iotTempC: null, kwh: null, balanced: true, rupeeWrite: false, mintedGrams: 180000,
    offtakeGrams: 0, spoilageGrams: 0, tourism: false, ...over,
  };
}

function millTone(facts) {
  const mill = millDecision({ outage: facts.outage, alert: facts.alert, iotTempC: facts.iotTempC, kwh: facts.kwh });
  if (mill.decision === 'block') return 'resting';
  if (mill.decision === 'defer') return 'deferred';
  return 'contracted';
}

function veinFlow(input) {
  if (input.mintedGrams < 0 || input.offtakeGrams < 0 || input.spoilageGrams < 0) {
    throw new Error('Mass cannot be negative.');
  }
  const afterOfftake = remainingAfterCommit(input.mintedGrams, input.offtakeGrams);
  const remainingGrams = input.spoilageGrams > 0 ? remainingAfterSpoilage(afterOfftake, input.spoilageGrams) : afterOfftake;
  const conserved = remainingGrams + input.offtakeGrams + input.spoilageGrams === input.mintedGrams;
  return {
    remainingGrams, conserved, path: ['harvest', 'godown', 'offtake'], rupee: null,
    reason: conserved
      ? `Vein carried remaining ${remainingGrams} g. Same lot body. Mass conserved.`
      : 'Vein refused. Mass not conserved.',
  };
}

function heartPulse(lotHint) {
  const lot = lotHint.trim() || 'lot';
  return { beats: ['harvest.completed', 'intake', 'settle'], lot, rupee: null };
}

function fingerPrecision(remainingGrams) {
  if (remainingGrams < 0) throw new Error('Remaining cannot go negative.');
  return { grams: remainingGrams, kg: null, unit: 'g', rupee: null, reason: `Finger reads ${remainingGrams} g. Precision is grams, not a rounded story.` };
}

function actBody(part, facts) {
  const row = BODY_BY_ID[part];
  if (!row) throw new Error('Unknown body part.');
  if (facts.remainingGrams < 0) return act(part, facts, 'block', 'Remaining mass cannot be negative.');
  if (facts.rupeeWrite && part !== 'skin' && part !== 'relax') {
    return act(part, facts, 'block', 'Skin seals first. AI cannot write rupees.');
  }

  if (part === 'skin') {
    if (facts.rupeeWrite) return act('skin', facts, 'block', 'Skin seals. AI cannot write rupees. Remaining stays inside.');
    return act('skin', facts, 'pass', 'Skin holds. Consent surface. Auth off. Remaining not exposed to undeclared writes.');
  }

  if (part === 'eye') {
    const seen = inspectCell({
      cellId: facts.cellId, remainingGrams: facts.remainingGrams,
      consents: [{ constraint: 'no-onion', purpose: 'kitchen-filter', granted: true, at: '2026-09-22' }],
    });
    return act('eye', facts, 'pass', seen.reason, { remainingGrams: seen.remainingGrams });
  }

  if (part === 'ear') {
    const mill = millDecision({ outage: facts.outage, alert: facts.alert, iotTempC: facts.iotTempC, kwh: facts.kwh });
    return act('ear', facts, mill.decision, `Ear hears ${mill.reason}`, { signals: mill.signals });
  }

  if (part === 'heart') {
    const pulse = heartPulse(facts.cellId);
    return act('heart', facts, facts.remainingGrams > 0 ? 'pass' : 'defer', `Heart beats ${pulse.beats.join(' · ')}. One lot body.`, { signals: pulse.beats });
  }

  if (part === 'vein') {
    try {
      const flow = veinFlow({ mintedGrams: facts.mintedGrams, offtakeGrams: facts.offtakeGrams, spoilageGrams: facts.spoilageGrams });
      return act('vein', facts, flow.conserved ? 'pass' : 'block', flow.reason, { remainingGrams: flow.remainingGrams, signals: flow.path });
    } catch (err) {
      return act('vein', facts, 'block', err instanceof Error ? err.message : 'Vein refused.');
    }
  }

  if (part === 'muscle') {
    const mill = millDecision({ outage: facts.outage, alert: facts.alert, iotTempC: facts.iotTempC, kwh: facts.kwh });
    const decision = mill.decision;
    const reason = mill.decision === 'block' ? `Muscle rests. ${mill.reason}`
      : mill.decision === 'defer' ? `Muscle waits. ${mill.reason}`
      : 'Muscle contracts. Mill may process. Remaining unmoved until clerk.';
    return act('muscle', facts, decision, reason, { signals: mill.signals, moved: false });
  }

  if (part === 'relax') return relaxBody('rest-mill', facts);

  if (part === 'ligament') {
    const s = latticeStats();
    return act('ligament', facts, 'pass', `Ligaments: ${s.living} living / ${s.partial} partial / ${s.missing} missing of ${s.bridges}. Integrity ${s.integrity}%. Missing stay dashed.`, { signals: [`living:${s.living}`, `missing:${s.missing}`] });
  }

  if (part === 'hand') {
    if (!facts.clerk.trim()) return act('hand', facts, 'block', 'Hand needs a clerk. Companion only proposes.');
    if (!(facts.remainingGrams > 0)) return act('hand', facts, 'block', 'Hand finds no remaining mass. Harvest first.');
    return act('hand', facts, 'pass', `Hand grasps remaining ${facts.remainingGrams} g on ${facts.cellId}. Clerk ${facts.clerk} writes. AI does not hold the sack.`);
  }

  if (part === 'finger') {
    const fine = fingerPrecision(facts.remainingGrams);
    return act('finger', facts, 'pass', fine.reason);
  }

  if (part === 'feet') {
    const plan = travelPlan({
      remainingGrams: facts.remainingGrams, weatherAlert: facts.alert, millBlocked: millTone(facts) === 'resting',
      kitchenAccess: true, tourism: facts.tourism, budgetPaise: null,
    });
    return act('feet', facts, plan.status === 'planned' ? 'pass' : 'refuse', plan.reason, { signals: plan.itinerary?.map((s) => s.id) ?? ['tourism-refused'] });
  }

  return act(part, facts, 'defer', `${row.name} is named.`);
}

function relaxBody(kind, facts) {
  if (kind === 'seal-skin') return actBody('skin', { ...facts, rupeeWrite: facts.rupeeWrite });

  if (kind === 'hold-remaining') {
    return act('relax', facts, 'pass', `Remaining ${facts.remainingGrams} g held. Clerk has not declared loss. EMI not frozen.`, { moved: false });
  }

  if (kind === 'period-rest') {
    const closed = closePeriod({ season: 'Magh 2026', balanced: facts.balanced, clerk: facts.clerk });
    return act('relax', facts, closed.status === 'closed' ? 'pass' : 'block', `Period rest. ${closed.reason}`);
  }

  if (kind === 'unclench') {
    const mill = millDecision({ outage: facts.outage, alert: facts.alert, iotTempC: facts.iotTempC, kwh: facts.kwh });
    if (mill.decision === 'block') return act('relax', facts, 'block', `Unclench refused. ${mill.reason}`, { signals: mill.signals });
    return act('relax', facts, mill.decision, `Muscle unclenched. ${mill.reason}`, { signals: mill.signals });
  }

  const auto = climateAutopilot({ alert: true, outage: facts.outage, iotTempC: facts.iotTempC ?? 31.4, remainingGrams: facts.remainingGrams, clerkLossGrams: null });
  return act('relax', facts, auto.process === 'block' ? 'block' : 'pass',
    `Muscle rests. Mill ${auto.process}. Claim ${auto.claimOpen ? 'open' : 'closed'}. EMI not frozen. Remaining ${auto.remainingGrams} g unmoved.`,
    { moved: auto.moved, remainingGrams: auto.remainingGrams, signals: auto.why });
}

function bodyTone(facts) {
  return {
    mill: millTone(facts), remainingHeld: true, skinSealed: !facts.rupeeWrite,
    living: BODY_PARTS.filter((p) => p.status === 'living').length,
    partial: BODY_PARTS.filter((p) => p.status === 'partial').length,
    blocked: BODY_PARTS.filter((p) => p.status === 'blocked').length,
  };
}

module.exports = { defaultFacts, millTone, veinFlow, heartPulse, fingerPrecision, actBody, relaxBody, bodyTone };
