/**
 * Admin Middleware
 * Checks if user has admin privileges
 */

const { logger } = require('../utils/logger');

function adminMiddleware(req, res, next) {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, error: 'Admin privileges required' });
    }

    next();
  } catch (error) {
    logger.error('Admin middleware error', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

module.exports = { adminMiddleware };
