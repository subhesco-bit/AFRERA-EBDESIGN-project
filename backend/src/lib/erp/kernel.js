'use strict';
/** Pure rural-ERP bone. No SQL. Mass is grams; money is paise.
 * Faithfully ported from pine-shadow src/lib/erp/kernel.ts (verified against
 * subhesco-bit/pine-shadow-cabin-honey @ main). This is real domain logic for
 * Northeast India agriculture (Langthasa/Karbi Anglong GI rice, Chakhao, ginger),
 * not generic ERP boilerplate. */

const { paiseFromKgPrice } = require('./money');

const DEFAULT_FREIGHT_PAISE_PER_KG = 400; // declared ₹4 / kg

function remainingAfterCommit(mintedGrams, committedGrams) {
  if (mintedGrams < 0 || committedGrams < 0) throw new Error('Mass cannot be negative.');
  const left = mintedGrams - committedGrams;
  if (left < 0) throw new Error('Committed mass exceeds the lot body.');
  return left;
}

function assertCanSell(status, pledgedCount) {
  if (status === 'pledged' || pledgedCount > 0) {
    throw new Error('Pledged receipts cannot sell until the lien is cleared.');
  }
  if (status === 'settled') {
    throw new Error('Settled lot has already left the books as stock.');
  }
}

function settlementAmounts(qtyGrams, pricePaisePerKg, freightPaisePerKg) {
  if (qtyGrams <= 0) throw new Error('Declared quantity is required.');
  if (pricePaisePerKg <= 0) throw new Error('salePricePerUnit is required — never invented.');
  if (freightPaisePerKg < 0) throw new Error('Freight must be declared as zero or more.');
  const gross = paiseFromKgPrice(qtyGrams, pricePaisePerKg);
  const freight = paiseFromKgPrice(qtyGrams, freightPaisePerKg);
  if (freight > gross) throw new Error('Declared freight exceeds declared sale.');
  return { gross, freight, farmgate: gross - freight };
}

function settlementJournal(input) {
  return [
    { organId: 'rupee', account: 'cash', side: 'debit', amountPaise: input.gross, memo: `Settled ${input.variety} @ declared price` },
    { organId: 'rupee', account: 'farmgate', side: 'credit', amountPaise: input.farmgate, memo: `Farmgate to cell · ${input.hoursToPay}h to pay` },
    { organId: 'logistics', account: 'freight', side: 'credit', amountPaise: input.freight, memo: 'Freight deduction, declared' },
  ];
}

function inputJournal(kind, amountPaise, memo, organId) {
  return [
    { organId, account: kind, side: 'debit', amountPaise, memo },
    { organId: 'rupee', account: 'cash', side: 'credit', amountPaise, memo },
  ];
}

function journalBalances(lines) {
  const debit = lines.filter((l) => l.side === 'debit').reduce((n, l) => n + l.amountPaise, 0);
  const credit = lines.filter((l) => l.side === 'credit').reduce((n, l) => n + l.amountPaise, 0);
  return debit === credit;
}

function allocateFifo(lots, wantGrams) {
  if (wantGrams <= 0) throw new Error('Declared quantity is required.');
  const out = [];
  let left = wantGrams;
  for (const lot of lots) {
    if (left <= 0) break;
    if (lot.remainingGrams <= 0) continue;
    const take = Math.min(lot.remainingGrams, left);
    out.push({ lotId: lot.id, qtyGrams: take });
    left -= take;
  }
  if (left > 0) throw new Error('Not enough remaining mass in the godown.');
  return out;
}

/** Weighted average cost in paise per kg. Only when every lot in the pool
 * carries a declared remaining cost. Identity of the sack stays FIFO; WAC
 * blends the rupee, not the body. */
function weightedAverageCostPaisePerKg(lots) {
  const grams = lots.reduce((n, l) => n + l.remainingGrams, 0);
  const paise = lots.reduce((n, l) => n + l.costPaise, 0);
  if (grams <= 0) throw new Error('Pool has no mass.');
  if (paise < 0) throw new Error('Declared cost cannot be negative.');
  if (lots.some((l) => l.costPaise < 0 || l.remainingGrams < 0)) {
    throw new Error('Declared cost and mass cannot be negative.');
  }
  return Math.round(paise / (grams / 1000));
}

