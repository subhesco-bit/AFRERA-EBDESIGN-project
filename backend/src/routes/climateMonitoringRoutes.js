/**
 * Routes for the 5 Climate-domain CRUD resources - see
 * backend/src/services/climateMonitoringService.js for why these are named
 * services rather than numbered module folders.
 *
 * Each is mounted at its own flat prefix in index.js to match the exact
 * paths frontend/src/services/api.js already calls (e.g. /api/v1/drought-monitoring),
 * so no frontend change is needed.
 */

'use strict';

const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { FARM_OPERATIONS_ROLES } = require('../middleware/roleGroups');
const { rateLimiters } = require('../middleware/rateLimit');
const { validateId, parsePageQuery, bodyValidator, date, enumValue, numberValue, fail } = require('./climateRouteSupport');
const {
  droughtMonitoring, floodMonitoring, diseaseForecasting, climateRisk, agroMeteorology,
} = require('../services/legacy/climateMonitoringService');

function crudRouter(service) {
  const router = express.Router();
  router.get('/', rateLimiters.read, parsePageQuery, async (req, res) => {
    try { res.json({ success: true, data: (await service.list(req.query)).items }); }
    catch (e) { return fail(req, res, e, 'list'); }
  });
  router.get('/:id', rateLimiters.read, validateId, async (req, res) => {
    try {
      const item = await service.get(req.params.id);
      if (!item) return res.status(404).json({ success: false, error: 'Not found' });
      res.json({ success: true, data: item });
    } catch (e) { return fail(req, res, e, 'get'); }
  });
  router.post('/', rateLimiters.write, authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), bodyValidator((body) => {
    if (!body.region && !body.station_name && !body.crop) throw new Error('region, station_name, or crop is required');
    enumValue(body.severity, 'severity', ['Mild', 'Moderate', 'Severe', 'Extreme']);
    enumValue(body.risk_level, 'risk_level', ['Low', 'Medium', 'High', 'Critical']);
    enumValue(body.risk_type, 'risk_type', ['Drought', 'Flood', 'Heatwave', 'Cyclone', 'Frost', 'Hailstorm']);
    date(body.start_date, 'start_date'); date(body.forecast_date, 'forecast_date'); date(body.assessment_date, 'assessment_date'); date(body.recorded_date, 'recorded_date');
    for (const field of ['spi_index', 'water_level_m', 'rainfall_mm', 'affected_area_hectares', 'risk_score', 'temperature_c', 'humidity_pct', 'wind_speed_kmph']) numberValue(body[field], field, { min: 0, max: field === 'humidity_pct' ? 100 : 100000 });
  }), async (req, res) => {
    try { res.status(201).json({ success: true, data: await service.create(req.body) }); }
    catch (e) { return fail(req, res, e, 'create', e.status || 500); }
  });
  router.put('/:id', rateLimiters.write, authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), validateId, bodyValidator((body) => { if (!Object.keys(body).length) throw new Error('At least one field is required'); }), async (req, res) => {
    try {
      const item = await service.update(req.params.id, req.body);
      if (!item) return res.status(404).json({ success: false, error: 'Not found' });
      res.json({ success: true, data: item });
    } catch (e) { return fail(req, res, e, 'update', e.status || 500); }
  });
  router.delete('/:id', rateLimiters.write, authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), validateId, async (req, res) => {
    try {
      const ok = await service.remove(req.params.id);
      if (!ok) return res.status(404).json({ success: false, error: 'Not found' });
      res.json({ success: true });
    } catch (e) { return fail(req, res, e, 'delete'); }
  });
  return router;
}

module.exports = {
  droughtMonitoringRoutes: crudRouter(droughtMonitoring),
  floodMonitoringRoutes: crudRouter(floodMonitoring),
  diseaseForecastingRoutes: crudRouter(diseaseForecasting),
  climateRiskRoutes: crudRouter(climateRisk),
  agroMeteorologyRoutes: crudRouter(agroMeteorology),
};
