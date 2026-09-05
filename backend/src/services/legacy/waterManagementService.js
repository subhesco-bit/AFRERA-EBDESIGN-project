/**
 * Backend for the 5 Water-domain tabs on
 * frontend/src/pages/WaterManagementPage.jsx (M076 Water Budgeting, M077
 * Water Quality Monitoring, M078 Rainwater Harvesting, M079 Watershed
 * Management, M080 Water Analytics - registry numbers). M075 Irrigation
 * Management has its own real page (IrrigationManagementPage.jsx) and is
 * not part of this batch.
 *
 * rainwater_harvesting_structures here is deliberately a different table
 * from backend/src/modules/M078's rainwater_harvesting_systems: that module
 * folder holds real, unrelated engineering-calculation code (design a
 * system, monitor collection, compute a water budget) with no frontend
 * caller anywhere, while this is the simple structures registry
 * WaterManagementPage.jsx actually calls. Left both alone rather than
 * forcing a merge between two genuinely different designs.
 *
 * Field lists below are taken directly from each tab's `fields`/
 * `requiredFields` in WaterManagementPage.jsx, not invented.
 */

'use strict';

const { createCrudService } = require('./resourceCrudFactory');

const waterBudgeting = createCrudService('water_budgets', {
  fields: ['plot_name', 'source', 'demand_liters', 'supply_liters', 'season', 'notes'],
  requiredFields: ['plot_name'],
});

const waterQuality = createCrudService('water_quality_readings', {
  fields: ['location', 'parameter', 'value', 'unit', 'reading_date', 'notes'],
  requiredFields: ['location', 'parameter'],
});

const rainwaterHarvesting = createCrudService('rainwater_harvesting_structures', {
  fields: ['structure_name', 'structure_type', 'village', 'capacity_liters', 'built_date', 'notes'],
  requiredFields: ['structure_name', 'structure_type'],
});

const watershedManagement = createCrudService('watersheds', {
  fields: ['name', 'area_hectares', 'status', 'villages_covered', 'notes'],
  requiredFields: ['name'],
});

const waterAnalytics = createCrudService('water_analytics_records', {
  fields: ['metric', 'period', 'value', 'unit', 'notes'],
  requiredFields: ['metric', 'period'],
});

module.exports = { waterBudgeting, waterQuality, rainwaterHarvesting, watershedManagement, waterAnalytics };


