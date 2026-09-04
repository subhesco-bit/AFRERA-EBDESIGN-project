// Enterprise Monitoring & Metrics - Production Grade
const logger = require('../utils/logger');

class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: { total: 0, success: 0, error: 0 },
      latency: { min: Infinity, max: 0, avg: 0, sum: 0, count: 0 },
      database: { queries: 0, slowQueries: 0, errors: 0 },
      cache: { hits: 0, misses: 0, errors: 0 },
      endpoints: {},
      errors: {}
    };

    this.slowQueryThreshold = parseInt(process.env.SLOW_QUERY_THRESHOLD || 100);
  }

  recordRequest(duration, statusCode, endpoint) {
    this.metrics.requests.total++;

    if (statusCode >= 400) {
      this.metrics.requests.error++;
    } else {
      this.metrics.requests.success++;
    }

    // Latency tracking
    this.metrics.latency.sum += duration;
    this.metrics.latency.count++;
    this.metrics.latency.avg = this.metrics.latency.sum / this.metrics.latency.count;
    this.metrics.latency.min = Math.min(this.metrics.latency.min, duration);
    this.metrics.latency.max = Math.max(this.metrics.latency.max, duration);

    // Endpoint tracking
    if (!this.metrics.endpoints[endpoint]) {
      this.metrics.endpoints[endpoint] = { count: 0, errors: 0, avgLatency: 0 };
    }
    this.metrics.endpoints[endpoint].count++;
    if (statusCode >= 400) this.metrics.endpoints[endpoint].errors++;
  }

  recordDatabaseQuery(duration, error = false) {
    this.metrics.database.queries++;
    if (duration > this.slowQueryThreshold) this.metrics.database.slowQueries++;
    if (error) this.metrics.database.errors++;
  }

  recordCacheOperation(hit = true, error = false) {
    if (hit) this.metrics.cache.hits++;
    else this.metrics.cache.misses++;
    if (error) this.metrics.cache.errors++;
  }

  recordError(errorCode) {
    if (!this.metrics.errors[errorCode]) this.metrics.errors[errorCode] = 0;
    this.metrics.errors[errorCode]++;
  }

  getMetrics() {
    return {
      timestamp: new Date().toISOString(),
      ...this.metrics,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };
  }

  reset() {
    this.metrics = {
      requests: { total: 0, success: 0, error: 0 },
      latency: { min: Infinity, max: 0, avg: 0, sum: 0, count: 0 },
      database: { queries: 0, slowQueries: 0, errors: 0 },
      cache: { hits: 0, misses: 0, errors: 0 },
      endpoints: {},
      errors: {}
    };
  }
}

// Health check system
class HealthChecker {
  constructor() {
    this.checks = {};
  }

  register(name, checkFn) {
    this.checks[name] = checkFn;
  }

  async check() {
    const results = { status: 'healthy', checks: {} };
    let hasError = false;

    for (const [name, checkFn] of Object.entries(this.checks)) {
      try {
        const start = Date.now();
        await checkFn();
        results.checks[name] = {
          status: 'ok',
          duration: Date.now() - start
        };
      } catch (error) {
        hasError = true;
        results.checks[name] = {
          status: 'error',
          error: error.message
        };
      }
    }

    results.status = hasError ? 'degraded' : 'healthy';
    results.timestamp = new Date().toISOString();
    return results;
  }
}

// Metrics middleware
const metricsMiddleware = (metrics) => {
  return (req, res, next) => {
    const start = Date.now();

    const originalJson = res.json;
    res.json = function (data) {
      const duration = Date.now() - start;
      metrics.recordRequest(duration, res.statusCode, req.path);

      if (res.statusCode >= 400) {
        logger.warn(`Request failed: ${req.method} ${req.path}`, {
          statusCode: res.statusCode,
          duration,
          requestId: req.id
        });
      } else {
        logger.debug(`Request completed: ${req.method} ${req.path}`, {
          statusCode: res.statusCode,
          duration,
          requestId: req.id
        });
      }

      return originalJson.call(this, data);
    };

    next();
  };
};

module.exports = {
  MetricsCollector,
  HealthChecker,
  metricsMiddleware
};
