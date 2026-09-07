/**
 * Backend for 3 of the 4 Soil-domain tabs on
 * frontend/src/pages/SoilManagementPage.jsx: M071 Soil Health, M073 Nutrient
 * Management, M074 Fertility Management (registry numbers). M072 Soil
 * Testing (lab samples) already has a real, mounted, action-based backend
 * (backend/src/services/soilTestingService.js) and is not part of this batch.
 *
 * Field lists below are taken directly from each tab's `fields`/
 * `requiredFields` in SoilManagementPage.jsx, not invented.
 */

'use strict';

const { createCrudService } = require('./resourceCrudFactory');

const soilHealth = createCrudService('soil_health_cards', {
  fields: ['plot_name', 'ph_level', 'organic_matter_percent', 'rating', 'card_date', 'recommendation'],
  requiredFields: ['plot_name'],
});

const nutrientManagement = createCrudService('nutrient_management_plans', {
  fields: ['plot_name', 'crop', 'focus', 'dose_recommendation', 'plan_date', 'notes'],
  requiredFields: ['plot_name'],
});

const fertilityManagement = createCrudService('fertility_management_records', {
  fields: ['plot_name', 'nitrogen_status', 'phosphorus_status', 'potassium_status', 'assessed_date', 'notes'],
  requiredFields: ['plot_name'],
});

module.exports = { soilHealth, nutrientManagement, fertilityManagement };
