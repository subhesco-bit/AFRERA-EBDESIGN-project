'use strict';

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const service = require('../services/farmerVerificationService');

const router = express.Router();
router.use(authMiddleware);

router.get('/requests', async (req, res, next) => {
  try { res.json({ success: true, data: await service.listRequests(req.query) }); } catch (error) { next(error); }
});

router.post('/requests', async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await service.createRequest(req.body) }); } catch (error) { next(error); }
});

router.put('/requests/:id/verify', async (req, res, next) => {
  try {
    const result = await service.updateDecision(req.params.id, 'Verified', req.body?.notes);
    if (!result) return res.status(404).json({ success: false, error: 'Verification request not found' });
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

router.put('/requests/:id/reject', async (req, res, next) => {
  try {
    const result = await service.updateDecision(req.params.id, 'Rejected', req.body?.reason);
    if (!result) return res.status(404).json({ success: false, error: 'Verification request not found' });
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

module.exports = router;