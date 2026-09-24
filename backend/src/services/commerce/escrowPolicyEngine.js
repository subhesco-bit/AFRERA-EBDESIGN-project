/**
 * Escrow Policy Engine — rules, holds, release, dispute, refund
 * Integrated with wallet, ERP, trust, business events
 */

'use strict';

const { randomUUID } = require('crypto');

function tryReq(p) {
  try {
    return require(p);
  } catch {
    return null;
  }
}

const wallet = tryReq('./walletService');
const erp = tryReq('../research-grade/erpDoubleEntrySpine');
const trust = tryReq('../trust/trustReputationEngine');
const events = tryReq('../analytics/businessEventBus');
const issues = tryReq('./issueResolutionWorkflow');

/** Policy catalog — versioned, effective rules */
const POLICIES = {
  standard_marketplace: {
    id: 'standard_marketplace',
    version: '2026.09',
    hold_pct: 1.0,
    auto_release_days: 7,
    inspect_window_days: 3,
    partial_release_allowed: true,
    dispute_window_days: 14,
    max_dispute_cycles: 2,
    release_requires: ['delivery_confirmed'],
    refund_on_seller_fault: true,
    refund_on_buyer_fault: false,
    platform_fee_on_release_pct: 0.02,
  },
  preseason: {
    id: 'preseason',
    version: '2026.09',
    hold_pct: 0.2,
    auto_release_days: 120,
    inspect_window_days: 7,
    partial_release_allowed: true,
    dispute_window_days: 30,
    max_dispute_cycles: 3,
    release_requires: ['delivery_confirmed', 'quality_pass'],
    refund_on_seller_fault: true,
    refund_on_buyer_fault: false,
    platform_fee_on_release_pct: 0.015,
  },
  b2b_institutional: {
    id: 'b2b_institutional',
    version: '2026.09',
    hold_pct: 1.0,
    auto_release_days: 15,
    inspect_window_days: 5,
    partial_release_allowed: true,
    dispute_window_days: 21,
    max_dispute_cycles: 2,
    release_requires: ['delivery_confirmed', 'three_way_match'],
    refund_on_seller_fault: true,
    refund_on_buyer_fault: false,
    platform_fee_on_release_pct: 0.01,
  },
};

const ESCROW_STATES = {
  created: ['funded', 'cancelled'],
  funded: ['held', 'cancelled'],
  held: ['release_pending', 'disputed', 'partial_released', 'cancelled'],
  release_pending: ['released', 'disputed'],
  partial_released: ['release_pending', 'released', 'disputed'],
  disputed: ['held', 'released', 'refunded', 'arbitration'],
  arbitration: ['released', 'refunded', 'split'],
  released: [],
  refunded: [],
  split: [],
  cancelled: [],
};

const escrows = new Map();

function getPolicy(name) {
  return POLICIES[name] || POLICIES.standard_marketplace;
}

function listPolicies() {
  return { policies: Object.values(POLICIES) };
}

function createEscrow(data = {}) {
  const policy = getPolicy(data.policy || 'standard_marketplace');
  const amount = Number(data.amount) || 0;
  if (!(amount > 0)) {
    const err = new Error('Escrow amount must be > 0');
    err.code = 'ESCROW_AMOUNT';
    throw err;
  }
  const id = data.escrow_id || `ESC-${randomUUID().slice(0, 8)}`;
  const holdAmount = Math.round(amount * policy.hold_pct * 100) / 100;
  const rec = {
    escrow_id: id,
    policy_id: policy.id,
    policy_version: policy.version,
    state: 'created',
    amount,
    held_amount: 0,
    released_amount: 0,
    refunded_amount: 0,
    hold_target: holdAmount,
    currency: 'INR',
    payer_id: data.payer_id || data.buyer_id,
    payee_id: data.payee_id || data.seller_id,
    order_id: data.order_id || null,
    preseason_order_id: data.preseason_order_id || null,
    layer: 'ecommerce',
    conditions: {
      delivery_confirmed: false,
      quality_pass: false,
      three_way_match: false,
    },
    dispute_id: null,
    dispute_cycles: 0,
    history: [{ state: 'created', at: new Date().toISOString(), event: 'create' }],
    created_at: new Date().toISOString(),
    auto_release_at: new Date(
      Date.now() + policy.auto_release_days * 86400000,
    ).toISOString(),
  };
  escrows.set(id, rec);
  if (events) events.emit('escrow.created', { escrow_id: id, amount }, { source: 'escrowPolicy' });
  return { escrow: rec, policy };
}

