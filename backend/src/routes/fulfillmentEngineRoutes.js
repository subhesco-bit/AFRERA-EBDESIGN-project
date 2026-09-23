/**
 * Order-to-cash fulfillment — HTTP surface.
 *
 * Mounted at /api/v1/fulfillment-engine.
 *
 *   GET  /steps                    the 8 steps in order
 *   GET  /readiness/:orderId       which steps can run for this order, and why not
 *   POST /orders/:orderId/fulfill  run the saga
 *   GET  /sagas/:sagaId            the recorded step-by-step outcome
 *   GET  /availability/:productId  on-hand, held and available stock
 *   POST /reservations/release     release an order's holds
 */

'use strict';

const express = require('express');

const router = express.Router();

const { authMiddleware, requireRole } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const { getPostgreSQL } = require('../database/connection');
const engine = require('../services/fulfillment/fulfillmentEngine');
const reservations = require('../services/fulfillment/inventoryReservationService');
const { logger } = require('../utils/logger');

router.use(authMiddleware);
router.use(apiLimiter);

function fail(res, error) {
  if (error instanceof reservations.InsufficientStockError) {
    return res.status(409).json({
      success: false, error: error.message, code: 'INSUFFICIENT_STOCK', detail: error.detail,
    });
  }
  if (/not found/i.test(error.message)) {
    return res.status(404).json({ success: false, error: error.message, code: 'NOT_FOUND' });
  }
  if (/requires a database connection/i.test(error.message)) {
    return res.status(503).json({ success: false, error: error.message, code: 'DATABASE_UNAVAILABLE' });
  }
  logger.error('Fulfillment route error', { error: error.message, stack: error.stack });
  return res.status(500).json({ success: false, error: error.message, code: 'FULFILLMENT_ERROR' });
}

router.get('/steps', (req, res) => {
  res.json({
    success: true,
    data: {
      steps: engine.STEP_NAMES,
      count: engine.STEP_NAMES.length,
      compensation: 'Reverse order. A step whose prerequisite cannot be satisfied is recorded '
        + 'as `skipped` with a reason and the chain continues; `skipped` is never reported as '
        + '`succeeded`. A step that should have worked and did not is `failed`, and that '
        + 'triggers compensation of every step that already ran.',
    },
  });
});

router.get('/readiness/:orderId', async (req, res) => {
  try {
    const result = await engine.readiness(req.params.orderId, {
      sellerId: req.query.sellerId,
      companyId: req.query.companyId === undefined ? undefined : Number(req.query.companyId),
    });
    if (!result.found) {
      return res.status(404).json({
        success: false,
        error: `Order ${req.params.orderId} was not found in any known order table`,
        code: 'NOT_FOUND',
      });
    }
    return res.json({ success: true, data: result });
  } catch (error) {
    return fail(res, error);
  }
});

// Running the saga moves stock, money and a carrier booking, so it is not open
// to every authenticated caller.
router.post('/orders/:orderId/fulfill', requireRole('admin', 'operations', 'seller', 'farmer'), async (req, res) => {
  try {
    const result = await engine.fulfillOrder(req.params.orderId, req.body || {});
    // A compensated saga is a reported outcome, not a server error: the caller
    // needs the step-by-step record either way. 409 says "did not complete",
    // with the reason and the unwind in the body.
    return res.status(result.status === 'completed' ? 200 : 409).json({ success: result.status === 'completed', data: result });
  } catch (error) {
    return fail(res, error);
  }
});

router.get('/sagas/:sagaId', async (req, res) => {
  try {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Fulfillment requires a database connection');

    const saga = await pg.query('SELECT * FROM fulfillment_sagas WHERE id = $1', [req.params.sagaId]);
    if (!saga.rows.length) {
      return res.status(404).json({ success: false, error: 'Saga not found', code: 'NOT_FOUND' });
    }
    const steps = await pg.query(
      'SELECT * FROM fulfillment_saga_steps WHERE saga_id = $1 ORDER BY step_order',
      [req.params.sagaId],
    );
    return res.json({ success: true, data: { saga: saga.rows[0], steps: steps.rows } });
  } catch (error) {
    return fail(res, error);
  }
});

router.get('/availability/:productId', async (req, res) => {
  try {
    const result = await reservations.getAvailability(req.params.productId, {
      warehouseId: req.query.warehouseId ? Number(req.query.warehouseId) : null,
    });
    return res.json({ success: true, data: result });
  } catch (error) {
    return fail(res, error);
  }
});

router.post('/reservations/release', requireRole('admin', 'operations'), async (req, res) => {
  try {
    const { orderId, productId } = req.body || {};
    if (!orderId) {
      return res.status(400).json({ success: false, error: 'orderId is required', code: 'INVALID_INPUT' });
    }
    const result = await reservations.release({ orderId, productId: productId || null });
    return res.json({ success: true, data: result });
  } catch (error) {
    return fail(res, error);
  }
});

module.exports = router;
