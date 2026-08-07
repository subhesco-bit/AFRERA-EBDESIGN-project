/**
 * Shelf-Life Intelligence Service
 * CAP-255 to CAP-261: Temperature Monitoring, Humidity Monitoring, Packaging Analysis,
 * Transport Analysis, Storage Analysis, Remaining Shelf Life Prediction, Spoilage Risk Prediction
 */

const express = require('express');
const { Pool } = require('pg');
const { logger } = require('../utils/logger');
const { authMiddleware } = require('../middleware/auth');
// Afferent wiring 2026-08-04: connects this module to the nervous system.
const { signalBus, SIGNAL, SEVERITY } = require('../core/signalBus');

const router = express.Router();
// Shared pool (2026-08-04): this service previously built its own Pool.
// 42 services doing so meant ~420 potential connections against a
// PostgreSQL default max_connections of 100. See database/pool.js.
const pool = require('../database/pool');

// ============================================================================
// TEMPERATURE MONITORING (CAP-255)
// ============================================================================

/**
 * Record temperature reading
 */
router.post('/temperature', authMiddleware, async (req, res) => {
  try {
    const {
      product_id,
      batch_id,
      location_id,
      sensor_id,
      temperature,
      unit,
      timestamp,
      threshold_violation,
      alert_triggered
    } = req.body;

    const result = await pool.query(
      `INSERT INTO temperature_monitoring 
       (product_id, batch_id, location_id, sensor_id, temperature, unit, 
        timestamp, threshold_violation, alert_triggered, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING *`,
      [
        product_id, batch_id, location_id, sensor_id, temperature,
        unit || 'celsius', timestamp || new Date(), threshold_violation, alert_triggered
      ]
    );

    logger.info(`Temperature reading recorded: ${result.rows[0].id}`);

    // AFFERENT WIRING 2026-08-04: a threshold violation was written to the
    // database and nothing else happened. The cold-chain effector now turns it
    // into an incident, an insurance-evidence attachment and a reroute
    // assessment. Emitted AFTER the insert so the reading is durable first —
    // a signal about a record that failed to save would be a lie.
    if (threshold_violation === true || alert_triggered === true) {
      signalBus.emitSignal(
        SIGNAL.TEMPERATURE_BREACH,
        {
          readingId: result.rows[0].id,
          productId: product_id ?? null,
          batchId: batch_id ?? null,
          sensorId: sensor_id ?? null,
          locationId: location_id ?? null,
          temperature,
          unit: unit || 'celsius',
          at: result.rows[0].timestamp
        },
        { severity: SEVERITY.CRITICAL, source: 'shelfLifeService.recordTemperature' }
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Record temperature reading error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to record temperature reading' });
  }
});

/**
 * Get temperature readings
 */
router.get('/temperature', authMiddleware, async (req, res) => {
  try {
    const { product_id, batch_id, location_id, start_date, end_date } = req.query;
    
    let query = 'SELECT * FROM temperature_monitoring WHERE 1=1';
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

    if (location_id) {
      paramCount++;
      query += ` AND location_id = $${paramCount}`;
      params.push(location_id);
    }

    if (start_date) {
      paramCount++;
      query += ` AND timestamp >= $${paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      query += ` AND timestamp <= $${paramCount}`;
      params.push(end_date);
    }

    query += ' ORDER BY timestamp DESC LIMIT 1000';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get temperature readings error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get temperature readings' });
  }
});

/**
 * Get temperature analytics
 */
router.get('/temperature/analytics', authMiddleware, async (req, res) => {
  try {
    const { product_id, batch_id, location_id, period } = req.query;

    const analytics = await pool.query(`
      SELECT 
        AVG(temperature) as avg_temperature,
        MIN(temperature) as min_temperature,
        MAX(temperature) as max_temperature,
        STDDEV(temperature) as temp_stddev,
        COUNT(*) FILTER (WHERE threshold_violation = true) as violation_count,
        COUNT(*) as total_readings
      FROM temperature_monitoring
      WHERE ($1::text IS NULL OR product_id = $1)
        AND ($2::text IS NULL OR batch_id = $2)
        AND ($3::text IS NULL OR location_id = $3)
        AND timestamp > NOW() - INTERVAL $4
    `, [product_id, batch_id, location_id, period || '24 hours']);

    res.json(analytics.rows[0]);
  } catch (error) {
    logger.error('Get temperature analytics error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get temperature analytics' });
  }
});

// ============================================================================
// HUMIDITY MONITORING (CAP-256)
// ============================================================================

/**
 * Record humidity reading
 */
router.post('/humidity', authMiddleware, async (req, res) => {
  try {
    const {
      product_id,
      batch_id,
      location_id,
      sensor_id,
      humidity,
      unit,
      timestamp,
      threshold_violation,
      alert_triggered
    } = req.body;

    const result = await pool.query(
      `INSERT INTO humidity_monitoring 
       (product_id, batch_id, location_id, sensor_id, humidity, unit, 
        timestamp, threshold_violation, alert_triggered, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING *`,
      [
        product_id, batch_id, location_id, sensor_id, humidity,
        unit || 'percent', timestamp || new Date(), threshold_violation, alert_triggered
      ]
    );

    logger.info(`Humidity reading recorded: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Record humidity reading error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to record humidity reading' });
  }
});

/**
 * Get humidity readings
 */
router.get('/humidity', authMiddleware, async (req, res) => {
  try {
    const { product_id, batch_id, location_id, start_date, end_date } = req.query;
    
    let query = 'SELECT * FROM humidity_monitoring WHERE 1=1';
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

    if (location_id) {
      paramCount++;
      query += ` AND location_id = $${paramCount}`;
      params.push(location_id);
    }

    if (start_date) {
      paramCount++;
      query += ` AND timestamp >= $${paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      query += ` AND timestamp <= $${paramCount}`;
      params.push(end_date);
    }

    query += ' ORDER BY timestamp DESC LIMIT 1000';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get humidity readings error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get humidity readings' });
  }
});

// ============================================================================
// PACKAGING ANALYSIS (CAP-257)
// ============================================================================

/**
 * Create packaging analysis
 */
router.post('/packaging-analysis', authMiddleware, async (req, res) => {
  try {
    const {
      product_id,
      batch_id,
      packaging_type,
      material_composition,
      barrier_properties,
      seal_integrity,
      oxygen_transmission_rate,
      moisture_vapor_transmission_rate,
      light_transmission,
      mechanical_strength,
      compatibility_with_product,
      shelf_life_impact,
      analysis_date,
      analyzed_by
    } = req.body;

    const result = await pool.query(
      `INSERT INTO packaging_analysis 
       (product_id, batch_id, packaging_type, material_composition, barrier_properties, 
        seal_integrity, oxygen_transmission_rate, moisture_vapor_transmission_rate, 
        light_transmission, mechanical_strength, compatibility_with_product, 
        shelf_life_impact, analysis_date, analyzed_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
       RETURNING *`,
      [
        product_id, batch_id, packaging_type, JSON.stringify(material_composition),
        JSON.stringify(barrier_properties), seal_integrity, oxygen_transmission_rate,
        moisture_vapor_transmission_rate, light_transmission, mechanical_strength,
        compatibility_with_product, shelf_life_impact, analysis_date, analyzed_by
      ]
    );

    logger.info(`Packaging analysis created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create packaging analysis error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create packaging analysis' });
  }
});

/**
 * Get packaging analyses
 */
router.get('/packaging-analysis', authMiddleware, async (req, res) => {
  try {
    const { product_id, batch_id, packaging_type } = req.query;
    
    let query = 'SELECT * FROM packaging_analysis WHERE 1=1';
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

    if (packaging_type) {
      paramCount++;
      query += ` AND packaging_type = $${paramCount}`;
      params.push(packaging_type);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get packaging analyses error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get packaging analyses' });
  }
});

// ============================================================================
// TRANSPORT ANALYSIS (CAP-258)
// ============================================================================

/**
 * Create transport analysis
 */
router.post('/transport-analysis', authMiddleware, async (req, res) => {
  try {
    const {
      shipment_id,
      product_id,
      batch_id,
      transport_mode,
      route,
      duration,
      temperature_conditions,
      humidity_conditions,
      vibration_levels,
      shock_events,
      handling_incidents,
      deviations,
      impact_on_shelf_life,
      analysis_date,
      analyzed_by
    } = req.body;

    const result = await pool.query(
      `INSERT INTO transport_analysis 
       (shipment_id, product_id, batch_id, transport_mode, route, duration, 
        temperature_conditions, humidity_conditions, vibration_levels, 
        shock_events, handling_incidents, deviations, impact_on_shelf_life, 
        analysis_date, analyzed_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
       RETURNING *`,
      [
        shipment_id, product_id, batch_id, transport_mode, JSON.stringify(route),
        duration, JSON.stringify(temperature_conditions), JSON.stringify(humidity_conditions),
        JSON.stringify(vibration_levels), JSON.stringify(shock_events),
        JSON.stringify(handling_incidents), JSON.stringify(deviations),
        impact_on_shelf_life, analysis_date, analyzed_by
      ]
    );

    logger.info(`Transport analysis created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create transport analysis error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create transport analysis' });
  }
});

/**
 * Get transport analyses
 */
router.get('/transport-analysis', authMiddleware, async (req, res) => {
  try {
    const { shipment_id, product_id, batch_id, transport_mode } = req.query;
    
    let query = 'SELECT * FROM transport_analysis WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (shipment_id) {
      paramCount++;
      query += ` AND shipment_id = $${paramCount}`;
      params.push(shipment_id);
    }

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

    if (transport_mode) {
      paramCount++;
      query += ` AND transport_mode = $${paramCount}`;
      params.push(transport_mode);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get transport analyses error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get transport analyses' });
  }
});

// ============================================================================
// STORAGE ANALYSIS (CAP-259)
// ============================================================================

/**
 * Create storage analysis
 */
router.post('/storage-analysis', authMiddleware, async (req, res) => {
  try {
    const {
      product_id,
      batch_id,
      warehouse_id,
      storage_location,
      storage_conditions,
      temperature_history,
      humidity_history,
      ventilation_status,
      light_exposure,
      pest_control_status,
      cleanliness_score,
      organization_rating,
      stock_rotation_compliance,
      impact_on_shelf_life,
      analysis_date,
      analyzed_by
    } = req.body;

    const result = await pool.query(
      `INSERT INTO storage_analysis 
       (product_id, batch_id, warehouse_id, storage_location, storage_conditions, 
        temperature_history, humidity_history, ventilation_status, light_exposure, 
        pest_control_status, cleanliness_score, organization_rating, 
        stock_rotation_compliance, impact_on_shelf_life, analysis_date, analyzed_by, 
        created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
       RETURNING *`,
      [
        product_id, batch_id, warehouse_id, storage_location,
        JSON.stringify(storage_conditions), JSON.stringify(temperature_history),
        JSON.stringify(humidity_history), ventilation_status, light_exposure,
        pest_control_status, cleanliness_score, organization_rating,
        stock_rotation_compliance, impact_on_shelf_life, analysis_date, analyzed_by
      ]
    );

    logger.info(`Storage analysis created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create storage analysis error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create storage analysis' });
  }
});

/**
 * Get storage analyses
 */
router.get('/storage-analysis', authMiddleware, async (req, res) => {
  try {
    const { product_id, batch_id, warehouse_id } = req.query;
    
    let query = 'SELECT * FROM storage_analysis WHERE 1=1';
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

    if (warehouse_id) {
      paramCount++;
      query += ` AND warehouse_id = $${paramCount}`;
      params.push(warehouse_id);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get storage analyses error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get storage analyses' });
  }
});

// ============================================================================
// REMAINING SHELF LIFE PREDICTION (CAP-260)
// ============================================================================

/**
 * Predict remaining shelf life
 */
router.post('/shelf-life-prediction', authMiddleware, async (req, res) => {
  try {
    const {
      product_id,
      batch_id,
      production_date,
      current_date,
      storage_conditions,
      transport_history,
      packaging_analysis,
      temperature_history,
      humidity_history
    } = req.body;

    // Run AI prediction model
    const prediction = await predictShelfLife({
      product_id,
      batch_id,
      production_date,
      current_date,
      storage_conditions,
      transport_history,
      packaging_analysis,
      temperature_history,
      humidity_history
    });

    // Store prediction
    const result = await pool.query(
      `INSERT INTO shelf_life_predictions 
       (product_id, batch_id, production_date, prediction_date, storage_conditions, 
        transport_history, packaging_analysis, temperature_history, humidity_history, 
        predicted_remaining_days, confidence_score, prediction_model, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
       RETURNING *`,
      [
        product_id, batch_id, production_date, current_date || new Date(),
        JSON.stringify(storage_conditions), JSON.stringify(transport_history),
        JSON.stringify(packaging_analysis), JSON.stringify(temperature_history),
        JSON.stringify(humidity_history), prediction.remaining_days,
        prediction.confidence_score, prediction.model_version
      ]
    );

    logger.info(`Shelf life prediction created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create shelf life prediction error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create shelf life prediction' });
  }
});

/**
 * Mock shelf life prediction model
 */
async function predictShelfLife(params) {
  // In production, this would use ML models
  logger.info(`Running shelf life prediction for product ${params.product_id}`);
  
  const baseShelfLife = 30; // days
  const ageInDays = Math.floor((new Date() - new Date(params.production_date)) / (1000 * 60 * 60 * 24));
  
  // Adjust based on conditions
  let qualityFactor = 1.0;
  
  if (params.storage_conditions) {
    if (params.storage_conditions.temperature_avg > 25) {
      qualityFactor *= 0.8; // Higher temperature reduces shelf life
    }
    if (params.storage_conditions.humidity_avg > 70) {
      qualityFactor *= 0.9; // High humidity reduces shelf life
    }
  }

  const remainingDays = Math.max(0, Math.floor((baseShelfLife - ageInDays) * qualityFactor));
  
  return {
    remaining_days: remainingDays,
    confidence_score: 0.87,
    model_version: 'v2.1',
    factors: {
      base_shelf_life: baseShelfLife,
      age_in_days: ageInDays,
      quality_factor: qualityFactor,
      storage_impact: qualityFactor < 1.0 ? 'negative' : 'neutral'
    }
  };
}

/**
 * Get shelf life predictions
 */
router.get('/shelf-life-prediction', authMiddleware, async (req, res) => {
  try {
    const { product_id, batch_id } = req.query;
    
    let query = 'SELECT * FROM shelf_life_predictions WHERE 1=1';
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

    query += ' ORDER BY prediction_date DESC LIMIT 100';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get shelf life predictions error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get shelf life predictions' });
  }
});

// ============================================================================
// SPOILAGE RISK PREDICTION (CAP-261)
// ============================================================================

/**
 * Predict spoilage risk
 */
router.post('/spoilage-risk', authMiddleware, async (req, res) => {
  try {
    const {
      product_id,
      batch_id,
      current_date,
      shelf_life_remaining,
      storage_conditions,
      temperature_violations,
      humidity_violations,
      handling_incidents,
      age_in_days
    } = req.body;

    // Run AI spoilage risk prediction
    const prediction = await predictSpoilageRisk({
      product_id,
      batch_id,
      current_date,
      shelf_life_remaining,
      storage_conditions,
      temperature_violations,
      humidity_violations,
      handling_incidents,
      age_in_days
    });

    // Store prediction
    const result = await pool.query(
      `INSERT INTO spoilage_risk_predictions 
       (product_id, batch_id, prediction_date, shelf_life_remaining, storage_conditions, 
        temperature_violations, humidity_violations, handling_incidents, age_in_days, 
        risk_level, risk_probability, risk_factors, recommended_actions, 
        confidence_score, prediction_model, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
       RETURNING *`,
      [
        product_id, batch_id, current_date || new Date(), shelf_life_remaining,
        JSON.stringify(storage_conditions), JSON.stringify(temperature_violations),
        JSON.stringify(humidity_violations), JSON.stringify(handling_incidents),
        age_in_days, prediction.risk_level, prediction.risk_probability,
        JSON.stringify(prediction.risk_factors), JSON.stringify(prediction.recommended_actions),
        prediction.confidence_score, prediction.model_version
      ]
    );

    logger.info(`Spoilage risk prediction created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create spoilage risk prediction error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create spoilage risk prediction' });
  }
});

/**
 * Mock spoilage risk prediction model
 */
async function predictSpoilageRisk(params) {
  // In production, this would use ML models
  logger.info(`Running spoilage risk prediction for product ${params.product_id}`);
  
  let riskScore = 0.1; // Base risk
  const riskFactors = [];
  const recommendedActions = [];

  // Age factor
  if (params.age_in_days > 20) {
    riskScore += 0.3;
    riskFactors.push({ factor: 'advanced_age', impact: 'high' });
    recommendedActions.push('Prioritize for immediate sale');
  }

  // Shelf life factor
  if (params.shelf_life_remaining < 5) {
    riskScore += 0.4;
    riskFactors.push({ factor: 'low_shelf_life_remaining', impact: 'critical' });
    recommendedActions.push('Mark for quick sale or discount');
  }

  // Temperature violations
  if (params.temperature_violations && params.temperature_violations.length > 0) {
    riskScore += 0.2 * params.temperature_violations.length;
    riskFactors.push({ factor: 'temperature_violations', impact: 'high' });
    recommendedActions.push('Review cold chain compliance');
  }

  // Humidity violations
  if (params.humidity_violations && params.humidity_violations.length > 0) {
    riskScore += 0.15 * params.humidity_violations.length;
    riskFactors.push({ factor: 'humidity_violations', impact: 'medium' });
  }

  // Handling incidents
  if (params.handling_incidents && params.handling_incidents.length > 0) {
    riskScore += 0.1 * params.handling_incidents.length;
    riskFactors.push({ factor: 'handling_incidents', impact: 'medium' });
    recommendedActions.push('Inspect for physical damage');
  }

  // Determine risk level
  let riskLevel = 'low';
  if (riskScore >= 0.7) riskLevel = 'critical';
  else if (riskScore >= 0.5) riskLevel = 'high';
  else if (riskScore >= 0.3) riskLevel = 'medium';

  const result = {
    risk_level: riskLevel,
    risk_probability: Math.min(riskScore, 1.0),
    risk_factors: riskFactors,
    recommended_actions: recommendedActions,
    confidence_score: 0.85,
    model_version: 'v1.8'
  };

  // AFFERENT WIRING 2026-08-04: this module computed a critical spoilage risk
  // and told nobody. The signal bus post-dates this service by ~14 hours, so
  // it was never connected. Emitting lets the shelf-life effector propose a
  // disposition (markdown / divert to processing / local clearance) while the
  // lot still has recoverable value. After expiry every option costs money.
  if (riskLevel === 'critical' || riskLevel === 'high') {
    signalBus.emitSignal(
      SIGNAL.SHELF_LIFE_CRITICAL,
      {
        lotId: params.lot_id ?? params.batch_id ?? null,
        productId: params.product_id ?? null,
        riskLevel,
        riskProbability: result.risk_probability,
        // Carried so the effector does not have to re-derive them.
        riskFactors: riskFactors.map((f) => f.factor)
      },
      { severity: riskLevel === 'critical' ? SEVERITY.CRITICAL : SEVERITY.WARNING, source: 'shelfLifeService.predictSpoilageRisk' }
    );
  }

  return result;
}

/**
 * Get spoilage risk predictions
 */
router.get('/spoilage-risk', authMiddleware, async (req, res) => {
  try {
    const { product_id, batch_id, risk_level } = req.query;
    
    let query = 'SELECT * FROM spoilage_risk_predictions WHERE 1=1';
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

    if (risk_level) {
      paramCount++;
      query += ` AND risk_level = $${paramCount}`;
      params.push(risk_level);
    }

    query += ' ORDER BY prediction_date DESC LIMIT 100';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get spoilage risk predictions error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get spoilage risk predictions' });
  }
});

/**
 * Get shelf life intelligence dashboard
 */
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const dashboard = await pool.query(`
      SELECT 
        COUNT(DISTINCT product_id) as products_monitored,
        COUNT(DISTINCT batch_id) as batches_monitored,
        AVG(predicted_remaining_days) as avg_remaining_shelf_life,
        COUNT(*) FILTER (WHERE predicted_remaining_days < 5) as critical_batches,
        COUNT(*) FILTER (WHERE risk_level = 'critical') as high_risk_batches,
        COUNT(*) FILTER (WHERE risk_level = 'high') as medium_risk_batches,
        COUNT(*) FILTER (WHERE threshold_violation = true) as temp_violations_today,
        COUNT(*) FILTER (WHERE threshold_violation = true) as humidity_violations_today
      FROM (
        SELECT product_id, batch_id, predicted_remaining_days FROM shelf_life_predictions
        WHERE prediction_date > NOW() - INTERVAL '24 hours'
      ) predictions
      FULL OUTER JOIN temperature_monitoring tm ON 1=1
      FULL OUTER JOIN humidity_monitoring hm ON 1=1
      WHERE tm.timestamp > NOW() - INTERVAL '24 hours' OR hm.timestamp > NOW() - INTERVAL '24 hours' OR 1=1
    `);

    res.json(dashboard.rows[0]);
  } catch (error) {
    logger.error('Get shelf life dashboard error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get shelf life dashboard' });
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
