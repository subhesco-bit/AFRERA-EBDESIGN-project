/**
 * Platform Configuration Routes — REST wrapper for
 * services/legacy/platformConfigurationService.js's real, DB-backed
 * (platform_configurations table) getOptimizedRecommendations/
 * applyOptimizedConfiguration methods, matching
 * PlatformFoundationPage.jsx's platformConfigurationAPI.getRecommendations()/
 * .applyConfiguration() calls - this file used to be a dead "Route
 * operational" scaffold with no connection to any real service.
 *
 * Only these 2 of the service's 20+ methods are exposed - the frontend
 * doesn't call the rest (auto-tuning, security scans, compliance
 * checks, rollback, etc.), and wiring unused endpoints isn't the goal
 * of this fix.
 */

'use strict';

const express = require('express');
const platformConfigurationService = require('../services/legacy/platformConfigurationService');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/recommendations', async (req, res, next) => {
  try {
    const recommendations = await platformConfigurationService.getOptimizedRecommendations();
    res.json({ success: true, data: recommendations });
  } catch (error) {
    next(error);
  }
});

router.post('/apply', async (req, res, next) => {
  try {
    const result = await platformConfigurationService.applyOptimizedConfiguration(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
