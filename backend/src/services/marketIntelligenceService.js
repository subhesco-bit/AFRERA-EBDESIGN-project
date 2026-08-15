/**
 * Market Intelligence Service
 * 
 * Wires the existing `market_intelligence` table (migration 041) to application logic
 * Implements REOS Rural Life OS component for market intelligence and price signals
 */

'use strict';

const pool = require('../database/pool');
const { logger } = require('../utils/logger');

const r2 = (n) => Math.round(n * 100) / 100;

/**
 * Get market intelligence by ID
 * @param {string} intelligenceId - Intelligence record ID
 * @returns {Promise<Object>} Intelligence details
 */
async function getMarketIntelligence(intelligenceId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM market_intelligence WHERE intelligence_id = $1`,
      [intelligenceId]
    );
    
    if (!rows.length) {
      throw new Error(`Market intelligence not found: ${intelligenceId}`);
    }
    
    return rows[0];
  } catch (error) {
    logger.error(`Failed to get market intelligence: ${error.message}`);
    throw error;
  }
}

/**
 * Get market intelligence by village
 * @param {string} villageId - Village ID
 * @returns {Promise<Array>} Intelligence records
 */
async function getMarketIntelligenceByVillage(villageId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM market_intelligence WHERE village_id = $1 ORDER BY recorded_at DESC`,
      [villageId]
    );
    
    return rows;
  } catch (error) {
    logger.error(`Failed to get market intelligence by village: ${error.message}`);
    throw error;
  }
}

/**
 * Get market intelligence by crop
 * @param {string} cropId - Crop ID
 * @returns {Promise<Array>} Intelligence records
 */
async function getMarketIntelligenceByCrop(cropId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM market_intelligence WHERE crop_id = $1 ORDER BY recorded_at DESC`,
      [cropId]
    );
    
    return rows;
  } catch (error) {
    logger.error(`Failed to get market intelligence by crop: ${error.message}`);
    throw error;
  }
}

/**
 * Create new market intelligence
 * @param {Object} intelligence - Intelligence data
 * @returns {Promise<Object>} Created intelligence
 */
async function createMarketIntelligence(intelligence) {
  try {
    const {
      intelligence_id,
      village_id,
      district,
      crop_id,
      crop_name,
      market_trend,
      price_signal,
      demand_forecast,
      supply_forecast,
      recommended_action,
      confidence_level,
      data_sources,
      valid_until,
      recorded_at
    } = intelligence;

    const { rows } = await pool.query(
      `INSERT INTO market_intelligence 
        (intelligence_id, village_id, district, crop_id, crop_name,
         market_trend, price_signal, demand_forecast, supply_forecast,
         recommended_action, confidence_level, data_sources, valid_until, recorded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
       RETURNING *`,
      [intelligence_id, village_id, district, crop_id, crop_name,
       market_trend, price_signal, demand_forecast, supply_forecast,
       recommended_action, confidence_level, data_sources, valid_until]
    );

    logger.info(`Market intelligence created: ${intelligence_id}`);
    return rows[0];
  } catch (error) {
    logger.error(`Failed to create market intelligence: ${error.message}`);
    throw error;
  }
}

/**
 * Get latest market intelligence for village
 * @param {string} villageId - Village ID
 * @returns {Promise<Object>} Latest intelligence
 */
async function getLatestMarketIntelligence(villageId) {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT ON (crop_id) * FROM market_intelligence
       WHERE village_id = $1 AND valid_until > NOW()
       ORDER BY crop_id, recorded_at DESC`,
      [villageId]
    );

    return rows;
  } catch (error) {
    logger.error(`Failed to get latest market intelligence: ${error.message}`);
    throw error;
  }
}

function setupRoutes(app) {
  const express = require('express');
  const router = express.Router();
  const authMiddleware = require('../middleware/auth');

  router.use(authMiddleware);

  router.get('/intelligence/:intelligenceId', async (req, res) => {
    try {
      const intelligence = await getMarketIntelligence(req.params.intelligenceId);
      res.json({ success: true, data: intelligence });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  });

  router.get('/intelligence/village/:villageId', async (req, res) => {
    try {
      const intelligenceRecords = await getMarketIntelligenceByVillage(req.params.villageId);
      res.json({ success: true, data: intelligenceRecords });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/intelligence/crop/:cropId', async (req, res) => {
    try {
      const intelligenceRecords = await getMarketIntelligenceByCrop(req.params.cropId);
      res.json({ success: true, data: intelligenceRecords });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/intelligence/village/:villageId/latest', async (req, res) => {
    try {
      const intelligence = await getLatestMarketIntelligence(req.params.villageId);
      res.json({ success: true, data: intelligence });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.post('/intelligence', async (req, res) => {
    try {
      const intelligence = await createMarketIntelligence(req.body);
      res.status(201).json({ success: true, data: intelligence });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.use('/api/v1/market-intelligence', router);
  logger.info('Market intelligence routes mounted at /api/v1/market-intelligence');
}

module.exports = {
  getMarketIntelligence,
  getMarketIntelligenceByVillage,
  getMarketIntelligenceByCrop,
  createMarketIntelligence,
  getLatestMarketIntelligence,
  setupRoutes
};
