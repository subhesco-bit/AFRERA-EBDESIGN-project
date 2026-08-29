/**
 * Backend for 6 of the 8 Community-domain tabs on
 * frontend/src/pages/CommunityManagementPage.jsx: M043 Block, M044 District,
 * M045 State, M048 Producer Group, M049 Community Asset, M050 Rural
 * Development (registry numbers). Panchayat (M042) and Cooperative (M047)
 * already have real create+list backends at /api/v1/governance and are not
 * part of this batch. M041 Village Registry and M046 SHG Management have
 * their own dedicated pages and are also out of scope here.
 *
 * Field lists below are taken directly from each tab's `fields`/
 * `requiredFields` in CommunityManagementPage.jsx, not invented.
 */

'use strict';

const { createCrudService } = require('./resourceCrudFactory');

const blockManagement = createCrudService('community_blocks', {
  fields: ['name', 'district', 'state', 'bdo_name', 'notes'],
  requiredFields: ['name'],
});

const districtManagement = createCrudService('community_districts', {
  fields: ['name', 'state', 'collector_name', 'notes'],
  requiredFields: ['name'],
});

const stateManagement = createCrudService('community_states', {
  fields: ['name', 'region', 'capital', 'notes'],
  requiredFields: ['name'],
});

const producerGroup = createCrudService('producer_groups', {
  fields: ['name', 'commodity_focus', 'member_count', 'village', 'notes'],
  requiredFields: ['name'],
});

const communityAsset = createCrudService('community_assets', {
  fields: ['name', 'asset_type', 'village', 'condition', 'notes'],
  requiredFields: ['name', 'asset_type'],
});

const ruralDevelopment = createCrudService('rural_development_projects', {
  fields: ['project_name', 'village', 'budget', 'status', 'start_date', 'notes'],
  requiredFields: ['project_name'],
});

module.exports = {
  blockManagement, districtManagement, stateManagement,
  producerGroup, communityAsset, ruralDevelopment,
};
