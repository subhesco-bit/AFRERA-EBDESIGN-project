/**
 * Product & Catalog Service
 * Manages product catalog, categories, and inventory
 */

const { logger } = require('..\/utils\/logger');
const { getPostgreSQL } = require('..\/database\/connection');
const { authMiddleware } = require('..\/middleware\/auth');
const productMediaAIService = require('./productMediaAIService');

/**
 * Get all products with filtering and pagination
 */
async function getProducts(filters = {}, pagination = {}) {
  try {
    const pg = getPostgreSQL();
    
    // Validate database connection
    if (!pg) {
      throw new Error('Database connection not available');
    }
    
    const {
      category_id,
      state_id,
      gi_status,
      organic,
      search,
      min_price,
      max_price,
      is_active
    } = filters;
    
    const {
      page = 1,
      limit = 24,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = pagination;
    
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      throw new Error('Invalid pagination parameters');
    }
    
    const offset = (page - 1) * limit;
    
    // Build query
    let query = `
      SELECT p.*, c.name as category_name, s.name as state_name, u.symbol as unit_symbol
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN states s ON p.state_id = s.id
      LEFT JOIN units u ON p.unit_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    // Add filters
    if (category_id) {
      paramCount++;
      query += ` AND p.category_id = $${paramCount}`;
      params.push(category_id);
    }
    
    if (state_id) {
      paramCount++;
      query += ` AND p.state_id = $${paramCount}`;
      params.push(state_id);
    }
    
    if (gi_status !== undefined) {
      paramCount++;
      query += ` AND p.gi_status = $${paramCount}`;
      params.push(gi_status);
    }
    
    if (organic !== undefined) {
      paramCount++;
      query += ` AND p.organic = $${paramCount}`;
      params.push(organic);
    }
    
    if (is_active !== undefined) {
      paramCount++;
      query += ` AND p.is_active = $${paramCount}`;
      params.push(is_active);
    }
    
    if (min_price) {
      paramCount++;
      query += ` AND p.base_price >= $${paramCount}`;
      params.push(min_price);
    }
    
    if (max_price) {
      paramCount++;
      query += ` AND p.base_price <= $${paramCount}`;
      params.push(max_price);
    }
    
    if (search) {
      paramCount++;
      query += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount} OR p.usp ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }
    
    // Get total count
    const countQuery = query.replace(/SELECT p\.\*, c\.name as category_name, s\.name as state_name, u\.symbol as unit_symbol/, 'SELECT COUNT(*)');
    const countResult = await pg.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    // Add sorting and pagination
    const validSortColumns = ['created_at', 'name', 'base_price', 'gi_status'];
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const sortOrder = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY p.${sortColumn} ${sortOrder}`;
    query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);
    
    const result = await pg.query(query, params);
    
    return {
      products: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error fetching products', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get product by ID
 */
async function getProductById(productId) {
  try {
    let pg = getPostgreSQL();
    
    // Validate database connection
    if (!pg) {
      throw new Error('Database connection not available');
    }
    
    // Validate product ID
    if (!productId) {
      throw new Error('Product ID is required');
    }
    
    const query = `
      SELECT p.*, c.name as category_name, s.name as state_name, u.symbol as unit_symbol,
             (SELECT json_agg(json_build_object('id', id, 'type', certification_type, 'certificate_number', certificate_number, 'expiry_date', expiry_date))
              FROM certifications WHERE product_id = p.id) as certifications
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN states s ON p.state_id = s.id
      LEFT JOIN units u ON p.unit_id = u.id
      WHERE p.id = $1
    `;
    
    let result = await pg.query(query, [productId]);
    
    if (result.rows.length === 0) {
      throw new Error('Product not found');
    }
    
    return result.rows[0];
  } catch (error) {
    logger.error('Error fetching product', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Create new product
 */
async function createProduct(productData) {
  try {
    let pg = getPostgreSQL();
    
    let query = `
      INSERT INTO products (name, slug, sku, category_id, state_id, unit_id, description, usp,
                         gi_status, gi_certificate_number, gi_registry_date, organic,
                         organic_certificate_number, nutrition_data, images, base_price,
                         map_price, retail_price, weight_per_unit, dimensions, tags,
                         meta_title, meta_description, is_active, featured, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
      RETURNING *
    `;
    
    const values = [
      productData.name,
      generateSlug(productData.name),
      productData.sku || null,
      productData.category_id || null,
      productData.state_id || null,
      productData.unit_id || null,
      productData.description || null,
      productData.usp || null,
      productData.gi_status || false,
      productData.gi_certificate_number || null,
      productData.gi_registry_date || null,
      productData.organic || false,
      productData.organic_certificate_number || null,
      JSON.stringify(productData.nutrition_data || {}),
      JSON.stringify(productData.images || []),
      productData.base_price,
      productData.map_price || null,
      productData.retail_price || null,
      productData.weight_per_unit || null,
      JSON.stringify(productData.dimensions || {}),
      productData.tags || [],
      productData.meta_title || null,
      productData.meta_description || null,
      productData.is_active !== undefined ? productData.is_active : true,
      productData.featured || false,
      productData.created_by || null
    ];
    
    let result = await pg.query(query, values);
    const product = result.rows[0];

    logger.info(`Product created: ${product.name} (${product.id})`);

    // Best-effort AI image generation when the product was created with no
    // images — never blocks or fails product creation. Its real outcome
    // (including "not_configured", if no provider key is set) is recorded
    // honestly on the row by requestProductImageGeneration itself.
    if (!productData.images || productData.images.length === 0) {
      productMediaAIService
        .requestProductImageGeneration(product.id, `${product.name}${productData.description ? ' — ' + productData.description : ''}`)
        .catch((error) => logger.warn('Product image generation request failed', { productId: product.id, error: error.message }));
    }

    return product;
  } catch (error) {
    logger.error('Error creating product', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Update product
 */
async function updateProduct(productId, productData, ownerUserId = null) {
  try {
    let pg = getPostgreSQL();

    if (ownerUserId) {
      const owned = await pg.query('SELECT 1 FROM products WHERE id = $1 AND created_by = $2', [productId, ownerUserId]);
      if (owned.rows.length === 0) {
        // Deliberately the same error as "doesn't exist" — confirming that a
        // product ID exists but belongs to someone else is its own leak.
        throw new Error('Product not found');
      }
    }

    let query = `
      UPDATE products
      SET name = COALESCE($1, name),
          slug = COALESCE($2, slug),
          sku = COALESCE($3, sku),
          category_id = COALESCE($4, category_id),
          state_id = COALESCE($5, state_id),
          unit_id = COALESCE($6, unit_id),
          description = COALESCE($7, description),
          usp = COALESCE($8, usp),
          gi_status = COALESCE($9, gi_status),
          gi_certificate_number = COALESCE($10, gi_certificate_number),
          gi_registry_date = COALESCE($11, gi_registry_date),
          organic = COALESCE($12, organic),
          organic_certificate_number = COALESCE($13, organic_certificate_number),
          nutrition_data = COALESCE($14, nutrition_data::jsonb, nutrition_data),
          images = COALESCE($15, images::jsonb, images),
          base_price = COALESCE($16, base_price),
          map_price = COALESCE($17, map_price),
          retail_price = COALESCE($18, retail_price),
          weight_per_unit = COALESCE($19, weight_per_unit),
          dimensions = COALESCE($20, dimensions::jsonb, dimensions),
          tags = COALESCE($21, tags),
          meta_title = COALESCE($22, meta_title),
          meta_description = COALESCE($23, meta_description),
          is_active = COALESCE($24, is_active),
          featured = COALESCE($25, featured),
          updated_at = NOW()
      WHERE id = $26
      RETURNING *
    `;
    
    let values = [
      productData.name,
      productData.slug,
      productData.sku,
      productData.category_id,
      productData.state_id,
      productData.unit_id,
      productData.description,
      productData.usp,
      productData.gi_status,
      productData.gi_certificate_number,
      productData.gi_registry_date,
      productData.organic,
      productData.organic_certificate_number,
      JSON.stringify(productData.nutrition_data || {}),
      JSON.stringify(productData.images || []),
      productData.base_price,
      productData.map_price,
      productData.retail_price,
      productData.weight_per_unit,
      JSON.stringify(productData.dimensions || {}),
      productData.tags,
      productData.meta_title,
      productData.meta_description,
      productData.is_active,
      productData.featured,
      productId
    ];
    
    let result = await pg.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Product not found');
    }
    
    logger.info(`Product updated: ${result.rows[0].name} (${productId})`);
    
    return result.rows[0];
  } catch (error) {
    logger.error('Error updating product', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Delete product (soft delete)
 */
async function deleteProduct(productId, ownerUserId = null) {
  try {
    let pg = getPostgreSQL();

    if (ownerUserId) {
      let owned = await pg.query('SELECT 1 FROM products WHERE id = $1 AND created_by = $2', [productId, ownerUserId]);
      if (owned.rows.length === 0) {
        throw new Error('Product not found');
      }
    }

    let query = `
      UPDATE products
      SET is_active = FALSE, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    let result = await pg.query(query, [productId]);
    
    if (result.rows.length === 0) {
      throw new Error('Product not found');
    }
    
    logger.info(`Product deleted: ${result.rows[0].name} (${productId})`);
    
    return result.rows[0];
  } catch (error) {
    logger.error('Error deleting product', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get all categories
 */
async function getCategories() {
  try {
    let pg = getPostgreSQL();
    
    let query = `
      SELECT c.*, 
             (SELECT COUNT(*) FROM products WHERE category_id = c.id AND is_active = TRUE) as product_count
      FROM categories c
      WHERE c.is_active = TRUE
      ORDER BY c.sort_order, c.name
    `;
    
    let result = await pg.query(query);
    
    return result.rows;
  } catch (error) {
    logger.error('Error fetching categories', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get all states
 */
async function getStates() {
  try {
    let pg = getPostgreSQL();
    
    let query = `
      SELECT s.*,
             (SELECT COUNT(*) FROM products WHERE state_id = s.id AND is_active = TRUE) as product_count
      FROM states s
      WHERE s.is_active = TRUE
      ORDER BY s.name
    `;
    
    let result = await pg.query(query);
    
    return result.rows;
  } catch (error) {
    logger.error('Error fetching states', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Search products
 */
async function searchProducts(searchTerm, filters = {}) {
  try {
    let pg = getPostgreSQL();
    
    let query = `
      SELECT p.*, c.name as category_name, s.name as state_name,
             ts_rank(to_tsvector('english', p.name || ' ' || COALESCE(p.description, '')), 
                    plainto_tsquery('english', $1)) as rank
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN states s ON p.state_id = s.id
      WHERE p.is_active = TRUE
        AND to_tsvector('english', p.name || ' ' || COALESCE(p.description, '')) @@ plainto_tsquery('english', $1)
      ORDER BY rank DESC, p.name
      LIMIT 50
    `;
    
    let result = await pg.query(query, [searchTerm]);
    
    return result.rows;
  } catch (error) {
    logger.error('Error searching products', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Helper function to generate slug
 */
function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Express router for product service
 */
const express = require('express');
const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const filters = {
      category_id: req.query.category_id,
      state_id: req.query.state_id,
      gi_status: req.query.gi_status === 'true' ? true : req.query.gi_status === 'false' ? false : undefined,
      organic: req.query.organic === 'true' ? true : req.query.organic === 'false' ? false : undefined,
      search: req.query.search,
      min_price: req.query.min_price,
      max_price: req.query.max_price,
      is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined
    };
    
    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 24,
      sort_by: req.query.sort_by,
      sort_order: req.query.sort_order
    };
    
    let result = await getProducts(filters, pagination);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    let product = await getProductById(req.params.id);
    res.json(product);
  } catch (error) {
    if (error.message === 'Product not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Create product
router.post('/', authMiddleware, async (req, res) => {
  try {
    let product = await createProduct(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update product — ownership enforced: only the product's creator or an
// admin may edit it (was previously any authenticated user, any product).
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    let product = await updateProduct(req.params.id, req.body, isAdmin ? null : req.user.id);
    res.json(product);
  } catch (error) {
    if (error.message === 'Product not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// Delete product — same ownership rule as update.
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    let isAdmin = req.user.role === 'admin';
    let product = await deleteProduct(req.params.id, isAdmin ? null : req.user.id);
    res.json(product);
  } catch (error) {
    if (error.message === 'Product not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Get categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get states
router.get('/states/list', async (req, res) => {
  try {
    const states = await getStates();
    res.json(states);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search products
router.get('/search', async (req, res) => {
  try {
    const searchTerm = req.query.q;
    if (!searchTerm) {
      return res.status(400).json({ error: 'Search term required' });
    }

    const products = await searchProducts(searchTerm);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger (or retry) AI image generation for a product
router.post('/:id/generate-image', authMiddleware, async (req, res) => {
  try {
    let product = await getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    let result = await productMediaAIService.requestProductImageGeneration(
      req.params.id,
      `${product.name}${product.description ? ' — ' + product.description : ''}`
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Real, computed nutrient-comparison video script (no external AI required)
router.get('/:id/video-script', async (req, res) => {
  try {
    const script = await productMediaAIService.buildNutrientComparisonScript(req.params.id);
    res.json(script);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger (or retry) AI video rendering from the real script above
router.post('/:id/generate-video', authMiddleware, async (req, res) => {
  try {
    let result = await productMediaAIService.requestProductVideoGeneration(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = {
  router,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getStates,
  searchProducts
};


