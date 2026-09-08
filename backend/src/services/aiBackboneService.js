/**
 * AI Backbone Service (thin wrapper)
 *
 * (2026-09-08) This was a 797-line, independently-drifted EARLIER SUBSET of
 * backend/src/services/legacy/aiBackboneService.js (7,051 lines) - same
 * provider list (Claude/OpenAI/Gemini/Azure/HuggingFace), same function
 * names (callClaudeAI, callOpenAI, callAI, analyzeFinancialData, etc.), but
 * legacy/aiBackboneService.js is a confirmed superset (adds Ollama support
 * plus much more) and is the only copy with live production callers:
 * backend/src/index.js requires it directly, dozens of M0xx module
 * service.js files require it, and backend/src/routes/aiBrainRoutes.js
 * requires it. This top-level copy had ZERO live callers - verified via a
 * repo-wide require() grep - it was reachable only through the dead
 * backend/src/services/index.js barrel and through other top-level sibling
 * services (hrService.js, organizationManagementService.js, etc.) that are
 * themselves unreachable from any mounted route.
 *
 * NOTE: this is distinct from services/aiGatewayService.js, which is a
 * genuinely different, currently-untested-in-prod "governed AI gateway"
 * feature built ON TOP of legacy/aiBackboneService.js - that file was left
 * alone (see the collision comment in aiGatewayService.js and
 * legacy/aiGatewayService.js). This file, unlike that one, really was just
 * a stale duplicate of the same concept, so it is collapsed per the
 * productReviewService.js precedent rather than left as a second, drifting
 * copy. See .ai/tasks/ACTIVE.md for the full duplicate-file remediation.
 */

'use strict';

module.exports = require('./legacy/aiBackboneService');
