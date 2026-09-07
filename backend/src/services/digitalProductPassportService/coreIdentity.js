/**
 * Digital Product Passport: Unique Product ID (CAP-269) and Lot/Batch
 * Tracking (CAP-270). Split out of the former monolithic
 * services/digitalProductPassportService.js (M11).
 */

const express = require('express');
const crypto = require('crypto');
const { logger } = require('../../utils/logger');
const { authMiddleware } = require('../../middleware/auth');
const { authRateLimit } = require('../../middleware/rateLimiter');
const pool = require('../../database/pool');

const router = express.Router();

// ============================================================================
// UNIQUE PRODUCT ID (CAP-269)
// ============================================================================

/**
 * Generate unique product ID
 */
router.post('/product-id', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const {
      product_type,
      product_category,
      origin_country,
      manufacturer_id,
      production_date,
      batch_number
    } = req.body;

    // Generate GS1-compliant product ID
    const productId = await generateProductId({
      product_type,
      product_category,
      origin_country,
      manufacturer_id,
      production_date,
      batch_number
    });

    const result = await pool.query(
      `INSERT INTO product_ids
       (product_id, product_type, product_category, origin_country, manufacturer_id,
        production_date, batch_number, generated_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [
        productId, product_type, product_category, origin_country,
        manufacturer_id, production_date, batch_number, req.user.id
      ]
    );

    logger.info(`Product ID generated: ${productId}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Generate product ID error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to generate product ID' });
  }
});

/**
 * Generate GS1-compliant product ID
 */
async function generateProductId(params) {
  // Mock GS1 ID generation - in production, use actual GS1 standards
  const prefix = 'AFR'; // Company prefix
  const productType = params.product_type.substring(0, 3).toUpperCase();
  const category = params.product_category.substring(0, 2).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(2).toString('hex').substring(0, 4).toUpperCase();

  return `${prefix}-${productType}-${category}-${timestamp}-${random}`;
}

/**
 * Get product ID details
 */
router.get('/product-id/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM product_ids WHERE product_id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product ID not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Get product ID error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get product ID' });
  }
});

// ============================================================================
// LOT/BATCH TRACKING (CAP-270)
// ============================================================================

/**
 * Create lot/batch record
 */
router.post('/batches', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const {
      batch_number,
      product_id,
      production_date,
      expiry_date,
      quantity_produced,
      quantity_unit,
      production_line,
      production_parameters,
      quality_checks,
      assigned_by
    } = req.body;

    const result = await pool.query(
      `INSERT INTO batch_tracking
       (batch_number, product_id, production_date, expiry_date, quantity_produced,
        quantity_unit, production_line, production_parameters, quality_checks,
        assigned_by, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', NOW(), NOW())
       RETURNING *`,
      [
        batch_number, req.params.product_id || product_id, production_date, expiry_date,
        quantity_produced, quantity_unit, production_line,
        JSON.stringify(production_parameters), JSON.stringify(quality_checks), assigned_by
      ]
    );

    logger.info(`Batch record created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create batch record error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create batch record' });
  }
});

/**
 * Get batch records
 */
router.get('/batches', authMiddleware, async (req, res) => {
  try {
    const { product_id, batch_number, status } = req.query;

    let query = 'SELECT * FROM batch_tracking WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (product_id) {
      paramCount++;
      query += ` AND product_id = $${paramCount}`;
      params.push(product_id);
    }

    if (batch_number) {
      paramCount++;
      query += ` AND batch_number = $${paramCount}`;
      params.push(batch_number);
    }

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get batch records error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get batch records' });
  }
});

module.exports = router;
