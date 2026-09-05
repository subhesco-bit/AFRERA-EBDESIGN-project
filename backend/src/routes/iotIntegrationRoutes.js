/**
 * M027: IoT Integration Routes
 * Production-level API routes for IoT integration service
 */

const express = require('express');
const router = express.Router();
const iotService = require('../services/iotIntegrationService');
const apiResponseHandler = require('../middleware/apiResponseHandler');
// '../middleware/authMiddleware' does not exist in this repo - the real module is
// '../middleware/auth', exporting authMiddleware/requireRole, not authenticate/authorize.
const { authMiddleware: authenticate, requireRole } = require('../middleware/auth');
const authorize = (roles) => requireRole(...roles);
const { apiLimiter } = require('../middleware/rateLimiter');

// Apply authentication and rate limiting
router.use(authenticate);
router.use(apiLimiter);

/**
 * POST /api/iot/devices/register
 * Register new IoT device
 */
router.post('/devices/register',
  authorize(['farmer', 'admin']),
  async (req, res) => {
    try {
      const deviceData = req.body;
      const { farmerId } = deviceData;

      // Authorization check
      if (req.user.role === 'farmer' && req.user.id !== farmerId) {
        return apiResponseHandler.sendError(res, 'Unauthorized access', 403, 'FORBIDDEN');
      }

      const result = await iotService.registerDevice(deviceData);
      
      if (result.success) {
        return apiResponseHandler.sendSuccess(res, result.data, 'IoT device registered successfully');
      } else {
        return apiResponseHandler.sendError(res, result.error, 400, 'REGISTRATION_ERROR', result.details);
      }
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to register IoT device', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * POST /api/iot/devices/:deviceId/data
 * Receive data from IoT device
 */
router.post('/devices/:deviceId/data',
  authorize(['system', 'admin']), // Typically called by devices/system
  async (req, res) => {
    try {
      const { deviceId } = req.params;
      const { sensorData } = req.body;

      if (!sensorData || !Array.isArray(sensorData)) {
        return apiResponseHandler.sendError(res, 'Invalid sensor data format', 400, 'INVALID_DATA');
      }

      let result = await iotService.receiveDeviceData(deviceId, sensorData);
      
      if (result.success) {
        return apiResponseHandler.sendSuccess(res, result.data, 'Device data received successfully');
      } else {
        return apiResponseHandler.sendError(res, result.error, 400, 'DATA_RECEIPT_ERROR', result.details);
      }
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to receive device data', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * GET /api/iot/devices/:deviceId/status
 * Get device status
 */
router.get('/devices/:deviceId/status',
  authorize(['farmer', 'admin']),
  async (req, res) => {
    try {
      const { deviceId } = req.params;

      let result = await iotService.getDeviceStatus(deviceId);
      
      if (result.success) {
        return apiResponseHandler.sendSuccess(res, result.data, 'Device status retrieved');
      } else {
        return apiResponseHandler.sendError(res, result.error, 404, 'DEVICE_NOT_FOUND', result.deviceId);
      }
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to get device status', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * GET /api/iot/farmers/:farmerId/devices
 * Get devices by farmer
 */
router.get('/farmers/:farmerId/devices',
  authorize(['farmer', 'admin']),
  async (req, res) => {
    try {
      const { farmerId } = req.params;

      // Authorization check
      if (req.user.role === 'farmer' && req.user.id !== farmerId) {
        return apiResponseHandler.sendError(res, 'Unauthorized access', 403, 'FORBIDDEN');
      }

      let result = await iotService.getFarmerDevices(farmerId);
      
      if (result.success) {
        return apiResponseHandler.sendSuccess(res, result.data, 'Farmer devices retrieved');
      } else {
        return apiResponseHandler.sendError(res, result.error, 500, 'RETRIEVAL_ERROR', result.details);
      }
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to get farmer devices', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * PUT /api/iot/devices/:deviceId/configure
 * Configure device
 */
router.put('/devices/:deviceId/configure',
  authorize(['farmer', 'admin']),
  async (req, res) => {
    try {
      const { deviceId } = req.params;
      const configuration = req.body;

      let result = await iotService.configureDevice(deviceId, configuration);
      
      if (result.success) {
        return apiResponseHandler.sendSuccess(res, result.data, 'Device configured successfully');
      } else {
        return apiResponseHandler.sendError(res, result.error, 404, 'DEVICE_NOT_FOUND', result.deviceId);
      }
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to configure device', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * GET /api/iot/data/aggregated
 * Get aggregated sensor data
 */
router.get('/data/aggregated',
  authorize(['farmer', 'admin', 'analyst']),
  async (req, res) => {
    try {
      const { farmerId, sensorType, timeRange = '24h' } = req.query;

      if (!farmerId || !sensorType) {
        return apiResponseHandler.sendError(res, 'Missing required parameters', 400, 'MISSING_PARAMETER');
      }

      // Authorization check
      if (req.user.role === 'farmer' && req.user.id !== farmerId) {
        return apiResponseHandler.sendError(res, 'Unauthorized access', 403, 'FORBIDDEN');
      }

      let result = await iotService.getAggregatedData(farmerId, sensorType, timeRange);
      
      if (result.success) {
        return apiResponseHandler.sendSuccess(res, result.data, 'Aggregated data retrieved');
      } else {
        return apiResponseHandler.sendError(res, result.error, 500, 'RETRIEVAL_ERROR', result.details);
      }
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to get aggregated data', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * POST /api/iot/buffer/process
 * Force process data buffer
 */
router.post('/buffer/process',
  authorize(['admin']),
  async (req, res) => {
    try {
      let result = await iotService.forceProcessBuffer();
      return apiResponseHandler.sendSuccess(res, null, result.message);
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to process buffer', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * GET /api/iot/system/status
 * Get IoT system status
 */
router.get('/system/status',
  authorize(['admin', 'analyst']),
  async (req, res) => {
    try {
      const systemStatus = {
        connectedDevices: iotService.getConnectedDevicesCount(),
        bufferStatus: iotService.getBufferStatus(),
        systemHealth: 'operational',
        timestamp: new Date().toISOString()
      };

      return apiResponseHandler.sendSuccess(res, systemStatus, 'IoT system status retrieved');
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to get system status', 500, 'SERVER_ERROR', error.message);
    }
  }
);

module.exports = router;