/**
 * Machinery Access Service
 * 
 * Wires the existing `machinery_access` table (migration 041) to application logic
 * Implements REOS Rural Life OS component for machinery/equipment sharing
 */

'use strict';

const pool = require('../database/pool');
const { logger } = require('../utils/logger');

const r2 = (n) => Math.round(n * 100) / 100;

/**
 * Get machinery access by ID
 * @param {string} accessId - Access record ID
 * @returns {Promise<Object>} Access details
 */
async function getMachineryAccess(accessId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM machinery_access WHERE access_id = $1`,
      [accessId]
    );
    
    if (!rows.length) {
      throw new Error(`Machinery access not found: ${accessId}`);
    }
    
    return rows[0];
  } catch (error) {
    logger.error(`Failed to get machinery access: ${error.message}`);
    throw error;
  }
}

/**
 * Get machinery access by village
 * @param {string} villageId - Village ID
 * @returns {Promise<Array>} Access records
 */
async function getMachineryAccessByVillage(villageId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM machinery_access WHERE village_id = $1 ORDER BY machinery_type`,
      [villageId]
    );
    
    return rows;
  } catch (error) {
    logger.error(`Failed to get machinery access by village: ${error.message}`);
    throw error;
  }
}

/**
 * Get machinery access by type
 * @param {string} machineryType - Machinery type
 * @returns {Promise<Array>} Access records
 */
async function getMachineryAccessByType(machineryType) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM machinery_access WHERE machinery_type = $1 ORDER BY village_id`,
      [machineryType]
    );
    
    return rows;
  } catch (error) {
    logger.error(`Failed to get machinery access by type: ${error.message}`);
    throw error;
  }
}

/**
 * Create or update machinery access
 * @param {Object} access - Access data
 * @returns {Promise<Object>} Created/updated access
 */
async function upsertMachineryAccess(access) {
  try {
    const {
      access_id,
      village_id,
      district,
      machinery_type,
      machinery_id,
      owner_id,
      access_model,
      hourly_rate,
      availability_schedule,
      booking_lead_time_days,
      maintenance_status,
      last_updated
    } = access;

    const { rows } = await pool.query(
      `INSERT INTO machinery_access 
        (access_id, village_id, district, machinery_type, machinery_id,
         owner_id, access_model, hourly_rate, availability_schedule,
         booking_lead_time_days, maintenance_status, last_updated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
       ON CONFLICT (access_id)
       DO UPDATE SET
         village_id = EXCLUDED.village_id,
         district = EXCLUDED.district,
         machinery_type = EXCLUDED.machinery_type,
         machinery_id = EXCLUDED.machinery_id,
         owner_id = EXCLUDED.owner_id,
         access_model = EXCLUDED.access_model,
         hourly_rate = EXCLUDED.hourly_rate,
         availability_schedule = EXCLUDED.availability_schedule,
         booking_lead_time_days = EXCLUDED.booking_lead_time_days,
         maintenance_status = EXCLUDED.maintenance_status,
         last_updated = NOW()
       RETURNING *`,
      [access_id, village_id, district, machinery_type, machinery_id,
       owner_id, access_model, hourly_rate, availability_schedule,
       booking_lead_time_days, maintenance_status]
    );

    logger.info(`Machinery access upserted: ${access_id}`);
    return rows[0];
  } catch (error) {
    logger.error(`Failed to upsert machinery access: ${error.message}`);
    throw error;
  }
}

/**
 * Get village machinery summary
 * @param {string} villageId - Village ID
 * @returns {Promise<Object>} Village summary
 */
async function getVillageMachinerySummary(villageId) {
  try {
    const { rows } = await pool.query(
      `SELECT 
         machinery_type,
         COUNT(*) as access_count,
         COUNT(CASE WHEN access_model = 'rental' THEN 1 END) as rental_count,
         COUNT(CASE WHEN access_model = 'shared' THEN 1 END) as shared_count,
         COUNT(CASE WHEN access_model = 'cooperative' THEN 1 END) as cooperative_count,
         AVG(hourly_rate) as avg_hourly_rate,
         COUNT(CASE WHEN maintenance_status = 'operational' THEN 1 END) as operational_count,
         COUNT(CASE WHEN maintenance_status = 'maintenance' THEN 1 END) as maintenance_count
       FROM machinery_access
       WHERE village_id = $1
       GROUP BY machinery_type`,
      [villageId]
    );

    return {
      villageId,
      machineryTypes: rows.map(row => ({
        machineryType: row.machinery_type,
        accessCount: parseInt(row.access_count),
        rentalCount: parseInt(row.rental_count),
        sharedCount: parseInt(row.shared_count),
        cooperativeCount: parseInt(row.cooperative_count),
        avgHourlyRate: row.avg_hourly_rate ? r2(row.avg_hourly_rate) : 0,
        operationalCount: parseInt(row.operational_count),
        maintenanceCount: parseInt(row.maintenance_count)
      }))
    };
  } catch (error) {
    logger.error(`Failed to get village machinery summary: ${error.message}`);
    throw error;
  }
}

function setupRoutes(app) {
  const express = require('express');
  const router = express.Router();
  const authMiddleware = require('../middleware/auth');

  router.use(authMiddleware);

  router.get('/access/:accessId', async (req, res) => {
    try {
      const access = await getMachineryAccess(req.params.accessId);
      res.json({ success: true, data: access });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  });

  router.get('/access/village/:villageId', async (req, res) => {
    try {
      const accessRecords = await getMachineryAccessByVillage(req.params.villageId);
      res.json({ success: true, data: accessRecords });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/access/type/:machineryType', async (req, res) => {
    try {
      const accessRecords = await getMachineryAccessByType(req.params.machineryType);
      res.json({ success: true, data: accessRecords });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/access/village/:villageId/summary', async (req, res) => {
    try {
      const summary = await getVillageMachinerySummary(req.params.villageId);
      res.json({ success: true, data: summary });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  });

  router.post('/access', async (req, res) => {
    try {
      const access = await upsertMachineryAccess(req.body);
      res.status(201).json({ success: true, data: access });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.use('/api/v1/machinery-access', router);
  logger.info('Machinery access routes mounted at /api/v1/machinery-access');
}

module.exports = {
  getMachineryAccess,
  getMachineryAccessByVillage,
  getMachineryAccessByType,
  upsertMachineryAccess,
  getVillageMachinerySummary,
  setupRoutes
};
