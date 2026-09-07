/**
 * Backend for M023 Farmer Family — frontend/src/pages/FarmerFamilyPage.jsx.
 * M029 Farmer Health & Welfare (same Farmer domain) is already real and out
 * of scope here.
 *
 * Field list taken directly from the page's `fields`/`requiredFields`, not
 * invented.
 */

'use strict';

const { createCrudService } = require('./resourceCrudFactory');

const farmerFamily = createCrudService('farmer_family_members', {
  fields: ['farmer_name', 'member_name', 'relation', 'age', 'gender', 'occupation', 'is_dependent', 'notes'],
  requiredFields: ['farmer_name', 'member_name'],
});

module.exports = { farmerFamily };
