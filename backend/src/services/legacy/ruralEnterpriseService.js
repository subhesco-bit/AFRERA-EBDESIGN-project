/**
 * Rural Enterprise Service
 * 
 * Wires the existing `rural_enterprises` table (migration 041) to application logic
 * Implements REOS Rural Life OS component for rural business entities
 */

'use strict';

const pool = require('../../../database/pool');
const { logger } = require('../../../utils/logger');

const r2 = (n) => Math.round(n * 100) / 100;

/**
 * Get rural enterprise by ID
 * @param {string} enterpriseId - Enterprise ID
 * @returns {Promise<Object>} Enterprise details
 */
async function getRuralEnterprise(enterpriseId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM rural_enterprises WHERE enterprise_id = $1`,
      [enterpriseId]
    );
    
    if (!rows.length) {
      throw new Error(`Rural enterprise not found: ${enterpriseId}`);
    }
    
    return rows[0];
  } catch (error) {
    logger.error(`Failed to get rural enterprise: ${error.message}`);
    throw error;
  }
}

/**
 * Get rural enterprises by village
 * @param {string} villageId - Village ID
 * @returns {Promise<Array>} Rural enterprises
 */
async function getRuralEnterprisesByVillage(villageId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM rural_enterprises WHERE village_id = $1 ORDER BY enterprise_name`,
      [villageId]
    );
    
    return rows;
  } catch (error) {
    logger.error(`Failed to get rural enterprises by village: ${error.message}`);
    throw error;
  }
}

/**
 * Get rural enterprises by type
 * @param {string} enterpriseType - Enterprise type
 * @returns {Promise<Array>} Rural enterprises
 */
async function getRuralEnterprisesByType(enterpriseType) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM rural_enterprises WHERE enterprise_type = $1 ORDER BY village_id`,
      [enterpriseType]
    );
    
    return rows;
  } catch (error) {
    logger.error(`Failed to get rural enterprises by type: ${error.message}`);
    throw error;
  }
}

/**
 * Create new rural enterprise
 * @param {Object} enterprise - Enterprise data
 * @returns {Promise<Object>} Created enterprise
 */
async function createRuralEnterprise(enterprise) {
  try {
    const {
      enterprise_id,
      enterprise_name,
      village_id,
      district,
      enterprise_type,
      owner_id,
      registration_number,
      registration_date,
      business_scale,
      annual_turnover,
      employee_count,
      main_products,
      main_services,
      infrastructure_assets,
      funding_sources,
      market_reach,
      status
    } = enterprise;

    const { rows } = await pool.query(
      `INSERT INTO rural_enterprises 
        (enterprise_id, enterprise_name, village_id, district, enterprise_type,
         owner_id, registration_number, registration_date, business_scale,
         annual_turnover, employee_count, main_products, main_services,
         infrastructure_assets, funding_sources, market_reach, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
       RETURNING *`,
      [enterprise_id, enterprise_name, village_id, district, enterprise_type,
       owner_id, registration_number, registration_date, business_scale,
       annual_turnover, employee_count, main_products, main_services,
       infrastructure_assets, funding_sources, market_reach, status]
    );

    logger.info(`Rural enterprise created: ${enterprise_id}`);
    return rows[0];
  } catch (error) {
    logger.error(`Failed to create rural enterprise: ${error.message}`);
    throw error;
  }
}

/**
 * Update rural enterprise
 * @param {string} enterpriseId - Enterprise ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated enterprise
 */
async function updateRuralEnterprise(enterpriseId, updates) {
  try {
    const allowedFields = [
      'enterprise_name', 'enterprise_type', 'business_scale',
      'annual_turnover', 'employee_count', 'main_products',
      'main_services', 'infrastructure_assets', 'funding_sources',
      'market_reach', 'status'
    ];
    
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(enterpriseId);

    const query = `
      UPDATE rural_enterprises
      SET ${setClauses.join(', ')}, updated_at = NOW()
      WHERE enterprise_id = $${paramIndex}
      RETURNING *
    `;

    const { rows } = await pool.query(query, values);
    
    if (!rows.length) {
      throw new Error(`Rural enterprise not found: ${enterpriseId}`);
    }

    logger.info(`Rural enterprise updated: ${enterpriseId}`);
    return rows[0];
  } catch (error) {
    logger.error(`Failed to update rural enterprise: ${error.message}`);
    throw error;
  }
}

/**
 * Get rural enterprise statistics
 * @param {Object} filters - Optional filters (district, village_id, enterprise_type, status)
 * @returns {Promise<Object>} Enterprise statistics
 */
async function getRuralEnterpriseStatistics(filters = {}) {
  try {
    const { district, village_id, enterprise_type, status } = filters;
    
    let query = `
      SELECT 
        COUNT(*) as total_enterprises,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_enterprises,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_enterprises,
        SUM(employee_count) as total_employees,
        AVG(employee_count) as avg_employees_per_enterprise,
        SUM(annual_turnover) as total_annual_turnover,
        AVG(annual_turnover) as avg_annual_turnover
      FROM rural_enterprises
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    if (district) {
      query += ` AND district = $${paramIndex}`;
      params.push(district);
      paramIndex++;
    }

    if (village_id) {
      query += ` AND village_id = $${paramIndex}`;
      params.push(village_id);
      paramIndex++;
    }

    if (enterprise_type) {
      query += ` AND enterprise_type = $${paramIndex}`;
      params.push(enterprise_type);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const { rows } = await pool.query(query, params);
    const stats = rows[0];

    return {
      totalEnterprises: parseInt(stats.total_enterprises),
      activeEnterprises: parseInt(stats.active_enterprises),
      inactiveEnterprises: parseInt(stats.inactive_enterprises),
      totalEmployees: stats.total_employees ? parseInt(stats.total_employees) : 0,
      avgEmployeesPerEnterprise: stats.avg_employees_per_enterprise ? r2(stats.avg_employees_per_enterprise) : 0,
      totalAnnualTurnover: stats.total_annual_turnover ? r2(stats.total_annual_turnover) : 0,
      avgAnnualTurnover: stats.avg_annual_turnover ? r2(stats.avg_annual_turnover) : 0
    };
  } catch (error) {
    logger.error(`Failed to get rural enterprise statistics: ${error.message}`);
    throw error;
  }
}

