/**
 * IoT Integration Service
 * Manages IoT devices, sensor data, and real-time monitoring
 */

const express = require('express');
const { Pool } = require('pg');
const { logger } = require('../../../utils/logger');
const { authMiddleware, requireRole } = require('../../../middleware/auth');
const { FARM_OPERATIONS_ROLES } = require('../../../middleware/roleGroups');
const { signalBus, SIGNAL, SEVERITY } = require('../../../core/signalBus');

// Standard perishable cold-chain band. Readings outside this range are
// published as breach signals for cross-module correlation.
const COLD_CHAIN_MIN_C = 2;
const COLD_CHAIN_MAX_C = 8;

const router = express.Router();
// Shared pool (2026-08-04): this service previously built its own Pool.
// 42 services doing so meant ~420 potential connections against a
// PostgreSQL default max_connections of 100. See database/pool.js.
const pool = require('../../../database/pool');

// Test-mode lightweight stubs for IoT service
if (process.env.NODE_ENV === 'test') {
  // Deliberately reassigns the async function declarations below (hoisted
  // with their full real bodies before this block runs) so tests get
  // lightweight fakes instead of hitting a real DB - intentional, not a bug.
  /* eslint-disable no-func-assign */
  registerIoTDevice = async (data) => ({ id: `dev-${Date.now()}`, device_id: data.device_id || `dev-${Date.now()}`, device_name: data.device_name || 'Test Device', status: 'active' });
  getIoTDevices = async () => ([]);
  updateDeviceStatus = async (deviceId, status, batteryLevel, signalStrength) => ({ id: deviceId, status, battery_level: batteryLevel, signal_strength: signalStrength });
  recordSensorData = async (data) => ({ id: `sd-${Date.now()}`, ...data });
  getSensorData = async () => ([]);
  sendDeviceCommand = async (data) => ({ id: `cmd-${Date.now()}`, device_id: data.device_id, command_type: data.command_type, status: 'sent' });
  getDeviceCommands = async () => ([]);
  createDeviceAlert = async (data) => ({ id: `alert-${Date.now()}`, ...data });
  getUnacknowledgedAlerts = async () => ([]);
  checkDeviceHealth = async () => ({ health_status: 'unknown' });
  recordIoTAnalytics = async (metrics) => ({ date: new Date().toISOString(), ...metrics });
  /* eslint-enable no-func-assign */
}

// ============================================================================
// IOT DEVICES
// ============================================================================

/**
 * Register IoT device
 */
