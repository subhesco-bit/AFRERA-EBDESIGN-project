'use strict';

/** FPO Operations Hub — /api/v1/fpo-operations */

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const fpo = require('../services/legacy/fpoOperationsService');

const router = express.Router();

router.get('/capabilities', authMiddleware, (req, res) => {
  res.json({ success: true, data: fpo.getCapabilities() });
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const data = await fpo.listFpos({
      state: req.query.state,
      status: req.query.status,
      limit: req.query.limit,
    });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const data = await fpo.createFpo(req.body);
    res.status(201).json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.get('/:fpoId', authMiddleware, async (req, res) => {
  try {
    const data = await fpo.getFpo(req.params.fpoId);
    if (!data) return res.status(404).json({ success: false, error: 'FPO not found' });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/:fpoId/members', authMiddleware, async (req, res) => {
  try {
    const data = await fpo.listMembers(req.params.fpoId, { status: req.query.status });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/:fpoId/members', authMiddleware, async (req, res) => {
  try {
    const data = await fpo.addMember(req.params.fpoId, req.body);
    res.status(201).json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/:fpoId/lots', authMiddleware, async (req, res) => {
  try {
    const data = await fpo.openPoolLot(req.params.fpoId, req.body);
    res.status(201).json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/lots/:lotId/contribute', authMiddleware, async (req, res) => {
  try {
    const data = await fpo.contributeToLot(req.params.lotId, req.body.memberId, req.body);
    res.status(201).json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/lots/:lotId/sell', authMiddleware, async (req, res) => {
  try {
    const data = await fpo.sellPoolLot(req.params.lotId, req.body);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.get('/:fpoId/payouts', authMiddleware, async (req, res) => {
  try {
    const data = await fpo.listPayouts(req.params.fpoId, {
      status: req.query.status,
      limit: req.query.limit,
    });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/payouts/:payoutId/paid', authMiddleware, async (req, res) => {
  try {
    const data = await fpo.markPayoutPaid(req.params.payoutId, req.body);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

module.exports = router;
