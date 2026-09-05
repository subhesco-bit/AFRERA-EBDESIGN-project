/**
 * Backend for 8 of the 9 Horticulture-domain tabs on
 * frontend/src/pages/HorticultureManagementPage.jsx: M142 Vegetable
 * Production, M143 Floriculture, M145 Polyhouse, M146 Hydroponics, M147
 * Aeroponics, M148 Precision Horticulture, M149 Protected Cultivation,
 * M150 Horticulture Analytics (registry numbers). M144 Greenhouse
 * Management is real (backend/src/services/greenhouseService.js, mounted
 * directly, action-based design/optimize/monitor/predict-yield endpoints)
 * and is not part of this batch. M141 Orchard Management has its own real
 * page and is also out of scope.
 *
 * Field lists below are taken directly from each tab's `fields`/
 * `requiredFields` in HorticultureManagementPage.jsx, not invented.
 */

'use strict';

const { createCrudService } = require('./resourceCrudFactory');

const vegetableProduction = createCrudService('vegetable_production_records', {
  fields: ['crop_name', 'variety', 'plot', 'area_hectares', 'sowing_date', 'expected_harvest_date', 'yield_kg', 'notes'],
  requiredFields: ['crop_name'],
});

const floriculture = createCrudService('floriculture_records', {
  fields: ['flower_name', 'variety', 'plot', 'area_hectares', 'planting_date', 'bloom_stage', 'notes'],
  requiredFields: ['flower_name'],
});

const polyhouseManagement = createCrudService('polyhouse_records', {
  fields: ['polyhouse_name', 'location', 'area_sqm', 'crop', 'construction_date', 'status'],
  requiredFields: ['polyhouse_name'],
});

const hydroponics = createCrudService('hydroponic_systems', {
  fields: ['system_name', 'crop', 'medium', 'ph_level', 'ec_level', 'setup_date', 'notes'],
  requiredFields: ['system_name'],
});

const aeroponics = createCrudService('aeroponic_systems', {
  fields: ['system_name', 'crop', 'mist_interval_min', 'nutrient_solution', 'setup_date', 'notes'],
  requiredFields: ['system_name'],
});

const precisionHorticulture = createCrudService('precision_horticulture_readings', {
  fields: ['field_plot', 'sensor_type', 'metric_tracked', 'target_range', 'current_reading', 'recorded_date'],
  requiredFields: ['field_plot'],
});

const protectedCultivation = createCrudService('protected_cultivation_structures', {
  fields: ['structure_type', 'crop', 'area_sqm', 'setup_date', 'status'],
  requiredFields: ['structure_type'],
});

const horticultureAnalytics = createCrudService('horticulture_analytics_metrics', {
  fields: ['metric_name', 'crop_category', 'value', 'unit', 'period', 'notes'],
  requiredFields: ['metric_name'],
});

module.exports = {
  vegetableProduction, floriculture, polyhouseManagement, hydroponics,
  aeroponics, precisionHorticulture, protectedCultivation, horticultureAnalytics,
};

