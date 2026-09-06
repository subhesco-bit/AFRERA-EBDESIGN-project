/**
 * North East India Varieties API Routes
 * Complete variety directory with AI-generated images
 *
 * Endpoints:
 * GET  /api/v1/varieties - List all varieties with pagination
 * GET  /api/v1/varieties/:id - Get single variety details
 * GET  /api/v1/varieties/category/:category - Get varieties by category
 * GET  /api/v1/varieties/region/:region - Get varieties by region
 * GET  /api/v1/varieties/gi-tags - Get GI-tagged varieties only
 */

const express = require('express');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/v1/varieties
 * List all North East India varieties with pagination
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 20, max: 100)
 * - category: Filter by category
 * - region: Filter by region
 * - gi_tag: Filter by GI tag status (true/false)
 * - search: Search by name or description
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      region,
      gi_tag,
      search,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const queryLimit = Math.min(parseInt(limit), 100); // Cap at 100

    // Build WHERE clause dynamically
    const whereConditions = [];
    const params = [];
    let paramIndex = 1;

    if (category) {
      whereConditions.push(`category = $${paramIndex++}`);
      params.push(category);
    }

    if (region) {
      whereConditions.push(`region @> $${paramIndex++}::jsonb`);
      params.push(JSON.stringify([region]));
    }

    if (gi_tag !== undefined) {
      whereConditions.push(`gi_tag = $${paramIndex++}`);
      params.push(gi_tag === 'true');
    }

    if (search) {
      whereConditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ?
      `WHERE ${whereConditions.join(' AND ')}` :
      '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM ne_variety_products ${whereClause}`;
    const countResult = await req.app.locals.db?.query(countQuery, params);
    const total = countResult?.rows[0]?.total || 0;

    // Get paginated results
    const dataQuery = `
      SELECT
        id,
        name,
        scientific_name,
        category,
        region,
        description,
        gi_tag,
        gi_tag_status,
        commercial_varieties,
        niche_market,
        image_url,
        created_at
      FROM ne_variety_products
      ${whereClause}
      ORDER BY name ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(queryLimit, offset);

    const result = await req.app.locals.db?.query(dataQuery, params);
    const varieties = result?.rows || [];

    res.json({
      success: true,
      data: varieties,
      pagination: {
        page: parseInt(page),
        limit: queryLimit,
        total,
        totalPages: Math.ceil(total / queryLimit),
        hasMore: offset + queryLimit < total,
      },
    });

  } catch (err) {
    logger.error('Error fetching varieties', { error: err.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch varieties',
      message: err.message,
    });
  }
});

/**
 * GET /api/v1/varieties/:id
 * Get detailed information about a specific variety
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        *
      FROM ne_variety_products
      WHERE id = $1
    `;

    const result = await req.app.locals.db?.query(query, [id]);

    if (!result?.rows || result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Variety not found',
        varietyId: id,
      });
    }

    const variety = result.rows[0];

    res.json({
      success: true,
      data: variety,
    });

  } catch (err) {
    logger.error('Error fetching variety', { error: err.message, varietyId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch variety',
      message: err.message,
    });
  }
});

/**
 * GET /api/v1/varieties/category/:category
 * Get all varieties in a specific category
 */
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM ne_variety_products
      WHERE category = $1
    `;

    const countResult = await req.app.locals.db?.query(countQuery, [category]);
    const total = countResult?.rows[0]?.total || 0;

    const query = `
      SELECT
        id,
        name,
        scientific_name,
        category,
        region,
        description,
        gi_tag,
        niche_market,
        image_url,
        created_at
      FROM ne_variety_products
      WHERE category = $1
      ORDER BY name ASC
      LIMIT $2 OFFSET $3
    `;

    const result = await req.app.locals.db?.query(query, [category, limit, offset]);
    const varieties = result?.rows || [];

    res.json({
      success: true,
      category,
      data: varieties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (err) {
    logger.error('Error fetching varieties by category', { error: err.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch varieties',
      message: err.message,
    });
  }
});

/**
 * GET /api/v1/varieties/region/:region
 * Get all varieties from a specific region
 */
router.get('/region/:region', async (req, res) => {
  try {
    const { region } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const query = `
      SELECT
        id,
        name,
        scientific_name,
        category,
        region,
        description,
        gi_tag,
        niche_market,
        image_url,
        created_at
      FROM ne_variety_products
      WHERE region @> $1::jsonb
      ORDER BY name ASC
      LIMIT $2 OFFSET $3
    `;

    const result = await req.app.locals.db?.query(query, [
      JSON.stringify([region]),
      limit,
      offset,
    ]);

    const varieties = result?.rows || [];

    res.json({
      success: true,
      region,
      data: varieties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: varieties.length,
      },
    });

  } catch (err) {
    logger.error('Error fetching varieties by region', { error: err.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch varieties',
      message: err.message,
    });
  }
});

/**
 * GET /api/v1/varieties/gi-tags/list
 * Get all GI-tagged varieties (high-value products)
 */
router.get('/gi-tags/list', async (req, res) => {
  try {
    const query = `
      SELECT
        id,
        name,
        scientific_name,
        category,
        region,
        description,
        gi_tag_status,
        niche_market,
        image_url,
        created_at
      FROM ne_variety_products
      WHERE gi_tag = true
      ORDER BY name ASC
    `;

    const result = await req.app.locals.db?.query(query);
    const varieties = result?.rows || [];

    res.json({
      success: true,
      giTagged: true,
      total: varieties.length,
      data: varieties,
      note: 'These varieties have Geographical Indication (GI) protection and command premium pricing',
    });

  } catch (err) {
    logger.error('Error fetching GI-tagged varieties', { error: err.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch GI-tagged varieties',
      message: err.message,
    });
  }
});

/**
 * GET /api/v1/varieties/stats/summary
 * Get summary statistics about all varieties
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const query = `
      SELECT
        COUNT(*) as total_varieties,
        COUNT(DISTINCT category) as total_categories,
        COUNT(DISTINCT JSONB_ARRAY_ELEMENTS(region)->>0) as total_regions,
        SUM(CASE WHEN gi_tag = true THEN 1 ELSE 0 END) as gi_tagged,
        STRING_AGG(DISTINCT category, ', ' ORDER BY category) as categories,
        STRING_AGG(DISTINCT JSONB_ARRAY_ELEMENTS(region)->>0, ', ' ORDER BY JSONB_ARRAY_ELEMENTS(region)->>0) as regions
      FROM ne_variety_products
    `;

    const result = await req.app.locals.db?.query(query);
    const stats = result?.rows[0] || {};

    res.json({
      success: true,
      statistics: {
        totalVarieties: parseInt(stats.total_varieties) || 0,
        totalCategories: parseInt(stats.total_categories) || 0,
        totalRegions: parseInt(stats.total_regions) || 0,
        giTaggedVarieties: parseInt(stats.gi_tagged) || 0,
        categories: stats.categories ? stats.categories.split(', ') : [],
        regions: stats.regions ? stats.regions.split(', ') : [],
      },
    });

  } catch (err) {
    logger.error('Error fetching statistics', { error: err.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: err.message,
    });
  }
});

module.exports = router;
