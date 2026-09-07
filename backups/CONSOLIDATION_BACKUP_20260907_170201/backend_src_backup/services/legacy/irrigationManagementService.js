/**
 * Backend for the 3 Irrigation tabs on
 * frontend/src/pages/IrrigationManagementPage.jsx (schedules, water sources,
 * logs) that were shipped with a working form and an honest "backend not
 * built yet" note (M075 registry number - that folder actually contains Pig
 * Management, see backend/src/modules/M075/service.js, so this lives here as
 * a named service instead of reusing that folder - same reasoning as
 * climateMonitoringService.js).
 *
 * Field lists below are taken directly from IrrigationManagementPage.jsx's
 * form state and frontend/src/services/api.js's irrigationAPI, not invented.
 */

'use strict';

const { createCrudService } = require('./resourceCrudFactory');

const irrigationSchedules = createCrudService('irrigation_schedules', {
  fields: ['field_name', 'crop', 'method', 'frequency_days', 'duration_minutes', 'water_source'],
  requiredFields: ['field_name', 'frequency_days'],
});

const irrigationWaterSources = createCrudService('irrigation_water_sources', {
  fields: ['name', 'type', 'capacity_liters'],
  requiredFields: ['type'],
});

const irrigationLogs = createCrudService('irrigation_logs', {
  fields: ['schedule_id', 'field_name', 'volume_liters', 'duration_minutes', 'logged_at', 'notes'],
  requiredFields: [],
});

module.exports = { irrigationSchedules, irrigationWaterSources, irrigationLogs };
