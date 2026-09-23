'use strict';
/** Stage runtime. Tourism itinerary refused. No invented ₹.
 * Faithfully ported from pine-shadow src/lib/os/runtime.ts */

const { journalBalances, millDecision, remainingAfterSpoilage, schemeEligible, splitQtyWeighted, weatherReflex } = require('../erp/kernel');
const { envelopeFor } = require('./envelope');
const { evaluateConstitution } = require('./constitution');
const { TERMS, neverTranslate } = require('./terms');
const { OS_ITEMS, OS_STAGES } = require('./catalog');

const VILLAGE_COA = [
  { code: '1000', name: 'cash', kind: 'asset' },
  { code: '1100', name: 'remaining-mass', kind: 'asset', unit: 'grams' },
  { code: '2000', name: 'farmgate', kind: 'equity' },
  { code: '2100', name: 'freight', kind: 'expense' },
  { code: '3000', name: 'spoilage', kind: 'loss' },
  { code: '3100', name: 'energy', kind: 'expense' },
  { code: '3200', name: 'water', kind: 'expense' },
  { code: '3300', name: 'cover', kind: 'expense' },
];

function closePeriod(input) {
  if (!input.clerk.trim()) return { status: 'blocked', reason: 'Clerk must close the period.', rupee: null };
  if (!input.balanced) return { status: 'blocked', reason: 'Journal unbalanced. SoD: clerk cannot close.', rupee: null };
  return { status: 'closed', reason: `${input.season} closed on declared books. No invented ₹.`, rupee: null };
}

function enqueueOffline(kind, payload, at = new Date().toISOString()) {
  if (!payload.trim()) throw new Error('Offline payload is declared.');
  return { id: `off-${kind}-${at}`, kind, payload: payload.trim(), createdAt: at, syncedAt: null, receipt: null };
}

function syncOffline(item, receipt) {
  const ref = receipt.trim();
  if (!ref) throw new Error('Sync needs a receipt. Do not invent one.');
  return { ...item, syncedAt: new Date().toISOString(), receipt: ref };
}

function observe(lotId, signal) {
  if (!lotId.trim() || !signal.trim()) throw new Error('Trace needs lotId and a signal.');
  return { lotId, signal, correlated: true };
}

function healthCheck(input) {
  if (!input.balanced) return { status: 'defer', reason: 'Journal unbalanced.' };
  if (!input.remainingConserved) return { status: 'defer', reason: 'Mass not conserved.' };
  return { status: 'ok', reason: `${input.migrations} migrations. Village memory holds.` };
}

function threatModel() {
  return { aiRupeeWrite: false, clerkBoundary: true, secretsInRepo: false };
}

function fileClaim(input) {
  if (!input.lotId.trim() || !input.policyId.trim()) throw new Error('Claim needs lot and policy.');
  if (input.payoutPaise != null) throw new Error('Do not invent a payout.');
  const reflex = weatherReflex(input.hazard);
  return { status: 'filed', payoutPaise: null, survey: 'named', reason: `Claim window ${reflex.claimWindow}. EMI not frozen. Payout undeclared.` };
}

function schemeRule(input) {
  if (input.amountPaise != null) throw new Error('Scheme rupees stay undeclared.');
  if (!input.effectiveFrom || !input.effectiveTo) throw new Error('Scheme rules are effective-dated.');
  const v = schemeEligible(input.code, input);
  return { ...v, amountPaise: null, effective: true };
}

function proofOfDelivery(input) {
  if (input.etaMinutes != null) throw new Error('Do not invent an ETA.');
  if (!input.declared) return { status: 'blocked', reason: 'PoD is a clerk fact.', eta: null };
  return { status: 'pod', eta: null, reason: `Lot ${input.lotId} delivered as declared. ETA absent.` };
}

function milkPost(input) {
  if (input.litres == null) return { status: 'absent', rupee: null };
  if (input.litres <= 0) throw new Error('Declared litres must be positive.');
  if (input.paise == null) return { status: 'posted', rupee: null };
  if (input.paise < 0) throw new Error('Declared milk rupees cannot be negative.');
  return { status: 'posted', rupee: input.paise };
}

function compareLots(lots) {
  const order = [...lots].sort((a, b) => (b.fus ?? -1) - (a.fus ?? -1) || b.remainingGrams - a.remainingGrams).map((l) => l.id);
  return { order, usedPrice: false };
}

