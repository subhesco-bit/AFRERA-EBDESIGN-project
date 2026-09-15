/**
 * Product Review Service (thin wrapper)
 *
 * (2026-09-07) This was a byte-for-byte-older duplicate of
 * backend/src/services/legacy/productReviewService.js (the canonical,
 * mounted implementation - see backend/src/routes/productReviewRoutes.js
 * and backend/src/routes/marketplaceEnhancements.js). This copy is not
 * required by index.js anywhere live; only backend/src/services/index.js
 * (itself never required by index.js) pulled it in. Legacy already carries
 * a superset of this file's logic, so this is collapsed to a re-export
 * rather than kept as a second, drifting copy. See merge policy in .ai/
 * for rationale. (2026-09-15: legacy used to also merge in M060/M052/M058
 * operations here - removed as dead, misleading pollution; see legacy's
 * own history for detail.)
 */

'use strict';

module.exports = require('./legacy/productReviewService');