function transition(rec, to, event = {}) {
  const allowed = ESCROW_STATES[rec.state] || [];
  if (!allowed.includes(to)) {
    const err = new Error(`Invalid escrow transition ${rec.state} → ${to}`);
    err.code = 'ESCROW_INVALID_TRANSITION';
    err.allowed = allowed;
    throw err;
  }
  const from = rec.state;
  rec.state = to;
  rec.history.push({
    from,
    state: to,
    at: new Date().toISOString(),
    event: event.type || 'transition',
    actor: event.actor || 'system',
  });
}

/** Fund + hold via wallet */
function fund(escrow_id, opts = {}) {
  const rec = escrows.get(escrow_id);
  if (!rec) {
    const err = new Error('Escrow not found');
    err.code = 'ESCROW_NOT_FOUND';
    throw err;
  }
  if (rec.state === 'created') transition(rec, 'funded', { type: 'fund' });

  if (wallet && rec.payer_id) {
    try {
      // Ensure balance path: caller may pre-credit; we only hold
      wallet.hold(rec.payer_id, rec.hold_target, {
        ref: rec.escrow_id,
        hold_id: `HLD-${rec.escrow_id}`,
      });
    } catch (e) {
      if (e.code === 'WALLET_INSUFFICIENT' && opts.auto_credit) {
        wallet.credit(rec.payer_id, rec.hold_target, { reason: 'escrow_fund' });
        wallet.hold(rec.payer_id, rec.hold_target, { ref: rec.escrow_id });
      } else {
        throw e;
      }
    }
  }
  rec.held_amount = rec.hold_target;
  transition(rec, 'held', { type: 'hold' });

  if (erp) {
    try {
      erp.postJournal({
        memo: `Escrow hold ${rec.escrow_id}`,
        lines: [
          { account: '1000', debit: rec.held_amount, credit: 0 },
          { account: '2000', debit: 0, credit: rec.held_amount },
        ],
        actor: 'escrow_policy',
      });
    } catch {
      /* optional */
    }
  }
  if (events) events.emit('escrow.held', { escrow_id, amount: rec.held_amount }, { source: 'escrowPolicy' });
  return { escrow: rec };
}

function setCondition(escrow_id, key, value = true) {
  const rec = escrows.get(escrow_id);
  if (!rec) {
    const err = new Error('Escrow not found');
    err.code = 'ESCROW_NOT_FOUND';
    throw err;
  }
  if (!(key in rec.conditions)) {
    const err = new Error(`Unknown condition ${key}`);
    err.code = 'ESCROW_CONDITION';
    throw err;
  }
  rec.conditions[key] = !!value;
  return { escrow: rec };
}

function policyReady(rec) {
  const policy = getPolicy(rec.policy_id);
  const missing = (policy.release_requires || []).filter((k) => !rec.conditions[k]);
  return { ready: missing.length === 0, missing, policy };
}

function requestRelease(escrow_id, opts = {}) {
  const rec = escrows.get(escrow_id);
  if (!rec) {
    const err = new Error('Escrow not found');
    err.code = 'ESCROW_NOT_FOUND';
    throw err;
  }
  const { ready, missing, policy } = policyReady(rec);
  if (!ready && !opts.force) {
    const err = new Error(`Release blocked — missing conditions: ${missing.join(', ')}`);
    err.code = 'ESCROW_POLICY_BLOCK';
    err.missing = missing;
    throw err;
  }
  if (rec.state === 'held' || rec.state === 'partial_released') {
    transition(rec, 'release_pending', { type: 'request_release', actor: opts.actor });
  }
  return { escrow: rec, policy_ready: ready, missing };
}

