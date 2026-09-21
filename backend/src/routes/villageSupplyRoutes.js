'use strict';

const router = require('express').Router();
const auth = require('../middleware/auth');
const service = require('../services/villageSupplyService');

router.use(auth);

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/catalog', asyncHandler(async (req, res) => {
  const data = await service.listCatalog({
    demandLayer: req.query.demandLayer,
    category: req.query.category,
  });
  res.json({ success: true, data });
}));

router.post('/demands', asyncHandler(async (req, res) => {
  const data = await service.createDemand({
    ...req.body,
    requesterId: req.user.id,
  });
  res.status(201).json({ success: true, data });
}));

router.get('/villages/:villageId/plan', asyncHandler(async (req, res) => {
  const data = await service.getPlan(req.params.villageId, req.query.demandLayer);
  res.json({ success: true, data });
}));

router.post('/orders', asyncHandler(async (req, res) => {
  const data = await service.createOrder({
    ...req.body,
    requestedById: req.user.id,
  });
  res.status(201).json({ success: true, data });
}));

router.__ebdesign = {
  contract: 'village-external-demand-supply-v1',
  scope: 'Village household/village/agro demand into SUBH supply orchestration',
  authenticationRequired: true,
  transactionalOrders: true,
};

module.exports = router;
