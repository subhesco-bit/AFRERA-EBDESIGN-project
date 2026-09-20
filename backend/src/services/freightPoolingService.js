/**
 * freightPoolingService (thin wrapper)
 *
 * (2026-09-20) 3-way duplicate remediation: this top-level copy (32 lines,
 * db('freight_pools').insert()-style) has ZERO live callers - only reachable
 * through the dead backend/src/services/index.js barrel (itself never
 * required by index.js). backend/src/services/legacy/freightPoolingService.js
 * is the confirmed-live copy, mounted via routes/freightPoolingRoutes.js at
 * /api/freightpooling and wired to frontend/src/services/api.js's
 * freightPoolingAPI. It is also the more correct implementation: it wraps
 * pool-window joins in a transaction with row-level locking
 * (withTransaction + `FOR UPDATE`) to prevent two concurrent joins from
 * overfilling the same vehicle capacity - a race this copy never guarded
 * against. Collapsed to a re-export per the erpService.js precedent rather
 * than kept as a third, independently-drifting copy.
 */

'use strict';

module.exports = require('./legacy/freightPoolingService.js');
