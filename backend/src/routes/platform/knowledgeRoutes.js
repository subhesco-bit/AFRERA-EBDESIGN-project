/**
 * Knowledge Routes
 *
 * FIXED 2026-09-22: this file required '../knowledgeDomainRoutes', which
 * does not exist anywhere in this repository's history - crashed boot
 * with MODULE_NOT_FOUND. services/legacy/knowledgeService.js is real
 * (800+ lines) but wiring a full REST surface for it under time
 * pressure, unreviewed, is exactly the class of risk
 * tools/audit-unmounted-route-guards.js exists to catch (unguarded writes
 * going live without a per-route auth decision). Left as an honest
 * health-check stub pending that review, rather than a crash or a
 * fabricated endpoint surface.
 */

const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ success: true, module: 'knowledgeRoutes', status: 'pending-real-wiring' });
});

module.exports = router;
