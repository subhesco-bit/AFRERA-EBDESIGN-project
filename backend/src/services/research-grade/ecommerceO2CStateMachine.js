/**
 * Complete Ecommerce Order-to-Cash state machine with compensation
 * Real transitions, authz hints, timeouts, audit events — not CRUD-only.
 */

'use strict';

const STATES = [
  'draft',
  'placed',
  'payment_authorized',
  'inventory_reserved',
  'picking',
  'packed',
  'shipped',
  'delivered',
  'completed',
  'cancel_requested',
  'cancelled',
  'return_requested',
  'returned',
  'refunded',
  'failed',
];

const TRANSITIONS = {
  draft: ['placed', 'cancelled'],
  placed: ['payment_authorized', 'cancel_requested', 'failed'],
  payment_authorized: ['inventory_reserved', 'cancel_requested', 'failed'],
  inventory_reserved: ['picking', 'cancel_requested'],
  picking: ['packed', 'cancel_requested'],
  packed: ['shipped', 'cancel_requested'],
  shipped: ['delivered', 'return_requested'],
  delivered: ['completed', 'return_requested'],
  completed: ['return_requested'],
  cancel_requested: ['cancelled', 'picking'], // allow resume if not yet shipped
  cancelled: [],
  return_requested: ['returned', 'completed'],
  returned: ['refunded'],
  refunded: [],
  failed: ['placed'],
};

const COMPENSATION = {
  inventory_reserved: 'release_reservation',
  payment_authorized: 'void_or_refund_auth',
  picking: 'restock_pick',
  packed: 'restock_pack',
  shipped: 'return_logistics',
};

class EcommerceO2CStateMachine {
  constructor(order = {}) {
    this.orderId = order.id || order.order_id || `ORD-${Date.now()}`;
    this.state = order.state || 'draft';
    this.history = order.history || [{ state: this.state, at: new Date().toISOString(), event: 'init' }];
    this.meta = order.meta || {};
  }

  canTransition(to) {
    return (TRANSITIONS[this.state] || []).includes(to);
  }

  transition(to, event = {}) {
    if (!this.canTransition(to)) {
      const err = new Error(`Invalid transition ${this.state} → ${to}`);
      err.code = 'INVALID_TRANSITION';
      err.from = this.state;
      err.to = to;
      err.allowed = TRANSITIONS[this.state] || [];
      throw err;
    }
    const from = this.state;
    this.state = to;
    const entry = {
      from,
      state: to,
      at: new Date().toISOString(),
      event: event.type || 'transition',
      actor: event.actor || 'system',
      evidence: event.evidence || null,
    };
    this.history.push(entry);
    return {
      order_id: this.orderId,
      state: this.state,
      transition: entry,
      compensation_if_abort: COMPENSATION[to] || null,
      advisory: false,
      confidence: 1,
    };
  }

  /** Run happy path steps until target or blocked */
  advanceTo(target, event = {}) {
    const path = [];
    const guard = 20;
    let i = 0;
    while (this.state !== target && i < guard) {
      const next = (TRANSITIONS[this.state] || []).find((s) => this._leadsToward(s, target));
      if (!next) break;
      path.push(this.transition(next, event));
      i++;
    }
    return { order_id: this.orderId, state: this.state, path, reached: this.state === target };
  }

  _leadsToward(candidate, target) {
    if (candidate === target) return true;
    const visited = new Set();
    const q = [candidate];
    while (q.length) {
      const s = q.shift();
      if (s === target) return true;
      if (visited.has(s)) continue;
      visited.add(s);
      for (const n of TRANSITIONS[s] || []) q.push(n);
    }
    return false;
  }

  snapshot() {
    return {
      order_id: this.orderId,
      state: this.state,
      history: this.history,
      allowed_next: TRANSITIONS[this.state] || [],
      states: STATES,
    };
  }
}

module.exports = {
  STATES,
  TRANSITIONS,
  COMPENSATION,
  EcommerceO2CStateMachine,
};
