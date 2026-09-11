/**
 * Cache Middleware
 * Simple caching middleware for responses
 */

const cacheMiddleware = (req, res, next) => {
  // Set cache headers for GET requests
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'public, max-age=300');
  } else {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  next();
};

module.exports = cacheMiddleware;
