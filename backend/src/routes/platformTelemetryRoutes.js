/**
 * Platform Telemetry Routes — REST wrapper for
 * controllers/platformTelemetryController.js, a real, working controller
 * (backed by services/legacy/platformTelemetryService.js's real
 * getSystemMetrics/getServiceHealth/getPlatformAnalytics) that was never
 * actually required by any route file - this file used to be a dead
 * "Route operational" scaffold with no connection to the controller at
 * all. Matches PlatformManagementPage.jsx's platformTelemetryAPI.getStatus()/
 * .getAnalytics() calls exactly.
 */

'use strict';

const express = require('express');
const platformTelemetryController = require('../controllers/platformTelemetryController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/status', platformTelemetryController.getStatus);
router.get('/analytics', platformTelemetryController.getAnalytics);

module.exports = router;
