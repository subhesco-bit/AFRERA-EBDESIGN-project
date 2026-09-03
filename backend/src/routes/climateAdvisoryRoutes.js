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
const weatherService = require('../services/legacy/weatherService');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { PLATFORM_STAFF_ROLES } = require('../middleware/roleGroups');
const { rateLimiters } = require('../middleware/rateLimit');
const { validateId, bodyValidator, queryValidator, date, enumValue, fail, requestId } = require('./climateRouteSupport');
const { signalBus, SIGNAL, SEVERITY } = require('../core/signalBus');

const advisoryQuery = queryValidator((query) => {
  if (query.limit !== undefined && (!/^\d+$/.test(String(query.limit)) || Number(query.limit) < 1 || Number(query.limit) > 200)) {
    const error = new Error('limit must be an integer between 1 and 200'); error.status = 400; throw error;
  }
  if (query.region !== undefined && (typeof query.region !== 'string' || query.region.length > 80)) {
    const error = new Error('region must be at most 80 characters'); error.status = 400; throw error;
  }
});
const advisoryBody = bodyValidator((body) => {
  if (!body.advisory || typeof body.advisory !== 'string' || !body.advisory.trim()) throw new Error('advisory text is required');
  if (body.title !== undefined && (typeof body.title !== 'string' || body.title.length > 200)) throw new Error('title must be at most 200 characters');
  if (body.region !== undefined && (typeof body.region !== 'string' || body.region.length > 80)) throw new Error('region must be at most 80 characters');
  enumValue(body.type, 'type', ['Sowing', 'Irrigation', 'Pest Management', 'Harvest Timing', 'General']);
  date(body.valid_until, 'valid_until');
});
const advisoryUpdateBody = bodyValidator((body) => {
  if (!Object.keys(body).length) throw new Error('At least one field is required');
  if (body.advisory !== undefined && (typeof body.advisory !== 'string' || !body.advisory.trim())) throw new Error('advisory must not be blank');
  enumValue(body.type, 'type', ['Sowing', 'Irrigation', 'Pest Management', 'Harvest Timing', 'General']);
  date(body.valid_until, 'valid_until');
});

const advisoryFail = (req, res, error, operation) => fail(req, res, error, operation, error.status || 500);

router.get('/advisories', rateLimiters.read, advisoryQuery, async (req, res) => {
  try {
    const data = await weatherService.listAdvisories({ district: req.query.region, limit: req.query.limit });
    res.json({ success: true, data });
  } catch (error) { return advisoryFail(req, res, error, 'listAdvisories'); }
});

router.get('/advisories/:id', rateLimiters.read, validateId, async (req, res) => {
  try {
    const advisory = await weatherService.getAdvisory(req.params.id);
    if (!advisory) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: advisory });
  } catch (error) { return advisoryFail(req, res, error, 'getAdvisory'); }
});

router.post('/advisories', rateLimiters.write, authMiddleware, advisoryBody, async (req, res) => {
  try {
    const advisory = await weatherService.createAdvisory(req.body);
    signalBus.emitSignal(SIGNAL.WEATHER_ALERT, { advisoryId: advisory.id, kind: 'advisory', source: advisory.source }, {
      severity: SEVERITY.NOTICE, source: 'climate_advisory_routes', entityId: String(advisory.id), correlationId: requestId(req, 'climate-advisory')
    });
    res.status(201).json({ success: true, data: advisory });
  } catch (error) { return advisoryFail(req, res, error, 'createAdvisory'); }
});

router.put('/advisories/:id', rateLimiters.write, authMiddleware, requireRole(...PLATFORM_STAFF_ROLES), validateId, advisoryUpdateBody, async (req, res) => {
  try {
    const advisory = await weatherService.updateAdvisory(req.params.id, req.body);
    if (!advisory) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: advisory });
  } catch (error) { return advisoryFail(req, res, error, 'updateAdvisory'); }
});

module.exports = router;
