/**
 * Logistics Enhancement Routes
 * Express routes for logistics enhancement service
 */

const express = require('express');
const { logger } = require('../utils/logger');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { LOGISTICS_ROLES } = require('../middleware/roleGroups');
const logisticsService = require('../services/logisticsEnhancementService');

const router = express.Router();

// ============================================================================
// FLEET MANAGEMENT ROUTES
// ============================================================================

/**
 * Add vehicle to fleet
 */
router.post('/fleet/vehicles', authMiddleware, async (req, res) => {
  try {
    const result = await logisticsService.addVehicle(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Add vehicle API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to add vehicle' });
  }
});

/**
 * Get fleet vehicles
 */
router.get('/fleet/vehicles', authMiddleware, async (req, res) => {
  try {
    const filters = {
      type: req.query.type,
      status: req.query.status
    };
    const result = await logisticsService.getFleet(filters);
    res.json(result);
  } catch (error) {
    logger.error('Get fleet API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get fleet' });
  }
});

/**
 * Get single vehicle
 */
router.get('/fleet/vehicles/:vehicleId', authMiddleware, async (req, res) => {
  try {
    const result = await logisticsService.getVehicle(req.params.vehicleId);
    res.json(result);
  } catch (error) {
    logger.error('Get vehicle API error', { error: error.message, stack: error.stack });
    if (error.message === 'Vehicle not found') {
      res.status(404).json({ error: 'Vehicle not found' });
    } else {
      res.status(500).json({ error: 'Failed to get vehicle' });
    }
  }
});

/**
 * Update vehicle
 */
router.put('/fleet/vehicles/:vehicleId', authMiddleware, requireRole(...LOGISTICS_ROLES), async (req, res) => {
  try {
    const result = await logisticsService.updateVehicle(req.params.vehicleId, req.body);
    res.json(result);
  } catch (error) {
    logger.error('Update vehicle API error', { error: error.message, stack: error.stack });
    if (error.message === 'Vehicle not found') {
      res.status(404).json({ error: 'Vehicle not found' });
    } else {
      res.status(500).json({ error: 'Failed to update vehicle' });
    }
  }
});

/**
 * Schedule vehicle maintenance
 */
router.post('/fleet/vehicles/:vehicleId/maintenance', authMiddleware, async (req, res) => {
  try {
    const result = await logisticsService.scheduleMaintenance(req.params.vehicleId, req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Schedule maintenance API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to schedule maintenance' });
  }
});

// ============================================================================
// REAL-TIME TRACKING ROUTES
// ============================================================================

/**
 * Update shipment tracking
 */
router.post('/tracking/:shipmentId', authMiddleware, async (req, res) => {
  try {
    const result = await logisticsService.updateTracking(req.params.shipmentId, req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Update tracking API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to update tracking' });
  }
});

/**
 * Get shipment tracking history
 */
router.get('/tracking/:shipmentId', authMiddleware, async (req, res) => {
  try {
    const result = await logisticsService.getTracking(req.params.shipmentId);
    res.json(result);
  } catch (error) {
    logger.error('Get tracking API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get tracking' });
  }
});

/**
 * Get live tracking data
 */
router.get('/tracking/:shipmentId/live', authMiddleware, async (req, res) => {
  try {
    const result = await logisticsService.getLiveTracking(req.params.shipmentId);
    res.json(result);
  } catch (error) {
    logger.error('Get live tracking API error', { error: error.message, stack: error.stack });
    if (error.message === 'No tracking data available') {
      res.status(404).json({ error: 'No tracking data available' });
    } else {
      res.status(500).json({ error: 'Failed to get live tracking' });
    }
  }
});

/**
 * Set geofence for shipment
 */
router.post('/tracking/:shipmentId/geofence', authMiddleware, async (req, res) => {
  try {
    const result = await logisticsService.setGeofence(req.params.shipmentId, req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Set geofence API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to set geofence' });
  }
});

// ============================================================================
// TEMPERATURE MONITORING ROUTES
// ============================================================================

/**
 * Record temperature reading
 */
router.post('/temperature/:shipmentId', authMiddleware, async (req, res) => {
  try {
    const result = await logisticsService.recordTemperature(req.params.shipmentId, req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Record temperature API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to record temperature' });
  }
});

/**
 * Get temperature data for shipment
 */
router.get('/temperature/:shipmentId', authMiddleware, async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      zone: req.query.zone
    };
    const result = await logisticsService.getTemperatureData(req.params.shipmentId, filters);
    res.json(result);
  } catch (error) {
    logger.error('Get temperature data API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get temperature data' });
  }
});