function esgAttribution(input) {
  if (input.emissionsKg != null) throw new Error('Do not invent emissions.');
  if (input.spoilageGrams < 0) throw new Error('Spoilage cannot be negative.');
  if (input.kwh != null && input.kwh < 0) throw new Error('Declared kWh cannot be negative.');
  return { spoilageGrams: input.spoilageGrams, kwh: input.kwh, emissionsKg: null };
}

function formInconsistencies(form) {
  const gaps = [];
  if (form.grams != null && form.grams <= 0) gaps.push('Mass must be declared positive.');
  if (form.pricePaisePerKg === 0) gaps.push('Zero price is not a declared sale.');
  if (form.paymentRef != null && !form.paymentRef.trim()) gaps.push('paymentRef cannot be blank.');
  if (form.remainingGrams != null && form.remainingGrams < 0) gaps.push('Remaining cannot go negative.');
  return gaps;
}

function explainCashflow(lines) {
  const farmgatePaise = lines.filter((l) => l.account === 'farmgate' && l.side === 'credit').reduce((n, l) => n + l.amountPaise, 0);
  const inputsPaise = lines.filter((l) => l.side === 'debit' && l.account !== 'cash').reduce((n, l) => n + l.amountPaise, 0);
  return { farmgatePaise, inputsPaise, hoursUnknown: true, score: null };
}

function protectionGap(input) {
  if (input.premiumPaise != null) throw new Error('Do not invent a premium.');
  if (!input.coverBound) return { gap: true, quote: null, reason: 'Cover gap. Quote refused.' };
  return { gap: false, quote: null, reason: 'Cover bound. Premium undeclared.' };
}

function consentGrant(constraint, purpose, granted) {
  const c = constraint.trim();
  const p = purpose.trim();
  if (!c || !p) throw new Error('Consent names a constraint and a purpose.');
  if (evaluateConstitution({ eligibilityFromConstraint: granted && /eligib|credit|price|insur/i.test(p) }).allowed === false) {
    throw new Error('Voluntary constraints cannot set eligibility, credit, or price.');
  }
  return { constraint: c, purpose: p, granted, at: new Date().toISOString() };
}

function dietaryFilter(optIn, variety) {
  if (!optIn) return { include: true, profiled: false };
  return { include: Boolean(variety.trim()), profiled: false };
}

function evalHarness(input) {
  if (input.rupeeWrite) return { pass: false, reason: 'AI rupee write forbidden.' };
  if (!input.libraryHit && !input.cited) return { pass: false, reason: 'Evidence or hide.' };
  return { pass: true, reason: input.libraryHit ? 'Library-first.' : 'Cited.' };
}

function anomalyDefer(balanced) {
  return balanced ? 'pass' : 'defer';
}

function farmTwin(input) {
  if (input.lossPctDeclared < 0 || input.lossPctDeclared > 100) throw new Error('Loss % is declared 0–100.');
  const loss = Math.round((input.remainingGrams * input.lossPctDeclared) / 100);
  const remainingAfter = loss === 0 ? input.remainingGrams : remainingAfterSpoilage(input.remainingGrams, loss);
  return { remainingAfter, rupee: null, autoExecute: false };
}

function climateAutopilot(input) {
  const mill = millDecision({ outage: input.outage, alert: input.alert, iotTempC: input.iotTempC, kwh: null });
  const process = mill.decision === 'block' ? 'block' : 'pass';
  const claimOpen = input.alert;
  if (input.clerkLossGrams != null && input.clerkLossGrams > 0) {
    try {
      return {
        process, claimOpen, freezeEmi: false,
        remainingGrams: remainingAfterSpoilage(input.remainingGrams, input.clerkLossGrams),
        proposedLossGrams: input.clerkLossGrams, moved: true, why: mill.signals,
      };
    } catch {
      return { process, claimOpen, freezeEmi: false, remainingGrams: input.remainingGrams, proposedLossGrams: input.clerkLossGrams, moved: false, why: mill.signals };
    }
  }
  return { process, claimOpen, freezeEmi: false, remainingGrams: input.remainingGrams, proposedLossGrams: mill.signals.length ? 0 : null, moved: false, why: mill.signals };
}

