/**
 * Village Profile Service
 * 
 * Implements REOS Missing Layer 5: District/Village/Block Economic Database
 * Wires the existing `village_profiles` table (migration 052) to application logic
 */

'use strict';

const pool = require('../../database/pool');
const { logger } = require('../../utils/logger');

const r2 = (n) => Math.round(n * 100) / 100;

/**
 * Get village profile by ID
 * @param {string} villageId - Village ID
 * @returns {Promise<Object>} Village profile
 */
async function getVillageProfile(villageId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM village_profiles WHERE village_id = $1`,
      [villageId]
    );
    
    if (!rows.length) {
      throw new Error(`Village profile not found: ${villageId}`);
    }
    
    return rows[0];
  } catch (error) {
    logger.error(`Failed to get village profile: ${error.message}`);
    throw error;
  }
}

/**
 * Get village profiles by district
 * @param {string} district - District name
 * @returns {Promise<Array>} Village profiles
 */
async function getVillagesByDistrict(district) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM village_profiles WHERE district = $1 ORDER BY village_name`,
      [district]
    );
    
    return rows;
  } catch (error) {
    logger.error(`Failed to get villages by district: ${error.message}`);
    throw error;
  }
}

/**
 * Get village profiles by block
 * @param {string} block - Block name
 * @returns {Promise<Array>} Village profiles
 */
async function getVillagesByBlock(block) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM village_profiles WHERE block = $1 ORDER BY village_name`,
      [block]
    );
    
    return rows;
  } catch (error) {
    logger.error(`Failed to get villages by block: ${error.message}`);
    throw error;
  }
}

/**
 * Create or update village profile
 * @param {Object} profile - Village profile data
 * @returns {Promise<Object>} Created/updated profile
 */
async function upsertVillageProfile(profile) {
  try {
    const {
      village_id,
      village_name,
      district,
      block,
      state,
      population,
      households,
      main_crops,
      soil_type,
      irrigation_coverage,
      avg_income_per_household,
      literacy_rate,
      electrified_households,
      road_access,
      market_distance_km,
      financial_institutions_count,
      schools_count,
      health_centers_count,
      cooperative_societies_count
    } = profile;

    const { rows } = await pool.query(
      `INSERT INTO village_profiles 
        (village_id, village_name, district, block, state, population, households,
         main_crops, soil_type, irrigation_coverage, avg_income_per_household,
         literacy_rate, electrified_households, road_access, market_distance_km,
         financial_institutions_count, schools_count, health_centers_count,
         cooperative_societies_count, last_updated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW())
       ON CONFLICT (village_id)
       DO UPDATE SET
         village_name = EXCLUDED.village_name,
         district = EXCLUDED.district,
         block = EXCLUDED.block,
         state = EXCLUDED.state,
         population = EXCLUDED.population,
         households = EXCLUDED.households,
         main_crops = EXCLUDED.main_crops,
         soil_type = EXCLUDED.soil_type,
         irrigation_coverage = EXCLUDED.irrigation_coverage,
         avg_income_per_household = EXCLUDED.avg_income_per_household,
         literacy_rate = EXCLUDED.literacy_rate,
         electrified_households = EXCLUDED.electrified_households,
         road_access = EXCLUDED.road_access,
         market_distance_km = EXCLUDED.market_distance_km,
         financial_institutions_count = EXCLUDED.financial_institutions_count,
         schools_count = EXCLUDED.schools_count,
         health_centers_count = EXCLUDED.health_centers_count,
         cooperative_societies_count = EXCLUDED.cooperative_societies_count,
         last_updated = NOW()
       RETURNING *`,
      [village_id, village_name, district, block, state, population, households,
       main_crops, soil_type, irrigation_coverage, avg_income_per_household,
       literacy_rate, electrified_households, road_access, market_distance_km,
       financial_institutions_count, schools_count, health_centers_count,
       cooperative_societies_count]
    );

    logger.info(`Village profile upserted: ${village_id}`);
    return rows[0];
  } catch (error) {
    logger.error(`Failed to upsert village profile: ${error.message}`);
    throw error;
  }
}

/**
 * Get district-level economic summary
 * @param {string} district - District name
 * @returns {Promise<Object>} District economic summary
 */
async function getDistrictEconomicSummary(district) {
  try {
    const { rows } = await pool.query(
      `SELECT 
         district,
         COUNT(*) as total_villages,
         SUM(population) as total_population,
         SUM(households) as total_households,
         AVG(avg_income_per_household) as avg_income_per_household,
         AVG(literacy_rate) as avg_literacy_rate,
         SUM(electrified_households) as total_electrified,
         AVG(irrigation_coverage) as avg_irrigation_coverage,
         SUM(financial_institutions_count) as total_financial_institutions,
         SUM(schools_count) as total_schools,
         SUM(health_centers_count) as total_health_centers,
         SUM(cooperative_societies_count) as total_cooperatives
       FROM village_profiles
       WHERE district = $1
       GROUP BY district`,
      [district]
    );

    if (!rows.length) {
      throw new Error(`No villages found in district: ${district}`);
    }

    const summary = rows[0];
    return {
      district: summary.district,
      totalVillages: parseInt(summary.total_villages),
      totalPopulation: parseInt(summary.total_population),
      totalHouseholds: parseInt(summary.total_households),
      avgIncomePerHousehold: r2(summary.avg_income_per_household),
      avgLiteracyRate: r2(summary.avg_literacy_rate),
      totalElectrifiedHouseholds: parseInt(summary.total_electrified),
      avgIrrigationCoverage: r2(summary.avg_irrigation_coverage),
      totalFinancialInstitutions: parseInt(summary.total_financial_institutions),
      totalSchools: parseInt(summary.total_schools),
      totalHealthCenters: parseInt(summary.total_health_centers),
      totalCooperatives: parseInt(summary.total_cooperatives)
    };
  } catch (error) {
    logger.error(`Failed to get district economic summary: ${error.message}`);
    throw error;
  }
}

/**
 * Search villages by criteria
 * @param {Object} filters - Search filters
 * @returns {Promise<Array>} Matching villages
 */
async function searchVillages(filters) {
  try {
    const {
      district,
      block,
      minPopulation,
      maxPopulation,
      minIrrigationCoverage,
      hasRoadAccess,
      mainCrop
    } = filters;

    let query = `SELECT * FROM village_profiles WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (district) {
      query += ` AND district = $${paramIndex}`;
      params.push(district);
      paramIndex++;
    }

    if (block) {
      query += ` AND block = $${paramIndex}`;
      params.push(block);
      paramIndex++;
    }

    if (minPopulation) {
      query += ` AND population >= $${paramIndex}`;
      params.push(minPopulation);
      paramIndex++;
    }

    if (maxPopulation) {
      query += ` AND population <= $${paramIndex}`;
      params.push(maxPopulation);
      paramIndex++;
    }

    if (minIrrigationCoverage) {
      query += ` AND irrigation_coverage >= $${paramIndex}`;
      params.push(minIrrigationCoverage);
      paramIndex++;
    }

    if (hasRoadAccess !== undefined) {
      query += ` AND road_access = $${paramIndex}`;
      params.push(hasRoadAccess);
      paramIndex++;
    }

    if (mainCrop) {
      query += ` AND main_crops LIKE $${paramIndex}`;
      params.push(`%${mainCrop}%`);
      paramIndex++;
    }

    query += ` ORDER BY village_name LIMIT 100`;

    const { rows } = await pool.query(query, params);
    return rows;
  } catch (error) {
    logger.error(`Failed to search villages: ${error.message}`);
    throw error;
  }
}

