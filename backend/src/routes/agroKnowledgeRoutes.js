/**
 * Agro Knowledge routes — /api/v1/agro-knowledge
 */
const express = require('express');
const agro = require('../modules/agro');
const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    module: 'agro-knowledge',
    tier: 'grok-highest',
    features: ['season_calendar', 'regional_systems', 'traditional_ipm', 'multi_seat_conference'],
  });
});

router.get('/season', (_req, res) => {
  res.json({ success: true, data: agro.currentSeason() });
});

router.get('/regions', (_req, res) => {
  res.json({ success: true, data: agro.REGIONAL_SYSTEMS });
});

router.get('/traditional', (_req, res) => {
  res.json({ success: true, data: agro.TRADITIONAL_AGRO, disclaimer: agro.AGRO_DISCLAIMER });
});

router.post('/conference', (req, res) => {
  try {
    res.json({ success: true, data: agro.runAgroConference(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message, disclaimer: agro.AGRO_DISCLAIMER });
  }
});

module.exports = router;
