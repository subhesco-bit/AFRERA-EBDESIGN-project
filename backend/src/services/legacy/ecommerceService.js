/**
 * AFRERA E-Commerce Service - International Launch Standard
 * 
 * Comprehensive marketplace engine with AI-powered capabilities:
 * - Product listing management with AI recommendations
 * - Dynamic pricing with market intelligence
 * - Order processing with smart routing
 * - Seller analytics and insights
 * - GI marketplace integration
 * - Signal bus integration for cross-module events
 * - Blockchain-ready transaction tracking
 * - Multi-language and multi-currency support
 */

const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus } = require('../../core/signalBus');

// ============================================================================
// PRODUCT LISTING MANAGEMENT
// ============================================================================

/**
 * Create product listing with AI optimization
 */
async function createProductListing(sellerId, listingData) {
  const pg = getPostgreSQL();
  
  try {
    // AI-powered price recommendation
    const priceRecommendation = await getAIPriceRecommendation(listingData);
    
    // Quality assessment
    const qualityScore = await assessProductQuality(listingData);
    
    // Market demand prediction
    const demandPrediction = await predictMarketDemand(listingData);
    
    const result = await pg.query(`
      INSERT INTO product_listings (
        seller_id,
        product_name,
        category_id,
        description,
        quantity,
        unit,
        base_price,
        ai_recommended_price,
        quality_score,
        demand_prediction,
        harvest_date,
        location_id,
        certifications,
        images,
        gi_tagged,
        organic,
        listing_status,
        visibility_score,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW())
      RETURNING *
    `, [
      sellerId,
      listingData.product_name,
      listingData.category_id,
      listingData.description,
      listingData.quantity,
      listingData.unit,
      listingData.base_price,
      priceRecommendation.recommended_price,
      qualityScore.score,
      demandPrediction.demand_level,
      listingData.harvest_date,
      listingData.location_id,
      JSON.stringify(listingData.certifications || []),
      JSON.stringify(listingData.images || []),
      listingData.gi_tagged || false,
      listingData.organic || false,
      'active',
      calculateVisibilityScore(qualityScore, demandPrediction)
    ]);
    
    const listing = result.rows[0];
    
    // Emit signal bus event
    await signalBus.emit('marketplace.listing.created', {
      listing_id: listing.id,
      seller_id: sellerId,
      product_name: listing.product_name,
      category_id: listing.category_id,
      price: listing.base_price,
      quantity: listing.quantity,
      location_id: listing.location_id,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Product listing created with AI optimization', { 
      listingId: listing.id, 
      sellerId,
      priceRecommendation,
      qualityScore 
    });
    
    return {
      success: true,
      listing,
      ai_insights: {
        price_recommendation: priceRecommendation,
        quality_score: qualityScore,
        demand_prediction: demandPrediction
      }
    };
  } catch (error) {
    logger.error('Error creating product listing', { error: error.message, sellerId });
    throw error;
  }
}

/**
 * Get marketplace listings with AI-powered ranking
 */
