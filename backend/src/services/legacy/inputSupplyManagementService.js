/**
 * Backend for the 8 Input Supply-domain tabs on
 * frontend/src/pages/InputSupplyManagementPage.jsx: M113 Biofertilizer,
 * M114 Pesticide Inventory, M115 Bio-Pesticide, M116 Micronutrient, M117
 * Organic Input, M118 Input Procurement, M119 Input Distribution, M120
 * Input Traceability (registry numbers). M111 Seed Inventory and M112
 * Fertilizer Stock already have real pages/backends and are not part of
 * this batch.
 *
 * Field lists below are taken directly from each tab's `fields`/
 * `requiredFields` in InputSupplyManagementPage.jsx, not invented.
 */

'use strict';

const { createCrudService } = require('./resourceCrudFactory');

const biofertilizer = createCrudService('biofertilizer_stock', {
  fields: ['product_name', 'biofert_type', 'supplier', 'quantity_kg', 'batch_number', 'expiry_date', 'notes'],
  requiredFields: ['product_name', 'biofert_type'],
});

const pesticideInventory = createCrudService('pesticide_inventory', {
  fields: ['product_name', 'category', 'supplier', 'quantity_liters', 'registration_number', 'expiry_date', 'notes'],
  requiredFields: ['product_name', 'category'],
});

const bioPesticide = createCrudService('bio_pesticide_stock', {
  fields: ['product_name', 'biopesticide_type', 'supplier', 'quantity_liters', 'expiry_date', 'notes'],
  requiredFields: ['product_name', 'biopesticide_type'],
});

const micronutrient = createCrudService('micronutrient_stock', {
  fields: ['product_name', 'nutrient', 'supplier', 'quantity_kg', 'expiry_date', 'notes'],
  requiredFields: ['product_name', 'nutrient'],
});

const organicInput = createCrudService('organic_input_stock', {
  fields: ['product_name', 'input_type', 'supplier', 'quantity_kg', 'certified_organic', 'notes'],
  requiredFields: ['product_name', 'input_type'],
});

const inputProcurement = createCrudService('input_procurement_orders', {
  fields: ['item_name', 'vendor_name', 'quantity', 'unit_cost', 'order_date', 'status', 'notes'],
  requiredFields: ['item_name', 'vendor_name'],
});

const inputDistribution = createCrudService('input_distribution_records', {
  fields: ['item_name', 'channel', 'recipient_name', 'quantity', 'distributed_date', 'notes'],
  requiredFields: ['item_name', 'recipient_name'],
});

const inputTraceability = createCrudService('input_traceability_records', {
  fields: ['item_name', 'batch_number', 'stage', 'location', 'recorded_date', 'notes'],
  requiredFields: ['item_name', 'batch_number'],
});

module.exports = {
  biofertilizer, pesticideInventory, bioPesticide, micronutrient,
  organicInput, inputProcurement, inputDistribution, inputTraceability,
};

