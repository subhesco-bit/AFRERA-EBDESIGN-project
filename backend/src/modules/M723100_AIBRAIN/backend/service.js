/**
 * Ai Brain (M723100_AIBRAIN)
 *
 * Thin wrapper. (2026-09-08) The previous require() target,
 * services/legacy/aiBrainService.js, does not exist - it would throw
 * MODULE_NOT_FOUND the moment this module was ever loaded (found via a
 * module-completeness scan). The name-matching file at
 * services/ai/aiBrainService.js does exist but is itself only a 3-line
 * placeholder. The route this module's name corresponds to
 * (routes/aiBrainRoutes.js, mounted at /api/v1/ai-brain) is actually
 * served live by services/legacy/aiBackboneService.js - pointed here
 * instead, to match what index.js genuinely serves under this name.
 */

'use strict';

module.exports = require('../../../services/legacy/aiBackboneService.js');
