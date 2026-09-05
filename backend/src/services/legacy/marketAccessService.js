/**
 * Market Access Service
 * 
 * Wires the existing `market_access` table (migration 041) to application logic
 * Implements REOS Rural Life OS component for market access and distribution channels
 */

'use strict';

const pool = require('../../database\/pool');
const { logger } = require('../../utils\/logger');

const r2 = (n) => Math.round(n * 100) / 100;

/**
 * Get market access by ID
 * @param {string} accessId - Access record ID
 * @returns {Promise<Object>} Access details
 */
async function getMarketAccess(accessId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM market_access WHERE access_id = $1`,
      [accessId]
    );
    
    if (!rows.length) {
      throw new Error(`Market access not found: ${accessId}`);
    }
    
    return rows[0];
  } catch (error) {
    logger.error(`Failed to get market access: ${error.message}`);
    throw error;
  }
}

/**
 * Get market access by village
 * @param {string} villageId - Village ID
 * @returns {Promise<Array>} Access records
 */
async function getMarketAccessByVillage(villageId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM market_access WHERE village_id = $1 ORDER BY market_type`,
      [villageId]
    );
    
    return rows;
  } catch (error) {
    logger.error(`Failed to get market access by village: ${error.message}`);
    throw error;
  }
}

/**
 * Get market access by market type
 * @param {string} marketType - Market type
 * @returns {Promise<Array>} Access records
 */
async function getMarketAccessByType(marketType) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM market_access WHERE market_type = $1 ORDER BY village_id`,
      [marketType]
    );
    
    return rows;
  } catch (error) {
    logger.error(`Failed to get market access by type: ${error.message}`);
    throw error;
  }
}

/**
 * Create or update market access
 * @param {Object} access - Access data
 * @returns {Promise<Object>} Created/updated access
 */
async function upsertMarketAccess(access) {
  try {
    const {
      access_id,
      village_id,
      district,
      market_type,
      market_id,
      market_name,
      distance_km,
      transport_mode,
      frequency,
      average_selling_price,
      commission_rate,
      payment_terms,
      last_updated
    } = access;

    const { rows } = await pool.query(
      `INSERT INTO market_access 
        (access_id, village_id, district, market_type, market_id,
         market_name, distance_km, transport_mode, frequency,
         average_selling_price, commission_rate, payment_terms, last_updated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
       ON CONFLICT (access_id)
       DO UPDATE SET
         village_id = EXCLUDED.village_id,
         district = EXCLUDED.district,
         market_type = EXCLUDED.market_type,
         market_id = EXCLUDED.market_id,
         market_name = EXCLUDED.market_name,
         distance_km = EXCLUDED.distance_km,
         transport_mode = EXCLUDED.transport_mode,
         frequency = EXCLUDED.frequency,
         average_selling_price = EXCLUDED.average_selling_price,
         commission_rate = EXCLUDED.commission_rate,
         payment_terms = EXCLUDED.payment_terms,
         last_updated = NOW()
       RETURNING *`,
      [access_id, village_id, district, market_type, market_id,
       market_name, distance_km, transport_mode, frequency,
       average_selling_price, commission_rate, payment_terms]
    );

    logger.info(`Market access upserted: ${access_id}`);
    return rows[0];
  } catch (error) {
    logger.error(`Failed to upsert market access: ${error.message}`);
    throw error;
  }
}

/**
 * Get village market summary
 * @param {string} villageId - Village ID
 * @returns {Promise<Object>} Village summary
 */
async function getVillageMarketSummary(villageId) {
  try {
    const { rows } = await pool.query(
      `SELECT 
         market_type,
         COUNT(*) as market_count,
         AVG(distance_km) as avg_distance_km,
         AVG(average_selling_price) as avg_selling_price,
         AVG(commission_rate) as avg_commission_rate
       FROM market_access
       WHERE village_id = $1
       GROUP BY market_type`,
      [villageId]
    );

    return {
      villageId,
      marketTypes: rows.map(row => ({
        marketType: row.market_type,
        marketCount: parseInt(row.market_count),
        avgDistanceKm: row.avg_distance_km ? r2(row.avg_distance_km) : 0,
        avgSellingPrice: row.avg_selling_price ? r2(row.avg_selling_price) : 0,
        avgCommissionRate: row.avg_commission_rate ? r2(row.avg_commission_rate) : 0
      }))
    };
  } catch (error) {
    logger.error(`Failed to get village market summary: ${error.message}`);
    throw error;
  }
}

function setupRoutes(app) {
  const express = require('express');
  const router = express.Router();
  const authMiddleware = require('../../middleware\/auth');

  router.use(authMiddleware);

  router.get('/access/:accessId', async (req, res) => {
    try {
      const access = await getMarketAccess(req.params.accessId);
      res.json({ success: true, data: access });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  });

  router.get('/access/village/:villageId', async (req, res) => {
    try {
      const accessRecords = await getMarketAccessByVillage(req.params.villageId);
      res.json({ success: true, data: accessRecords });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/access/type/:marketType', async (req, res) => {
    try {
      let accessRecords = await getMarketAccessByType(req.params.marketType);
      res.json({ success: true, data: accessRecords });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/access/village/:villageId/summary', async (req, res) => {
    try {
      const summary = await getVillageMarketSummary(req.params.villageId);
      res.json({ success: true, data: summary });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  });

  router.post('/access', async (req, res) => {
    try {
      let access = await upsertMarketAccess(req.body);
      res.status(201).json({ success: true, data: access });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.use('/api/v1/market-access', router);
  logger.info('Market access routes mounted at /api/v1/market-access');
}

module.exports = {
  getMarketAccess,
  getMarketAccessByVillage,
  getMarketAccessByType,
  upsertMarketAccess,
  getVillageMarketSummary,
  setupRoutes
};



