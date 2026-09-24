'use strict';

/**
 * Value-Chain Studio routes (v2).
 *
 * Auto-mounts via backend/src/core/dynamicRouteLoader.js at
 * /api/v1/value-chain-studio.
 *
 * GET  /api/v1/value-chain-studio/capabilities           -> section map + rules
 * GET  /api/v1/value-chain-studio/:productId             -> full lifecycle plan
 * POST /api/v1/value-chain-studio/:productId/positioning -> on-demand AI copy
 *
 * GET plan path is deterministic (no AI). Positioning is explicit POST only.
 */

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const valueChainStudioService = require('../services/valueChainStudioService');

const router = express.Router();

/** Public capability discovery (still auth-gated with the rest of the API). */
router.get('/capabilities', authMiddleware, (req, res) => {
  try {
    const data = valueChainStudioService.getCapabilities();
    res.set('Cache-Control', 'private, max-age=60');
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:productId', authMiddleware, async (req, res) => {
  try {
    const data = await valueChainStudioService.buildLifecyclePlan({
      productId: req.params.productId,
      farmerId: req.query.farmerId || null,
      requester: req.user,
    });
    res.set('Cache-Control', 'private, no-store');
    res.set('X-Plan-Version', data.planVersion || '2.0');
    res.json({ success: true, data });
  } catch (error) {
    const notFound = error.message === 'Product not found';
    const badRequest = error.message === 'productId is required';
    const forbidden = error.message === 'Farmer context is not accessible';
    const status = notFound ? 404 : badRequest ? 400 : forbidden ? 403 : 500;
    res.status(status).json({
      success: false,
      error: error.message,
      code: notFound ? 'PRODUCT_NOT_FOUND' : badRequest ? 'PRODUCT_ID_REQUIRED' : forbidden ? 'FARMER_CONTEXT_FORBIDDEN' : 'PLAN_BUILD_FAILED',
    });
  }
});

router.post('/:productId/positioning', authMiddleware, async (req, res) => {
  try {
    const product = await valueChainStudioService.getProductContext(req.params.productId);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found', code: 'PRODUCT_NOT_FOUND' });
    const productData = { id: product.id, name: product.name, category: product.category_name, basePrice: product.base_price };
    const result = await valueChainStudioService.generatePositioningCopy(productData);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'POSITIONING_FAILED',
    });
  }
});

module.exports = router;
