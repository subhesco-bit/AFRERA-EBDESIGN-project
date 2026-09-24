/** Farmer vs Ecommerce layer boundary */
'use strict';

const express = require('express');
const router = express.Router();

let boundary;
let farmBridge;
try {
  boundary = require('../services/layers/layerBoundary');
} catch {
  boundary = null;
}
try {
  farmBridge = require('../services/layers/farmCommerceBridge');
} catch {
  farmBridge = null;
}

router.get('/health', (req, res) => {
  res.json({ success: true, boundary: !!boundary, farmBridge: !!farmBridge });
});

router.post('/assert', (req, res) => {
  if (!boundary) return res.status(503).json({ success: false });
  try {
    const out = boundary.assertLayer(req.body?.layer, req.body?.context || req.body);
    res.json({ success: true, ...out });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message, code: e.code });
  }
});

router.post('/bridge/listing', async (req, res) => {
  if (!farmBridge) return res.status(503).json({ success: false });
  res.json({ success: true, ...(await farmBridge.listingFromLot(req.body || {})) });
});

module.exports = router;
