/**
 * Real backend routes for CompleteERPIntegrationPage.jsx's per-module ERP
 * sync action cards, backed by services/legacy/completeERPIntegrationService.js.
 * Real method names all carry a "WithERP" suffix the page's method names
 * don't (e.g. syncFarmerCropPlanning -> syncFarmerCropPlanningWithERP).
 *
 * NOTE: forceSyncAllERPIntegrations and getERPIntegrationStatus, which the
 * page also calls, don't exist anywhere in this service - genuinely unbuilt,
 * not wired here rather than faked.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/completeERPIntegrationService');

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

router.post('/complete-erp-integration/sync-farmer-crop-planning/:farmerId', wrap((req) => svc.syncFarmerCropPlanningWithERP(req.params.farmerId, req.body)));
router.post('/complete-erp-integration/sync-farmer-harvest/:farmerId', wrap((req) => svc.syncFarmerHarvestWithERP(req.params.farmerId, req.body)));
router.post('/complete-erp-integration/sync-farmer-field/:farmerId', wrap((req) => svc.syncFarmerFieldWithERP(req.params.farmerId, req.body)));
router.post('/complete-erp-integration/sync-crop-lifecycle/:cropId', wrap((req) => svc.syncCropLifecycleWithERP(req.params.cropId, req.body)));
router.post('/complete-erp-integration/sync-crop-yield/:cropId', wrap((req) => svc.syncCropYieldWithERP(req.params.cropId, req.body)));
router.post('/complete-erp-integration/sync-livestock/:livestockId', wrap((req) => svc.syncLivestockWithERP(req.params.livestockId, req.body)));
router.post('/complete-erp-integration/sync-livestock-production/:livestockId', wrap((req) => svc.syncLivestockProductionWithERP(req.params.livestockId, req.body)));
router.post('/complete-erp-integration/sync-livestock-health/:livestockId', wrap((req) => svc.syncLivestockHealthWithERP(req.params.livestockId, req.body)));
router.post('/complete-erp-integration/sync-dairy-production/:dairyId', wrap((req) => svc.syncDairyProductionWithERP(req.params.dairyId, req.body)));
router.post('/complete-erp-integration/sync-poultry-production/:poultryId', wrap((req) => svc.syncPoultryProductionWithERP(req.params.poultryId, req.body)));
router.post('/complete-erp-integration/sync-goat-production/:goatId', wrap((req) => svc.syncGoatProductionWithERP(req.params.goatId, req.body)));
router.post('/complete-erp-integration/sync-sheep-production/:sheepId', wrap((req) => svc.syncSheepProductionWithERP(req.params.sheepId, req.body)));
router.post('/complete-erp-integration/sync-pig-production/:pigId', wrap((req) => svc.syncPigProductionWithERP(req.params.pigId, req.body)));

module.exports = router;
