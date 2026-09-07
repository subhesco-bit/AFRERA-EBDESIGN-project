/**
 * Routes for the 5 Water-domain CRUD resources - see
 * backend/src/services/waterManagementService.js. Mounted at flat prefixes
 * in index.js matching frontend/src/services/api.js's nested paths
 * (e.g. /api/v1/water-budgeting/budgets), so no frontend change is needed.
 */

'use strict';

const {
  waterBudgeting, waterQuality, rainwaterHarvesting, watershedManagement, waterAnalytics,
} = require('../services/legacy/waterManagementService');
const { SIGNAL } = require('../core/signalBus');
// Bounds pagination/IDs, sanitizes input, redacts internal errors, and
// emits a correlated WATER_RECORD_CHANGED signal on mutations - see
// resourceRouteFactory.js (shared with soilManagementRoutes.js). The bare
// hand-rolled router this replaced had none of that (see
// routes/__tests__/waterSoilManagementRoutes.test.js, which already existed
// to catch exactly this gap).
const { createHardenedCrudRouter } = require('./resourceRouteFactory');

const waterBudgetingValidate = (body) => {
  if (body.demand_liters !== undefined && body.demand_liters !== '' && Number(body.demand_liters) < 0) {
    return 'demand_liters must not be negative';
  }
  if (body.supply_liters !== undefined && body.supply_liters !== '' && Number(body.supply_liters) < 0) {
    return 'supply_liters must not be negative';
  }
  return null;
};

module.exports = {
  waterBudgetingRoutes: createHardenedCrudRouter(waterBudgeting, {
    signal: SIGNAL.WATER_RECORD_CHANGED, source: 'water_budgeting_routes', validate: waterBudgetingValidate,
  }),
  waterQualityRoutes: createHardenedCrudRouter(waterQuality, {
    signal: SIGNAL.WATER_RECORD_CHANGED, source: 'water_quality_routes',
  }),
  rainwaterHarvestingRoutes: createHardenedCrudRouter(rainwaterHarvesting, {
    signal: SIGNAL.WATER_RECORD_CHANGED, source: 'rainwater_harvesting_routes',
  }),
  watershedManagementRoutes: createHardenedCrudRouter(watershedManagement, {
    signal: SIGNAL.WATER_RECORD_CHANGED, source: 'watershed_management_routes',
  }),
  waterAnalyticsRoutes: createHardenedCrudRouter(waterAnalytics, {
    signal: SIGNAL.WATER_RECORD_CHANGED, source: 'water_analytics_routes',
  }),
};
