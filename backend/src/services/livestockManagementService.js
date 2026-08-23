/**
 * Backend for 3 of the 9 Livestock-domain tabs on
 * frontend/src/pages/LivestockManagementPage.jsx: M122 Cattle Registry,
 * M128 Feed Management, M130 Livestock Analytics (registry numbers).
 *
 * The other six tabs are deliberately NOT built here:
 *  - M121 Dairy Management has its own real page (out of scope).
 *  - M127 Animal Health already has a real, richer backend
 *    (animalHealthService.js) - the frontend tab called nonexistent methods
 *    on it and has been fixed to call the real ones directly.
 *  - M123 Poultry, M124 Goat, M125 Sheep, M126 Pig each already have a
 *    real, substantial, already-mounted registry (poultryRoutes.js @
 *    /api/v1/poultry/flocks, goatRoutes.js @ /api/v1/goat/herd,
 *    sheepRoutes.js @ /api/v1/sheep/flock, pigRoutes.js @
 *    /api/v1/pig/herd - 300-400 real lines each, with feed/breeding/
 *    vaccination/performance sub-resources). The frontend tabs call a
 *    completely different, nonexistent path for each
 *    (e.g. /goat-farming/animals, not /goat/herd) - a near-miss route
 *    mismatch, not a missing backend. Building new tables for these would
 *    create a second, disconnected write path for the same real-world
 *    animals - the exact "dangerous duplicate" class of bug this session
 *    has been removing elsewhere. These four need their own rewiring pass
 *    (map each tab's form fields to the real per-species schema, the way
 *    the Animal Health tab was just fixed), not a new backend.
 *  - M129 Breeding (generic cross-species tab) was pulled for the same
 *    reason: goat/sheep/pig already have their own real breeding
 *    sub-resource nested under their herd/flock endpoints
 *    (e.g. POST /goat/herd/:femaleId/breeding). Whether the generic tab is
 *    a genuine gap (cattle/poultry have no breeding endpoint at all) or
 *    should be retired in favor of the per-species ones needs the same
 *    investigation as the four species tabs above before building anything.
 *
 * Field lists below are taken directly from each tab's `fields`/
 * `requiredFields` in LivestockManagementPage.jsx, not invented.
 */

'use strict';

const { createCrudService } = require('./resourceCrudFactory');

const cattleRegistry = createCrudService('cattle_registry', {
  fields: ['tag_number', 'breed', 'purpose', 'owner_name', 'date_of_birth', 'notes'],
  requiredFields: ['tag_number', 'owner_name'],
});

const feedManagement = createCrudService('livestock_feed_records', {
  fields: ['feed_type', 'supplier', 'quantity_kg', 'cost', 'purchase_date', 'notes'],
  requiredFields: ['feed_type'],
});

const livestockAnalytics = createCrudService('livestock_analytics_records', {
  fields: ['category', 'period', 'value', 'unit', 'notes'],
  requiredFields: ['category', 'period'],
});

module.exports = { cattleRegistry, feedManagement, livestockAnalytics };