function setupRoutes(app) {
  const express = require('express');
  const router = express.Router();
  const authMiddleware = require('../../middleware/auth');

  router.use(authMiddleware);

  router.get('/villages/:villageId', async (req, res) => {
    try {
      const profile = await getVillageProfile(req.params.villageId);
      res.json({ success: true, data: profile });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  });

  router.get('/villages/district/:district', async (req, res) => {
    try {
      const villages = await getVillagesByDistrict(req.params.district);
      res.json({ success: true, data: villages });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/villages/block/:block', async (req, res) => {
    try {
      let villages = await getVillagesByBlock(req.params.block);
      res.json({ success: true, data: villages });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/districts/:district/economic-summary', async (req, res) => {
    try {
      let summary = await getDistrictEconomicSummary(req.params.district);
      res.json({ success: true, data: summary });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  });

  router.post('/villages', async (req, res) => {
    try {
      let profile = await upsertVillageProfile(req.body);
      res.status(201).json({ success: true, data: profile });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  router.get('/villages/search', async (req, res) => {
    try {
      let villages = await searchVillages(req.query);
      res.json({ success: true, data: villages });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.use('/api/v1/village-profiles', router);
  logger.info('Village profile routes mounted at /api/v1/village-profiles');
}

module.exports = {
  getVillageProfile,
  getVillagesByDistrict,
  getVillagesByBlock,
  upsertVillageProfile,
  getDistrictEconomicSummary,
  searchVillages,
  setupRoutes
};

// Merged from backend/src/modules/M019
{
  const m019 = require("../../modules/M019/service");
  const { ...rest } = m019;
  Object.assign(module.exports, rest);
}

// Merged from backend/src/modules/M041
{
  const m041 = require("../../modules/M041/service");
  const { ...rest } = m041;
  Object.assign(module.exports, rest);
}

// Merged from backend/src/modules/M054
{
  const m054 = require("../../modules/M054/service");
  const { ...rest } = m054;
  Object.assign(module.exports, rest);
}
