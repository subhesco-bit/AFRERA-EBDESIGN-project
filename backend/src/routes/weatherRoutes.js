/**
 * Domain D14 routes. Reads are public — a farmer must be able to see an alert
 * without an account, and withholding a flood warning behind a login is not a
 * security posture. Writes are authenticated.
 */
const express = require('express');
const router = express.Router();
const w = require('../services/weatherService');
const { authMiddleware } = require('../middleware/auth');
const fail = (res, e) => res.status(/required|must|Unknown/i.test(e.message) ? 400 : 500)
  .json({ success: false, error: e.message });

router.get('/coverage', async (req, res) => {
  try { res.json({ success: true, data: await w.coverage() }); } catch (e) { fail(res, e); }
});
router.get('/for-arp', async (req, res) => {
  try {
    const { state, district, days } = req.query;
    if (!state || !district) throw new Error('state and district are required');
    res.json({ success: true, data: await w.weatherForArp({ state, district, days: Number(days) || 120 }) });
  } catch (e) { fail(res, e); }
});
router.get('/alerts/active', async (req, res) => {
  try { res.json({ success: true, data: await w.activeDispatchBlocks() }); } catch (e) { fail(res, e); }
});
router.get('/alerts/dispatch-check', async (req, res) => {
  try {
    const d = (req.query.districts || '').split(',').map((s) => s.trim()).filter(Boolean);
    res.json({ success: true, data: await w.dispatchCheck(d) });
  } catch (e) { fail(res, e); }
});
router.get('/pest-forecast', async (req, res) => {
  try { res.json({ success: true, data: await w.pestForecast(req.query) }); } catch (e) { fail(res, e); }
});
router.get('/forecast-accuracy', async (req, res) => {
  try { res.json({ success: true, data: await w.forecastAccuracy() }); } catch (e) { fail(res, e); }
});
// Real threshold-breach advisory candidates (SPI/SPEI drought-wet + trailing
// heat-stress days) — see weatherService.getAdvisoryTriggers() for the basis
// of each threshold.
router.get('/advisory-triggers', async (req, res) => {
  try { res.json({ success: true, data: await w.getAdvisoryTriggers(req.query) }); } catch (e) { fail(res, e); }
});
router.post('/observations', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await w.recordObservation(req.body) }); } catch (e) { fail(res, e); }
});
router.post('/forecasts', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await w.recordForecast(req.body) }); } catch (e) { fail(res, e); }
});
router.post('/forecasts/score', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await w.scoreForecasts() }); } catch (e) { fail(res, e); }
});
router.post('/alerts', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await w.raiseAlert(req.body) }); } catch (e) { fail(res, e); }
});
module.exports = router;
