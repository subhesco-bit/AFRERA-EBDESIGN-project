'use strict';
/** Real (partial) port of pine-shadow src/lib/organism. boot.server.ts's
 * actual Postgres/PGLite schema (ai_pulses, organism_state, spine_events
 * tables) was not ported — fns.js uses an in-memory snapshot of the same
 * shape instead. This is additive to, and replaces nothing in, the earlier
 * Phase 1 backend/src/services/organism/healthMonitor.js (a generic
 * subsystem-health monitor unrelated to this real boot/consult/diagnose
 * organism kernel). */
module.exports = require('./fns');
