/**
 * Digital Product Passport: Farm Information (CAP-271), Farmer Information
 * (CAP-272), and Certification Information (CAP-273). Split out of the
 * former monolithic services/digitalProductPassportService.js (M11).
 */

const express = require('express');
const { logger } = require('../../utils/logger');
const { authMiddleware } = require('../../middleware/auth');
const { authRateLimit } = require('../../middleware/rateLimiter');
const pool = require('../../database/pool');

const router = express.Router();

// ============================================================================
// FARM INFORMATION (CAP-271)
// ============================================================================

/**
 * Create farm information record
 */
router.post('/farm-info', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const {
      product_id,
      batch_id,
      farm_id,
      farm_name,
      location,
      coordinates,
      soil_type,
      climate_zone,
      cultivation_practices,
      irrigation_method,
      fertilizers_used,
      pesticides_used,
      harvest_date,
      harvesting_method,
      post_harvest_handling
    } = req.body;

    const result = await pool.query(
      `INSERT INTO farm_information
       (product_id, batch_id, farm_id, farm_name, location, coordinates, soil_type,
        climate_zone, cultivation_practices, irrigation_method, fertilizers_used,
        pesticides_used, harvest_date, harvesting_method, post_harvest_handling,
        created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
       RETURNING *`,
      [
        product_id, batch_id, farm_id, farm_name, location,
        JSON.stringify(coordinates), soil_type, climate_zone,
        JSON.stringify(cultivation_practices), irrigation_method,
        JSON.stringify(fertilizers_used), JSON.stringify(pesticides_used),
        harvest_date, harvesting_method, JSON.stringify(post_harvest_handling)
      ]
    );

    logger.info(`Farm information created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create farm information error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create farm information' });
  }
});

/**
 * Get farm information
 */
router.get('/farm-info', authMiddleware, async (req, res) => {
  try {
    const { product_id, batch_id, farm_id } = req.query;

    let query = 'SELECT * FROM farm_information WHERE 1=1';
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

    if (farm_id) {
      paramCount++;
      query += ` AND farm_id = $${paramCount}`;
      params.push(farm_id);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get farm information error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get farm information' });
  }
});

// ============================================================================
// FARMER INFORMATION (CAP-272)
// ============================================================================

/**
 * Create farmer information record
 */
router.post('/farmer-info', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const {
      product_id,
      batch_id,
      farmer_id,
      farmer_name,
      contact_information,
      farming_experience,
      certifications,
      training_received,
      membership_in_cooperatives,
      payment_details,
      contract_terms
    } = req.body;

    const result = await pool.query(
      `INSERT INTO farmer_information
       (product_id, batch_id, farmer_id, farmer_name, contact_information,
        farming_experience, certifications, training_received, membership_in_cooperatives,
        payment_details, contract_terms, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
       RETURNING *`,
      [
        product_id, batch_id, farmer_id, farmer_name,
        JSON.stringify(contact_information), farming_experience,
        JSON.stringify(certifications), JSON.stringify(training_received),
        JSON.stringify(membership_in_cooperatives), JSON.stringify(payment_details),
        JSON.stringify(contract_terms)
      ]
    );

    logger.info(`Farmer information created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create farmer information error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create farmer information' });
  }
});

/**
 * Get farmer information
 */
router.get('/farmer-info', authMiddleware, async (req, res) => {
  try {
    const { product_id, batch_id, farmer_id } = req.query;

    let query = 'SELECT * FROM farmer_information WHERE 1=1';
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

    if (farmer_id) {
      paramCount++;
      query += ` AND farmer_id = $${paramCount}`;
      params.push(farmer_id);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get farmer information error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get farmer information' });
  }
});

// ============================================================================
// CERTIFICATION INFORMATION (CAP-273)
// ============================================================================

/**
 * Create certification information record
 */
router.post('/certification-info', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const {
      product_id,
      batch_id,
      certification_type,
      certification_body,
      certificate_number,
      issue_date,
      expiry_date,
      scope,
      standards_complied,
      audit_reports,
      non_conformities,
      corrective_actions
    } = req.body;

    const result = await pool.query(
      `INSERT INTO certification_information
       (product_id, batch_id, certification_type, certification_body, certificate_number,
        issue_date, expiry_date, scope, standards_complied, audit_reports,
        non_conformities, corrective_actions, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
       RETURNING *`,
      [
        product_id, batch_id, certification_type, certification_body,
        certificate_number, issue_date, expiry_date, scope,
        JSON.stringify(standards_complied), JSON.stringify(audit_reports),
        JSON.stringify(non_conformities), JSON.stringify(corrective_actions)
      ]
    );

    logger.info(`Certification information created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create certification information error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create certification information' });
  }
});

/**
 * Get certification information
 */
router.get('/certification-info', authMiddleware, async (req, res) => {
  try {
    const { product_id, batch_id, certification_type } = req.query;

    let query = 'SELECT * FROM certification_information WHERE 1=1';
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

    if (certification_type) {
      paramCount++;
      query += ` AND certification_type = $${paramCount}`;
      params.push(certification_type);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get certification information error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get certification information' });
  }
});

module.exports = router;
