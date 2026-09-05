/**
 * Household Economy Service
 * 
 * Wires the existing `household_economy` table (migration 041) to application logic
 * Implements REOS Rural Life OS component for household-level economic data
 */

'use strict';

const pool = require('../../../database/pool');
const { logger } = require('../../../utils/logger');

const r2 = (n) => Math.round(n * 100) / 100;

/**
 * Get household economy by ID
 * @param {string} householdId - Household ID
 * @returns {Promise<Object>} Household economy details
 */
async function getHouseholdEconomy(householdId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM household_economy WHERE household_id = $1`,
      [householdId]
    );
    
    if (!rows.length) {
      throw new Error(`Household economy not found: ${householdId}`);
    }
    
    return rows[0];
  } catch (error) {
    logger.error(`Failed to get household economy: ${error.message}`);
    throw error;
  }
}

/**
 * Get household economies by village
 * @param {string} villageId - Village ID
 * @returns {Promise<Array>} Household economies
 */
async function getHouseholdEconomiesByVillage(villageId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM household_economy WHERE village_id = $1 ORDER by household_id`,
      [villageId]
    );
    
    return rows;
  } catch (error) {
    logger.error(`Failed to get household economies by village: ${error.message}`);
    throw error;
  }
}

/**
 * Create or update household economy
 * @param {Object} economy - Household economy data
 * @returns {Promise<Object>} Created/updated economy
 */
async function upsertHouseholdEconomy(economy) {
  try {
    const {
      household_id,
      village_id,
      district,
      farmer_id,
      annual_income,
      income_sources,
      major_expenses,
      assets_value,
      liabilities_value,
      savings_amount,
      debt_amount,
      credit_score,
      last_updated
    } = economy;

    const { rows } = await pool.query(
      `INSERT INTO household_economy 
        (household_id, village_id, district, farmer_id, annual_income,
         income_sources, major_expenses, assets_value, liabilities_value,
         savings_amount, debt_amount, credit_score, last_updated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
       ON CONFLICT (household_id)
       DO UPDATE SET
         village_id = EXCLUDED.village_id,
         district = EXCLUDED.district,
         farmer_id = EXCLUDED.farmer_id,
         annual_income = EXCLUDED.annual_income,
         income_sources = EXCLUDED.income_sources,
         major_expenses = EXCLUDED.major_expenses,
         assets_value = EXCLUDED.assets_value,
         liabilities_value = EXCLUDED.liabilities_value,
         savings_amount = EXCLUDED.savings_amount,
         debt_amount = EXCLUDED.debt_amount,
         credit_score = EXCLUDED.credit_score,
         last_updated = NOW()
       RETURNING *`,
      [household_id, village_id, district, farmer_id, annual_income,
       income_sources, major_expenses, assets_value, liabilities_value,
       savings_amount, debt_amount, credit_score]
    );

    logger.info(`Household economy upserted: ${household_id}`);
    return rows[0];
  } catch (error) {
    logger.error(`Failed to upsert household economy: ${error.message}`);
    throw error;
  }
}

/**
 * Get village-level household economy summary
 * @param {string} villageId - Village ID
 * @returns {Promise<Object>} Village summary
 */
async function getVillageHouseholdEconomySummary(villageId) {
  try {
    const { rows } = await pool.query(
      `SELECT 
         COUNT(*) as total_households,
         SUM(annual_income) as total_annual_income,
         AVG(annual_income) as avg_annual_income,
         SUM(assets_value) as total_assets,
         AVG(assets_value) as avg_assets,
         SUM(liabilities_value) as total_liabilities,
         AVG(liabilities_value) as avg_liabilities,
         SUM(savings_amount) as total_savings,
         AVG(savings_amount) as avg_savings,
         SUM(debt_amount) as total_debt,
         AVG(debt_amount) as avg_debt,
         AVG(credit_score) as avg_credit_score
       FROM household_economy
       WHERE village_id = $1`,
      [villageId]
    );

    if (!rows.length) {
      throw new Error(`No household economies found for village: ${villageId}`);
    }

    const summary = rows[0];
    return {
      villageId,
      totalHouseholds: parseInt(summary.total_households),
      totalAnnualIncome: r2(summary.total_annual_income),
      avgAnnualIncome: r2(summary.avg_annual_income),
      totalAssets: r2(summary.total_assets),
      avgAssets: r2(summary.avg_assets),
      totalLiabilities: r2(summary.total_liabilities),
      avgLiabilities: r2(summary.avg_liabilities),
      totalSavings: r2(summary.total_savings),
      avgSavings: r2(summary.avg_savings),
      totalDebt: r2(summary.total_debt),
      avgDebt: r2(summary.avg_debt),
      avgCreditScore: r2(summary.avg_credit_score)
    };
  } catch (error) {
    logger.error(`Failed to get village household economy summary: ${error.message}`);
    throw error;
  }
}

function setupRoutes(app) {
  const express = require('express');
  const router = express.Router();
  const authMiddleware = require('../../../middleware/auth');

  router.use(authMiddleware);

  router.get('/households/:householdId', async (req, res) => {
    try {
      const economy = await getHouseholdEconomy(req.params.householdId);
      res.json({ success: true, data: economy });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  });

  router.get('/households/village/:villageId', async (req, res) => {
    try {
      const economies = await getHouseholdEconomiesByVillage(req.params.villageId);
      res.json({ success: true, data: economies });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/households/village/:villageId/summary', async (req, res) => {
    try {
      let summary = await getVillageHouseholdEconomySummary(req.params.villageId);
      res.json({ success: true, data: summary });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  });

  router.post('/households', async (req, res) => {
    try {
      let economy = await upsertHouseholdEconomy(req.body);
      res.status(201).json({ success: true, data: economy });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.use('/api/v1/household-economy', router);
  logger.info('Household economy routes mounted at /api/v1/household-economy');
}

module.exports = {
  getHouseholdEconomy,
  getHouseholdEconomiesByVillage,
  upsertHouseholdEconomy,
  getVillageHouseholdEconomySummary,
  setupRoutes
};

