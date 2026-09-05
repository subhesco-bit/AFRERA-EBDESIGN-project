/**
 * Rural Finance Service
 * 
 * Wires the existing `rural_finance` table (migration 041) to application logic
 * Implements REOS Rural Life OS component for rural financial services
 */

'use strict';

const pool = require('../../database/pool');
const { logger } = require('../../utils/logger');

const r2 = (n) => Math.round(n * 100) / 100;

/**
 * Get rural finance record by ID
 * @param {string} financeId - Finance record ID
 * @returns {Promise<Object>} Finance details
 */
async function getRuralFinance(financeId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM rural_finance WHERE finance_id = $1`,
      [financeId]
    );
    
    if (!rows.length) {
      throw new Error(`Rural finance record not found: ${financeId}`);
    }
    
    return rows[0];
  } catch (error) {
    logger.error(`Failed to get rural finance: ${error.message}`);
    throw error;
  }
}

/**
 * Get rural finance by village
 * @param {string} villageId - Village ID
 * @returns {Promise<Array>} Finance records
 */
async function getRuralFinanceByVillage(villageId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM rural_finance WHERE village_id = $1 ORDER BY service_type`,
      [villageId]
    );
    
    return rows;
  } catch (error) {
    logger.error(`Failed to get rural finance by village: ${error.message}`);
    throw error;
  }
}

/**
 * Get rural finance by service type
 * @param {string} serviceType - Service type
 * @returns {Promise<Array>} Finance records
 */
async function getRuralFinanceByServiceType(serviceType) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM rural_finance WHERE service_type = $1 ORDER BY village_id`,
      [serviceType]
    );
    
    return rows;
  } catch (error) {
    logger.error(`Failed to get rural finance by service type: ${error.message}`);
    throw error;
  }
}

/**
 * Create or update rural finance record
 * @param {Object} finance - Finance data
 * @returns {Promise<Object>} Created/updated finance
 */
async function upsertRuralFinance(finance) {
  try {
    const {
      finance_id,
      village_id,
      district,
      service_type,
      provider_id,
      provider_name,
      service_coverage,
      active_borrowers,
      total_loan_portfolio,
      average_loan_size,
      repayment_rate,
      interest_rate_range,
      last_updated
    } = finance;

    const { rows } = await pool.query(
      `INSERT INTO rural_finance 
        (finance_id, village_id, district, service_type, provider_id,
         provider_name, service_coverage, active_borrowers, total_loan_portfolio,
         average_loan_size, repayment_rate, interest_rate_range, last_updated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
       ON CONFLICT (finance_id)
       DO UPDATE SET
         village_id = EXCLUDED.village_id,
         district = EXCLUDED.district,
         service_type = EXCLUDED.service_type,
         provider_id = EXCLUDED.provider_id,
         provider_name = EXCLUDED.provider_name,
         service_coverage = EXCLUDED.service_coverage,
         active_borrowers = EXCLUDED.active_borrowers,
         total_loan_portfolio = EXCLUDED.total_loan_portfolio,
         average_loan_size = EXCLUDED.average_loan_size,
         repayment_rate = EXCLUDED.repayment_rate,
         interest_rate_range = EXCLUDED.interest_rate_range,
         last_updated = NOW()
       RETURNING *`,
      [finance_id, village_id, district, service_type, provider_id,
       provider_name, service_coverage, active_borrowers, total_loan_portfolio,
       average_loan_size, repayment_rate, interest_rate_range]
    );

    logger.info(`Rural finance upserted: ${finance_id}`);
    return rows[0];
  } catch (error) {
    logger.error(`Failed to upsert rural finance: ${error.message}`);
    throw error;
  }
}

/**
 * Get village finance summary
 * @param {string} villageId - Village ID
 * @returns {Promise<Object>} Village summary
 */
async function getVillageFinanceSummary(villageId) {
  try {
    const { rows } = await pool.query(
      `SELECT 
         service_type,
         COUNT(*) as provider_count,
         SUM(active_borrowers) as total_active_borrowers,
         SUM(total_loan_portfolio) as total_loan_portfolio,
         AVG(average_loan_size) as avg_loan_size,
         AVG(repayment_rate) as avg_repayment_rate
       FROM rural_finance
       WHERE village_id = $1
       GROUP BY service_type`,
      [villageId]
    );

    return {
      villageId,
      serviceTypes: rows.map(row => ({
        serviceType: row.service_type,
        providerCount: parseInt(row.provider_count),
        totalActiveBorrowers: row.total_active_borrowers ? parseInt(row.total_active_borrowers) : 0,
        totalLoanPortfolio: row.total_loan_portfolio ? r2(row.total_loan_portfolio) : 0,
        avgLoanSize: row.avg_loan_size ? r2(row.avg_loan_size) : 0,
        avgRepaymentRate: row.avg_repayment_rate ? r2(row.avg_repayment_rate) : 0
      }))
    };
  } catch (error) {
    logger.error(`Failed to get village finance summary: ${error.message}`);
    throw error;
  }
}

function setupRoutes(app) {
  const express = require('express');
  const router = express.Router();
  const authMiddleware = require('../../middleware/auth');

  router.use(authMiddleware);

  router.get('/finance/:financeId', async (req, res) => {
    try {
      const finance = await getRuralFinance(req.params.financeId);
      res.json({ success: true, data: finance });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  });

  router.get('/finance/village/:villageId', async (req, res) => {
    try {
      const financeRecords = await getRuralFinanceByVillage(req.params.villageId);
      res.json({ success: true, data: financeRecords });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/finance/service/:serviceType', async (req, res) => {
    try {
      let financeRecords = await getRuralFinanceByServiceType(req.params.serviceType);
      res.json({ success: true, data: financeRecords });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/finance/village/:villageId/summary', async (req, res) => {
    try {
      const summary = await getVillageFinanceSummary(req.params.villageId);
      res.json({ success: true, data: summary });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  });

  router.post('/finance', async (req, res) => {
    try {
      let finance = await upsertRuralFinance(req.body);
      res.status(201).json({ success: true, data: finance });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.use('/api/v1/rural-finance', router);
  logger.info('Rural finance routes mounted at /api/v1/rural-finance');
}

module.exports = {
  getRuralFinance,
  getRuralFinanceByVillage,
  getRuralFinanceByServiceType,
  upsertRuralFinance,
  getVillageFinanceSummary,
  setupRoutes
};
