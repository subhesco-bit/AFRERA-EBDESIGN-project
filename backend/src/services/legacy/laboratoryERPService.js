/**
 * Laboratory ERP (LIMS) Service
 * Manages laboratory operations, sample testing, and certification
 */

const express = require('express');
const { Pool } = require('pg');
const { logger } = require('../../../utils/logger');
const { authMiddleware, requireRole } = require('../../../middleware/auth');
const { PLATFORM_STAFF_ROLES } = require('../../../middleware/roleGroups');

const router = express.Router();
// Shared pool (2026-08-04): this service previously built its own Pool.
// 42 services doing so meant ~420 potential connections against a
// PostgreSQL default max_connections of 100. See database/pool.js.
const pool = require('../../../database/pool');

// ============================================================================
// LABORATORY REGISTRY
// ============================================================================

/**
 * Register laboratory
 */
async function registerLaboratory(data) {
  const {
    lab_code,
    lab_name,
    registration_number,
    nabl_accredited,
    nabl_number,
    nabl_expiry_date,
    accreditation_type,
    location_id,
    contact_person,
    contact_email,
    contact_phone,
    testing_capabilities,
    equipment_list
  } = data;

  try {
    const result = await pool.query(
      `INSERT INTO laboratories 
       (lab_code, lab_name, registration_number, nabl_accredited, nabl_number, nabl_expiry_date, 
        accreditation_type, location_id, contact_person, contact_email, contact_phone, 
        testing_capabilities, equipment_list)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        lab_code,
        lab_name,
        registration_number,
        nabl_accredited,
        nabl_number,
        nabl_expiry_date,
        accreditation_type,
        location_id,
        contact_person,
        contact_email,
        contact_phone,
        JSON.stringify(testing_capabilities),
        JSON.stringify(equipment_list)
      ]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Register laboratory error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to register laboratory
 */
router.post('/laboratories', authMiddleware, async (req, res) => {
  try {
    let result = await registerLaboratory(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Register laboratory API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to register laboratory' });
  }
});

/**
 * Get all laboratories
 */
async function getLaboratories() {
  try {
    let result = await pool.query(
      `SELECT l.*, a.city, a.state 
       FROM laboratories l
       LEFT JOIN addresses a ON l.location_id = a.id
       WHERE l.status = 'active'
       ORDER BY l.lab_name`
    );
    return result.rows;
  } catch (error) {
    logger.error('Get laboratories error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get laboratories
 */
router.get('/laboratories', async (req, res) => {
  try {
    let result = await getLaboratories();
    res.json(result);
  } catch (error) {
    logger.error('Get laboratories API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get laboratories' });
  }
});

// ============================================================================
// TEST CATEGORIES & METHODS
// ============================================================================

/**
 * Get test categories
 */
async function getTestCategories() {
  try {
    let result = await pool.query(
      'SELECT * FROM test_categories WHERE is_active = true ORDER BY name'
    );
    return result.rows;
  } catch (error) {
    logger.error('Get test categories error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get test categories
 */
router.get('/test-categories', async (req, res) => {
  try {
    let result = await getTestCategories();
    res.json(result);
  } catch (error) {
    logger.error('Get test categories API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get test categories' });
  }
});

/**
 * Get test methods
 */
async function getTestMethods(categoryId = null) {
  try {
    let query = 'SELECT tm.*, tc.name as category_name FROM test_methods tm LEFT JOIN test_categories tc ON tm.category_id = tc.id WHERE tm.is_active = true';
    const params = [];

    if (categoryId) {
      query += ' AND tm.category_id = $1';
      params.push(categoryId);
    }

    query += ' ORDER BY tm.name';

    let result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('Get test methods error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get test methods
 */
router.get('/test-methods', async (req, res) => {
  try {
    const { category_id } = req.query;
    let result = await getTestMethods(category_id);
    res.json(result);
  } catch (error) {
    logger.error('Get test methods API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get test methods' });
  }
});

// ============================================================================
// SAMPLE REGISTRATION
// ============================================================================

/**
 * Register sample for testing
 */
async function registerSample(data) {
  const {
    submitted_by,
    laboratory_id,
    sample_type,
    sample_source,
    collection_date,
    collection_method,
    sample_description,
    quantity_g,
    batch_number,
    priority,
    requested_tests,
    special_instructions
  } = data;

  try {
    // Generate sample number
    const sampleNumber = `SMP-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    let result = await pool.query(
      `INSERT INTO sample_registrations 
       (sample_number, submitted_by, laboratory_id, sample_type, sample_source, collection_date, 
        collection_method, sample_description, quantity_g, batch_number, priority, 
        requested_tests, special_instructions, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'received')
       RETURNING *`,
      [
        sampleNumber,
        submitted_by,
        laboratory_id,
        sample_type,
        sample_source,
        collection_date,
        collection_method,
        sample_description,
        quantity_g,
        batch_number,
        priority,
        JSON.stringify(requested_tests),
        special_instructions
      ]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Register sample error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to register sample
 */
router.post('/samples', authMiddleware, async (req, res) => {
  try {
    let result = await registerSample({
      ...req.body,
      submitted_by: req.user.id
    });
    res.status(201).json(result);
  } catch (error) {
    logger.error('Register sample API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to register sample' });
  }
});

/**
 * Get samples for a user
 */
async function getSamples(userId, status = null) {
  try {
    let query = `
      SELECT sr.*, l.lab_name, l.lab_code 
      FROM sample_registrations sr
      LEFT JOIN laboratories l ON sr.laboratory_id = l.id
      WHERE sr.submitted_by = $1
    `;
    let params = [userId];

    if (status) {
      query += ' AND sr.status = $2';
      params.push(status);
    }

    query += ' ORDER BY sr.created_at DESC';

    let result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('Get samples error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get samples
 */
router.get('/samples', authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    let result = await getSamples(req.user.id, status);
    res.json(result);
  } catch (error) {
    logger.error('Get samples API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get samples' });
  }
});

/**
 * Get sample by number
 */
async function getSampleByNumber(sampleNumber) {
  try {
    let result = await pool.query(
      `SELECT sr.*, l.lab_name, l.lab_code, a.city, a.state
       FROM sample_registrations sr
       LEFT JOIN laboratories l ON sr.laboratory_id = l.id
       LEFT JOIN addresses a ON l.location_id = a.id
       WHERE sr.sample_number = $1`,
      [sampleNumber]
    );

    if (result.rows.length === 0) {
      throw new Error('Sample not found');
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Get sample error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get sample by number
 */
router.get('/samples/:sampleNumber', authMiddleware, async (req, res) => {
  try {
    let result = await getSampleByNumber(req.params.sampleNumber);
    res.json(result);
  } catch (error) {
    logger.error('Get sample API error', { error: error.message, stack: error.stack });
    res.status(404).json({ error: 'Sample not found' });
  }
});

// ============================================================================
// TEST ASSIGNMENTS
// ============================================================================

/**
 * Assign test to analyst
 */
async function assignTest(sampleId, testMethodId, assignedTo) {
  try {
    let result = await pool.query(
      `INSERT INTO test_assignments 
       (sample_id, test_method_id, assigned_to, status)
       VALUES ($1, $2, $3, 'assigned')
       RETURNING *`,
      [sampleId, testMethodId, assignedTo]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Assign test error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to assign test
 */
router.post('/test-assignments', authMiddleware, async (req, res) => {
  try {
    const { sample_id, test_method_id, assigned_to } = req.body;
    let result = await assignTest(sample_id, test_method_id, assigned_to);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Assign test API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to assign test' });
  }
});

/**
 * Update test assignment with results
 */
async function updateTestResults(assignmentId, results, comments) {
  try {
    let result = await pool.query(
      `UPDATE test_assignments 
       SET results = $1, comments = $2, status = 'completed', completed_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [JSON.stringify(results), comments, assignmentId]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Update test results error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to update test results
 */
router.put('/test-assignments/:assignmentId/results', authMiddleware, requireRole(...PLATFORM_STAFF_ROLES), async (req, res) => {
  try {
    const { results, comments } = req.body;
    let result = await updateTestResults(req.params.assignmentId, results, comments);
    res.json(result);
  } catch (error) {
    logger.error('Update test results API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to update test results' });
  }
});

// ============================================================================
// CERTIFICATION REPORTS
// ============================================================================

/**
 * Generate certification report
 */
async function generateCertificationReport(sampleId, reportType) {
  try {
    const reportNumber = `RPT-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Get sample data
    const sample = await pool.query(
      'SELECT * FROM sample_registrations WHERE id = $1',
      [sampleId]
    );

    if (sample.rows.length === 0) {
      throw new Error('Sample not found');
    }

    // Get test assignments and results
    const assignments = await pool.query(
      'SELECT * FROM test_assignments WHERE sample_id = $1',
      [sampleId]
    );

    const reportData = {
      sample: sample.rows[0],
      tests: assignments.rows,
      generated_at: new Date()
    };

    let result = await pool.query(
      `INSERT INTO certification_reports 
       (sample_id, report_number, report_type, report_data, status)
       VALUES ($1, $2, $3, $4, 'draft')
       RETURNING *`,
      [sampleId, reportNumber, reportType, JSON.stringify(reportData)]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Generate certification report error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to generate certification report
 */
router.post('/certification-reports', authMiddleware, async (req, res) => {
  try {
    const { sample_id, report_type } = req.body;
    let result = await generateCertificationReport(sample_id, report_type);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Generate certification report API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to generate certification report' });
  }
});

/**
 * Get certification report
 */
async function getCertificationReport(reportNumber) {
  try {
    let result = await pool.query(
      'SELECT * FROM certification_reports WHERE report_number = $1',
      [reportNumber]
    );

    if (result.rows.length === 0) {
      throw new Error('Report not found');
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Get certification report error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get certification report
 */
router.get('/certification-reports/:reportNumber', authMiddleware, async (req, res) => {
  try {
    let result = await getCertificationReport(req.params.reportNumber);
    res.json(result);
  } catch (error) {
    logger.error('Get certification report API error', { error: error.message, stack: error.stack });
    res.status(404).json({ error: 'Report not found' });
  }
});

// ============================================================================
// SAMPLE TRACKING
// ============================================================================

/**
 * Add sample tracking event
 */
async function addSampleTracking(sampleId, status, location, handledBy, notes) {
  try {
    let result = await pool.query(
      `INSERT INTO sample_tracking 
       (sample_id, status, location, handled_by, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [sampleId, status, location, handledBy, notes]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Add sample tracking error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to add sample tracking
 */
router.post('/samples/:sampleId/tracking', authMiddleware, async (req, res) => {
  try {
    const { status, location, handled_by, notes } = req.body;
    let result = await addSampleTracking(req.params.sampleId, status, location, handled_by, notes);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Add sample tracking API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to add sample tracking' });
  }
});

/**
 * Get sample tracking history
 */
async function getSampleTracking(sampleId) {
  try {
    let result = await pool.query(
      'SELECT * FROM sample_tracking WHERE sample_id = $1 ORDER BY timestamp ASC',
      [sampleId]
    );

    return result.rows;
  } catch (error) {
    logger.error('Get sample tracking error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get sample tracking
 */
router.get('/samples/:sampleId/tracking', authMiddleware, async (req, res) => {
  try {
    let result = await getSampleTracking(req.params.sampleId);
    res.json(result);
  } catch (error) {
    logger.error('Get sample tracking API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get sample tracking' });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

function isHealthy() {
  return pool.connect().then(() => true).catch(() => false);
}

module.exports = {
  router,
  registerLaboratory,
  getLaboratories,
  getTestCategories,
  getTestMethods,
  registerSample,
  getSamples,
  getSampleByNumber,
  assignTest,
  updateTestResults,
  generateCertificationReport,
  getCertificationReport,
  addSampleTracking,
  getSampleTracking,
  isHealthy
};

