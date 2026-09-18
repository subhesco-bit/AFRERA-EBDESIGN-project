/**
 * Real backend routes for SheepFarmingPage.jsx, backed by
 * services/legacy/sheepService.js. Exact 1:1 name matches throughout.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/sheepService');

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

router.get('/sheep/flock', wrap((req) => svc.listFlock(req.query)));
router.post('/sheep/animal', wrap((req) => svc.createAnimal(req.body)));
router.put('/sheep/animal/:id', wrap((req) => svc.updateAnimal(req.params.id, req.body)));
router.delete('/sheep/animal/:id', wrap((req) => svc.deleteAnimal(req.params.id)));

router.get('/sheep/wool-production', wrap((req) => svc.listWoolProduction(req.query.animalId, req.query)));
router.post('/sheep/wool-production', wrap((req) => svc.recordWoolProduction(req.body)));

router.get('/sheep/feed-consumption', wrap((req) => svc.listFeedConsumption(req.query.animalId, req.query)));
router.post('/sheep/feed-consumption', wrap((req) => svc.recordFeedConsumption(req.body)));

router.get('/sheep/breeding-records', wrap((req) => svc.listBreedingRecords(req.query.femaleId, req.query)));
router.post('/sheep/breeding-records', wrap((req) => svc.recordBreeding(req.body)));
router.put('/sheep/lambing-outcome/:id', wrap((req) => svc.updateLambingOutcome(req.params.id, req.body)));

router.get('/sheep/vaccination-records', wrap((req) => svc.listVaccinationRecords(req.query.animalId, req.query)));
router.post('/sheep/vaccination-records', wrap((req) => svc.recordVaccination(req.body)));

router.get('/sheep/flock-performance', wrap((req) => svc.getFlockPerformance(req.query.animalId)));
router.get('/sheep/breeding-alerts', wrap(() => svc.getBreedingAlerts()));
router.get('/sheep/vaccination-alerts', wrap(() => svc.getVaccinationAlerts()));
router.get('/sheep/shearing-alerts', wrap(() => svc.getShearingAlerts()));

module.exports = router;
