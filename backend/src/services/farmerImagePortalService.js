/**
 * Farmer Image Portal Service
 * Enables farmers to:
 * - Generate product images for their varieties
 * - Manage image portfolio
 * - Track image performance on marketplace
 * - Export images to multiple platforms
 * - Get quality feedback and suggestions
 */

const { logger } = require('../utils/logger');
const aiImageGenerationEnhancedService = require('./aiImageGenerationEnhancedService');
const ecommerceImageIntegrationService = require('./ecommerceImageIntegrationService');
const crypto = require('crypto');

class FarmerImagePortalService {
  constructor() {
    this.farmerPortfolios = new Map();
    this.imageApprovals = new Map();
    this.farmerFeedback = new Map();
  }

  /**
   * Create farmer image portfolio
   */
  async createFarmerPortfolio(farmerId, farmerData) {
    try {
      logger.info(`Creating farmer image portfolio`, {
        farmerId,
        farmerName: farmerData.name,
      });

      const portfolio = {
        portfolioId: crypto.randomUUID(),
        farmerId,
        farmerName: farmerData.name,
        region: farmerData.region || 'northeast-india',
        languages: farmerData.languages || ['en', 'hi'],
        products: [],
        imageStats: {
          total: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.farmerPortfolios.set(farmerId, portfolio);

      logger.info(`Farmer portfolio created`, {
        farmerId,
        portfolioId: portfolio.portfolioId,
      });

      return portfolio;

    } catch (error) {
      logger.error(`Portfolio creation failed`, {
        farmerId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Upload farmer product for image generation
   */
  async uploadFarmerProduct(farmerId, productData) {
    try {
      const portfolio = this.farmerPortfolios.get(farmerId);
      if (!portfolio) throw new Error('Portfolio not found');

      logger.info(`Adding product to farmer portfolio`, {
        farmerId,
        productName: productData.name,
      });

      const product = {
        productId: crypto.randomUUID(),
        name: productData.name,
        category: productData.category,
        description: productData.description,
        quantity: productData.quantity,
        pricePerUnit: productData.pricePerUnit,
        images: [],
        status: 'pending-images',
        uploadedAt: new Date().toISOString(),
      };

      portfolio.products.push(product);
      portfolio.updatedAt = new Date().toISOString();
      this.farmerPortfolios.set(farmerId, portfolio);

      return product;

    } catch (error) {
      logger.error(`Product upload failed`, {
        farmerId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Generate images for farmer products
   */
  async generateFarmerProductImages(farmerId, productId, options = {}) {
    try {
      const portfolio = this.farmerPortfolios.get(farmerId);
      if (!portfolio) throw new Error('Portfolio not found');

      const product = portfolio.products.find(p => p.productId === productId);
      if (!product) throw new Error('Product not found');

      logger.info(`Generating images for farmer product`, {
        farmerId,
        productId,
        productName: product.name,
      });

      // Generate images in farmer's preferred languages
      const languages = options.languages || portfolio.languages;
      const region = options.region || portfolio.region;

      const generatedImages = [];

      for (const language of languages) {
        const image = await aiImageGenerationEnhancedService.generateProductImage(
          {
            id: `${farmerId}-${productId}`,
            ...product,
          },
          region,
          language,
          { seoKeywords: options.seoKeywords }
        );

        generatedImages.push({
          imageId: image.imageId,
          language,
          region,
          qualityScore: image.qualityScore.overallScore,
          url: image.url,
          status: 'pending-review',
          generatedAt: new Date().toISOString(),
        });
      }

      // Update product
      product.images = generatedImages;
      product.status = 'pending-review';
      product.updatedAt = new Date().toISOString();

      // Update portfolio stats
      portfolio.imageStats.total += generatedImages.length;
      portfolio.imageStats.pending += generatedImages.length;
      portfolio.updatedAt = new Date().toISOString();

      this.farmerPortfolios.set(farmerId, portfolio);

      logger.info(`Images generated for farmer product`, {
        farmerId,
        productId,
        imageCount: generatedImages.length,
        avgQuality: Math.round(
          generatedImages.reduce((sum, img) => sum + img.qualityScore, 0) / generatedImages.length
        ),
      });

      return {
        productId,
        images: generatedImages,
        nextStep: 'review-and-approve',
      };

    } catch (error) {
      logger.error(`Image generation failed for farmer`, {
        farmerId,
        productId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Review and approve farmer images (by farmer or admin)
   */
  async approveImages(farmerId, productId, imageIds, approvalData = {}) {
    try {
      const portfolio = this.farmerPortfolios.get(farmerId);
      if (!portfolio) throw new Error('Portfolio not found');

      const product = portfolio.products.find(p => p.productId === productId);
      if (!product) throw new Error('Product not found');

      logger.info(`Approving farmer images`, {
        farmerId,
        productId,
        imageCount: imageIds.length,
      });

      const approved = [];
      for (const imageId of imageIds) {
        const image = product.images.find(img => img.imageId === imageId);
        if (image) {
          image.status = 'approved';
          image.approvedAt = new Date().toISOString();
          image.approvalNotes = approvalData.notes;
          approved.push(image);

          // Record approval
          this.imageApprovals.set(imageId, {
            imageId,
            farmerId,
            productId,
            status: 'approved',
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Update stats
      portfolio.imageStats.approved += approved.length;
      portfolio.imageStats.pending -= approved.length;
      portfolio.updatedAt = new Date().toISOString();

      this.farmerPortfolios.set(farmerId, portfolio);

      return {
        approved: approved.length,
        images: approved,
        readyForMarketplace: true,
      };

    } catch (error) {
      logger.error(`Image approval failed`, {
        farmerId,
        productId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Publish farmer product to marketplace
   */
  async publishToMarketplace(farmerId, productId, marketplaceConfig = {}) {
    try {
      const portfolio = this.farmerPortfolios.get(farmerId);
      if (!portfolio) throw new Error('Portfolio not found');

      const product = portfolio.products.find(p => p.productId === productId);
      if (!product) throw new Error('Product not found');

      const approvedImages = product.images.filter(img => img.status === 'approved');
      if (approvedImages.length === 0) {
        throw new Error('No approved images available for marketplace');
      }

      logger.info(`Publishing farmer product to marketplace`, {
        farmerId,
        productId,
        imageCount: approvedImages.length,
      });

      // Create marketplace listing using e-commerce service
      const listing = await ecommerceImageIntegrationService.createProductListing(
        {
          id: `${farmerId}-${productId}`,
          name: product.name,
          category: product.category,
          description: product.description,
          variants: product.images.map(img => ({
            sku: `${productId}-${img.language}`,
            language: img.language,
            name: `${product.name} (${img.language})`,
          })),
          color_profile: marketplaceConfig.colorProfile,
          size_range: marketplaceConfig.sizeRange,
          certified: marketplaceConfig.certified,
          gi_tag: marketplaceConfig.giTag,
        },
        {
          region: portfolio.region,
          language: portfolio.languages[0],
          pricing: {
            basePrice: product.pricePerUnit,
            currency: marketplaceConfig.currency || 'INR',
          },
          inventory: {
            quantity: product.quantity,
            status: 'in-stock',
          },
        }
      );

      // Update product status
      product.status = 'published';
      product.marketplaceListingId = listing.listingId;
      product.publishedAt = new Date().toISOString();

      this.farmerPortfolios.set(farmerId, portfolio);

      logger.info(`Farmer product published`, {
        farmerId,
        productId,
        listingId: listing.listingId,
      });

      return {
        success: true,
        listing,
        viewUrl: `${process.env.MARKETPLACE_URL}/product/${listing.listingId}`,
      };

    } catch (error) {
      logger.error(`Marketplace publication failed`, {
        farmerId,
        productId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get marketplace performance for farmer products
   */
  async getMarketplacePerformance(farmerId) {
    try {
      const portfolio = this.farmerPortfolios.get(farmerId);
      if (!portfolio) throw new Error('Portfolio not found');

      logger.info(`Fetching marketplace performance`, { farmerId });

      const performance = {
        farmerId,
        totalProducts: portfolio.products.length,
        publishedProducts: portfolio.products.filter(p => p.status === 'published').length,
        products: [],
      };

      for (const product of portfolio.products) {
        if (product.marketplaceListingId) {
          const metrics = ecommerceImageIntegrationService.getPerformanceAnalytics(
            product.marketplaceListingId
          );

          performance.products.push({
            productId: product.productId,
            productName: product.name,
            listingId: product.marketplaceListingId,
            metrics,
            imageQualityScores: product.images.map(img => ({
              language: img.language,
              score: img.qualityScore,
            })),
          });
        }
      }

      return performance;

    } catch (error) {
      logger.error(`Performance fetch failed`, {
        farmerId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get farmer dashboard data
   */
  async getFarmerDashboard(farmerId) {
    try {
      const portfolio = this.farmerPortfolios.get(farmerId);
      if (!portfolio) throw new Error('Portfolio not found');

      const totalImages = portfolio.imageStats.total;
      const approvedImages = portfolio.imageStats.approved;

      return {
        portfolio,
        imageStats: {
          ...portfolio.imageStats,
          completionRate: totalImages > 0 ? ((approvedImages / totalImages) * 100).toFixed(1) : 0,
        },
        products: portfolio.products.map(p => ({
          id: p.productId,
          name: p.name,
          category: p.category,
          quantity: p.quantity,
          price: p.pricePerUnit,
          status: p.status,
          images: p.images.length,
          approvedImages: p.images.filter(img => img.status === 'approved').length,
          avgQuality: Math.round(
            p.images.reduce((sum, img) => sum + img.qualityScore, 0) / (p.images.length || 1)
          ),
          publishedAt: p.publishedAt,
          viewUrl: p.marketplaceListingId
            ? `${process.env.MARKETPLACE_URL}/product/${p.marketplaceListingId}`
            : null,
        })),
        recentActivity: portfolio.updatedAt,
      };

    } catch (error) {
      logger.error(`Dashboard fetch failed`, {
        farmerId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Provide quality feedback on images
   */
  addQualityFeedback(imageId, feedback) {
    this.farmerFeedback.set(imageId, {
      imageId,
      feedback,
      suggestions: feedback.suggestions || [],
      improvementAreas: feedback.improvementAreas || [],
      timestamp: new Date().toISOString(),
    });

    logger.info(`Quality feedback added`, {
      imageId,
      rating: feedback.rating,
    });

    return this.farmerFeedback.get(imageId);
  }

  /**
   * Export farmer images for offline use
   */
  async exportImages(farmerId, productIds = null, format = 'zip') {
    try {
      const portfolio = this.farmerPortfolios.get(farmerId);
      if (!portfolio) throw new Error('Portfolio not found');

      const products = productIds
        ? portfolio.products.filter(p => productIds.includes(p.productId))
        : portfolio.products;

      const exportData = {
        exportId: crypto.randomUUID(),
        farmerId,
        timestamp: new Date().toISOString(),
        products: products.map(p => ({
          name: p.name,
          category: p.category,
          images: p.images.filter(img => img.status === 'approved').map(img => ({
            language: img.language,
            url: img.url,
            quality: img.qualityScore,
          })),
        })),
        downloadUrl: `/api/farmer/exports/${crypto.randomUUID()}.${format}`,
      };

      logger.info(`Images exported`, {
        farmerId,
        exportId: exportData.exportId,
        format,
      });

      return exportData;

    } catch (error) {
      logger.error(`Export failed`, {
        farmerId,
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = new FarmerImagePortalService();