/**
 * Search rural enterprises
 * @param {Object} filters - Search filters
 * @returns {Promise<Array>} Matching enterprises
 */
async function searchRuralEnterprises(filters) {
  try {
    const {
      district,
      village_id,
      enterprise_type,
      minTurnover,
      maxTurnover,
      minEmployees,
      status
    } = filters;

    let query = `SELECT * FROM rural_enterprises WHERE 1=1`;
    let params = [];
    let paramIndex = 1;

    if (district) {
      query += ` AND district = $${paramIndex}`;
      params.push(district);
      paramIndex++;
    }

    if (village_id) {
      query += ` AND village_id = $${paramIndex}`;
      params.push(village_id);
      paramIndex++;
    }

    if (enterprise_type) {
      query += ` AND enterprise_type = $${paramIndex}`;
      params.push(enterprise_type);
      paramIndex++;
    }

    if (minTurnover) {
      query += ` AND annual_turnover >= $${paramIndex}`;
      params.push(minTurnover);
      paramIndex++;
    }

    if (maxTurnover) {
      query += ` AND annual_turnover <= $${paramIndex}`;
      params.push(maxTurnover);
      paramIndex++;
    }

    if (minEmployees) {
      query += ` AND employee_count >= $${paramIndex}`;
      params.push(minEmployees);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY enterprise_name LIMIT 100`;

    const { rows } = await pool.query(query, params);
    return rows;
  } catch (error) {
    logger.error(`Failed to search rural enterprises: ${error.message}`);
    throw error;
  }
}

function setupRoutes(app) {
  const express = require('express');
  const router = express.Router();
  const authMiddleware = require('../../../middleware/auth');

  router.use(authMiddleware);

  router.get('/enterprises/:enterpriseId', async (req, res) => {
    try {
      const enterprise = await getRuralEnterprise(req.params.enterpriseId);
      res.json({ success: true, data: enterprise });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  });

  router.get('/enterprises/village/:villageId', async (req, res) => {
    try {
      const enterprises = await getRuralEnterprisesByVillage(req.params.villageId);
      res.json({ success: true, data: enterprises });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/enterprises/type/:enterpriseType', async (req, res) => {
    try {
      let enterprises = await getRuralEnterprisesByType(req.params.enterpriseType);
      res.json({ success: true, data: enterprises });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.post('/enterprises', async (req, res) => {
    try {
      let enterprise = await createRuralEnterprise(req.body);
      res.status(201).json({ success: true, data: enterprise });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  router.put('/enterprises/:enterpriseId', async (req, res) => {
    try {
      let enterprise = await updateRuralEnterprise(req.params.enterpriseId, req.body);
      res.json({ success: true, data: enterprise });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  router.get('/enterprises/statistics', async (req, res) => {
    try {
      let stats = await getRuralEnterpriseStatistics(req.query);
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/enterprises/search', async (req, res) => {
    try {
      let enterprises = await searchRuralEnterprises(req.query);
      res.json({ success: true, data: enterprises });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.use('/api/v1/rural-enterprises', router);
  logger.info('Rural enterprise routes mounted at /api/v1/rural-enterprises');
}

module.exports = {
  getRuralEnterprise,
  getRuralEnterprisesByVillage,
  getRuralEnterprisesByType,
  createRuralEnterprise,
  updateRuralEnterprise,
  getRuralEnterpriseStatistics,
  searchRuralEnterprises,
  setupRoutes
};

