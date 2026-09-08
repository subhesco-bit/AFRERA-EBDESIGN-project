/**
 * Wearable / Fitness Integration Routes.
 * See services/wearableIntegrationService.js header for the real-vs-device-push
 * architecture split between Fitbit and Apple Health / Samsung Health.
 */

const express = require('express');
const wearableIntegrationController = require('../controllers/wearableIntegrationController');
const { authMiddleware } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

const logger = console; // TODO: use Winston/Pino logger

const router = express.Router();

router.use(authMiddleware);
router.use(apiLimiter);

router.get('/status', wearableIntegrationController.getStatus);
router.get('/fitbit/auth-url', wearableIntegrationController.getFitbitAuthUrl);
router.post('/fitbit/callback', wearableIntegrationController.fitbitCallback);
router.post('/fitbit/sync', wearableIntegrationController.syncFitbit);
router.post('/sync', wearableIntegrationController.ingestDeviceActivity);
router.get('/activity/recent', wearableIntegrationController.getRecentActivity);
router.delete('/:provider', wearableIntegrationController.disconnect);

module.exports = router;
