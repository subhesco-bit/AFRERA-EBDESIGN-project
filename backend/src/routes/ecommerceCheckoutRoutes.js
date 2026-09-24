/** Checkout + RMA routes */
'use strict';

const express = require('express');
const router = express.Router();

let checkout;
let rma;
try {
  checkout = require('../services/ecommerce/checkoutOrchestrator');
} catch {
  checkout = null;
}
try {
  rma = require('../services/ecommerce/returnsRmaStateMachine');
} catch {
  rma = null;
}

router.get('/health', (req, res) => {
  res.json({ success: true, checkout: !!checkout, rma: !!rma });
});

router.post('/checkout', (req, res) => {
  if (!checkout) return res.status(503).json({ success: false });
  try {
    res.json({ success: true, ...checkout.checkout(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message, code: e.code });
  }
});

router.post('/checkout/:orderId/advance', (req, res) => {
  if (!checkout) return res.status(503).json({ success: false });
  try {
    res.json({ success: true, ...checkout.advanceOrder(req.params.orderId, req.body?.to) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message, code: e.code });
  }
});

router.post('/returns', (req, res) => {
  if (!rma) return res.status(503).json({ success: false });
  try {
    res.json({ success: true, rma: rma.create(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/returns/:id/transition', (req, res) => {
  if (!rma) return res.status(503).json({ success: false });
  try {
    res.json({ success: true, rma: rma.transition(req.params.id, req.body?.to, req.body) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message, code: e.code });
  }
});

module.exports = router;
