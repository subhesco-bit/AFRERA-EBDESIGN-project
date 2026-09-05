/**
 * Backend for the 6 Land-domain tabs on
 * frontend/src/pages/LandManagementPage.jsx: M033 Lease Management, M035
 * GIS Land Mapping, M036 Soil Mapping, M037 Water Resource Mapping, M038
 * Geo Boundary Management, M039 Survey Management (registry numbers). M032
 * Land Ownership already has a real page (LandRegistryPage.jsx) and is out
 * of scope.
 *
 * Field lists below are taken directly from each tab's `fields`/
 * `requiredFields` in LandManagementPage.jsx, not invented.
 */

'use strict';

const { createCrudService } = require('./resourceCrudFactory');

const landLease = createCrudService('land_leases', {
  fields: ['parcel_code', 'lessor_name', 'lessee_name', 'lease_type', 'rent_amount', 'start_date', 'end_date', 'status', 'notes'],
  requiredFields: ['parcel_code', 'lessor_name', 'lessee_name'],
});

const gisLandMapping = createCrudService('gis_land_mapping_parcels', {
  fields: ['parcel_code', 'latitude', 'longitude', 'area_hectares', 'mapped_by', 'boundary_polygon', 'notes'],
  requiredFields: ['parcel_code', 'latitude', 'longitude'],
});

const soilMapping = createCrudService('soil_mapping_zones', {
  fields: ['zone_name', 'village', 'soil_type', 'ph_level', 'organic_carbon_pct', 'nutrient_index', 'notes'],
  requiredFields: ['zone_name', 'soil_type'],
});

const waterResourceMapping = createCrudService('water_resource_mapping', {
  fields: ['resource_name', 'resource_type', 'village', 'latitude', 'longitude', 'capacity_liters', 'notes'],
  requiredFields: ['resource_name', 'resource_type'],
});

const geoBoundary = createCrudService('geo_boundaries', {
  fields: ['boundary_name', 'boundary_type', 'parent_boundary', 'area_hectares', 'notes'],
  requiredFields: ['boundary_name', 'boundary_type'],
});

const surveyManagement = createCrudService('land_surveys', {
  fields: ['parcel_code', 'surveyor_name', 'scheduled_date', 'completed_date', 'status', 'findings'],
  requiredFields: ['parcel_code', 'surveyor_name'],
});

module.exports = {
  landLease, gisLandMapping, soilMapping, waterResourceMapping, geoBoundary, surveyManagement,
};


