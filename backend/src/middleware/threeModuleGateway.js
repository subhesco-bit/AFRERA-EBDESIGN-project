/**
 * Three-Module API Gateway Middleware
 * Correlation IDs, request validation envelope, rate-limit hooks, module ACL, audit trail.
 */

const { randomUUID } = require('crypto');

const MODULE_ACL = {
  veterinary: ['panel', 'enhanced', 'herd', 'onehealth', 'erp', 'finance'],
  nutrition: ['conference', 'enhanced', 'life_stage', 'erp', 'finance'],
  agro: ['intelligence', 'enhanced', 'crops', 'soil', 'organic', 'biochar', 'erp', 'finance'],
  unified: ['operate', 'operate_enhanced', 'gaps', 'bus'],
};

function correlationMiddleware(req, res, next) {
  const cid = req.headers['x-correlation-id'] || randomUUID();
  req.correlationId = cid;
  res.setHeader('X-Correlation-Id', cid);
  res.setHeader('X-AFRERA-Gateway', 'three-module-v1');
  next();
}

function jsonEnvelope(req, res, next) {
  const origJson = res.json.bind(res);
  res.json = (body) => {
    if (body && typeof body === 'object' && !body._enveloped) {
      const wrapped = {
        success: body.success !== false && !body.error,
        correlation_id: req.correlationId,
        module: req.afreraModule || body.module || null,
        timestamp: new Date().toISOString(),
        // If the handler already nested its payload under `.data`, use that;
        // otherwise the whole body *is* the payload. The previous version
        // fell through to `body.data` (undefined) whenever `body.success`
        // was set but `body.data` wasn't — silently discarding every real
        // response shaped like { success, ...payloadFieldsAtTopLevel }.
        data: body.data !== undefined ? body.data : body,
        error: body.error || null,
        meta: body.meta || undefined,
        _enveloped: true,
      };
      // Preserve existing success/data shape if already well-formed
      if (body.success !== undefined && body.data !== undefined) {
        return origJson({
          success: body.success,
          correlation_id: req.correlationId,
          timestamp: new Date().toISOString(),
          data: body.data,
          error: body.error || null,
          meta: body.meta,
        });
      }
      return origJson(wrapped);
    }
    return origJson(body);
  };
  next();
}

function tagModule(moduleName) {
  return (req, _res, next) => {
    req.afreraModule = moduleName;
    next();
  };
}

function safetyHeaders(_req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
}

/** Simple in-memory rate limit per IP+module */
const buckets = new Map();
function rateLimit({ windowMs = 60000, max = 120 } = {}) {
  return (req, res, next) => {
    const key = `${req.ip}:${req.afreraModule || 'global'}`;
    const now = Date.now();
    let b = buckets.get(key);
    if (!b || now - b.start > windowMs) {
      b = { start: now, count: 0 };
      buckets.set(key, b);
    }
    b.count += 1;
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - b.count));
    if (b.count > max) {
      return res.status(429).json({ success: false, error: 'rate_limit_exceeded', correlation_id: req.correlationId });
    }
    next();
  };
}

function errorHandler(err, req, res, _next) {
  console.error('[gateway]', req.correlationId, err);
  res.status(err.status || 500).json({
    success: false,
    correlation_id: req.correlationId,
    error: err.message || 'internal_error',
    code: err.code || 'INTERNAL',
  });
}

module.exports = {
  correlationMiddleware,
  jsonEnvelope,
  tagModule,
  safetyHeaders,
  rateLimit,
  errorHandler,
  MODULE_ACL,
};
