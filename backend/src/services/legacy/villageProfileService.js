/**
 * Village Profile Service
 *
 * Implements REOS Missing Layer 5: District/Village/Block Economic Database.
 * Uses the existing `village_profiles` table as the single authoritative
 * village master; schema reconciliation is migration 053.
 */

'use strict';

const pool = require('../../database/pool');
const { logger } = require('../../utils/logger');

const r2 = (n) => (n == null ? null : Math.round(Number(n) * 100) / 100);

async function getVillageProfile(villageId) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM village_profiles WHERE village_id = $1',
      [villageId],
    );
    if (!rows.length) throw new Error(`Village profile not found: ${villageId}`);
    return rows[0];
  } catch (error) {
    logger.error(`Failed to get village profile: ${error.message}`);
    throw error;
  }
}

async function getVillagesByDistrict(district) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM village_profiles WHERE district = $1 ORDER BY village_name NULLS LAST, name',
      [district],
    );
    return rows;
  } catch (error) {
    logger.error(`Failed to get villages by district: ${error.message}`);
    throw error;
  }
}

async function getVillagesByBlock(block) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM village_profiles WHERE block = $1 ORDER BY village_name NULLS LAST, name',
      [block],
    );
    return rows;
  } catch (error) {
    logger.error(`Failed to get villages by block: ${error.message}`);
    throw error;
  }
}

