/**
 * Backend for the 5 Climate-domain tabs on frontend/src/pages/ClimateMonitoringPage.jsx
 * that were shipped with a working ResourceManager form and an honest
 * "backend not built yet" note (M085 Drought, M086 Flood, M088 Disease
 * Forecasting, M089 Climate Risk, M090 Agro-Meteorology - registry numbers,
 * not backend/src/modules folder numbers: those same folder numbers are
 * already used by an unrelated Business Intelligence & Analytics suite
 * - see M085/M086/M087/service.js - so this lives here as a named service
 * instead of reusing those folders).
 *
 * Field lists below are taken directly from each tab's `fields`/
 * `requiredFields` in ClimateMonitoringPage.jsx, not invented.
 */

'use strict';

const { createCrudService } = require('./resourceCrudFactory');

const droughtMonitoring = createCrudService('drought_observations', {
  fields: ['region', 'severity', 'spi_index', 'start_date', 'affected_area_hectares', 'notes'],
  requiredFields: ['region', 'severity'],
});

const floodMonitoring = createCrudService('flood_observations', {
  fields: ['region', 'severity', 'water_level_m', 'rainfall_mm', 'start_date', 'affected_area_hectares', 'notes'],
  requiredFields: ['region', 'severity'],
});

const diseaseForecasting = createCrudService('disease_forecasts', {
  fields: ['crop', 'disease_name', 'risk_level', 'region', 'forecast_date', 'notes'],
  requiredFields: ['crop', 'disease_name'],
});

const climateRisk = createCrudService('climate_risk_assessments', {
  fields: ['region', 'risk_type', 'risk_score', 'assessment_date', 'mitigation_plan'],
  requiredFields: ['region', 'risk_type'],
});

const agroMeteorology = createCrudService('agro_meteorology_readings', {
  fields: ['station_name', 'region', 'temperature_c', 'humidity_pct', 'rainfall_mm', 'wind_speed_kmph', 'recorded_date'],
  requiredFields: ['station_name'],
});

module.exports = { droughtMonitoring, floodMonitoring, diseaseForecasting, climateRisk, agroMeteorology };


