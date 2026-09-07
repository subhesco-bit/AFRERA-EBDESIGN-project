/**
 * Digital Product Passport: Processing History (CAP-274) and Logistics
 * History (CAP-275). Split out of the former monolithic
 * services/digitalProductPassportService.js (M11).
 */

const express = require('express');
const { logger } = require('../../utils/logger');
const { authMiddleware } = require('../../middleware/auth');
const { authRateLimit } = require('../../middleware/rateLimiter');
const pool = require('../../database/pool');

const router = express.Router();

// ============================================================================
// PROCESSING HISTORY (CAP-274)
// ============================================================================

/**
 * Create processing history record
 */
router.post('/processing-history', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const {
      product_id,
      batch_id,
      processing_facility_id,
      processing_date,
      processing_type,
      equipment_used,
      processing_parameters,
      quality_checks,
      additives_used,
      packaging_material,
      processing_time,
      operators
    } = req.body;

    const result = await pool.query(
      `INSERT INTO processing_history
       (product_id, batch_id, processing_facility_id, processing_date, processing_type,
        equipment_used, processing_parameters, quality_checks, additives_used,
        packaging_material, processing_time, operators, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
       RETURNING *`,
      [
        product_id, batch_id, processing_facility_id, processing_date, processing_type,
        JSON.stringify(equipment_used), JSON.stringify(processing_parameters),
        JSON.stringify(quality_checks), JSON.stringify(additives_used),
        packaging_material, processing_time, JSON.stringify(operators)
      ]
    );

    logger.info(`Processing history created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create processing history error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create processing history' });
  }
});

/**
 * Get processing history
 */
router.get('/processing-history', authMiddleware, async (req, res) => {
  try {
    const { product_id, batch_id, processing_facility_id } = req.query;

    let query = 'SELECT * FROM processing_history WHERE 1=1';
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

    if (processing_facility_id) {
      paramCount++;
      query += ` AND processing_facility_id = $${paramCount}`;
      params.push(processing_facility_id);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get processing history error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get processing history' });
  }
});

// ============================================================================
// LOGISTICS HISTORY (CAP-275)
// ============================================================================

/**
 * Create logistics history record
 */
router.post('/logistics-history', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const {
      product_id,
      batch_id,
      shipment_id,
      transport_mode,
      carrier_id,
      pickup_date,
      delivery_date,
      route,
      temperature_conditions,
      handling_instructions,
      transit_time,
      delays,
      incidents
    } = req.body;

    const result = await pool.query(
      `INSERT INTO logistics_history
       (product_id, batch_id, shipment_id, transport_mode, carrier_id, pickup_date,
        delivery_date, route, temperature_conditions, handling_instructions,
        transit_time, delays, incidents, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
       RETURNING *`,
      [
        product_id, batch_id, shipment_id, transport_mode, carrier_id,
        pickup_date, delivery_date, JSON.stringify(route),
        JSON.stringify(temperature_conditions), handling_instructions,
        transit_time, JSON.stringify(delays), JSON.stringify(incidents)
      ]
    );

    logger.info(`Logistics history created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create logistics history error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create logistics history' });
  }
});

/**
 * Get logistics history
 */
router.get('/logistics-history', authMiddleware, async (req, res) => {
  try {
    const { product_id, batch_id, shipment_id } = req.query;

    let query = 'SELECT * FROM logistics_history WHERE 1=1';
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

    if (shipment_id) {
      paramCount++;
      query += ` AND shipment_id = $${paramCount}`;
      params.push(shipment_id);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get logistics history error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get logistics history' });
  }
});

module.exports = router;
