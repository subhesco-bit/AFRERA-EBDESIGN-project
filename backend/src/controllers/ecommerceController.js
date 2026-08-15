/**
 * AFRERA E-Commerce Controller
 * 
 * Handles all e-commerce API endpoints with comprehensive validation,
 * authentication, and error handling.
 */

const ecommerceService = require('../services/ecommerceService');
const { logger } = require('../utils/logger');
const { validateBody } = require('../middleware/inputValidation');

// ============================================================================
// PRODUCT LISTING ENDPOINTS
// ============================================================================

/**
 * POST /api/ecommerce/listings
 * Create a new product listing with AI optimization
 */
async function createListing(req, res) {
  try {
    const sellerId = req.user.id;
    const listingData = req.body;
    
    // Validate required fields
    const requiredFields = ['product_name', 'category_id', 'quantity', 'unit', 'base_price', 'harvest_date'];
    for (const field of requiredFields) {
      if (!listingData[field]) {
        return res.status(400).json({
          success: false,
          error: `Missing required field: ${field}`
        });
      }
    }
    
    const result = await ecommerceService.createProductListing(sellerId, listingData);
    
    res.status(201).json(result);
  } catch (error) {
    logger.error('Error in createListing controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create listing'
    });
  }
}

/**
 * GET /api/ecommerce/listings
 * Get marketplace listings with AI-powered ranking
 */
async function getListings(req, res) {
  try {
    const filters = {
      category_id: req.query.category_id,
      state_id: req.query.state_id,
      gi_tagged: req.query.gi_tagged === 'true',
      organic: req.query.organic === 'true',
      search: req.query.search,
      min_price: req.query.min_price ? parseFloat(req.query.min_price) : null,
      max_price: req.query.max_price ? parseFloat(req.query.max_price) : null,
      seller_id: req.query.seller_id,
      quality_min: req.query.quality_min ? parseFloat(req.query.quality_min) : null
    };
    
    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 24,
      sort_by: req.query.sort_by || 'relevance',
      sort_order: req.query.sort_order || 'DESC'
    };
    
    const result = await ecommerceService.getMarketplaceListings(filters, pagination);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in getListings controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get listings'
    });
  }
}

/**
 * GET /api/ecommerce/listings/:id
 * Get single listing details
 */
async function getListing(req, res) {
  try {
    const { id } = req.params;
    const pg = require('../database/connection').getPostgreSQL();
    
    const result = await pg.query(`
      SELECT 
        pl.*,
        c.name as category_name,
        s.name as state_name,
        u.symbol as unit_symbol,
        a.city,
        a.district,
        a.state,
        u_data.full_name as seller_name,
        u_data.rating as seller_rating,
        u_data.phone as seller_phone,
        COALESCE(AVG(pr.rating), 0) as avg_rating,
        COUNT(pr.id) as review_count
      FROM product_listings pl
      LEFT JOIN categories c ON pl.category_id = c.id
      LEFT JOIN states s ON pl.state_id = s.id
      LEFT JOIN units u ON pl.unit_id = u.id
      LEFT JOIN addresses a ON pl.location_id = a.id
      LEFT JOIN users u_data ON pl.seller_id = u_data.id
      LEFT JOIN product_reviews pr ON pl.id = pr.product_id
      WHERE pl.id = $1
      GROUP BY pl.id, c.name, s.name, u.symbol, a.city, a.district, a.state, u_data.full_name, u_data.rating, u_data.phone
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }
    
    res.json({
      success: true,
      listing: result.rows[0]
    });
  } catch (error) {
    logger.error('Error in getListing controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get listing'
    });
  }
}

/**
 * PUT /api/ecommerce/listings/:id
 * Update listing (seller only)
 */
async function updateListing(req, res) {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;
    const updates = req.body;
    
    const pg = require('../database/connection').getPostgreSQL();
    
    // Verify ownership
    const ownership = await pg.query(
      'SELECT seller_id FROM product_listings WHERE id = $1',
      [id]
    );
    
    if (ownership.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }
    
    if (ownership.rows[0].seller_id !== sellerId) {
      return res.status(403).json({
        success: false,
        error: 'You do not own this listing'
      });
    }
    
    // Build update query
    const allowedFields = ['product_name', 'description', 'quantity', 'base_price', 'harvest_date', 'images'];
    const updateFields = [];
    const values = [];
    let paramCount = 0;
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        paramCount++;
        updateFields.push(`${field} = $${paramCount}`);
        values.push(updates[field]);
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }
    
    paramCount++;
    values.push(id);
    
    const query = `
      UPDATE product_listings
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await pg.query(query, values);
    
    res.json({
      success: true,
      listing: result.rows[0]
    });
  } catch (error) {
    logger.error('Error in updateListing controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update listing'
    });
  }
}

