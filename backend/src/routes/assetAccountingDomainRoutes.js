/**
 * Real backend routes for AssetAccountingPage.jsx, backed by
 * services/legacy/assetAccountingService.js. Exact 1:1 name matches.
 * (Note: distinct from the already-mounted routes/assetAccountingRoutes.js
 * used by module M308 - that one exists and is real too; this page's
 * calls use a different, wider set of the same service's methods.)
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/assetAccountingService');

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

router.post('/asset-accounting/asset', wrap((req) => svc.createAsset(req.body)));
router.get('/asset-accounting/assets/:companyId', wrap((req) => svc.getAssets(req.params.companyId, req.query)));
router.get('/asset-accounting/asset/:assetId', wrap((req) => svc.getAsset(req.params.assetId)));
router.post('/asset-accounting/asset/:assetId/depreciation-schedule', wrap((req) => svc.generateDepreciationSchedule(req.params.assetId)));
router.get('/asset-accounting/asset/:assetId/depreciation-schedule', wrap((req) => svc.getDepreciationSchedule(req.params.assetId)));
router.post('/asset-accounting/asset/:assetId/post-depreciation', wrap((req) => svc.postDepreciationPeriod(req.params.assetId, req.body.periodDate)));
router.post('/asset-accounting/company/:companyId/run-depreciation', wrap((req) => svc.runDepreciationForPeriod(req.params.companyId, req.body.asOfDate)));
router.post('/asset-accounting/asset/:assetId/dispose', wrap((req) => svc.disposeAsset(req.params.assetId, req.body)));
router.get('/asset-accounting/company/:companyId/register-summary', wrap((req) => svc.getAssetRegisterSummary(req.params.companyId)));

module.exports = router;
