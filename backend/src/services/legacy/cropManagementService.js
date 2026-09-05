/**
 * Backend for the 6 Crop-domain pages: M063 Crop Registration, M064 Crop
 * Variety Management, M065 Seed Planning, M066 Nursery Management, M067
 * Sowing Management, M068 Crop Monitoring (registry numbers) - each its
 * own dedicated page (CropRegistrationPage.jsx, CropVarietyPage.jsx,
 * SeedPlanningPage.jsx, NurseryManagementPage.jsx,
 * SowingManagementPage.jsx, CropMonitoringPage.jsx), not a consolidated tab
 * page.
 *
 * Field lists below are taken directly from each page's `fields`/
 * `requiredFields` (or, for SowingManagementPage.jsx, its hand-rolled
 * form), not invented.
 */

'use strict';

const { createCrudService } = require('./resourceCrudFactory');

const cropRegistration = createCrudService('crop_registrations', {
  fields: ['crop_name', 'crop_code', 'crop_type', 'botanical_name', 'duration_days', 'status', 'notes'],
  requiredFields: ['crop_name', 'crop_type'],
});

const cropVariety = createCrudService('crop_varieties', {
  fields: ['crop_name', 'variety_name', 'developer', 'yield_potential', 'disease_resistance', 'maturity_days', 'notes'],
  requiredFields: ['crop_name', 'variety_name'],
});

const seedPlanning = createCrudService('seed_planning_plans', {
  fields: ['crop_name', 'season', 'planned_area_ha', 'seed_rate_kg_per_ha', 'seed_source', 'status', 'notes'],
  requiredFields: ['crop_name', 'season'],
});

const nurseryManagement = createCrudService('nurseries', {
  fields: ['nursery_name', 'nursery_type', 'village', 'district', 'capacity', 'crops_raised', 'status', 'notes'],
  requiredFields: ['nursery_name', 'village'],
});

const sowingManagement = createCrudService('sowing_records', {
  fields: ['crop', 'variety', 'field_name', 'area_hectares', 'season', 'method', 'sowing_date', 'expected_germination_date', 'seed_rate_kg', 'notes'],
  requiredFields: ['crop', 'field_name', 'sowing_date'],
});

const cropMonitoring = createCrudService('crop_monitoring_observations', {
  fields: ['crop_name', 'field_reference', 'observation_type', 'severity', 'observed_date', 'observer_name', 'findings'],
  requiredFields: ['crop_name', 'observation_type'],
});

module.exports = {
  cropRegistration, cropVariety, seedPlanning, nurseryManagement, sowingManagement, cropMonitoring,
};

// Merged from backend/src/modules/M043
{
  const m043 = require("../../modules/M043/service");
  const { ...rest } = m043;
  Object.assign(module.exports, rest);
}

// Merged from backend/src/modules/M044
{
  const m044 = require("../../modules/M044/service");
  const { ...rest } = m044;
  Object.assign(module.exports, rest);
}



