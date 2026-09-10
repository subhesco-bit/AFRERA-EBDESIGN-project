/**
 * Farmer Image Portal Routes
 * Farmer-facing endpoints for image generation, approval, and marketplace publishing
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');
const farmerImagePortalService = require('../services/farmerImagePortalService');
const { authMiddleware: authenticate } = require('../middleware/auth');

const limiter = rateLimiter({ windowMs: 60000, max: 30 });

/**
 * Create farmer portfolio
 * POST /api/farmer/portfolio
 */
router.post('/portfolio', authenticateToken, async (req, res) => {
  try {
    const { farmerData } = req.body;
    const farmerId = req.user.id;

    if (!farmerData || !farmerData.name) {
      return res.status(400).json({ error: 'Farmer data required' });
    }

    const portfolio = await farmerImagePortalService.createFarmerPortfolio(
      farmerId,
      farmerData
    );

    res.json({
      success: true,
      portfolio,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Upload product to farmer portfolio
 * POST /api/farmer/portfolio/products
 */
router.post('/portfolio/products', authenticateToken, limiter, async (req, res) => {
  try {
    const { productData } = req.body;
    const farmerId = req.user.id;

    if (!productData || !productData.name) {
      return res.status(400).json({ error: 'Product data required' });
    }

    const product = await farmerImagePortalService.uploadFarmerProduct(
      farmerId,
      productData
    );

    res.json({
      success: true,
      product,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate images for farmer product
 * POST /api/farmer/portfolio/products/:productId/generate-images
 */
router.post('/portfolio/products/:productId/generate-images', authenticateToken, limiter, async (req, res) => {
  try {
    const { languages, region, seoKeywords } = req.body;
    const farmerId = req.user.id;
    const productId = req.params.productId;

    const result = await farmerImagePortalService.generateFarmerProductImages(
      farmerId,
      productId,
      { languages, region, seoKeywords }
    );

    res.json({
      success: true,
      ...result,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Approve images
 * POST /api/farmer/portfolio/products/:productId/approve-images
 */
router.post('/portfolio/products/:productId/approve-images', authenticateToken, async (req, res) => {
  try {
    const { imageIds, notes } = req.body;
    const farmerId = req.user.id;
    const productId = req.params.productId;

    if (!imageIds || !Array.isArray(imageIds)) {
      return res.status(400).json({ error: 'Image IDs array required' });
    }

    const result = await farmerImagePortalService.approveImages(
      farmerId,
      productId,
      imageIds,
      { notes }
    );

    res.json({
      success: true,
      ...result,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Publish product to marketplace
 * POST /api/farmer/portfolio/products/:productId/publish
 */
router.post('/portfolio/products/:productId/publish', authenticateToken, async (req, res) => {
  try {
    const { marketplaceConfig } = req.body;
    const farmerId = req.user.id;
    const productId = req.params.productId;

    const result = await farmerImagePortalService.publishToMarketplace(
      farmerId,
      productId,
      marketplaceConfig
    );

    res.json({
      success: true,
      ...result,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get farmer dashboard
 * GET /api/farmer/dashboard
 */
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const farmerId = req.user.id;

    const dashboard = await farmerImagePortalService.getFarmerDashboard(farmerId);

    res.json(dashboard);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get marketplace performance
 * GET /api/farmer/marketplace-performance
 */
router.get('/marketplace-performance', authenticateToken, async (req, res) => {
  try {
    const farmerId = req.user.id;

    const performance = await farmerImagePortalService.getMarketplacePerformance(farmerId);

    res.json(performance);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Add quality feedback
 * POST /api/farmer/feedback/:imageId
 */
router.post('/feedback/:imageId', authenticateToken, async (req, res) => {
  try {
    const { rating, suggestions, improvementAreas } = req.body;
    const imageId = req.params.imageId;

    if (!rating) {
      return res.status(400).json({ error: 'Rating required' });
    }

    const feedback = farmerImagePortalService.addQualityFeedback(imageId, {
      rating,
      suggestions,
      improvementAreas,
    });

    res.json({
      success: true,
      feedback,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Export images
 * POST /api/farmer/export-images
 */
router.post('/export-images', authenticateToken, async (req, res) => {
  try {
    const { productIds, format } = req.body;
    const farmerId = req.user.id;

    const exportData = await farmerImagePortalService.exportImages(
      farmerId,
      productIds,
      format || 'zip'
    );

    res.json({
      success: true,
      ...exportData,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
