/**
 * Organization Management (M200_ORGANIZATION_MANAGEMENT)
 *
 * Thin wrapper - the real implementation lives in the live, already-mounted
 * service at ../backend/src/services/legacy/organizationManagementService.js
 * (this is what backend/src/index.js actually serves). Do not add logic
 * here; extend the source file so both the direct route and this
 * plug-and-play module stay in sync.
 */

'use strict';

module.exports = require('../../../backend/src/services/legacy/organizationManagementService');
