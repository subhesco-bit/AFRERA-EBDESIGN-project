'use strict';

/** Warehouse Receipt System — /api/v1/warehouse-receipts */

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const wr = require('../services/legacy/warehouseReceiptService');

const router = express.Router();

router.get('/capabilities', authMiddleware, (req, res) => {
  res.json({ success: true, data: wr.getCapabilities() });
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const data = await wr.listReceipts({
      facilityId: req.query.facilityId,
      fpoId: req.query.fpoId,
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
    const data = await wr.createReceipt({
      ...req.body,
      actorUserId: req.user.id,
    });
    res.status(201).json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const data = await wr.getReceipt(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Receipt not found' });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/:id/events', authMiddleware, async (req, res) => {
  try {
    const data = await wr.listEvents(req.params.id);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/:id/pledge', authMiddleware, async (req, res) => {
  try {
    const data = await wr.pledgeReceipt(req.params.id, {
      ...req.body,
      actorUserId: req.user.id,
    });
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/:id/release-lien', authMiddleware, async (req, res) => {
  try {
    const data = await wr.releaseLien(req.params.id, {
      ...req.body,
      actorUserId: req.user.id,
    });
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/:id/release-stock', authMiddleware, async (req, res) => {
  try {
    const data = await wr.releaseStock(req.params.id, {
      ...req.body,
      actorUserId: req.user.id,
    });
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

module.exports = router;
