/**
 * Digital Product Passport Service
 * CAP-269 to CAP-280: Unique Product ID, Lot/Batch Tracking, Farm Information,
 * Farmer Information, Certification Information, Processing History, Logistics History,
 * Sustainability Data, Carbon Data, Quality Reports, Recall Status, QR Code Generation
 */

const express = require('express');
const crypto = require('crypto');
const { Pool } = require('pg');
const { logger } = require('../../utils/logger');
const { authMiddleware } = require('../../middleware/auth');
const { authRateLimit } = require('../../middleware/rateLimiter');
// Loaded on first QR generation, not at import — see authService for why.
const QRCode = { toDataURL: (...args) => require('qrcode').toDataURL(...args) };

const router = express.Router();
// Shared pool (2026-08-04): this service previously built its own Pool.
// 42 services doing so meant ~420 potential connections against a
// PostgreSQL default max_connections of 100. See database/pool.js.
const pool = require('../../database/pool');

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

// ============================================================================
// QR CODE GENERATION (CAP-280)
// ============================================================================

/**
 * Generate QR code for product
 */
router.post('/qr-code', authMiddleware, async (req, res) => {
  try {
    const { product_id, batch_id, data } = req.body;

    // Generate QR code data URL
    const qrData = JSON.stringify({
      product_id,
      batch_id,
      timestamp: new Date().toISOString(),
      verification_url: `${process.env.BASE_URL || 'https://afrera.com'}/verify/${product_id}/${batch_id}`
    });

    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Store QR code record
    const result = await pool.query(
      `INSERT INTO qr_codes 
       (product_id, batch_id, qr_data, qr_code_image, generated_by, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [product_id, batch_id, qrData, qrCodeDataURL, req.user.id]
    );

    logger.info(`QR code generated for product ${product_id}`);
    res.status(201).json({
      qr_code_id: result.rows[0].id,
      qr_code_image: qrCodeDataURL,
      qr_data: qrData
    });
  } catch (error) {
    logger.error('Generate QR code error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

/**
 * Get QR code
 */
router.get('/qr-code/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM qr_codes WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Get QR code error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get QR code' });
  }
});

/**
 * Get complete digital product passport
 */
router.get('/passport/:product_id/:batch_id', authMiddleware, async (req, res) => {
  try {
    const { product_id, batch_id } = req.params;

    // Get all passport data
    const [productInfo, batchInfo, farmInfo, farmerInfo, certInfo, 
          processingInfo, logisticsInfo, sustainabilityInfo, carbonInfo, 
          qualityInfo, recallInfo, qrInfo] = await Promise.all([
      pool.query('SELECT * FROM product_ids WHERE product_id = $1', [product_id]),
      pool.query('SELECT * FROM batch_tracking WHERE product_id = $1 AND batch_number = $2', [product_id, batch_id]),
      pool.query('SELECT * FROM farm_information WHERE product_id = $1 AND batch_id = $2', [product_id, batch_id]),
      pool.query('SELECT * FROM farmer_information WHERE product_id = $1 AND batch_id = $2', [product_id, batch_id]),
      pool.query('SELECT * FROM certification_information WHERE product_id = $1 AND batch_id = $2', [product_id, batch_id]),
      pool.query('SELECT * FROM processing_history WHERE product_id = $1 AND batch_id = $2', [product_id, batch_id]),
      pool.query('SELECT * FROM logistics_history WHERE product_id = $1 AND batch_id = $2', [product_id, batch_id]),
      pool.query('SELECT * FROM sustainability_data WHERE product_id = $1 AND batch_id = $2', [product_id, batch_id]),
      pool.query('SELECT * FROM carbon_data WHERE product_id = $1 AND batch_id = $2', [product_id, batch_id]),
      pool.query('SELECT * FROM quality_reports WHERE product_id = $1 AND batch_id = $2', [product_id, batch_id]),
      pool.query('SELECT * FROM recall_status WHERE product_id = $1 AND batch_id = $2', [product_id, batch_id]),
      pool.query('SELECT * FROM qr_codes WHERE product_id = $1 AND batch_id = $2 ORDER BY created_at DESC LIMIT 1', [product_id, batch_id])
    ]);

    const passport = {
      product_id,
      batch_id,
      product_information: productInfo.rows[0] || null,
      batch_information: batchInfo.rows[0] || null,
      farm_information: farmInfo.rows[0] || null,
      farmer_information: farmerInfo.rows[0] || null,
      certification_information: certInfo.rows[0] || null,
      processing_history: processingInfo.rows,
      logistics_history: logisticsInfo.rows,
      sustainability_data: sustainabilityInfo.rows[0] || null,
      carbon_data: carbonInfo.rows[0] || null,
      quality_reports: qualityInfo.rows,
      recall_status: recallInfo.rows[0] || null,
      qr_code: qrInfo.rows[0] || null,
      generated_at: new Date().toISOString()
    };

    res.json(passport);
  } catch (error) {
    logger.error('Get digital product passport error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get digital product passport' });
  }
});

// Health check
function isHealthy() {
  return true;
}

module.exports = {
  router,
  isHealthy
};
