/**
 * Issue / dispute resolution workflow — all platform issue types
 * States, SLA, escalation, link to escrow / order / logistics
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

const events = tryReq('../analytics/businessEventBus');
const trust = tryReq('../trust/trustReputationEngine');

const ISSUE_STATES = {
  open: ['triaged', 'cancelled'],
  triaged: ['investigating', 'cancelled'],
  investigating: ['pending_parties', 'resolved', 'escalated'],
  pending_parties: ['investigating', 'resolved', 'escalated'],
  escalated: ['arbitration', 'resolved'],
  arbitration: ['resolved', 'closed'],
  resolved: ['closed'],
  closed: [],
  cancelled: [],
};

const TYPE_SLA_HOURS = {
  escrow_dispute: 72,
  order_quality: 48,
  delivery_delay: 24,
  payment: 48,
  logistics_damage: 48,
  cold_chain: 12,
  general: 72,
};

const issues = new Map();

function create(data = {}) {
  const id = data.issue_id || `ISS-${randomUUID().slice(0, 8)}`;
  const type = data.type || 'general';
  const sla_h = TYPE_SLA_HOURS[type] || TYPE_SLA_HOURS.general;
  const rec = {
    issue_id: id,
    type,
    state: 'open',
    priority: data.priority || (type === 'cold_chain' ? 'critical' : 'normal'),
    raised_by: data.raised_by || null,
    against: data.against || null,
    order_id: data.order_id || null,
    escrow_id: data.escrow_id || null,
    shipment_id: data.shipment_id || null,
    reason: data.reason || '',
    evidence: data.evidence || [],
    amount: Number(data.amount) || 0,
    resolution: null,
    sla_due_at: new Date(Date.now() + sla_h * 3600000).toISOString(),
    history: [{ state: 'open', at: new Date().toISOString(), event: 'create' }],
    created_at: new Date().toISOString(),
  };
  issues.set(id, rec);
  if (events) events.emit('issue.opened', { issue_id: id, type }, { source: 'issueWorkflow' });
  return rec;
}

function transition(issue_id, to, event = {}) {
  const rec = issues.get(issue_id);
  if (!rec) {
    const err = new Error('Issue not found');
    err.code = 'ISSUE_NOT_FOUND';
    throw err;
  }
  const allowed = ISSUE_STATES[rec.state] || [];
  if (!allowed.includes(to)) {
    const err = new Error(`Invalid issue transition ${rec.state} → ${to}`);
    err.code = 'ISSUE_INVALID_TRANSITION';
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
    note: event.note,
  });
  return rec;
}

function addEvidence(issue_id, evidence) {
  const rec = issues.get(issue_id);
  if (!rec) {
    const err = new Error('Issue not found');
    err.code = 'ISSUE_NOT_FOUND';
    throw err;
  }
  rec.evidence.push({
    ...evidence,
    at: new Date().toISOString(),
  });
  return rec;
}

/** Full resolve path with optional escrow outcome */
async function resolve(issue_id, resolution = {}) {
  const rec = issues.get(issue_id);
  if (!rec) {
    const err = new Error('Issue not found');
    err.code = 'ISSUE_NOT_FOUND';
    throw err;
  }
  if (['open', 'triaged'].includes(rec.state)) transition(issue_id, 'triaged');
  if (rec.state === 'triaged') transition(issue_id, 'investigating');
  if (['investigating', 'pending_parties', 'escalated', 'arbitration'].includes(rec.state)) {
    // ok
  } else if (rec.state !== 'resolved') {
    try {
      transition(issue_id, 'investigating');
    } catch {
      /* */
    }
  }

  rec.resolution = {
    outcome: resolution.outcome || 'closed_no_action',
    note: resolution.note || '',
    actor: resolution.actor || 'system',
    at: new Date().toISOString(),
    escrow_outcome: resolution.escrow_outcome || null,
  };

  // Link escrow policy if present
  if (rec.escrow_id && resolution.escrow_outcome) {
    try {
      const escrow = require('./escrowPolicyEngine');
      const out = escrow.resolveDispute(rec.escrow_id, {
        outcome: resolution.escrow_outcome,
        seller_pct: resolution.seller_pct,
        fault: resolution.fault,
        actor: resolution.actor,
      });
      rec.resolution.escrow_result = out;
    } catch (e) {
      rec.resolution.escrow_error = e.message;
    }
  }

  if (trust && resolution.fault === 'seller' && rec.against) {
    trust.recordEvent(rec.against, { kind: 'tx_dispute', type: 'seller' });
  }
  if (trust && resolution.outcome === 'seller_cleared' && rec.against) {
    trust.recordEvent(rec.against, { kind: 'quality_pass', type: 'seller' });
  }

  transition(issue_id, 'resolved', { type: 'resolve', actor: resolution.actor });
  if (resolution.close !== false) transition(issue_id, 'closed', { type: 'close' });

  if (events) {
    events.emit(
      'issue.resolved',
      { issue_id, outcome: rec.resolution.outcome },
      { source: 'issueWorkflow' },
    );
  }
  return rec;
}

function escalate(issue_id, note) {
  const rec = issues.get(issue_id);
  if (!rec) {
    const err = new Error('Issue not found');
    err.code = 'ISSUE_NOT_FOUND';
    throw err;
  }
  if (rec.state === 'investigating' || rec.state === 'pending_parties') {
    transition(issue_id, 'escalated', { type: 'escalate', note });
  }
  transition(issue_id, 'arbitration', { type: 'arbitration', note });
  return rec;
}

function get(id) {
  return issues.get(id) || null;
}

function list(filter = {}) {
  let all = [...issues.values()];
  if (filter.state) all = all.filter((i) => i.state === filter.state);
  if (filter.type) all = all.filter((i) => i.type === filter.type);
  if (filter.order_id) all = all.filter((i) => i.order_id === filter.order_id);
  return all;
}

function slaBreaches() {
  const now = Date.now();
  return [...issues.values()].filter(
    (i) =>
      !['closed', 'cancelled', 'resolved'].includes(i.state) &&
      new Date(i.sla_due_at).getTime() < now,
  );
}

async function operate(data = {}) {
  const action = data.action || 'list';
  switch (action) {
    case 'create':
      return { issue: create(data) };
    case 'transition':
      return { issue: transition(data.issue_id, data.to, data.event) };
    case 'evidence':
      return { issue: addEvidence(data.issue_id, data.evidence || data) };
    case 'resolve':
      return { issue: await resolve(data.issue_id, data) };
    case 'escalate':
      return { issue: escalate(data.issue_id, data.note) };
    case 'get':
      return { issue: get(data.issue_id) };
    case 'list':
      return { issues: list(data) };
    case 'sla_breaches':
      return { issues: slaBreaches() };
    default:
      return { error: 'Unknown action', action };
  }
}

module.exports = {
  operate,
  create,
  transition,
  addEvidence,
  resolve,
  escalate,
  get,
  list,
  slaBreaches,
  ISSUE_STATES,
  TYPE_SLA_HOURS,
};
