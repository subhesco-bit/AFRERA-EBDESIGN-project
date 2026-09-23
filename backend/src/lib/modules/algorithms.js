'use strict';
/** ERP + AI firewall algorithms. Numbers are declared. AI does not invent them.
 * Ported from pine-shadow src/lib/modules/algorithms.ts. This is the
 * highest-priority piece of the previously-unported remainder: it unblocks
 * every "named — not yet ported" branch in flows/run.js. */

const {
  allocateFifo, journalBalances, millDecision, remainingAfterCommit, settlementAmounts,
  splitQtyWeighted, weightedAverageCostPaisePerKg, fusForVariety, weatherReflex,
  schemeEligible, evaluateHerdCover, evaluateWeatherCover,
} = require('../erp/kernel');
const { queryLibraryKnowledge } = require('../library/match');
const { composeLibraryReading, diagnose } = require('../library/diagnose');

function aiFirewall(step) {
  if (step.kind === 'ai' && step.rupeeWrite) {
    return { decision: 'block', reason: 'AI numeric writes are forbidden on assertions. A clerk declares ₹.', payload: { firewall: 'rupee-write' } };
  }
  return { decision: 'pass', reason: 'Firewall open: this step does not write rupees.', payload: { spendPaise: 0 } };
}

function remainingGate(ctx) {
  const remainingDeclared = ctx.remainingGrams != null || ctx.grams != null;
  const remaining = ctx.remainingGrams ?? ctx.grams ?? 0;
  const qty = ctx.qtyGrams ?? 0;
  if (remaining < 0) return { decision: 'block', reason: 'Remaining mass cannot be negative.', payload: { remaining } };
  if (qty > remaining) return { decision: 'block', reason: 'Cannot sell more than the remaining lot body.', payload: { remaining, qty } };
  if ((ctx.grams ?? 0) > 0) {
    try {
      remainingAfterCommit(ctx.grams ?? 0, (ctx.grams ?? 0) - remaining);
    } catch (err) {
      return { decision: 'block', reason: err instanceof Error ? err.message : 'Mass not conserved.', payload: { remaining, qty } };
    }
  }
  if (!remainingDeclared && qty === 0) return { decision: 'defer', reason: 'Remaining mass not declared.', payload: { remaining, qty } };
  if (remaining <= 0) return { decision: 'block', reason: 'No remaining mass.', payload: { remaining, qty } };
  return { decision: 'pass', reason: `Remaining ${remaining} g still on the same body.`, payload: { remaining, qty } };
}

function priceDeclared(ctx) {
  if (ctx.pricePaisePerKg == null || ctx.pricePaisePerKg <= 0) {
    return { decision: 'block', reason: 'salePricePerUnit is required — never invented.', payload: {} };
  }
  return { decision: 'pass', reason: `Declared ${ctx.pricePaisePerKg} paise/kg.`, payload: { pricePaisePerKg: ctx.pricePaisePerKg } };
}

function priceWaterfall(ctx) {
  const qty = ctx.qtyGrams ?? 0;
  const price = ctx.pricePaisePerKg ?? 0;
  const freight = ctx.freightPaisePerKg ?? 0;
  if (qty <= 0 || price <= 0) return { decision: 'block', reason: 'Waterfall needs declared quantity and price.', payload: {} };
  const amounts = settlementAmounts(qty, price, freight);
  return { decision: 'pass', reason: `Gross ${amounts.gross} − freight ${amounts.freight} = farmgate ${amounts.farmgate}.`, payload: amounts };
}

function journalGate(ctx) {
  if (typeof ctx.journalBalanced === 'boolean') {
    if (!ctx.clerk?.trim()) return { decision: 'block', reason: 'Clerk must close the period.', payload: {} };
    if (!ctx.journalBalanced) return { decision: 'block', reason: 'Journal unbalanced. SoD: clerk cannot close.', payload: {} };
    return { decision: 'pass', reason: 'Journal balances. Period may close.', payload: {} };
  }
  const qty = ctx.qtyGrams ?? 0;
  const price = ctx.pricePaisePerKg ?? 0;
  const freight = ctx.freightPaisePerKg ?? 0;
  if (qty <= 0 || price <= 0) return { decision: 'defer', reason: 'No settlement lines yet.', payload: {} };
  const { gross, freight: fr, farmgate } = settlementAmounts(qty, price, freight);
  const lines = [{ side: 'debit', amountPaise: gross }, { side: 'credit', amountPaise: farmgate }, { side: 'credit', amountPaise: fr }];
  const ok = journalBalances(lines);
  return { decision: ok ? 'pass' : 'block', reason: ok ? 'Journal balances: cash in, farmgate + freight out.' : 'Journal does not balance.', payload: { gross, freight: fr, farmgate } };
}

