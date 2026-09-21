/**
 * Production security middleware suite.
 *
 * Design rules:
 * - Do not mutate business input to "sanitize" it.
 * - Validate data with route/domain schemas; parameterize database queries.
 * - Keep rate limiting bounded and fail closed only when configured.
 * - Never expose stack traces or sensitive request data to clients.
 */

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX_REQUESTS = 100;
const MAX_TRACKED_CLIENTS = 10_000;

function rateLimit(maxRequests = DEFAULT_MAX_REQUESTS, windowMs = DEFAULT_WINDOW_MS) {
  const requests = new Map();
  const limit = Number.isInteger(maxRequests) && maxRequests > 0 ? maxRequests : DEFAULT_MAX_REQUESTS;
  const window = Number.isFinite(windowMs) && windowMs > 0 ? windowMs : DEFAULT_WINDOW_MS;

  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    const existing = requests.get(ip) || [];
    const recent = existing.filter(timestamp => now - timestamp < window);

    if (recent.length >= limit) {
      res.setHeader('Retry-After', String(Math.ceil(window / 1000)));
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
      });
    }

    if (recent.length === 0) requests.delete(ip);

    if (!requests.has(ip) && requests.size >= MAX_TRACKED_CLIENTS) {
      const oldest = requests.keys().next().value;
      if (oldest !== undefined) requests.delete(oldest);
    }

    recent.push(now);
    requests.set(ip, recent);
    return next();
  };
}

/**
 * Compatibility middleware only. It deliberately does not mutate payloads.
 * Domain-specific validation belongs to route schemas (Joi/Zod/express-validator).
 */
const validateInput = (req, res, next) => next();

const corsMiddleware = (req, res, next) => {
  const configuredOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
  const requestOrigin = req.get('Origin');

  if (requestOrigin && configuredOrigins.includes(requestOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID, X-Correlation-ID');
  res.setHeader('Access-Control-Max-Age', '3600');

  if (req.method === 'OPTIONS') return res.sendStatus(204);
  return next();
};

const securityHeaders = (req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
  res.removeHeader('X-Powered-By');

  // HSTS is safe only when the deployment is actually HTTPS.
  if (req.secure || process.env.TRUST_PROXY === 'true') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  const csp = process.env.CONTENT_SECURITY_POLICY;
  if (csp) res.setHeader('Content-Security-Policy', csp);

  if (req.path.startsWith('/auth') || req.path.startsWith('/admin')) {
    res.setHeader('Cache-Control', 'no-store, private');
  }

  return next();
};

const requestLogger = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const log = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      requestId: req.id || req.requestId,
    };

    if (res.statusCode >= 400 && typeof console.warn === 'function') {
      console.warn('API request failed', log);
    }
  });

  return next();
};

/**
 * This helper is intentionally conservative. SQL injection prevention is
 * achieved by parameterized queries, never by rejecting legitimate words
 * such as "update" or "select" from user-entered business data.
 */
const validateSQLInput = value => typeof value === 'string' && !/[\0]/.test(value);

const validatePassword = password => {
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) return false;
  return /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
};

const validateEmail = email => {
  if (typeof email !== 'string' || email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = Number.isInteger(err?.statusCode) && err.statusCode >= 400 && err.statusCode < 600
    ? err.statusCode
    : 500;

  if (res.headersSent) return next(err);

  if (typeof console.error === 'function') {
    console.error('Unhandled API error', {
      requestId: req.id || req.requestId,
      statusCode,
      name: err?.name,
      message: err?.message,
    });
  }

  return res.status(statusCode).json({
    success: false,
    error: statusCode >= 500 ? 'Internal Server Error' : (err.message || 'Request failed'),
    requestId: req.id || req.requestId,
  });
};

module.exports = {
  rateLimit,
  validateInput,
  corsMiddleware,
  securityHeaders,
  requestLogger,
  validateSQLInput,
  validatePassword,
  validateEmail,
  errorHandler,
};
