/**
 * Product Image Auto-Generation Service
 * Automatically generates images when:
 * - Products are added to the system
 * - Products are viewed on marketplace
 * - Inventory is updated
 * - On-demand page requirements
 */

const { logger } = require('../utils/logger');
const aiImageGenerationEnhancedService = require('./aiImageGenerationEnhancedService');
const ecommerceImageIntegrationService = require('./ecommerceImageIntegrationService');
const crypto = require('crypto');

class ProductImageAutoGenerationService {
  constructor() {
    this.autoGenerationQueue = [];
    this.isProcessing = false;
    this.generationConfig = {
      enableAutoGeneration: process.env.AUTO_IMAGE_GENERATION === 'true',
      enableOnPageView: process.env.AUTO_GENERATE_ON_PAGE_VIEW === 'true',
      enableOnProductAdd: process.env.AUTO_GENERATE_ON_PRODUCT_ADD === 'true',
      defaultRegion: process.env.DEFAULT_REGION || 'global-export',
      defaultLanguages: (process.env.DEFAULT_LANGUAGES || 'en,hi').split(','),
      batchSize: parseInt(process.env.AUTO_GEN_BATCH_SIZE || '10'),
      maxConcurrent: parseInt(process.env.AUTO_GEN_MAX_CONCURRENT || '3'),
      queueCheckInterval: parseInt(process.env.AUTO_GEN_CHECK_INTERVAL || '5000'),
    };

    this.generationStats = {
      total: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      avgTimeMs: 0,
    };

    // Start queue processor
    if (this.generationConfig.enableAutoGeneration) {
      this.startQueueProcessor();
    }
  }

  /**
   * Register product creation hook
   */
  async onProductCreated(productData) {
    try {
      if (!this.generationConfig.enableAutoGeneration || !this.generationConfig.enableOnProductAdd) {
        logger.debug('Auto-generation disabled for product creation');
        return;
      }

      logger.info(`Product created - queuing for auto image generation`, {
        productId: productData.id,
        productName: productData.name,
      });

      // Add to queue
      this.addToQueue({
        productId: productData.id,
        productData,
        trigger: 'product-created',
        priority: 'high',
        queuedAt: new Date(),
      });

    } catch (error) {
      logger.error(`Failed to queue product for auto-generation`, {
        productId: productData.id,
        error: error.message,
      });
    }
  }

  /**
   * Register product view hook (page requirement)
   */
  async onProductPageView(productId, pageContext = {}) {
    try {
      if (!this.generationConfig.enableAutoGeneration || !this.generationConfig.enableOnPageView) {
        logger.debug('Auto-generation disabled for page view');
        return;
      }

      logger.info(`Product page viewed - checking if images needed`, {
        productId,
        pageContext,
      });

      // Check if product already has images
      const hasImages = await this.checkProductHasImages(productId);
      if (hasImages) {
        logger.debug(`Product already has images`, { productId });
        return;
      }

      // Queue for generation
      this.addToQueue({
        productId,
        trigger: 'page-view',
        priority: 'normal',
        pageContext,
        queuedAt: new Date(),
      });

    } catch (error) {
      logger.error(`Failed to queue product for page view generation`, {
        productId,
        error: error.message,
      });
    }
  }

  /**
   * Register inventory update hook
   */
  async onInventoryUpdated(productId, inventory) {
    try {
      if (!this.generationConfig.enableAutoGeneration) {
        return;
      }

      // Only regenerate if stock dropped to critical level
      if (inventory.quantity > 5) {
        return;
      }

      logger.info(`Low inventory - queuing for image refresh`, {
        productId,
        quantity: inventory.quantity,
      });

      this.addToQueue({
        productId,
        trigger: 'inventory-critical',
        priority: 'low',
        queuedAt: new Date(),
      });

    } catch (error) {
      logger.error(`Failed to queue inventory update`, {
        productId,
        error: error.message,
      });
    }
  }

  /**
   * Add job to queue
   */
  addToQueue(job) {
    // Check if already in queue
    const existing = this.autoGenerationQueue.find(
      j => j.productId === job.productId && j.trigger === job.trigger
    );

    if (existing) {
      logger.debug(`Job already in queue`, { productId: job.productId });
      return;
    }

    // Sort by priority (high first)
    const priorityScore = job.priority === 'high' ? 0 : (job.priority === 'normal' ? 1 : 2);
    job.priorityScore = priorityScore;

    this.autoGenerationQueue.push(job);
    this.autoGenerationQueue.sort((a, b) => a.priorityScore - b.priorityScore);

    logger.info(`Job added to queue`, {
      productId: job.productId,
      trigger: job.trigger,
      queueLength: this.autoGenerationQueue.length,
    });
  }

  /**
   * Start background queue processor
   */
  startQueueProcessor() {
    setInterval(async () => {
      if (!this.isProcessing && this.autoGenerationQueue.length > 0) {
        await this.processQueue();
      }
    }, this.generationConfig.queueCheckInterval);

    logger.info(`Auto-generation queue processor started`, {
      checkInterval: this.generationConfig.queueCheckInterval,
    });
  }

