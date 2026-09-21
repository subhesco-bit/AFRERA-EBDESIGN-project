'use strict';

const router = require('express').Router();
const auth = require('../middleware/auth');
const service = require('../services/productionSupplyBridgeService');

router.use(auth);
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/lots', asyncHandler(async (req, res) => {
  const data = await service.listLots({
    farmerId: req.query.farmerId,
    fpoId: req.query.fpoId,
    status: req.query.status,
    limit: req.query.limit,
    offset: req.query.offset,
  });
  res.json({ success: true, data });
}));

router.post('/lots', asyncHandler(async (req, res) => {
  const data = await service.createLot({ ...req.body, farmerId: req.user.id });
  res.status(201).json({ success: true, data });
}));

router.get('/lots/:id', asyncHandler(async (req, res) => {
  const data = await service.getLot(req.params.id);
  if (!data) return res.status(404).json({ success: false, error: 'Production lot not found' });
  return res.json({ success: true, data });
}));

router.post('/lots/:id/links', asyncHandler(async (req, res) => {
  const data = await service.linkLot({ ...req.body, lotId: req.params.id });
  res.status(201).json({ success: true, data });
}));

router.post('/lots/:id/list', asyncHandler(async (req, res) => {
  const data = await service.createMarketplaceListing({
    lotId: req.params.id,
    quantity: req.body.quantity,
    listingPayload: req.body.listingPayload || {},
  });
  res.status(201).json({ success: true, data });
}));

router.__ebdesign = {
  contract: 'production-supply-market-bridge-v1',
  flow: 'farmer -> production -> harvest -> aggregation -> marketplace',
  transactionalMarketplaceListing: true,
};

module.exports = router;