async function getMarketplaceListings(filters = {}, pagination = {}) {
  let pg = getPostgreSQL();
  
  try {
    const {
      category_id,
      state_id,
      gi_tagged,
      organic,
      search,
      min_price,
      max_price,
      seller_id,
      quality_min
    } = filters;
    
    const {
      page = 1,
      limit = 24,
      sort_by = 'relevance',
      sort_order = 'DESC'
    } = pagination;
    
    const offset = (page - 1) * limit;
    
    let query = `
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
        COALESCE(AVG(pr.rating), 0) as avg_rating,
        COUNT(pr.id) as review_count
      FROM product_listings pl
      LEFT JOIN categories c ON pl.category_id = c.id
      LEFT JOIN states s ON pl.state_id = s.id
      LEFT JOIN units u ON pl.unit_id = u.id
      LEFT JOIN addresses a ON pl.location_id = a.id
      LEFT JOIN users u_data ON pl.seller_id = u_data.id
      LEFT JOIN product_reviews pr ON pl.id = pr.product_id
      WHERE pl.listing_status = 'active' AND pl.quantity > 0
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (category_id) {
      paramCount++;
      query += ` AND pl.category_id = $${paramCount}`;
      params.push(category_id);
    }
    
    if (state_id) {
      paramCount++;
      query += ` AND pl.state_id = $${paramCount}`;
      params.push(state_id);
    }
    
    if (gi_tagged !== undefined) {
      paramCount++;
      query += ` AND pl.gi_tagged = $${paramCount}`;
      params.push(gi_tagged);
    }
    
    if (organic !== undefined) {
      paramCount++;
      query += ` AND pl.organic = $${paramCount}`;
      params.push(organic);
    }
    
    if (search) {
      paramCount++;
      query += ` AND (pl.product_name ILIKE $${paramCount} OR pl.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }
    
    if (min_price) {
      paramCount++;
      query += ` AND pl.base_price >= $${paramCount}`;
      params.push(min_price);
    }
    
    if (max_price) {
      paramCount++;
      query += ` AND pl.base_price <= $${paramCount}`;
      params.push(max_price);
    }
    
    if (seller_id) {
      paramCount++;
      query += ` AND pl.seller_id = $${paramCount}`;
      params.push(seller_id);
    }
    
    if (quality_min) {
      paramCount++;
      query += ` AND pl.quality_score >= $${paramCount}`;
      params.push(quality_min);
    }
    
    query += ` GROUP BY pl.id, c.name, s.name, u.symbol, a.city, a.district, a.state, u_data.full_name, u_data.rating`;
    
    // AI-powered sorting
    const sortMap = {
      'relevance': 'pl.visibility_score',
      'price_asc': 'pl.base_price',
      'price_desc': 'pl.base_price',
      'rating': 'avg_rating',
      'quality': 'pl.quality_score',
      'demand': 'pl.demand_prediction',
      'newest': 'pl.created_at'
    };
    
    const sortColumn = sortMap[sort_by] || 'pl.visibility_score';
    query += ` ORDER BY ${sortColumn} ${sort_order}`;
    
    query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);
    
    let result = await pg.query(query, params);
    
    // Get total count
    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(DISTINCT pl.id) as total FROM')
                            .replace(/GROUP BY.*/, '')
                            .replace(/ORDER BY.*/, '')
                            .replace(/LIMIT.*OFFSET.*/, '');
    const countResult = await pg.query(countQuery, params.slice(0, paramCount));
    const total = parseInt(countResult.rows[0].total);
    
    return {
      success: true,
      products: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error getting marketplace listings', { error: error.message });
    throw error;
  }
}

// ============================================================================
// AI-POWERED PRICING & RECOMMENDATIONS
// ============================================================================

/**
 * Get AI price recommendation based on market data
 */
async function getAIPriceRecommendation(listingData) {
  let pg = getPostgreSQL();
  
  try {
    // Get historical prices for similar products
    const historicalPrices = await pg.query(`
      SELECT base_price, quantity, quality_score, demand_prediction
      FROM product_listings
      WHERE category_id = $1
        AND listing_status = 'sold'
        AND created_at > NOW() - INTERVAL '90 days'
      ORDER BY created_at DESC
      LIMIT 50
    `, [listingData.category_id]);
    
    if (historicalPrices.rows.length === 0) {
      return {
        recommended_price: listingData.base_price,
        confidence: 0.5,
        reasoning: 'No historical data available'
      };
    }
    
    // Calculate price statistics
    const prices = historicalPrices.rows.map(r => parseFloat(r.base_price));
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    // AI price optimization logic
    let recommendedPrice = avgPrice;
    
    // Adjust based on quality
    if (listingData.quality_score > 0.8) {
      recommendedPrice *= 1.15; // Premium for high quality
    } else if (listingData.quality_score < 0.5) {
      recommendedPrice *= 0.9; // Discount for lower quality
    }
    
    // Adjust based on demand
    if (listingData.demand_prediction === 'high') {
      recommendedPrice *= 1.1; // Premium for high demand
    } else if (listingData.demand_prediction === 'low') {
      recommendedPrice *= 0.95; // Discount for low demand
    }
    
    // Adjust based on GI tag
    if (listingData.gi_tagged) {
      recommendedPrice *= 1.2; // GI premium
    }
    
    // Adjust based on organic
    if (listingData.organic) {
      recommendedPrice *= 1.15; // Organic premium
    }
    
    // Ensure price is within reasonable bounds
    recommendedPrice = Math.max(minPrice * 0.8, Math.min(maxPrice * 1.2, recommendedPrice));
    
    return {
      recommended_price: Math.round(recommendedPrice * 100) / 100,
      confidence: 0.85,
      reasoning: 'Based on historical prices, quality, demand, and certifications',
      market_data: {
        average_price: Math.round(avgPrice * 100) / 100,
        min_price: minPrice,
        max_price: maxPrice,
        sample_size: prices.length
      }
    };
  } catch (error) {
    logger.error('Error getting AI price recommendation', { error: error.message });
    return {
      recommended_price: listingData.base_price,
      confidence: 0.3,
      reasoning: 'Error in price analysis'
    };
  }
}

/**
 * Assess product quality based on provided data
 */