/**
 * DELETE /api/ecommerce/listings/:id
 * Delete listing (seller only)
 */
async function deleteListing(req, res) {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;
    
    const pg = require('../database/connection').getPostgreSQL();
    
    // Verify ownership
    const ownership = await pg.query(
      'SELECT seller_id FROM product_listings WHERE id = $1',
      [id]
    );
    
    if (ownership.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }
    
    if (ownership.rows[0].seller_id !== sellerId) {
      return res.status(403).json({
        success: false,
        error: 'You do not own this listing'
      });
    }
    
    await pg.query(
      'UPDATE product_listings SET listing_status = $1, updated_at = NOW() WHERE id = $2',
      ['deleted', id]
    );
    
    res.json({
      success: true,
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    logger.error('Error in deleteListing controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete listing'
    });
  }
}

// ============================================================================
// SELLER ANALYTICS ENDPOINTS
// ============================================================================

/**
 * GET /api/ecommerce/seller/analytics
 * Get seller dashboard analytics
 */
async function getSellerAnalytics(req, res) {
  try {
    const sellerId = req.user.id;
    const period = req.query.period || '30d';
    
    const result = await ecommerceService.getSellerAnalytics(sellerId, period);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in getSellerAnalytics controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get analytics'
    });
  }
}

/**
 * GET /api/ecommerce/seller/listings
 * Get seller's own listings
 */
async function getSellerListings(req, res) {
  try {
    const sellerId = req.user.id;
    const pg = require('../database/connection').getPostgreSQL();
    
    const result = await pg.query(`
      SELECT 
        pl.*,
        c.name as category_name,
        COUNT(oi.id) as total_sold,
        SUM(oi.quantity) as total_quantity_sold
      FROM product_listings pl
      LEFT JOIN categories c ON pl.category_id = c.id
      LEFT JOIN order_items oi ON pl.id = oi.product_id
      WHERE pl.seller_id = $1
      GROUP BY pl.id, c.name
      ORDER BY pl.created_at DESC
    `, [sellerId]);
    
    res.json({
      success: true,
      listings: result.rows
    });
  } catch (error) {
    logger.error('Error in getSellerListings controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get seller listings'
    });
  }
}

// ============================================================================
// GI MARKETPLACE ENDPOINTS
// ============================================================================

/**
 * GET /api/ecommerce/gi-listings
 * Get GI marketplace listings
 */
async function getGIListings(req, res) {
  try {
    const filters = {
      state: req.query.state,
      gi_product_id: req.query.gi_product_id
    };
    
    const result = await ecommerceService.getGIListings(filters);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in getGIListings controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get GI listings'
    });
  }
}

// ============================================================================
// MARKET INTELLIGENCE ENDPOINTS
// ============================================================================

/**
 * GET /api/ecommerce/market/price-trends/:categoryId
 * Get market price trends for category
 */
async function getPriceTrends(req, res) {
  try {
    const { categoryId } = req.params;
    const period = req.query.period || '30d';
    
    const result = await ecommerceService.getMarketPriceTrends(categoryId, period);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in getPriceTrends controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get price trends'
    });
  }
}

/**
 * GET /api/ecommerce/market/demand/:categoryId
 * Get market demand analysis
 */
async function getDemandAnalysis(req, res) {
  try {
    const { categoryId } = req.params;
    
    const result = await ecommerceService.getMarketDemandAnalysis(categoryId);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in getDemandAnalysis controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get demand analysis'
    });
  }
}

/**
 * POST /api/ecommerce/price-recommendation
 * Get AI price recommendation for a product
 */
async function getPriceRecommendation(req, res) {
  try {
    const listingData = req.body;
    
    const result = await ecommerceService.getAIPriceRecommendation(listingData);
    
    res.json({
      success: true,
      recommendation: result
    });
  } catch (error) {
    logger.error('Error in getPriceRecommendation controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get price recommendation'
    });
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Product Listings
  createListing,
  getListings,
  getListing,
  updateListing,
  deleteListing,
  
  // Seller Analytics
  getSellerAnalytics,
  getSellerListings,
  
  // GI Marketplace
  getGIListings,
  
  // Market Intelligence
  getPriceTrends,
  getDemandAnalysis,
  getPriceRecommendation
};
