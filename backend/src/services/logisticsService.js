/**
 * Logistics Service
 * Manages shipments, vehicles, drivers, and tracking
 */

const { logger } = require('../utils/logger');
const { getPostgreSQL } = require('../database/connection');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { LOGISTICS_ROLES } = require('../middleware/roleGroups');
const decisionSupportService = require('./decisionSupportService');

/**
 * Create shipment
 */
async function createShipment(shipmentData) {
  try {
    const pg = getPostgreSQL();
    
    const shipmentNumber = generateShipmentNumber();
    
    const query = `
      INSERT INTO shipments (shipment_number, order_id, mode_id, origin_address, destination_address,
                           origin_lat, origin_lng, dest_lat, dest_lng, weight_kg, volume_cbm,
                           is_perishable, temperature_requirement, estimated_cost, estimated_transit_days)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;
    
    const result = await pg.query(query, [
      shipmentNumber,
      shipmentData.order_id,
      shipmentData.mode_id,
      shipmentData.origin_address,
      shipmentData.destination_address,
      shipmentData.origin_lat || null,
      shipmentData.origin_lng || null,
      shipmentData.dest_lat || null,
      shipmentData.dest_lng || null,
      shipmentData.weight_kg,
      shipmentData.volume_cbm || null,
      shipmentData.is_perishable || false,
      shipmentData.temperature_requirement || null,
      shipmentData.estimated_cost || null,
      shipmentData.estimated_transit_days || null
    ]);
    
    logger.info(`Shipment created: ${shipmentNumber}`);
    
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating shipment', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get shipment by ID
 */
async function getShipmentById(shipmentId) {
  try {
    const pg = getPostgreSQL();
    
    const query = `
      SELECT s.*, sm.name as mode_name, sm.code as mode_code, sm.transit_days as base_transit_days,
             o.order_number
      FROM shipments s
      LEFT JOIN shipment_modes sm ON s.mode_id = sm.id
      LEFT JOIN orders o ON s.order_id = o.id
      WHERE s.id = $1
    `;
    
    const result = await pg.query(query, [shipmentId]);
    
    if (result.rows.length === 0) {
      throw new Error('Shipment not found');
    }
    
    return result.rows[0];
  } catch (error) {
    logger.error('Error fetching shipment', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get shipments with filtering
 */
async function getShipments(filters = {}, pagination = {}) {
  try {
    const pg = getPostgreSQL();
    
    const { order_id, status, mode_id } = filters;
    const { page = 1, limit = 20, sort_by = 'created_at', sort_order = 'DESC' } = pagination;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT s.*, sm.name as mode_name, o.order_number
      FROM shipments s
      LEFT JOIN shipment_modes sm ON s.mode_id = sm.id
      LEFT JOIN orders o ON s.order_id = o.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (order_id) {
      paramCount++;
      query += ` AND s.order_id = $${paramCount}`;
      params.push(order_id);
    }
    
    if (status) {
      paramCount++;
      query += ` AND s.status = $${paramCount}`;
      params.push(status);
    }
    
    if (mode_id) {
      paramCount++;
      query += ` AND s.mode_id = $${paramCount}`;
      params.push(mode_id);
    }
    
    const countQuery = query.replace(/SELECT s\.\*, sm\.name as mode_name, o\.order_number/, 'SELECT COUNT(*)');
    const countResult = await pg.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    query += ` ORDER BY s.${sort_by} ${sort_order} LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);
    
    const result = await pg.query(query, params);
    
    return {
      shipments: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error fetching shipments', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Update shipment status
 */
async function updateShipmentStatus(shipmentId, status, notes = null) {
  try {
    const pg = getPostgreSQL();
    
    const query = `
      UPDATE shipments
      SET status = $1, notes = COALESCE($2, notes), updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    
    const result = await pg.query(query, [status, notes, shipmentId]);
    
    if (result.rows.length === 0) {
      throw new Error('Shipment not found');
    }
    
    const shipment = result.rows[0];
    
    // Emit WebSocket event
    const io = require('../index').app.get('io');
    if (io) {
      io.to(`shipment:${shipmentId}`).emit('shipment_status_updated', {
        shipment_id: shipmentId,
        status: status,
        notes: notes
      });
    }
    
    logger.info(`Shipment status updated: ${shipmentId} to ${status}`);
    
    return shipment;
  } catch (error) {
    logger.error('Error updating shipment status', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Add tracking update
 */
async function addTrackingUpdate(shipmentId, trackingData) {
  try {
    const pg = getPostgreSQL();
    
    const query = `
      INSERT INTO shipment_tracking (shipment_id, location, latitude, longitude, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const result = await pg.query(query, [
      shipmentId,
      trackingData.location,
      trackingData.latitude || null,
      trackingData.longitude || null,
      trackingData.status || 'in_transit',
      trackingData.notes || null
    ]);
    
    // Emit WebSocket event
    const io = require('../index').app.get('io');
    if (io) {
      io.to(`shipment:${shipmentId}`).emit('tracking_update', {
        shipment_id: shipmentId,
        location: trackingData.location,
        latitude: trackingData.latitude,
        longitude: trackingData.longitude,
        status: trackingData.status
      });
    }
    
    logger.info(`Tracking update added for shipment ${shipmentId}`);
    
    return result.rows[0];
  } catch (error) {
    logger.error('Error adding tracking update', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get shipment tracking history
 */
async function getShipmentTracking(shipmentId) {
  try {
    const pg = getPostgreSQL();
    
    const query = `
      SELECT * FROM shipment_tracking
      WHERE shipment_id = $1
      ORDER BY timestamp ASC
    `;
    
    const result = await pg.query(query, [shipmentId]);
    
    return result.rows;
  } catch (error) {
    logger.error('Error fetching tracking history', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Register vehicle
 */
async function registerVehicle(vehicleData) {
  try {
    const pg = getPostgreSQL();
    
    const query = `
      INSERT INTO vehicles (registration_number, type, capacity_kg, reefer_equipped, temperature_range,
                          owner_type, owner_id, current_location)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const result = await pg.query(query, [
      vehicleData.registration_number,
      vehicleData.type,
      vehicleData.capacity_kg,
      vehicleData.reefer_equipped || false,
      vehicleData.temperature_range || null,
      vehicleData.owner_type || 'platform',
      vehicleData.owner_id || null,
      vehicleData.current_location || null
    ]);
    
    logger.info(`Vehicle registered: ${vehicleData.registration_number}`);
    
    return result.rows[0];
  } catch (error) {
    logger.error('Error registering vehicle', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get vehicles
 */
async function getVehicles(filters = {}) {
  try {
    const pg = getPostgreSQL();
    
    const { type, status, reefer_equipped } = filters;
    
    let query = `
      SELECT v.*, d.name as driver_name, d.phone as driver_phone
      FROM vehicles v
      LEFT JOIN drivers d ON v.driver_id = d.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (type) {
      paramCount++;
      query += ` AND v.type = $${paramCount}`;
      params.push(type);
    }
    
    if (status) {
      paramCount++;
      query += ` AND v.status = $${paramCount}`;
      params.push(status);
    }
    
    if (reefer_equipped !== undefined) {
      paramCount++;
      query += ` AND v.reefer_equipped = $${paramCount}`;
      params.push(reefer_equipped);
    }
    
    query += ' ORDER BY v.registration_number';
    
    const result = await pg.query(query, params);
    
    return result.rows;
  } catch (error) {
    logger.error('Error fetching vehicles', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Register driver
 */
async function registerDriver(driverData) {
  try {
    const pg = getPostgreSQL();
    
    const query = `
      INSERT INTO drivers (name, phone, license_number, license_expiry_date, assigned_vehicle_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await pg.query(query, [
      driverData.name,
      driverData.phone,
      driverData.license_number,
      driverData.license_expiry_date,
      driverData.assigned_vehicle_id || null
    ]);
    
    // Update vehicle if assigned
    if (driverData.assigned_vehicle_id) {
      await pg.query(
        'UPDATE vehicles SET driver_id = $1 WHERE id = $2',
        [result.rows[0].id, driverData.assigned_vehicle_id]
      );
    }
    
    logger.info(`Driver registered: ${driverData.name}`);
    
    return result.rows[0];
  } catch (error) {
    logger.error('Error registering driver', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get drivers
 */
async function getDrivers(filters = {}) {
  try {
    const pg = getPostgreSQL();
    
    const { status, verification_status } = filters;
    
    let query = `
      SELECT d.*, v.registration_number as assigned_vehicle
      FROM drivers d
      LEFT JOIN vehicles v ON d.assigned_vehicle_id = v.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (status) {
      paramCount++;
      query += ` AND d.status = $${paramCount}`;
      params.push(status);
    }
    
    if (verification_status) {
      paramCount++;
      query += ` AND d.verification_status = $${paramCount}`;
      params.push(verification_status);
    }
    
    query += ' ORDER BY d.name';
    
    const result = await pg.query(query, params);
    
    return result.rows;
  } catch (error) {
    logger.error('Error fetching drivers', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get shipment modes
 */
async function getShipmentModes() {
  try {
    const pg = getPostgreSQL();
    
    const query = 'SELECT * FROM shipment_modes WHERE is_active = TRUE ORDER BY name';
    
    const result = await pg.query(query);
    
    return result.rows;
  } catch (error) {
    logger.error('Error fetching shipment modes', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * ecoLogisticsMiles wrapper — ESG/logistics lane-scoring, real data.
 *
 * Ported from v42 (docs/MISSING_BUSINESS_LOGIC_EXTRACTION.md #3). The
 * prototype scored a chosen lane against an in-memory TM_LANES array; the
 * real corridors are freight_lanes (992_v42_recovered_intelligence.sql) —
 * the same table allocScore (dynamicPricingService.js) already queries for
 * distance lookups. The scoring itself is NOT reimplemented here: it is
 * called straight from decisionSupportService.ecoLogisticsMiles(ctx, lanes),
 * which already accepts real ctx/lanes as parameters (same call-through
 * pattern as corpCreditEligible in financialService.js), so the thresholds
 * (score 95 at <=15% over the shortest lane, floor of 10, the "% longer ->
 * penalty" formula) can never drift out of sync with the client-supplied
 * /api/v1/decision-support/eco-logistics-miles endpoint.
 *
 * Accepts either a freight_lanes.lane_code directly (the real-data analog
 * of the original TM_LANES 'k' key), or a shipment id whose origin/
 * destination address is matched to a freight_lanes row via the same
 * ILIKE origin/destination matching allocScore uses for its distance
 * lookup. If neither resolves to a specific lane, decisionSupportService's
 * own fallback (first lane on record, or a "not found" 50-score when no
 * lanes exist at all) preserves the original TM_LANES.find(...) ||
 * TM_LANES[0] behaviour exactly.
 */
async function getEcoLogisticsScore({ laneCode, shipmentId } = {}) {
  const pg = getPostgreSQL();

  const { rows: laneRows } = await pg.query(
    `SELECT lane_code, origin, destination, distance_km
       FROM freight_lanes
      WHERE is_active = TRUE
      ORDER BY lane_code`
  );
  const lanes = laneRows.map((r) => ({
    k: r.lane_code,
    o: r.origin,
    d: r.destination,
    km: Number(r.distance_km)
  }));

  let resolvedLaneCode = laneCode || null;

  if (!resolvedLaneCode && shipmentId) {
    const { rows: shipmentRows } = await pg.query(
      'SELECT origin_address, destination_address FROM shipments WHERE id = $1',
      [shipmentId]
    );
    if (!shipmentRows.length) {
      throw new Error('Shipment not found');
    }
    const shipment = shipmentRows[0];

    const { rows: matchRows } = await pg.query(
      `SELECT lane_code FROM freight_lanes
        WHERE is_active = TRUE
          AND (origin ILIKE '%' || $1 || '%' OR $1 ILIKE '%' || origin || '%')
          AND (destination ILIKE '%' || $2 || '%' OR $2 ILIKE '%' || destination || '%')
        LIMIT 1`,
      [shipment.origin_address, shipment.destination_address]
    );
    resolvedLaneCode = matchRows.length ? matchRows[0].lane_code : null;
  }

  const ctx = { kind: 'booking', lane: resolvedLaneCode };
  const result = decisionSupportService.ecoLogisticsMiles(ctx, lanes);

  return {
    ...result,
    laneCode: resolvedLaneCode,
    shipmentId: shipmentId || null,
    laneMatched: !!resolvedLaneCode,
    availableLanes: lanes.length
  };
}

/**
 * Helper function to generate shipment number
 */
function generateShipmentNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SHP-${timestamp}-${random}`;
}

/**
 * Express router for logistics service
 */
const express = require('express');
const router = express.Router();

// Create shipment
router.post('/shipments', authMiddleware, async (req, res) => {
  try {
    const shipment = await createShipment(req.body);
    res.status(201).json(shipment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get shipment by ID
router.get('/shipments/:id', async (req, res) => {
  try {
    const shipment = await getShipmentById(req.params.id);
    res.json(shipment);
  } catch (error) {
    if (error.message === 'Shipment not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Get shipments
router.get('/shipments', async (req, res) => {
  try {
    const filters = {
      order_id: req.query.order_id,
      status: req.query.status,
      mode_id: req.query.mode_id
    };
    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sort_by: req.query.sort_by,
      sort_order: req.query.sort_order
    };
    const result = await getShipments(filters, pagination);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update shipment status
router.put('/shipments/:id/status', authMiddleware, requireRole(...LOGISTICS_ROLES), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const shipment = await updateShipmentStatus(req.params.id, status, notes);
    res.json(shipment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add tracking update
router.post('/shipments/:id/tracking', authMiddleware, async (req, res) => {
  try {
    const tracking = await addTrackingUpdate(req.params.id, req.body);
    res.status(201).json(tracking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get shipment tracking
router.get('/shipments/:id/tracking', async (req, res) => {
  try {
    const tracking = await getShipmentTracking(req.params.id);
    res.json(tracking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register vehicle
router.post('/vehicles', authMiddleware, async (req, res) => {
  try {
    const vehicle = await registerVehicle(req.body);
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get vehicles
router.get('/vehicles', async (req, res) => {
  try {
    const filters = {
      type: req.query.type,
      status: req.query.status,
      reefer_equipped: req.query.reefer_equipped
    };
    const vehicles = await getVehicles(filters);
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register driver
router.post('/drivers', authMiddleware, async (req, res) => {
  try {
    const driver = await registerDriver(req.body);
    res.status(201).json(driver);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get drivers
router.get('/drivers', async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      verification_status: req.query.verification_status
    };
    const drivers = await getDrivers(filters);
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get shipment modes
router.get('/modes', async (req, res) => {
  try {
    const modes = await getShipmentModes();
    res.json(modes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ESG/logistics lane score for a real freight lane (see getEcoLogisticsScore above)
router.get('/lanes/:laneCode/eco-score', async (req, res) => {
  try {
    const result = await getEcoLogisticsScore({ laneCode: req.params.laneCode });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ESG/logistics lane score for a real shipment, matched to its freight lane
router.get('/shipments/:id/eco-score', async (req, res) => {
  try {
    const result = await getEcoLogisticsScore({ shipmentId: req.params.id });
    res.json(result);
  } catch (error) {
    if (error.message === 'Shipment not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

module.exports = {
  router,
  createShipment,
  getShipmentById,
  getShipments,
  updateShipmentStatus,
  addTrackingUpdate,
  getShipmentTracking,
  registerVehicle,
  getVehicles,
  registerDriver,
  getDrivers,
  getShipmentModes,
  getEcoLogisticsScore
};
