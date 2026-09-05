/**
 * Food Safety ERP Service
 * CAP-247 to CAP-254: HACCP Management, FSSAI Compliance, ISO 22000 Compliance,
 * Recall Management, CAPA Management, Food Safety Audit, Risk Assessment, Corrective Actions
 */

const express = require('express');
const { Pool } = require('pg');
const { logger } = require('../../utils/logger');
const { authMiddleware, requireRole } = require('../../middleware/auth');
const { PLATFORM_STAFF_ROLES } = require('../../middleware/roleGroups');
const { authRateLimit } = require('../../middleware/rateLimiter');
const { signalBus, SIGNAL, SEVERITY } = require('../../core/signalBus');

const router = express.Router();
// Shared pool (2026-08-04): this service previously built its own Pool.
// 42 services doing so meant ~420 potential connections against a
// PostgreSQL default max_connections of 100. See database/pool.js.
const pool = require('../../database/pool');

// ============================================================================
// HACCP MANAGEMENT (CAP-247)
// ============================================================================

/**
 * Create HACCP plan
 */
router.post('/haccp', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const {
      plan_name,
      facility_id,
      product_category,
      hazard_analysis,
      critical_control_points,
      monitoring_procedures,
      critical_limits,
      corrective_actions,
      verification_procedures,
      record_keeping,
      review_frequency,
      approved_by,
      effective_date
    } = req.body;

    const result = await pool.query(
      `INSERT INTO haccp_plans 
       (plan_name, facility_id, product_category, hazard_analysis, 
        critical_control_points, monitoring_procedures, critical_limits, 
        corrective_actions, verification_procedures, record_keeping, 
        review_frequency, approved_by, effective_date, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'active', NOW(), NOW())
       RETURNING *`,
      [
        plan_name, facility_id, product_category, JSON.stringify(hazard_analysis),
        JSON.stringify(critical_control_points), JSON.stringify(monitoring_procedures),
        JSON.stringify(critical_limits), JSON.stringify(corrective_actions),
        JSON.stringify(verification_procedures), JSON.stringify(record_keeping),
        review_frequency, approved_by, effective_date
      ]
    );

    logger.info(`HACCP plan created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create HACCP plan error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create HACCP plan' });
  }
});

/**
 * Get HACCP plans
 */
router.get('/haccp', authMiddleware, async (req, res) => {
  try {
    const { facility_id, product_category, status } = req.query;
    
    let query = 'SELECT * FROM haccp_plans WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (facility_id) {
      paramCount++;
      query += ` AND facility_id = $${paramCount}`;
      params.push(facility_id);
    }

    if (product_category) {
      paramCount++;
      query += ` AND product_category = $${paramCount}`;
      params.push(product_category);
    }

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    let result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get HACCP plans error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get HACCP plans' });
  }
});

/**
 * Record HACCP monitoring data
 */
router.post('/haccp/:id/monitoring', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const {
      ccp_id,
      monitoring_value,
      critical_limit,
      within_limits,
      monitoring_by,
      comments,
      corrective_action_taken
    } = req.body;

    let result = await pool.query(
      `INSERT INTO haccp_monitoring_records 
       (haccp_plan_id, ccp_id, monitoring_value, critical_limit, within_limits, 
        monitoring_by, comments, corrective_action_taken, monitoring_time, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [
        req.params.id, ccp_id, monitoring_value, critical_limit,
        within_limits, monitoring_by, comments, corrective_action_taken
      ]
    );

    logger.info(`HACCP monitoring recorded: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Record HACCP monitoring error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to record HACCP monitoring' });
  }
});

// ============================================================================
// FSSAI COMPLIANCE (CAP-248)
// ============================================================================

/**
 * Create FSSAI compliance record
 */
router.post('/fssai', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const {
      license_number,
      facility_id,
      license_type,
      license_category,
      valid_from,
      valid_to,
      annual_turnover,
      manufacturing_activities,
      products_covered,
      compliance_status,
      inspection_date,
      next_inspection_date,
      violations,
      corrective_actions
    } = req.body;

    let result = await pool.query(
      `INSERT INTO fssai_compliance 
       (license_number, facility_id, license_type, license_category, valid_from, 
        valid_to, annual_turnover, manufacturing_activities, products_covered, 
        compliance_status, inspection_date, next_inspection_date, violations, 
        corrective_actions, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
       RETURNING *`,
      [
        license_number, facility_id, license_type, license_category,
        valid_from, valid_to, annual_turnover,
        JSON.stringify(manufacturing_activities), JSON.stringify(products_covered),
        compliance_status, inspection_date, next_inspection_date,
        JSON.stringify(violations), JSON.stringify(corrective_actions)
      ]
    );

    logger.info(`FSSAI compliance record created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create FSSAI compliance record error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create FSSAI compliance record' });
  }
});

/**
 * Get FSSAI compliance records
 */
router.get('/fssai', authMiddleware, async (req, res) => {
  try {
    const { facility_id, license_number, compliance_status } = req.query;
    
    let query = 'SELECT * FROM fssai_compliance WHERE 1=1';
    let params = [];
    let paramCount = 0;

    if (facility_id) {
      paramCount++;
      query += ` AND facility_id = $${paramCount}`;
      params.push(facility_id);
    }

    if (license_number) {
      paramCount++;
      query += ` AND license_number = $${paramCount}`;
      params.push(license_number);
    }

    if (compliance_status) {
      paramCount++;
      query += ` AND compliance_status = $${paramCount}`;
      params.push(compliance_status);
    }

    let result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get FSSAI compliance records error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get FSSAI compliance records' });
  }
});

// ============================================================================
// ISO 22000 COMPLIANCE (CAP-249)
// ============================================================================

/**
 * Create ISO 22000 compliance record
 */
router.post('/iso22000', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const {
      certificate_number,
      facility_id,
      scope,
      certification_body,
      issue_date,
      expiry_date,
      surveillance_audits,
      management_review,
      internal_audits,
      prerequisite_programs,
      food_safety_policy,
      objectives,
      performance_indicators,
      nonconformities
    } = req.body;

    let result = await pool.query(
      `INSERT INTO iso22000_compliance 
       (certificate_number, facility_id, scope, certification_body, issue_date, 
        expiry_date, surveillance_audits, management_review, internal_audits, 
        prerequisite_programs, food_safety_policy, objectives, performance_indicators, 
        nonconformities, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
       RETURNING *`,
      [
        certificate_number, facility_id, scope, certification_body,
        issue_date, expiry_date, JSON.stringify(surveillance_audits),
        management_review, JSON.stringify(internal_audits),
        JSON.stringify(prerequisite_programs), food_safety_policy,
        JSON.stringify(objectives), JSON.stringify(performance_indicators),
        JSON.stringify(nonconformities)
      ]
    );

    logger.info(`ISO 22000 compliance record created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create ISO 22000 compliance record error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create ISO 22000 compliance record' });
  }
});

/**
 * Get ISO 22000 compliance records
 */
router.get('/iso22000', authMiddleware, async (req, res) => {
  try {
    const { facility_id, certificate_number, status } = req.query;
    
    let query = 'SELECT * FROM iso22000_compliance WHERE 1=1';
    let params = [];
    let paramCount = 0;

    if (facility_id) {
      paramCount++;
      query += ` AND facility_id = $${paramCount}`;
      params.push(facility_id);
    }

    if (certificate_number) {
      paramCount++;
      query += ` AND certificate_number = $${paramCount}`;
      params.push(certificate_number);
    }

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    let result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get ISO 22000 compliance records error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get ISO 22000 compliance records' });
  }
});

// ============================================================================
// RECALL MANAGEMENT (CAP-250)
// ============================================================================

/**
 * Create recall record
 */
router.post('/recalls', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const {
      product_id,
      batch_number,
      recall_type,
      recall_reason,
      risk_level,
      affected_quantity,
      distribution_scope,
      notification_method,
      recall_initiator,
      recall_date,
      response_deadline,
      corrective_action_plan,
      communication_plan
    } = req.body;

    let result = await pool.query(
      `INSERT INTO food_safety_recalls 
       (product_id, batch_number, recall_type, recall_reason, risk_level, 
        affected_quantity, distribution_scope, notification_method, recall_initiator, 
        recall_date, response_deadline, corrective_action_plan, communication_plan, 
        status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'initiated', NOW(), NOW())
       RETURNING *`,
      [
        product_id, batch_number, recall_type, recall_reason, risk_level,
        affected_quantity, JSON.stringify(distribution_scope),
        JSON.stringify(notification_method), recall_initiator, recall_date,
        response_deadline, JSON.stringify(corrective_action_plan),
        JSON.stringify(communication_plan)
      ]
    );

    logger.info(`Food safety recall created: ${result.rows[0].id}`);

    // AFFERENT WIRING: core/effectors.js already has a 'recall.notification'
    // reaction on SIGNAL.RECALL_ISSUED (notify every downstream holder, notify
    // the regulator, suspend listings) and services/enterpriseMemoryService.js
    // already records a case entry for it — both have been unreachable
    // because this route never called emitSignal() after actually creating the
    // recall. Emitted AFTER the insert with the persisted row's own batch
    // number, so the signal reflects a durable recall, not a request in flight.
    signalBus.emitSignal(
      SIGNAL.RECALL_ISSUED,
      {
        batchId: result.rows[0].batch_number ?? null,
        productId: result.rows[0].product_id ?? null,
        recallType: result.rows[0].recall_type ?? null,
        recallReason: result.rows[0].recall_reason ?? null,
        riskLevel: result.rows[0].risk_level ?? null
      },
      { severity: SEVERITY.EMERGENCY, source: 'foodSafetyService.createRecall' }
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create recall record error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create recall record' });
  }
});

/**
 * Update recall status
 */
router.put('/recalls/:id/status', authRateLimit, authMiddleware, requireRole(...PLATFORM_STAFF_ROLES), async (req, res) => {
  try {
    const { status, recovery_rate, closure_notes, closed_by } = req.body;

    let result = await pool.query(
      `UPDATE food_safety_recalls 
       SET status = $1,
           recovery_rate = COALESCE($2, recovery_rate),
           closure_notes = $3,
           closed_by = $4,
           closed_date = CASE WHEN $1 = 'closed' THEN NOW() ELSE closed_date END,
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [status, recovery_rate, closure_notes, closed_by, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recall record not found' });
    }

    logger.info(`Recall status updated: ${req.params.id} to ${status}`);
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Update recall status error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to update recall status' });
  }
});

