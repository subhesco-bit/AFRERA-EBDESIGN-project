/**
 * Enterprise-Grade Request ID Middleware
 * 
 * Production-ready distributed tracing with:
 * - Unique request ID generation (UUID v4)
 * - Correlation ID propagation across services
 * - Parent/child span tracking
 * - Trace context management
 * - Distributed tracing headers support
 * - Request fingerprinting
 * - Request chain tracking
 * - Performance correlation
 * - Error traceability
 * - Service mesh integration support
 */

'use strict';

const crypto = require('crypto');

/**
 * Generate UUID v4
 */
function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Generate short request ID (8 characters)
 */
function generateShortId() {
  return crypto.randomBytes(4).toString('hex');
}

/**
 * Extract correlation ID from headers
 */
function extractCorrelationId(req) {
  // Check various header names for correlation ID
  const headers = [
    'x-correlation-id',
    'x-request-id',
    'x-trace-id',
    'traceparent',
    'uber-trace-id',
    'x-transaction-id'
  ];
  
  for (const header of headers) {
    const value = req.get(header);
    if (value) {
      // For traceparent header, extract trace ID
      if (header === 'traceparent') {
        const match = value.match(/^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/);
        if (match) {
          return match[1]; // Return trace ID
        }
      }
      return value;
    }
  }
  
  return null;
}

/**
 * Generate traceparent header for distributed tracing
 */
function generateTraceParent(traceId, parentId = null) {
  const spanId = crypto.randomBytes(8).toString('hex');
  const traceFlags = '01'; // sampled
  
  if (parentId) {
    return `00-${traceId}-${parentId}-${traceFlags}`;
  }
  return `00-${traceId}-${spanId}-${traceFlags}`;
}

/**
 * Request ID middleware for distributed tracing
 */
function requestId(req, res, next) {
  // Generate or extract request ID
  const correlationId = extractCorrelationId(req) || generateUUID();
  const requestId = generateUUID();
  const shortId = generateShortId();
  
  // Attach IDs to request object
  req.id = requestId;
  req.shortId = shortId;
  req.correlationId = correlationId;
  req.traceId = correlationId; // Alias for compatibility
  req.parentSpanId = extractCorrelationId(req) ? crypto.randomBytes(8).toString('hex') : null;
  
  // Add request context
  req.context = {
    requestId,
    shortId,
    correlationId,
    traceId: correlationId,
    parentSpanId: req.parentSpanId,
    spanId: crypto.randomBytes(8).toString('hex'),
    sampled: true
  };
  
  // Set response headers for tracing
  res.setHeader('X-Request-ID', requestId);
  res.setHeader('X-Correlation-ID', correlationId);
  res.setHeader('X-Trace-ID', correlationId);
  
  // Generate and set traceparent header
  const traceParent = generateTraceParent(correlationId, req.parentSpanId);
  res.setHeader('traceparent', traceParent);
  
  // Add additional tracing metadata
  res.setHeader('X-Span-ID', req.context.spanId);
  res.setHeader('X-Parent-Span-ID', req.parentSpanId || 'root');
  
  // Add request timing start
  req.startTime = Date.now();
  req.traceStartTime = Date.now();
  
  // Add request chain tracking
  req.chain = {
    depth: req.get('X-Chain-Depth') ? parseInt(req.get('X-Chain-Depth')) + 1 : 1,
    services: req.get('X-Chain-Services') ? req.get('X-Chain-Services').split(',') : []
  };
  
  // Add current service to chain
  const serviceName = process.env.SERVICE_NAME || 'api';
  if (!req.chain.services.includes(serviceName)) {
    req.chain.services.push(serviceName);
  }
  
  res.setHeader('X-Chain-Depth', req.chain.depth);
  res.setHeader('X-Chain-Services', req.chain.services.join(','));
  
  // Add request fingerprint for anomaly detection
  req.fingerprint = generateRequestFingerprint(req);
  
  next();
}

/**
 * Generate request fingerprint for anomaly detection
 */
function generateRequestFingerprint(req) {
  const fingerprintData = {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    contentType: req.get('content-type'),
    correlationId: req.correlationId
  };
  return crypto.createHash('md5').update(JSON.stringify(fingerprintData)).digest('hex');
}

/**
 * Add child span for nested operations
 */
function addChildSpan(req, operationName) {
  if (!req.context) return null;
  
  const childSpanId = crypto.randomBytes(8).toString('hex');
  const childSpan = {
    id: childSpanId,
    parentId: req.context.spanId,
    traceId: req.context.traceId,
    operationName,
    startTime: Date.now()
  };
  
  req.childSpans = req.childSpans || [];
  req.childSpans.push(childSpan);
  
  return childSpan;
}

/**
 * Complete a child span
 */
function completeChildSpan(req, spanId) {
  if (!req.childSpans) return;
  
  const span = req.childSpans.find(s => s.id === spanId);
  if (span) {
    span.duration = Date.now() - span.startTime;
    span.endTime = Date.now();
  }
}

/**
 * Get trace context for logging
 */
function getTraceContext(req) {
  return {
    requestId: req.id,
    shortId: req.shortId,
    correlationId: req.correlationId,
    traceId: req.traceId,
    spanId: req.context?.spanId,
    parentSpanId: req.parentSpanId,
    fingerprint: req.fingerprint,
    chain: req.chain
  };
}

/**
 * Middleware to add child span timing
 */
function spanTiming(req, res, next) {
  const originalEnd = res.end;
  
  res.end = function(chunk, encoding) {
    // Complete all child spans
    if (req.childSpans) {
      req.childSpans.forEach(span => {
        if (!span.duration) {
          span.duration = Date.now() - span.startTime;
          span.endTime = Date.now();
        }
      });
    }
    
    // Add span timing to response headers
    if (req.childSpans && req.childSpans.length > 0) {
      const totalSpanTime = req.childSpans.reduce((sum, span) => sum + (span.duration || 0), 0);
      res.setHeader('X-Span-Time', `${totalSpanTime}ms`);
      res.setHeader('X-Span-Count', req.childSpans.length);
    }
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
}

module.exports = {
  requestId,
  generateUUID,
  generateShortId,
  extractCorrelationId,
  generateTraceParent,
  addChildSpan,
  completeChildSpan,
  getTraceContext,
  spanTiming,
  generateRequestFingerprint
};
