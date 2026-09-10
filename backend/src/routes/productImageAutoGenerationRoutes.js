/**
 * Product Image Auto-Generation Routes
 * Endpoints for managing automatic image generation
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');
const productImageAutoGenerationService = require('../services/productImageAutoGenerationService');
const { authMiddleware: authenticate } = require('../middleware/auth');

const limiter = rateLimiter({ windowMs: 60000, max: 30 });

/**
 * Get auto-generation status
 * GET /api/auto-generation/status
 */
router.get('/status', authenticateToken, (req, res) => {
  try {
    const status = productImageAutoGenerationService.getStatus();
    res.json({
      success: true,
      status,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Queue product for auto-generation
 * POST /api/auto-generation/queue
 */
router.post('/queue', authenticateToken, limiter, async (req, res) => {
  try {
    const { productId, productData, trigger, priority, pageContext } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID required' });
    }

    productImageAutoGenerationService.addToQueue({
      productId,
      productData,
      trigger: trigger || 'manual',
      priority: priority || 'normal',
      pageContext,
      queuedAt: new Date(),
    });

    res.json({
      success: true,
      message: 'Product queued for auto-generation',
      queueLength: productImageAutoGenerationService.autoGenerationQueue.length,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Batch queue multiple products
 * POST /api/auto-generation/batch-queue
 */
router.post('/batch-queue', authenticateToken, async (req, res) => {
  try {
    const { productIds, priority } = req.body;

    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({ error: 'Product IDs array required' });
    }

    const result = await productImageAutoGenerationService.batchAutoGenerate(
      productIds,
      { priority }
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
 * Trigger immediate processing of queue
 * POST /api/auto-generation/process-now
 */
router.post('/process-now', authenticateToken, async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await productImageAutoGenerationService.processQueue();

    res.json({
      success: true,
      message: 'Queue processing triggered',
      remainingInQueue: productImageAutoGenerationService.autoGenerationQueue.length,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Clear queue (admin only)
 * DELETE /api/auto-generation/queue
 */
router.delete('/queue', authenticateToken, (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = productImageAutoGenerationService.clearQueue();

    res.json({
      success: true,
      ...result,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Pause/Resume auto-generation
 * POST /api/auto-generation/pause
 */
router.post('/pause', authenticateToken, (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { paused } = req.body;

    productImageAutoGenerationService.setPaused(paused);

    res.json({
      success: true,
      message: `Auto-generation ${paused ? 'paused' : 'resumed'}`,
      status: productImageAutoGenerationService.getStatus(),
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Queue product by page view
 * POST /api/auto-generation/on-page-view/:productId
 */
router.post('/on-page-view/:productId', limiter, async (req, res) => {
  try {
    const { productId } = req.params;
    const { region, languages } = req.body;

    const pageContext = {
      region,
      languages,

    await productImageAutoGenerationService.onProductPageView(productId, pageContext);

    res.json({
      success: true,
      message: 'Product queued for page-view auto-generation',
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get queue preview (next N jobs)
 * GET /api/auto-generation/queue-preview
 */
router.get('/queue-preview', authenticateToken, (req, res) => {
  try {
    const { limit } = req.query;
    const preview = productImageAutoGenerationService.autoGenerationQueue.slice(
      0,
      parseInt(limit) || 10
    );

    res.json({
      success: true,
      total: productImageAutoGenerationService.autoGenerationQueue.length,
      preview,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get generation statistics
 * GET /api/auto-generation/stats
 */
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const stats = productImageAutoGenerationService.generationStats;

    const successRate = stats.total > 0
      ? ((stats.successful / stats.total) * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      stats: {
        ...stats,
        successRate: `${successRate}%`,
      },
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Configure auto-generation (admin only)
 * PUT /api/auto-generation/config
 */
router.put('/config', authenticateToken, (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const {
      enableAutoGeneration,
      enableOnPageView,
      enableOnProductAdd,
      defaultRegion,
      defaultLanguages,
      batchSize,
      maxConcurrent,
      queueCheckInterval,
    } = req.body;

    // Update config
    if (enableAutoGeneration !== undefined) {
      productImageAutoGenerationService.generationConfig.enableAutoGeneration = enableAutoGeneration;
    }
    if (enableOnPageView !== undefined) {
      productImageAutoGenerationService.generationConfig.enableOnPageView = enableOnPageView;
    }
    if (enableOnProductAdd !== undefined) {
      productImageAutoGenerationService.generationConfig.enableOnProductAdd = enableOnProductAdd;
    }
    if (defaultRegion !== undefined) {
      productImageAutoGenerationService.generationConfig.defaultRegion = defaultRegion;
    }
    if (defaultLanguages !== undefined) {
      productImageAutoGenerationService.generationConfig.defaultLanguages = Array.isArray(defaultLanguages)
        ? defaultLanguages
        : defaultLanguages.split(',');
    }
    if (batchSize !== undefined) {
      productImageAutoGenerationService.generationConfig.batchSize = batchSize;
    }
    if (maxConcurrent !== undefined) {
      productImageAutoGenerationService.generationConfig.maxConcurrent = maxConcurrent;
    }
    if (queueCheckInterval !== undefined) {
      productImageAutoGenerationService.generationConfig.queueCheckInterval = queueCheckInterval;
    }

    res.json({
      success: true,
      message: 'Configuration updated',
      config: productImageAutoGenerationService.generationConfig,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
