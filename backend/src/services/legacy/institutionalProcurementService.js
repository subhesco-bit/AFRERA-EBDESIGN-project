/**
 * Institutional Procurement ERP Service
 * CAP-262 to CAP-268: Tender Management, Demand Forecasting, Institution Menu Planning,
 * Nutrition Compliance, Supply Contracts, Quality Inspection, Settlement Management
 */

const express = require('express');
const { Pool } = require('pg');
const { logger } = require('../../../utils/logger');
const { authMiddleware, requireRole } = require('../../../middleware/auth');
const { PROCUREMENT_ROLES } = require('../../../middleware/roleGroups');
const { authLimiter } = require('../../../middleware/rateLimiter');

const router = express.Router();
// Shared pool (2026-08-04): this service previously built its own Pool.
// 42 services doing so meant ~420 potential connections against a
// PostgreSQL default max_connections of 100. See database/pool.js.
const pool = require('../../../database/pool');

// ============================================================================
// TENDER MANAGEMENT (CAP-262)
// ============================================================================

/**
 * Create tender
 */
router.post('/tenders', authLimiter, authMiddleware, async (req, res) => {
  try {
    const {
      tender_number,
      institution_id,
      tender_type,
      title,
      description,
      procurement_category,
      estimated_value,
      bid_security_amount,
      pre_bid_meeting_date,
      bid_submission_deadline,
      bid_opening_date,
      technical_evaluation_date,
      financial_evaluation_date,
      award_date,
      contract_duration,
      delivery_schedule,
      payment_terms,
      eligibility_criteria,
      evaluation_criteria,
      documents_required,
      status,
      created_by
    } = req.body;

    const result = await pool.query(
      `INSERT INTO procurement_tenders 
       (tender_number, institution_id, tender_type, title, description, 
        procurement_category, estimated_value, bid_security_amount, pre_bid_meeting_date, 
        bid_submission_deadline, bid_opening_date, technical_evaluation_date, 
        financial_evaluation_date, award_date, contract_duration, delivery_schedule, 
        payment_terms, eligibility_criteria, evaluation_criteria, documents_required, 
        status, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW(), NOW())
       RETURNING *`,
      [
        tender_number, institution_id, tender_type, title, description,
        procurement_category, estimated_value, bid_security_amount, pre_bid_meeting_date,
        bid_submission_deadline, bid_opening_date, technical_evaluation_date,
        financial_evaluation_date, award_date, contract_duration,
        JSON.stringify(delivery_schedule), JSON.stringify(payment_terms),
        JSON.stringify(eligibility_criteria), JSON.stringify(evaluation_criteria),
        JSON.stringify(documents_required), status, created_by
      ]
    );

    logger.info(`Tender created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create tender error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create tender' });
  }
});

/**
 * Get tenders
 */
router.get('/tenders', authMiddleware, async (req, res) => {
  try {
    const { institution_id, tender_type, status, procurement_category } = req.query;
    
    let query = 'SELECT * FROM procurement_tenders WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (institution_id) {
      paramCount++;
      query += ` AND institution_id = $${paramCount}`;
      params.push(institution_id);
    }

    if (tender_type) {
      paramCount++;
      query += ` AND tender_type = $${paramCount}`;
      params.push(tender_type);
    }

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (procurement_category) {
      paramCount++;
      query += ` AND procurement_category = $${paramCount}`;
      params.push(procurement_category);
    }

    let result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get tenders error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get tenders' });
  }
});

/**
 * Submit bid for tender
 */
router.post('/tenders/:id/bids', authLimiter, authMiddleware, async (req, res) => {
  try {
    const {
      supplier_id,
      bid_amount,
      technical_proposal,
      financial_proposal,
      documents_submitted,
      bid_security_provided,
      proposed_delivery_schedule,
      proposed_payment_terms
    } = req.body;

    let result = await pool.query(
      `INSERT INTO tender_bids 
       (tender_id, supplier_id, bid_amount, technical_proposal, financial_proposal, 
        documents_submitted, bid_security_provided, proposed_delivery_schedule, 
        proposed_payment_terms, submission_date, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), 'submitted', NOW(), NOW())
       RETURNING *`,
      [
        req.params.id, req.user.id, bid_amount, JSON.stringify(technical_proposal),
        JSON.stringify(financial_proposal), JSON.stringify(documents_submitted),
        bid_security_provided, JSON.stringify(proposed_delivery_schedule),
        JSON.stringify(proposed_payment_terms)
      ]
    );

    logger.info(`Bid submitted for tender ${req.params.id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Submit bid error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to submit bid' });
  }
});

// ============================================================================
// DEMAND FORECASTING (CAP-263)
// ============================================================================

/**
 * Create demand forecast
 */
router.post('/demand-forecast', authLimiter, authMiddleware, async (req, res) => {
  try {
    const {
      institution_id,
      forecast_period,
      forecast_type,
      product_category,
      historical_data,
      seasonal_factors,
      special_events,
      enrollment_data,
      menu_requirements,
      budget_constraints,
      forecast_method,
      confidence_level,
      generated_by
    } = req.body;

    let result = await pool.query(
      `INSERT INTO demand_forecasts 
       (institution_id, forecast_period, forecast_type, product_category, 
        historical_data, seasonal_factors, special_events, enrollment_data, 
        menu_requirements, budget_constraints, forecast_method, confidence_level, 
        generated_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
       RETURNING *`,
      [
        institution_id, forecast_period, forecast_type, product_category,
        JSON.stringify(historical_data), JSON.stringify(seasonal_factors),
        JSON.stringify(special_events), JSON.stringify(enrollment_data),
        JSON.stringify(menu_requirements), JSON.stringify(budget_constraints),
        forecast_method, confidence_level, generated_by
      ]
    );

    logger.info(`Demand forecast created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create demand forecast error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create demand forecast' });
  }
});

/**
 * Get demand forecasts
 */
router.get('/demand-forecast', authMiddleware, async (req, res) => {
  try {
    const { institution_id, forecast_type, product_category } = req.query;
    
    let query = 'SELECT * FROM demand_forecasts WHERE 1=1';
    let params = [];
    let paramCount = 0;

    if (institution_id) {
      paramCount++;
      query += ` AND institution_id = $${paramCount}`;
      params.push(institution_id);
    }

    if (forecast_type) {
      paramCount++;
      query += ` AND forecast_type = $${paramCount}`;
      params.push(forecast_type);
    }

    if (product_category) {
      paramCount++;
      query += ` AND product_category = $${paramCount}`;
      params.push(product_category);
    }

    let result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get demand forecasts error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get demand forecasts' });
  }
});

// ============================================================================
// INSTITUTION MENU PLANNING (CAP-264)
// ============================================================================

/**
 * Create menu plan
 */
router.post('/menu-plans', authLimiter, authMiddleware, async (req, res) => {
  try {
    const {
      institution_id,
      plan_name,
      plan_type,
      start_date,
      end_date,
      meal_types,
      target_demographics,
      nutritional_requirements,
      budget_per_meal,
      special_dietary_requirements,
      seasonal_preferences,
      local_sourcing_requirements,
      menu_items,
      ingredients_list,
      portion_sizes,
      preparation_instructions,
      allergen_information,
      approved_by,
      status
    } = req.body;

    let result = await pool.query(
      `INSERT INTO menu_plans 
       (institution_id, plan_name, plan_type, start_date, end_date, meal_types, 
        target_demographics, nutritional_requirements, budget_per_meal, 
        special_dietary_requirements, seasonal_preferences, local_sourcing_requirements, 
        menu_items, ingredients_list, portion_sizes, preparation_instructions, 
        allergen_information, approved_by, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW())
       RETURNING *`,
      [
        institution_id, plan_name, plan_type, start_date, end_date,
        JSON.stringify(meal_types), JSON.stringify(target_demographics),
        JSON.stringify(nutritional_requirements), budget_per_meal,
        JSON.stringify(special_dietary_requirements), JSON.stringify(seasonal_preferences),
        JSON.stringify(local_sourcing_requirements), JSON.stringify(menu_items),
        JSON.stringify(ingredients_list), JSON.stringify(portion_sizes),
        JSON.stringify(preparation_instructions), JSON.stringify(allergen_information),
        approved_by, status
      ]
    );

    logger.info(`Menu plan created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create menu plan error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create menu plan' });
  }
});

/**
 * Get menu plans
 */
router.get('/menu-plans', authMiddleware, async (req, res) => {
  try {
    const { institution_id, plan_type, status, start_date, end_date } = req.query;
    
    let query = 'SELECT * FROM menu_plans WHERE 1=1';
    let params = [];
    let paramCount = 0;

    if (institution_id) {
      paramCount++;
      query += ` AND institution_id = $${paramCount}`;
      params.push(institution_id);
    }

    if (plan_type) {
      paramCount++;
      query += ` AND plan_type = $${paramCount}`;
      params.push(plan_type);
    }

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (start_date) {
      paramCount++;
      query += ` AND end_date >= $${paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      query += ` AND start_date <= $${paramCount}`;
      params.push(end_date);
    }

    let result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get menu plans error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get menu plans' });
  }
});

// ============================================================================
// NUTRITION COMPLIANCE (CAP-265)
// ============================================================================

/**
 * Create nutrition compliance record
 */
router.post('/nutrition-compliance', authLimiter, authMiddleware, async (req, res) => {
  try {
    const {
      institution_id,
      compliance_type,
      compliance_period,
      nutritional_standards,
      actual_achievement,
      deficiencies,
      corrective_actions,
      compliance_score,
      assessed_by,
      assessment_date,
      next_assessment_date
    } = req.body;

    let result = await pool.query(
      `INSERT INTO nutrition_compliance 
       (institution_id, compliance_type, compliance_period, nutritional_standards, 
        actual_achievement, deficiencies, corrective_actions, compliance_score, 
        assessed_by, assessment_date, next_assessment_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
       RETURNING *`,
      [
        institution_id, compliance_type, compliance_period,
        JSON.stringify(nutritional_standards), JSON.stringify(actual_achievement),
        JSON.stringify(deficiencies), JSON.stringify(corrective_actions),
        compliance_score, assessed_by, assessment_date, next_assessment_date
      ]
    );

    logger.info(`Nutrition compliance record created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create nutrition compliance record error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create nutrition compliance record' });
  }
});

/**
 * Get nutrition compliance records
 */
router.get('/nutrition-compliance', authMiddleware, async (req, res) => {
  try {
    const { institution_id, compliance_type, assessment_date } = req.query;
    
    let query = 'SELECT * FROM nutrition_compliance WHERE 1=1';
    let params = [];
    let paramCount = 0;

    if (institution_id) {
      paramCount++;
      query += ` AND institution_id = $${paramCount}`;
      params.push(institution_id);
    }

    if (compliance_type) {
      paramCount++;
      query += ` AND compliance_type = $${paramCount}`;
      params.push(compliance_type);
    }

    if (assessment_date) {
      paramCount++;
      query += ` AND assessment_date = $${paramCount}`;
      params.push(assessment_date);
    }

    let result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get nutrition compliance records error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get nutrition compliance records' });
  }
});

// ============================================================================
// SUPPLY CONTRACTS (CAP-266)
// ============================================================================

/**
 * Create supply contract
 */
router.post('/contracts', authLimiter, authMiddleware, async (req, res) => {
  try {
    const {
      contract_number,
      institution_id,
      supplier_id,
      contract_type,
      tender_id,
      start_date,
      end_date,
      contract_value,
      products_supplied,
      delivery_schedule,
      quality_standards,
      payment_terms,
      penalty_clauses,
      force_majeure,
      renewal_terms,
      termination_conditions,
      special_conditions,
      status,
      signed_by
    } = req.body;

    let result = await pool.query(
      `INSERT INTO supply_contracts 
       (contract_number, institution_id, supplier_id, contract_type, tender_id, 
        start_date, end_date, contract_value, products_supplied, delivery_schedule, 
        quality_standards, payment_terms, penalty_clauses, force_majeure, 
        renewal_terms, termination_conditions, special_conditions, status, 
        signed_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW())
       RETURNING *`,
      [
        contract_number, institution_id, supplier_id, contract_type, tender_id,
        start_date, end_date, contract_value, JSON.stringify(products_supplied),
        JSON.stringify(delivery_schedule), JSON.stringify(quality_standards),
        JSON.stringify(payment_terms), JSON.stringify(penalty_clauses),
        force_majeure, JSON.stringify(renewal_terms), JSON.stringify(termination_conditions),
        JSON.stringify(special_conditions), status, signed_by
      ]
    );

    logger.info(`Supply contract created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create supply contract error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create supply contract' });
  }
});

/**
 * Get supply contracts
 */
router.get('/contracts', authMiddleware, async (req, res) => {
  try {
    const { institution_id, supplier_id, contract_type, status } = req.query;
    
    let query = 'SELECT * FROM supply_contracts WHERE 1=1';
    let params = [];
    let paramCount = 0;

    if (institution_id) {
      paramCount++;
      query += ` AND institution_id = $${paramCount}`;
      params.push(institution_id);
    }

    if (supplier_id) {
      paramCount++;
      query += ` AND supplier_id = $${paramCount}`;
      params.push(supplier_id);
    }

    if (contract_type) {
      paramCount++;
      query += ` AND contract_type = $${paramCount}`;
      params.push(contract_type);
    }

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    let result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get supply contracts error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get supply contracts' });
  }
});

// ============================================================================
// QUALITY INSPECTION (CAP-267)
// ============================================================================

/**
 * Create quality inspection
 */
router.post('/quality-inspections', authLimiter, authMiddleware, async (req, res) => {
  try {
    const {
      inspection_number,
      contract_id,
      shipment_id,
      inspection_type,
      inspection_date,
      inspector_id,
      inspection_location,
      sample_size,
      inspection_criteria,
      test_results,
      quality_score,
      pass_fail,
      defects_found,
      non_conformities,
      corrective_actions_required,
      approval_status,
      notes
    } = req.body;

    let result = await pool.query(
      `INSERT INTO quality_inspections 
       (inspection_number, contract_id, shipment_id, inspection_type, inspection_date, 
        inspector_id, inspection_location, sample_size, inspection_criteria, test_results, 
        quality_score, pass_fail, defects_found, non_conformities, corrective_actions_required, 
        approval_status, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
       RETURNING *`,
      [
        inspection_number, contract_id, shipment_id, inspection_type, inspection_date,
        inspector_id, inspection_location, sample_size, JSON.stringify(inspection_criteria),
        JSON.stringify(test_results), quality_score, pass_fail, JSON.stringify(defects_found),
        JSON.stringify(non_conformities), JSON.stringify(corrective_actions_required),
        approval_status, notes
      ]
    );

    logger.info(`Quality inspection created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create quality inspection error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create quality inspection' });
  }
});

/**
 * Get quality inspections
 */
router.get('/quality-inspections', authMiddleware, async (req, res) => {
  try {
    const { contract_id, shipment_id, inspection_type, approval_status } = req.query;
    
    let query = 'SELECT * FROM quality_inspections WHERE 1=1';
    let params = [];
    let paramCount = 0;

    if (contract_id) {
      paramCount++;
      query += ` AND contract_id = $${paramCount}`;
      params.push(contract_id);
    }

    if (shipment_id) {
      paramCount++;
      query += ` AND shipment_id = $${paramCount}`;
      params.push(shipment_id);
    }

    if (inspection_type) {
      paramCount++;
      query += ` AND inspection_type = $${paramCount}`;
      params.push(inspection_type);
    }

    if (approval_status) {
      paramCount++;
      query += ` AND approval_status = $${paramCount}`;
      params.push(approval_status);
    }

    let result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get quality inspections error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get quality inspections' });
  }
});

// ============================================================================
// SETTLEMENT MANAGEMENT (CAP-268)
// ============================================================================

/**
 * Create settlement record
 */
router.post('/settlements', authLimiter, authMiddleware, async (req, res) => {
  try {
    const {
      settlement_number,
      contract_id,
      invoice_id,
      settlement_type,
      settlement_date,
      amount_due,
      amount_paid,
      deductions,
      penalties,
      bonuses,
      payment_method,
      payment_reference,
      settled_by,
      approved_by,
      notes
    } = req.body;

    let result = await pool.query(
      `INSERT INTO settlement_records 
       (settlement_number, contract_id, invoice_id, settlement_type, settlement_date, 
        amount_due, amount_paid, deductions, penalties, bonuses, payment_method, 
        payment_reference, settled_by, approved_by, notes, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'completed', NOW(), NOW())
       RETURNING *`,
      [
        settlement_number, contract_id, invoice_id, settlement_type, settlement_date,
        amount_due, amount_paid, JSON.stringify(deductions), JSON.stringify(penalties),
        JSON.stringify(bonuses), payment_method, payment_reference, settled_by, approved_by, notes
      ]
    );

    logger.info(`Settlement record created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create settlement record error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create settlement record' });
  }
});

/**
 * Get settlement records
 */
router.get('/settlements', authMiddleware, async (req, res) => {
  try {
    const { contract_id, invoice_id, settlement_type, status } = req.query;
    
    let query = 'SELECT * FROM settlement_records WHERE 1=1';
    let params = [];
    let paramCount = 0;

    if (contract_id) {
      paramCount++;
      query += ` AND contract_id = $${paramCount}`;
      params.push(contract_id);
    }

    if (invoice_id) {
      paramCount++;
      query += ` AND invoice_id = $${paramCount}`;
      params.push(invoice_id);
    }

    if (settlement_type) {
      paramCount++;
      query += ` AND settlement_type = $${paramCount}`;
      params.push(settlement_type);
    }

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    let result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get settlement records error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get settlement records' });
  }
});

/**
 * Get institutional procurement dashboard
 */
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const { institution_id } = req.query;

    const dashboard = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'open') as active_tenders,
        COUNT(*) FILTER (WHERE status = 'awarded') as awarded_contracts,
        COUNT(*) FILTER (WHERE approval_status = 'pending') as pending_inspections,
        COUNT(*) FILTER (WHERE pass_fail = false) as failed_inspections,
        SUM(contract_value) FILTER (WHERE status = 'active') as active_contract_value,
        AVG(compliance_score) as avg_nutrition_compliance,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_settlements,
        SUM(amount_paid) as total_settlements
      FROM (
        SELECT status FROM procurement_tenders WHERE ($1::text IS NULL OR institution_id = $1)
        UNION ALL
        SELECT status FROM supply_contracts WHERE ($1::text IS NULL OR institution_id = $1)
        UNION ALL
        SELECT approval_status FROM quality_inspections
        UNION ALL
        SELECT pass_fail FROM quality_inspections
        UNION ALL
        SELECT contract_value, status FROM supply_contracts WHERE ($1::text IS NULL OR institution_id = $1)
        UNION ALL
        SELECT compliance_score FROM nutrition_compliance WHERE ($1::text IS NULL OR institution_id = $1)
        UNION ALL
        SELECT status FROM settlement_records
        UNION ALL
        SELECT amount_paid FROM settlement_records
      ) combined
    `, [institution_id]);

    res.json(dashboard.rows[0]);
  } catch (error) {
    logger.error('Get institutional procurement dashboard error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get institutional procurement dashboard' });
  }
});

// ============================================================================
// MAP-PROTECTED CONTRACT OFFERS (v44 feature 7)
//
// farmer_contract_readiness (054_v8_v9_commerce_recovery.sql) has stored
// map_price_inr_per_kg — the farmer's own floor price — with zero consumers
// (grep -r contract_readiness backend/src/services matched nothing before
// this). This is the consumer: an institution submits an offer, it is
// checked against the farmer's floor before it is ever persisted, and a
// below-floor offer is rejected without ever being written to
// contract_offers (migration 9995_scheme_verification_map_protection.sql) —
// so nothing exists for the farmer to see, matching the prototype's "offers
// below it are auto-rejected before they reach you". The floor price itself
// is never returned in any response body here, so a buyer polling this
// endpoint's responses cannot infer it either.
// ============================================================================

function generateOfferNumber() {
  return `OFR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

/**
 * Submit a contract offer. Institution-side: authenticated, but the caller
 * never learns the farmer's floor — only whether the offer cleared it.
 */
router.post('/contract-offers', authLimiter, authMiddleware, async (req, res) => {
  try {
    const {
      farmer_id, crop, institution_id, offered_price_inr_per_kg, quantity_kg,
      delivery_schedule, payment_terms, special_conditions
    } = req.body;

    if (!farmer_id || !crop || !offered_price_inr_per_kg || !quantity_kg) {
      return res.status(400).json({ error: 'farmer_id, crop, offered_price_inr_per_kg and quantity_kg are required' });
    }

    const readiness = await pool.query(
      `SELECT map_price_inr_per_kg FROM farmer_contract_readiness
       WHERE farmer_id = $1 AND crop = $2`,
      [farmer_id, crop]
    );

    const mapPrice = readiness.rows[0] ? readiness.rows[0].map_price_inr_per_kg : null;

    if (mapPrice !== null && Number(offered_price_inr_per_kg) < Number(mapPrice)) {
      // Below the farmer's floor: rejected before it reaches them. No row is
      // written, and the response does not disclose the floor value — only
      // that this particular offer did not clear it.
      logger.info(`Contract offer below MAP rejected for farmer ${farmer_id}/${crop}`);
      return res.status(422).json({
        error: 'Offer rejected: below the farmer\'s protected floor price. It was not delivered to the farmer.',
        status: 'rejected_below_map'
      });
    }

    let result = await pool.query(
      `INSERT INTO contract_offers
        (offer_number, farmer_id, crop, institution_id, offered_price_inr_per_kg,
         quantity_kg, delivery_schedule, payment_terms, special_conditions, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending_farmer_review')
       RETURNING id, offer_number, farmer_id, crop, institution_id,
                 offered_price_inr_per_kg, quantity_kg, status, created_at`,
      [
        generateOfferNumber(), farmer_id, crop, institution_id || null,
        offered_price_inr_per_kg, quantity_kg,
        JSON.stringify(delivery_schedule || null), JSON.stringify(payment_terms || null),
        JSON.stringify(special_conditions || null)
      ]
    );

    logger.info(`Contract offer created: ${result.rows[0].offer_number}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create contract offer error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create contract offer' });
  }
});

/**
 * Farmer-side listing: only offers that already cleared their floor exist
 * to be listed, so the MAP price never appears in this response either.
 */
router.get('/contract-offers', authMiddleware, async (req, res) => {
  try {
    const { farmer_id, crop, status } = req.query;
    const conditions = [];
    let params = [];

    if (farmer_id) { params.push(farmer_id); conditions.push(`farmer_id = $${params.length}`); }
    if (crop) { params.push(crop); conditions.push(`crop = $${params.length}`); }
    if (status) { params.push(status); conditions.push(`status = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    let result = await pool.query(
      `SELECT id, offer_number, farmer_id, crop, institution_id, offered_price_inr_per_kg,
              quantity_kg, delivery_schedule, payment_terms, special_conditions, status,
              created_at, updated_at
       FROM contract_offers ${where}
       ORDER BY created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('List contract offers error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to list contract offers' });
  }
});

/**
 * Farmer accepts/declines/withdraws an offer they already received.
 */
router.put('/contract-offers/:id', authMiddleware, requireRole(...PROCUREMENT_ROLES), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'declined', 'withdrawn'].includes(status)) {
      return res.status(400).json({ error: 'status must be one of accepted, declined, withdrawn' });
    }

    let result = await pool.query(
      `UPDATE contract_offers SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, offer_number, farmer_id, crop, status, updated_at`,
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contract offer not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Update contract offer error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to update contract offer' });
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