/**
 * Get recall records
 */
router.get('/recalls', authMiddleware, async (req, res) => {
  try {
    const { product_id, status, risk_level, start_date, end_date } = req.query;
    
    let query = 'SELECT * FROM food_safety_recalls WHERE 1=1';
    let params = [];
    let paramCount = 0;

    if (product_id) {
      paramCount++;
      query += ` AND product_id = $${paramCount}`;
      params.push(product_id);
    }

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (risk_level) {
      paramCount++;
      query += ` AND risk_level = $${paramCount}`;
      params.push(risk_level);
    }

    if (start_date) {
      paramCount++;
      query += ` AND recall_date >= $${paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      query += ` AND recall_date <= $${paramCount}`;
      params.push(end_date);
    }

    let result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get recall records error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get recall records' });
  }
});

// ============================================================================
// CAPA MANAGEMENT (CAP-251)
// ============================================================================

/**
 * Create CAPA record
 */
router.post('/capa', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const {
      source_type,
      source_id,
      issue_description,
      root_cause,
      impact_assessment,
      preventive_action,
      corrective_action,
      responsibility,
      target_date,
      effectiveness_check,
      verification_method
    } = req.body;

    let result = await pool.query(
      `INSERT INTO capa_records 
       (source_type, source_id, issue_description, root_cause, impact_assessment, 
        preventive_action, corrective_action, responsibility, target_date, 
        effectiveness_check, verification_method, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'open', NOW(), NOW())
       RETURNING *`,
      [
        source_type, source_id, issue_description, root_cause,
        JSON.stringify(impact_assessment), JSON.stringify(preventive_action),
        JSON.stringify(corrective_action), responsibility, target_date,
        effectiveness_check, verification_method
      ]
    );

    logger.info(`CAPA record created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create CAPA record error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create CAPA record' });
  }
});

/**
 * Update CAPA status
 */
router.put('/capa/:id/status', authRateLimit, authMiddleware, requireRole(...PLATFORM_STAFF_ROLES), async (req, res) => {
  try {
    const { status, completion_notes, completed_by, effectiveness_result } = req.body;

    let result = await pool.query(
      `UPDATE capa_records 
       SET status = $1,
           completion_notes = $2,
           completed_by = $3,
           completed_date = CASE WHEN $1 IN ('completed', 'verified') THEN NOW() ELSE completed_date END,
           effectiveness_result = COALESCE($4, effectiveness_result),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [status, completion_notes, completed_by, effectiveness_result, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'CAPA record not found' });
    }

    logger.info(`CAPA status updated: ${req.params.id} to ${status}`);
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Update CAPA status error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to update CAPA status' });
  }
});

/**
 * Get CAPA records
 */
router.get('/capa', authMiddleware, async (req, res) => {
  try {
    const { source_type, source_id, status, responsibility } = req.query;
    
    let query = 'SELECT * FROM capa_records WHERE 1=1';
    let params = [];
    let paramCount = 0;

    if (source_type) {
      paramCount++;
      query += ` AND source_type = $${paramCount}`;
      params.push(source_type);
    }

    if (source_id) {
      paramCount++;
      query += ` AND source_id = $${paramCount}`;
      params.push(source_id);
    }

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (responsibility) {
      paramCount++;
      query += ` AND responsibility = $${paramCount}`;
      params.push(responsibility);
    }

    let result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get CAPA records error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get CAPA records' });
  }
});

// ============================================================================
// FOOD SAFETY AUDIT (CAP-252)
// ============================================================================

/**
 * Create food safety audit
 */
router.post('/audits', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const {
      audit_type,
      facility_id,
      audit_scope,
      audit_criteria,
      audit_team,
      scheduled_date,
      actual_date,
      findings,
      nonconformities,
      observations,
      score,
      grade,
      recommendations,
      follow_up_required,
      next_audit_date
    } = req.body;

    let result = await pool.query(
      `INSERT INTO food_safety_audits 
       (audit_type, facility_id, audit_scope, audit_criteria, audit_team, 
        scheduled_date, actual_date, findings, nonconformities, observations, 
        score, grade, recommendations, follow_up_required, next_audit_date, 
        status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'completed', NOW(), NOW())
       RETURNING *`,
      [
        audit_type, facility_id, JSON.stringify(audit_scope),
        JSON.stringify(audit_criteria), JSON.stringify(audit_team),
        scheduled_date, actual_date, JSON.stringify(findings),
        JSON.stringify(nonconformities), JSON.stringify(observations),
        score, grade, JSON.stringify(recommendations), follow_up_required,
        next_audit_date
      ]
    );

    logger.info(`Food safety audit created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create food safety audit error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create food safety audit' });
  }
});

/**
 * Get food safety audits
 */
router.get('/audits', authMiddleware, async (req, res) => {
  try {
    const { facility_id, audit_type, status, start_date, end_date } = req.query;
    
    let query = 'SELECT * FROM food_safety_audits WHERE 1=1';
    let params = [];
    let paramCount = 0;

    if (facility_id) {
      paramCount++;
      query += ` AND facility_id = $${paramCount}`;
      params.push(facility_id);
    }

    if (audit_type) {
      paramCount++;
      query += ` AND audit_type = $${paramCount}`;
      params.push(audit_type);
    }

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (start_date) {
      paramCount++;
      query += ` AND actual_date >= $${paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      query += ` AND actual_date <= $${paramCount}`;
      params.push(end_date);
    }

    let result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get food safety audits error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get food safety audits' });
  }
});

// ============================================================================
// RISK ASSESSMENT (CAP-253)
// ============================================================================

/**
 * Create risk assessment
 */
router.post('/risk-assessment', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const {
      assessment_type,
      facility_id,
      product_id,
      hazard_identification,
      risk_characterization,
      exposure_assessment,
      risk_level,
      likelihood,
      severity,
      mitigation_measures,
      residual_risk,
      assessment_date,
      assessed_by,
      review_date
    } = req.body;

    let result = await pool.query(
      `INSERT INTO food_safety_risk_assessments 
       (assessment_type, facility_id, product_id, hazard_identification, 
        risk_characterization, exposure_assessment, risk_level, likelihood, 
        severity, mitigation_measures, residual_risk, assessment_date, 
        assessed_by, review_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
       RETURNING *`,
      [
        assessment_type, facility_id, product_id,
        JSON.stringify(hazard_identification), JSON.stringify(risk_characterization),
        JSON.stringify(exposure_assessment), risk_level, likelihood, severity,
        JSON.stringify(mitigation_measures), residual_risk, assessment_date,
        assessed_by, review_date
      ]
    );

    logger.info(`Risk assessment created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create risk assessment error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create risk assessment' });
  }
});

/**
 * Get risk assessments
 */
router.get('/risk-assessment', authMiddleware, async (req, res) => {
  try {
    const { facility_id, product_id, assessment_type, risk_level } = req.query;
    
    let query = 'SELECT * FROM food_safety_risk_assessments WHERE 1=1';
    let params = [];
    let paramCount = 0;

    if (facility_id) {
      paramCount++;
      query += ` AND facility_id = $${paramCount}`;
      params.push(facility_id);
    }

    if (product_id) {
      paramCount++;
      query += ` AND product_id = $${paramCount}`;
      params.push(product_id);
    }

    if (assessment_type) {
      paramCount++;
      query += ` AND assessment_type = $${paramCount}`;
      params.push(assessment_type);
    }

    if (risk_level) {
      paramCount++;
      query += ` AND risk_level = $${paramCount}`;
      params.push(risk_level);
    }

    let result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get risk assessments error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get risk assessments' });
  }
});

// ============================================================================
// CORRECTIVE ACTIONS (CAP-254)
// ============================================================================

/**
 * Create corrective action
 */
router.post('/corrective-actions', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const {
      source_type,
      source_id,
      issue_description,
      immediate_action,
      root_cause,
      long_term_correction,
      responsibility,
      due_date,
      effectiveness_verification,
      completion_date,
      completed_by
    } = req.body;

    let result = await pool.query(
      `INSERT INTO corrective_actions 
       (source_type, source_id, issue_description, immediate_action, root_cause, 
        long_term_correction, responsibility, due_date, effectiveness_verification, 
        completion_date, completed_by, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'open', NOW(), NOW())
       RETURNING *`,
      [
        source_type, source_id, issue_description, immediate_action,
        root_cause, long_term_correction, responsibility, due_date,
        effectiveness_verification, completion_date, completed_by
      ]
    );

    logger.info(`Corrective action created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create corrective action error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create corrective action' });
  }
});

/**
 * Update corrective action status
 */
router.put('/corrective-actions/:id/status', authRateLimit, authMiddleware, requireRole(...PLATFORM_STAFF_ROLES), async (req, res) => {
  try {
    const { status, completion_notes, completed_by, effectiveness_result } = req.body;

    let result = await pool.query(
      `UPDATE corrective_actions 
       SET status = $1,
           completion_notes = $2,
           completed_by = $3,
           completion_date = CASE WHEN $1 = 'completed' THEN NOW() ELSE completion_date END,
           effectiveness_result = COALESCE($4, effectiveness_result),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [status, completion_notes, completed_by, effectiveness_result, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Corrective action not found' });
    }

    logger.info(`Corrective action status updated: ${req.params.id} to ${status}`);
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Update corrective action status error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to update corrective action status' });
  }
});

/**
 * Get corrective actions
 */
router.get('/corrective-actions', authMiddleware, async (req, res) => {
  try {
    const { source_type, source_id, status, responsibility } = req.query;
    
    let query = 'SELECT * FROM corrective_actions WHERE 1=1';
    let params = [];
    let paramCount = 0;

    if (source_type) {
      paramCount++;
      query += ` AND source_type = $${paramCount}`;
      params.push(source_type);
    }

    if (source_id) {
      paramCount++;
      query += ` AND source_id = $${paramCount}`;
      params.push(source_id);
    }

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (responsibility) {
      paramCount++;
      query += ` AND responsibility = $${paramCount}`;
      params.push(responsibility);
    }

    let result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get corrective actions error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get corrective actions' });
  }
});

/**
 * Get food safety dashboard
 */
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const dashboard = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'active') as active_haccp_plans,
        COUNT(*) FILTER (WHERE compliance_status = 'compliant') as fssai_compliant,
        COUNT(*) FILTER (WHERE status = 'active') as active_iso_certificates,
        COUNT(*) FILTER (WHERE status = 'initiated') as active_recalls,
        COUNT(*) FILTER (WHERE status = 'open') as open_capa,
        COUNT(*) FILTER (WHERE grade = 'A') as grade_a_audits,
        COUNT(*) FILTER (WHERE risk_level = 'high') as high_risk_assessments,
        COUNT(*) FILTER (WHERE status = 'open') as pending_corrective_actions
      FROM (
        SELECT status FROM haccp_plans
        UNION ALL
        SELECT compliance_status as status FROM fssai_compliance
        UNION ALL
        SELECT status FROM iso22000_compliance
        UNION ALL
        SELECT status FROM food_safety_recalls
        UNION ALL
        SELECT status FROM capa_records
        UNION ALL
        SELECT grade as status FROM food_safety_audits
        UNION ALL
        SELECT risk_level as status FROM food_safety_risk_assessments
        UNION ALL
        SELECT status FROM corrective_actions
      ) combined
    `);

    res.json(dashboard.rows[0]);
  } catch (error) {
    logger.error('Get food safety dashboard error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get food safety dashboard' });
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
