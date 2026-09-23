'use strict';
function createAuthMiddleware(opts = {}) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/^Bearer (.+)$/);
    const token = match ? match[1] : null;

    if (!token) {
      req.user = null;
      if (opts.requireAuth) return res.status(401).json({ error: 'Unauthorized' });
      return next();
    }

    try {
      const decoded = Buffer.from(token, 'base64').toString('utf8').split(':');
      req.user = { userId: decoded[0], email: decoded[1] };
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };
}

function createGateMiddleware(opts = {}) {
  return (req, res, next) => {
    const identity = req.user;

    if (opts.requireIdentity && !identity) {
      return res.status(403).json({ error: 'Identity required' });
    }

    if (opts.allowedRoles && identity) {
      const userRoles = identity.roles || [];
      const hasRole = opts.allowedRoles.some(r => userRoles.includes(r));
      if (!hasRole) return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

module.exports = { createAuthMiddleware, createGateMiddleware };
