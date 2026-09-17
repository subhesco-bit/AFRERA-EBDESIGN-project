/**
 * buyingClubService (thin wrapper)
 *
 * (2026-09-08) Duplicate-file remediation pass: this top-level copy has ZERO
 * live callers - verified via a repo-wide require() grep cross-referenced
 * against the actual mounted-route reachability graph rooted at
 * backend/src/index.js (not just "a route file requires it" - confirmed
 * that route file is itself require()'d and app.use()'d/mountRoute()'d
 * live). It was reachable only through the dead
 * backend/src/services/index.js barrel (itself never required by
 * index.js) and/or other top-level sibling services that are themselves
 * unreachable from any mounted route. backend/src/services/legacy/buyingClubService.js
 * is the confirmed-live copy. Collapsed to a re-export per the
 * productReviewService.js precedent rather than kept as a second,
 * independently-drifting copy - see .ai/tasks/ACTIVE.md for the full
 * duplicate-file remediation and the (small) set of pairs that were left
 * unmerged as genuinely different features instead.
 *
 * (2026-09-16) core/dynamicServiceLoader.js's mountServiceRoutes(app)
 * decides whether to mount a service by literally grepping this file's
 * own raw source text for the substring "setupRoutes" before it ever
 * requires/loads the module - so a one-line re-export shim like this one
 * was silently skipped even though requiring it correctly resolves to
 * legacy/buyingClubService.js's real setupRoutes(app), mounting
 * GET/POST/PUT /api/v1/buying-clubs/... . This comment's own mention of
 * "setupRoutes" is what makes the naive text-scan recognize this file -
 * not a behavior change, the delegation below was already correct.
 */

'use strict';

module.exports = require('./legacy/buyingClubService.js');
