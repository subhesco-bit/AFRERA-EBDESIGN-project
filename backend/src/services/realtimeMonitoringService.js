/**
 * realtimeMonitoringService (thin wrapper)
 *
 * (2026-09-08) Duplicate-file remediation pass: this top-level copy has ZERO
 * live callers - verified via a repo-wide require() grep cross-referenced
 * against the actual mounted-route reachability graph rooted at
 * backend/src/index.js (not just "a route file requires it" - confirmed
 * that route file is itself require()'d and app.use()'d/mountRoute()'d
 * live). It was reachable only through the dead
 * backend/src/services/index.js barrel (itself never required by
 * index.js) and/or other top-level sibling services that are themselves
 * unreachable from any mounted route. backend/src/services/legacy/realtimeMonitoringService.js
 * is the confirmed-live copy. Collapsed to a re-export per the
 * productReviewService.js precedent rather than kept as a second,
 * independently-drifting copy - see .ai/tasks/ACTIVE.md for the full
 * duplicate-file remediation and the (small) set of pairs that were left
 * unmerged as genuinely different features instead.
 */

'use strict';

module.exports = require('./legacy/realtimeMonitoringService.js');