async function assessProductQuality(listingData) {
  let score = 0.5; // Base score
  const factors = [];
  
  // Certification quality
  if (listingData.certifications && listingData.certifications.length > 0) {
    const certScore = Math.min(0.2, listingData.certifications.length * 0.05);
    score += certScore;
    factors.push({ factor: 'certifications', score: certScore });
  }
  
  // GI tag adds quality
  if (listingData.gi_tagged) {
    score += 0.15;
    factors.push({ factor: 'gi_tagged', score: 0.15 });
  }
  
  // Organic adds quality
  if (listingData.organic) {
    score += 0.1;
    factors.push({ factor: 'organic', score: 0.1 });
  }
  
  // Description quality
  if (listingData.description && listingData.description.length > 50) {
    score += 0.05;
    factors.push({ factor: 'description_quality', score: 0.05 });
  }
  
  // Image quality
  if (listingData.images && listingData.images.length >= 3) {
    score += 0.1;
    factors.push({ factor: 'image_quality', score: 0.1 });
  }
  
  // Cap at 1.0
  score = Math.min(1.0, score);
  
  return {
    score: Math.round(score * 100) / 100,
    level: score >= 0.8 ? 'high' : score >= 0.5 ? 'medium' : 'low',
    factors
  };
}

/**
 * Predict market demand for product
 */
async function predictMarketDemand(listingData) {
  let pg = getPostgreSQL();
  
  try {
    // Get seasonal demand patterns
    const seasonalData = await pg.query(`
      SELECT 
        EXTRACT(MONTH FROM created_at) as month,
        COUNT(*) as listings,
        AVG(quantity) as avg_quantity
      FROM product_listings
      WHERE category_id = $1
        AND created_at > NOW() - INTERVAL '12 months'
      GROUP BY EXTRACT(MONTH FROM created_at)
      ORDER BY month
    `, [listingData.category_id]);
    
    const currentMonth = new Date().getMonth() + 1;
    const monthData = seasonalData.rows.find(r => parseInt(r.month) === currentMonth);
    
    let demandLevel = 'medium';
    let confidence = 0.6;
    
    if (monthData && monthData.avg_quantity > 100) {
      demandLevel = 'high';
      confidence = 0.8;
    } else if (monthData && monthData.avg_quantity < 20) {
      demandLevel = 'low';
      confidence = 0.7;
    }
    
    return {
      demand_level: demandLevel,
      confidence,
      seasonal_data: monthData || null
    };
  } catch (error) {
    logger.error('Error predicting market demand', { error: error.message });
    return {
      demand_level: 'medium',
      confidence: 0.4,
      seasonal_data: null
    };
  }
}

/**
 * Calculate visibility score for listing ranking
 */
function calculateVisibilityScore(qualityScore, demandPrediction) {
  let score = 0.5;
  
  score += qualityScore.score * 0.3;
  
  if (demandPrediction.demand_level === 'high') {
    score += 0.2;
  } else if (demandPrediction.demand_level === 'low') {
    score -= 0.1;
  }
  
  return Math.min(1.0, Math.max(0.0, score));
}

// ============================================================================
// SELLER ANALYTICS & INSIGHTS
// ============================================================================

/**
 * Get seller dashboard analytics
 */
