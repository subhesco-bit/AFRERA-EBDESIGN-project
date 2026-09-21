/**
 * Real backend routes for ecommerceMarketingAPI, backed by
 * services/legacy/ecommerceMarketingService.js.
 * getEcommerceMarketing -> getMarketingAnalytics(filters),
 * runMarketingCampaign -> launchCampaign(campaignId) (closest semantic
 * matches; the service has no generic "get all marketing data" or "run
 * campaign" method under those exact names).
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/ecommerceMarketingService');

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

router.get('/ecommerce-marketing', wrap((req) => svc.getMarketingAnalytics(req.query)));
router.post('/ecommerce-marketing/campaign', wrap((req) => svc.launchCampaign(req.body.campaignId)));

module.exports = router;
