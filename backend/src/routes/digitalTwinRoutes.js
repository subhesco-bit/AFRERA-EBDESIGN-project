/**
 * M029: Digital Twin Routes
 * Production-level API routes for digital twin service
 */

const express = require('express');
const router = express.Router();
const db = require('../database/connection');
const digitalTwinService = require('../services/digitalTwinService');
const apiResponseHandler = require('../middleware/apiResponseHandler');
// '../middleware/authMiddleware' does not exist in this repo - the real module is
// '../middleware/auth', exporting authMiddleware/requireRole, not authenticate/authorize.
const { authMiddleware: authenticate, requireRole } = require('../middleware/auth');
const authorize = (roles) => requireRole(...roles);
const { rateLimiter } = require('../middleware/rateLimiter');

// Apply authentication and rate limiting
router.use(authenticate);
router.use(rateLimiter);

/**
 * POST /api/digital-twin/farm
 * Create digital twin for farm
 */
router.post('/farm',
  authorize(['farmer', 'admin']),
  async (req, res) => {
    try {
      const farmData = req.body;
      const { farmerId } = farmData;

      // Authorization check
      if (req.user.role === 'farmer' && req.user.id !== farmerId) {
        return apiResponseHandler.sendError(res, 'Unauthorized access', 403, 'FORBIDDEN');
      }

      const result = await digitalTwinService.createFarmDigitalTwin(farmData);
      
      if (result.success) {
        return apiResponseHandler.sendSuccess(res, result.data, 'Farm digital twin created successfully');
      } else {
        return apiResponseHandler.sendError(res, result.error, 400, 'TWIN_CREATION_ERROR', result.farmId);
      }
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to create farm digital twin', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * POST /api/digital-twin/crop
 * Create digital twin for crop
 */
router.post('/crop',
  authorize(['farmer', 'admin']),
  async (req, res) => {
    try {
      const cropData = req.body;
      const { farmerId } = cropData;

      // Authorization check
      if (req.user.role === 'farmer' && req.user.id !== farmerId) {
        return apiResponseHandler.sendError(res, 'Unauthorized access', 403, 'FORBIDDEN');
      }

      let result = await digitalTwinService.createCropDigitalTwin(cropData);
      
      if (result.success) {
        return apiResponseHandler.sendSuccess(res, result.data, 'Crop digital twin created successfully');
      } else {
        return apiResponseHandler.sendError(res, result.error, 400, 'TWIN_CREATION_ERROR', result.cropId);
      }
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to create crop digital twin', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * POST /api/digital-twin/:twinId/sync
 * Sync digital twin with real-world data
 */
router.post('/:twinId/sync',
  authorize(['farmer', 'admin', 'system']),
  async (req, res) => {
    try {
      const { twinId } = req.params;

      let result = await digitalTwinService.syncDigitalTwin(twinId);
      
      if (result.success) {
        return apiResponseHandler.sendSuccess(res, result.data, 'Digital twin synced successfully');
      } else {
        return apiResponseHandler.sendError(res, result.error, 404, 'TWIN_NOT_FOUND', result.twinId);
      }
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to sync digital twin', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * POST /api/digital-twin/:twinId/simulate
 * Run simulation on digital twin
 */
router.post('/:twinId/simulate',
  authorize(['farmer', 'admin', 'analyst']),
  async (req, res) => {
    try {
      const { twinId } = req.params;
      const simulationConfig = req.body;

      if (!simulationConfig || !simulationConfig.type) {
        return apiResponseHandler.sendError(res, 'Simulation configuration is required', 400, 'MISSING_PARAMETER');
      }

      let result = await digitalTwinService.runSimulation(twinId, simulationConfig);
      
      if (result.success) {
        return apiResponseHandler.sendSuccess(res, result.data, 'Simulation completed successfully');
      } else {
        return apiResponseHandler.sendError(res, result.error, 404, 'TWIN_NOT_FOUND', result.twinId);
      }
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to run simulation', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * GET /api/digital-twin/:twinId
 * Get digital twin details
 */
router.get('/:twinId',
  authorize(['farmer', 'admin', 'analyst']),
  async (req, res) => {
    try {
      const { twinId } = req.params;

      const twin = await digitalTwinService.getTwinById(twinId);
      
      if (!twin) {
        return apiResponseHandler.sendError(res, 'Digital twin not found', 404, 'TWIN_NOT_FOUND', twinId);
      }

      // Get current state
      const currentState = digitalTwinService.activeTwins.get(twinId) || 
                           await digitalTwinService.getLatestTwinState(twinId);

      return apiResponseHandler.sendSuccess(res, {
        ...twin,
        currentState
      }, 'Digital twin details retrieved');
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to get digital twin details', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * GET /api/digital-twin/farmers/:farmerId
 * Get digital twins by farmer
 */
router.get('/farmers/:farmerId',
  authorize(['farmer', 'admin']),
  async (req, res) => {
    try {
      const { farmerId } = req.params;

      // Authorization check
      if (req.user.role === 'farmer' && req.user.id !== farmerId) {
        return apiResponseHandler.sendError(res, 'Unauthorized access', 403, 'FORBIDDEN');
      }

      const query = `
        SELECT twin_id, entity_type, entity_id, name, 
               location, status, created_at, last_synced
        FROM digital_twins
        WHERE owner_id = $1
        ORDER BY created_at DESC
      `;

      let result = await db.query(query, [farmerId]);
      
      const twins = await Promise.all(
        result.rows.map(async (twin) => ({
          ...twin,
          currentState: digitalTwinService.activeTwins.get(twin.twin_id) || null
        }))
      );

      return apiResponseHandler.sendSuccess(res, {
        farmerId,
        twinCount: twins.length,
        twins
      }, 'Farmer digital twins retrieved');
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to get farmer digital twins', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * GET /api/digital-twin/system/status
 * Get digital twin system status
 */
router.get('/system/status',
  authorize(['admin', 'analyst']),
  async (req, res) => {
    try {
      const systemStatus = {
        activeTwins: digitalTwinService.getActiveTwinsCount(),
        simulationInterval: digitalTwinService.simulationInterval,
        systemHealth: 'operational',
        timestamp: new Date().toISOString()
      };

      return apiResponseHandler.sendSuccess(res, systemStatus, 'Digital twin system status retrieved');
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to get system status', 500, 'SERVER_ERROR', error.message);
    }
  }
);

module.exports = router;