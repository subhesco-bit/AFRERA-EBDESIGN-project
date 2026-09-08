/**
 * Product Review Service (thin wrapper)
 *
 * (2026-09-07) This was a byte-for-byte-older duplicate of
 * backend/src/services/legacy/productReviewService.js (the canonical,
 * mounted implementation - see backend/src/routes/productReviewRoutes.js
 * and backend/src/routes/marketplaceEnhancements.js). This copy is only
 * referenced by backend/src/routes/commerce/marketplaceEnhancements.js,
 * which is not mounted in index.js (dead route file). Legacy already
 * carries a superset of this file's logic (plus merged M060/M052/M058
 * operations), so this is collapsed to a re-export rather than kept as a
 * second, drifting copy. See merge policy in .ai/ for rationale.
 */

'use strict';

module.exports = require('../legacy/productReviewService');