function blockLog(facts) {
  const period = closePeriod({ season: 'Magh 2026', balanced: facts.balanced, clerk: facts.clerk });
  const mill = millDecision({ outage: facts.outage, alert: facts.alert, iotTempC: facts.iotTempC, kwh: null });
  const remaining =
    facts.remainingGrams == null
      ? { domain: 'remaining', decision: 'defer', reason: 'Remaining mass not on the books yet.' }
      : facts.remainingGrams < 0
        ? { domain: 'remaining', decision: 'block', reason: 'Remaining mass cannot be negative.' }
        : facts.remainingGrams === 0
          ? { domain: 'remaining', decision: 'block', reason: 'No remaining mass.' }
          : { domain: 'remaining', decision: 'pass', reason: `Remaining ${facts.remainingGrams} g on the same body.` };
  const rupee = facts.rupeeWrite
    ? { domain: 'rupee', decision: 'block', reason: 'AI numeric writes are forbidden on assertions. A clerk declares ₹.' }
    : { domain: 'rupee', decision: 'pass', reason: 'Firewall open: AI does not write rupees.' };
  const catalog = OS_ITEMS.filter((x) => x.todo === 'blocked').map((x) => ({ domain: 'catalog', decision: 'block', reason: `${x.id} · ${x.next}` }));
  return [
    { domain: 'period', decision: period.status === 'closed' ? 'pass' : 'block', reason: period.reason },
    { domain: 'mill', decision: mill.decision, reason: mill.reason },
    remaining,
    rupee,
    ...catalog,
  ];
}

function autoOp(input) {
  if (input.rupeeWrite) return { status: 'blocked', rupeeWrite: false };
  if (input.risk === 'high' && !input.clerkApproved) return { status: 'proposed', rupeeWrite: false };
  if (input.risk === 'low') return { status: 'ran', rupeeWrite: false };
  return { status: input.clerkApproved ? 'ran' : 'proposed', rupeeWrite: false };
}

function heal(orphan) {
  return { action: orphan ? 'defer' : 'ok', speculative: false };
}

function villageTwin(input) {
  return { ...input, invented: false };
}

function personalTwin(action) {
  if (action === 'loan') return { preview: 'Loan refused. No credit score.', autoExecute: false, refuse: true };
  return { preview: `${action} is a clerk write. Twin only shows remaining.`, autoExecute: false, refuse: false };
}

function scenario(input) {
  const twin = farmTwin(input);
  return { remainingAfter: twin.remainingAfter, rupee: null, live: false };
}

function circular(spoilageGrams) {
  if (spoilageGrams < 0) throw new Error('Spoilage cannot be negative.');
  return { unusedGrams: spoilageGrams, market: false };
}

function communityBenefit(parts, farmgatePaise) {
  return { split: splitQtyWeighted(parts, farmgatePaise), objective: 'qty-weighted, not GMV' };
}

function villageMap() {
  return { village: 'Langthasa', nation: false, cells: 4 };
}

function nlBuilder(goal) {
  if (!goal.trim()) throw new Error('A goal is declared.');
  return { propose: `Companion proposes: ${goal.trim()}`, screens: false, approve: 'required' };
}

function decisionPassport(organ, body, action) {
  return envelopeFor({ organ, body, action });
}

function a11yConfirm(action) {
  return { polite: `Confirm ${action}. Clerk declares kg, ₹, or ref.`, live: 'polite' };
}

function engCalc(input) {
  if (input.simulateCfd) return { status: 'blocked', amountPaise: null, cfd: false, reason: 'Do not fake CFD.' };
  if (!input.engineer.trim()) return { status: 'blocked', amountPaise: null, cfd: false, reason: 'Professional stamp required.' };
  if (!input.standard.trim()) return { status: 'blocked', amountPaise: null, cfd: false, reason: 'Named standard required (IS/IEC).' };
  if (!input.unit.trim()) return { status: 'blocked', amountPaise: null, cfd: false, reason: 'Unit is declared.' };
  if (!(input.qty > 0)) return { status: 'blocked', amountPaise: null, cfd: false, reason: 'Quantity must be declared positive.' };
  if (input.ratePaise != null && input.ratePaise < 0) throw new Error('Declared rate cannot be negative.');
  const amountPaise = input.ratePaise == null ? null : Math.round(input.qty * input.ratePaise);
  return {
    status: 'stamped', amountPaise, cfd: false,
    reason: amountPaise == null
      ? `BOQ stamped by ${input.engineer.trim()} to ${input.standard.trim()}. Amount undeclared.`
      : `BOQ stamped by ${input.engineer.trim()} to ${input.standard.trim()}. Amount declared.`,
  };
}

