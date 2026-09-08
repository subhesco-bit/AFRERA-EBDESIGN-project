/**
 * Library Knowledge Service (thin wrapper)
 *
 * (2026-09-08) This is the one duplicate pair in the services/ vs
 * services/legacy/ set that runs BACKWARDS from the usual pattern: here the
 * top-level backend/src/services/libraryKnowledgeService.js is the live,
 * canonical copy (a compatibility wrapper delegating to the "singleton"
 * exported by backend/src/modules/M645100_LIBRARYKNOWLEDGE/backend/service.js),
 * while THIS legacy file (346 lines, an older fs/crypto/PostgreSQL content-
 * hashing catalog implementation) had its only caller in
 * backend/src/routes/claude/libraryRoutes.js, which is itself never
 * required/mounted by backend/src/index.js (the actually-mounted library
 * route is backend/src/routes/libraryRoutes.js at /api/v1/library, a
 * different file). Verified via repo-wide require() grep against the live
 * mounted-route set - this legacy copy has zero live callers.
 *
 * Collapsed to a re-export of the top-level copy per the
 * productReviewService.js precedent (merge-not-delete: the original
 * content-hashing implementation remains recoverable from git history if a
 * future caller needs that specific behavior instead of the M645100
 * module's). See .ai/tasks/ACTIVE.md for the full duplicate-file
 * remediation.
 */

'use strict';

module.exports = require('../libraryKnowledgeService');
