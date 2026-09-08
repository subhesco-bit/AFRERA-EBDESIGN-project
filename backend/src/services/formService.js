/**
 * Form Service (thin wrapper)
 *
 * (2026-09-08) Near-duplicate of backend/src/services/legacy/formService.js.
 * Legacy is a confirmed superset - it carries the FIXES.md H3 fix
 * (fs.readFileSync/writeFileSync converted to fs.promises so a form-store
 * fallback read no longer blocks the event loop) that this top-level copy
 * still lacks. This top-level copy has zero live production callers
 * (verified via repo-wide require() grep against the mounted-route set) -
 * only backend/src/tests/productAndFormOwnership.test.js requires it
 * directly (see the matching note in services/productService.js re: that
 * test's pre-existing interface mismatch). Collapsed per the
 * productReviewService.js precedent rather than kept as a second, drifting
 * copy. See .ai/tasks/ACTIVE.md.
 */

'use strict';

module.exports = require('./legacy/formService');
