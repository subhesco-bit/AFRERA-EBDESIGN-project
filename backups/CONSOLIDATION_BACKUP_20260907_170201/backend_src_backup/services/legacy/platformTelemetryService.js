/**
 * Platform Telemetry Service — real system/business metrics for
 * PlatformManagementPage, replacing what was previously a fully hardcoded
 * mock object (fake 15,420 users, fake 1.25M requests, fake 0.02 error
 * rate, fake per-service latency numbers).
 *
 * HONESTY BOUNDARY: this codebase has no request-logging/APM store
 * anywhere (confirmed by grep this session) — so total_requests, error_rate,
 * request_growth, and per-service latency are NOT computable from real data.
 * Rather than invent plausible-looking numbers for them, this service simply
 * does not return those fields. A missing field on an admin dashboard is
 * honest; a fabricated one is not.
 */

const os = require('os');
const { getPostgreSQL } = require('../../database/connection');
const { logger } = require('../../utils/logger');

/** Real Node/OS-level metrics — no external monitoring agent required. */
function getSystemMetrics() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const cpuCount = os.cpus().length;
  // Node's os.loadavg() is Unix-only (returns [0,0,0] on Windows) — labelled
  // honestly rather than presented as a real reading when it can't be one.
  const loadAvg = os.loadavg();
  const loadAvgAvailable = process.platform !== 'win32';

  return {
    process: {
      uptime_seconds: Math.floor(process.uptime()),
      memory_rss_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      memory_heap_used_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      node_version: process.version,
      env: process.env.NODE_ENV || 'development',
    },
    system: {
      cpu_count: cpuCount,
      load_avg_1m: loadAvgAvailable ? Math.round(loadAvg[0] * 100) / 100 : null,
      load_avg_available: loadAvgAvailable,
      memory_used_pct: Math.round(((totalMem - freeMem) / totalMem) * 100),
      memory_total_mb: Math.round(totalMem / 1024 / 1024),
      platform: process.platform,
    },
  };
}

/** Real DB-derived business metrics — no field here is a placeholder. */
async function getPlatformAnalytics() {
  const pg = getPostgreSQL();

  const [usersResult, activeUsersResult, ordersResult] = await Promise.all([
    pg.query('SELECT COUNT(*)::int AS count FROM users'),
    pg.query(`SELECT COUNT(*)::int AS count FROM users WHERE last_login_at > NOW() - INTERVAL '30 days'`),
    pg.query('SELECT COUNT(*)::int AS count FROM orders').catch(() => ({ rows: [{ count: null }] })),
  ]);

  return {
    total_users: usersResult.rows[0].count,
    active_users_30d: activeUsersResult.rows[0].count,
    total_orders: ordersResult.rows[0].count,
    // Deliberately no total_requests / error_rate / growth trends — not
    // computable without a request-logging store this codebase doesn't have.
  };
}

/**
 * Real health check across a representative sample of mounted services
 * that expose isHealthy() (DB-connectivity pings), not fabricated
 * "healthy, 45ms" literals for services never actually queried.
 */
async function getServiceHealth() {
  const checks = {
    database: () => getPostgreSQL().query('SELECT 1').then(() => true).catch(() => false),
    nutrition_intelligence: () => require('./nutritionIntelligenceService').isHealthy(),
    ai_backbone: () => Promise.resolve(Object.values(require('./aiBackboneService').AI_PROVIDERS).some((p) => p.enabled && p.apiKey)),
  };

  const results = {};
  for (const [name, check] of Object.entries(checks)) {
    try {
      results[name] = { healthy: await check() };
    } catch (error) {
      results[name] = { healthy: false, error: error.message };
    }
  }
  return results;
}

module.exports = { getSystemMetrics, getPlatformAnalytics, getServiceHealth };
