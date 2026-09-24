/**
 * Returns / RMA state machine — Ecommerce layer only
 * Separate from O2C forward path; compensation-aware.
 */

'use strict';

const RMA_STATES = [
  'requested',
  'approved',
  'rejected',
  'label_issued',
  'in_transit_back',
  'received',
  'qc_pass',
  'qc_fail',
  'refund_pending',
  'refunded',
  'exchange_pending',
  'closed',
];

const RMA_TRANSITIONS = {
  requested: ['approved', 'rejected'],
  approved: ['label_issued', 'rejected'],
  rejected: ['closed'],
  label_issued: ['in_transit_back', 'closed'],
  in_transit_back: ['received'],
  received: ['qc_pass', 'qc_fail'],
  qc_pass: ['refund_pending', 'exchange_pending'],
  qc_fail: ['closed', 'refund_pending'], // partial discretion
  refund_pending: ['refunded'],
  refunded: ['closed'],
  exchange_pending: ['closed'],
  closed: [],
};

const REASONS = [
  'damaged',
  'wrong_item',
  'not_as_described',
  'quality',
  'expired_cold_chain',
  'buyer_remorse',
  'other',
];

class ReturnsRmaStateMachine {
  constructor(rma = {}) {
    this.rmaId = rma.rma_id || rma.id || `RMA-${Date.now()}`;
    this.orderId = rma.order_id || null;
    this.state = rma.state || 'requested';
    this.reason = rma.reason || 'other';
    this.lines = rma.lines || [];
    this.refund_amount = rma.refund_amount != null ? Number(rma.refund_amount) : null;
    this.history = rma.history || [
      { state: this.state, at: new Date().toISOString(), event: 'init' },
    ];
  }

  canTransition(to) {
    return (RMA_TRANSITIONS[this.state] || []).includes(to);
  }

  transition(to, event = {}) {
    if (!this.canTransition(to)) {
      const err = new Error(`Invalid RMA transition ${this.state} → ${to}`);
      err.code = 'INVALID_RMA_TRANSITION';
      err.from = this.state;
      err.to = to;
      err.allowed = RMA_TRANSITIONS[this.state] || [];
      throw err;
    }
    const from = this.state;
    this.state = to;
    if (event.refund_amount != null) this.refund_amount = Number(event.refund_amount);
    const entry = {
      from,
      state: to,
      at: new Date().toISOString(),
      event: event.type || 'transition',
      actor: event.actor || 'system',
      note: event.note || null,
    };
    this.history.push(entry);
    return {
      rma_id: this.rmaId,
      order_id: this.orderId,
      state: this.state,
      transition: entry,
      refund_amount: this.refund_amount,
      layer: 'ecommerce',
      confidence: 1,
    };
  }

  snapshot() {
    return {
      rma_id: this.rmaId,
      order_id: this.orderId,
      state: this.state,
      reason: this.reason,
      lines: this.lines,
      refund_amount: this.refund_amount,
      history: this.history,
      allowed_next: RMA_TRANSITIONS[this.state] || [],
      states: RMA_STATES,
      layer: 'ecommerce',
    };
  }
}

module.exports = {
  RMA_STATES,
  RMA_TRANSITIONS,
  REASONS,
  ReturnsRmaStateMachine,
};