function release(escrow_id, opts = {}) {
  const rec = escrows.get(escrow_id);
  if (!rec) {
    const err = new Error('Escrow not found');
    err.code = 'ESCROW_NOT_FOUND';
    throw err;
  }
  const policy = getPolicy(rec.policy_id);
  const { ready, missing } = policyReady(rec);
  if (!ready && !opts.force) {
    const err = new Error(`Release blocked — missing: ${missing.join(', ')}`);
    err.code = 'ESCROW_POLICY_BLOCK';
    err.missing = missing;
    throw err;
  }

  let amount = opts.amount != null ? Number(opts.amount) : rec.held_amount - rec.released_amount;
  amount = Math.min(amount, rec.held_amount - rec.released_amount);
  if (!(amount > 0)) {
    const err = new Error('Nothing to release');
    err.code = 'ESCROW_AMOUNT';
    throw err;
  }

  const fee = Math.round(amount * policy.platform_fee_on_release_pct * 100) / 100;
  const toSeller = Math.round((amount - fee) * 100) / 100;

  if (wallet && rec.payer_id) {
    try {
      wallet.captureHold(rec.payer_id, amount, { ref: rec.escrow_id });
    } catch {
      /* hold may already be captured in alternate path */
    }
  }
  if (wallet && rec.payee_id && toSeller > 0) {
    wallet.credit(rec.payee_id, toSeller, { reason: 'escrow_release', ref: rec.escrow_id });
  }

  rec.released_amount += amount;
  rec.held_amount = Math.max(0, rec.held_amount - amount);

  if (rec.state === 'release_pending' || rec.state === 'held' || rec.state === 'partial_released') {
    if (rec.held_amount <= 0.001) transition(rec, 'released', { type: 'release', actor: opts.actor });
    else transition(rec, 'partial_released', { type: 'partial_release', actor: opts.actor });
  }

  if (trust && rec.payee_id) {
    trust.recordEvent(rec.payee_id, { kind: 'tx_complete', type: 'seller' });
  }
  if (events) {
    events.emit(
      'escrow.released',
      { escrow_id, amount, fee, to_seller: toSeller },
      { source: 'escrowPolicy' },
    );
  }

  return {
    escrow: rec,
    released: amount,
    platform_fee: fee,
    to_seller: toSeller,
    confidence: 1,
  };
}

function refund(escrow_id, opts = {}) {
  const rec = escrows.get(escrow_id);
  if (!rec) {
    const err = new Error('Escrow not found');
    err.code = 'ESCROW_NOT_FOUND';
    throw err;
  }
  const amount =
    opts.amount != null
      ? Number(opts.amount)
      : rec.held_amount - rec.released_amount;
  const amt = Math.min(amount, Math.max(0, rec.held_amount - rec.released_amount + (opts.include_released ? 0 : 0)));
  if (wallet && rec.payer_id) {
    try {
      wallet.releaseHold(rec.payer_id, amt, { ref: rec.escrow_id });
    } catch {
      wallet.refund(rec.payer_id, amt, { reason: 'escrow_refund', ref: rec.escrow_id });
    }
  }
  rec.refunded_amount += amt;
  rec.held_amount = Math.max(0, rec.held_amount - amt);
  if (rec.state !== 'refunded') transition(rec, 'refunded', { type: 'refund', actor: opts.actor });
  if (trust && opts.fault === 'seller' && rec.payee_id) {
    trust.recordEvent(rec.payee_id, { kind: 'tx_dispute', type: 'seller' });
  }
  if (events) events.emit('escrow.refunded', { escrow_id, amount: amt }, { source: 'escrowPolicy' });
  return { escrow: rec, refunded: amt };
}

/** Open dispute → issue workflow */
async function openDispute(escrow_id, data = {}) {
  const rec = escrows.get(escrow_id);
  if (!rec) {
    const err = new Error('Escrow not found');
    err.code = 'ESCROW_NOT_FOUND';
    throw err;
  }
  const policy = getPolicy(rec.policy_id);
  if (rec.dispute_cycles >= policy.max_dispute_cycles) {
    const err = new Error('Max dispute cycles reached — escalate arbitration');
    err.code = 'ESCROW_DISPUTE_LIMIT';
    throw err;
  }
  if (rec.state === 'held' || rec.state === 'release_pending' || rec.state === 'partial_released') {
    transition(rec, 'disputed', { type: 'dispute', actor: data.actor });
  }
  rec.dispute_cycles += 1;

  let issue = null;
  if (issues) {
    issue = issues.create({
      type: 'escrow_dispute',
      escrow_id,
      order_id: rec.order_id,
      raised_by: data.raised_by || data.actor,
      against: data.against,
      reason: data.reason || 'dispute',
      amount: rec.held_amount,
      evidence: data.evidence || [],
    });
    rec.dispute_id = issue.issue_id;
  } else {
    rec.dispute_id = `DSP-${randomUUID().slice(0, 8)}`;
  }

  if (trust && data.against) {
    trust.recordEvent(data.against, { kind: 'tx_dispute', type: 'seller' });
  }
  if (events) {
    events.emit('escrow.disputed', { escrow_id, dispute_id: rec.dispute_id }, { source: 'escrowPolicy' });
  }
  return { escrow: rec, issue };
}

