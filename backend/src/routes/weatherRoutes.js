/**
 * Domain D14 routes. Reads are public — a farmer must be able to see an alert
 * without an account, and withholding a flood warning behind a login is not a
 * security posture. Writes are authenticated.
 */
const express = require('express');
const router = express.Router();
const w = require('../services/legacy/weatherService');
const { authMiddleware } = require('../middleware/auth');
const { rateLimiters } = require('../middleware/rateLimit');
const { bodyValidator, queryValidator, date, dateTime, enumValue, numberValue, fail, invalid, requestId } = require('./climateRouteSupport');
const { signalBus, SIGNAL, SEVERITY } = require('../core/signalBus');
const failWeather = (req, res, error, operation) => fail(req, res, error, operation, error.status || 500);
const daysQuery = queryValidator((q) => numberValue(q.days === undefined ? undefined : Number(q.days), 'days', { min: 1, max: 120, integer: true }));

router.get('/coverage', rateLimiters.read, async (req, res) => {
  try { res.json({ success: true, data: await w.coverage() }); } catch (e) { failWeather(req, res, e, 'coverage'); }
});
router.get('/for-arp', rateLimiters.read, daysQuery, async (req, res) => {
  try {
    const { state, district, days } = req.query;
    if (!state || !district) return failWeather(req, res, invalid('state and district are required'), 'forArp');
    res.json({ success: true, data: await w.weatherForArp({ state, district, days: Number(days) || 120 }) });
  } catch (e) { failWeather(req, res, e, 'forArp'); }
});
router.get('/alerts/active', rateLimiters.read, async (req, res) => {
  try { res.json({ success: true, data: await w.activeDispatchBlocks() }); } catch (e) { failWeather(req, res, e, 'activeAlerts'); }
});
router.get('/alerts/dispatch-check', rateLimiters.read, async (req, res) => {
  try {
    const d = (req.query.districts || '').split(',').map((s) => s.trim()).filter(Boolean);
    res.json({ success: true, data: await w.dispatchCheck(d) });
  } catch (e) { failWeather(req, res, e, 'dispatchCheck'); }
});
router.get('/pest-forecast', rateLimiters.read, daysQuery, async (req, res) => {
  try { res.json({ success: true, data: await w.pestForecast(req.query) }); } catch (e) { failWeather(req, res, e, 'pestForecast'); }
});
router.get('/forecast-accuracy', rateLimiters.read, async (req, res) => {
  try { res.json({ success: true, data: await w.forecastAccuracy() }); } catch (e) { failWeather(req, res, e, 'forecastAccuracy'); }
});
// Real threshold-breach advisory candidates (SPI/SPEI drought-wet + trailing
// heat-stress days) — see weatherService.getAdvisoryTriggers() for the basis
// of each threshold.
router.get('/advisory-triggers', rateLimiters.read, async (req, res) => {
  try { res.json({ success: true, data: await w.getAdvisoryTriggers(req.query) }); } catch (e) { failWeather(req, res, e, 'advisoryTriggers'); }
});
router.post('/observations', rateLimiters.write, authMiddleware, bodyValidator((b) => { if (!b.stationId || !b.observedOn) throw new Error('stationId and observedOn are required'); date(b.observedOn, 'observedOn', { futureDays: 0 }); numberValue(b.humidityPct, 'humidityPct', { min: 0, max: 100 }); }), async (req, res) => {
  try { res.json({ success: true, data: await w.recordObservation(req.body) }); } catch (e) { failWeather(req, res, e, 'recordObservation'); }
});
router.post('/forecasts', rateLimiters.write, authMiddleware, bodyValidator((b) => { if (!b.validFor) throw new Error('validFor is required'); date(b.validFor, 'validFor'); numberValue(b.horizonDays, 'horizonDays', { min: 0, max: 30, integer: true }); enumValue(b.provider, 'provider', ['imd', 'openweather', 'ecmwf', 'gfs', 'ensemble', 'local_model']); }), async (req, res) => {
  try { res.json({ success: true, data: await w.recordForecast(req.body) }); } catch (e) { failWeather(req, res, e, 'recordForecast'); }
});
router.post('/forecasts/score', rateLimiters.write, authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await w.scoreForecasts() }); } catch (e) { failWeather(req, res, e, 'scoreForecasts'); }
});
router.post('/alerts', rateLimiters.write, authMiddleware, bodyValidator((b) => { for (const field of ['alertCode', 'alertType', 'severity', 'headline', 'recommendedAction', 'effectiveFrom', 'effectiveUntil']) if (!b[field]) throw new Error(`${field} is required`); enumValue(b.alertType, 'alertType', ['heavy_rain', 'flood', 'landslide', 'drought', 'hailstorm', 'cold_wave', 'heat_wave', 'cyclone', 'earthquake', 'frost', 'pest_outbreak']); enumValue(b.severity, 'severity', ['advisory', 'watch', 'warning', 'severe', 'extreme']); dateTime(b.effectiveFrom, 'effectiveFrom'); dateTime(b.effectiveUntil, 'effectiveUntil'); if (new Date(b.effectiveUntil) < new Date(b.effectiveFrom)) throw new Error('effectiveUntil must be on or after effectiveFrom'); }), async (req, res) => {
  try { const alert = await w.raiseAlert(req.body); signalBus.emitSignal(SIGNAL.WEATHER_ALERT, { alertId: alert.id, alertCode: alert.alert_code, severity: alert.severity }, { severity: alert.severity === 'extreme' ? SEVERITY.EMERGENCY : SEVERITY.WARNING, source: 'weather_routes', entityId: String(alert.id), correlationId: requestId(req, 'weather') }); res.json({ success: true, data: alert }); } catch (e) { failWeather(req, res, e, 'raiseAlert'); }
});
module.exports = router;