function intakeWac(poolGrams, poolCostPaise, inGrams, inCostPaise) {
  if (inGrams <= 0) throw new Error('Declared quantity is required.');
  if (inCostPaise < 0 || poolCostPaise < 0) throw new Error('Declared cost cannot be negative.');
  if (poolGrams < 0) throw new Error('Mass cannot be negative.');
  const remainingGrams = poolGrams + inGrams;
  const costPaise = poolCostPaise + inCostPaise;
  return { remainingGrams, costPaise, wacPaisePerKg: Math.round(costPaise / (remainingGrams / 1000)) };
}

/** Issue mass FIFO (same sack identity) and cost it at pool WAC.
 * Last line absorbs the paise remainder so issued cost sums exactly. */
function issueAtWac(lots, wantGrams) {
  const live = lots.filter((l) => l.remainingGrams > 0);
  const wacPaisePerKg = weightedAverageCostPaisePerKg(live);
  const fifo = allocateFifo(live, wantGrams);
  const issuedCostPaise = paiseFromKgPrice(wantGrams, wacPaisePerKg);
  let allocated = 0;
  const take = fifo.map((t, i) => {
    const costPaise = i === fifo.length - 1 ? issuedCostPaise - allocated : paiseFromKgPrice(t.qtyGrams, wacPaisePerKg);
    allocated += costPaise;
    return { lotId: t.lotId, qtyGrams: t.qtyGrams, costPaise };
  });
  return { take, wacPaisePerKg, issuedCostPaise };
}

/** Last cell absorbs the paise remainder so the FPO split sums to farmgate. */
function splitQtyWeighted(parts, farmgatePaise) {
  const total = parts.reduce((n, p) => n + p.qtyGrams, 0);
  if (total <= 0) throw new Error('Pool has no mass.');
  if (parts.length === 0) return [];
  let allocated = 0;
  return parts.map((p, i) => {
    const amount = i === parts.length - 1 ? farmgatePaise - allocated : Math.round((farmgatePaise * p.qtyGrams) / total);
    allocated += amount;
    return { cellId: p.cellId, qtyGrams: p.qtyGrams, amountPaise: amount };
  });
}

