/**
 * M027: IoT Integration Service
 * Manages IoT device integration, data collection, and real-time monitoring
 * for agricultural operations
 */

const db = require('../database/connection');
const logger = require('../utils/logger');

class IoTIntegrationService {
  constructor() {
    this.serviceName = 'IoTIntegrationService';
    this.connectedDevices = new Map();
    this.dataBuffer = [];
    this.maxBufferSize = 1000;
  }

  /**
   * Register new IoT device
   */
  async registerDevice(deviceData) {
    try {
      const { 
        deviceId, 
        deviceType, 
        farmerId, 
        location, 
        specifications,
        firmwareVersion 
      } = deviceData;

      const query = `
        INSERT INTO iot_devices (
          device_id, device_type, farmer_id, location, 
          specifications, firmware_version, status, 
          registered_at, last_active
        ) VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW(), NOW())
        RETURNING id, device_id, status
      `;

      const result = await db.query(query, [
        deviceId, deviceType, farmerId, location, 
        JSON.stringify(specifications), firmwareVersion
      ]);

      // Add to connected devices
      this.connectedDevices.set(deviceId, {
        id: result.rows[0].id,
        deviceType,
        farmerId,
        connectedAt: new Date(),
        specifications
      });

      return {
        success: true,
        data: {
          deviceId: result.rows[0].device_id,
          status: result.rows[0].status,
          registeredAt: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error(`${this.serviceName} - registerDevice error:`, error);
      return {
        success: false,
        error: 'Failed to register IoT device',
        details: error.message
      };
    }
  }

  /**
   * Receive data from IoT device
   */
  async receiveDeviceData(deviceId, sensorData) {
    try {
      // Validate device is registered
      const device = await this.getDeviceByDeviceId(deviceId);
      if (!device) {
        return {
          success: false,
          error: 'Device not registered',
          deviceId
        };
      }

      // Process sensor data
      const processedData = this.processSensorData(sensorData, device);
      
      // Store in buffer for batch processing
      this.dataBuffer.push({
        deviceId,
        data: processedData,
        timestamp: new Date()
      });

      // Process buffer if full
      if (this.dataBuffer.length >= this.maxBufferSize) {
        await this.processDataBuffer();
      }

      // Update device last active time
      await this.updateDeviceActivity(deviceId);

      // Trigger alerts if thresholds exceeded
      const alerts = this.checkThresholds(processedData, device.specifications);

      return {
        success: true,
        data: {
          receivedAt: new Date().toISOString(),
          dataPoints: processedData.length,
          alerts: alerts
        }
      };
    } catch (error) {
      logger.error(`${this.serviceName} - receiveDeviceData error:`, error);
      return {
        success: false,
        error: 'Failed to receive device data',
        details: error.message
      };
    }
  }

  /**
   * Get device by device ID
   */
  async getDeviceByDeviceId(deviceId) {
    const query = `
      SELECT id, device_id, device_type, farmer_id, 
             specifications, status, last_active
      FROM iot_devices
      WHERE device_id = $1 AND status = 'active'
    `;

    const result = await db.query(query, [deviceId]);
    return result.rows[0];
  }

  /**
   * Process sensor data
   */
  processSensorData(sensorData, device) {
    const processed = [];
    
    for (const reading of sensorData) {
      processed.push({
        sensorType: reading.sensorType,
        value: reading.value,
        unit: reading.unit,
        timestamp: reading.timestamp || new Date(),
        quality: this.assessDataQuality(reading),
        metadata: reading.metadata || {}
      });
    }
    
    return processed;
  }

  /**
   * Assess data quality
   */
  assessDataQuality(reading) {
    const { value, sensorType } = reading;
    
    // Basic quality checks
    if (value === null || value === undefined) return 'invalid';
    if (typeof value !== 'number') return 'invalid';
    
    // Range checks based on sensor type
    const ranges = {
      'temperature': { min: -20, max: 50 },
      'humidity': { min: 0, max: 100 },
      'soil_moisture': { min: 0, max: 100 },
      'ph_level': { min: 0, max: 14 },
      'light_intensity': { min: 0, max: 100000 }
    };
    
    const range = ranges[sensorType];
    if (range && (value < range.min || value > range.max)) {
      return 'out_of_range';
    }
    
    return 'good';
  }

  /**
   * Check thresholds and generate alerts
   */
  checkThresholds(processedData, specifications) {
    const alerts = [];
    
    if (!specifications || !specifications.thresholds) {
      return alerts;
    }
    
    for (const reading of processedData) {
      const threshold = specifications.thresholds[reading.sensorType];
      if (!threshold) continue;
      
      if (threshold.min !== undefined && threshold.min !== null && reading.value < threshold.min) {
        alerts.push({
          type: 'threshold_low',
          sensorType: reading.sensorType,
          value: reading.value,
          threshold: threshold.min,
          severity: 'warning',
          message: `${reading.sensorType} below minimum threshold`
        });
      }
      
      if (threshold.max !== undefined && threshold.max !== null && reading.value > threshold.max) {
        alerts.push({
          type: 'threshold_high',
          sensorType: reading.sensorType,
          value: reading.value,
          threshold: threshold.max,
          severity: 'warning',
          message: `${reading.sensorType} above maximum threshold`
        });
      }
    }
    
    return alerts;
  }

  /**
   * Process data buffer (batch insert)
   */
  async processDataBuffer() {
    if (this.dataBuffer.length === 0) return;
    
    try {
      const query = `
        INSERT INTO iot_sensor_data (
          device_id, sensor_type, value, unit, 
          quality, metadata, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      
      for (const entry of this.dataBuffer) {
        for (const reading of entry.data) {
          await db.query(query, [
            entry.deviceId,
            reading.sensorType,
            reading.value,
            reading.unit,
            reading.quality,
            JSON.stringify(reading.metadata),
            reading.timestamp
          ]);
        }
      }
      
      const processedCount = this.dataBuffer.length;
      this.dataBuffer = [];
      logger.info(`Processed ${processedCount} IoT data entries`);
    } catch (error) {
      logger.error(`${this.serviceName} - processDataBuffer error:`, error);
    }
  }

  /**
   * Update device activity
   */
  async updateDeviceActivity(deviceId) {
    const query = `
      UPDATE iot_devices 
      SET last_active = NOW()
      WHERE device_id = $1
    `;
    
    await db.query(query, [deviceId]);
  }

  /**
   * Get device status
   */
  async getDeviceStatus(deviceId) {
    try {
      const device = await this.getDeviceByDeviceId(deviceId);
      if (!device) {
        return {
          success: false,
          error: 'Device not found',
          deviceId
        };
      }

      const recentData = await this.getRecentDeviceData(deviceId, 24);
      const healthStatus = this.assessDeviceHealth(device, recentData);

      return {
        success: true,
        data: {
          deviceId,
          deviceType: device.device_type,
          status: device.status,
          lastActive: device.last_active,
          healthStatus,
          recentDataPoints: recentData.length,
          connectedAt: device.registered_at
        }
      };
    } catch (error) {
      logger.error(`${this.serviceName} - getDeviceStatus error:`, error);
      return {
        success: false,
        error: 'Failed to get device status',
        details: error.message
      };
    }
  }

  /**
   * Get recent device data
   */
  async getRecentDeviceData(deviceId, hours) {
    const query = `
      SELECT sensor_type, value, unit, quality, timestamp
      FROM iot_sensor_data
      WHERE device_id = $1
        AND timestamp >= NOW() - INTERVAL '${hours} hours'
      ORDER BY timestamp DESC
      LIMIT 1000
    `;

    const result = await db.query(query, [deviceId]);
    return result.rows;
  }

  /**
   * Assess device health
   */
  assessDeviceHealth(device, recentData) {
    const lastActive = new Date(device.last_active);
    const timeSinceActive = Date.now() - lastActive.getTime();
    
    let health = 'healthy';
    if (timeSinceActive > 24 * 60 * 60 * 1000) health = 'inactive';
    if (timeSinceActive > 7 * 24 * 60 * 60 * 1000) health = 'offline';
    
    // Check data quality
    if (recentData.length > 0) {
      const goodQualityCount = recentData.filter(d => d.quality === 'good').length;
      const qualityRatio = goodQualityCount / recentData.length;
      
      if (qualityRatio < 0.7) health = 'degraded';
    }
    
    return health;
  }

  /**
   * Get devices by farmer
   */
  async getFarmerDevices(farmerId) {
    try {
      const query = `
        SELECT id, device_id, device_type, location, 
               specifications, status, last_active, registered_at
        FROM iot_devices
        WHERE farmer_id = $1
        ORDER BY registered_at DESC
      `;

      const result = await db.query(query, [farmerId]);
      
      const devices = await Promise.all(
        result.rows.map(async (device) => {
          const recentData = await this.getRecentDeviceData(device.device_id, 24);
          return {
            ...device,
            recentDataPoints: recentData.length,
            healthStatus: this.assessDeviceHealth(device, recentData)
          };
        })
      );

      return {
        success: true,
        data: {
          farmerId,
          deviceCount: devices.length,
          devices
        }
      };
    } catch (error) {
      logger.error(`${this.serviceName} - getFarmerDevices error:`, error);
      return {
        success: false,
        error: 'Failed to get farmer devices',
        details: error.message
      };
    }
  }

  /**
   * Configure device
   */
  async configureDevice(deviceId, configuration) {
    try {
      const device = await this.getDeviceByDeviceId(deviceId);
      if (!device) {
        return {
          success: false,
          error: 'Device not found',
          deviceId
        };
      }

      const query = `
        UPDATE iot_devices
        SET specifications = $1,
            updated_at = NOW()
        WHERE device_id = $2
        RETURNING device_id, specifications
      `;

      const result = await db.query(query, [
        JSON.stringify({ ...device.specifications, ...configuration }),
        deviceId
      ]);

      // Update connected device cache
      if (this.connectedDevices.has(deviceId)) {
        this.connectedDevices.set(deviceId, {
          ...this.connectedDevices.get(deviceId),
          specifications: { ...device.specifications, ...configuration }
        });
      }

      return {
        success: true,
        data: {
          deviceId: result.rows[0].device_id,
          configuration: result.rows[0].specifications,
          updatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error(`${this.serviceName} - configureDevice error:`, error);
      return {
        success: false,
        error: 'Failed to configure device',
        details: error.message
      };
    }
  }

  /**
   * Get aggregated sensor data
   */
  async getAggregatedData(farmerId, sensorType, timeRange = '24h') {
    try {
      const query = `
        SELECT 
          DATE_TRUNC('hour', timestamp) as hour,
          AVG(value) as avg_value,
          MIN(value) as min_value,
          MAX(value) as max_value,
          COUNT(*) as reading_count
        FROM iot_sensor_data isd
        JOIN iot_devices id ON isd.device_id = id.device_id
        WHERE id.farmer_id = $1
          AND isd.sensor_type = $2
          AND isd.timestamp >= NOW() - INTERVAL '${timeRange}'
        GROUP BY DATE_TRUNC('hour', timestamp)
        ORDER BY hour ASC
      `;

      const result = await db.query(query, [farmerId, sensorType]);

      return {
        success: true,
        data: {
          farmerId,
          sensorType,
          timeRange,
          aggregatedData: result.rows.map(row => ({
            hour: row.hour,
            averageValue: parseFloat(row.avg_value),
            minValue: parseFloat(row.min_value),
            maxValue: parseFloat(row.max_value),
            readingCount: row.reading_count
          }))
        }
      };
    } catch (error) {
      logger.error(`${this.serviceName} - getAggregatedData error:`, error);
      return {
        success: false,
        error: 'Failed to get aggregated data',
        details: error.message
      };
    }
  }

  /**
   * Force process data buffer
   */
  async forceProcessBuffer() {
    if (this.dataBuffer.length > 0) {
      await this.processDataBuffer();
      return {
        success: true,
        message: `Processed ${this.dataBuffer.length} buffered entries`
      };
    }
    return {
      success: true,
      message: 'No buffered data to process'
    };
  }

  /**
   * Get connected devices count
   */
  getConnectedDevicesCount() {
    return this.connectedDevices.size;
  }

  /**
   * Get buffer status
   */
  getBufferStatus() {
    return {
      bufferSize: this.dataBuffer.length,
      maxBufferSize: this.maxBufferSize,
      utilizationPercent: (this.dataBuffer.length / this.maxBufferSize) * 100
    };
  }
}

module.exports = new IoTIntegrationService();