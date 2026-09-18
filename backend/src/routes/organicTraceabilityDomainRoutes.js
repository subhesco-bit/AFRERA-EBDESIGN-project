/**
 * Real backend route for organicTraceabilityAPI.getConsumerTransparency,
 * backed by services/legacy/organicTraceabilityService.js's
 * getConsumerTransparencyByQR(qrCode) (name/shape difference: frontend
 * passes a params object with a qrCode field).
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/organicTraceabilityService');

const wrap = (fn) => async (req, res) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.get('/organic-traceability/consumer-transparency', wrap((req) => svc.getConsumerTransparencyByQR(req.query.qrCode)));

module.exports = router;
