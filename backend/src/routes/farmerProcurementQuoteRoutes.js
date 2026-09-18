'use strict';

const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { quoteForActor, createSupplierOffer, approveSupplierOffer } = require('../services/commerce/farmerProcurementQuoteService');
const router = express.Router();

router.post('/offers', authMiddleware, requireRole('corporate', 'admin'), async (req, res) => {
  try {
    const offer = await createSupplierOffer(req.user.id, req.body || {});
    res.status(201).json({ success: true, data: offer });
  } catch (error) {
    res.status(/verified/.test(error.message) ? 403 : /required|positive|nonnegative|unknown|bulk_tiers/.test(error.message) ? 400 : 503)
      .json({ success: false, error: /verified/.test(error.message) ? 'Supplier origin not verified' : /required|positive|nonnegative|unknown|bulk_tiers/.test(error.message) ? error.message : 'Supplier offer unavailable' });
  }
});

router.post('/offers/:id/approve', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const offer = await approveSupplierOffer(req.user.id, req.params.id);
    res.json({ success: true, data: offer });
  } catch (error) {
    res.status(/cannot be approved/.test(error.message) ? 409 : 503)
      .json({ success: false, error: /cannot be approved/.test(error.message) ? error.message : 'Offer approval unavailable' });
  }
});

router.post('/compare', authMiddleware, async (req, res) => {
  try {
    const result = await quoteForActor({ ...req.body, actorId: req.user.id });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    const denied = /authority|verified/.test(error.message);
    const invalid = /required|positive|unsupported|cannot/.test(error.message);
    res.status(denied ? 403 : invalid ? 400 : 503)
      .json({ success: false, error: denied ? 'Purchase access denied' : invalid ? error.message : 'Procurement comparison unavailable' });
  }
});

module.exports = router;
