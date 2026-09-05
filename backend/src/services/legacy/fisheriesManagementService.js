/**
 * Backend for 9 of the 10 Fisheries-domain tabs on
 * frontend/src/pages/FisheriesManagementPage.jsx: M131 Biofloc Farm
 * Management, M133 Hatchery Management, M134 Fish Feed Management, M135
 * Water Quality Control, M136 Fish Health Management, M137 Harvest
 * Management, M138 Fish Processing Management, M139 Cold Fish Chain, M140
 * Aquaculture Analytics (registry numbers).
 *
 * M132 Pond Management is deliberately NOT built here: it already has a
 * real, substantial (519-line) IoT-integrated backend
 * (backend/src/modules/M132/service.js, table `ponds`) with a completely
 * different, incompatible field shape (farmerId/pondType/depth/waterSource/
 * capacity/sensorConfig vs the simple species/area_sqm/stocking_date/
 * stock_count PondManagementPage.jsx actually sends) and no
 * water-quality-log/harvest-log sub-resources at all. Same "real backend,
 * wrong shape" situation as Poultry/Goat/Sheep/Pig - needs its own
 * reconciliation pass, not a new table under the same `ponds` name.
 *
 * Field lists below are taken directly from each tab's `fields`/
 * `requiredFields` in FisheriesManagementPage.jsx, not invented.
 */

'use strict';

const { createCrudService } = require('./resourceCrudFactory');

const biofloccFarm = createCrudService('biofloc_farm_tanks', {
  fields: ['tank_id', 'species', 'stocking_density', 'floc_volume_index', 'water_temp_c', 'setup_date', 'notes'],
  requiredFields: ['tank_id', 'species'],
});

const hatcheryManagement = createCrudService('hatchery_batches', {
  fields: ['hatchery_name', 'species', 'batch_size', 'spawning_date', 'hatch_rate_pct', 'status'],
  requiredFields: ['hatchery_name', 'species'],
});

const fishFeed = createCrudService('fish_feed_logs', {
  fields: ['feed_name', 'pond_tank', 'feed_type', 'quantity_kg', 'feeding_date', 'cost'],
  requiredFields: ['feed_name', 'pond_tank'],
});

const fisheriesWaterQuality = createCrudService('fisheries_water_quality_readings', {
  fields: ['pond_tank', 'ph_level', 'dissolved_oxygen', 'ammonia_level', 'temperature_c', 'tested_date'],
  requiredFields: ['pond_tank'],
});

const fishHealth = createCrudService('fish_health_records', {
  fields: ['pond_tank', 'species', 'issue_observed', 'treatment', 'mortality_count', 'recorded_date'],
  requiredFields: ['pond_tank', 'issue_observed'],
});

const fisheriesHarvest = createCrudService('fisheries_harvest_records', {
  fields: ['pond_tank', 'species', 'harvest_date', 'quantity_kg', 'average_weight_g', 'buyer', 'sale_price'],
  requiredFields: ['pond_tank', 'species'],
});

const fishProcessing = createCrudService('fish_processing_batches', {
  fields: ['batch_id', 'species', 'processing_type', 'quantity_kg', 'processing_date', 'notes'],
  requiredFields: ['batch_id', 'species'],
});

const coldFishChain = createCrudService('cold_fish_chain_shipments', {
  fields: ['shipment_id', 'origin', 'destination', 'temperature_c', 'dispatch_date', 'arrival_date', 'status'],
  requiredFields: ['shipment_id', 'destination'],
});

const aquacultureAnalytics = createCrudService('aquaculture_analytics_metrics', {
  fields: ['metric_name', 'pond_tank', 'value', 'unit', 'period', 'notes'],
  requiredFields: ['metric_name'],
});

module.exports = {
  biofloccFarm, hatcheryManagement, fishFeed, fisheriesWaterQuality, fishHealth,
  fisheriesHarvest, fishProcessing, coldFishChain, aquacultureAnalytics,
};



