/**
 * Real backend routes for PlatformFoundationPage.jsx, backed by
 * services/dual-use/platformCoreService.js. getHealth ->
 * getPlatformHealth, getScalingRecommendations -> getPlatformOptimizations
 * (name/closest-semantic-match differences).
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/dual-use/platformCoreService');

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

const wrap = (fn) => async (req, res) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.get('/platform-core/health', wrap(() => svc.getPlatformHealth()));
router.get('/platform-core/scaling-recommendations', wrap(() => svc.getPlatformOptimizations()));

module.exports = router;
