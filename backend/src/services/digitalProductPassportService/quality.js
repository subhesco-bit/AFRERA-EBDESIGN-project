/**
 * Digital Product Passport: Quality Reports (CAP-278) and Recall Status
 * (CAP-279). Split out of the former monolithic
 * services/digitalProductPassportService.js (M11).
 */

const express = require('express');
const { logger } = require('../../utils/logger');
const { authMiddleware } = require('../../middleware/auth');
const { authRateLimit } = require('../../middleware/rateLimiter');
const pool = require('../../database/pool');

const router = express.Router();

// ============================================================================
// QUALITY REPORTS (CAP-278)
// ============================================================================

/**
 * Create quality report
 */
router.post('/quality-reports', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const {
      product_id,
      batch_id,
      report_type,
      test_date,
      test_parameters,
      test_results,
      quality_score,
      pass_fail,
      tested_by,
      laboratory_id,
      certification_reference
    } = req.body;

    const result = await pool.query(
      `INSERT INTO quality_reports
       (product_id, batch_id, report_type, test_date, test_parameters, test_results,
        quality_score, pass_fail, tested_by, laboratory_id, certification_reference,
        created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
       RETURNING *`,
      [
        product_id, batch_id, report_type, test_date,
        JSON.stringify(test_parameters), JSON.stringify(test_results),
        quality_score, pass_fail, tested_by, laboratory_id, certification_reference
      ]
    );

    logger.info(`Quality report created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create quality report error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create quality report' });
  }
});

/**
 * Get quality reports
 */
router.get('/quality-reports', authMiddleware, async (req, res) => {
  try {
    const { product_id, batch_id, report_type } = req.query;

    let query = 'SELECT * FROM quality_reports WHERE 1=1';
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

    if (report_type) {
      paramCount++;
      query += ` AND report_type = $${paramCount}`;
      params.push(report_type);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get quality reports error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get quality reports' });
  }
});

// ============================================================================
// RECALL STATUS (CAP-279)
// ============================================================================

/**
 * Create recall status record
 */
router.post('/recall-status', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const {
      product_id,
      batch_id,
      recall_id,
      recall_status,
      recall_date,
      recall_reason,
      affected_markets,
      consumer_notification,
      remediation_actions,
      resolution_status,
      resolved_date
    } = req.body;

    const result = await pool.query(
      `INSERT INTO recall_status
       (product_id, batch_id, recall_id, recall_status, recall_date, recall_reason,
        affected_markets, consumer_notification, remediation_actions, resolution_status,
        resolved_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
       RETURNING *`,
      [
        product_id, batch_id, recall_id, recall_status, recall_date, recall_reason,
        JSON.stringify(affected_markets), consumer_notification,
        JSON.stringify(remediation_actions), resolution_status, resolved_date
      ]
    );

    logger.info(`Recall status created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create recall status error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create recall status' });
  }
});

/**
 * Get recall status
 */
router.get('/recall-status', authMiddleware, async (req, res) => {
  try {
    const { product_id, batch_id, recall_status } = req.query;

    let query = 'SELECT * FROM recall_status WHERE 1=1';
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

    if (recall_status) {
      paramCount++;
      query += ` AND recall_status = $${paramCount}`;
      params.push(recall_status);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get recall status error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get recall status' });
  }
});

module.exports = router;
