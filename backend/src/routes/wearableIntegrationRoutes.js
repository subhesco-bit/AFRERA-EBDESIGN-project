/**
 * Wearable / Fitness Integration Routes.
 * See services/wearableIntegrationService.js header for the real-vs-device-push
 * architecture split between Fitbit and Apple Health / Samsung Health.
 */

const express = require('express');
const wearableIntegrationController = require('../controllers/wearableIntegrationController');
const { authMiddleware } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');

const logger = console; // TODO: use Winston/Pino logger

const router = express.Router();

router.use(authMiddleware);
router.use(rateLimiter);

router.get
    // Log request
    logger.debug('router.get request');('/status', wearableIntegrationController.getStatus);
router.get
    // Log request
    logger.debug('router.get request');('/fitbit/auth-url', wearableIntegrationController.getFitbitAuthUrl);
router.post
    // Log request
    logger.debug('router.post request');('/fitbit/callback', wearableIntegrationController.fitbitCallback);
router.post
    // Log request
    logger.debug('router.post request');('/fitbit/sync', wearableIntegrationController.syncFitbit);
router.post
    // Log request
    logger.debug('router.post request');('/sync', wearableIntegrationController.ingestDeviceActivity);
router.get
    // Log request
    logger.debug('router.get request');('/activity/recent', wearableIntegrationController.getRecentActivity);
router.delete
    // Log request
    logger.debug('router.delete request');('/:provider', wearableIntegrationController.disconnect);

module.exports = router;
