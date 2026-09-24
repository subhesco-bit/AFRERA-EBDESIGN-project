/**
 * ERP controls extension — three-way match + period close (baseline P1-7)
 */

'use strict';

const spine = require('./erpDoubleEntrySpine');

const periods = new Map(); // key YYYY-MM → { status: open|closed }
const matchStore = new Map();

function periodKey(d = new Date()) {
  const x = typeof d === 'string' ? new Date(d) : d;
  return `${x.getUTCFullYear()}-${String(x.getUTCMonth() + 1).padStart(2, '0')}`;
}

function ensurePeriod(key) {
  if (!periods.has(key)) periods.set(key, { period: key, status: 'open' });
  return periods.get(key);
}

/** Three-way match: PO vs GRN vs Invoice */
function threeWayMatch(data = {}) {
  const po = Number(data.po_amount) || 0;
  const grn = Number(data.grn_amount) || 0;
  const inv = Number(data.invoice_amount) || 0;
  const tol = Number(data.tolerance_pct) != null ? Number(data.tolerance_pct) : 0.02;
  const base = Math.max(po, 1);
  const grn_ok = Math.abs(grn - po) / base <= tol;
  const inv_ok = Math.abs(inv - grn) / Math.max(grn, 1) <= tol;
  const matched = grn_ok && inv_ok;
  const id = `3WM-${Date.now()}`;
  const rec = {
    match_id: id,
    po_amount: po,
    grn_amount: grn,
    invoice_amount: inv,
    tolerance_pct: tol,
    grn_ok,
    inv_ok,
    matched,
    at: new Date().toISOString(),
  };
  matchStore.set(id, rec);
  return {
    ...rec,
    confidence: 1,
    safety_floor: 'Match result is control evidence — payment release still requires policy approval.',
  };
}

function closePeriod(period) {
  const key = period || periodKey();
  const p = ensurePeriod(key);
  if (p.status === 'closed') {
    return { ...p, message: 'Already closed' };
  }
  p.status = 'closed';
  p.closed_at = new Date().toISOString();
  return {
    ...p,
    trial_balance: spine.trialBalance(),
    confidence: 1,
    safety_floor: 'Period close is logical lock in this spine — production needs posting freeze in DB.',
  };
}

function openPeriod(period) {
  const key = period || periodKey();
  const p = ensurePeriod(key);
  p.status = 'open';
  p.reopened_at = new Date().toISOString();
  return p;
}

function assertPeriodOpen(date) {
  const p = ensurePeriod(periodKey(date));
  if (p.status === 'closed') {
    const err = new Error(`Period ${p.period} is closed`);
    err.code = 'PERIOD_CLOSED';
    throw err;
  }
  return p;
}

function postJournalGuarded(data) {
  assertPeriodOpen(data.date || new Date());
  return spine.postJournal(data);
}

async function operate(data = {}) {
  const action = data.action || 'three_way_match';
  if (action === 'three_way_match') return threeWayMatch(data);
  if (action === 'close_period') return closePeriod(data.period);
  if (action === 'open_period') return openPeriod(data.period);
  if (action === 'post_journal') return postJournalGuarded(data);
  if (action === 'trial_balance') return spine.trialBalance();
  if (action === 'coa') return { coa: spine.COA };
  return { error: 'Unknown action' };
}

module.exports = {
  threeWayMatch,
  closePeriod,
  openPeriod,
  postJournalGuarded,
  operate,
  assertPeriodOpen,
};
