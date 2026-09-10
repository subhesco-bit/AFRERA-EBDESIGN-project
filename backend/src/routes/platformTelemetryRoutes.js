/**
 * Platform Telemetry Routes — real system/business metrics for
 * PlatformManagementPage. See services/platformTelemetryService.js header
 * for what is and is not honestly computable here.
 */

const express = require('express');
const platformTelemetryController = require('../controllers/platformTelemetryController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

const 
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) return res.status(401).json({ error: 'Unauthorized' });
    if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
};

router = express.Router();

router.use(authMiddleware);
router.use(requireRole('admin'));
router.use(apiLimiter);

router.get('/status', platformTelemetryController.getStatus);
router.get('/analytics', platformTelemetryController.getAnalytics);

module.exports = router;
