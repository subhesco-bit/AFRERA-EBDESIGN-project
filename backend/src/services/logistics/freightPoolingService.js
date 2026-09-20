/**
 * freightPoolingService (thin wrapper)
 *
 * (2026-09-20) 3-way duplicate remediation: this copy (145 lines) is only
 * required by routes/logistics/freightPoolingRoutes_merged.js, which is
 * itself never mounted anywhere in backend/src/index.js - confirmed
 * unreachable from any live route. backend/src/services/legacy/
 * freightPoolingService.js is the confirmed-live copy, mounted via
 * routes/freightPoolingRoutes.js at /api/freightpooling. It is also the
 * more correct implementation: it wraps pool-window joins in a
 * transaction with row-level locking (withTransaction + `FOR UPDATE`) to
 * prevent two concurrent joins from overfilling the same vehicle
 * capacity - a race this copy never guarded against. Collapsed to a
 * re-export per the erpService.js precedent rather than kept as a third,
 * independently-drifting copy.
 */

'use strict';

module.exports = require('../legacy/freightPoolingService.js');
