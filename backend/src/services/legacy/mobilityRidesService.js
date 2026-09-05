/**
 * Mobility Rides Service
 * 
 * Wires the existing `mobility_rides` table (migration 042) to application logic
 * Implements REOS Rural Life OS component for rural mobility and transportation
 */

'use strict';

const pool = require('..\/database\/pool');
const { logger } = require('..\/utils\/logger');

const r2 = (n) => Math.round(n * 100) / 100;

/**
 * Get mobility ride by ID
 * @param {string} rideId - Ride ID
 * @returns {Promise<Object>} Ride details
 */
async function getMobilityRide(rideId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM mobility_rides WHERE ride_id = $1`,
      [rideId]
    );
    
    if (!rows.length) {
      throw new Error(`Mobility ride not found: ${rideId}`);
    }
    
    return rows[0];
  } catch (error) {
    logger.error(`Failed to get mobility ride: ${error.message}`);
    throw error;
  }
}

/**
 * Get mobility rides by village
 * @param {string} villageId - Village ID
 * @returns {Promise<Array>} Rides
 */
async function getMobilityRidesByVillage(villageId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM mobility_rides WHERE village_id = $1 ORDER BY scheduled_date DESC`,
      [villageId]
    );
    
    return rows;
  } catch (error) {
    logger.error(`Failed to get mobility rides by village: ${error.message}`);
    throw error;
  }
}

/**
 * Get mobility rides by driver
 * @param {string} driverId - Driver ID
 * @returns {Promise<Array>} Rides
 */
async function getMobilityRidesByDriver(driverId) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM mobility_rides WHERE driver_id = $1 ORDER BY scheduled_date DESC`,
      [driverId]
    );
    
    return rows;
  } catch (error) {
    logger.error(`Failed to get mobility rides by driver: ${error.message}`);
    throw error;
  }
}

/**
 * Create new mobility ride
 * @param {Object} ride - Ride data
 * @returns {Promise<Object>} Created ride
 */
async function createMobilityRide(ride) {
  try {
    const {
      ride_id,
      village_id,
      district,
      driver_id,
      vehicle_type,
      origin,
      destination,
      scheduled_date,
      scheduled_time,
      capacity,
      fare_per_seat,
      status,
      notes
    } = ride;

    const { rows } = await pool.query(
      `INSERT INTO mobility_rides 
        (ride_id, village_id, district, driver_id, vehicle_type,
         origin, destination, scheduled_date, scheduled_time,
         capacity, fare_per_seat, status, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
       RETURNING *`,
      [ride_id, village_id, district, driver_id, vehicle_type,
       origin, destination, scheduled_date, scheduled_time,
       capacity, fare_per_seat, status, notes]
    );

    logger.info(`Mobility ride created: ${ride_id}`);
    return rows[0];
  } catch (error) {
    logger.error(`Failed to create mobility ride: ${error.message}`);
    throw error;
  }
}

/**
 * Update mobility ride status
 * @param {string} rideId - Ride ID
 * @param {string} status - New status
 * @returns {Promise<Object>} Updated ride
 */
async function updateRideStatus(rideId, status) {
  try {
    const { rows } = await pool.query(
      `UPDATE mobility_rides
       SET status = $1,
           updated_at = NOW()
       WHERE ride_id = $2
       RETURNING *`,
      [status, rideId]
    );
    
    if (!rows.length) {
      throw new Error(`Mobility ride not found: ${rideId}`);
    }

    logger.info(`Mobility ride status updated: ${rideId}`);
    return rows[0];
  } catch (error) {
    logger.error(`Failed to update ride status: ${error.message}`);
    throw error;
  }
}

/**
 * Get mobility ride statistics
 * @param {Object} filters - Optional filters (district, village_id, driver_id, status)
 * @returns {Promise<Object>} Ride statistics
 */
async function getMobilityRideStatistics(filters = {}) {
  try {
    const { district, village_id, driver_id, status } = filters;
    
    let query = `
      SELECT 
        COUNT(*) as total_rides,
        COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_rides,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_rides,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_rides,
        AVG(fare_per_seat) as avg_fare_per_seat,
        SUM(capacity) as total_capacity
      FROM mobility_rides
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

    if (driver_id) {
      query += ` AND driver_id = $${paramIndex}`;
      params.push(driver_id);
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
      totalRides: parseInt(stats.total_rides),
      scheduledRides: parseInt(stats.scheduled_rides),
      completedRides: parseInt(stats.completed_rides),
      cancelledRides: parseInt(stats.cancelled_rides),
      avgFarePerSeat: stats.avg_fare_per_seat ? r2(stats.avg_fare_per_seat) : 0,
      totalCapacity: stats.total_capacity ? parseInt(stats.total_capacity) : 0
    };
  } catch (error) {
    logger.error(`Failed to get mobility ride statistics: ${error.message}`);
    throw error;
  }
}

function setupRoutes(app) {
  const express = require('express');
  const router = express.Router();
  const authMiddleware = require('..\/middleware\/auth');

  router.use(authMiddleware);

  router.get('/rides/:rideId', async (req, res) => {
    try {
      const ride = await getMobilityRide(req.params.rideId);
      res.json({ success: true, data: ride });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  });

  router.get('/rides/village/:villageId', async (req, res) => {
    try {
      const rides = await getMobilityRidesByVillage(req.params.villageId);
      res.json({ success: true, data: rides });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/rides/driver/:driverId', async (req, res) => {
    try {
      let rides = await getMobilityRidesByDriver(req.params.driverId);
      res.json({ success: true, data: rides });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.post('/rides', async (req, res) => {
    try {
      let ride = await createMobilityRide(req.body);
      res.status(201).json({ success: true, data: ride });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  router.put('/rides/:rideId/status', async (req, res) => {
    try {
      const { status } = req.body;
      let ride = await updateRideStatus(req.params.rideId, status);
      res.json({ success: true, data: ride });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  router.get('/rides/statistics', async (req, res) => {
    try {
      let stats = await getMobilityRideStatistics(req.query);
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.use('/api/v1/mobility-rides', router);
  logger.info('Mobility rides routes mounted at /api/v1/mobility-rides');
}

module.exports = {
  getMobilityRide,
  getMobilityRidesByVillage,
  getMobilityRidesByDriver,
  createMobilityRide,
  updateRideStatus,
  getMobilityRideStatistics,
  setupRoutes
};


