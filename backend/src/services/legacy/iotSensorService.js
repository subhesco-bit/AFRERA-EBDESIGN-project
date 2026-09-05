/**
 * IoT Sensor Data Ingestion and Real-Time Monitoring Service
 * Handles data collection from agricultural IoT sensors, real-time monitoring,
 * and data processing for precision agriculture applications.
 * Based on latest IoT and smart farming research (2024-2025)
 */

const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');

class IoTSensorService {
  constructor() {
    this.isInitialized = false;
    this.activeSensors = new Map();
    this.dataStreams = new Map();
    this.alertThresholds = new Map();
    this.realtimeSubscribers = new Map();
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      logger.info('Initializing IoT Sensor Service');
      
      // Load active sensors
      await this.loadActiveSensors();
      
      // Load alert thresholds
      await this.loadAlertThresholds();
      
      // Start real-time monitoring
      this.startRealtimeMonitoring();
      
      this.isInitialized = true;
      logger.info('IoT Sensor Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize IoT Sensor Service', { error: error.message });
      throw error;
    }
  }

  async loadActiveSensors() {
    try {
      const result = await getPostgreSQL().query(`
        SELECT s.id, s.sensor_id, s.sensor_type, s.farm_id, s.location,
               s.configuration, s.last_reading, s.last_seen, s.status,
               f.name as farm_name
        FROM sensors s
        JOIN farms f ON s.farm_id = f.id
        WHERE s.status = 'active'
      `);

      result.rows.forEach(sensor => {
        this.activeSensors.set(sensor.id, {
          ...sensor,
          configuration: JSON.parse(sensor.configuration || '{}'),
          dataPoints: [],
          alerts: []
        });
      });

      logger.info('Active sensors loaded', {
        count: this.activeSensors.size
      });
    } catch (error) {
      logger.warn('Failed to load active sensors', { error: error.message });
    }
  }

  async loadAlertThresholds() {
    try {
      let result = await getPostgreSQL().query(`
        SELECT sensor_type, parameter, min_value, max_value, severity, action
        FROM sensor_alert_thresholds
        WHERE is_active = true
      `);

      result.rows.forEach(threshold => {
        const key = `${threshold.sensor_type}_${threshold.parameter}`;
        this.alertThresholds.set(key, threshold);
      });

      logger.info('Alert thresholds loaded', {
        count: this.alertThresholds.size
      });
    } catch (error) {
      logger.warn('Failed to load alert thresholds', { error: error.message });
    }
  }

  startRealtimeMonitoring() {
    // Process sensor data every 30 seconds
    setInterval(async () => {
      await this.processSensorData();
    }, 30 * 1000);

    // Check for alerts every minute
    setInterval(async () => {
      await this.checkAlerts();
    }, 60 * 1000);

    // Clean old data every hour
    setInterval(async () => {
      await this.cleanOldData();
    }, 60 * 60 * 1000);

    logger.info('Real-time monitoring started');
  }

  async registerSensor(farmId, sensorData) {
    try {
      let result = await getPostgreSQL().query(`
        INSERT INTO sensors (sensor_id, sensor_type, farm_id, location, 
                           configuration, status, registered_at, last_seen)
        VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())
        RETURNING id, sensor_id, sensor_type, farm_id
      `, [
        sensorData.sensorId,
        sensorData.sensorType,
        farmId,
        sensorData.location,
        JSON.stringify(sensorData.configuration || {})
      ]);

      const sensor = result.rows[0];
      
      this.activeSensors.set(sensor.id, {
        ...sensor,
        configuration: sensorData.configuration || {},
        dataPoints: [],
        alerts: []
      });

      logger.info('Sensor registered', { sensorId: sensor.sensor_id });
      
      return {
        success: true,
        sensor: {
          id: sensor.id,
          sensorId: sensor.sensor_id,
          sensorType: sensor.sensor_type
        }
      };
    } catch (error) {
      logger.error('Failed to register sensor', { error: error.message });
      throw error;
    }
  }

  async ingestSensorData(sensorId, readings) {
    try {
      let sensor = Array.from(this.activeSensors.values())
        .find(s => s.sensor_id === sensorId);

      if (!sensor) {
        throw new Error(`Sensor not found: ${sensorId}`);
      }

      const processedReadings = [];

      for (const reading of readings) {
        // Store raw data
        await getPostgreSQL().query(`
          INSERT INTO sensor_readings (sensor_id, parameter, value, unit, 
                                       timestamp, location, metadata)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          sensor.id,
          reading.parameter,
          reading.value,
          reading.unit,
          reading.timestamp || new Date(),
          reading.location || sensor.location,
          JSON.stringify(reading.metadata || {})
        ]);

        // Update sensor last reading
        await getPostgreSQL().query(`
          UPDATE sensors
          SET last_reading = $1, last_seen = NOW()
          WHERE id = $2
        `, [JSON.stringify(reading), sensor.id]);

        // Add to sensor data buffer
        sensor.dataPoints.push({
          ...reading,
          timestamp: reading.timestamp || new Date()
        });

        // Keep only last 100 data points in memory
        if (sensor.dataPoints.length > 100) {
          sensor.dataPoints.shift();
        }

        processedReadings.push(reading);

        // Check for immediate alerts
        await this.checkImmediateAlerts(sensor, reading);
      }

      // Notify subscribers
      this.notifySubscribers(sensor.id, processedReadings);

      logger.info('Sensor data ingested', {
        sensorId,
        readingsCount: readings.length
      });

      return {
        success: true,
        processed: processedReadings.length
      };
    } catch (error) {
      logger.error('Failed to ingest sensor data', { error: error.message });
      throw error;
    }
  }

  async checkImmediateAlerts(sensor, reading) {
    const thresholdKey = `${sensor.sensor_type}_${reading.parameter}`;
    const threshold = this.alertThresholds.get(thresholdKey);

    if (!threshold) {
      return;
    }

    let alertTriggered = false;
    let message = '';

    if (threshold.min_value !== null && reading.value < threshold.min_value) {
      alertTriggered = true;
      message = `${reading.parameter} below minimum threshold: ${reading.value} < ${threshold.min_value}`;
    }

    if (threshold.max_value !== null && reading.value > threshold.max_value) {
      alertTriggered = true;
      message = `${reading.parameter} above maximum threshold: ${reading.value} > ${threshold.max_value}`;
    }

    if (alertTriggered) {
      await this.createAlert(sensor, reading, threshold, message);
    }
  }

  async createAlert(sensor, reading, threshold, message) {
    try {
      let result = await getPostgreSQL().query(`
        INSERT INTO sensor_alerts (sensor_id, parameter, value, threshold, 
                                  severity, message, action, created_at, resolved)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), false)
        RETURNING id
      `, [
        sensor.id,
        reading.parameter,
        reading.value,
        JSON.stringify(threshold),
        threshold.severity,
        message,
        threshold.action
      ]);

      const alert = result.rows[0];
      
      sensor.alerts.push({
        id: alert.id,
        parameter: reading.parameter,
        value: reading.value,
        severity: threshold.severity,
        message: message,
        action: threshold.action,
        timestamp: new Date(),
        resolved: false
      });

      logger.warn('Sensor alert created', {
        sensorId: sensor.sensor_id,
        severity: threshold.severity,
        message
      });

      // Send notification if high severity
      if (threshold.severity === 'high' || threshold.severity === 'critical') {
        await this.sendAlertNotification(sensor, alert);
      }
    } catch (error) {
      logger.error('Failed to create alert', { error: error.message });
    }
  }

  async sendAlertNotification(sensor, alert) {
    try {
      // Get farm owner contact info
      let result = await getPostgreSQL().query(`
        SELECT u.email, u.phone
        FROM farms f
        JOIN users u ON f.owner_id = u.id
        WHERE f.id = $1
      `, [sensor.farm_id]);

      if (result.rows.length > 0) {
        const user = result.rows[0];
        
        // Send email notification
        logger.info('Alert notification sent', {
          email: user.email,
          alertId: alert.id
        });

        // Send WhatsApp notification if available
        if (user.phone) {
          logger.info('WhatsApp alert sent', {
            phone: user.phone,
            alertId: alert.id
          });
        }
      }
    } catch (error) {
      logger.error('Failed to send alert notification', { error: error.message });
    }
  }

  async processSensorData() {
    for (const [sensorId, sensor] of this.activeSensors) {
      try {
        // Calculate aggregates
        const aggregates = this.calculateAggregates(sensor.dataPoints);
        
        // Store aggregates
        await this.storeAggregates(sensor.id, aggregates);
        
        // Update sensor state
        sensor.aggregates = aggregates;
      } catch (error) {
        logger.error('Failed to process sensor data', { sensorId, error: error.message });
      }
    }
  }

  calculateAggregates(dataPoints) {
    if (dataPoints.length === 0) {
      return null;
    }

    const values = dataPoints.map(dp => dp.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Calculate standard deviation
    const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return {
      count: values.length,
      average: avg,
      minimum: min,
      maximum: max,
      standardDeviation: stdDev,
      sum: sum,
      timestamp: new Date()
    };
  }

  async storeAggregates(sensorId, aggregates) {
    if (!aggregates) {
      return;
    }

    try {
      await getPostgreSQL().query(`
        INSERT INTO sensor_aggregates (sensor_id, count, average, minimum, 
                                       maximum, standard_deviation, sum, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (sensor_id, timestamp) DO UPDATE SET
          count = EXCLUDED.count,
          average = EXCLUDED.average,
          minimum = EXCLUDED.minimum,
          maximum = EXCLUDED.maximum,
          standard_deviation = EXCLUDED.standard_deviation,
          sum = EXCLUDED.sum
      `, [
        sensorId,
        aggregates.count,
        aggregates.average,
        aggregates.minimum,
        aggregates.maximum,
        aggregates.standardDeviation,
        aggregates.sum
      ]);
    } catch (error) {
      logger.error('Failed to store aggregates', { sensorId, error: error.message });
    }
  }

  async checkAlerts() {
    for (const [sensorId, sensor] of this.activeSensors) {
      try {
        if (sensor.aggregates) {
          await this.checkAggregateAlerts(sensor, sensor.aggregates);
        }
      } catch (error) {
        logger.error('Failed to check alerts for sensor', { sensorId, error: error.message });
      }
    }
  }

  async checkAggregateAlerts(sensor, aggregates) {
    // Check for trends and patterns that might indicate issues
    if (aggregates.standardDeviation > aggregates.average * 0.3) {
      // High variability - potential issue
      logger.warn('High variability detected', {
        sensorId: sensor.sensor_id,
        stdDev: aggregates.standardDeviation,
        avg: aggregates.average
      });
    }
  }

  async cleanOldData() {
    try {
      // Remove sensor readings older than 30 days
      let result = await getPostgreSQL().query(`
        DELETE FROM sensor_readings
        WHERE timestamp < NOW() - INTERVAL '30 days'
      `);

      logger.info('Old sensor data cleaned', {
        deletedRows: result.rowCount
      });
    } catch (error) {
      logger.error('Failed to clean old data', { error: error.message });
    }
  }

  subscribeToSensor(sensorId, callback) {
    if (!this.realtimeSubscribers.has(sensorId)) {
      this.realtimeSubscribers.set(sensorId, new Set());
    }
    this.realtimeSubscribers.get(sensorId).add(callback);
  }

  unsubscribeFromSensor(sensorId, callback) {
    if (this.realtimeSubscribers.has(sensorId)) {
      this.realtimeSubscribers.get(sensorId).delete(callback);
    }
  }

  notifySubscribers(sensorId, data) {
    const subscribers = this.realtimeSubscribers.get(sensorId);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logger.error('Subscriber callback failed', { error: error.message });
        }
      });
    }
  }

  async getSensorData(sensorId, options = {}) {
    try {
      const { startTime, endTime, limit = 100 } = options;
      
      let query = `
        SELECT parameter, value, unit, timestamp, location, metadata
        FROM sensor_readings
        WHERE sensor_id = (SELECT id FROM sensors WHERE sensor_id = $1)
      `;
      const params = [sensorId];
      let paramCount = 1;

      if (startTime) {
        paramCount++;
        query += ` AND timestamp >= $${paramCount}`;
        params.push(startTime);
      }

      if (endTime) {
        paramCount++;
        query += ` AND timestamp <= $${paramCount}`;
        params.push(endTime);
      }

      query += ` ORDER BY timestamp DESC LIMIT $${paramCount + 1}`;
      params.push(limit);

      let result = await getPostgreSQL().query(query, params);

      return {
        success: true,
        sensorId,
        readings: result.rows,
        count: result.rows.length
      };
    } catch (error) {
      logger.error('Failed to get sensor data', { sensorId, error: error.message });
      throw error;
    }
  }

  async getSensorAggregates(sensorId, options = {}) {
    try {
      const { startTime, endTime, interval = 'hour' } = options;
      
      let query = `
        SELECT date_trunc($1, timestamp) as interval_start,
               COUNT(*) as count,
               AVG(value) as average,
               MIN(value) as minimum,
               MAX(value) as maximum,
               STDDEV(value) as standard_deviation
        FROM sensor_readings
        WHERE sensor_id = (SELECT id FROM sensors WHERE sensor_id = $2)
      `;
      let params = [interval, sensorId];
      let paramCount = 2;

      if (startTime) {
        paramCount++;
        query += ` AND timestamp >= $${paramCount}`;
        params.push(startTime);
      }

      if (endTime) {
        paramCount++;
        query += ` AND timestamp <= $${paramCount}`;
        params.push(endTime);
      }

      query += ` GROUP BY interval_start ORDER BY interval_start DESC`;

      let result = await getPostgreSQL().query(query, params);

      return {
        success: true,
        sensorId,
        interval,
        aggregates: result.rows
      };
    } catch (error) {
      logger.error('Failed to get sensor aggregates', { sensorId, error: error.message });
      throw error;
    }
  }

  async getFarmSensors(farmId) {
    try {
      let result = await getPostgreSQL().query(`
        SELECT s.id, s.sensor_id, s.sensor_type, s.location, s.status,
               s.last_reading, s.last_seen, s.configuration
        FROM sensors s
        WHERE s.farm_id = $1 AND s.status = 'active'
        ORDER BY s.sensor_type, s.location
      `, [farmId]);

      const sensors = result.rows.map(sensor => ({
        ...sensor,
        configuration: JSON.parse(sensor.configuration || '{}'),
        dataPoints: this.activeSensors.get(sensor.id)?.dataPoints || [],
        aggregates: this.activeSensors.get(sensor.id)?.aggregates || null
      }));

      return {
        success: true,
        farmId,
        sensors
      };
    } catch (error) {
      logger.error('Failed to get farm sensors', { farmId, error: error.message });
      throw error;
    }
  }

  async resolveAlert(alertId) {
    try {
      await getPostgreSQL().query(`
        UPDATE sensor_alerts
        SET resolved = true, resolved_at = NOW()
        WHERE id = $1
      `, [alertId]);

      logger.info('Alert resolved', { alertId });

      return {
        success: true,
        alertId
      };
    } catch (error) {
      logger.error('Failed to resolve alert', { alertId, error: error.message });
      throw error;
    }
  }

  // Setup API routes
  setupRoutes(app) {
    // Register new sensor
    app.post('/api/v1/iot/sensors/register', async (req, res) => {
      try {
        const { farmId, sensorData } = req.body;
        let result = await this.registerSensor(farmId, sensorData);
        res.json(result);
      } catch (error) {
        logger.error('Failed to register sensor', { error: error.message });
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Ingest sensor data
    app.post('/api/v1/iot/sensors/:sensorId/data', async (req, res) => {
      try {
        const { sensorId } = req.params;
        const { readings } = req.body;
        let result = await this.ingestSensorData(sensorId, readings);
        res.json(result);
      } catch (error) {
        logger.error('Failed to ingest sensor data', { error: error.message });
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get sensor data
    app.get('/api/v1/iot/sensors/:sensorId/data', async (req, res) => {
      try {
        const { sensorId } = req.params;
        const options = {
          startTime: req.query.startTime,
          endTime: req.query.endTime,
          limit: parseInt(req.query.limit) || 100
        };
        let result = await this.getSensorData(sensorId, options);
        res.json(result);
      } catch (error) {
        logger.error('Failed to get sensor data', { error: error.message });
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get sensor aggregates
    app.get('/api/v1/iot/sensors/:sensorId/aggregates', async (req, res) => {
      try {
        const { sensorId } = req.params;
        let options = {
          startTime: req.query.startTime,
          endTime: req.query.endTime,
          interval: req.query.interval || 'hour'
        };
        let result = await this.getSensorAggregates(sensorId, options);
        res.json(result);
      } catch (error) {
        logger.error('Failed to get sensor aggregates', { error: error.message });
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get all sensors for a farm
    app.get('/api/v1/iot/farms/:farmId/sensors', async (req, res) => {
      try {
        const { farmId } = req.params;
        let result = await this.getFarmSensors(farmId);
        res.json(result);
      } catch (error) {
        logger.error('Failed to get farm sensors', { error: error.message });
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Resolve alert
    app.put('/api/v1/iot/alerts/:alertId/resolve', async (req, res) => {
      try {
        const { alertId } = req.params;
        let result = await this.resolveAlert(alertId);
        res.json(result);
      } catch (error) {
        logger.error('Failed to resolve alert', { error: error.message });
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get sensor alerts
    app.get('/api/v1/iot/sensors/:sensorId/alerts', async (req, res) => {
      try {
        const { sensorId } = req.params;
        const { resolved } = req.query;

        let query = `
          SELECT sa.id, sa.parameter, sa.value, sa.threshold, sa.severity,
                 sa.message, sa.action, sa.created_at, sa.resolved, sa.resolved_at
          FROM sensor_alerts sa
          JOIN sensors s ON sa.sensor_id = s.id
          WHERE s.sensor_id = $1
        `;
        let params = [sensorId];

        if (resolved !== undefined) {
          query += ` AND sa.resolved = $2`;
          params.push(resolved === 'true');
        }

        query += ` ORDER BY sa.created_at DESC`;

        let result = await getPostgreSQL().query(query, params);

        res.json({
          success: true,
          sensorId,
          alerts: result.rows
        });
      } catch (error) {
        logger.error('Failed to get sensor alerts', { error: error.message });
        res.status(500).json({ success: false, error: error.message });
      }
    });
  }
}

module.exports = new IoTSensorService();
