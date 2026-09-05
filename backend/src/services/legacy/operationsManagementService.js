/**
 * Backend for the 8 Operations-domain tabs on
 * frontend/src/pages/OperationsManagementPage.jsx (M091 Farm Activity, M092
 * Farm Task Scheduling, M094 Contractor Management, M095 Machinery
 * Operations, M096 Equipment Scheduling, M097 Input Consumption, M099 Farm
 * Productivity, M100 Farm Operations Dashboard - registry numbers). M093
 * Labour Management and M098 Farm Costing already have real pages and are
 * not part of this batch.
 *
 * Field lists below are taken directly from each tab's `fields`/
 * `requiredFields` in OperationsManagementPage.jsx, not invented.
 */

'use strict';

const { createCrudService } = require('./resourceCrudFactory');

const farmActivities = createCrudService('farm_activities', {
  fields: ['activity_name', 'plot', 'activity_type', 'scheduled_date', 'completed_date', 'assigned_to', 'status', 'notes'],
  requiredFields: ['activity_name', 'activity_type'],
});

const farmTasks = createCrudService('farm_tasks', {
  fields: ['task_name', 'category', 'due_date', 'priority', 'assigned_to', 'status', 'notes'],
  requiredFields: ['task_name'],
});

const contractors = createCrudService('contractors', {
  fields: ['contractor_name', 'service_type', 'contact_number', 'contract_start', 'contract_end', 'rate', 'status', 'notes'],
  requiredFields: ['contractor_name', 'service_type'],
});

const machineryOperations = createCrudService('machinery_operations', {
  fields: ['machine_name', 'operation_type', 'operator_name', 'field_plot', 'operation_date', 'hours_used', 'fuel_consumed_l', 'notes'],
  requiredFields: ['machine_name', 'operation_type'],
});

const equipmentScheduling = createCrudService('equipment_schedules', {
  fields: ['equipment_name', 'scheduled_by', 'start_time', 'end_time', 'purpose', 'status'],
  requiredFields: ['equipment_name'],
});

const inputConsumption = createCrudService('input_consumption_records', {
  fields: ['input_name', 'input_type', 'quantity_used', 'unit', 'field_plot', 'consumption_date', 'notes'],
  requiredFields: ['input_name', 'input_type'],
});

const farmProductivity = createCrudService('farm_productivity_metrics', {
  fields: ['metric_name', 'plot', 'value', 'unit', 'period', 'benchmark', 'notes'],
  requiredFields: ['metric_name'],
});

const farmOperationsDashboard = createCrudService('farm_operations_kpis', {
  fields: ['kpi_name', 'value', 'target', 'period', 'trend', 'notes'],
  requiredFields: ['kpi_name'],
});

module.exports = {
  farmActivities, farmTasks, contractors, machineryOperations,
  equipmentScheduling, inputConsumption, farmProductivity, farmOperationsDashboard,
};



