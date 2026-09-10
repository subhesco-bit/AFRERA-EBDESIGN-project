/**
 * AI Image Generation Enhanced Routes
 * International-grade image generation with multi-language, multi-region support
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');
const aiImageGenerationEnhancedService = require('../services/aiImageGenerationEnhancedService');
const { authMiddleware: authenticate } = require('../middleware/auth');

// Rate limiting for image generation (max 10 req/min per user)
const imageLimiter = rateLimiter({ windowMs: 60000, max: 10 });

/**
 * Generate single image
 * POST /api/ai/images/generate
 */
router.post('/generate', authenticateToken, imageLimiter, async (req, res) => {
  try {
    const { productData, region, language, seoKeywords } = req.body;

    if (!productData || !productData.name) {
      return res.status(400).json({
        error: 'Product data with name is required',
      });
    }

    const image = await aiImageGenerationEnhancedService.generateProductImage(
      productData,
      region || 'global-export',
      language || 'en',
      { seoKeywords }
    );

    res.json({
      success: true,
      image,
      qualityScore: image.qualityScore.overallScore,
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * Batch generate images
 * POST /api/ai/images/batch
 */
router.post('/batch', authenticateToken, rateLimiter({ windowMs: 60000, max: 5 }), async (req, res) => {
  try {
    const { products, region, language } = req.body;

    if (!products || !Array.isArray(products)) {
      return res.status(400).json({
        error: 'Products array is required',
      });
    }

    const result = await aiImageGenerationEnhancedService.generateBatch(
      products,
      region || 'global-export',
      language || 'en'
    );

    res.json({
      success: true,
      ...result,
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * Get supported languages
 * GET /api/ai/images/languages
 */
router.get('/languages', (req, res) => {
  res.json({
    supported: aiImageGenerationEnhancedService.constructor.SUPPORTED_LANGUAGES,
  });
});

/**
 * Get regional profiles
 * GET /api/ai/images/regions
 */
router.get('/regions', (req, res) => {
  res.json({
    profiles: aiImageGenerationEnhancedService.constructor.REGIONAL_PROFILES,
  });
});

/**
 * Get image analytics
 * GET /api/ai/images/analytics
 */
router.get('/analytics', authenticateToken, (req, res) => {
  try {
    const analytics = aiImageGenerationEnhancedService.getAnalytics();
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Export images to CDN
 * POST /api/ai/images/export-cdn
 */
router.post('/export-cdn', authenticateToken, async (req, res) => {
  try {
    const { imageIds } = req.body;

    if (!imageIds || !Array.isArray(imageIds)) {
      return res.status(400).json({
        error: 'Image IDs array is required',
      });
    }

    const results = await aiImageGenerationEnhancedService.exportToCDN(imageIds);

    res.json({
      success: true,
      exported: results.length,
      results,
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * Clear cache (admin only)
 * DELETE /api/ai/images/cache
 */
router.delete('/cache', authenticateToken, (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Admin access required',
      });
    }

    aiImageGenerationEnhancedService.clearCache();
    res.json({ success: true, message: 'Cache cleared' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
