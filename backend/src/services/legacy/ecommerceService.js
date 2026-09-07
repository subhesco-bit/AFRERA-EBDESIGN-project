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
  const pg = getPostgreSQL();
  
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
    
    const result = await pg.query(query, params);
    
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
  const pg = getPostgreSQL();
  
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
  const pg = getPostgreSQL();
  
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
  const pg = getPostgreSQL();
  
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
  const pg = getPostgreSQL();
  
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
    
    const params = [];
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
    
    const result = await pg.query(query, params);
    
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
  const pg = getPostgreSQL();
  
  try {
    const periodMap = {
      '7d': '7 days',
      '30d': '30 days',
      '90d': '90 days'
    };
    
    const periodFilter = periodMap[period] || '30 days';
    
    const result = await pg.query(`
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
  const pg = getPostgreSQL();
  
  try {
    const result = await pg.query(`
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

// Merged from ecommerceService.js
/**
 * AFRERA E-Commerce Integration Service
 * 
 * Deep integration between E-commerce marketplace and:
 * - Nutrition Intelligence (nutrition scoring, health-based pricing)
 * - Recipe Intelligence (recipe suggestions, ingredient matching)
 * - Consumer Health (health profiles, dietary recommendations)
 * - Nutrient Calculator (nutrition calculation for purchased products)
 * - Dietitian Services (professional dietary advice integration)
 * 
 * This service enables:
 * - Nutrition-scored product listings
 * - Health-based product recommendations
 * - Recipe suggestions for purchased products
 * - Nutrition calculation for shopping carts
 * - Dietitian-curated product collections
 * - Allergen-aware product filtering
 * - Dietary restriction compatibility
 */

const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus } = require('../../core/signalBus');

// Import integrated services
const nutritionIntelligenceService = require('./nutritionIntelligenceService');
const recipeIntelligenceService = require('./recipeIntelligenceService');
const consumerHealthService = require('./consumerHealthService');

// ============================================================================
// NUTRITION SCORING INTEGRATION
// ============================================================================

/**
 * Calculate nutrition score for a product listing
 * Integrates with Nutrition Intelligence Service
 */
async function calculateProductNutritionScore(productListingId) {
  const pg = getPostgreSQL();
  
  try {
    // Get product listing details
    const listing = await pg.query(
      'SELECT * FROM product_listings WHERE id = $1',
      [productListingId]
    );
    
    if (listing.rows.length === 0) {
      throw new Error('Product listing not found');
    }
    
    const product = listing.rows[0];
    
    // Get or create nutrition profile for this product
    let nutritionData;
    try {
      nutritionData = await nutritionIntelligenceService.getProductNutrition(product.product_name);
    } catch (error) {
      // If no nutrition data exists, create a basic profile
      nutritionData = await nutritionIntelligenceService.addProductNutrition({
        product_id: product.id,
        nutrition_data: estimateBasicNutrition(product.category_id),
        calories_per_serving: estimateCalories(product.category_id),
        serving_size_g: 100,
        verification_method: 'estimated',
        confidence_score: 0.6
      });
    }
    
    // Calculate nutrition score
    const scoreResult = await nutritionIntelligenceService.calculateProductNutritionScore(product.id);
    
    // Update product listing with nutrition score
    await pg.query(
      `UPDATE product_listings 
       SET nutrition_score = $1, nutrition_grade = $2, nutrition_data = $3, updated_at = NOW()
       WHERE id = $4`,
      [scoreResult.overall_score, scoreResult.grade, JSON.stringify(nutritionData.nutrition_data), product.id]
    );
    
    // Emit signal bus event
    await signalBus.emit('nutrition.score.calculated', {
      product_id: product.id,
      nutrition_score: scoreResult.overall_score,
      nutrition_grade: scoreResult.grade,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Nutrition score calculated for product', { 
      productId: product.id, 
      score: scoreResult.overall_score,
      grade: scoreResult.grade
    });
    
    return {
      success: true,
      product_id: product.id,
      nutrition_score: scoreResult.overall_score,
      nutrition_grade: scoreResult.grade,
      nutrition_data: nutritionData.nutrition_data
    };
  } catch (error) {
    logger.error('Error calculating product nutrition score', { error: error.message, productListingId });
    throw error;
  }
}

/**
 * Estimate basic nutrition based on category (fallback when no lab data)
 */
function estimateBasicNutrition(categoryId) {
  const categoryNutrition = {
    1: { PRO: 8, CARB: 75, FAT: 1, FIB: 3 }, // Grains
    2: { PRO: 15, CARB: 25, FAT: 10, FIB: 30 }, // Spices
    3: { PRO: 1, CARB: 15, FAT: 0.5, FIB: 2 }, // Fruits
    4: { PRO: 2, CARB: 8, FAT: 0.3, FIB: 2 }, // Vegetables
    5: { PRO: 0, CARB: 0, FAT: 0, FIB: 0 }, // Tea
    6: { PRO: 0, CARB: 80, FAT: 0, FIB: 0 }, // Honey
  };
  
  return categoryNutrition[categoryId] || { PRO: 5, CARB: 50, FAT: 2, FIB: 5 };
}

/**
 * Estimate calories based on category
 */
function estimateCalories(categoryId) {
  const categoryCalories = {
    1: 350, // Grains
    2: 250, // Spices
    3: 50,  // Fruits
    4: 25,  // Vegetables
    5: 2,   // Tea
    6: 320, // Honey
  };
  
  return categoryCalories[categoryId] || 200;
}

/**
 * Calculate nutrition-based price premium
 * Higher nutrition scores get price premiums
 */
async function calculateNutritionPricePremium(productListingId, basePrice) {
  const pg = getPostgreSQL();
  
  try {
    const listing = await pg.query(
      'SELECT nutrition_score, nutrition_grade FROM product_listings WHERE id = $1',
      [productListingId]
    );
    
    if (listing.rows.length === 0) {
      return { premium_percentage: 0, nutrition_price: basePrice };
    }
    
    const { nutrition_score, nutrition_grade } = listing.rows[0];
    
    // Calculate premium based on nutrition grade
    const gradePremiums = {
      'A+': 0.25,  // 25% premium
      'A': 0.20,   // 20% premium
      'A-': 0.15,  // 15% premium
      'B+': 0.10,  // 10% premium
      'B': 0.05,   // 5% premium
      'B-': 0.02,  // 2% premium
      'C': 0,      // No premium
      'D': -0.05,  // 5% discount
      'F': -0.10   // 10% discount
    };
    
    const premiumPercentage = gradePremiums[nutrition_grade] || 0;
    const nutritionPrice = basePrice * (1 + premiumPercentage);
    
    return {
      premium_percentage: premiumPercentage,
      nutrition_price: Math.round(nutritionPrice * 100) / 100,
      nutrition_score,
      nutrition_grade
    };
  } catch (error) {
    logger.error('Error calculating nutrition price premium', { error: error.message });
    return { premium_percentage: 0, nutrition_price: basePrice };
  }
}

// ============================================================================
// RECIPE INTEGRATION
// ============================================================================

/**
 * Get recipe suggestions for a product
 * Finds recipes that use this product as an ingredient
 */
async function getRecipeSuggestionsForProduct(productListingId, limit = 5) {
  const pg = getPostgreSQL();
  
  try {
    // Get product details
    const listing = await pg.query(
      'SELECT product_name, category_id FROM product_listings WHERE id = $1',
      [productListingId]
    );
    
    if (listing.rows.length === 0) {
      return { recipes: [] };
    }
    
    const product = listing.rows[0];
    
    // Search for recipes that might use this product
    // This would ideally use the recipe intelligence service
    const recipes = await pg.query(`
      SELECT 
        r.id,
        r.recipe_name,
        r.cuisine_type,
        r.meal_type,
        r.difficulty_level,
        r.preparation_time,
        r.cooking_time,
        r.servings,
        r.nutritional_info,
        r.media_files,
        r.rating
      FROM recipe_database r
      WHERE r.is_verified = true
        AND (
          r.ingredients::text ILIKE $1
          OR r.recipe_name ILIKE $1
        )
      ORDER BY r.rating DESC
      LIMIT $2
    `, [`%${product.product_name}%`, limit]);
    
    // Calculate nutrition for each recipe if not present
    const enrichedRecipes = await Promise.all(recipes.rows.map(async (recipe) => {
      if (!recipe.nutritional_info || Object.keys(recipe.nutritional_info).length === 0) {
        // Calculate recipe nutrition using nutrient calculator
        const recipeNutrition = await calculateRecipeNutrition(recipe.id);
        return { ...recipe, nutritional_info: recipeNutrition };
      }
      return recipe;
    }));
    
    return {
      success: true,
      product_id: productListingId,
      product_name: product.product_name,
      recipes: enrichedRecipes
    };
  } catch (error) {
    logger.error('Error getting recipe suggestions', { error: error.message, productListingId });
    return { recipes: [] };
  }
}

/**
 * Calculate nutrition for a recipe
 * Integrates with nutrient calculator
 */
async function calculateRecipeNutrition(recipeId) {
  const pg = getPostgreSQL();
  
  try {
    const recipe = await pg.query(
      'SELECT ingredients, servings FROM recipe_database WHERE id = $1',
      [recipeId]
    );
    
    if (recipe.rows.length === 0) {
      return {};
    }
    
    const ingredients = recipe.rows[0].ingredients;
    const servings = recipe.rows[0].servings || 1;
    
    // This would integrate with the nutrient calculator service
    // For now, return estimated nutrition
    let totalNutrition = { PRO: 0, CARB: 0, FAT: 0, FIB: 0, CAL: 0 };
    
    for (const ingredient of ingredients) {
      const ingredientNutrition = estimateBasicNutrition(ingredient.category_id || 1);
      const weight = ingredient.quantity || 100;
      
      totalNutrition.PRO += (ingredientNutrition.PRO * weight / 100);
      totalNutrition.CARB += (ingredientNutrition.CARB * weight / 100);
      totalNutrition.FAT += (ingredientNutrition.FAT * weight / 100);
      totalNutrition.FIB += (ingredientNutrition.FIB * weight / 100);
      totalNutrition.CAL += estimateCalories(ingredient.category_id || 1) * weight / 100;
    }
    
    // Per serving
    const perServing = {};
    for (const key in totalNutrition) {
      perServing[key] = Math.round((totalNutrition[key] / servings) * 10) / 10;
    }
    
    return perServing;
  } catch (error) {
    logger.error('Error calculating recipe nutrition', { error: error.message, recipeId });
    return {};
  }
}

/**
 * Get products needed for a recipe
 * Reverse lookup: recipe -> marketplace products
 */
async function getProductsForRecipe(recipeId) {
  const pg = getPostgreSQL();
  
  try {
    const recipe = await pg.query(
      'SELECT ingredients FROM recipe_database WHERE id = $1',
      [recipeId]
    );
    
    if (recipe.rows.length === 0) {
      return { products: [] };
    }
    
    const ingredients = recipe.rows[0].ingredients;
    const productIds = [];
    
    // Find matching products in marketplace
    for (const ingredient of ingredients) {
      const matches = await pg.query(`
        SELECT id, product_name, base_price, quantity, unit, seller_id
        FROM product_listings
        WHERE listing_status = 'active'
          AND quantity > 0
          AND (
            product_name ILIKE $1
            OR description ILIKE $1
          )
        LIMIT 3
      `, [`%${ingredient.name}%`]);
      
      productIds.push(...matches.rows);
    }
    
    return {
      success: true,
      recipe_id: recipeId,
      products: productIds
    };
  } catch (error) {
    logger.error('Error getting products for recipe', { error: error.message, recipeId });
    return { products: [] };
  }
}

// ============================================================================
// HEALTH-BASED RECOMMENDATIONS
// ============================================================================

/**
 * Get health-based product recommendations for a user
 * Integrates with Consumer Health Service
 */
async function getHealthBasedRecommendations(userId, limit = 10) {
  const pg = getPostgreSQL();
  
  try {
    // Get user's health profile
    const healthProfile = await consumerHealthService.getHealthProfile(userId);
    
    if (!healthProfile) {
      // Return general recommendations if no health profile
      return await getGeneralRecommendations(limit);
    }
    
    const { dietary_restrictions, allergies, health_goals } = healthProfile;
    
    // Build query based on health profile
    let query = `
      SELECT 
        pl.*,
        pl.nutrition_score,
        pl.nutrition_grade
      FROM product_listings pl
      WHERE pl.listing_status = 'active'
        AND pl.quantity > 0
    `;
    
    const params = [];
    let paramCount = 0;
    
    // Filter by dietary restrictions
    if (dietary_restrictions && dietary_restrictions.length > 0) {
      const restrictions = dietary_restrictions.map((_, i) => `$${paramCount + i + 1}`).join(', ');
      paramCount += dietary_restrictions.length;
      query += ` AND pl.dietary_compatibility @> ARRAY[${restrictions}]::text[]`;
      params.push(...dietary_restrictions);
    }
    
    // Filter out allergens
    if (allergies && allergies.length > 0) {
      paramCount++;
      query += ` AND NOT (pl.allergens && $${paramCount})`;
      params.push(allergies);
    }
    
    // Sort by nutrition score if health goals include nutrition
    if (health_goals && health_goals.includes('healthy_eating')) {
      query += ` ORDER BY pl.nutrition_score DESC, pl.visibility_score DESC`;
    } else {
      query += ` ORDER BY pl.visibility_score DESC`;
    }
    
    query += ` LIMIT $${paramCount + 1}`;
    params.push(limit);
    
    const result = await pg.query(query, params);
    
    // Emit recommendation event
    await signalBus.emit('health.recommendations.generated', {
      user_id: userId,
      dietary_restrictions,
      allergies,
      health_goals,
      recommendation_count: result.rows.length,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: true,
      user_id: userId,
      health_profile: {
        dietary_restrictions,
        allergies,
        health_goals
      },
      recommendations: result.rows
    };
  } catch (error) {
    logger.error('Error getting health-based recommendations', { error: error.message, userId });
    return await getGeneralRecommendations(limit);
  }
}

/**
 * Get general recommendations (fallback)
 */
async function getGeneralRecommendations(limit = 10) {
  const pg = getPostgreSQL();
  
  try {
    const result = await pg.query(`
      SELECT 
        pl.*,
        pl.nutrition_score,
        pl.nutrition_grade
      FROM product_listings pl
      WHERE pl.listing_status = 'active'
        AND pl.quantity > 0
      ORDER BY pl.visibility_score DESC, pl.nutrition_score DESC
      LIMIT $1
    `, [limit]);
    
    return {
      success: true,
      recommendations: result.rows,
      is_general: true
    };
  } catch (error) {
    logger.error('Error getting general recommendations', { error: error.message });
    return { recommendations: [] };
  }
}

/**
 * Check product compatibility with user's health profile
 */
async function checkProductCompatibility(productId, userId) {
  const pg = getPostgreSQL();
  
  try {
    // Get product allergens and dietary info
    const product = await pg.query(
      'SELECT allergens, dietary_compatibility FROM product_listings WHERE id = $1',
      [productId]
    );
    
    if (product.rows.length === 0) {
      return { compatible: true, warnings: [] };
    }
    
    const { allergens, dietary_compatibility } = product.rows[0];
    
    // Get user health profile
    const healthProfile = await consumerHealthService.getHealthProfile(userId);
    
    if (!healthProfile) {
      return { compatible: true, warnings: [] };
    }
    
    const warnings = [];
    
    // Check allergens
    if (allergens && healthProfile.allergies) {
      const allergenConflict = allergens.filter(a => healthProfile.allergies.includes(a));
      if (allergenConflict.length > 0) {
        warnings.push({
          type: 'allergen',
          severity: 'high',
          message: `Contains allergens: ${allergenConflict.join(', ')}`,
          allergens: allergenConflict
        });
      }
    }
    
    // Check dietary restrictions
    if (dietary_compatibility && healthProfile.dietary_restrictions) {
      const incompatible = healthProfile.dietary_restrictions.filter(
        restriction => !dietary_compatibility.includes(restriction)
      );
      if (incompatible.length > 0) {
        warnings.push({
          type: 'dietary',
          severity: 'medium',
          message: `Not suitable for: ${incompatible.join(', ')}`,
          restrictions: incompatible
        });
      }
    }
    
    return {
      compatible: warnings.filter(w => w.severity === 'high').length === 0,
      warnings
    };
  } catch (error) {
    logger.error('Error checking product compatibility', { error: error.message, productId, userId });
    return { compatible: true, warnings: [] };
  }
}

// ============================================================================
// SHOPPING CART NUTRITION CALCULATION
// ============================================================================

/**
 * Calculate total nutrition for shopping cart
 * Integrates with nutrient calculator
 */
async function calculateCartNutrition(cartItems) {
  const pg = getPostgreSQL();
  
  try {
    let totalNutrition = { PRO: 0, CARB: 0, FAT: 0, FIB: 0, CAL: 0 };
    const itemNutrition = [];
    
    for (const item of cartItems) {
      const product = await pg.query(
        'SELECT nutrition_data, quantity, unit FROM product_listings WHERE id = $1',
        [item.product_id]
      );
      
      if (product.rows.length > 0) {
        const nutritionData = product.rows[0].nutrition_data || estimateBasicNutrition(1);
        const quantity = item.quantity || 1;
        const weight = product.rows[0].quantity || 100;
        
        const itemTotal = {};
        for (const nutrient in nutritionData) {
          const value = (nutritionData[nutrient] * weight / 100) * quantity;
          itemTotal[nutrient] = Math.round(value * 10) / 10;
          totalNutrition[nutrient] = (totalNutrition[nutrient] || 0) + value;
        }
        
        itemNutrition.push({
          product_id: item.product_id,
          quantity,
          nutrition: itemTotal
        });
      }
    }
    
    // Round totals
    for (const nutrient in totalNutrition) {
      totalNutrition[nutrient] = Math.round(totalNutrition[nutrient] * 10) / 10;
    }
    
    return {
      success: true,
      total_nutrition: totalNutrition,
      item_breakdown: itemNutrition,
      total_items: cartItems.length
    };
  } catch (error) {
    logger.error('Error calculating cart nutrition', { error: error.message });
    return { total_nutrition: {}, item_breakdown: [] };
  }
}

/**
 * Calculate RDA percentage for cart
 */
async function calculateCartRDAPercentage(cartNutrition, userId) {
  try {
    // Get user demographics from health profile
    const healthProfile = await consumerHealthService.getHealthProfile(userId);
    
    if (!healthProfile) {
      return { rda_percentages: [], user_profile: null };
    }
    
    // Standard RDA values (simplified)
    const rdaTargets = {
      PRO: 50,  // 50g protein
      CARB: 300, // 300g carbs
      FAT: 65,   // 65g fat
      FIB: 25,   // 25g fiber
      CAL: 2000  // 2000 calories
    };
    
    const rdaPercentages = Object.entries(cartNutrition).map(([nutrient, value]) => ({
      nutrient,
      value,
      target: rdaTargets[nutrient],
      percentage: rdaTargets[nutrient] ? Math.round((value / rdaTargets[nutrient]) * 100) : null,
      status: getRDAStatus(rdaTargets[nutrient] ? (value / rdaTargets[nutrient]) * 100 : null)
    }));
    
    return {
      success: true,
      user_id: userId,
      user_profile: {
        dietary_restrictions: healthProfile.dietary_restrictions,
        health_goals: healthProfile.health_goals
      },
      rda_percentages: rdaPercentages
    };
  } catch (error) {
    logger.error('Error calculating cart RDA percentage', { error: error.message });
    return { rda_percentages: [] };
  }
}

function getRDAStatus(percentage) {
  if (percentage === null) return 'unknown';
  if (percentage < 50) return 'deficient';
  if (percentage < 80) return 'low';
  if (percentage <= 120) return 'adequate';
  if (percentage <= 200) return 'high';
  return 'excessive';
}

// ============================================================================
// DIETITIAN INTEGRATION
// ============================================================================

/**
 * Get dietitian-curated product collections
 */
async function getDietitianCollections(dietitianId = null) {
  const pg = getPostgreSQL();
  
  try {
    let query = `
      SELECT 
        dc.id,
        dc.collection_name,
        dc.description,
        dc.dietitian_id,
        dc.dietary_focus,
        dc.health_goals,
        dc.created_at,
        u.full_name as dietitian_name,
        u.credentials as dietitian_credentials
      FROM dietitian_collections dc
      LEFT JOIN users u ON dc.dietitian_id = u.id
      WHERE dc.is_active = true
    `;
    
    const params = [];
    
    if (dietitianId) {
      query += ' AND dc.dietitian_id = $1';
      params.push(dietitianId);
    }
    
    query += ' ORDER BY dc.created_at DESC';
    
    const result = await pg.query(query, params);
    
    // Get products for each collection
    const collections = await Promise.all(result.rows.map(async (collection) => {
      const products = await pg.query(`
        SELECT pl.* 
        FROM dietitian_collection_products dcp
        JOIN product_listings pl ON dcp.product_id = pl.id
        WHERE dcp.collection_id = $1
          AND pl.listing_status = 'active'
      `, [collection.id]);
      
      return {
        ...collection,
        products: products.rows,
        product_count: products.rows.length
      };
    }));
    
    return {
      success: true,
      collections
    };
  } catch (error) {
    logger.error('Error getting dietitian collections', { error: error.message });
    return { collections: [] };
  }
}

/**
 * Get dietitian recommendation for user
 */
async function getDietitianRecommendation(userId) {
  const pg = getPostgreSQL();
  
  try {
    // Get user's health profile
    const healthProfile = await consumerHealthService.getHealthProfile(userId);
    
    if (!healthProfile) {
      return { recommendation: null, reason: 'No health profile found' };
    }
    
    // Find dietitian collections matching user's needs
    const collections = await pg.query(`
      SELECT dc.*, u.full_name as dietitian_name
      FROM dietitian_collections dc
      LEFT JOIN users u ON dc.dietitian_id = u.id
      WHERE dc.is_active = true
        AND (
          dc.dietary_focus = ANY($1)
          OR dc.health_goals && $2
        )
      ORDER BY dc.rating DESC
      LIMIT 3
    `, [healthProfile.dietary_restrictions || [], healthProfile.health_goals || []]);
    
    if (collections.rows.length === 0) {
      return { recommendation: null, reason: 'No matching dietitian collections found' };
    }
    
    // Get products for top collection
    const topCollection = collections.rows[0];
    const products = await pg.query(`
      SELECT pl.*
      FROM dietitian_collection_products dcp
      JOIN product_listings pl ON dcp.product_id = pl.id
      WHERE dcp.collection_id = $1
        AND pl.listing_status = 'active'
    `, [topCollection.id]);
    
    return {
      success: true,
      user_id: userId,
      recommendation: {
        collection: topCollection,
        products: products.rows,
        match_reason: `Matches dietary focus: ${topCollection.dietary_focus} and health goals: ${topCollection.health_goals.join(', ')}`
      }
    };
  } catch (error) {
    logger.error('Error getting dietitian recommendation', { error: error.message, userId });
    return { recommendation: null, reason: 'Error occurred' };
  }
}

// ============================================================================
// CROSS-MODULE SIGNAL BUS EVENTS
// ============================================================================

/**
 * Emit comprehensive marketplace integration events
 */
async function emitIntegrationEvent(eventType, data) {
  const eventPayloads = {
    'product.nutrition_scored': {
      event_type: 'product.nutrition_scored',
      entity_id: data.product_id,
      entity_type: 'product_listing',
      nutrition_score: data.nutrition_score,
      nutrition_grade: data.nutrition_grade,
      timestamp: new Date().toISOString()
    },
    'recipe.products_matched': {
      event_type: 'recipe.products_matched',
      entity_id: data.recipe_id,
      entity_type: 'recipe',
      product_count: data.products.length,
      product_ids: data.products.map(p => p.id),
      timestamp: new Date().toISOString()
    },
    'health.recommendations_viewed': {
      event_type: 'health.recommendations_viewed',
      entity_id: data.user_id,
      entity_type: 'user',
      recommendation_count: data.count,
      dietary_restrictions: data.dietary_restrictions,
      timestamp: new Date().toISOString()
    },
    'cart.nutrition_calculated': {
      event_type: 'cart.nutrition_calculated',
      entity_id: data.cart_id,
      entity_type: 'cart',
      total_nutrition: data.total_nutrition,
      item_count: data.item_count,
      timestamp: new Date().toISOString()
    }
  };
  
  const payload = eventPayloads[eventType];
  if (payload) {
    await signalBus.emit(eventType, payload);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Nutrition Scoring
  calculateProductNutritionScore,
  calculateNutritionPricePremium,
  
  // Recipe Integration
  getRecipeSuggestionsForProduct,
  calculateRecipeNutrition,
  getProductsForRecipe,
  
  // Health-Based Recommendations
  getHealthBasedRecommendations,
  checkProductCompatibility,
  
  // Shopping Cart Nutrition
  calculateCartNutrition,
  calculateCartRDAPercentage,
  
  // Dietitian Integration
  getDietitianCollections,
  getDietitianRecommendation,
  
  // Signal Bus Events
  emitIntegrationEvent
};


// Merged from ecommerceMarketingService.js
/**
 * AFRERA E-Commerce Advertisement & Marketing Service
 * 
 * Comprehensive marketing and advertising features:
 * - Campaign Management (create, schedule, track campaigns)
 * - Advertisement Management (banner ads, sponsored products)
 * - Promotion Management (discounts, coupons, special offers)
 * - Targeted Advertising (segment-based, behavior-based)
 * - Performance Analytics (CTR, conversion, ROI)
 * - Budget Management (campaign budgets, spend tracking)
 * - A/B Testing (creative optimization, landing page testing)
 * - Retargeting (cart abandonment, product views)
 * - Email Marketing (campaigns, automation)
 * - Social Media Integration (Facebook, Instagram, WhatsApp)
 * - Influencer Marketing (partnerships, affiliate programs)
 */

const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus } = require('../../core/signalBus');

// ============================================================================
// CAMPAIGN MANAGEMENT
// ============================================================================

/**
 * Create marketing campaign
 */
async function createCampaign(userId, campaignData) {
  const pg = getPostgreSQL();
  
  try {
    const {
      campaign_name,
      campaign_type,
      objective,
      start_date,
      end_date,
      budget,
      target_audience,
      ad_creatives,
      platforms,
      optimization_goal
    } = campaignData;
    
    // Generate campaign ID
    const campaignId = `CMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const campaign = {
      id: campaignId,
      created_by: userId,
      campaign_name,
      campaign_type,
      objective,
      start_date,
      end_date,
      budget,
      budget_spent: 0,
      target_audience: JSON.stringify(target_audience),
      ad_creatives: JSON.stringify(ad_creatives),
      platforms: JSON.stringify(platforms),
      optimization_goal,
      status: 'draft',
      created_at: new Date().toISOString()
    };
    
    // Store campaign
    await pg.query(`
      INSERT INTO marketing_campaigns 
      (id, created_by, campaign_name, campaign_type, objective, start_date, end_date, budget, 
       budget_spent, target_audience, ad_creatives, platforms, optimization_goal, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
    `, [campaignId, userId, campaign_name, campaign_type, objective, start_date, end_date, budget, 0,
        JSON.stringify(target_audience), JSON.stringify(ad_creatives), JSON.stringify(platforms), 
        optimization_goal, 'draft']);
    
    // Emit signal bus event
    await signalBus.emit('marketing.campaign.created', {
      campaign_id: campaignId,
      created_by: userId,
      campaign_type,
      budget,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Marketing campaign created', { campaignId, campaign_name });
    
    return {
      success: true,
      campaign
    };
  } catch (error) {
    logger.error('Error creating marketing campaign', { error: error.message });
    throw error;
  }
}

/**
 * Launch campaign
 */
async function launchCampaign(campaignId) {
  const pg = getPostgreSQL();
  
  try {
    // Update campaign status
    await pg.query(`
      UPDATE marketing_campaigns 
      SET status = 'active', launched_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `, [campaignId]);
    
    // Create ad placements
    const campaign = await pg.query(`
      SELECT platforms, ad_creatives
      FROM marketing_campaigns
      WHERE id = $1
    `, [campaignId]);
    
    if (campaign.rows.length === 0) {
      throw new Error('Campaign not found');
    }
    
    const platforms = JSON.parse(campaign.rows[0].platforms);
    const creatives = JSON.parse(campaign.rows[0].ad_creatives);
    
    // Create ad placements for each platform
    for (const platform of platforms) {
      for (const creative of creatives) {
        const placementId = `AD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        await pg.query(`
          INSERT INTO ad_placements 
          (id, campaign_id, platform, creative_id, placement_type, status, impressions, clicks, conversions, spend, created_at)
          VALUES ($1, $2, $3, $4, $5, 'active', 0, 0, 0, 0, NOW())
        `, [placementId, campaignId, platform, creative.id, creative.placement_type]);
      }
    }
    
    // Emit signal bus event
    await signalBus.emit('marketing.campaign.launched', {
      campaign_id: campaignId,
      platforms,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Campaign launched', { campaignId });
    
    return {
      success: true,
      campaign_id: campaignId
    };
  } catch (error) {
    logger.error('Error launching campaign', { error: error.message, campaignId });
    throw error;
  }
}

/**
 * Update campaign performance metrics
 */
async function updateCampaignMetrics(campaignId) {
  const pg = getPostgreSQL();
  
  try {
    // Get campaign ad placements
    const placements = await pg.query(`
      SELECT id, impressions, clicks, conversions, spend
      FROM ad_placements
      WHERE campaign_id = $1
    `, [campaignId]);
    
    // Calculate totals
    const totals = placements.rows.reduce((acc, row) => {
      acc.impressions += parseInt(row.impressions);
      acc.clicks += parseInt(row.clicks);
      acc.conversions += parseInt(row.conversions);
      acc.spend += parseFloat(row.spend);
      return acc;
    }, { impressions: 0, clicks: 0, conversions: 0, spend: 0 });
    
    // Calculate metrics
    const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
    const conversion_rate = totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0;
    const cpa = totals.conversions > 0 ? totals.spend / totals.conversions : 0;
    
    // Update campaign with new metrics
    await pg.query(`
      UPDATE marketing_campaigns 
      SET budget_spent = $1, 
          total_impressions = $2,
          total_clicks = $3,
          total_conversions = $4,
          ctr = $5,
          conversion_rate = $6,
          cpa = $7,
          updated_at = NOW()
      WHERE id = $8
    `, [totals.spend, totals.impressions, totals.clicks, totals.conversions, ctr, conversion_rate, cpa, campaignId]);
    
    logger.info('Campaign metrics updated', { campaignId, ctr, conversion_rate });
    
    return {
      success: true,
      metrics: {
        impressions: totals.impressions,
        clicks: totals.clicks,
        conversions: totals.conversions,
        spend: totals.spend,
        ctr: Math.round(ctr * 100) / 100,
        conversion_rate: Math.round(conversion_rate * 100) / 100,
        cpa: Math.round(cpa * 100) / 100
      }
    };
  } catch (error) {
    logger.error('Error updating campaign metrics', { error: error.message, campaignId });
    throw error;
  }
}

// ============================================================================
// SPONSORED PRODUCT MANAGEMENT
// ============================================================================

/**
 * Create sponsored product listing
 */
async function createSponsoredProduct(sellerId, productData) {
  const pg = getPostgreSQL();
  
  try {
    const {
      product_id,
      sponsor_tier,
      duration_days,
      bid_amount,
      targeting
    } = productData;
    
    // Generate sponsored listing ID
    const sponsoredId = `SP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const endDate = new Date(Date.now() + duration_days * 24 * 60 * 60 * 1000);
    
    const sponsoredProduct = {
      id: sponsoredId,
      seller_id: sellerId,
      product_id,
      sponsor_tier,
      bid_amount,
      start_date: new Date().toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      targeting: JSON.stringify(targeting),
      impressions: 0,
      clicks: 0,
      conversions: 0,
      status: 'active',
      created_at: new Date().toISOString()
    };
    
    // Store sponsored product
    await pg.query(`
      INSERT INTO sponsored_products 
      (id, seller_id, product_id, sponsor_tier, bid_amount, start_date, end_date, targeting, 
       impressions, clicks, conversions, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, 0, 0, 'active', NOW())
    `, [sponsoredId, sellerId, product_id, sponsor_tier, bid_amount, sponsoredProduct.start_date, 
        sponsoredProduct.end_date, JSON.stringify(targeting)]);
    
    // Emit signal bus event
    await signalBus.emit('marketing.sponsored_product.created', {
      sponsored_id: sponsoredId,
      seller_id: sellerId,
      product_id,
      sponsor_tier,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Sponsored product created', { sponsoredId, product_id });
    
    return {
      success: true,
      sponsored_product: sponsoredProduct
    };
  } catch (error) {
    logger.error('Error creating sponsored product', { error: error.message });
    throw error;
  }
}

/**
 * Get sponsored products for display
 */
async function getSponsoredProducts(filters = {}) {
  const pg = getPostgreSQL();
  
  try {
    const { category_id, tier, limit = 10 } = filters;
    
    let query = `
      SELECT 
        sp.*,
        pl.product_name,
        pl.base_price,
        pl.unit,
        pl.images,
        pl.nutrition_grade,
        pl.gi_tagged,
        pl.organic
      FROM sponsored_products sp
      JOIN product_listings pl ON sp.product_id = pl.id
      WHERE sp.status = 'active'
        AND sp.end_date > NOW()
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (category_id) {
      paramCount++;
      query += ` AND pl.category_id = $${paramCount}`;
      params.push(category_id);
    }
    
    if (tier) {
      paramCount++;
      query += ` AND sp.sponsor_tier = $${paramCount}`;
      params.push(tier);
    }
    
    query += ` ORDER BY sp.bid_amount DESC, sp.created_at DESC
               LIMIT $${paramCount + 1}`;
    params.push(limit);
    
    const result = await pg.query(query, params);
    
    // Update impressions
    for (const product of result.rows) {
      await pg.query(`
        UPDATE sponsored_products 
        SET impressions = impressions + 1
        WHERE id = $1
      `, [product.id]);
    }
    
    return {
      success: true,
      sponsored_products: result.rows
    };
  } catch (error) {
    logger.error('Error getting sponsored products', { error: error.message });
    throw error;
  }
}

// ============================================================================
// PROMOTION MANAGEMENT
// ============================================================================

/**
 * Create promotion/discount offer
 */
async function createPromotion(creatorId, promotionData) {
  const pg = getPostgreSQL();
  
  try {
    const {
      promotion_name,
      promotion_type,
      discount_type,
      discount_value,
      min_purchase_value,
      max_discount_amount,
      usage_limit,
      start_date,
      end_date,
      applicable_products,
      applicable_categories,
      user_segments
    } = promotionData;
    
    // Generate promotion code
    const promoCode = `PROMO-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const promotion = {
      id: promoCode,
      created_by: creatorId,
      promotion_name,
      promotion_type,
      discount_type,
      discount_value,
      min_purchase_value,
      max_discount_amount,
      usage_limit,
      used_count: 0,
      start_date,
      end_date,
      applicable_products: JSON.stringify(applicable_products),
      applicable_categories: JSON.stringify(applicable_categories),
      user_segments: JSON.stringify(user_segments),
      status: 'active',
      created_at: new Date().toISOString()
    };
    
    // Store promotion
    await pg.query(`
      INSERT INTO promotions 
      (id, created_by, promotion_name, promotion_type, discount_type, discount_value, min_purchase_value, 
       max_discount_amount, usage_limit, used_count, start_date, end_date, applicable_products, 
       applicable_categories, user_segments, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $10, $11, $12, $13, $14, 'active', NOW())
    `, [promoCode, creatorId, promotion_name, promotion_type, discount_type, discount_value, 
        min_purchase_value, max_discount_amount, usage_limit, start_date, end_date, 
        JSON.stringify(applicable_products), JSON.stringify(applicable_categories), JSON.stringify(user_segments)]);
    
    // Emit signal bus event
    await signalBus.emit('marketing.promotion.created', {
      promotion_id: promoCode,
      promotion_name,
      discount_type,
      discount_value,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Promotion created', { promoCode, promotion_name });
    
    return {
      success: true,
      promotion
    };
  } catch (error) {
    logger.error('Error creating promotion', { error: error.message });
    throw error;
  }
}

/**
 * Apply promotion to order
 */
async function applyPromotion(promoCode, orderId, userId) {
  const pg = getPostgreSQL();
  
  try {
    // Get promotion details
    const promotion = await pg.query(`
      SELECT * FROM promotions
      WHERE id = $1
        AND status = 'active'
        AND start_date <= CURRENT_DATE
        AND end_date >= CURRENT_DATE
        AND used_count < usage_limit
    `, [promoCode]);
    
    if (promotion.rows.length === 0) {
      return {
        success: false,
        error: 'Invalid or expired promotion code'
      };
    }
    
    const promo = promotion.rows[0];
    
    // Check if user is eligible
    const userSegments = JSON.parse(promo.user_segments || '[]');
    const userSegment = await pg.query(`
      SELECT segment_data 
      FROM customer_segments 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [userId]);
    
    if (userSegments.length > 0 && userSegment.rows[0]) {
      const segment = JSON.parse(userSegment.rows[0].segment_data);
      if (!userSegments.includes(segment.segment)) {
        return {
          success: false,
          error: 'User not eligible for this promotion'
        };
      }
    }
    
    // Get order total
    const order = await pg.query(`
      SELECT total_amount 
      FROM orders 
      WHERE id = $1
    `, [orderId]);
    
    if (order.rows.length === 0) {
      return {
        success: false,
        error: 'Order not found'
      };
    }
    
    const orderTotal = parseFloat(order.rows[0].total_amount);
    
    // Check minimum purchase requirement
    if (promo.min_purchase_value && orderTotal < promo.min_purchase_value) {
      return {
        success: false,
        error: `Minimum purchase value is ${promo.min_purchase_value}`
      };
    }
    
    // Calculate discount
    let discountAmount = 0;
    if (promo.discount_type === 'percentage') {
      discountAmount = orderTotal * (promo.discount_value / 100);
    } else {
      discountAmount = promo.discount_value;
    }
    
    // Apply max discount limit
    if (promo.max_discount_amount && discountAmount > promo.max_discount_amount) {
      discountAmount = promo.max_discount_amount;
    }
    
    // Update promotion usage
    await pg.query(`
      UPDATE promotions 
      SET used_count = used_count + 1, updated_at = NOW()
      WHERE id = $1
    `, [promoCode]);
    
    // Store discount record
    const discountId = `DISC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await pg.query(`
      INSERT INTO discount_records 
      (id, promotion_id, order_id, user_id, discount_amount, original_amount, applied_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [discountId, promoCode, orderId, userId, discountAmount, orderTotal]);
    
    logger.info('Promotion applied', { promoCode, discountAmount });
    
    return {
      success: true,
      discount_amount: Math.round(discountAmount * 100) / 100,
      new_total: Math.round((orderTotal - discountAmount) * 100) / 100
    };
  } catch (error) {
    logger.error('Error applying promotion', { error: error.message });
    throw error;
  }
}

// ============================================================================
// RETARGETING CAMPAIGNS
// ============================================================================

/**
 * Create cart abandonment retargeting campaign
 */
async function createCartRetargeting(userId, cartItems) {
  const pg = getPostgreSQL();
  
  try {
    // Check if user already has active retargeting
    const existing = await pg.query(`
      SELECT id FROM retargeting_campaigns
      WHERE user_id = $1
        AND status = 'active'
        AND created_at > NOW() - INTERVAL '7 days'
      LIMIT 1
    `, [userId]);
    
    if (existing.rows.length > 0) {
      return {
        success: true,
        message: 'Active retargeting campaign already exists',
        campaign_id: existing.rows[0].id
      };
    }
    
    // Create retargeting campaign
    const campaignId = `RET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const cartValue = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const campaign = {
      id: campaignId,
      user_id: userId,
      campaign_type: 'cart_abandonment',
      cart_items: JSON.stringify(cartItems),
      cart_value: cartValue,
      status: 'active',
      created_at: new Date().toISOString()
    };
    
    await pg.query(`
      INSERT INTO retargeting_campaigns 
      (id, user_id, campaign_type, cart_items, cart_value, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [campaignId, userId, 'cart_abandonment', JSON.stringify(cartItems), cartValue, 'active']);
    
    logger.info('Cart abandonment retargeting created', { campaignId, userId });
    
    return {
      success: true,
      campaign_id: campaignId
    };
  } catch (error) {
    logger.error('Error creating cart retargeting', { error: error.message });
    throw error;
  }
}

/**
 * Create product view retargeting
 */
async function createProductViewRetargeting(userId, productId) {
  const pg = getPostgreSQL();
  
  try {
    // Check if user already has recent retargeting for this product
    const existing = await pg.query(`
      SELECT id FROM retargeting_campaigns
      WHERE user_id = $1
        AND campaign_type = 'product_view'
        AND product_id = $2
        AND status = 'active'
        AND created_at > NOW() - INTERVAL '3 days'
      LIMIT 1
    `, [userId, productId]);
    
    if (existing.rows.length > 0) {
      return {
        success: true,
        message: 'Active product view retargeting already exists'
      };
    }
    
    // Create retargeting campaign
    const campaignId = `RET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const campaign = {
      id: campaignId,
      user_id: userId,
      campaign_type: 'product_view',
      product_id: productId,
      status: 'active',
      created_at: new Date().toISOString()
    };
    
    await pg.query(`
      INSERT INTO retargeting_campaigns 
      (id, user_id, campaign_type, product_id, status, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [campaignId, userId, 'product_view', productId, 'active']);
    
    logger.info('Product view retargeting created', { campaignId, productId });
    
    return {
      success: true,
      campaign_id: campaignId
    };
  } catch (error) {
    logger.error('Error creating product view retargeting', { error: error.message });
    throw error;
  }
}

// ============================================================================
// PERFORMANCE ANALYTICS
// ============================================================================

/**
 * Get marketing performance analytics
 */
async function getMarketingAnalytics(filters = {}) {
  const pg = getPostgreSQL();
  
  try {
    const { start_date, end_date, campaign_id } = filters;
    
    let query = `
      SELECT 
        mc.campaign_name,
        mc.campaign_type,
        mc.budget,
        mc.budget_spent,
        mc.total_impressions,
        mc.total_clicks,
        mc.total_conversions,
        mc.ctr,
        mc.conversion_rate,
        mc.cpa,
        mc.status
      FROM marketing_campaigns mc
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (start_date) {
      paramCount++;
      query += ` AND mc.created_at >= $${paramCount}`;
      params.push(start_date);
    }
    
    if (end_date) {
      paramCount++;
      query += ` AND mc.created_at <= $${paramCount}`;
      params.push(end_date);
    }
    
    if (campaign_id) {
      paramCount++;
      query += ` AND mc.id = $${paramCount}`;
      params.push(campaign_id);
    }
    
    const result = await pg.query(query, params);
    
    // Calculate aggregate metrics
    const aggregates = result.rows.reduce((acc, row) => {
      acc.total_budget += parseFloat(row.budget);
      acc.total_spent += parseFloat(row.budget_spent);
      acc.total_impressions += parseInt(row.total_impressions);
      acc.total_clicks += parseInt(row.total_clicks);
      acc.total_conversions += parseInt(row.total_conversions);
      return acc;
    }, { total_budget: 0, total_spent: 0, total_impressions: 0, total_clicks: 0, total_conversions: 0 });
    
    const overallCtr = aggregates.total_impressions > 0 ? (aggregates.total_clicks / aggregates.total_impressions) * 100 : 0;
    const overallConversionRate = aggregates.total_clicks > 0 ? (aggregates.total_conversions / aggregates.total_clicks) * 100 : 0;
    const overallCpa = aggregates.total_conversions > 0 ? aggregates.total_spent / aggregates.total_conversions : 0;
    
    return {
      success: true,
      campaign_count: result.rows.length,
      campaigns: result.rows,
      aggregates: {
        total_budget: aggregates.total_budget,
        total_spent: aggregates.total_spent,
        total_impressions: aggregates.total_impressions,
        total_clicks: aggregates.total_clicks,
        total_conversions: aggregates.total_conversions,
        overall_ctr: Math.round(overallCtr * 100) / 100,
        overall_conversion_rate: Math.round(overallConversionRate * 100) / 100,
        overall_cpa: Math.round(overallCpa * 100) / 100
      }
    };
  } catch (error) {
    logger.error('Error getting marketing analytics', { error: error.message });
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Campaign Management
  createCampaign,
  launchCampaign,
  updateCampaignMetrics,
  
  // Sponsored Products
  createSponsoredProduct,
  getSponsoredProducts,
  
  // Promotion Management
  createPromotion,
  applyPromotion,
  
  // Retargeting
  createCartRetargeting,
  createProductViewRetargeting,
  
  // Analytics
  getMarketingAnalytics
};


// Merged from ecommerceService.js
/**
 * AFRERA E-Commerce Business Sales Service
 * 
 * Comprehensive B2B marketplace and business sales features:
 * - Bulk Order Management (institutional procurement, B2B sales)
 * - Contract Farming Integration (long-term agreements, milestones)
 * - RFQ (Request for Quotation) Management
 * - Quotation Management (seller quotations, negotiation)
 * - B2B Pricing (volume discounts, tiered pricing)
 * - Sales Analytics (revenue tracking, conversion metrics)
 * - Commission Management (platform fees, seller commissions)
 * - Invoice Management (B2B invoicing, payment terms)
 * - Order Approval Workflows (multi-level approvals)
 * - Negotiation Support (counter-offers, revision tracking)
 */

const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus } = require('../../core/signalBus');

// ============================================================================
// B2B BULK ORDER MANAGEMENT
// ============================================================================

/**
 * Create B2B bulk order request
 */
async function createBulkOrder(buyerId, orderData) {
  const pg = getPostgreSQL();
  
  try {
    const {
      title,
      description,
      category_id,
      required_quantity,
      unit,
      target_price,
      delivery_location,
      required_by,
      specifications,
      business_type,
      payment_terms,
      delivery_terms
    } = orderData;
    
    // Generate bulk order ID
    const bulkOrderId = `BO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const bulkOrder = {
      id: bulkOrderId,
      buyer_id: buyerId,
      title,
      description,
      category_id,
      required_quantity,
      unit,
      target_price,
      delivery_location,
      required_by,
      specifications: JSON.stringify(specifications),
      business_type,
      payment_terms,
      delivery_terms,
      status: 'pending',
      quotation_count: 0,
      created_at: new Date().toISOString()
    };
    
    // Store bulk order
    await pg.query(`
      INSERT INTO bulk_orders 
      (id, buyer_id, title, description, category_id, required_quantity, unit, target_price, 
       delivery_location, required_by, specifications, business_type, payment_terms, delivery_terms, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
    `, [bulkOrderId, buyerId, title, description, category_id, required_quantity, unit, target_price,
        delivery_location, required_by, JSON.stringify(specifications), business_type, payment_terms, delivery_terms, 'pending']);
    
    // Find potential sellers
    const sellers = await findPotentialSellers(category_id, required_quantity, target_price);
    
    // Emit signal bus event
    await signalBus.emit('b2b.bulk_order.created', {
      bulk_order_id: bulkOrderId,
      buyer_id: buyerId,
      category_id,
      potential_sellers: sellers.length,
      timestamp: new Date().toISOString()
    });
    
    logger.info('B2B bulk order created', { bulkOrderId, buyerId });
    
    return {
      success: true,
      bulk_order: bulkOrder,
      potential_sellers: sellers
    };
  } catch (error) {
    logger.error('Error creating B2B bulk order', { error: error.message });
    throw error;
  }
}

/**
 * Find potential sellers for bulk order
 */
async function findPotentialSellers(categoryId, quantity, targetPrice) {
  const pg = getPostgreSQL();
  
  try {
    const sellers = await pg.query(`
      SELECT 
        pl.seller_id,
        u.full_name as seller_name,
        u.rating as seller_rating,
        COUNT(pl.id) as active_listings,
        SUM(pl.quantity) as total_available_quantity,
        AVG(pl.base_price) as avg_price
      FROM product_listings pl
      JOIN users u ON pl.seller_id = u.id
      WHERE pl.category_id = $1
        AND pl.listing_status = 'active'
        AND pl.quantity > 0
        AND pl.base_price <= $2
      GROUP BY pl.seller_id, u.full_name, u.rating
      HAVING SUM(pl.quantity) >= $3
      ORDER BY u.rating DESC, total_available_quantity DESC
      LIMIT 10
    `, [categoryId, targetPrice * 1.2, quantity]);
    
    return sellers.rows;
  } catch (error) {
    logger.error('Error finding potential sellers', { error: error.message });
    return [];
  }
}

/**
 * Submit quotation for bulk order
 */
async function submitQuotation(bulkOrderId, sellerId, quotationData) {
  const pg = getPostgreSQL();
  
  try {
    const {
      quoted_price,
      available_quantity,
      unit,
      delivery_date,
      delivery_cost,
      notes,
      quotation_validity_days
    } = quotationData;
    
    // Generate quotation ID
    const quotationId = `QT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const quotation = {
      id: quotationId,
      bulk_order_id: bulkOrderId,
      seller_id: sellerId,
      quoted_price,
      available_quantity,
      unit,
      delivery_date,
      delivery_cost,
      notes,
      status: 'pending',
      expires_at: new Date(Date.now() + (quotation_validity_days || 30) * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString()
    };
    
    // Store quotation
    await pg.query(`
      INSERT INTO quotations 
      (id, bulk_order_id, seller_id, quoted_price, available_quantity, unit, delivery_date, delivery_cost, notes, status, expires_at, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
    `, [quotationId, bulkOrderId, sellerId, quoted_price, available_quantity, unit, delivery_date, 
        delivery_cost, notes, 'pending', quotation.expires_at]);
    
    // Update bulk order quotation count
    await pg.query(`
      UPDATE bulk_orders 
      SET quotation_count = quotation_count + 1, updated_at = NOW()
      WHERE id = $1
    `, [bulkOrderId]);
    
    // Emit signal bus event
    await signalBus.emit('b2b.quotation.submitted', {
      quotation_id: quotationId,
      bulk_order_id: bulkOrderId,
      seller_id: sellerId,
      quoted_price,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Quotation submitted', { quotationId, bulkOrderId, sellerId });
    
    return {
      success: true,
      quotation
    };
  } catch (error) {
    logger.error('Error submitting quotation', { error: error.message });
    throw error;
  }
}

/**
 * Accept quotation and create order
 */
async function acceptQuotation(quotationId, buyerId) {
  const pg = getPostgreSQL();
  
  try {
    // Get quotation details
    const quotation = await pg.query(`
      SELECT q.*, bo.*, u.full_name as seller_name
      FROM quotations q
      JOIN bulk_orders bo ON q.bulk_order_id = bo.id
      JOIN users u ON q.seller_id = u.id
      WHERE q.id = $1
    `, [quotationId]);
    
    if (quotation.rows.length === 0) {
      throw new Error('Quotation not found');
    }
    
    const qtData = quotation.rows[0];
    
    // Update quotation status
    await pg.query(`
      UPDATE quotations 
      SET status = 'accepted', updated_at = NOW()
      WHERE id = $1
    `, [quotationId]);
    
    // Create actual order from quotation
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const order = {
      id: orderId,
      user_id: buyerId,
      seller_id: qtData.seller_id,
      order_type: 'B2B',
      bulk_order_id: qtData.bulk_order_id,
      quotation_id: quotationId,
      total_amount: qtData.quoted_price * qtData.available_quantity,
      quantity: qtData.available_quantity,
      unit: qtData.unit,
      delivery_date: qtData.delivery_date,
      delivery_cost: qtData.delivery_cost,
      status: 'confirmed',
      created_at: new Date().toISOString()
    };
    
    // Store order
    await pg.query(`
      INSERT INTO orders 
      (id, user_id, seller_id, order_type, bulk_order_id, quotation_id, total_amount, quantity, unit, delivery_date, delivery_cost, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
    `, [orderId, buyerId, qtData.seller_id, 'B2B', qtData.bulk_order_id, quotationId, order.total_amount, 
        order.quantity, order.unit, order.delivery_date, order.delivery_cost, 'confirmed']);
    
    // Update bulk order status
    await pg.query(`
      UPDATE bulk_orders 
      SET status = 'accepted', updated_at = NOW()
      WHERE id = $1
    `, [qtData.bulk_order_id]);
    
    // Emit signal bus event
    await signalBus.emit('b2b.order.created', {
      order_id: orderId,
      quotation_id: quotationId,
      bulk_order_id: qtData.bulk_order_id,
      buyer_id: buyerId,
      seller_id: qtData.seller_id,
      total_amount: order.total_amount,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Quotation accepted and order created', { orderId, quotationId });
    
    return {
      success: true,
      order
    };
  } catch (error) {
    logger.error('Error accepting quotation', { error: error.message });
    throw error;
  }
}

// ============================================================================
// CONTRACT FARMING INTEGRATION
// ============================================================================

/**
 * Create contract farming agreement
 */
async function createContractFarming(buyerId, contractData) {
  const pg = getPostgreSQL();
  
  try {
    const {
      farmer_id,
      crop_type,
      variety,
      contract_quantity,
      unit,
      agreed_price,
      contract_start_date,
      contract_end_date,
      quality_standards,
      delivery_schedule,
      payment_terms,
      milestone_payments
    } = contractData;
    
    // Generate contract ID
    const contractId = `CF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const contract = {
      id: contractId,
      buyer_id: buyerId,
      farmer_id,
      crop_type,
      variety,
      contract_quantity,
      unit,
      agreed_price,
      contract_start_date,
      contract_end_date,
      quality_standards: JSON.stringify(quality_standards),
      delivery_schedule: JSON.stringify(delivery_schedule),
      payment_terms,
      milestone_payments: JSON.stringify(milestone_payments),
      status: 'active',
      created_at: new Date().toISOString()
    };
    
    // Store contract
    await pg.query(`
      INSERT INTO contract_farming 
      (id, buyer_id, farmer_id, crop_type, variety, contract_quantity, unit, agreed_price, 
       contract_start_date, contract_end_date, quality_standards, delivery_schedule, payment_terms, milestone_payments, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
    `, [contractId, buyerId, farmer_id, crop_type, variety, contract_quantity, unit, agreed_price,
        contract_start_date, contract_end_date, JSON.stringify(quality_standards), JSON.stringify(delivery_schedule),
        payment_terms, JSON.stringify(milestone_payments), 'active']);

    // Emit signal bus event
    await signalBus.emit('b2b.contract_farming.created', {
      contract_id: contractId,
      buyer_id: buyerId,
      farmer_id,
      contract_value: contract_quantity * agreed_price,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Contract farming agreement created', { contractId });
    
    return {
      success: true,
      contract
    };
  } catch (error) {
    logger.error('Error creating contract farming agreement', { error: error.message });
    throw error;
  }
}

/**
 * Record contract milestone
 */
async function recordContractMilestone(contractId, milestoneData) {
  const pg = getPostgreSQL();
  
  try {
    const {
      milestone_name,
      milestone_date,
      quantity_delivered,
      quality_verified,
      payment_amount,
      payment_status
    } = milestoneData;
    
    // Generate milestone ID
    const milestoneId = `MS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const milestone = {
      id: milestoneId,
      contract_id: contractId,
      milestone_name,
      milestone_date,
      quantity_delivered,
      quality_verified,
      payment_amount,
      payment_status,
      created_at: new Date().toISOString()
    };
    
    // Store milestone
    await pg.query(`
      INSERT INTO contract_milestones 
      (id, contract_id, milestone_name, milestone_date, quantity_delivered, quality_verified, payment_amount, payment_status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `, [milestoneId, contractId, milestone_name, milestone_date, quantity_delivered, quality_verified, 
        payment_amount, payment_status]);
    
    // Update contract status if all milestones complete
    await pg.query(`
      UPDATE contract_farming 
      SET status = 'completed', updated_at = NOW()
      WHERE id = $1 AND (SELECT COUNT(*) FROM contract_milestones WHERE contract_id = $1) = 
        (SELECT milestone_payments::jsonb->>'length' FROM contract_farming WHERE id = $1)
    `, [contractId]);
    
    logger.info('Contract milestone recorded', { milestoneId, contractId });
    
    return {
      success: true,
      milestone
    };
  } catch (error) {
    logger.error('Error recording contract milestone', { error: error.message });
    throw error;
  }
}

// ============================================================================
// SALES ANALYTICS
// ============================================================================

/**
 * Get comprehensive sales analytics
 */
async function getSalesAnalytics(filters = {}) {
  const pg = getPostgreSQL();
  
  try {
    const {
      start_date,
      end_date,
      category_id,
      seller_id,
      business_type
    } = filters;
    
    // Build base query
    let query = `
      SELECT 
        DATE_TRUNC('day', o.created_at) as date,
        COUNT(DISTINCT o.id) as total_orders,
        COUNT(DISTINCT o.user_id) as unique_customers,
        SUM(oi.quantity * oi.unit_price) as total_revenue,
        AVG(oi.quantity * oi.unit_price) as avg_order_value,
        SUM(oi.quantity) as total_quantity_sold
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN product_listings pl ON oi.product_id = pl.id
      WHERE o.status = 'completed'
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (start_date) {
      paramCount++;
      query += ` AND o.created_at >= $${paramCount}`;
      params.push(start_date);
    }
    
    if (end_date) {
      paramCount++;
      query += ` AND o.created_at <= $${paramCount}`;
      params.push(end_date);
    }
    
    if (category_id) {
      paramCount++;
      query += ` AND pl.category_id = $${paramCount}`;
      params.push(category_id);
    }
    
    if (seller_id) {
      paramCount++;
      query += ` AND o.seller_id = $${paramCount}`;
      params.push(seller_id);
    }
    
    if (business_type) {
      paramCount++;
      query += ` AND o.order_type = $${paramCount}`;
      params.push(business_type);
    }
    
    query += ` GROUP BY DATE_TRUNC('day', o.created_at)
               ORDER BY date ASC`;
    
    const result = await pg.query(query, params);
    
    // Calculate summary statistics
    const summary = result.rows.reduce((acc, row) => {
      acc.total_orders += parseInt(row.total_orders);
      acc.total_revenue += parseFloat(row.total_revenue);
      acc.unique_customers += parseInt(row.unique_customers);
      acc.total_quantity += parseFloat(row.total_quantity_sold);
      return acc;
    }, { total_orders: 0, total_revenue: 0, unique_customers: 0, total_quantity: 0 });
    
    logger.info('Sales analytics generated', { summary });
    
    return {
      success: true,
      filters,
      summary,
      daily_data: result.rows
    };
  } catch (error) {
    logger.error('Error generating sales analytics', { error: error.message });
    throw error;
  }
}

/**
 * Get B2B conversion metrics
 */
async function getB2BConversionMetrics(periodDays = 30) {
  const pg = getPostgreSQL();
  
  try {
    const metrics = await pg.query(`
      WITH funnel AS (
        SELECT 
          COUNT(DISTINCT id) as bulk_orders_created,
          COUNT(DISTINCT CASE WHEN quotation_count > 0 THEN id END) as received_quotations,
          COUNT(DISTINCT CASE WHEN status = 'accepted' THEN id END) as accepted_orders,
          COUNT(DISTINCT CASE WHEN status = 'completed' THEN id END) as completed_orders
        FROM bulk_orders
        WHERE created_at > NOW() - INTERVAL '${periodDays} days'
      )
      SELECT 
        bulk_orders_created,
        received_quotations,
        accepted_orders,
        completed_orders,
        CASE WHEN bulk_orders_created > 0 
          THEN ROUND((received_quotations::FLOAT / bulk_orders_created) * 100, 2) 
          ELSE 0 END as quotation_response_rate,
        CASE WHEN received_quotations > 0 
          THEN ROUND((accepted_orders::FLOAT / received_quotations) * 100, 2) 
          ELSE 0 END as acceptance_rate,
        CASE WHEN accepted_orders > 0 
          THEN ROUND((completed_orders::FLOAT / accepted_orders) * 100, 2) 
          ELSE 0 END as completion_rate
      FROM funnel
    `);
    
    return {
      success: true,
      period_days: periodDays,
      metrics: metrics.rows[0]
    };
  } catch (error) {
    logger.error('Error getting B2B conversion metrics', { error: error.message });
    throw error;
  }
}

// ============================================================================
// COMMISSION MANAGEMENT
// ============================================================================

/**
 * Calculate platform commission for order
 */
async function calculateCommission(orderId) {
  const pg = getPostgreSQL();
  
  try {
    // Get order details
    const order = await pg.query(`
      SELECT 
        o.*,
        o.total_amount,
        u.tier as seller_tier
      FROM orders o
      JOIN users u ON o.seller_id = u.id
      WHERE o.id = $1
    `, [orderId]);
    
    if (order.rows.length === 0) {
      throw new Error('Order not found');
    }
    
    const orderData = order.rows[0];
    const totalAmount = parseFloat(orderData.total_amount);
    
    // Calculate commission based on seller tier
    const commissionRates = {
      'platinum': 0.05,  // 5%
      'gold': 0.07,      // 7%
      'silver': 0.10,    // 10%
      'bronze': 0.12     // 12%
    };
    
    const commissionRate = commissionRates[orderData.seller_tier] || 0.10;
    const commissionAmount = totalAmount * commissionRate;
    const sellerPayout = totalAmount - commissionAmount;
    
    const commission = {
      order_id: orderId,
      total_amount: totalAmount,
      commission_rate: commissionRate,
      commission_amount: Math.round(commissionAmount * 100) / 100,
      seller_payout: Math.round(sellerPayout * 100) / 100,
      seller_tier: orderData.seller_tier,
      calculated_at: new Date().toISOString()
    };
    
    // Store commission
    await pg.query(`
      INSERT INTO platform_commissions 
      (order_id, total_amount, commission_rate, commission_amount, seller_payout, seller_tier, calculated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (order_id) 
      DO UPDATE SET commission_amount = $4, seller_payout = $5, updated_at = NOW()
    `, [orderId, totalAmount, commissionRate, commissionAmount, sellerPayout, orderData.seller_tier]);
    
    logger.info('Commission calculated', { orderId, commission_amount: commissionAmount });
    
    return {
      success: true,
      commission
    };
  } catch (error) {
    logger.error('Error calculating commission', { error: error.message, orderId });
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // B2B Bulk Orders
  createBulkOrder,
  findPotentialSellers,
  submitQuotation,
  acceptQuotation,
  
  // Contract Farming
  createContractFarming,
  recordContractMilestone,
  
  // Sales Analytics
  getSalesAnalytics,
  getB2BConversionMetrics,
  
  // Commission Management
  calculateCommission
};



