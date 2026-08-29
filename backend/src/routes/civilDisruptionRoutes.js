/**
 * Civil Disruption / Blockade Response Routes.
 * See services/civilDisruptionService.js.
 */

const express = require('express');
const router = express.Router();
const civilDisruptionService = require('../services/legacy/civilDisruptionService');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/admin');

router.post('/', authMiddleware, async (req, res) => {
  try {
    const event = await civilDisruptionService.report({ ...req.body, reportedBy: req.user?.id });
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/active', async (req, res) => {
  try {
    const { state, district } = req.query;
    const events = await civilDisruptionService.listActive({ state, district });
    res.json({ success: true, count: events.length, data: events });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:id/verify', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const event = await civilDisruptionService.verify(req.params.id, req.user?.id);
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:id/resolve', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const event = await civilDisruptionService.resolve(req.params.id, req.body?.endDate);
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/shipments/:shipmentId/risk', authMiddleware, async (req, res) => {
  try {
    const result = await civilDisruptionService.checkShipmentRisk(req.params.shipmentId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