function parseAcresCenti(raw) {
  const n = Number(String(raw).replace(/,/g, '').trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

/** Declared Langthasa godown master policy. Premium unknown — never invented. */
const LANGTHASA_MASTER_POLICY = 'POL-LANGTHASA-GODOWN';
const CURRENT_SEASON = 'Magh 2026';
const NEXT_SEASON = 'Magh 2027';
const GI_GEO = 'Langthasa, Karbi Anglong';

function evaluateCover(facility, policyId) {
  const named = (policyId ?? '').trim();
  if (named) return { status: 'bound', signal: 'storage.covered', policyId: named };
  if (/langthasa/i.test(facility)) {
    return { status: 'bound', signal: 'storage.covered', policyId: LANGTHASA_MASTER_POLICY };
  }
  return { status: 'gap', signal: 'cover.gap', policyId: null };
}

function kitchenImplies(edges, variety) {
  const v = variety.trim().toLowerCase();
  if (!v) return [];
  return edges.filter((e) => {
    const ev = e.variety.toLowerCase();
    return v.includes(ev) || ev.includes(v) || v.split(/\s+/)[0] === ev.split(/\s+/)[0];
  });
}

function offerNextSeason(qtyGrams, season = CURRENT_SEASON) {
  if (qtyGrams <= 0) throw new Error('Declared quantity is required to offer next season.');
  return { qtyGrams, season: season === CURRENT_SEASON ? NEXT_SEASON : season, pricePaisePerKg: null };
}

function remainingAfterSpoilage(remainingGrams, lossGrams) {
  if (lossGrams <= 0) throw new Error('Declared spoilage kilograms are required.');
  if (remainingGrams < 0) throw new Error('Mass cannot be negative.');
  const left = remainingGrams - lossGrams;
  if (left < 0) throw new Error('Spoilage exceeds remaining mass.');
  return left;
}

function mintGiBirth(input) {
  if (!input.giMarker) return null;
  const handler = input.handler.trim();
  const geo = input.geo.trim();
  if (!handler || !geo) throw new Error('GI mint needs a handler and a geography.');
  return { event: 'mint', handler, geo, season: input.season, seq: 1 };
}

function assertGiClaim(giMarker, mintCount) {
  if (!giMarker) return;
  if (mintCount <= 0) throw new Error('No GI claim without a mint.');
}

function villageSpoilagePost(lossGrams, amountPaise, cause) {
  if (lossGrams <= 0) throw new Error('Declared spoilage kilograms are required.');
  if (amountPaise < 0) throw new Error('Declared loss cannot be negative.');
  return { organId: 'rcop', account: 'spoilage', side: 'debit', amountPaise, qtyGrams: lossGrams, cause };
}

function villageCostPost(kind, amountPaise, qtyGrams, cause) {
  if (amountPaise <= 0) throw new Error('Declared amount is required.');
  if (qtyGrams < 0) throw new Error('Mass cannot be negative.');
  const organId = kind === 'energy' ? 'recie' : kind === 'water' ? 'water' : kind === 'cover' ? 'insurance' : 'logistics';
  return { organId, account: kind, side: 'debit', amountPaise, qtyGrams, cause };
}

function declaredCostPerKg(amountPaise, grams) {
  if (amountPaise <= 0 || grams <= 0) return null;
  return Math.round(amountPaise / (grams / 1000));
}

const LANGTHASA_WEATHER_POLICY = 'POL-LANGTHASA-WEATHER';
const LANGTHASA_HERD_POLICY = 'POL-LANGTHASA-HERD';
const FUS_VERSION = 'FUS-v1';

/** Organism-declared food axes. Not a lab, not an LLM, not a rupee. */
const DECLARED_FUS = {
  chakhao: { nutrition: 78, satiety: 72, taste: 84, culture: 94, convenience: 42 },
  ginger: { nutrition: 62, satiety: 38, taste: 70, culture: 76, convenience: 68 },
};

function fusKey(variety) {
  const s = variety.trim().toLowerCase();
  if (!s) return null;
  if (s.includes('chakhao')) return 'chakhao';
  if (s.includes('ginger')) return 'ginger';
  return null;
}

function foodUtilityScore(axes) {
  const food = [axes.nutrition, axes.satiety, axes.taste, axes.culture, axes.convenience];
  for (const n of food) {
    if (!Number.isFinite(n) || n < 0 || n > 100) throw new Error('FUS axes are declared 0–100.');
  }
  if (axes.affordability != null && (!Number.isFinite(axes.affordability) || axes.affordability < 0 || axes.affordability > 100)) {
    throw new Error('Affordability is declared 0–100 or blank.');
  }
  const parts = axes.affordability == null ? food : [...food, axes.affordability];
  const score = Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
  return { score, complete: axes.affordability != null, version: FUS_VERSION };
}

function fusForVariety(variety) {
  const key = fusKey(variety);
  if (!key) return null;
  const axes = DECLARED_FUS[key];
  if (!axes) return null;
  return foodUtilityScore({ ...axes, affordability: null });
}

function evaluateWeatherCover(village, policyId) {
  const named = (policyId ?? '').trim();
  if (named) return { status: 'bound', signal: 'storage.covered', policyId: named };
  if (/langthasa/i.test(village)) {
    return { status: 'bound', signal: 'storage.covered', policyId: LANGTHASA_WEATHER_POLICY };
  }
  return { status: 'gap', signal: 'cover.gap', policyId: null };
}

function evaluateHerdCover(head, policyId) {
  if (head <= 0) return { status: 'gap', signal: 'cover.gap', policyId: null };
  const named = (policyId ?? '').trim();
  if (named) return { status: 'bound', signal: 'storage.covered', policyId: named };
  return { status: 'bound', signal: 'storage.covered', policyId: LANGTHASA_HERD_POLICY };
}

function weatherReflex(hazard) {
  const named = hazard.trim();
  if (!named) throw new Error('A weather hazard must be declared.');
  return { signal: 'weather.alert', claimWindow: true, moratorium: 'propose', freezeEmi: false, hazard: named };
}

function energyProcessGate(window) {
  if (window.active && window.status === 'outage') {
    return { decision: 'block', reason: 'Active outage. Mill waits. kWh undeclared.' };
  }
  if (window.kwh == null) {
    return { decision: 'defer', reason: 'Window open. kWh still undeclared.' };
  }
  if (window.kwh < 0) throw new Error('Declared kWh cannot be negative.');
  return { decision: 'pass', reason: `Declared ${window.kwh} kWh.` };
}

/** Mill blocks on any declared danger. Signals are named so the clerk can see why. */
function millDecision(input) {
  const signals = [];
  if (input.outage) signals.push('outage');
  if (input.alert) signals.push('alert');
  if (input.iotTempC != null && input.iotTempC >= 31) signals.push('heat');
  if (signals.length) {
    return { decision: 'block', reason: `Mill blocked on ${signals.join(' + ')}. EMI not frozen.`, signals };
  }
  const energy = energyProcessGate({ status: 'ok', kwh: input.kwh, active: false });
  return { decision: energy.decision, reason: energy.reason, signals };
}

function assertDeclaredReading(input) {
  if (!input.entityId.trim()) throw new Error('Sensor entity is required.');
  if (!input.kind.trim()) throw new Error('Reading kind is required.');
  if (!input.unit.trim()) throw new Error('Unit is required.');
  if (!Number.isFinite(input.value)) throw new Error('A clerk must declare the reading.');
}

function schemeEligible(scheme, cell) {
  if (scheme === 'PM-KISAN') {
    const ok = cell.acresCenti > 0;
    return { eligible: ok, amountPaise: null, reason: ok ? 'Acres on the cell. Amount stays undeclared.' : 'No acres on the cell.' };
  }
  if (scheme === 'PMFBY') {
    const ok = cell.plantingCount > 0;
    return { eligible: ok, amountPaise: null, reason: ok ? 'Magh planting on the cell. Premium stays undeclared.' : 'No planted-crop fact.' };
  }
  if (scheme === 'OP-GREEN') {
    const ok = Boolean(cell.horticulture && cell.fpo && cell.perishable);
    return {
      eligible: ok,
      amountPaise: null,
      reason: ok ? 'Operation Green: FPO perishable horticulture. Amount blank.' : 'Operation Green needs FPO + perishable horticulture. Amount blank.',
    };
  }
  if (scheme === 'NE-LOGISTICS') {
    const ok = Boolean(cell.northEast && cell.freightDeclared);
    return {
      eligible: ok,
      amountPaise: null,
      reason: ok ? 'NE logistics policy: declared freight from the North-East. Amount blank.' : 'NE logistics needs a NE village and declared freight. Amount blank.',
    };
  }
  const ok = cell.horticulture;
  return { eligible: ok, amountPaise: null, reason: ok ? 'Horticulture on the cell. Subsidy rupees stay undeclared.' : 'No horticulture crop.' };
}

module.exports = {
  DEFAULT_FREIGHT_PAISE_PER_KG,
  remainingAfterCommit,
  assertCanSell,
  settlementAmounts,
  settlementJournal,
  inputJournal,
  journalBalances,
  allocateFifo,
  weightedAverageCostPaisePerKg,
  intakeWac,
  issueAtWac,
  splitQtyWeighted,
  parseAcresCenti,
  LANGTHASA_MASTER_POLICY,
  CURRENT_SEASON,
  NEXT_SEASON,
  GI_GEO,
  evaluateCover,
  kitchenImplies,
  offerNextSeason,
  remainingAfterSpoilage,
  mintGiBirth,
  assertGiClaim,
  villageSpoilagePost,
  villageCostPost,
  declaredCostPerKg,
  LANGTHASA_WEATHER_POLICY,
  LANGTHASA_HERD_POLICY,
  FUS_VERSION,
  DECLARED_FUS,
  fusKey,
  foodUtilityScore,
  fusForVariety,
  evaluateWeatherCover,
  evaluateHerdCover,
  weatherReflex,
  energyProcessGate,
  millDecision,
  assertDeclaredReading,
  schemeEligible,
};