function paymentRefGate(ctx) {
  const ref = ctx.paymentRef?.trim() ?? '';
  if (!ref) return { decision: 'defer', reason: 'paymentRef is required to mark paid. The offtake stays open.', payload: {} };
  return { decision: 'pass', reason: `Settled against ${ref}.`, payload: { paymentRef: ref } };
}

function pledgeGate(ctx) {
  if ((ctx.pledged ?? 0) > 0) return { decision: 'block', reason: 'Pledged receipts cannot sell until the lien is cleared.', payload: { pledged: ctx.pledged } };
  if ((ctx.openOfftake ?? 0) > 0 && ctx.status === 'inward') return { decision: 'block', reason: 'Open offtake already claims this body.', payload: { openOfftake: ctx.openOfftake } };
  return { decision: 'pass', reason: 'No lien. Stock may move.', payload: {} };
}

function fifoGate(ctx) {
  const remaining = ctx.remainingGrams ?? 0;
  const qty = ctx.qtyGrams ?? 0;
  if (qty <= 0) return { decision: 'defer', reason: 'No pool quantity declared.', payload: {} };
  try {
    const take = allocateFifo([{ id: ctx.lotId ?? 'lot', remainingGrams: remaining }], qty);
    return { decision: 'pass', reason: 'FIFO holds remaining mass.', payload: { take } };
  } catch (err) {
    return { decision: 'block', reason: err instanceof Error ? err.message : 'FIFO refused.', payload: {} };
  }
}

function wacCost(ctx) {
  const remaining = ctx.remainingGrams ?? 0;
  const cost = ctx.costPaise;
  if (remaining <= 0) return { decision: 'defer', reason: 'No remaining mass to average.', payload: {} };
  if (cost == null) return { decision: 'defer', reason: 'No declared remaining cost. WAC stays silent — never invent ₹.', payload: { remaining } };
  if (cost < 0) return { decision: 'block', reason: 'Declared cost cannot be negative.', payload: { remaining, costPaise: cost } };
  try {
    const wac = weightedAverageCostPaisePerKg([{ id: ctx.lotId ?? 'lot', remainingGrams: remaining, costPaise: cost }]);
    return { decision: 'pass', reason: `WAC ${wac} paise/kg on declared remaining cost.`, payload: { remaining, costPaise: cost, wacPaisePerKg: wac } };
  } catch (err) {
    return { decision: 'block', reason: err instanceof Error ? err.message : 'WAC refused.', payload: {} };
  }
}

function qtyWeightedGate(ctx) {
  const qty = ctx.qtyGrams ?? 0;
  const price = ctx.pricePaisePerKg ?? 0;
  const freight = ctx.freightPaisePerKg ?? 0;
  if (qty <= 0 || price <= 0) return { decision: 'defer', reason: 'No farmgate to split.', payload: {} };
  const { farmgate } = settlementAmounts(qty, price, freight);
  const split = splitQtyWeighted([{ cellId: ctx.cellId ?? 'cell', qtyGrams: qty }], farmgate);
  return { decision: 'pass', reason: 'FPO split is qty-weighted. Last cell absorbs remainder.', payload: { split, farmgate } };
}

function libraryConsult(ctx) {
  const query = ctx.query || ctx.variety || 'harvest lot spine hippocampus module';
  const diagnosis = diagnose();
  const hits = queryLibraryKnowledge(query, { limit: 6 });
  const reading = composeLibraryReading(query, hits, diagnosis);
  return { decision: hits.length ? 'pass' : 'defer', reason: reading.slice(0, 280), payload: { hits: hits.map((h) => h.id), missing: diagnosis.missingLigaments } };
}

function giFrame(ctx) {
  if (!ctx.giMarker) return { decision: 'propose', reason: 'No GI marker on this lot. Media may not invent one.', payload: { giMarker: null } };
  return { decision: 'pass', reason: `Frame the sack with ${ctx.giMarker}. Same lot body.`, payload: { giMarker: ctx.giMarker } };
}

function fvieRank(ctx) {
  const fus = fusForVariety(ctx.variety ?? '');
  if (!fus) return { decision: 'defer', reason: 'No declared FUS axes for this variety. Affordability stays blank.', payload: { foodValue: null } };
  return { decision: 'pass', reason: `FUS-v1 ${fus.score} on declared food axes. Affordability blank.`, payload: { foodValue: fus.score, fusVersion: fus.version, complete: fus.complete } };
}

function hoursToPay(ctx) {
  if (ctx.hoursToPay == null) return { decision: 'propose', reason: 'Hours-to-pay is a cell promise. Ask the clerk.', payload: {} };
  return { decision: 'pass', reason: `${ctx.hoursToPay}h to pay sits on the cell, not on a dashboard.`, payload: { hoursToPay: ctx.hoursToPay } };
}

function humanCommand() {
  return { decision: 'pass', reason: 'Command already has a human: the clerk named the cell and the mass.', payload: { human: true } };
}

