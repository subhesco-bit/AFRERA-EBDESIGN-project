/**
 * FOLU Benchmark Routes. See services/foluBenchmarkService.js for the real
 * framework source and the honesty discipline (never estimates a
 * transition it has no real data for).
 */

const express = require('express');
const router = express.Router();
const foluBenchmarkService = require('../services/legacy/foluBenchmarkService');
const { authMiddleware } = require('../middleware/auth');

router.get('/transitions', async (req, res) => {
  res.json({ success: true, data: await foluBenchmarkService.listTransitions() });
});

router.get('/report', authMiddleware, async (req, res) => {
  try {
    const report = await foluBenchmarkService.getBenchmarkReport();
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
