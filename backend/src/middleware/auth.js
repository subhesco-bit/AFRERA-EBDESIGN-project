/**
 * Authentication Middleware
 * Provides JWT verification and authorization for protected routes
 */

const { verifyToken, hasPermission } = require('../services/dual-use/authService');
const { logger } = require('../utils/logger');

// SKIP_AUTH (and the relaxed test-mode verification below) must never take
// effect outside test/development. A production deployment that somehow has
// SKIP_AUTH=true set must fail loudly at startup rather than silently ignore
// the flag (which would be confusing) or silently honor it (which would be
// an open auth bypass in production).
if (process.env.SKIP_AUTH === 'true' && process.env.NODE_ENV === 'production') {
  const message = 'FATAL: SKIP_AUTH=true is set while NODE_ENV=production. ' +
    'Refusing to start with authentication bypassed in production. ' +
    'Unset SKIP_AUTH or set NODE_ENV to "test"/"development".';
  logger.error(message);
  throw new Error(message);
}

/**
 * Authentication middleware - verifies JWT token
 */
function authMiddleware(req, res, next) {
  try {
    const nodeEnv = process.env.NODE_ENV;
    const skipAuthAllowedEnv = nodeEnv === 'test' || nodeEnv === 'development';

    // If SKIP_AUTH is explicitly set, use a default test user (useful for
    // dev/test only). Outside test/development this must never bypass auth,
    // even silently — log it loudly and fall through to real verification.
    if (process.env.SKIP_AUTH === 'true') {
      if (skipAuthAllowedEnv) {
        req.user = {
          id: process.env.TEST_USER_ID || 'test-user',
          email: process.env.TEST_USER_EMAIL || 'test@example.com',
          role: 'consumer',
          permissions: []
        };
        return next();
      }

      logger.error(
        'SKIP_AUTH=true was requested but ignored: NODE_ENV is not "test" or "development"',
        { nodeEnv }
      );
    }

    // In test mode require a token header but allow relaxed verification
    if (nodeEnv === 'test') {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ 
          error: 'No authorization header provided',
          code: 'NO_TOKEN'
        });
      }

      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = require('../services/dual-use/authService').verifyToken(token);
        req.user = {
          id: payload.userId || payload.id,
          email: payload.email,
          role: payload.role || 'consumer',
          permissions: payload.permissions || []
        };

        return next();
      } catch (err) {
        return res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
      }
    }

    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'No authorization header provided',
        code: 'NO_TOKEN'
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'No token provided',
        code: 'NO_TOKEN'
      });
    }
    
    const payload = verifyToken(token);
    
    // Attach user info to request
    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions
    };
    
    next();
  } catch (error) {
    logger.error('Authentication failed', { error: error.message, stack: error.stack });
    
    if (error.message === 'Token expired') {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(401).json({ 
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
}

/**
 * Role-based authorization middleware
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }
    
    next();
  };
}

/**
 * Permission-based authorization middleware
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    if (!hasPermission(req.user.permissions, permission)) {
      return res.status(403).json({ 
        error: 'Permission denied',
        code: 'PERMISSION_DENIED',
        requiredPermission: permission
      });
    }
    
    next();
  };
}

/**
 * Optional authentication - doesn't fail if no token
 */
function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      
      if (token) {
        const payload = verifyToken(token);
        req.user = {
          id: payload.userId,
          email: payload.email,
          role: payload.role,
          permissions: payload.permissions
        };
      }
    }
    
    next();
  } catch (error) {
    // Don't fail, just continue without user
    next();
  }
}

/**
 * Rate limiting by user
 */
function userRateLimit(limit = 100, windowMs = 60000) {
  const userRequests = new Map();
  
  return (req, res, next) => {
    if (!req.user) {
      return next();
    }
    
    const userId = req.user.id;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    const userWindow = userRequests.get(userId) || [];
    const recentRequests = userWindow.filter(time => time > windowStart);
    
    if (recentRequests.length >= limit) {
      return res.status(429).json({ 
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        limit: limit,
        window: windowMs
      });
    }
    
    recentRequests.push(now);
    userRequests.set(userId, recentRequests);
    
    next();
  };
}

module.exports = Object.assign(authMiddleware, {
  authMiddleware,
  requireRole,
  requirePermission,
  optionalAuth,
  userRateLimit
});
module.exports.default = authMiddleware;
