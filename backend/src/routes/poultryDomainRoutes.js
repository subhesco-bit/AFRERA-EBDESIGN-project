/**
 * Real backend routes for PoultryManagementPage.jsx, backed by
 * services/legacy/poultryService.js. Exact 1:1 name matches throughout.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/poultryService');

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

router.get('/poultry/flocks', wrap((req) => svc.listFlocks(req.query)));
router.post('/poultry/flock', wrap((req) => svc.createFlock(req.body)));
router.put('/poultry/flock/:id', wrap((req) => svc.updateFlock(req.params.id, req.body)));
router.delete('/poultry/flock/:id', wrap((req) => svc.deleteFlock(req.params.id)));

router.get('/poultry/egg-production', wrap((req) => svc.listEggProduction(req.query.flockId, req.query)));
router.post('/poultry/egg-production', wrap((req) => svc.recordEggProduction(req.body)));

router.get('/poultry/feed-consumption', wrap((req) => svc.listFeedConsumption(req.query.flockId, req.query)));
router.post('/poultry/feed-consumption', wrap((req) => svc.recordFeedConsumption(req.body)));

router.get('/poultry/mortality', wrap((req) => svc.listMortality(req.query.flockId, req.query)));
router.post('/poultry/mortality', wrap((req) => svc.recordMortality(req.body)));

router.get('/poultry/vaccination-records', wrap((req) => svc.listVaccinationRecords(req.query.flockId, req.query)));
router.post('/poultry/vaccination-records', wrap((req) => svc.recordVaccination(req.body)));

router.get('/poultry/flock-performance', wrap((req) => svc.getFlockPerformance(req.query.flockId)));
router.get('/poultry/vaccination-alerts', wrap(() => svc.getVaccinationAlerts()));

module.exports = router;
