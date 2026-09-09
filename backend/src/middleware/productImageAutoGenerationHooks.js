/**
 * Product Image Auto-Generation Hooks
 * Integrates auto-generation into product lifecycle events
 */

const { logger } = require('../utils/logger');
const productImageAutoGenerationService = require('../services/productImageAutoGenerationService');

/**
 * Hook: Product Created
 * Automatically queue images when product is added to system
 */
const onProductCreatedHook = async (productData) => {
  try {
    await productImageAutoGenerationService.onProductCreated(productData);
  } catch (error) {
    logger.error('Product creation hook failed', { error: error.message });
  }
};

/**
 * Hook: Product Updated
 * Regenerate images if key fields changed
 */
const onProductUpdatedHook = async (oldData, newData) => {
  try {
    // Check if description or other image-relevant fields changed
    const fieldsToCheck = ['name', 'description', 'category', 'color_profile', 'size_range'];
    const changed = fieldsToCheck.some(field => oldData[field] !== newData[field]);

    if (changed) {
      logger.info('Product updated - relevant fields changed, queuing for regeneration', {
        productId: newData.id,
      });

      await productImageAutoGenerationService.onProductCreated(newData);
    }
  } catch (error) {
    logger.error('Product update hook failed', { error: error.message });
  }
};

/**
 * Hook: Inventory Updated
 * Regenerate showcase images if stock is low
 */
const onInventoryUpdatedHook = async (productId, inventory) => {
  try {
    await productImageAutoGenerationService.onInventoryUpdated(productId, inventory);
  } catch (error) {
    logger.error('Inventory update hook failed', { error: error.message });
  }
};

/**
 * Middleware: Auto-generate on product page view
 * Checks if product has images before displaying
 */
const autoGenerateOnPageViewMiddleware = async (req, res, next) => {
  try {
    // Only apply to product detail page requests
    if (!req.path.includes('/product') && !req.path.includes('/detail')) {
      return next();
    }

    const productId = req.params.productId || req.query.id;
    if (!productId) {
      return next();
    }

    // Check if auto-generation is enabled for page views
    if (!process.env.AUTO_GENERATE_ON_PAGE_VIEW) {
      return next();
    }

    // Queue image generation asynchronously (don't block page load)
    const pageContext = {
      region: req.query.region || process.env.DEFAULT_REGION,
      languages: (req.query.languages || process.env.DEFAULT_LANGUAGES || 'en,hi').split(','),
      userAgent: req.get('user-agent'),
      ipAddress: req.ip,
    };

    // Fire and forget - don't await
    productImageAutoGenerationService.onProductPageView(productId, pageContext);

    next();
  } catch (error) {
    logger.error('Page view auto-generation middleware error', { error: error.message });
    next(); // Don't block page load
  }
};

/**
 * Middleware: Attach product data to auto-gen queue
 * Used in product creation endpoints
 */
const captureProductDataMiddleware = async (req, res, next) => {
  try {
    // Capture product data for auto-generation
    if (req.method === 'POST' && (req.path.includes('/products') || req.path.includes('/create'))) {
      req.productDataForAutoGen = req.body;
    }

    next();
  } catch (error) {
    logger.error('Product data capture middleware error', { error: error.message });
    next();
  }
};

/**
 * Middleware: Trigger auto-gen after product creation
 * Should be called after successful product creation response
 */
const triggerAutoGenAfterCreateMiddleware = async (req, res, next) => {
  try {
    // Hook into response to trigger after successful creation
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      // Check if response indicates successful creation
      if (res.statusCode >= 200 && res.statusCode < 300 && data.success && data.product) {
        // Trigger auto-generation
        const productData = {
          id: data.product.id,
          name: data.product.name,
          category: data.product.category,
          description: data.product.description,
          color_profile: data.product.color_profile,
          size_range: data.product.size_range,
          certified: data.product.certified,
          gi_tag: data.product.gi_tag,
        };

        // Fire and forget
        productImageAutoGenerationService.onProductCreated(productData);
      }

      return originalJson(data);
    };

    next();
  } catch (error) {
    logger.error('Auto-gen trigger middleware error', { error: error.message });
    next();
  }
};

/**
 * Register hooks with product service
 * Call this during app initialization
 */
const registerAutoGenerationHooks = (productService) => {
  try {
    // Register event listeners
    if (productService && typeof productService.on === 'function') {
      productService.on('created', onProductCreatedHook);
      productService.on('updated', onProductUpdatedHook);
      productService.on('inventoryUpdated', onInventoryUpdatedHook);

      logger.info('Auto-generation hooks registered with product service');
    }
  } catch (error) {
    logger.error('Failed to register auto-generation hooks', {
      error: error.message,
    });
  }
};

module.exports = {
  onProductCreatedHook,
  onProductUpdatedHook,
  onInventoryUpdatedHook,
  autoGenerateOnPageViewMiddleware,
  captureProductDataMiddleware,
  triggerAutoGenAfterCreateMiddleware,
  registerAutoGenerationHooks,
};
