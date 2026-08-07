/**
 * Logistics Enhancement Routes
 * Express routes for logistics enhancement service
 */

const express = require('express');
const { logger } = require('../utils/logger');
const { authMiddleware } = require('../middleware/auth');
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
router.put('/fleet/vehicles/:vehicleId', authMiddleware, async (req, res) => {
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
    const result = await logisticsService.addWarehouseLocation(req.body);
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
    const result = await logisticsService.getWarehouseLocations(filters);
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
    const result = await logisticsService.addInventory(req.body);
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
    const filters = {
      warehouseId: req.query.warehouseId,
      locationId: req.query.locationId,
      productId: req.query.productId,
      status: req.query.status
    };
    const result = await logisticsService.getInventory(filters);
    res.json(result);
  } catch (error) {
    logger.error('Get inventory API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get inventory' });
  }
});

/**
 * Record inventory movement
 */
router.post('/warehouse/inventory/movement', authMiddleware, async (req, res) => {
  try {
    const result = await logisticsService.recordInventoryMovement(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Record inventory movement API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to record inventory movement' });
  }
});

/**
 * Get warehouse performance metrics
 */
router.get('/warehouse/performance', authMiddleware, async (req, res) => {
  try {
    const { warehouseId, startDate, endDate } = req.query;
    const result = await logisticsService.getWarehousePerformance(warehouseId, startDate, endDate);
    res.json(result);
  } catch (error) {
    logger.error('Get warehouse performance API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get warehouse performance' });
  }
});

// ============================================================================
// ROUTE OPTIMIZATION ROUTES
// ============================================================================

/**
 * Optimize route
 */
router.post('/routes/optimize', authMiddleware, async (req, res) => {
  try {
    const result = await logisticsService.optimizeRoute(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Optimize route API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to optimize route' });
  }
});

/**
 * Get route by ID
 */
router.get('/routes/:routeId', authMiddleware, async (req, res) => {
  try {
    const result = await logisticsService.getRoute(req.params.routeId);
    res.json(result);
  } catch (error) {
    logger.error('Get route API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get route' });
  }
});

// ============================================================================
// DELIVERY SCHEDULE ROUTES
// ============================================================================

/**
 * Create delivery schedule
 */
router.post('/deliveries/schedule', authMiddleware, async (req, res) => {
  try {
    const result = await logisticsService.createDeliverySchedule(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Create delivery schedule API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create delivery schedule' });
  }
});

/**
 * Get delivery schedules
 */
router.get('/deliveries/schedule', authMiddleware, async (req, res) => {
  try {
    const filters = {
      vehicleId: req.query.vehicleId,
      shipmentId: req.query.shipmentId,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    const result = await logisticsService.getDeliverySchedules(filters);
    res.json(result);
  } catch (error) {
    logger.error('Get delivery schedules API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get delivery schedules' });
  }
});

/**
 * Update delivery schedule
 */
router.put('/deliveries/schedule/:scheduleId', authMiddleware, async (req, res) => {
  try {
    const result = await logisticsService.updateDeliverySchedule(req.params.scheduleId, req.body);
    res.json(result);
  } catch (error) {
    logger.error('Update delivery schedule API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to update delivery schedule' });
  }
});

// ---------------------------------------------------------------------------
// Driver location (991). Added to the existing logistics routes rather than a
// new file — shipment_tracking and driver_location answer the same question
// from two angles and must not be served by two modules.
// ---------------------------------------------------------------------------

router.post('/drivers/location', authMiddleware, async (req, res) => {
  try {
    const data = await logisticsEnhancementService.recordDriverLocation(req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(/Refusing|out of range/.test(error.message) ? 400 : 500)
      .json({ success: false, error: error.message });
  }
});

router.get('/drivers/active', authMiddleware, async (req, res) => {
  try {
    const data = await logisticsEnhancementService.getActiveDrivers(req.query);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/shipments/:id/trail', authMiddleware, async (req, res) => {
  try {
    const data = await logisticsEnhancementService.getShipmentTrail(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
