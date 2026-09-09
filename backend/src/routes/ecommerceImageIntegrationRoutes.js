/**
 * E-Commerce Image Integration Routes
 * Product listings, marketplace optimization, performance tracking
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');
const ecommerceImageIntegrationService = require('../services/ecommerceImageIntegrationService');

const limiter = rateLimiter({ windowMs: 60000, max: 20 });

/**
 * Create product listing with images
 * POST /api/commerce/listings
 */
router.post('/listings', authenticateToken, limiter, async (req, res) => {
  try {
    const { productData, region, language, pricing, inventory, seoKeywords } = req.body;

    if (!productData || !productData.name) {
      return res.status(400).json({ error: 'Product data required' });
    }

    const listing = await ecommerceImageIntegrationService.createProductListing(
      productData,
      {
        region,
        language,
        pricing,
        inventory,
        seoKeywords,
      }
    );

    res.json({
      success: true,
      listing,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get product listing
 * GET /api/commerce/listings/:listingId
 */
router.get('/listings/:listingId', async (req, res) => {
  try {
    const listing = ecommerceImageIntegrationService.getListing(req.params.listingId);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json(listing);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Optimize listing for marketplace
 * POST /api/commerce/listings/:listingId/optimize
 */
router.post('/listings/:listingId/optimize', authenticateToken, async (req, res) => {
  try {
    const { marketplace } = req.body;

    if (!marketplace) {
      return res.status(400).json({ error: 'Marketplace name required' });
    }

    const optimized = await ecommerceImageIntegrationService.optimizeForMarketplace(
      req.params.listingId,
      marketplace
    );

    res.json({
      success: true,
      optimized,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Sync inventory with listing
 * PUT /api/commerce/listings/:listingId/sync-inventory
 */
router.put('/listings/:listingId/sync-inventory', authenticateToken, async (req, res) => {
  try {
    const { productId, inventory } = req.body;

    if (!inventory) {
      return res.status(400).json({ error: 'Inventory data required' });
    }

    const updated = await ecommerceImageIntegrationService.syncWithInventory(
      productId,
      inventory
    );

    res.json({
      success: true,
      listing: updated,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate SKU images
 * POST /api/commerce/sku-images
 */
router.post('/sku-images', authenticateToken, async (req, res) => {
  try {
    const { parentProductId, skuData } = req.body;

    if (!parentProductId || !skuData) {
      return res.status(400).json({ error: 'Product ID and SKU data required' });
    }

    const results = await ecommerceImageIntegrationService.generateSKUImages(
      parentProductId,
      skuData
    );

    res.json({
      success: true,
      generated: results.length,
      results,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get listing performance analytics
 * GET /api/commerce/listings/:listingId/performance
 */
router.get('/listings/:listingId/performance', authenticateToken, (req, res) => {
  try {
    const analytics = ecommerceImageIntegrationService.getPerformanceAnalytics(
      req.params.listingId
    );

    if (!analytics) {
      return res.status(404).json({ error: 'No analytics found' });
    }

    res.json(analytics);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get product catalog
 * GET /api/commerce/catalog
 */
router.get('/catalog', async (req, res) => {
  try {
    const { category, minQualityScore, region } = req.query;

    const catalog = ecommerceImageIntegrationService.getCatalog({
      category,
      minQualityScore: minQualityScore ? parseInt(minQualityScore) : null,
      region,
    });

    res.json(catalog);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Bulk update listings
 * POST /api/commerce/listings/bulk-update
 */
router.post('/listings/bulk-update', authenticateToken, async (req, res) => {
  try {
    const { listings, region, language } = req.body;

    if (!listings || !Array.isArray(listings)) {
      return res.status(400).json({ error: 'Listings array required' });
    }

    const results = await ecommerceImageIntegrationService.bulkUpdateListings(
      listings,
      { region, language }
    );

    res.json({
      success: true,
      ...results,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get dashboard analytics
 * GET /api/commerce/analytics/dashboard
 */
router.get('/analytics/dashboard', authenticateToken, (req, res) => {
  try {
    const analytics = ecommerceImageIntegrationService.getDashboardAnalytics();
    res.json(analytics);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
