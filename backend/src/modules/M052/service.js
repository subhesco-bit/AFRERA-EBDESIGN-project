/**
 * Product Catalog Service (M052)
 * Product catalog management with AI-powered recommendations and categorization
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/legacy/aiService');
const pool = require('../../database/pool');

/**
 * Create product with AI-powered categorization
 */
async function createProduct(productData) {
  try {
    const {
      name,
      description,
      category,
      subcategory,
      sku,
      price,
      cost_price,
      unit,
      quantity,
      images,
      attributes,
      tags,
      supplier_id,
      fpo_id,
      metadata
    } = productData;

    const product = {
      product_id: generateId(),
      name,
      description,
      category,
      subcategory,
      sku,
      price,
      cost_price,
      unit,
      quantity,
      images,
      attributes,
      tags,
      supplier_id,
      fpo_id,
      status: 'active',
      created_at: new Date().toISOString()
    };

    // AI-powered product optimization
    const aiRequest = {
      task: 'product_optimization',
      parameters: {
        product_data: productData,
        market_analysis: await getMarketAnalysis(category),
        pricing_recommendations: await getPricingRecommendations(price, cost_price, category),
        seo_suggestions: await getSEOSuggestions(name, description),
        cross_sell_opportunities: await getCrossSellOpportunities(category, tags)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    product.ai_recommendations = aiResponse;

    // Insert into database
    const result = await pool.query(
      `INSERT INTO products 
       (product_id, name, description, category, subcategory, sku, price, 
        cost_price, unit, quantity, images, attributes, tags, supplier_id, 
        fpo_id, status, ai_recommendations, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       RETURNING *`,
      [
        product.product_id,
        product.name,
        product.description,
        product.category,
        product.subcategory,
        product.sku,
        product.price,
        product.cost_price,
        product.unit,
        product.quantity,
        JSON.stringify(product.images || []),
        JSON.stringify(product.attributes || {}),
        JSON.stringify(product.tags || []),
        product.supplier_id,
        product.fpo_id,
        product.status,
        JSON.stringify(product.ai_recommendations),
        JSON.stringify(metadata || {}),
        product.created_at
      ]
    );

    logger.info(`Product created: ${product.product_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating product', { error: error.message, stack: error.stack });
    throw new Error('Failed to create product');
  }
}

/**
 * List products with filtering
 */
async function listProducts({ page = 1, limit = 20, category = null, status = null, supplierId = null, fpoId = null } = {}) {
  try {
    const offset = (page - 1) * limit;
    
    let countQuery = 'SELECT COUNT(*) FROM products';
    let countParams = [];
    let conditions = [];
    
    if (category) {
      conditions.push('category = $' + (conditions.length + 1));
      countParams.push(category);
    }
    if (status) {
      conditions.push('status = $' + (conditions.length + 1));
      countParams.push(status);
    }
    if (supplierId) {
      conditions.push('supplier_id = $' + (conditions.length + 1));
      countParams.push(supplierId);
    }
    if (fpoId) {
      conditions.push('fpo_id = $' + (conditions.length + 1));
      countParams.push(fpoId);
    }
    
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    const totalRes = await pool.query(countQuery, countParams);
    const total = parseInt(totalRes.rows[0].count || '0');
    
    let dataQuery = 'SELECT * FROM products';
    let dataParams = [...countParams];
    
    if (conditions.length > 0) {
      dataQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    dataQuery += ' ORDER BY created_at DESC LIMIT $' + (dataParams.length + 1) + ' OFFSET $' + (dataParams.length + 2);
    dataParams.push(limit, offset);
    
    const res = await pool.query(dataQuery, dataParams);
    return { items: res.rows, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } };
  } catch (error) {
    logger.error('Error listing products', { error: error.message });
    throw new Error('Failed to list products');
  }
}

/**
 * Get product by ID
 */
async function getProduct(productId) {
  try {
    const res = await pool.query('SELECT * FROM products WHERE product_id = $1', [productId]);
    return res.rows[0] || null;
  } catch (error) {
    logger.error('Error getting product', { error: error.message });
    throw new Error('Failed to get product');
  }
}

/**
 * Update product
 */
async function updateProduct(productId, updates) {
  try {
    const {
      name,
      description,
      category,
      subcategory,
      sku,
      price,
      cost_price,
      unit,
      quantity,
      images,
      attributes,
      tags,
      status,
      metadata
    } = updates;

    const result = await pool.query(
      `UPDATE products 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           category = COALESCE($3, category),
           subcategory = COALESCE($4, subcategory),
           sku = COALESCE($5, sku),
           price = COALESCE($6, price),
           cost_price = COALESCE($7, cost_price),
           unit = COALESCE($8, unit),
           quantity = COALESCE($9, quantity),
           images = COALESCE($10, images::jsonb),
           attributes = COALESCE($11, attributes::jsonb),
           tags = COALESCE($12, tags::jsonb),
           status = COALESCE($13, status),
           metadata = COALESCE($14, metadata::jsonb),
           updated_at = NOW()
       WHERE product_id = $15
       RETURNING *`,
      [
        name, description, category, subcategory, sku, price, cost_price,
        unit, quantity,
        images ? JSON.stringify(images) : null,
        attributes ? JSON.stringify(attributes) : null,
        tags ? JSON.stringify(tags) : null,
        status,
        metadata ? JSON.stringify(metadata) : null,
        productId
      ]
    );
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error updating product', { error: error.message });
    throw new Error('Failed to update product');
  }
}

/**
 * Delete product
 */
async function deleteProduct(productId) {
  try {
    const res = await pool.query('DELETE FROM products WHERE product_id = $1 RETURNING product_id', [productId]);
    return !!res.rows[0];
  } catch (error) {
    logger.error('Error deleting product', { error: error.message });
    throw new Error('Failed to delete product');
  }
}

/**
 * Update inventory
 */
async function updateInventory(productId, quantity, operation = 'set') {
  try {
    let query;
    let params;

    if (operation === 'add') {
      query = 'UPDATE products SET quantity = quantity + $1 WHERE product_id = $2 RETURNING *';
      params = [quantity, productId];
    } else if (operation === 'subtract') {
      query = 'UPDATE products SET quantity = quantity - $1 WHERE product_id = $2 RETURNING *';
      params = [quantity, productId];
    } else {
      query = 'UPDATE products SET quantity = $1 WHERE product_id = $2 RETURNING *';
      params = [quantity, productId];
    }

    const res = await pool.query(query, params);
    return res.rows[0] || null;
  } catch (error) {
    logger.error('Error updating inventory', { error: error.message });
    throw new Error('Failed to update inventory');
  }
}

/**
 * Search products with AI-powered relevance
 */
async function searchProducts(query, filters = {}) {
  try {
    const aiRequest = {
      task: 'product_search_optimization',
      parameters: {
        search_query: query,
        filters: filters,
        user_preferences: await getUserSearchPreferences(),
        trending_products: await getTrendingProducts()
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);

    const searchResults = {
      search_id: generateId(),
      query,
      filters,
      timestamp: new Date().toISOString(),
      results: await executeProductSearch(query, filters),
      ai_rankings: aiResponse.rankings,
      suggested_alternatives: aiResponse.alternatives,
      search_recommendations: aiResponse.recommendations
    };

    return searchResults;
  } catch (error) {
    logger.error('Error searching products', { error: error.message });
    throw new Error('Failed to search products');
  }
}

/**
 * Get product recommendations
 */
async function getProductRecommendations(productId, userId = null) {
  try {
    const product = await getProduct(productId);
    
    const aiRequest = {
      task: 'product_recommendations',
      parameters: {
        product_data: product,
        user_history: userId ? await getUserPurchaseHistory(userId) : null,
        category_products: await getProductsByCategory(product.category),
        trending_products: await getTrendingProducts(),
        seasonal_factors: await getSeasonalFactors()
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);

    return {
      recommendation_id: generateId(),
      product_id: productId,
      user_id: userId,
      generated_at: new Date().toISOString(),
      cross_sell: aiResponse.cross_sell,
      up_sell: aiResponse.up_sell,
      related_products: aiResponse.related,
      frequently_bought_together: aiResponse.bundles
    };
  } catch (error) {
    logger.error('Error getting product recommendations', { error: error.message });
    throw new Error('Failed to get product recommendations');
  }
}

// Helper functions
function generateId() {
  return `PRD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function getMarketAnalysis(category) {
  return {
    demand_level: 'high',
    competition_level: 'moderate',
    average_price: 100,
    price_range: { min: 50, max: 200 },
    growth_trend: 'increasing'
  };
}

async function getPricingRecommendations(price, costPrice, category) {
  const margin = ((price - costPrice) / costPrice) * 100;
  return {
    current_margin: margin,
    recommended_margin: 30,
    suggested_price: costPrice * 1.3,
    pricing_strategy: margin < 20 ? 'increase' : margin > 50 ? 'competitive' : 'maintain'
  };
}

async function getSEOSuggestions(name, description) {
  return {
    title: name,
    meta_description: description.substring(0, 160),
    keywords: [name.toLowerCase(), ...name.split(' ')],
    alt_text_suggestions: [name + ' product image']
  };
}

async function getCrossSellOpportunities(category, tags) {
  return [
    'Related accessories',
    'Complementary products',
    'Bundle options'
  ];
}

async function getUserSearchPreferences() {
  return {
    price_range: { min: 0, max: 1000 },
    preferred_categories: [],
    recent_searches: []
  };
}

async function getTrendingProducts() {
  return [];
}

async function executeProductSearch(query, filters) {
  const searchQuery = `%${query}%`;
  let sql = 'SELECT * FROM products WHERE (name ILIKE $1 OR description ILIKE $1 OR category ILIKE $1)';
  let params = [searchQuery];
  let paramIndex = 2;

  if (filters.category) {
    sql += ` AND category = $${paramIndex}`;
    params.push(filters.category);
    paramIndex++;
  }
  if (filters.minPrice) {
    sql += ` AND price >= $${paramIndex}`;
    params.push(filters.minPrice);
    paramIndex++;
  }
  if (filters.maxPrice) {
    sql += ` AND price <= $${paramIndex}`;
    params.push(filters.maxPrice);
    paramIndex++;
  }

  sql += ' ORDER BY created_at DESC LIMIT 50';

  const res = await pool.query(sql, params);
  return res.rows;
}

async function getUserPurchaseHistory(userId) {
  return [];
}

async function getProductsByCategory(category) {
  const res = await pool.query('SELECT * FROM products WHERE category = $1 LIMIT 20', [category]);
  return res.rows;
}

async function getSeasonalFactors() {
  return {
    current_season: 'monsoon',
    demand_factors: ['rainfall', 'harvest_season', 'festivals']
  };
}

module.exports = {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  updateInventory,
  searchProducts,
  getProductRecommendations
};
