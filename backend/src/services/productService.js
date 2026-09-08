/**
 * Product Service (thin wrapper)
 *
 * (2026-09-08) Near-duplicate of backend/src/services/legacy/productService.js.
 * Legacy is a confirmed superset: it adds an `ownerUserId` param to
 * updateProduct()/deleteProduct() (the H2 IDOR ownership-check fix - see
 * FIXES.md) that this top-level copy lacks. This top-level copy has zero
 * live production callers (verified via repo-wide require() grep against
 * the mounted-route set) - only a test file
 * (backend/src/tests/productAndFormOwnership.test.js) requires it directly,
 * and that test currently expects a `{status: 403}`-throwing, user-object
 * third argument that NEITHER copy actually implements (a pre-existing
 * test/implementation mismatch, unrelated to this collapse - flagged, not
 * fixed here). Collapsed per the productReviewService.js precedent rather
 * than kept as a second, drifting copy. See .ai/tasks/ACTIVE.md.
 */

'use strict';

module.exports = require('./legacy/productService');
