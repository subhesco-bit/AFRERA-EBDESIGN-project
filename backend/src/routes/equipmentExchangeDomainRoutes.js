/**
 * Real backend routes for LogisticsMatchingPage.jsx's equipment exchange
 * widget, backed by services/legacy/equipmentExchangeService.js. Exact 1:1
 * name matches; listedBy/reservedBy args the page doesn't pass are filled
 * from the authenticated user.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/equipmentExchangeService');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

const wrap = (fn) => async (req, res) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.post('/equipment-exchange/listing', wrap((req) => svc.createListing(req.user.id, req.body)));
router.get('/equipment-exchange/listings', wrap((req) => svc.listAvailable(req.query)));
router.get('/equipment-exchange/listing/:listingId', wrap((req) => svc.getListing(req.params.listingId)));
router.post('/equipment-exchange/listing/:listingId/reserve', wrap((req) => svc.reserveListing(req.params.listingId, req.user.id)));
router.post('/equipment-exchange/listing/:listingId/complete', wrap((req) => svc.completeExchange(req.params.listingId, req.user.id)));
router.post('/equipment-exchange/listing/:listingId/withdraw', wrap((req) => svc.withdrawListing(req.params.listingId, req.user.id)));

module.exports = router;
