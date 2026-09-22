/**
 * Livestock Route Support
 *
 * FIXED 2026-09-22: same bug as routes/enterpriseRouteSupport.js — an
 * auto-generated health-check-only stub, but pigRoutes_merged.js,
 * poultryRoutes_merged.js and sheepRoutes_merged.js all import
 * { protectLivestockRouter } and call it at module load time, throwing
 * "protectLivestockRouter is not a function" and crashing boot.
 * (animalHealthRoutes.js and goatRoutes.js also import it but never call
 * it, so they were unaffected.) Restored as a real function rather than
 * dropping the call, matching the same fix already applied to
 * enterpriseRouteSupport.js's protectRouter.
 */

const express = require('express');
const router = express.Router();

let eventBus = null;
try {
  eventBus = require('../platform/events/eventBus');
} catch (e) {
  // Event bus optional; protectLivestockRouter degrades to a no-op if unavailable.
}

function protectLivestockRouter(targetRouter, { signal } = {}) {
  if (signal && eventBus && typeof eventBus.emit === 'function') {
    eventBus.emit(signal, { at: new Date().toISOString() });
  }
  return targetRouter;
}

router.get('/health', (req, res) => {
  res.json({ success: true, module: 'livestockRouteSupport' });
});

module.exports = router;
module.exports.protectLivestockRouter = protectLivestockRouter;
