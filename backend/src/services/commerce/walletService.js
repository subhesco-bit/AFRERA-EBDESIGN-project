/**
 * Wallet payments — Ecommerce / platform settlement layer
 * Hold → capture for checkout; refunds; not a bank / PPI license claim.
 */

'use strict';

const { randomUUID } = require('crypto');

const wallets = new Map();
const ledger = [];

function getOrCreate(owner_id, owner_type = 'buyer') {
  if (!wallets.has(owner_id)) {
    wallets.set(owner_id, {
      owner_id,
      owner_type,
      balance: 0,
      held: 0,
      currency: 'INR',
      layer: owner_type === 'farmer' ? 'farmer' : 'ecommerce',
      updated_at: new Date().toISOString(),
    });
  }
  return wallets.get(owner_id);
}

function available(w) {
  return Math.max(0, (w.balance || 0) - (w.held || 0));
}

function post(entry) {
  const row = {
    id: `WL-${randomUUID().slice(0, 8)}`,
    at: new Date().toISOString(),
    ...entry,
  };
  ledger.push(row);
  return row;
}

function credit(owner_id, amount, meta = {}) {
  const w = getOrCreate(owner_id, meta.owner_type);
  const amt = Number(amount);
  if (!(amt > 0)) {
    const err = new Error('Credit amount must be > 0');
    err.code = 'WALLET_AMOUNT';
    throw err;
  }
  w.balance += amt;
  w.updated_at = new Date().toISOString();
  return {
    wallet: { ...w, available: available(w) },
    entry: post({ owner_id, type: 'credit', amount: amt, ...meta }),
  };
}

function hold(owner_id, amount, meta = {}) {
  const w = getOrCreate(owner_id, meta.owner_type);
  const amt = Number(amount);
  if (available(w) < amt) {
    const err = new Error(`Insufficient wallet available ${available(w)} < ${amt}`);
    err.code = 'WALLET_INSUFFICIENT';
    throw err;
  }
  w.held += amt;
  w.updated_at = new Date().toISOString();
  return {
    wallet: { ...w, available: available(w) },
    hold_id: meta.hold_id || `HLD-${Date.now()}`,
    entry: post({ owner_id, type: 'hold', amount: amt, hold_id: meta.hold_id, ref: meta.ref }),
  };
}

function captureHold(owner_id, amount, meta = {}) {
  const w = getOrCreate(owner_id);
  const amt = Number(amount);
  if (w.held < amt) {
    const err = new Error('Hold amount exceeds held balance');
    err.code = 'WALLET_HOLD';
    throw err;
  }
  w.held -= amt;
  w.balance -= amt;
  w.updated_at = new Date().toISOString();
  return {
    wallet: { ...w, available: available(w) },
    entry: post({ owner_id, type: 'capture', amount: amt, ref: meta.ref }),
  };
}

function releaseHold(owner_id, amount, meta = {}) {
  const w = getOrCreate(owner_id);
  const amt = Math.min(Number(amount), w.held);
  w.held -= amt;
  w.updated_at = new Date().toISOString();
  return {
    wallet: { ...w, available: available(w) },
    entry: post({ owner_id, type: 'release_hold', amount: amt, ref: meta.ref }),
  };
}

function refund(owner_id, amount, meta = {}) {
  return credit(owner_id, amount, { ...meta, reason: meta.reason || 'refund' });
}

function snapshot(owner_id) {
  const w = getOrCreate(owner_id);
  return { ...w, available: available(w) };
}

function history(owner_id, limit = 50) {
  return ledger.filter((e) => e.owner_id === owner_id).slice(-limit);
}

async function operate(data = {}) {
  const action = data.action || 'snapshot';
  switch (action) {
    case 'credit':
      return credit(data.owner_id, data.amount, data);
    case 'hold':
      return hold(data.owner_id, data.amount, data);
    case 'capture':
      return captureHold(data.owner_id, data.amount, data);
    case 'release_hold':
      return releaseHold(data.owner_id, data.amount, data);
    case 'refund':
      return refund(data.owner_id, data.amount, data);
    case 'snapshot':
      return { wallet: snapshot(data.owner_id) };
    case 'history':
      return { entries: history(data.owner_id, data.limit) };
    default:
      return { error: 'Unknown wallet action', action };
  }
}

module.exports = {
  operate,
  credit,
  hold,
  captureHold,
  releaseHold,
  refund,
  snapshot,
  history,
  getOrCreate,
};