  /**
   * Process queue in batches
   */
  async processQueue() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      const batch = this.autoGenerationQueue.splice(0, this.generationConfig.batchSize);

      if (batch.length === 0) {
        return;
      }

      logger.info(`Processing auto-generation batch`, {
        batchSize: batch.length,
        remainingInQueue: this.autoGenerationQueue.length,
      });

      const results = [];
      for (const job of batch) {
        try {
          const result = await this.processJob(job);
          results.push(result);
        } catch (error) {
          logger.error(`Failed to process job`, {
            productId: job.productId,
            error: error.message,
          });
          results.push({
            productId: job.productId,
            success: false,
            error: error.message,
          });
        }
      }

      this.updateStats(results);

    } catch (error) {
      logger.error(`Queue processing failed`, {
        error: error.message,
      });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process individual job
   */
  async processJob(job) {
    const startTime = Date.now();

    try {
      logger.info(`Processing auto-generation job`, {
        productId: job.productId,
        trigger: job.trigger,
      });

      // Fetch product data if not provided
      let productData = job.productData;
      if (!productData) {
        productData = await this.fetchProductData(job.productId);
        if (!productData) {
          throw new Error('Product not found');
        }
      }

      // Generate images in default languages
      const region = job.pageContext?.region || this.generationConfig.defaultRegion;
      const languages = job.pageContext?.languages || this.generationConfig.defaultLanguages;

      const images = [];
      for (const language of languages) {
        const image = await aiImageGenerationEnhancedService.generateProductImage(
          productData,
          region,
          language
        );
        images.push(image);
      }

      // Create marketplace listing
      const listing = await ecommerceImageIntegrationService.createProductListing(
        productData,
        {
          region,
          language: languages[0],
          inventory: job.pageContext?.inventory,
        }
      );

      const processingTime = Date.now() - startTime;

      logger.info(`Job completed successfully`, {
        productId: job.productId,
        imagesGenerated: images.length,
        processingTimeMs: processingTime,
      });

      return {
        productId: job.productId,
        success: true,
        imagesGenerated: images.length,
        listingId: listing.listingId,
        processingTimeMs: processingTime,
      };

    } catch (error) {
      logger.error(`Job processing failed`, {
        productId: job.productId,
        error: error.message,
      });

      return {
        productId: job.productId,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Fetch product data from database
   */
  async fetchProductData(productId) {
    try {
      // This would query the actual database
      // Placeholder implementation
      return {
        id: productId,
        name: `Product ${productId}`,
        category: 'General',
        description: 'Auto-generated product',
      };
    } catch (error) {
      logger.error(`Failed to fetch product data`, {
        productId,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Check if product already has images
   */
  async checkProductHasImages(productId) {
    try {
      // This would query the actual database
      // Placeholder implementation
      return false;
    } catch (error) {
      logger.error(`Failed to check product images`, {
        productId,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Update generation statistics
   */
  updateStats(results) {
    for (const result of results) {
      this.generationStats.total++;

      if (result.success) {
        this.generationStats.successful++;
        this.generationStats.avgTimeMs =
          (this.generationStats.avgTimeMs + result.processingTimeMs) / 2;
      } else {
        this.generationStats.failed++;
      }
    }

    logger.info(`Generation stats updated`, {
      stats: this.generationStats,
    });
  }

  /**
   * Batch auto-generate for multiple products
   */
  async batchAutoGenerate(productIds, options = {}) {
    try {
      logger.info(`Batch auto-generation started`, {
        count: productIds.length,
      });

      for (const productId of productIds) {
        this.addToQueue({
          productId,
          trigger: 'batch-manual',
          priority: options.priority || 'normal',
          queuedAt: new Date(),
        });
      }

      // Force start processing if not already running
      if (!this.isProcessing && this.autoGenerationQueue.length > 0) {
        await this.processQueue();
      }

      return {
        queued: productIds.length,
        totalInQueue: this.autoGenerationQueue.length,
      };

    } catch (error) {
      logger.error(`Batch auto-generation failed`, {
        count: productIds.length,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get auto-generation status
   */
  getStatus() {
    return {
      config: this.generationConfig,
      queue: {
        length: this.autoGenerationQueue.length,
        isProcessing: this.isProcessing,
        nextBatch: this.autoGenerationQueue.slice(0, 5),
      },
      stats: this.generationStats,
    };
  }

  /**
   * Clear queue (admin only)
   */
  clearQueue() {
    const clearedCount = this.autoGenerationQueue.length;
    this.autoGenerationQueue = [];
    logger.info(`Queue cleared`, { clearedCount });
    return { cleared: clearedCount };
  }

  /**
   * Pause/resume auto-generation
   */
  setPaused(paused) {
    this.generationConfig.enableAutoGeneration = !paused;
    logger.info(`Auto-generation ${paused ? 'paused' : 'resumed'}`);
    return { paused };
  }
}

module.exports = new ProductImageAutoGenerationService();
