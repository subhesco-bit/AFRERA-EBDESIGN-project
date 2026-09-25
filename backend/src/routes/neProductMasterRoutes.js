'use strict';

const express = require('express');
const productMaster = require('../services/catalog/neProductMasterService');

const router = express.Router();

router.get('/stats', (req, res) => {
  res.json({ success: true, data: productMaster.stats() });
});

router.get('/categories', (req, res) => {
  res.json({ success: true, data: productMaster.categories() });
});

router.get('/origins', (req, res) => {
  res.json({ success: true, data: productMaster.origins() });
});

router.get('/products', (req, res) => {
  const giClaim = req.query.giClaim == null ? null : String(req.query.giClaim).toLowerCase() === 'true';
  const result = productMaster.search(req.query.q || '', {
    category: req.query.category,
    origin: req.query.origin,
    giClaim,
    limit: req.query.limit,
    offset: req.query.offset,
  });
  res.json({
    success: true,
    data: result,
    truthStatus: {
      gi: 'UNVERIFIED_PENDING_PHASE_047',
      pricing: 'PROTOTYPE_VALUES_PENDING_PHASE_048',
      farmerMap: 'PRIVATE_NOT_EXPOSED',
    },
  });
});

router.get('/products/:productId', (req, res) => {
  const product = productMaster.getById(req.params.productId);
  if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
  return res.json({
    success: true,
    data: product,
    truthStatus: {
      gi: 'UNVERIFIED_PENDING_PHASE_047',
      pricing: 'PROTOTYPE_VALUES_PENDING_PHASE_048',
      farmerMap: 'PRIVATE_NOT_EXPOSED',
    },
  });
});

module.exports = router;
