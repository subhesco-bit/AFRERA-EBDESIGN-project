/**
 * completeERPIntegrationService (thin wrapper)
 *
 * (2026-09-08) Near-identical duplicate of
 * backend/src/services/legacy/completeERPIntegrationService.js (only require-path depth and a
 * handful of legacy-side bug fixes/columns differ - legacy fixes several
 * undeclared-shorthand-property bugs this copy still has, e.g.
 * production_order/seller_id/buyer_id shorthand mismatches). This
 * top-level copy had ZERO callers anywhere in the repo (not even tests) -
 * verified via a repo-wide require() grep; the only real caller of either
 * copy is backend/src/modules/M573100_COMPLETEERPINTEGRATION/backend/service.js, which requires
 * the legacy copy. Collapsed per the productReviewService.js precedent
 * rather than kept as a second, drifting copy. See .ai/tasks/ACTIVE.md for
 * the full duplicate-file remediation.
 */

'use strict';

module.exports = require('./legacy/completeERPIntegrationService');
