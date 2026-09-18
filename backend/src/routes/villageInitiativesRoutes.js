'use strict';

const express = require('express');
const authMiddleware = require('../middleware/auth');
const service = require('../services/legacy/villageInitiativesService');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res, next) => {
  try { res.json({ success: true, data: await service.listInitiatives(req.query) }); } catch (e) { next(e); }
});

router.get('/summary/:villageId', async (req, res, next) => {
  try { res.json({ success: true, data: await service.getVillageSummary(req.params.villageId) }); } catch (e) { next(e); }
});

router.get('/:initiativeId/updates', async (req, res, next) => {
  try { res.json({ success: true, data: await service.getUpdates(req.params.initiativeId) }); } catch (e) { next(e); }
});

router.get('/:initiativeId/beneficiaries', async (req, res, next) => {
  try { res.json({ success: true, data: await service.getBeneficiaries(req.params.initiativeId) }); } catch (e) { next(e); }
});

router.get('/:initiativeId/milestones', async (req, res, next) => {
  try { res.json({ success: true, data: await service.getMilestones(req.params.initiativeId) }); } catch (e) { next(e); }
});

router.get('/:initiativeId', async (req, res, next) => {
  try { res.json({ success: true, data: await service.getInitiative(req.params.initiativeId) }); } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    res.status(201).json({ success: true, data: await service.createInitiative({ ...req.body, created_by: req.user?.id || req.body.created_by }) });
  } catch (e) { next(e); }
});

router.patch('/:initiativeId', async (req, res, next) => {
  try { res.json({ success: true, data: await service.updateInitiative(req.params.initiativeId, req.body, req.user || {}) }); } catch (e) { next(e); }
});

router.post('/:initiativeId/beneficiaries', async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await service.addBeneficiary(req.params.initiativeId, req.body) }); } catch (e) { next(e); }
});

router.post('/:initiativeId/milestones', async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await service.addMilestone(req.params.initiativeId, req.body) }); } catch (e) { next(e); }
});

module.exports = router;
