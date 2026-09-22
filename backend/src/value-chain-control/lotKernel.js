/**
 * Lattice lot kernel — mass in grams, money in paise.
 * Never invent remaining, price, freight, or cost.
 *
 * Identity of the sack is FIFO remaining grams.
 * Weighted average cost blends declared remaining rupees, not the body.
 */

'use strict';

function assertNonNeg(value, name) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`${name} cannot be negative.`);
  }
  return n;
}

function paiseFromKgPrice(grams, paisePerKg) {
  const g = assertNonNeg(grams, 'grams');
  const p = Number(paisePerKg);
  if (!Number.isFinite(p)) throw new Error('paisePerKg is required.');
  return Math.round((g * p) / 1000);
}

function remainingAfterCommit(mintedGrams, committedGrams) {
  const minted = assertNonNeg(mintedGrams, 'mintedGrams');
  const committed = assertNonNeg(committedGrams, 'committedGrams');
  const left = minted - committed;
  if (left < 0) throw new Error('Committed mass exceeds the lot body.');
  return left;
}

function remainingAfterSpoilage(remainingGrams, lossGrams) {
  if (!(Number(lossGrams) > 0)) throw new Error('Declared spoilage kilograms are required.');
  return remainingAfterCommit(remainingGrams, lossGrams);
}

function allocateFifo(lots, wantGrams) {
  const want = Number(wantGrams);
  if (!(want > 0)) throw new Error('Declared quantity is required.');
  if (!Array.isArray(lots)) throw new Error('lots array required');
  const out = [];
  let left = want;
  for (const lot of lots) {
    if (left <= 0) break;
    const remaining = assertNonNeg(lot.remainingGrams ?? lot.remaining_grams ?? 0, 'remainingGrams');
    if (remaining <= 0) continue;
    const take = Math.min(remaining, left);
    out.push({ lotId: lot.id || lot.lotId, qtyGrams: take });
    left -= take;
  }
  if (left > 0) throw new Error('Not enough remaining mass in the godown.');
  return out;
}

function weightedAverageCostPaisePerKg(lots) {
  if (!Array.isArray(lots) || lots.length === 0) throw new Error('Pool has no mass.');
  let grams = 0;
  let paise = 0;
  for (const lot of lots) {
    const g = assertNonNeg(lot.remainingGrams ?? lot.remaining_grams ?? 0, 'remainingGrams');
    const c = Number(lot.costPaise ?? lot.cost_paise);
    if (!Number.isFinite(c) || c < 0) {
      throw new Error('WAC needs a declared remaining cost. Never invent ₹.');
    }
    grams += g;
    paise += c;
  }
  if (grams <= 0) throw new Error('Pool has no mass.');
  return Math.round(paise / (grams / 1000));
}

function intakeWac(poolGrams, poolCostPaise, inGrams, inCostPaise) {
  if (!(Number(inGrams) > 0)) throw new Error('Declared quantity is required.');
  const poolG = assertNonNeg(poolGrams, 'poolGrams');
  const poolC = assertNonNeg(poolCostPaise, 'poolCostPaise');
  const inG = Number(inGrams);
  const inC = assertNonNeg(inCostPaise, 'inCostPaise');
  const remainingGrams = poolG + inG;
  const costPaise = poolC + inC;
  return {
    remainingGrams,
    costPaise,
    wacPaisePerKg: Math.round(costPaise / (remainingGrams / 1000)),
  };
}

function issueAtWac(lots, wantGrams) {
  const live = (lots || []).filter((l) => (l.remainingGrams ?? l.remaining_grams ?? 0) > 0);
  const wacPaisePerKg = weightedAverageCostPaisePerKg(live);
  const fifo = allocateFifo(live, wantGrams);
  const issuedCostPaise = paiseFromKgPrice(wantGrams, wacPaisePerKg);
  let allocated = 0;
  const take = fifo.map((t, i) => {
    const costPaise =
      i === fifo.length - 1 ? issuedCostPaise - allocated : paiseFromKgPrice(t.qtyGrams, wacPaisePerKg);
    allocated += costPaise;
    return { lotId: t.lotId, qtyGrams: t.qtyGrams, costPaise };
  });
  return { take, wacPaisePerKg, issuedCostPaise };
}

function splitQtyWeighted(parts, farmgatePaise) {
  if (!Array.isArray(parts) || parts.length === 0) throw new Error('Pool has no mass.');
  const total = parts.reduce((n, p) => n + Number(p.qtyGrams || 0), 0);
  if (!(total > 0)) throw new Error('Pool has no mass.');
  const farmgate = assertNonNeg(farmgatePaise, 'farmgatePaise');
  let allocated = 0;
  return parts.map((p, i) => {
    const qtyGrams = Number(p.qtyGrams);
    const amountPaise =
      i === parts.length - 1 ? farmgate - allocated : Math.round((farmgate * qtyGrams) / total);
    allocated += amountPaise;
    return { cellId: p.cellId, qtyGrams, amountPaise };
  });
}

function settlementAmounts(qtyGrams, pricePaisePerKg, freightPaisePerKg) {
  if (!(Number(qtyGrams) > 0)) throw new Error('Declared quantity is required.');
  if (!(Number(pricePaisePerKg) > 0)) throw new Error('salePricePerUnit is required — never invented.');
  const freightRate = assertNonNeg(freightPaisePerKg ?? 0, 'freightPaisePerKg');
  const gross = paiseFromKgPrice(qtyGrams, pricePaisePerKg);
  const freight = paiseFromKgPrice(qtyGrams, freightRate);
  if (freight > gross) throw new Error('Declared freight exceeds declared sale.');
  return { gross, freight, farmgate: gross - freight };
}

function journalBalances(lines) {
  if (!Array.isArray(lines) || lines.length === 0) return false;
  const debit = lines.filter((l) => l.side === 'debit').reduce((n, l) => n + Number(l.amountPaise), 0);
  const credit = lines.filter((l) => l.side === 'credit').reduce((n, l) => n + Number(l.amountPaise), 0);
  return debit === credit && debit > 0;
}

function settlementJournal({ variety, hoursToPay, gross, freight, farmgate }) {
  return [
    { organId: 'rupee', account: 'cash', side: 'debit', amountPaise: gross, memo: `Settled ${variety} @ declared price` },
    { organId: 'rupee', account: 'farmgate', side: 'credit', amountPaise: farmgate, memo: `Farmgate to cell · ${hoursToPay}h to pay` },
    { organId: 'logistics', account: 'freight', side: 'credit', amountPaise: freight, memo: 'Freight deduction, declared' },
  ];
}

module.exports = {
  paiseFromKgPrice,
  remainingAfterCommit,
  remainingAfterSpoilage,
  allocateFifo,
  weightedAverageCostPaisePerKg,
  intakeWac,
  issueAtWac,
  splitQtyWeighted,
  settlementAmounts,
  journalBalances,
  settlementJournal,
};