async function upsertVillageProfile(profile) {
  try {
    const {
      village_id: villageId,
      village_name: villageName,
      name,
      district,
      block,
      state,
      population,
      households,
      main_crops: mainCrops,
      soil_type: soilType,
      irrigation_coverage: irrigationCoverage,
      avg_income_per_household: avgIncomePerHousehold,
      avg_income: avgIncome,
      literacy_rate: literacyRate,
      electrified_households: electrifiedHouseholds,
      road_access: roadAccess,
      market_distance_km: marketDistanceKm,
      financial_institutions_count: financialInstitutionsCount,
      schools_count: schoolsCount,
      health_centers_count: healthCentersCount,
      cooperative_societies_count: cooperativeSocietiesCount,
    } = profile;

    const canonicalName = villageName || name;
    if (!villageId) throw new Error('village_id is required');
    if (!canonicalName) throw new Error('village_name or name is required');

    const { rows } = await pool.query(
      `INSERT INTO village_profiles
        (village_id, name, village_name, district, block, state, population, households,
         main_crops, soil_type, irrigation_coverage, avg_income, avg_income_per_household,
         literacy_rate, electrified_households, road_access, market_distance_km,
         financial_institutions_count, schools_count, health_centers_count,
         cooperative_societies_count, last_updated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW())
       ON CONFLICT (village_id)
       DO UPDATE SET
         name = EXCLUDED.name,
         village_name = EXCLUDED.village_name,
         district = EXCLUDED.district,
         block = EXCLUDED.block,
         state = EXCLUDED.state,
         population = EXCLUDED.population,
         households = EXCLUDED.households,
         main_crops = EXCLUDED.main_crops,
         soil_type = EXCLUDED.soil_type,
         irrigation_coverage = EXCLUDED.irrigation_coverage,
         avg_income = EXCLUDED.avg_income,
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
      [villageId, canonicalName, canonicalName, district, block, state, population, households,
        mainCrops, soilType, irrigationCoverage, avgIncome ?? avgIncomePerHousehold,
        avgIncomePerHousehold ?? avgIncome, literacyRate, electrifiedHouseholds, roadAccess,
        marketDistanceKm, financialInstitutionsCount, schoolsCount, healthCentersCount,
        cooperativeSocietiesCount],
    );

    logger.info(`Village profile upserted: ${villageId}`);
    return rows[0];
  } catch (error) {
    logger.error(`Failed to upsert village profile: ${error.message}`);
    throw error;
  }
}

async function getDistrictEconomicSummary(district) {
  try {
    const { rows } = await pool.query(
      `SELECT
         district,
         COUNT(*) AS total_villages,
         COALESCE(SUM(population), 0) AS total_population,
         COALESCE(SUM(households), 0) AS total_households,
         AVG(COALESCE(avg_income_per_household, avg_income)) AS avg_income_per_household,
         AVG(literacy_rate) AS avg_literacy_rate,
         COALESCE(SUM(electrified_households), 0) AS total_electrified,
         AVG(irrigation_coverage) AS avg_irrigation_coverage,
         COALESCE(SUM(financial_institutions_count), 0) AS total_financial_institutions,
         COALESCE(SUM(schools_count), 0) AS total_schools,
         COALESCE(SUM(health_centers_count), 0) AS total_health_centers,
         COALESCE(SUM(cooperative_societies_count), 0) AS total_cooperatives
       FROM village_profiles
       WHERE district = $1
       GROUP BY district`,
      [district],
    );

    if (!rows.length) throw new Error(`No villages found in district: ${district}`);
    const summary = rows[0];
    return {
      district: summary.district,
      totalVillages: Number(summary.total_villages),
      totalPopulation: Number(summary.total_population),
      totalHouseholds: Number(summary.total_households),
      avgIncomePerHousehold: r2(summary.avg_income_per_household),
      avgLiteracyRate: r2(summary.avg_literacy_rate),
      totalElectrifiedHouseholds: Number(summary.total_electrified),
      avgIrrigationCoverage: r2(summary.avg_irrigation_coverage),
      totalFinancialInstitutions: Number(summary.total_financial_institutions),
      totalSchools: Number(summary.total_schools),
      totalHealthCenters: Number(summary.total_health_centers),
      totalCooperatives: Number(summary.total_cooperatives),
    };
  } catch (error) {
    logger.error(`Failed to get district economic summary: ${error.message}`);
    throw error;
  }
}

async function searchVillages(filters = {}) {
  try {
    const {
      district,
      block,
      minPopulation,
      maxPopulation,
      minIrrigationCoverage,
      hasRoadAccess,
      mainCrop,
    } = filters;

    let query = 'SELECT * FROM village_profiles WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (district) { query += ` AND district = $${paramIndex++}`; params.push(district); }
    if (block) { query += ` AND block = $${paramIndex++}`; params.push(block); }
    if (minPopulation !== undefined && minPopulation !== '') {
      query += ` AND population >= $${paramIndex++}`; params.push(minPopulation);
    }
    if (maxPopulation !== undefined && maxPopulation !== '') {
      query += ` AND population <= $${paramIndex++}`; params.push(maxPopulation);
    }
    if (minIrrigationCoverage !== undefined && minIrrigationCoverage !== '') {
      query += ` AND irrigation_coverage >= $${paramIndex++}`; params.push(minIrrigationCoverage);
    }
    if (hasRoadAccess !== undefined && hasRoadAccess !== '') {
      query += ` AND road_access = $${paramIndex++}`;
      params.push(hasRoadAccess === true || hasRoadAccess === 'true');
    }
    if (mainCrop) {
      query += ` AND main_crops ILIKE $${paramIndex++}`;
      params.push(`%${mainCrop}%`);
    }

    query += ' ORDER BY village_name NULLS LAST, name LIMIT 100';
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

  // Search must precede /villages/:villageId so the literal "search"
  // path is not consumed as a village ID.
  router.get('/villages/search', async (req, res) => {
    try {
      const villages = await searchVillages(req.query);
      res.json({ success: true, data: villages });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

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
      const villages = await getVillagesByBlock(req.params.block);
      res.json({ success: true, data: villages });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/districts/:district/economic-summary', async (req, res) => {
    try {
      const summary = await getDistrictEconomicSummary(req.params.district);
      res.json({ success: true, data: summary });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  });

  router.post('/villages', async (req, res) => {
    try {
      const profile = await upsertVillageProfile(req.body);
      res.status(201).json({ success: true, data: profile });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
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
  setupRoutes,
};

// Merged legacy exports retained for compatibility.
for (const modulePath of ['../../modules/M019/service', '../../modules/M041/service', '../../modules/M054/service']) {
  try { Object.assign(module.exports, require(modulePath)); } catch (error) {
    logger.warn(`Optional legacy village service merge skipped: ${modulePath}: ${error.message}`);
  }
}
