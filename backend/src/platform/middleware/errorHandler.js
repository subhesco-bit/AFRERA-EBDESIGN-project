/**
 * Global Error Handler (Section 23: Middleware)
 * Catches and formats all errors consistently
 */
const { logger } = require('../../utils/logger');

function errorHandler(err, req, res, next) {
  // TODO: Implement error categorization and formatting
  logger.error('Global error handler', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    errorId: `error_${ Date.now()}`,
    timestamp: new Date(),
  });
}

module.exports = errorHandler;
