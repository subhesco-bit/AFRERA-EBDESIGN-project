/**
 * Insurance Service
 * Manages insurance policies, claims, and master policies
 */

const { logger } = require('../../utils\/logger');
const { getPostgreSQL } = require('../../database\/connection');
const { authMiddleware, requireRole } = require('../../middleware\/auth');
const { PLATFORM_STAFF_ROLES } = require('../../middleware\/roleGroups');

/**
 * Create insurance policy
 */
async function createPolicy(policyData) {
  try {
    const pg = getPostgreSQL();
    
    const policyNumber = generatePolicyNumber();
    
    const query = `
      INSERT INTO policies (policy_number, user_id, farmer_id, product_id, master_policy_id,
                           coverage_amount, premium_amount, policy_start_date, policy_end_date,
                           insurer_name, insurer_policy_number, beneficiaries)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    
    const result = await pg.query(query, [
      policyNumber,
      policyData.user_id || null,
      policyData.farmer_id || null,
      policyData.product_id,
      policyData.master_policy_id || null,
      policyData.coverage_amount,
      policyData.premium_amount,
      policyData.policy_start_date,
      policyData.policy_end_date,
      policyData.insurer_name,
      policyData.insurer_policy_number || null,
      JSON.stringify(policyData.beneficiaries || [])
    ]);
    
    logger.info(`Insurance policy created: ${policyNumber}`);
    
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating policy', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get policy by ID
 */
async function getPolicyById(policyId) {
  try {
    let pg = getPostgreSQL();
    
    let query = `
      SELECT p.*, ip.name as product_name, ip.type as product_type, ip.scheme,
             u.name as insured_name, u.email as insured_email,
             mp.policy_number as master_policy_number
      FROM policies p
      LEFT JOIN insurance_products ip ON p.product_id = ip.id
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN master_policies mp ON p.master_policy_id = mp.id
      WHERE p.id = $1
    `;
    
    let result = await pg.query(query, [policyId]);
    
    if (result.rows.length === 0) {
      throw new Error('Policy not found');
    }
    
    return result.rows[0];
  } catch (error) {
    logger.error('Error fetching policy', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get policies with filtering
 */
async function getPolicies(filters = {}, pagination = {}) {
  try {
    let pg = getPostgreSQL();
    
    const { user_id, farmer_id, product_id, status } = filters;
    const { page = 1, limit = 20, sort_by = 'created_at', sort_order = 'DESC' } = pagination;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT p.*, ip.name as product_name, ip.type as product_type, u.name as insured_name
      FROM policies p
      LEFT JOIN insurance_products ip ON p.product_id = ip.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (user_id) {
      paramCount++;
      query += ` AND p.user_id = $${paramCount}`;
      params.push(user_id);
    }
    
    if (farmer_id) {
      paramCount++;
      query += ` AND p.farmer_id = $${paramCount}`;
      params.push(farmer_id);
    }
    
    if (product_id) {
      paramCount++;
      query += ` AND p.product_id = $${paramCount}`;
      params.push(product_id);
    }
    
    if (status) {
      paramCount++;
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
    }
    
    const countQuery = query.replace(/SELECT p\.\*, ip\.name as product_name, ip\.type as product_type, u\.name as insured_name/, 'SELECT COUNT(*)');
    const countResult = await pg.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    query += ` ORDER BY p.${sort_by} ${sort_order} LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);
    
    let result = await pg.query(query, params);
    
    return {
      policies: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error fetching policies', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Submit insurance claim
 */
async function submitClaim(claimData) {
  try {
    let pg = getPostgreSQL();
    
    // Verify policy exists and is active
    const policyQuery = 'SELECT * FROM policies WHERE id = $1 AND status = $2';
    const policyResult = await pg.query(policyQuery, [claimData.policy_id, 'active']);
    
    if (policyResult.rows.length === 0) {
      throw new Error('Policy not found or not active');
    }
    
    const claimNumber = generateClaimNumber();
    
    let query = `
      INSERT INTO claims (claim_number, policy_id, user_id, claim_amount, incident_date,
                         incident_description, incident_location, supporting_documents, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'submitted')
      RETURNING *
    `;
    
    let result = await pg.query(query, [
      claimNumber,
      claimData.policy_id,
      claimData.user_id,
      claimData.claim_amount,
      claimData.incident_date,
      claimData.incident_description,
      claimData.incident_location || null,
      JSON.stringify(claimData.supporting_documents || [])
    ]);
    
    logger.info(`Insurance claim submitted: ${claimNumber}`);
    
    return result.rows[0];
  } catch (error) {
    logger.error('Error submitting claim', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get claim by ID
 */
async function getClaimById(claimId) {
  try {
    let pg = getPostgreSQL();
    
    let query = `
      SELECT c.*, p.policy_number, p.coverage_amount, p.insurer_name,
             u.name as claimant_name
      FROM claims c
      JOIN policies p ON c.policy_id = p.id
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `;
    
    let result = await pg.query(query, [claimId]);
    
    if (result.rows.length === 0) {
      throw new Error('Claim not found');
    }
    
    return result.rows[0];
  } catch (error) {
    logger.error('Error fetching claim', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get claims with filtering
 */
async function getClaims(filters = {}, pagination = {}) {
  try {
    let pg = getPostgreSQL();
    
    const { user_id, policy_id, status } = filters;
    const { page = 1, limit = 20, sort_by = 'submitted_date', sort_order = 'DESC' } = pagination;
    
    let offset = (page - 1) * limit;
    
    let query = `
      SELECT c.*, p.policy_number, u.name as claimant_name
      FROM claims c
      JOIN policies p ON c.policy_id = p.id
      JOIN users u ON c.user_id = u.id
      WHERE 1=1
    `;
    
    let params = [];
    let paramCount = 0;
    
    if (user_id) {
      paramCount++;
      query += ` AND c.user_id = $${paramCount}`;
      params.push(user_id);
    }
    
    if (policy_id) {
      paramCount++;
      query += ` AND c.policy_id = $${paramCount}`;
      params.push(policy_id);
    }
    
    if (status) {
      paramCount++;
      query += ` AND c.status = $${paramCount}`;
      params.push(status);
    }
    
    let countQuery = query.replace(/SELECT c\.\*, p\.policy_number, u\.name as claimant_name/, 'SELECT COUNT(*)');
    let countResult = await pg.query(countQuery, params);
    let total = parseInt(countResult.rows[0].count);
    
    query += ` ORDER BY c.${sort_by} ${sort_order} LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);
    
    let result = await pg.query(query, params);
    
    return {
      claims: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error fetching claims', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Process claim (approve/reject)
 */
async function processClaim(claimId, decisionData) {
  try {
    let pg = getPostgreSQL();
    
    const { status, approved_amount, rejection_reason, settlement_reference } = decisionData;
    
    let query = `
      UPDATE claims
      SET status = $1,
          reviewed_date = NOW(),
          approved_amount = COALESCE($2, approved_amount),
          rejection_reason = COALESCE($3, rejection_reason),
          settled_date = CASE WHEN $1 = 'settled' THEN NOW() ELSE settled_date END,
          settlement_reference = COALESCE($4, settlement_reference)
      WHERE id = $5
      RETURNING *
    `;
    
    let result = await pg.query(query, [
      status,
      approved_amount || null,
      rejection_reason || null,
      settlement_reference || null,
      claimId
    ]);
    
    if (result.rows.length === 0) {
      throw new Error('Claim not found');
    }
    
    logger.info(`Claim processed: ${claimId} - ${status}`);
    
    return result.rows[0];
  } catch (error) {
    logger.error('Error processing claim', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Create master policy
 */
async function createMasterPolicy(policyData) {
  try {
    let pg = getPostgreSQL();
    
    let query = `
      INSERT INTO master_policies (organization_type, organization_id, coverage_type, sum_insured,
                                  premium_amount, insurer_name, policy_number, start_date, end_date, terms)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    let result = await pg.query(query, [
      policyData.organization_type,
      policyData.organization_id || null,
      policyData.coverage_type,
      policyData.sum_insured,
      policyData.premium_amount || null,
      policyData.insurer_name,
      policyData.policy_number,
      policyData.start_date,
      policyData.end_date,
      JSON.stringify(policyData.terms || {})
    ]);
    
    logger.info(`Master policy created: ${policyData.policy_number}`);
    
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating master policy', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get master policies
 */
async function getMasterPolicies(filters = {}) {
  try {
    let pg = getPostgreSQL();
    
    const { organization_type, organization_id, coverage_type, status } = filters;
    
    let query = 'SELECT * FROM master_policies WHERE 1=1';
    
    let params = [];
    let paramCount = 0;
    
    if (organization_type) {
      paramCount++;
      query += ` AND organization_type = $${paramCount}`;
      params.push(organization_type);
    }
    
    if (organization_id) {
      paramCount++;
      query += ` AND organization_id = $${paramCount}`;
      params.push(organization_id);
    }
    
    if (coverage_type) {
      paramCount++;
      query += ` AND coverage_type = $${paramCount}`;
      params.push(coverage_type);
    }
    
    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    let result = await pg.query(query, params);
    
    return result.rows;
  } catch (error) {
    logger.error('Error fetching master policies', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get insurance products
 */
async function getInsuranceProducts(filters = {}) {
  try {
    let pg = getPostgreSQL();
    
    const { type, status } = filters;
    
    let query = 'SELECT * FROM insurance_products WHERE 1=1';
    
    let params = [];
    let paramCount = 0;
    
    if (type) {
      paramCount++;
      query += ` AND type = $${paramCount}`;
      params.push(type);
    }
    
    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }
    
    query += ' ORDER BY name';
    
    let result = await pg.query(query, params);
    
    return result.rows;
  } catch (error) {
    logger.error('Error fetching insurance products', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Calculate premium
 */
async function calculatePremium(product_id, coverage_amount, farmer_id = null) {
  try {
    let pg = getPostgreSQL();
    
    // Get product details
    const productQuery = 'SELECT * FROM insurance_products WHERE id = $1';
    const productResult = await pg.query(productQuery, [product_id]);
    
    if (productResult.rows.length === 0) {
      throw new Error('Insurance product not found');
    }
    
    const product = productResult.rows[0];
    
    // Base premium calculation
    let premium = coverage_amount * (product.premium_rate / 100);
    
    // Apply farmer discount if applicable
    if (farmer_id) {
      const farmerQuery = 'SELECT fdi_score FROM farmers WHERE id = $1';
      const farmerResult = await pg.query(farmerQuery, [farmer_id]);
      
      if (farmerResult.rows.length > 0) {
        const fdi = farmerResult.rows[0].fdi_score;
        const discount = Math.min(fdi * 0.1, 20); // Max 20% discount based on FDI
        premium = premium * (1 - discount / 100);
      }
    }
    
    return {
      product_id,
      coverage_amount,
      premium_amount: Math.round(premium),
      premium_rate: product.premium_rate,
      farmer_share: product.farmer_share
    };
  } catch (error) {
    logger.error('Error calculating premium', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Helper functions
 */
function generatePolicyNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `POL-${timestamp}-${random}`;
}

function generateClaimNumber() {
  let timestamp = Date.now().toString(36).toUpperCase();
  let random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CLM-${timestamp}-${random}`;
}

/**
 * Express router for insurance service
 */
const express = require('express');
const router = express.Router();

// Create policy
router.post('/policies', authMiddleware, async (req, res) => {
  try {
    const policy = await createPolicy(req.body);
    res.status(201).json(policy);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get policy by ID
router.get('/policies/:id', async (req, res) => {
  try {
    let policy = await getPolicyById(req.params.id);
    res.json(policy);
  } catch (error) {
    if (error.message === 'Policy not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Get policies
router.get('/policies', async (req, res) => {
  try {
    const filters = {
      user_id: req.query.user_id,
      farmer_id: req.query.farmer_id,
      product_id: req.query.product_id,
      status: req.query.status
    };
    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sort_by: req.query.sort_by,
      sort_order: req.query.sort_order
    };
    let result = await getPolicies(filters, pagination);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit claim
router.post('/claims', authMiddleware, async (req, res) => {
  try {
    const claim = await submitClaim(req.body);
    res.status(201).json(claim);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get claim by ID
router.get('/claims/:id', async (req, res) => {
  try {
    let claim = await getClaimById(req.params.id);
    res.json(claim);
  } catch (error) {
    if (error.message === 'Claim not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Get claims
router.get('/claims', async (req, res) => {
  try {
    let filters = {
      user_id: req.query.user_id,
      policy_id: req.query.policy_id,
      status: req.query.status
    };
    let pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sort_by: req.query.sort_by,
      sort_order: req.query.sort_order
    };
    let result = await getClaims(filters, pagination);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process claim
router.put('/claims/:id/process', authMiddleware, requireRole(...PLATFORM_STAFF_ROLES), async (req, res) => {
  try {
    let claim = await processClaim(req.params.id, req.body);
    res.json(claim);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create master policy
router.post('/master-policies', authMiddleware, async (req, res) => {
  try {
    let policy = await createMasterPolicy(req.body);
    res.status(201).json(policy);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get master policies
router.get('/master-policies', async (req, res) => {
  try {
    let filters = {
      organization_type: req.query.organization_type,
      organization_id: req.query.organization_id,
      coverage_type: req.query.coverage_type,
      status: req.query.status
    };
    const policies = await getMasterPolicies(filters);
    res.json(policies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get insurance products
router.get('/products', async (req, res) => {
  try {
    let filters = {
      type: req.query.type,
      status: req.query.status
    };
    const products = await getInsuranceProducts(filters);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Calculate premium
router.post('/calculate-premium', async (req, res) => {
  try {
    const { product_id, coverage_amount, farmer_id } = req.body;
    const premium = await calculatePremium(product_id, coverage_amount, farmer_id);
    res.json(premium);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = {
  router,
  createPolicy,
  getPolicyById,
  getPolicies,
  submitClaim,
  getClaimById,
  getClaims,
  processClaim,
  createMasterPolicy,
  getMasterPolicies,
  getInsuranceProducts,
  calculatePremium
};



