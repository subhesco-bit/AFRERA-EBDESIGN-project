/**
 * Route Monitoring Middleware
 * Adds comprehensive monitoring to critical routes
 */

const { logger } = require('../utils/logger');

const routeMonitoring = (req, res, next) => {
  const startTime = Date.now();
  const routePath = req.path;
  const method = req.method;

  // Log request start
  logger.info('Request started', {
    method,
    path: routePath,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Track response time
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    logger.info('Request completed', {
      method,
      path: routePath,
      statusCode,
      duration: `${duration}ms`,
      success: statusCode < 400
    });

    // Alert on slow responses
    if (duration > 1000) {
      logger.warn('Slow response detected', {
        method,
        path: routePath,
        duration: `${duration}ms`
      });
    }

    // Alert on errors
    if (statusCode >= 500) {
      logger.error('Server error response', {
        method,
        path: routePath,
        statusCode
      });
    }
  });

  // Track errors
  res.on('error', (error) => {
    logger.error('Response error', {
      method,
      path: routePath,
      error: error.message
    });
  });

  next();
};

const criticalRouteMonitoring = (req, res, next) => {
  const startTime = Date.now();
  const routePath = req.path;
  const method = req.method;

  // Enhanced monitoring for critical routes
  logger.info('Critical route accessed', {
    method,
    path: routePath,
    ip: req.ip,
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Track response time with detailed metrics
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    logger.info('Critical route completed', {
      method,
      path: routePath,
      statusCode,
      duration: `${duration}ms`,
      success: statusCode < 400,
      userId: req.user?.id
    });

    // Enhanced alerting for critical routes
    if (duration > 500) {
      logger.error('Critical route slow response', {
        method,
        path: routePath,
        duration: `${duration}ms`,
        userId: req.user?.id
      });
    }

    if (statusCode >= 400) {
      logger.error('Critical route error response', {
        method,
        path: routePath,
        statusCode,
        userId: req.user?.id
      });
    }
  });

  next();
};

const healthCheckMonitoring = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Health checks should be very fast
    if (duration > 100) {
      logger.warn('Health check slow response', {
        path: req.path,
        duration: `${duration}ms`
      });
    }
  });

  next();
};

module.exports = {
  routeMonitoring,
  criticalRouteMonitoring,
  healthCheckMonitoring
};
