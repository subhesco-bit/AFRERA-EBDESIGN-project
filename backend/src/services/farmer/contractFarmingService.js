/**
 * Contract farming — Farmer layer agreements with buyer/processor
 * Links to preseason purchase & settlement; not ecommerce retail cart.
 */

'use strict';

const { randomUUID } = require('crypto');

const STATES = [
  'draft',
  'offered',
  'accepted',
  'active',
  'delivery_pending',
  'delivered',
  'settled',
  'disputed',
  'closed',
  'cancelled',
];

const TRANSITIONS = {
  draft: ['offered', 'cancelled'],
  offered: ['accepted', 'cancelled'],
  accepted: ['active', 'cancelled'],
  active: ['delivery_pending', 'disputed', 'cancelled'],
  delivery_pending: ['delivered', 'disputed'],
  delivered: ['settled', 'disputed'],
  settled: ['closed'],
  disputed: ['active', 'settled', 'closed'],
  closed: [],
  cancelled: [],
};

const contracts = new Map();

function create(data = {}) {
  const id = data.contract_id || `CF-${randomUUID().slice(0, 8)}`;
  const rec = {
    contract_id: id,
    layer: 'farmer',
    state: 'draft',
    farmer_id: data.farmer_id || null,
    buyer_id: data.buyer_id || null,
    crop: data.crop || 'wheat',
    area_ha: Number(data.area_ha) || 0,
    expected_qty_kg: Number(data.expected_qty_kg) || 0,
    price_inr_per_kg: Number(data.price_inr_per_kg) || 0,
    price_type: data.price_type || 'fixed', // fixed | floor_plus_mandi | preseason_dynamic
    season: data.season || 'rabi',
    year: data.year || new Date().getFullYear(),
    quality_specs: data.quality_specs || {},
    advance_inr: Number(data.advance_inr) || 0,
    preseason_order_id: data.preseason_order_id || null,
    history: [{ state: 'draft', at: new Date().toISOString(), event: 'create' }],
    created_at: new Date().toISOString(),
  };
  contracts.set(id, rec);
  return rec;
}

function transition(contract_id, to, event = {}) {
  const rec = contracts.get(contract_id);
  if (!rec) {
    const err = new Error('Contract not found');
    err.code = 'CF_NOT_FOUND';
    throw err;
  }
  if (!(TRANSITIONS[rec.state] || []).includes(to)) {
    const err = new Error(`Invalid CF transition ${rec.state} → ${to}`);
    err.code = 'CF_INVALID_TRANSITION';
    err.allowed = TRANSITIONS[rec.state];
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
  return rec;
}

function get(id) {
  return contracts.get(id) || null;
}

function list(filter = {}) {
  let all = [...contracts.values()];
  if (filter.farmer_id) all = all.filter((c) => c.farmer_id === filter.farmer_id);
  if (filter.state) all = all.filter((c) => c.state === filter.state);
  return all;
}

async function operate(data = {}) {
  const action = data.action || 'list';
  if (action === 'create') return { contract: create(data) };
  if (action === 'transition') return { contract: transition(data.contract_id, data.to, data.event) };
  if (action === 'get') return { contract: get(data.contract_id) };
  if (action === 'list') return { contracts: list(data) };
  return { error: 'Unknown action', action };
}

module.exports = {
  operate,
  create,
  transition,
  get,
  list,
  STATES,
  TRANSITIONS,
};
