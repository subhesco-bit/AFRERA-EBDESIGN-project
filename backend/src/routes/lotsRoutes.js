'use strict';

/**
 * Living Lots API — /api/v1/lots
 *
 * The storage layer for value-chain-control/lotKernel.js. A farmer cell
 * mints a lot; offtake settles against it; remaining mass always stays on
 * the lot row. The companion may propose mint/settle inputs, but a
 * settlement always requires a paymentRef supplied by a clerk — AI cannot
 * write rupees.
 */

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const lots = require('../value-chain-control/lotService');

const router = express.Router();

router.get('/cells', authMiddleware, async (req, res) => {
  try {
    res.json({ success: true, data: await lots.listCells() });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/cells', authMiddleware, async (req, res) => {
  try {
    const cell = await lots.createCell(req.body);
    res.status(201).json({ success: true, data: cell });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const data = await lots.listLots({ cellId: req.query.cellId, status: req.query.status });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    res.json({ success: true, data: await lots.getLot(req.params.id) });
  } catch (e) {
    res.status(e.message === 'Lot not found' ? 404 : 500).json({ success: false, error: e.message });
  }
});

router.get('/:id/events', authMiddleware, async (req, res) => {
  try {
    res.json({ success: true, data: await lots.listEvents(req.params.id) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/mint', authMiddleware, async (req, res) => {
  try {
    const lot = await lots.mintLot(req.body);
    res.status(201).json({ success: true, data: lot });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/:id/settle', authMiddleware, async (req, res) => {
  try {
    const data = await lots.settleLot(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/:id/spoilage', authMiddleware, async (req, res) => {
  try {
    const data = await lots.declareSpoilage(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

module.exports = router;