function inspectCell(input) {
  if (!input.cellId.trim()) throw new Error('Cell is the nucleus.');
  if (input.remainingGrams < 0) throw new Error('Remaining cannot go negative.');
  const revoke = (input.revokePurpose ?? '').trim();
  const consents = revoke ? input.consents.map((c) => (c.purpose === revoke ? { ...c, granted: false, at: c.at } : c)) : input.consents;
  return {
    cellId: input.cellId.trim(), remainingGrams: input.remainingGrams, consents, profile: false, login: false,
    reason: revoke
      ? `Cell ${input.cellId.trim()} inspected. Consent ${revoke} revoked. No login dossier.`
      : `Cell ${input.cellId.trim()} inspected. Remaining ${input.remainingGrams} g. No login dossier.`,
  };
}

function travelPlan(input = {}) {
  if (input.budgetPaise != null) throw new Error('Budget stays undeclared. Do not invent rupees.');
  if (input.tourism) {
    return { status: 'blocked', refuse: true, itinerary: null, budgetPaise: null, reason: 'Tourism itinerary refused. This planner moves remaining, not tourists.' };
  }
  const remaining = input.remainingGrams ?? 0;
  if (!(remaining > 0)) {
    return { status: 'blocked', refuse: true, itinerary: null, budgetPaise: null, reason: 'No remaining mass to move. Journey waits on harvest.' };
  }
  const millHeld = Boolean(input.millBlocked);
  const weatherHeld = Boolean(input.weatherAlert);
  const kitchenOpen = input.kitchenAccess !== false;
  const steps = [
    { id: 'plot', name: 'Plot', organ: 'crop', href: '/cells', remainingGrams: remaining, constraint: 'cell remaining', status: 'open' },
    { id: 'harvest', name: 'Harvest', organ: 'lot', href: '/lots', remainingGrams: remaining, constraint: 'GI mint', status: 'open' },
    { id: 'store', name: 'Godown', organ: 'warehouse', href: '/warehouse', remainingGrams: remaining, constraint: millHeld ? 'mill blocked' : 'cover bound', status: millHeld ? 'held' : 'open' },
    { id: 'kitchen', name: 'Kitchen', organ: 'demand', href: '/trade', remainingGrams: remaining, constraint: kitchenOpen ? 'Magh kitchen' : 'kitchen access named', status: kitchenOpen ? 'open' : 'held' },
    { id: 'next', name: 'Next Magh', organ: 'contract', href: '/trade', remainingGrams: remaining, constraint: weatherHeld ? 'weather claim open · price blank' : 'price blank until declared', status: weatherHeld ? 'held' : 'open' },
  ];
  return {
    status: 'planned', refuse: false, itinerary: steps, budgetPaise: null,
    reason: millHeld
      ? 'Village remaining journey held at godown. Mill blocked. Budget undeclared. Tourism refused.'
      : 'Village remaining journey: plot → harvest → godown → kitchen → next Magh. Budget undeclared. Tourism refused.',
  };
}

function federatedAsk(input) {
  for (const c of input.cells) {
    if (!c.cellId.trim()) throw new Error('Cell is named.');
    if (c.remainingGrams < 0) throw new Error('Remaining cannot go negative.');
  }
  const local = input.cells.map((c) => ({ cellId: c.cellId, remainingGrams: c.remainingGrams }));
  return {
    local, national: null, trained: false, centralized: false,
    reason: input.national
      ? 'National question refused. Weights stay local. Cells are not centralized.'
      : 'Ask answered from per-cell remaining. No training. No national pool.',
  };
}

function policyLab(input) {
  if (input.gazette) {
    return { eligible: false, amountPaise: null, gazette: false, live: false, reason: 'Gazette twin refused. Scheme what-if stays on this kernel.' };
  }
  if (input.amountPaise != null) throw new Error('Scheme rupees stay undeclared.');
  const v = schemeEligible(input.code, {
    acresCenti: input.acresCenti, plantingCount: input.plantingCount, horticulture: input.horticulture,
    fpo: input.fpo, perishable: input.perishable, northEast: input.northEast, freightDeclared: input.freightDeclared,
  });
  return { eligible: v.eligible, amountPaise: null, gazette: false, live: false, reason: `What-if ${input.code}: ${v.reason} Amount blank. Not a gazette.` };
}

