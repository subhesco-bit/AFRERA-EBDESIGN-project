/**
 * Full-Truck Window (freight pooling) Routes. See services/freightPoolingService.js.
 */

const express = require('express');
const router = express.Router();
const freightPoolingService = require('../services/legacy/freightPoolingService');
const { authMiddleware } = require('../middleware/auth');

router.get('/poolable-shipments', authMiddleware, async (req, res) => {
  try {
    const { originAddress, destinationAddress } = req.query;
    if (!originAddress || !destinationAddress) {
      return res.status(400).json({ success: false, error: 'originAddress and destinationAddress are required' });
    }
    const shipments = await freightPoolingService.findPoolableShipments(originAddress, destinationAddress);
    res.json({ success: true, count: shipments.length, data: shipments });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/windows', authMiddleware, async (req, res) => {
  try {
    const window = await freightPoolingService.createPoolWindow(req.body);
    res.status(201).json({ success: true, data: window });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/windows', authMiddleware, async (req, res) => {
  try {
    const windows = await freightPoolingService.listOpenWindows();
    res.json({ success: true, count: windows.length, data: windows });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/windows/:windowId', authMiddleware, async (req, res) => {
  try {
    let window = await freightPoolingService.getPoolWindow(req.params.windowId);
    res.json({ success: true, data: window });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.post('/windows/:windowId/join', authMiddleware, async (req, res) => {
  try {
    const result = await freightPoolingService.joinPoolWindow(req.params.windowId, req.body.shipmentId);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/windows/:windowId/dispatch', authMiddleware, async (req, res) => {
  try {
    let window = await freightPoolingService.closeAndDispatch(req.params.windowId);
    res.json({ success: true, data: window });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
