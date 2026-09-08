// Express routes for Platform Core (M001)
const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware } = require('../../middleware/auth');
const adminMiddleware = require('../../middleware/admin');
const { rateLimiters } = require('../../middleware/rateLimit');

router.post('/initialize', rateLimiters.write, authMiddleware, adminMiddleware, controller.initializePlatform);
router.get('/health', rateLimiters.read, authMiddleware, controller.getPlatformHealth);
router.get('/metrics', rateLimiters.read, authMiddleware, controller.getPlatformMetrics);
router.put('/configurations/:id', rateLimiters.write, authMiddleware, adminMiddleware, controller.updatePlatformConfiguration);

module.exports = router;
