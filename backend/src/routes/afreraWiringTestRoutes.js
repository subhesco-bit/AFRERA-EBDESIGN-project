/** Live wiring test endpoint */
'use strict';

const express = require('express');
const router = express.Router();
const { run } = require('../__tests__/afreraWiringSelfTest');

router.get('/health', (req, res) => {
  res.json({ success: true, service: 'afrera_wiring_test' });
});

router.post('/run', async (req, res) => {
  try {
    const report = await run();
    res.status(report.failed > 0 ? 500 : 200).json({ success: report.failed === 0, ...report });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/run', async (req, res) => {
  try {
    const report = await run();
    res.status(report.failed > 0 ? 500 : 200).json({ success: report.failed === 0, ...report });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