function countPlugs(living, total) {
  return { decision: living > 0 ? 'pass' : 'block', reason: `${living} of ${total} modules have a living plug on this bus.`, payload: { living, total } };
}

function copilotNext(workflowId) {
  const next = {
    'harvest-mint': 'Next keystroke: inward the same lot body at the godown.',
    'warehouse-intake': 'Next keystroke: offtake at a declared ₹/kg, or pledge if a lender is named.',
    'offtake-settle': 'Next keystroke: paymentRef, then farmgate credits the cell.',
    'nerve-consult': 'Next keystroke: name an organ, then a clerk acts.',
    'domain-advise': 'Next keystroke: weather may pause EMI; it may not invent a price.',
    'platform-bus': 'Next keystroke: run harvest-mint against a living lot.',
    'claim-file': 'Next keystroke: survey is named. Payout stays undeclared.',
    'period-close': 'Next keystroke: Magh closes only if the journal balances.',
    'climate-reflex': 'Next keystroke: clerk names loss grams. Mill stays blocked.',
  };
  return { decision: 'propose', reason: next[workflowId] ?? 'Next keystroke lives on the books, not a second portal.', payload: { next: next[workflowId] ?? 'books' } };
}

function giClaimGate(ctx) {
  if (!ctx.giMarker) return { decision: 'pass', reason: 'Not a GI lot. No mint required.', payload: { giMarker: null } };
  const n = ctx.giChainLength ?? 0;
  if (n <= 0) return { decision: 'block', reason: 'No GI claim without a mint.', payload: { giMarker: ctx.giMarker, mintCount: n } };
  return { decision: 'pass', reason: `GI mint on the chain (${n}). Listing may claim GI.`, payload: { giMarker: ctx.giMarker, mintCount: n } };
}

function spoilageMass(ctx) {
  const remaining = ctx.remainingGrams ?? 0;
  const qty = ctx.qtyGrams ?? 0;
  if (qty <= 0) return { decision: 'defer', reason: 'Declared spoilage kilograms are required.', payload: { remaining } };
  try {
    remainingAfterCommit(remaining, qty);
    return { decision: 'pass', reason: `Spoilage ${qty} g leaves ${remaining - qty} g on the same body.`, payload: { remaining: remaining - qty, qty } };
  } catch (err) {
    return { decision: 'block', reason: err instanceof Error ? err.message : 'Spoilage refused.', payload: { remaining, qty } };
  }
}

function weatherAlert(ctx) {
  const hazard = (ctx.query ?? '').trim() || 'unseasonal Magh rain';
  try {
    const reflex = weatherReflex(hazard);
    const cover = evaluateWeatherCover('Langthasa');
    return { decision: 'pass', reason: `weather.alert opens a claim window on ${cover.policyId ?? 'gap'}. EMI freeze is refused.`, payload: { hazard: reflex.hazard, claimWindow: true, freezeEmi: false, policyId: cover.policyId } };
  } catch (err) {
    return { decision: 'block', reason: err instanceof Error ? err.message : 'Weather refused.', payload: {} };
  }
}

function herdCoverGate(ctx) {
  const head = ctx.qtyGrams && ctx.qtyGrams > 0 ? Math.round(ctx.qtyGrams) : 0;
  if (head <= 0) return { decision: 'defer', reason: 'No declared headcount. Herd cover stays a gap.', payload: {} };
  const cover = evaluateHerdCover(head);
  return { decision: cover.status === 'bound' ? 'pass' : 'defer', reason: cover.policyId ? `Herd binds ${cover.policyId}. Premium undeclared.` : 'Herd cover gap.', payload: { policyId: cover.policyId, head } };
}

function energyCloudGate(ctx) {
  const mill = millDecision({ outage: ctx.status === 'outage', alert: Boolean(ctx.alert), iotTempC: ctx.iotTempC ?? null, kwh: ctx.kwh ?? null });
  return { decision: mill.decision, reason: mill.reason, payload: { kwh: ctx.kwh ?? null } };
}

function schemeGate(ctx) {
  const acres = ctx.grams ?? 0;
  const plantings = ctx.giChainLength ?? 0;
  const hort = /ginger|horticulture/i.test(ctx.variety ?? ctx.commodity ?? '');
  const kisan = schemeEligible('PM-KISAN', { acresCenti: acres, plantingCount: plantings, horticulture: hort });
  return { decision: 'pass', reason: `${kisan.reason} Amount stays undeclared.`, payload: { eligible: kisan.eligible, amountPaise: null } };
}

module.exports = {
  aiFirewall, remainingGate, priceDeclared, priceWaterfall, journalGate, paymentRefGate, pledgeGate,
  fifoGate, wacCost, qtyWeightedGate, libraryConsult, giFrame, fvieRank, hoursToPay, humanCommand,
  countPlugs, copilotNext, giClaimGate, spoilageMass, weatherAlert, herdCoverGate, energyCloudGate, schemeGate,
};
