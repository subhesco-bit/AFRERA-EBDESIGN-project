'use strict';

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const service = require('../services/farmerKycService');

const router = express.Router();
router.use(authMiddleware);

router.get('/applications', async (req, res, next) => {
  try { res.json({ success: true, data: await service.list(req.query) }); } catch (error) { next(error); }
});
router.get('/applications/:id', async (req, res, next) => {
  try {
    const result = await service.get(req.params.id);
    if (!result) return res.status(404).json({ success: false, error: 'KYC application not found' });
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});
router.post('/applications', async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await service.create(req.body) }); } catch (error) { next(error); }
});
router.put('/applications/:id/verify', async (req, res, next) => {
  try {
    const result = await service.decide(req.params.id, 'verified', req.body?.notes);
    if (!result) return res.status(404).json({ success: false, error: 'KYC application not found' });
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});
router.put('/applications/:id/reject', async (req, res, next) => {
  try {
    const result = await service.decide(req.params.id, 'rejected', req.body?.reason);
    if (!result) return res.status(404).json({ success: false, error: 'KYC application not found' });
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

module.exports = router;