/**
 * Get temperature alerts for shipment
 */
router.get('/temperature/:shipmentId/alerts', authMiddleware, async (req, res) => {
  try {
    const result = await logisticsService.getTemperatureAlerts(req.params.shipmentId);
    res.json(result);
  } catch (error) {
    logger.error('Get temperature alerts API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get temperature alerts' });
  }
});

// ============================================================================
// WAREHOUSE MANAGEMENT ROUTES
// ============================================================================

/**
 * Add warehouse location
 */
router.post('/warehouse/locations', authMiddleware, async (req, res) => {
  try {
    const result = await logisticsService.createWarehouse(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Add warehouse location API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to add warehouse location' });
  }
});

/**
 * Get warehouse locations
 */
router.get('/warehouse/locations', authMiddleware, async (req, res) => {
  try {
    const filters = {
      warehouseId: req.query.warehouseId,
      zone: req.query.zone,
      status: req.query.status
    };
    const result = await logisticsService.getWarehouses(filters);
    res.json(result);
  } catch (error) {
    logger.error('Get warehouse locations API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get warehouse locations' });
  }
});

/**
 * Add inventory to warehouse
 */
router.post('/warehouse/inventory', authMiddleware, async (req, res) => {
  try {
    const result = await logisticsService.addInventory(req.body.warehouseId, req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Add inventory API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to add inventory' });
  }
});

/**
 * Get warehouse inventory
 */
router.get('/warehouse/inventory', authMiddleware, async (req, res) => {
  try {
    // getWarehouseInventory only filters by warehouseId - locationId/productId/status
    // aren't supported by the current query, so they're accepted but ignored rather
    // than silently dropped without a caller noticing.
    if (!req.query.warehouseId) {
      return res.status(400).json({ error: 'warehouseId is required' });
    }
    const result = await logisticsService.getWarehouseInventory(req.query.warehouseId);
    res.json(result);
  } catch (error) {
    logger.error('Get inventory API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get inventory' });
  }
});

// NOT_IMPLEMENTED: inventory-movement ledger, warehouse performance metrics, route
// optimization and delivery scheduling were never built in logisticsEnhancementService
// (no movement/performance/route/schedule tables or methods exist) - these 7 routes
// called nonexistent service functions and would have thrown ReferenceError at
// runtime. No frontend caller references any of these paths. Returning 501 instead
// of building the underlying feature, which is new scope beyond this audit pass.
const notImplemented = (feature) => (req, res) => {
  res.status(501).json({ error: `${feature} is not implemented`, code: 'NOT_IMPLEMENTED' });
};

router.post('/warehouse/inventory/movement', authMiddleware, notImplemented('Inventory movement tracking'));
router.get('/warehouse/performance', authMiddleware, notImplemented('Warehouse performance metrics'));

// ============================================================================
// ROUTE OPTIMIZATION ROUTES
// ============================================================================

router.post('/routes/optimize', authMiddleware, notImplemented('Route optimization'));
router.get('/routes/:routeId', authMiddleware, notImplemented('Route lookup'));

// ============================================================================
// DELIVERY SCHEDULE ROUTES
// ============================================================================

router.post('/deliveries/schedule', authMiddleware, notImplemented('Delivery scheduling'));
router.get('/deliveries/schedule', authMiddleware, notImplemented('Delivery scheduling'));
router.put('/deliveries/schedule/:scheduleId', authMiddleware, requireRole(...LOGISTICS_ROLES), notImplemented('Delivery scheduling'));

// ---------------------------------------------------------------------------
// Driver location (991). Added to the existing logistics routes rather than a
// new file — shipment_tracking and driver_location answer the same question
// from two angles and must not be served by two modules.
// ---------------------------------------------------------------------------

router.post('/drivers/location', authMiddleware, async (req, res) => {
  try {
    const data = await logisticsService.recordDriverLocation(req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(/Refusing|out of range/.test(error.message) ? 400 : 500)
      .json({ success: false, error: error.message });
  }
});

router.get('/drivers/active', authMiddleware, async (req, res) => {
  try {
    const data = await logisticsService.getActiveDrivers(req.query);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/shipments/:id/trail', authMiddleware, async (req, res) => {
  try {
    const data = await logisticsService.getShipmentTrail(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
