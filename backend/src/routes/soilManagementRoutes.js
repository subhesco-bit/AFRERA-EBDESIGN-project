/**
 * Routes for the 3 Soil-domain CRUD resources - see
 * backend/src/services/soilManagementService.js. Mounted at flat prefixes
 * in index.js matching frontend/src/services/api.js exactly
 * (e.g. /api/v1/soil-health/cards), so no frontend change is needed.
 */

'use strict';

const { soilHealth, nutrientManagement, fertilityManagement } = require('../services/legacy/soilManagementService');
const { SIGNAL } = require('../core/signalBus');
// Bounds pagination/IDs, sanitizes input, redacts internal errors, and
// emits a correlated SOIL_RECORD_CHANGED signal on mutations - see
// resourceRouteFactory.js. The bare hand-rolled router this replaced had
// none of that (see routes/__tests__/waterSoilManagementRoutes.test.js,
// which already existed to catch exactly this gap).
const { createHardenedCrudRouter } = require('./resourceRouteFactory');

function inRange(value, min, max) {
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max;
}

const soilHealthValidate = (body) => {
  if (body.ph_level !== undefined && body.ph_level !== '' && !inRange(body.ph_level, 0, 14)) {
    return 'ph_level must be between 0 and 14';
  }
  if (body.organic_matter_percent !== undefined && body.organic_matter_percent !== '' && !inRange(body.organic_matter_percent, 0, 100)) {
    return 'organic_matter_percent must be between 0 and 100';
  }
  return null;
};

module.exports = {
  soilHealthRoutes: createHardenedCrudRouter(soilHealth, {
    signal: SIGNAL.SOIL_RECORD_CHANGED, source: 'soil_health_routes', validate: soilHealthValidate,
  }),
  nutrientManagementRoutes: createHardenedCrudRouter(nutrientManagement, {
    signal: SIGNAL.SOIL_RECORD_CHANGED, source: 'nutrient_management_routes',
  }),
  fertilityManagementRoutes: createHardenedCrudRouter(fertilityManagement, {
    signal: SIGNAL.SOIL_RECORD_CHANGED, source: 'fertility_management_routes',
  }),
};
