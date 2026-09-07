/**
 * Analytics & Monitoring Service — platform-wide operational metrics.
 *
 * Strategy Card
 * Purpose:  Give operators one place to see whether the platform is healthy
 *           right now: how much commerce is happening, how many people are
 *           on it, and how often requests are failing.
 * Actors:   admin / ops dashboards (human), scheduled health checks (system).
 * Decision: none directly — this is an observability surface. It feeds the
 *           numbers a human uses to decide whether to investigate.
 * Algorithm: real SQL aggregation (COUNT/AVG/window comparisons against
 *           orders, users, audit_logs) plus an in-process request counter.
 *           Error rate = failed audit_logs rows / total audit_logs rows in
 *           the lookback window, matching auditService.getSecurityAudit's
 *           existing status vocabulary ('failure').
 * Data:     orders, users, audit_logs (all pre-existing tables — see
 *           database/migrations/000_base_schema.sql and 014_audit_system.sql).
 * AI role:  none — every figure here is a direct aggregate, not a prediction.
 * Status:   real, with one honest gap: request-latency/throughput is only
 *           tracked from process start (in-memory counters reset on
 *           restart) because no request-logging table exists yet. Documented
 *           per-endpoint below rather than fabricated.
 */

const express = require('express');
const router = express.Router();
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const auditService = require('./auditService');

// ---------------------------------------------------------------------------
// In-process request counters. Reset on restart — there is no persistent
// request-log table in this codebase (the closest thing, audit_logs, only
// captures actions someone chose to audit-log, not every HTTP hit). Rather
// than fabricate a metrics table this pass doesn't need, this is scoped
// honestly as "since last restart" and labelled that way in the response.
// ---------------------------------------------------------------------------
const requestCounters = {
  total: 0,
  byMethod: new Map(),
  byStatusClass: new Map(), // '2xx' | '3xx' | '4xx' | '5xx'
  startedAt: new Date().toISOString()
};

/** Express middleware other route modules can mount to feed the counters. */
function trackRequest(req, res, next) {
  requestCounters.total += 1;
  requestCounters.byMethod.set(req.method, (requestCounters.byMethod.get(req.method) || 0) + 1);
  res.on('finish', () => {
    const cls = `${Math.floor(res.statusCode / 100)}xx`;
    requestCounters.byStatusClass.set(cls, (requestCounters.byStatusClass.get(cls) || 0) + 1);
  });
  next();
}

function requestMetricsSnapshot() {
  return {
    since: requestCounters.startedAt,
    total: requestCounters.total,
    byMethod: Object.fromEntries(requestCounters.byMethod),
    byStatusClass: Object.fromEntries(requestCounters.byStatusClass),
    note: 'Counted since process start — no persistent request log exists yet, so this resets on restart.'
  };
}

/**
 * Real aggregation over orders/users. Every number here is a COUNT/AVG, not
 * an estimate. windowHours controls the "recent" comparison window used for
 * the growth/error-rate calculations.
 */
async function collectPlatformMetrics({ windowHours = 24 } = {}) {
  const pg = getPostgreSQL();
  if (!pg) {
    return {
      available: false,
      reason: 'Database not initialized',
      generatedAt: new Date().toISOString()
    };
  }

  const [
    orderTotals,
    orderWindow,
    userTotals,
    userWindow,
    revenueTotals
  ] = await Promise.all([
    pg.query(`SELECT COUNT(*)::int AS count FROM orders`),
    pg.query(
      `SELECT COUNT(*)::int AS count FROM orders WHERE created_at >= NOW() - ($1 || ' hours')::interval`,
      [windowHours]
    ),
    pg.query(`SELECT COUNT(*)::int AS count FROM users`),
    pg.query(
      `SELECT COUNT(*)::int AS count FROM users WHERE created_at >= NOW() - ($1 || ' hours')::interval`,
      [windowHours]
    ),
    pg.query(
      `SELECT COALESCE(SUM(total_amount), 0)::numeric AS total,
              COALESCE(AVG(total_amount), 0)::numeric AS avg_order_value
         FROM orders
        WHERE payment_status = 'paid'`
    )
  ]);

  // Error rate: audit_logs.status was added as a nullable column (014), so
  // rows with no status are excluded from both numerator and denominator
  // rather than silently counted as successes.
  let errorRate = null;
  try {
    const errRes = await pg.query(
      `SELECT
          COUNT(*) FILTER (WHERE status IS NOT NULL)::int AS scored,
          COUNT(*) FILTER (WHERE status = 'failure')::int AS failed
        FROM audit_logs
       WHERE created_at >= NOW() - ($1 || ' hours')::interval`,
      [windowHours]
    );
    const { scored, failed } = errRes.rows[0];
    errorRate = scored > 0 ? Number((failed / scored).toFixed(4)) : null;
  } catch (error) {
    logger.warn('analyticsMonitoringService: audit_logs error-rate query failed', { error: error.message });
  }

  const orderGrowth = orderTotals.rows[0].count > 0
    ? Number((orderWindow.rows[0].count / orderTotals.rows[0].count).toFixed(4))
    : 0;

  return {
    available: true,
    windowHours,
    orders: {
      total: orderTotals.rows[0].count,
      inWindow: orderWindow.rows[0].count,
      shareOfTotalInWindow: orderGrowth
    },
    users: {
      total: userTotals.rows[0].count,
      newInWindow: userWindow.rows[0].count
    },
    revenue: {
      totalPaid: Number(revenueTotals.rows[0].total),
      avgOrderValue: Number(revenueTotals.rows[0].avg_order_value)
    },
    errorRate, // fraction 0..1, or null if audit_logs has no scored rows yet
    requestMetrics: requestMetricsSnapshot(),
    generatedAt: new Date().toISOString()
  };
}

router.get('/', async (req, res) => {
  try {
    const windowHours = Number(req.query.windowHours) || 24;
    const metrics = await collectPlatformMetrics({ windowHours });
    res.json({ success: true, data: metrics });
  } catch (error) {
    logger.error('analyticsMonitoringService: metrics query failed', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/requests', (req, res) => {
  res.json({ success: true, data: requestMetricsSnapshot() });
});

router.get('/security', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await auditService.getSecurityAudit({ startDate, endDate });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('analyticsMonitoringService: security audit query failed', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, error: error.message });
  }
});

async function initialize() {
  logger.info('analyticsMonitoringService: initialized (live orders/users/audit_logs aggregation)');
}

function setupRoutes(app) {
  app.use('/api/v1/analytics-monitoring', router);
}

module.exports = { initialize, setupRoutes, router, collectPlatformMetrics, trackRequest, requestMetricsSnapshot };