function infraTwin(input) {
  if (input.thermalTwin) {
    return { status: 'blocked', tempC: input.tempC, kwh: input.kwh, waterLitres: input.waterLitres, capacityKw: null, thermal: false, reason: 'Do not fake a thermal twin. Engineering CFD stays refused.' };
  }
  if (input.capacityKw != null) throw new Error('Do not invent capacity.');
  if (input.kwh != null && input.kwh < 0) throw new Error('Declared kWh cannot be negative.');
  if (input.waterLitres != null && input.waterLitres < 0) throw new Error('Declared water cannot be negative.');
  const named = [input.tempC != null ? `${input.tempC} C` : null, input.kwh != null ? `${input.kwh} kWh` : null, input.waterLitres != null ? `${input.waterLitres} L` : null].filter(Boolean);
  return {
    status: 'observed', tempC: input.tempC, kwh: input.kwh, waterLitres: input.waterLitres, capacityKw: null, thermal: false,
    reason: named.length ? `Infra twin on declared ${named.join(', ')}. Capacity undeclared.` : 'Infra twin waits on declared temp, kWh, or water. Capacity undeclared.',
  };
}

function coopLicense(input) {
  if (input.cells.length === 0) throw new Error('Cooperative needs at least one cell.');
  if (input.spoilageGrams < 0) throw new Error('Spoilage cannot be negative.');
  for (const c of input.cells) {
    if (!c.cellId.trim()) throw new Error('Cell is named.');
    if (c.remainingGrams < 0) throw new Error('Remaining cannot go negative.');
  }
  if (input.farmgatePaise != null && input.farmgatePaise < 0) throw new Error('Declared farmgate cannot be negative.');
  const total = input.cells.reduce((n, c) => n + c.remainingGrams, 0);
  if (input.farmgatePaise == null || total <= 0) {
    return {
      license: input.cells.map((c) => ({ cellId: c.cellId, remainingGrams: c.remainingGrams, sharePaise: null })),
      spoilageGrams: input.spoilageGrams, valuePaise: null, eligibility: false,
      reason: total <= 0
        ? 'No remaining to license. Spoilage is unused grams. Constitution E4: cannot set eligibility.'
        : 'License of remaining by cell. Value undeclared. Constitution E4: cannot set eligibility.',
    };
  }
  const split = splitQtyWeighted(input.cells.map((c) => ({ cellId: c.cellId, qtyGrams: c.remainingGrams })), input.farmgatePaise);
  const byId = Object.fromEntries(split.map((s) => [s.cellId, s.amountPaise]));
  return {
    license: input.cells.map((c) => ({ cellId: c.cellId, remainingGrams: c.remainingGrams, sharePaise: byId[c.cellId] ?? 0 })),
    spoilageGrams: input.spoilageGrams, valuePaise: input.farmgatePaise, eligibility: false,
    reason: 'Qty-weighted license of remaining. Spoilage is unused grams. Constitution E4: cannot set eligibility.',
  };
}

function termsCatalog() {
  return TERMS.filter((t) => !neverTranslate(t.id));
}

function stageClosed(items = OS_ITEMS) {
  const out = {};
  for (const s of OS_STAGES) {
    const rows = items.filter((x) => x.stage === s.stage);
    const done = rows.filter((x) => x.todo === 'done').length;
    const blocked = rows.filter((x) => x.todo === 'blocked').length;
    const closed = done + blocked;
    const total = rows.length || 1;
    out[s.stage] = { total: rows.length, done, blocked, closed, pct: Math.round((closed / total) * 100) };
  }
  return out;
}

function allStagesComplete(items = OS_ITEMS) {
  return items.every((x) => x.todo === 'done' || x.todo === 'blocked');
}

function journalOk(lines) {
  return journalBalances(lines);
}

module.exports = {
  VILLAGE_COA, closePeriod, enqueueOffline, syncOffline, observe, healthCheck, threatModel, fileClaim,
  schemeRule, proofOfDelivery, milkPost, compareLots, esgAttribution, formInconsistencies, explainCashflow,
  protectionGap, consentGrant, dietaryFilter, evalHarness, anomalyDefer, farmTwin, climateAutopilot, blockLog,
  autoOp, heal, villageTwin, personalTwin, scenario, circular, communityBenefit, villageMap, nlBuilder,
  decisionPassport, a11yConfirm, engCalc, inspectCell, travelPlan, federatedAsk, policyLab, infraTwin,
  coopLicense, termsCatalog, stageClosed, allStagesComplete, journalOk,
};
