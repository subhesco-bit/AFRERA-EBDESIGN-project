/**
 * Canonical business events — source for metrics (no random dashboard numbers)
 */

'use strict';

const { randomUUID } = require('crypto');

const EVENTS = [];
const METRIC_DEFS = {
  orders_completed: {
    name: 'Orders completed',
    event_type: 'order.completed',
    aggregation: 'count',
    source: 'businessEventBus',
  },
  gmv_inr: {
    name: 'GMV INR',
    event_type: 'order.completed',
    aggregation: 'sum',
    field: 'amount_inr',
    source: 'businessEventBus',
  },
  preseason_booked_inr: {
    name: 'Preseason booked INR',
    event_type: 'preseason.confirmed',
    aggregation: 'sum',
    field: 'amount_inr',
    source: 'businessEventBus',
  },
  wallet_holds: {
    name: 'Wallet holds',
    event_type: 'wallet.hold',
    aggregation: 'count',
    source: 'businessEventBus',
  },
};

function emit(type, payload = {}, meta = {}) {
  const ev = {
    event_id: randomUUID(),
    type,
    payload,
    at: new Date().toISOString(),
    source: meta.source || 'system',
    correlation_id: meta.correlation_id || null,
  };
  EVENTS.push(ev);
  if (EVENTS.length > 5000) EVENTS.shift();
  return ev;
}

function query(filter = {}) {
  let rows = EVENTS;
  if (filter.type) rows = rows.filter((e) => e.type === filter.type);
  if (filter.since) rows = rows.filter((e) => e.at >= filter.since);
  return rows.slice(-(filter.limit || 100));
}

function metric(metric_id) {
  const def = METRIC_DEFS[metric_id];
  if (!def) {
    return {
      error: 'Unknown metric',
      rule: 'No dashboard metric without verified source definition',
    };
  }
  const rows = EVENTS.filter((e) => e.type === def.event_type);
  let value = 0;
  if (def.aggregation === 'count') value = rows.length;
  if (def.aggregation === 'sum') {
    value = rows.reduce((s, e) => s + (Number(e.payload[def.field]) || 0), 0);
  }
  return {
    metric_id,
    ...def,
    value,
    sample_size: rows.length,
    freshness: rows.length ? rows[rows.length - 1].at : null,
    confidence: rows.length ? 0.9 : 0.2,
    verified_source: true,
  };
}

function listMetrics() {
  return { metrics: Object.keys(METRIC_DEFS).map((id) => ({ id, ...METRIC_DEFS[id] })) };
}

async function operate(data = {}) {
  const action = data.action || 'query';
  if (action === 'emit') return emit(data.type, data.payload, data.meta);
  if (action === 'query') return { events: query(data) };
  if (action === 'metric') return metric(data.metric_id);
  if (action === 'list_metrics') return listMetrics();
  return { error: 'Unknown action' };
}

module.exports = { emit, query, metric, listMetrics, operate, METRIC_DEFS, _events: EVENTS };
