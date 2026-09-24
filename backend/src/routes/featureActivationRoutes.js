/**
 * Activated hidden features API
 * Mount: /api/v1/features
 */

'use strict';

const express = require('express');
const router = express.Router();
const hub = require('../services/hidden/featureActivationHub');

router.get('/health', (req, res) => {
  res.json({ success: true, status: 'healthy', service: 'feature_activation_hub' });
});

router.get('/', (req, res) => {
  res.json({ success: true, ...hub.listFeatures() });
});

router.post('/:feature', async (req, res) => {
  try {
    const out = await hub.operate({ ...req.body, feature: req.params.feature });
    res.status(out.error ? 400 : 200).json({ success: !out.error, ...out });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/operate', async (req, res) => {
  try {
    const out = await hub.operate(req.body || {});
    res.json({ success: true, ...out });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
