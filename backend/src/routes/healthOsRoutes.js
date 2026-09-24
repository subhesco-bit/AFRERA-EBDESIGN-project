const express = require('express');
const { getReadiness } = require('../modules/healthos/UnifiedReadiness');
const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, module: 'health-os' });
});

router.get('/readiness', (_req, res) => {
  res.json({ success: true, data: getReadiness() });
});

module.exports = router;
