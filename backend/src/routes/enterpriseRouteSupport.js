/**
 * Enterprise Route Support
 * Utility routes for enterprise features
 *
 * FIXED 2026-09-22: this was an auto-generated health-check-only stub, but
 * bulkOrderRoutes.js, comprehensiveERPRoutes.js, indiaErpAccountingRoutes.js,
 * decisionSupportRoutes_merged.js and rfqRoutes_merged.js all import
 * { protectRouter, requireHumanAuthorization } from it as named functions,
 * throwing "protectRouter is not a function" at require time and crashing
 * boot. Restored as real functions rather than repeating the "skip the
 * call" workaround used elsewhere for the same bug (see
 * routes/__tests__/livestockAndEnterpriseRouteSupport.test.js), since these
 * enterprise/ERP routers explicitly opted into this gate rather than
 * omitting it. protectRouter emits an audit signal on the platform event bus
 * when the router loads; requireHumanAuthorization is a pass-through
 * middleware (no separate human-approval workflow exists yet in this
 * codebase to gate on) that still runs after admin-role checks.
 */

const express = require('express');
const router = express.Router();

let eventBus = null;
try {
  eventBus = require('../platform/events/eventBus');
} catch (e) {
  // Event bus optional; protectRouter degrades to a no-op if unavailable.
}

function protectRouter(targetRouter, { signal } = {}) {
  if (signal && eventBus && typeof eventBus.emit === 'function') {
    eventBus.emit(signal, { at: new Date().toISOString() });
  }
  return targetRouter;
}

function requireHumanAuthorization(req, res, next) {
  next();
}

router.get('/health', (req, res) => {
  res.json({
    success: true,
    module: 'enterpriseRouteSupport',
    status: 'operational'
  });
});

module.exports = router;
module.exports.protectRouter = protectRouter;
module.exports.requireHumanAuthorization = requireHumanAuthorization;
