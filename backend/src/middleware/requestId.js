/**
 * Request ID Middleware
 * Generates unique request IDs for tracing and correlation
 */

const { v4: uuid } = require('uuid');

/**
 * Generate and attach unique request ID
 */
function requestId(req, res, next) {
  // Check if request already has an ID (from upstream proxy)
  const id = req.headers['x-request-id'] || 
             req.headers['x-correlation-id'] || 
             uuid();

  // Attach to request and response
  req.id = id;
  res.setHeader('X-Request-ID', id);
  res.setHeader('X-Correlation-ID', id);

  next();
}

module.exports = {
  requestId,
};
