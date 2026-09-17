/**
 * NOT MOUNTED (2026-09-15). This is an auto-generated scaffold: POST /
 * just returns a canned {message: 'Route operational'} ack with no real
 * order ever created, against no particular table. index.js now mounts
 * services/legacy/orderService.js's real router - a genuine, Postgres-
 * backed cart/order/payment implementation (real stock checks, real
 * per-item GST) - at /api/order instead. Kept only because
 * backend/src/__tests__/orderRoutes.test.js exercises this file
 * directly; not wired into the running app. That test file predates
 * this discovery and encodes a contract (PUT /:id for status,
 * DELETE /:id to cancel, a {success, data} envelope) that was never
 * real for either this scaffold or the actual orderService.js router
 * (which uses PUT /:id/status, has no DELETE, and returns the bare
 * order object) - it was written against neither implementation.
 *
 * order Routes
 */

const express = require('express');
const router = express.Router();

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

/**
 * Main endpoint
 */
router.post('/', async (req, res) => {
  res.json({
    success: true,
    module: 'orderRoutes',
    message: 'Route operational',
    timestamp: new Date().toISOString()
  });
});

/**
 * Health check
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    module: 'orderRoutes'
  });
});

module.exports = router;
