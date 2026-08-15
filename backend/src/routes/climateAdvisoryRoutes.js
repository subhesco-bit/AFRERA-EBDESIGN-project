/**
 * Climate Advisory Routes (M083 — Climate domain)
 * Backs frontend/src/pages/ClimateAdvisoryPage.jsx. The agromet_advisories
 * table has existed since migration 057_climate_weather_d14.sql; this is the
 * first route that reads or writes it. See weatherService.js for the
 * listAdvisories/createAdvisory/updateAdvisory implementations — kept there
 * because they operate on the same migration 057 tables as the rest of
 * weatherService, not duplicated into a second data-access layer here.
 */

const express = require('express');
const router = express.Router();
const weatherService = require('../services/weatherService');
const { authMiddleware } = require('../middleware/auth');

router.get('/advisories', async (req, res) => {
  try {
    const data = await weatherService.listAdvisories({ district: req.query.region, limit: req.query.limit });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/advisories/:id', async (req, res) => {
  try {
    const advisory = await weatherService.getAdvisory(req.params.id);
    if (!advisory) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: advisory });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/advisories', authMiddleware, async (req, res) => {
  try {
    const advisory = await weatherService.createAdvisory(req.body);
    res.status(201).json({ success: true, data: advisory });
  } catch (error) {
    res.status(/required/i.test(error.message) ? 400 : 500).json({ success: false, error: error.message });
  }
});

router.put('/advisories/:id', authMiddleware, async (req, res) => {
  try {
    const advisory = await weatherService.updateAdvisory(req.params.id, req.body);
    if (!advisory) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: advisory });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
