/**
 * Digital Product Passport: Sustainability Data (CAP-276) and Carbon Data
 * (CAP-277). Split out of the former monolithic
 * services/digitalProductPassportService.js (M11).
 */

const express = require('express');
const { logger } = require('../../utils/logger');
const { authMiddleware } = require('../../middleware/auth');
const { authRateLimit } = require('../../middleware/rateLimiter');
const pool = require('../../database/pool');

const router = express.Router();

// ============================================================================
// SUSTAINABILITY DATA (CAP-276)
// ============================================================================

/**
 * Create sustainability data record
 */
router.post('/sustainability-data', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const {
      product_id,
      batch_id,
      water_usage,
      energy_consumption,
      waste_generated,
      waste_recycled,
      soil_health_metrics,
      biodiversity_impact,
      social_impact,
      economic_impact,
      sustainability_score,
      certification_status
    } = req.body;

    const result = await pool.query(
      `INSERT INTO sustainability_data
       (product_id, batch_id, water_usage, energy_consumption, waste_generated,
        waste_recycled, soil_health_metrics, biodiversity_impact, social_impact,
        economic_impact, sustainability_score, certification_status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
       RETURNING *`,
      [
        product_id, batch_id, JSON.stringify(water_usage), JSON.stringify(energy_consumption),
        JSON.stringify(waste_generated), JSON.stringify(waste_recycled),
        JSON.stringify(soil_health_metrics), JSON.stringify(biodiversity_impact),
        JSON.stringify(social_impact), JSON.stringify(economic_impact),
        sustainability_score, certification_status
      ]
    );

    logger.info(`Sustainability data created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create sustainability data error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create sustainability data' });
  }
});

/**
 * Get sustainability data
 */
router.get('/sustainability-data', authMiddleware, async (req, res) => {
  try {
    const { product_id, batch_id } = req.query;

    let query = 'SELECT * FROM sustainability_data WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (product_id) {
      paramCount++;
      query += ` AND product_id = $${paramCount}`;
      params.push(product_id);
    }

    if (batch_id) {
      paramCount++;
      query += ` AND batch_id = $${paramCount}`;
      params.push(batch_id);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get sustainability data error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get sustainability data' });
  }
});

// ============================================================================
// CARBON DATA (CAP-277)
// ============================================================================

/**
 * Create carbon data record
 */
router.post('/carbon-data', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const {
      product_id,
      batch_id,
      carbon_footprint,
      carbon_offset,
      emission_sources,
      reduction_initiatives,
      carbon_credits,
      verification_method,
      verification_date,
      carbon_rating
    } = req.body;

    const result = await pool.query(
      `INSERT INTO carbon_data
       (product_id, batch_id, carbon_footprint, carbon_offset, emission_sources,
        reduction_initiatives, carbon_credits, verification_method, verification_date,
        carbon_rating, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
       RETURNING *`,
      [
        product_id, batch_id, carbon_footprint, carbon_offset,
        JSON.stringify(emission_sources), JSON.stringify(reduction_initiatives),
        JSON.stringify(carbon_credits), verification_method, verification_date, carbon_rating
      ]
    );

    logger.info(`Carbon data created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create carbon data error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create carbon data' });
  }
});

/**
 * Get carbon data
 */
router.get('/carbon-data', authMiddleware, async (req, res) => {
  try {
    const { product_id, batch_id } = req.query;

    let query = 'SELECT * FROM carbon_data WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (product_id) {
      paramCount++;
      query += ` AND product_id = $${paramCount}`;
      params.push(product_id);
    }

    if (batch_id) {
      paramCount++;
      query += ` AND batch_id = $${paramCount}`;
      params.push(batch_id);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get carbon data error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get carbon data' });
  }
});

module.exports = router;
