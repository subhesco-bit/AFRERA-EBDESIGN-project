/**
 * Backend for M106 Preventive Maintenance -
 * MachineryManagementPage.jsx's "preventive" tab.
 *
 * The other 7 tabs on that page (implements, inventory, rental, breakdown,
 * fuel, parts, lifecycle) are deliberately NOT built here: they correspond
 * to backend/src/modules/M102/M103/M104/M107/M108/M109/M110, which already
 * have real, substantial (450+ line), differently-shaped action-based
 * backends (register/report/list-for-rental/book, not simple CRUD) for the
 * same real-world equipment/assets. Building new simple-CRUD tables for
 * those would create a second, disconnected write path for the same
 * equipment - the same "dangerous duplicate" class of bug removed
 * elsewhere this session (and the same situation as Poultry/Goat/Sheep/Pig
 * in the Livestock domain). They need their own rewiring/redesign pass,
 * not a new backend.
 *
 * M106 itself was confirmed genuinely generic (backend/src/modules/M106's
 * old content was the auto-generated `data JSONB` blob template, zero
 * domain columns) - safe to give a real schema, matching how M090/M149
 * were handled earlier this session.
 *
 * Field list taken directly from the "preventive" tab's `fields`/
 * `requiredFields` in MachineryManagementPage.jsx, not invented.
 */

'use strict';

const { createCrudService } = require('./resourceCrudFactory');

const preventiveMaintenance = createCrudService('preventive_maintenance_records', {
  fields: ['equipment_name', 'maintenance_type', 'scheduled_date', 'completed_date', 'technician', 'cost', 'status'],
  requiredFields: ['equipment_name'],
});

module.exports = { preventiveMaintenance };

// Merged from backend/src/modules/M101
{
  const m101 = require("../../modules/M101/service");
  const { ...rest } = m101;
  Object.assign(module.exports, rest);
}