function resolveDispute(escrow_id, resolution = {}) {
  const rec = escrows.get(escrow_id);
  if (!rec) {
    const err = new Error('Escrow not found');
    err.code = 'ESCROW_NOT_FOUND';
    throw err;
  }
  const outcome = resolution.outcome || 'release'; // release | refund | split
  if (outcome === 'release') {
    if (rec.state === 'disputed' || rec.state === 'arbitration') {
      transition(rec, 'held', { type: 'dispute_resolved_release' });
    }
    rec.conditions.delivery_confirmed = true;
    rec.conditions.quality_pass = true;
    return release(escrow_id, { force: true, actor: resolution.actor });
  }
  if (outcome === 'refund') {
    return refund(escrow_id, { actor: resolution.actor, fault: resolution.fault || 'seller' });
  }
  if (outcome === 'split') {
    const sellerPct = Number(resolution.seller_pct) != null ? Number(resolution.seller_pct) : 0.5;
    const remaining = rec.held_amount - rec.released_amount;
    const toSeller = Math.round(remaining * sellerPct * 100) / 100;
    const toBuyer = Math.round((remaining - toSeller) * 100) / 100;
    if (toSeller > 0) {
      rec.conditions.delivery_confirmed = true;
      release(escrow_id, { amount: toSeller, force: true, actor: resolution.actor });
    }
    if (toBuyer > 0) refund(escrow_id, { amount: toBuyer, actor: resolution.actor });
    if (rec.state !== 'split' && rec.state !== 'released' && rec.state !== 'refunded') {
      try {
        transition(rec, 'split', { type: 'split' });
      } catch {
        /* already terminal */
      }
    }
    return { escrow: rec, to_seller: toSeller, to_buyer: toBuyer, outcome: 'split' };
  }
  const err = new Error(`Unknown outcome ${outcome}`);
  err.code = 'ESCROW_OUTCOME';
  throw err;
}

function get(id) {
  return escrows.get(id) || null;
}

function list(filter = {}) {
  let all = [...escrows.values()];
  if (filter.state) all = all.filter((e) => e.state === filter.state);
  if (filter.order_id) all = all.filter((e) => e.order_id === filter.order_id);
  return all;
}

async function operate(data = {}) {
  const action = data.action || 'list';
  switch (action) {
    case 'policies':
      return listPolicies();
    case 'create':
      return createEscrow(data);
    case 'fund':
      return fund(data.escrow_id, data);
    case 'condition':
      return setCondition(data.escrow_id, data.key, data.value);
    case 'request_release':
      return requestRelease(data.escrow_id, data);
    case 'release':
      return release(data.escrow_id, data);
    case 'refund':
      return refund(data.escrow_id, data);
    case 'dispute':
      return openDispute(data.escrow_id, data);
    case 'resolve':
      return resolveDispute(data.escrow_id, data);
    case 'get':
      return { escrow: get(data.escrow_id) };
    case 'list':
      return { escrows: list(data) };
    case 'policy_check': {
      const rec = get(data.escrow_id);
      if (!rec) return { error: 'not_found' };
      return { escrow_id: rec.escrow_id, ...policyReady(rec) };
    }
    default:
      return { error: 'Unknown action', action };
  }
}

module.exports = {
  operate,
  createEscrow,
  fund,
  setCondition,
  requestRelease,
  release,
  refund,
  openDispute,
  resolveDispute,
  get,
  list,
  getPolicy,
  listPolicies,
  POLICIES,
  ESCROW_STATES,
};
