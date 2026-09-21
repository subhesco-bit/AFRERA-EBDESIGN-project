'use strict';

/** Multi-party trade escrow — /api/v1/trade-escrow */

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const escrow = require('../services/legacy/multiPartyEscrowService');

const router = express.Router();

router.get('/capabilities', authMiddleware, (req, res) => {
  res.json({ success: true, data: escrow.getCapabilities() });
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const data = await escrow.listEscrows({
      escrowType: req.query.type,
      status: req.query.status,
      payerId: req.query.payerId,
      payeeId: req.query.payeeId,
      limit: req.query.limit,
    });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const data = await escrow.createEscrow({
      ...req.body,
      escrowType: req.body.escrowType || req.body.type,
      actorUserId: req.user.id,
    });
    res.status(201).json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const data = await escrow.getEscrow(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Escrow not found' });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/:id/events', authMiddleware, async (req, res) => {
  try {
    const data = await escrow.listEvents(req.params.id);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/:id/releases', authMiddleware, async (req, res) => {
  try {
    const data = await escrow.listReleases(req.params.id);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/:id/fund', authMiddleware, async (req, res) => {
  try {
    const data = await escrow.fundEscrow(req.params.id, {
      ...req.body,
      actorUserId: req.user.id,
    });
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/:id/freeze', authMiddleware, async (req, res) => {
  try {
    const data = await escrow.freezeEscrow(req.params.id, {
      ...req.body,
      actorUserId: req.user.id,
    });
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/:id/unfreeze', authMiddleware, async (req, res) => {
  try {
    const data = await escrow.unfreezeEscrow(req.params.id, { actorUserId: req.user.id });
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/:id/conditions', authMiddleware, async (req, res) => {
  try {
    const data = await escrow.setCondition(req.params.id, {
      ...req.body,
      actorUserId: req.user.id,
    });
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/:id/release', authMiddleware, async (req, res) => {
  try {
    const data = await escrow.releaseEscrow(req.params.id, {
      force: Boolean(req.body.force),
      forceReason: req.body.forceReason,
      actorUserId: req.user.id,
    });
    res.json({ success: true, data });
  } catch (e) {
    const status = e.code === 'CONDITIONS_UNMET' ? 422 : 400;
    res.status(status).json({
      success: false,
      error: e.message,
      code: e.code,
      missing: e.missing,
    });
  }
});

router.post('/:id/refund', authMiddleware, async (req, res) => {
  try {
    const data = await escrow.refundEscrow(req.params.id, {
      reason: req.body.reason,
      actorUserId: req.user.id,
    });
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/releases/:releaseId/paid', authMiddleware, async (req, res) => {
  try {
    const data = await escrow.markReleasePaid(req.params.releaseId, req.body);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

module.exports = router;
