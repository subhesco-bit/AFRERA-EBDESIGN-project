/**
 * Real backend routes for AnimalHealthPage.jsx, backed by
 * services/legacy/animalHealthService.js. Verified 1:1 against actual page
 * usage (two page method names differ slightly from the real ones:
 * listDiseaseOutbreaks -> listOutbreaks, listQuarantineRecords -> listQuarantines).
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/animalHealthService');

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

router.get('/animal-health/examinations', wrap((req) => svc.listExaminations(req.query)));
router.post('/animal-health/examination', wrap((req) => svc.createExamination(req.body)));
router.put('/animal-health/examination/:id', wrap((req) => svc.updateExamination(req.params.id, req.body)));
router.delete('/animal-health/examination/:id', wrap((req) => svc.deleteExamination(req.params.id)));

router.get('/animal-health/treatments', wrap((req) => svc.listTreatments(req.query)));
router.post('/animal-health/treatment', wrap((req) => svc.createTreatment(req.body)));
router.put('/animal-health/treatment/:id', wrap((req) => svc.updateTreatment(req.params.id, req.body)));
router.delete('/animal-health/treatment/:id', wrap((req) => svc.deleteTreatment(req.params.id)));

router.get('/animal-health/outbreaks', wrap((req) => svc.listOutbreaks(req.query)));
router.post('/animal-health/outbreak', wrap((req) => svc.createOutbreak(req.body)));
router.put('/animal-health/outbreak/:id', wrap((req) => svc.updateOutbreak(req.params.id, req.body)));
router.delete('/animal-health/outbreak/:id', wrap((req) => svc.deleteOutbreak(req.params.id)));
router.get('/animal-health/outbreaks/active', wrap(() => svc.getActiveOutbreaks()));

router.get('/animal-health/quarantines', wrap((req) => svc.listQuarantines(req.query)));
router.post('/animal-health/quarantine', wrap((req) => svc.createQuarantine(req.body)));
router.put('/animal-health/quarantine/:id', wrap((req) => svc.updateQuarantine(req.params.id, req.body)));
router.delete('/animal-health/quarantine/:id', wrap((req) => svc.deleteQuarantine(req.params.id)));
router.get('/animal-health/quarantines/active', wrap(() => svc.getActiveQuarantines()));

router.get('/animal-health/overview', wrap(() => svc.getHealthOverview()));

module.exports = router;