async function getSellerAnalytics(sellerId, period = '30d') {
  let pg = getPostgreSQL();
  
  try {
    const periodMap = {
      '7d': '7 days',
      '30d': '30 days',
      '90d': '90 days',
      '1y': '1 year'
    };
    
    const periodFilter = periodMap[period] || '30 days';
    
    // Get listing statistics
    const listingStats = await pg.query(`
      SELECT 
        COUNT(*) as total_listings,
        COUNT(*) FILTER (WHERE listing_status = 'active') as active_listings,
        COUNT(*) FILTER (WHERE listing_status = 'sold') as sold_listings,
        AVG(base_price) as avg_price,
        SUM(quantity) as total_quantity,
        AVG(quality_score) as avg_quality_score
      FROM product_listings
      WHERE seller_id = $1
        AND created_at > NOW() - INTERVAL '${periodFilter}'
    `, [sellerId]);
    
    // Get sales revenue
    const salesData = await pg.query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(oi.quantity * oi.unit_price) as total_revenue,
        AVG(oi.quantity * oi.unit_price) as avg_order_value
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN product_listings pl ON oi.product_id = pl.id
      WHERE pl.seller_id = $1
        AND o.created_at > NOW() - INTERVAL '${periodFilter}'
        AND o.status = 'completed'
    `, [sellerId]);
    
    // Get top performing products
    const topProducts = await pg.query(`
      SELECT 
        pl.product_name,
        pl.category_id,
        COUNT(oi.id) as total_sold,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.quantity * oi.unit_price) as total_revenue
      FROM product_listings pl
      JOIN order_items oi ON pl.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE pl.seller_id = $1
        AND o.created_at > NOW() - INTERVAL '${periodFilter}'
        AND o.status = 'completed'
      GROUP BY pl.id, pl.product_name, pl.category_id
      ORDER BY total_revenue DESC
      LIMIT 5
    `, [sellerId]);
    
    return {
      success: true,
      period,
      listings: listingStats.rows[0],
      sales: salesData.rows[0],
      top_products: topProducts.rows
    };
  } catch (error) {
    logger.error('Error getting seller analytics', { error: error.message, sellerId });
    throw error;
  }
}

// ============================================================================
// GI MARKETPLACE INTEGRATION
// ============================================================================

/**
 * Get GI marketplace listings with premium pricing
 */
async function getGIListings(filters = {}) {
  let pg = getPostgreSQL();
  
  try {
    const { state, gi_product_id } = filters;
    
    let query = `
      SELECT 
        gml.*,
        gp.gi_name,
        gp.geographical_region,
        gp.state,
        a.city,
        a.district,
        u.full_name as seller_name
      FROM gi_marketplace_listings gml
      LEFT JOIN gi_products gp ON gml.gi_product_id = gp.id
      LEFT JOIN addresses a ON gml.location_id = a.id
      LEFT JOIN users u ON gml.seller_id = u.id
      WHERE gml.listing_status = 'active'
    `;
    
    let params = [];
    let paramCount = 0;
    
    if (gi_product_id) {
      paramCount++;
      query += ` AND gml.gi_product_id = $${paramCount}`;
      params.push(gi_product_id);
    }
    
    if (state) {
      paramCount++;
      query += ` AND gp.state = $${paramCount}`;
      params.push(state);
    }
    
    query += ` ORDER BY gml.created_at DESC`;
    
    let result = await pg.query(query, params);
    
    return {
      success: true,
      listings: result.rows
    };
  } catch (error) {
    logger.error('Error getting GI listings', { error: error.message });
    throw error;
  }
}

// ============================================================================
// MARKET INTELLIGENCE
// ============================================================================

/**
 * Get market price trends for category
 */
async function getMarketPriceTrends(categoryId, period = '30d') {
  let pg = getPostgreSQL();
  
  try {
    let periodMap = {
      '7d': '7 days',
      '30d': '30 days',
      '90d': '90 days'
    };
    
    let periodFilter = periodMap[period] || '30 days';
    
    let result = await pg.query(`
      SELECT 
        DATE(created_at) as date,
        AVG(base_price) as avg_price,
        MIN(base_price) as min_price,
        MAX(base_price) as max_price,
        COUNT(*) as listing_count
      FROM product_listings
      WHERE category_id = $1
        AND created_at > NOW() - INTERVAL '${periodFilter}'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [categoryId]);
    
    return {
      success: true,
      category_id: categoryId,
      period,
      trends: result.rows
    };
  } catch (error) {
    logger.error('Error getting market price trends', { error: error.message });
    throw error;
  }
}

/**
 * Get market demand analysis
 */
async function getMarketDemandAnalysis(categoryId) {
  let pg = getPostgreSQL();
  
  try {
    let result = await pg.query(`
      SELECT 
        c.name as category_name,
        COUNT(*) FILTER (WHERE listing_status = 'active') as active_listings,
        COUNT(*) FILTER (WHERE listing_status = 'sold') as sold_listings,
        AVG(CASE WHEN listing_status = 'sold' 
          THEN quantity 
          ELSE NULL 
        END) as avg_sold_quantity,
        AVG(base_price) as avg_price,
        AVG(quality_score) as avg_quality
      FROM product_listings pl
      JOIN categories c ON pl.category_id = c.id
      WHERE pl.category_id = $1
        AND pl.created_at > NOW() - INTERVAL '90 days'
      GROUP BY c.id, c.name
    `, [categoryId]);
    
    return {
      success: true,
      analysis: result.rows[0] || null
    };
  } catch (error) {
    logger.error('Error getting market demand analysis', { error: error.message });
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Product Listing Management
  createProductListing,
  getMarketplaceListings,
  
  // AI-Powered Pricing & Recommendations
  getAIPriceRecommendation,
  assessProductQuality,
  predictMarketDemand,
  
  // Seller Analytics
  getSellerAnalytics,
  
  // GI Marketplace
  getGIListings,
  
  // Market Intelligence
  getMarketPriceTrends,
  getMarketDemandAnalysis
};
