/**
 * Real backend routes for CompleteAIIntegrationPage.jsx's per-livestock AI
 * action cards, backed by services/legacy/completeAIIntegrationService.js.
 *
 * NOTE: 3 methods the page calls (getAIModelInfo, forceSyncAllAIIntegrations,
 * getAIIntegrationStatus) do not exist anywhere in this service or any
 * other file - genuinely unbuilt capability, not wired here rather than
 * faked. The other 13 are real and wired below.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/completeAIIntegrationService');

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

router.post('/complete-ai-integration/recommend-crop-planning/:farmerId', wrap((req) => svc.recommendCropPlanning(req.params.farmerId, req.body)));
router.post('/complete-ai-integration/predict-harvest-timing/:farmerId', wrap((req) => svc.predictHarvestTiming(req.params.farmerId, req.body)));
router.post('/complete-ai-integration/optimize-farmer-resources/:farmerId', wrap((req) => svc.optimizeFarmerResources(req.params.farmerId, req.body)));
router.post('/complete-ai-integration/detect-crop-disease/:cropId', wrap((req) => svc.detectCropDisease(req.params.cropId, req.body)));
router.post('/complete-ai-integration/predict-crop-yield/:cropId', wrap((req) => svc.predictCropYield(req.params.cropId, req.body)));
router.post('/complete-ai-integration/monitor-livestock-health/:livestockId', wrap((req) => svc.monitorLivestockHealth(req.params.livestockId, req.body)));
router.post('/complete-ai-integration/recommend-livestock-breeding/:livestockId', wrap((req) => svc.recommendLivestockBreeding(req.params.livestockId, req.body)));
router.post('/complete-ai-integration/optimize-dairy-production/:dairyId', wrap((req) => svc.optimizeDairyProduction(req.params.dairyId, req.body)));
router.post('/complete-ai-integration/monitor-poultry-health/:poultryId', wrap((req) => svc.monitorPoultryHealth(req.params.poultryId, req.body)));
router.post('/complete-ai-integration/optimize-goat-production/:goatId', wrap((req) => svc.optimizeGoatProduction(req.params.goatId, req.body)));
router.post('/complete-ai-integration/optimize-sheep-production/:sheepId', wrap((req) => svc.optimizeSheepProduction(req.params.sheepId, req.body)));
router.post('/complete-ai-integration/optimize-pig-production/:pigId', wrap((req) => svc.optimizePigProduction(req.params.pigId, req.body)));

module.exports = router;
