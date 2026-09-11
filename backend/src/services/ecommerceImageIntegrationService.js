/**
 * E-Commerce Image Integration Service
 * Integrates AI-generated images with product listings, inventory, and marketplace display
 * Handles:
 * - Product catalog image management
 * - Marketplace listing optimization
 * - SKU/variant image generation
 * - Inventory sync
 * - Performance tracking
 */

const { logger } = require('../utils/logger');
const aiImageGenerationEnhancedService = require('./aiImageGenerationEnhancedService');
const crypto = require('crypto');

class EcommerceImageIntegrationService {
  constructor() {
    this.productCatalog = new Map();
    this.listingImages = new Map();
    this.variantImages = new Map();
    this.performanceMetrics = new Map();
  }

  /**
   * Generate and attach images to product listing
   */
  async createProductListing(productData, options = {}) {
    try {
      logger.info(`Creating e-commerce product listing`, {
        productId: productData.id,
        productName: productData.name,
      });

      const region = options.region || 'global-export';
      const language = options.language || 'en';

      // Generate primary image
      const primaryImage = await aiImageGenerationEnhancedService.generateProductImage(
        productData,
        region,
        language,
        { seoKeywords: options.seoKeywords }
      );

      // Generate variant images if applicable
      const variantImages = [];
      if (productData.variants && productData.variants.length > 0) {
        for (const variant of productData.variants) {
          const variantImage = await aiImageGenerationEnhancedService.generateProductImage(
            variant,
            region,
            language
          );
          variantImages.push(variantImage);
        }
      }

      // Create listing
      const listing = {
        listingId: crypto.randomUUID(),
        productId: productData.id,
        productName: productData.name,
        category: productData.category,
        primaryImage,
        variantImages,
        seoMetadata: primaryImage.seoMetadata,
        pricing: options.pricing || {},
        inventory: options.inventory || {},
        visibility: {
          marketplace: true,
          website: true,
          mobile: true,
        },
        qualityScore: primaryImage.qualityScore,
        region,
        language,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };

      // Cache listing
      this.listingImages.set(listing.listingId, listing);
      this.productCatalog.set(productData.id, listing);

      // Track performance
      this.trackListingPerformance(listing.listingId, {
        created: true,
        imageCount: 1 + variantImages.length,
      });

      logger.info(`Product listing created successfully`, {
        listingId: listing.listingId,
        images: 1 + variantImages.length,
      });

      return listing;

    } catch (error) {
      logger.error(`Product listing creation failed`, {
        productId: productData.id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Optimize listing for marketplace
   */
  async optimizeForMarketplace(listingId, marketplace = 'amazon') {
    try {
      const listing = this.listingImages.get(listingId);
      if (!listing) throw new Error('Listing not found');

      const marketplaceConfigs = {
        amazon: {
          primaryImageSize: '1600x1600',
          maxImages: 10,
          imageFormats: ['jpg', 'jpeg'],
          compressionQuality: 85,
          backgroundColor: 'white',
        },
        flipkart: {
          primaryImageSize: '1024x1024',
          maxImages: 8,
          imageFormats: ['jpg'],
          compressionQuality: 80,
          backgroundColor: 'white',
        },
        local_marketplace: {
          primaryImageSize: '800x800',
          maxImages: 5,
          imageFormats: ['jpg', 'png'],
          compressionQuality: 75,
          backgroundColor: 'transparent',
        },
      };

      const config = marketplaceConfigs[marketplace] || marketplaceConfigs.amazon;

      const optimized = {
        listingId,
        marketplace,
        primaryImage: {
          ...listing.primaryImage,
          optimizedSize: config.primaryImageSize,
          compressionQuality: config.compressionQuality,
          format: 'jpg',
        },
        variantImages: listing.variantImages.slice(0, config.maxImages - 1),
        configuration: config,
        seoMetadata: listing.seoMetadata,
        optimizedAt: new Date().toISOString(),
      };

      logger.info(`Listing optimized for ${marketplace}`, {
        listingId,
        imageCount: optimized.variantImages.length + 1,
      });

      this.trackListingPerformance(listingId, {
        optimization: marketplace,
      });

      return optimized;

    } catch (error) {
      logger.error(`Marketplace optimization failed`, {
        listingId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Sync images with inventory system
   */
  async syncWithInventory(productId, inventory) {
    try {
      const listing = this.productCatalog.get(productId);
      if (!listing) throw new Error('Product not found');

      logger.info(`Syncing images with inventory`, {
        productId,
        stockLevel: inventory.quantity,
      });

      // Update inventory status
      listing.inventory = {
        quantity: inventory.quantity,
        status: inventory.quantity > 0 ? 'in-stock' : 'out-of-stock',
        lastSyncedAt: new Date().toISOString(),
      };

      // Update visibility based on stock
      if (inventory.quantity === 0) {
        listing.visibility.marketplace = false;
      } else {
        listing.visibility.marketplace = true;
      }

      listing.lastUpdated = new Date().toISOString();

      return listing;

    } catch (error) {
      logger.error(`Inventory sync failed`, {
        productId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Generate bulk SKU images for variants
   */
  async generateSKUImages(parentProductId, skuData) {
    try {
      logger.info(`Generating SKU images`, {
        productId: parentProductId,
        skuCount: skuData.length,
      });

      const results = [];
      for (const sku of skuData) {
        const image = await aiImageGenerationEnhancedService.generateProductImage(
          {
            ...sku,
            id: `${parentProductId}-${sku.sku}`,
          },
          'global-export'
        );

        this.variantImages.set(sku.sku, image);
        results.push({
          sku: sku.sku,
          image,
          qualityScore: image.qualityScore.overallScore,
        });

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      logger.info(`SKU images generated`, {
        total: results.length,
        successful: results.filter(r => !r.image.isFallback).length,
      });

      return results;

    } catch (error) {
      logger.error(`SKU image generation failed`, {
        productId: parentProductId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Track performance metrics
   */
  trackListingPerformance(listingId, metrics) {
    if (!this.performanceMetrics.has(listingId)) {
      this.performanceMetrics.set(listingId, {
        views: 0,
        clicks: 0,
        conversions: 0,
        cartAdds: 0,
        avgTimeOnListing: 0,
        imageDownloads: 0,
      });
    }

    const current = this.performanceMetrics.get(listingId);
    this.performanceMetrics.set(listingId, {
      ...current,
      ...metrics,
      lastTracked: new Date().toISOString(),
    });
  }

  /**
   * Get performance analytics
   */
  getPerformanceAnalytics(listingId) {
    const metrics = this.performanceMetrics.get(listingId);
    if (!metrics) return null;

    const conversionRate = metrics.clicks > 0 ? ((metrics.conversions / metrics.clicks) * 100) : 0;
    const cartConversionRate = metrics.views > 0 ? ((metrics.cartAdds / metrics.views) * 100) : 0;

    return {
      listingId,
      ...metrics,
      conversionRate: conversionRate.toFixed(2),
      cartConversionRate: cartConversionRate.toFixed(2),
    };
  }

  /**
   * Bulk update marketplace listings
   */
  async bulkUpdateListings(listings, options = {}) {
    logger.info(`Bulk updating listings`, {
      count: listings.length,
      region: options.region,
    });

    const results = [];
    for (const listing of listings) {
      try {
        const created = await this.createProductListing(listing, options);
        results.push({
          productId: listing.id,
          status: 'success',
          listingId: created.listingId,
        });
      } catch (error) {
        results.push({
          productId: listing.id,
          status: 'failed',
          error: error.message,
        });
      }
    }

    return {
      total: listings.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length,
      results,
    };
  }

  /**
   * Get listing by ID
   */
  getListing(listingId) {
    return this.listingImages.get(listingId) || null;
  }

  /**
   * Get product catalog
   */
  getCatalog(options = {}) {
    let catalog = Array.from(this.productCatalog.values());

    if (options.category) {
      catalog = catalog.filter(item => item.category === options.category);
    }

    if (options.minQualityScore) {
      catalog = catalog.filter(item => item.qualityScore.overallScore >= options.minQualityScore);
    }

    if (options.region) {
      catalog = catalog.filter(item => item.region === options.region);
    }

    return {
      total: catalog.length,
      items: catalog,
    };
  }

  /**
   * Analytics dashboard data
   */
  getDashboardAnalytics() {
    const allListings = Array.from(this.listingImages.values());
    const allMetrics = Array.from(this.performanceMetrics.values());

    const avgQualityScore = allListings.length > 0
      ? Math.round(
          allListings.reduce((sum, l) => sum + l.qualityScore.overallScore, 0) / allListings.length
        )
      : 0;

    const totalViews = allMetrics.reduce((sum, m) => sum + m.views, 0);
    const totalConversions = allMetrics.reduce((sum, m) => sum + m.conversions, 0);
    const overallConversionRate = totalViews > 0 ? ((totalConversions / totalViews) * 100).toFixed(2) : 0;

    return {
      listings: {
        total: allListings.length,
        avgQualityScore,
        byRegion: this.groupBy(allListings, 'region'),
      },
      performance: {
        totalViews,
        totalConversions,
        overallConversionRate,
        avgCartConversion: this.calculateAvgMetric(allMetrics, 'cartConversionRate'),
      },
      images: {
        totalGenerated: allListings.length,
        failureRate: this.calculateFailureRate(allListings),
      },
    };
  }

  groupBy(arr, key) {
    return arr.reduce((result, item) => {
      const value = item[key];
      result[value] = (result[value] || 0) + 1;
      return result;
    }, {});
  }

  calculateAvgMetric(arr, key) {
    if (arr.length === 0) return 0;
    return (arr.reduce((sum, item) => sum + (item[key] || 0), 0) / arr.length).toFixed(2);
  }

  calculateFailureRate(listings) {
    const failed = listings.filter(l => l.variantImages.some(v => v.isFallback)).length;
    return ((failed / listings.length) * 100).toFixed(2);
  }
}

module.exports = new EcommerceImageIntegrationService();