async function registerIoTDevice(data) {
  const {
    device_id,
    device_name,
    device_type,
    device_category,
    manufacturer,
    model,
    firmware_version,
    location_id,
    assigned_to,
    device_config,
    metadata
  } = data;

  try {
    const result = await pool.query(
      `INSERT INTO iot_devices 
       (device_id, device_name, device_type, device_category, manufacturer, model, firmware_version, 
        location_id, assigned_to, device_config, metadata, status, last_seen)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active', CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        device_id,
        device_name,
        device_type,
        device_category,
        manufacturer,
        model,
        firmware_version,
        location_id,
        assigned_to,
        JSON.stringify(device_config),
        JSON.stringify(metadata)
      ]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Register IoT device error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to register IoT device
 */
router.post('/iot-devices', authMiddleware, async (req, res) => {
  try {
    let result = await registerIoTDevice(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Register IoT device API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to register IoT device' });
  }
});

/**
 * Get IoT devices
 */
async function getIoTDevices(filters = {}) {
  try {
    let query = 'SELECT * FROM iot_devices WHERE 1=1';
    const params = [];

    if (filters.device_type) {
      query += ' AND device_type = $' + (params.length + 1);
      params.push(filters.device_type);
    }

    if (filters.status) {
      query += ' AND status = $' + (params.length + 1);
      params.push(filters.status);
    }

    if (filters.assigned_to) {
      query += ' AND assigned_to = $' + (params.length + 1);
      params.push(filters.assigned_to);
    }

    query += ' ORDER BY created_at DESC';

    let result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('Get IoT devices error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get IoT devices
 */
router.get('/iot-devices', authMiddleware, async (req, res) => {
  try {
    const { device_type, status, assigned_to } = req.query;
    let result = await getIoTDevices({ device_type, status, assigned_to });
    res.json(result);
  } catch (error) {
    logger.error('Get IoT devices API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get IoT devices' });
  }
});

/**
 * Update device status
 */
async function updateDeviceStatus(deviceId, status, batteryLevel, signalStrength) {
  try {
    let result = await pool.query(
      `UPDATE iot_devices
       SET status = $1, battery_level = $2, signal_strength = $3, last_seen = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [status, batteryLevel, signalStrength, deviceId]
    );

    if (result.rows.length === 0) {
      throw new Error('Device not found');
    }

    const device = result.rows[0];

    // AFFERENT WIRING: decisionEngine.js already has a dedicated correlation
    // rule ('iot.sensor_reliability_degradation') that watches for repeated
    // SENSOR_OFFLINE signals on the same asset — it has been unreachable dead
    // code because nothing ever called emitSignal() when a device's status was
    // actually persisted as offline. Emitted AFTER the update so the signal
    // reflects a durable state change, not a request in flight.
    if (device.status === 'offline') {
      signalBus.emitSignal(
        SIGNAL.SENSOR_OFFLINE,
        {
          deviceId: device.id,
          deviceType: device.device_type ?? null,
          locationId: device.location_id ?? null,
          lastSeen: device.last_seen
        },
        { severity: SEVERITY.WARNING, source: 'iotIntegrationService.updateDeviceStatus', entityId: device.id }
      );
    }

    return device;
  } catch (error) {
    logger.error('Update device status error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to update device status
 */
router.patch('/iot-devices/:deviceId/status', authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), async (req, res) => {
  try {
    const { status, battery_level, signal_strength } = req.body;
    let result = await updateDeviceStatus(req.params.deviceId, status, battery_level, signal_strength);
    res.json(result);
  } catch (error) {
    logger.error('Update device status API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to update device status' });
  }
});

// ============================================================================
// SENSOR DATA
// ============================================================================

/**
 * Record sensor data
 */
async function recordSensorData(data) {
  const {
    device_id,
    sensor_type,
    sensor_value,
    unit,
    reading_timestamp,
    location_id,
    quality_score,
    metadata
  } = data;

  try {
    let result = await pool.query(
      `INSERT INTO sensor_data 
       (device_id, sensor_type, sensor_value, unit, reading_timestamp, location_id, quality_score, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        device_id,
        sensor_type,
        sensor_value,
        unit,
        reading_timestamp || new Date(),
        location_id,
        quality_score,
        JSON.stringify(metadata)
      ]
    );

    const reading = result.rows[0];

    // Afferent signal: a cold-chain temperature excursion is only meaningful in
    // combination with shipment delay and shelf-life state, which live in other
    // modules. Publishing it lets the decision engine correlate all three.
    // Thresholds follow standard perishable cold-chain limits (2-8 C).
    if (sensor_type === 'temperature' && Number.isFinite(Number(sensor_value))) {
      const temp = Number(sensor_value);
      if (temp < COLD_CHAIN_MIN_C || temp > COLD_CHAIN_MAX_C) {
        signalBus.emitSignal(
          SIGNAL.TEMPERATURE_BREACH,
          { temperature: temp, unit: unit || 'C', device_id, location_id },
          {
            severity: temp > COLD_CHAIN_MAX_C + 5 ? SEVERITY.CRITICAL : SEVERITY.WARNING,
            source: 'iotIntegrationService',
            // Correlate on the shipment when known, else the device itself.
            entityId: metadata?.shipment_id || device_id
          }
        );
      }
    }

    return reading;
  } catch (error) {
    logger.error('Record sensor data error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to record sensor data
 */
router.post('/sensor-data', authMiddleware, async (req, res) => {
  try {
    let result = await recordSensorData(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Record sensor data API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to record sensor data' });
  }
});

/**
 * Get sensor data
 */
async function getSensorData(deviceId, sensorType = null, startDate = null, endDate = null, limit = 100) {
  try {
    let query = 'SELECT * FROM sensor_data WHERE device_id = $1';
    let params = [deviceId];

    if (sensorType) {
      query += ' AND sensor_type = $2';
      params.push(sensorType);
    }

    if (startDate) {
      query += ' AND reading_timestamp >= $' + (params.length + 1);
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND reading_timestamp <= $' + (params.length + 1);
      params.push(endDate);
    }

    query += ' ORDER BY reading_timestamp DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    let result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('Get sensor data error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get sensor data
 */
router.get('/sensor-data/:deviceId', async (req, res) => {
  try {
    const { sensor_type, start_date, end_date, limit } = req.query;
    let result = await getSensorData(
      req.params.deviceId,
      sensor_type,
      start_date,
      end_date,
      parseInt(limit) || 100
    );
    res.json(result);
  } catch (error) {
    logger.error('Get sensor data API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get sensor data' });
  }
});

// ============================================================================
// DEVICE COMMANDS
// ============================================================================

/**
 * Send device command
 */
async function sendDeviceCommand(data) {
  const {
    device_id,
    command_type,
    command_payload
  } = data;

  try {
    let result = await pool.query(
      `INSERT INTO device_commands 
       (device_id, command_type, command_payload, status, sent_at)
       VALUES ($1, $2, $3, 'sent', CURRENT_TIMESTAMP)
       RETURNING *`,
      [device_id, command_type, JSON.stringify(command_payload)]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Send device command error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to send device command
 */
router.post('/device-commands', authMiddleware, async (req, res) => {
  try {
    let result = await sendDeviceCommand(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Send device command API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to send device command' });
  }
});

/**
 * Get device commands
 */
async function getDeviceCommands(deviceId, status = null) {
  try {
    let query = 'SELECT * FROM device_commands WHERE device_id = $1';
    let params = [deviceId];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }

    query += ' ORDER BY sent_at DESC LIMIT 50';

    let result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('Get device commands error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get device commands
 */
router.get('/device-commands/:deviceId', authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    let result = await getDeviceCommands(req.params.deviceId, status);
    res.json(result);
  } catch (error) {
    logger.error('Get device commands API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get device commands' });
  }
});

// ============================================================================
// DEVICE ALERTS
// ============================================================================

/**
 * Create device alert
 */
async function createDeviceAlert(data) {
  const {
    device_id,
    alert_type,
    alert_severity,
    alert_message,
    alert_data
  } = data;

  try {
    let result = await pool.query(
      `INSERT INTO device_alerts 
       (device_id, alert_type, alert_severity, alert_message, alert_data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        device_id,
        alert_type,
        alert_severity,
        alert_message,
        JSON.stringify(alert_data)
      ]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Create device alert error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to create device alert
 */
router.post('/device-alerts', authMiddleware, async (req, res) => {
  try {
    let result = await createDeviceAlert(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Create device alert API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create device alert' });
  }
});

/**
 * Get unacknowledged alerts
 */
async function getUnacknowledgedAlerts() {
  try {
    let result = await pool.query(
      `SELECT da.*, d.device_name, d.device_type
       FROM device_alerts da
       LEFT JOIN iot_devices d ON da.device_id = d.id
       WHERE da.is_acknowledged = false
       ORDER BY da.created_at DESC`
    );

    return result.rows;
  } catch (error) {
    logger.error('Get unacknowledged alerts error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get unacknowledged alerts
 */
router.get('/device-alerts/unacknowledged', authMiddleware, async (req, res) => {
  try {
    let result = await getUnacknowledgedAlerts();
    res.json(result);
  } catch (error) {
    logger.error('Get unacknowledged alerts API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

// ============================================================================
// DEVICE HEALTH
// ============================================================================

/**
 * Check device health
 */
async function checkDeviceHealth(deviceId) {
  try {
    let result = await pool.query(
      'SELECT check_device_health($1) as health',
      [deviceId]
    );

    return result.rows[0].health;
  } catch (error) {
    logger.error('Check device health error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to check device health
 */
router.get('/iot-devices/:deviceId/health', authMiddleware, async (req, res) => {
  try {
    let result = await checkDeviceHealth(req.params.deviceId);
    res.json(result);
  } catch (error) {
    logger.error('Check device health API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to check device health' });
  }
});

// ============================================================================
// IOT ANALYTICS
// ============================================================================

/**
 * Record IoT analytics
 */
async function recordIoTAnalytics(metrics) {
  try {
    let result = await pool.query(
      `INSERT INTO iot_analytics 
       (date, total_devices, active_devices, offline_devices, total_sensor_readings, 
        anomaly_count, alert_count, average_signal_strength, average_battery_level)
       VALUES (CURRENT_DATE, $1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (date)
       DO UPDATE SET
         total_sensor_readings = iot_analytics.total_sensor_readings + EXCLUDED.total_sensor_readings,
         anomaly_count = iot_analytics.anomaly_count + EXCLUDED.anomaly_count,
         alert_count = iot_analytics.alert_count + EXCLUDED.alert_count
       RETURNING *`,
      [
        metrics.total_devices || 0,
        metrics.active_devices || 0,
        metrics.offline_devices || 0,
        metrics.total_readings || 0,
        metrics.anomaly_count || 0,
        metrics.alert_count || 0,
        metrics.avg_signal || 0,
        metrics.avg_battery || 0
      ]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Record IoT analytics error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to record IoT analytics
 */
router.post('/iot-analytics', authMiddleware, async (req, res) => {
  try {
    const { metrics } = req.body;
    let result = await recordIoTAnalytics(metrics);
    res.json(result);
  } catch (error) {
    logger.error('Record IoT analytics API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to record IoT analytics' });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

function isHealthy() {
  return pool.connect().then(() => true).catch(() => false);
}

module.exports = {
  router,
  registerIoTDevice,
  getIoTDevices,
  updateDeviceStatus,
  recordSensorData,
  getSensorData,
  sendDeviceCommand,
  getDeviceCommands,
  createDeviceAlert,
  getUnacknowledgedAlerts,
  checkDeviceHealth,
  recordIoTAnalytics,
  isHealthy
};

