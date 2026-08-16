/**
 * Platform Telemetry Routes — real system/business metrics for
 * PlatformManagementPage. See services/platformTelemetryService.js header
 * for what is and is not honestly computable here.
 */

const express = require('express');
const platformTelemetryController = require('../controllers/platformTelemetryController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole('admin'));
router.use(rateLimiter);

router.get('/status', platformTelemetryController.getStatus);
router.get('/analytics', platformTelemetryController.getAnalytics);

module.exports = router;
