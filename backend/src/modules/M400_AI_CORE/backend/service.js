/**
 * Ai (M400_AI_CORE)
 *
 * Thin wrapper. (2026-09-08) The previous require() target,
 * services/legacy/aiService.js, does not exist anywhere in this repo - it
 * would throw MODULE_NOT_FOUND the moment this module was ever loaded
 * (found via a module-completeness scan, not by this module being
 * exercised - the M0XX loader doesn't currently reach it). The closest
 * real, structured AI service under this name is services/aiService/
 * (credit risk, demand forecasting, fraud detection, price optimization,
 * recommendation engine) - pointed here instead. Not confirmed mounted by
 * any live route as of this fix; if this module is ever actually loaded,
 * verify services/aiService/index.js's exports match what callers expect.
 */

'use strict';

module.exports = require('../../../services/aiService');
