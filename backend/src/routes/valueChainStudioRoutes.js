'use strict';

/**
 * Value-Chain Studio routes.
 *
 * Auto-mounts via backend/src/core/dynamicRouteLoader.js at
 * /api/v1/value-chain-studio (any *Routes.js exporting an Express router
 * mounts automatically — no index.js change needed).
 *
 * GET  /api/v1/value-chain-studio/:productId              -> full lifecycle plan
 * POST /api/v1/value-chain-studio/:productId/positioning  -> on-demand AI copy
 *
 * The GET path is deliberately deterministic/cheap (no AI call). Positioning
 * copy is only generated when the POST is explicitly triggered — see
 * valueChainStudioService.js's file header for why.
 */

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const valueChainStudioService = require('../services/valueChainStudioService');

const router = express.Router();

router.get('/:productId', authMiddleware, async (req, res) => {
  try {
    const data = await valueChainStudioService.buildLifecyclePlan({
      productId: req.params.productId,
      farmerId: req.query.farmerId || null,
    });
    res.json({ success: true, data });
  } catch (error) {
    const notFound = error.message === 'Product not found';
    res.status(notFound ? 404 : 500).json({ success: false, error: error.message });
  }
});

router.post('/:productId/positioning', authMiddleware, async (req, res) => {
  try {
    const productData = {
      id: req.params.productId,
      name: req.body.name,
      category: req.body.category,
      basePrice: req.body.basePrice,
      valueScore: req.body.valueScore,
      pricing: req.body.pricing,
    };
    const result = await valueChainStudioService.generatePositioningCopy(productData);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
