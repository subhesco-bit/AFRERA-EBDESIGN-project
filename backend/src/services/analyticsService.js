/**
 * Analytics Service (thin wrapper)
 *
 * (2026-09-08) Byte-for-byte identical (modulo require-path depth) to
 * backend/src/services/legacy/analyticsService.js. Legacy is the canonical,
 * live copy - required directly by backend/src/index.js, by
 * modules/M746100_ANALYTICS/backend/service.js, and by
 * backend/src/routes/analyticsReportRoutes.js (mounted at
 * /api/v1/analytics). This top-level copy had zero live callers - reachable
 * only through the dead backend/src/services/index.js barrel and other
 * unreachable top-level sibling services. Collapsed per the
 * productReviewService.js precedent rather than kept as a second, drifting
 * copy. See .ai/tasks/ACTIVE.md for the full duplicate-file remediation.
 *
 * NOTE: a third, unrelated copy exists at
 * backend/src/services/platform/analyticsService.js, which exports a
 * different function (buildPipelineInsights) that
 * backend/src/tests/analyticsService.test.js actually expects from THIS
 * path - that test was already pointed at the wrong file before this
 * change (pre-existing bug, out of scope here; flagged in .ai/tasks/ACTIVE.md).
 */

'use strict';

module.exports = require('./legacy/analyticsService');
