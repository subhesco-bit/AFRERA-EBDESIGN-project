/**
 * Weather × geofence crop decisions
 * /api/v1/crop-decision  ·  /api/v1/afrera/crop-decision
 */

'use strict';

const express = require('express');
const router = express.Router();
const engine = require('../services/agro/weatherCropDecisionEngine');

router.get('/health', (req, res) => {
  res.json({ success: true, service: 'weather_crop_decision', layer: 'farmer' });
});

router.get('/zones', (req, res) => {
  res.json({ success: true, zones: engine.AGRO_ZONES });
});

router.get('/crops', (req, res) => {
  res.json({ success: true, crops: engine.CROPS });
});

router.post('/decide', async (req, res) => {
  try {
    res.json({ success: true, ...engine.decide(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/weather-blend', async (req, res) => {
  try {
    res.json({
      success: true,
      ...engine.blendWeatherSources(req.body?.location || req.body, req.body || {}),
    });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/operate', async (req, res) => {
  try {
    res.json({ success: true, ...(await engine.operate(req.body || {})) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

module.exports = router;
