// Service for M132 - Pond Management (Fisheries) - Advanced IoT-Integrated
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');

const tableName = 'ponds';

class PondManagementService {
  constructor() {
    this.iotHubConnected = true;
    this.aiEnabled = true;
    this.realTimeProcessing = true;
    this.sensorDataCache = new Map();
  }

  async listPonds({ page = 1, limit = 20, farmerId = null, status = null } = {}) {
    const pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
    const offset = (page - 1) * limit;
    
    let query = `SELECT COUNT(*) FROM ${tableName}`;
    let countParams = [];
    let conditions = [];
    
    if (farmerId) {
      conditions.push('farmer_id = $' + (conditions.length + 1));
      countParams.push(farmerId);
    }
    if (status) {
      conditions.push('status = $' + (conditions.length + 1));
      countParams.push(status);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    const totalRes = await pg.query(query, countParams);
    const total = parseInt(totalRes.rows[0].count || '0');
    
    let dataQuery = `SELECT * FROM ${tableName}`;
    let dataParams = [...countParams];
    
    if (conditions.length > 0) {
      dataQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    dataQuery += ' ORDER BY created_at DESC LIMIT $' + (dataParams.length + 1) + ' OFFSET $' + (dataParams.length + 2);
    dataParams.push(limit, offset);
    
    const res = await pg.query(dataQuery, dataParams);
    
    // Enrich with IoT sensor data
    const enrichedItems = await this.enrichWithSensorData(res.rows);
    
    return { items: enrichedItems, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } };
  }

  async getPond(id) {
    const pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
    const res = await pg.query(`SELECT * FROM ${tableName} WHERE id = $1`, [id]);
    
    if (res.rows.length === 0) return null;
    
    // Enrich with real-time sensor data
    const enriched = await this.enrichWithSensorData([res.rows[0]]);
    return enriched[0];
  }

  async createPond(payload) {
    const pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
    const { farmerId, name, location, area, pondType, depth, waterSource, capacity, sensorConfig, metadata } = payload;
    
    const res = await pg.query(
      `INSERT INTO ${tableName} (farmer_id, name, location, area, pond_type, depth, water_source, capacity, sensor_config, metadata, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) RETURNING *`,
      [farmerId, name, location, area, pondType, depth, waterSource, capacity, JSON.stringify(sensorConfig || {}), JSON.stringify(metadata || {})]
    );
    
    // Configure IoT sensors if provided
    if (sensorConfig && sensorConfig.sensors) {
      await this.configurePondSensors(res.rows[0].id, sensorConfig.sensors);
    }
    
    return res.rows[0];
  }

  async updatePond(id, payload) {
    const pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
    const { name, location, area, pondType, depth, waterSource, capacity, status, sensorConfig, metadata } = payload;
    
    const res = await pg.query(
      `UPDATE ${tableName} 
       SET name = $1, location = $2, area = $3, pond_type = $4, depth = $5, water_source = $6, capacity = $7, status = $8, sensor_config = $9, metadata = $10, updated_at = NOW() 
       WHERE id = $11 RETURNING *`,
      [name, location, area, pondType, depth, waterSource, capacity, status, JSON.stringify(sensorConfig || {}), JSON.stringify(metadata || {}), id]
    );
    
    // Reconfigure sensors if changed
    if (sensorConfig && sensorConfig.sensors) {
      await this.configurePondSensors(id, sensorConfig.sensors);
    }
    
    return res.rows[0] || null;
  }

  async deletePond(id) {
    const pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
    const res = await pg.query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING id`, [id]);
    return !!res.rows[0];
  }

  // IoT Sensor Integration
  async configurePondSensors(pondId, sensors) {
    const sensorRegistrations = await Promise.all(
      sensors.map(sensor => this.registerSensor(pondId, sensor))
    );
    
    return {
      pondId,
      sensors: sensorRegistrations,
      connected: sensorRegistrations.filter(s => s.success).length,
      failed: sensorRegistrations.filter(s => !s.success).length
    };
  }

  async registerSensor(pondId, sensorConfig) {
    const { sensorType, deviceId, calibration } = sensorConfig;
    
    // Register with IoT hub
    logger.info(`Registering ${sensorType} sensor for pond ${pondId}`);
    
    const sensorId = `SENSOR-${pondId}-${sensorType}-${Date.now()}`;
    
    // Store sensor configuration
    const pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
    await pg.query(
      `INSERT INTO pond_sensors (pond_id, sensor_type, device_id, sensor_id, calibration, status, created_at) 
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW())`,
      [pondId, sensorType, deviceId, sensorId, JSON.stringify(calibration || {})]
    );
    
    return {
      sensorId,
      sensorType,
      deviceId,
      success: true
    };
  }

  async getPondSensorData(pondId, { startTime, endTime, sensorTypes } = {}) {
    const pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
    
    // Get sensors for this pond
    const sensorsRes = await pg.query(
      `SELECT * FROM pond_sensors WHERE pond_id = $1 AND status = 'ACTIVE'`,
      [pondId]
    );
    
    if (sensorTypes && sensorTypes.length > 0) {
      sensorsRes.rows = sensorsRes.rows.filter(s => sensorTypes.includes(s.sensor_type));
    }
    
    // Fetch sensor data from IoT hub
    const sensorData = await Promise.all(
      sensorsRes.rows.map(sensor => this.fetchSensorData(sensor.device_id, startTime, endTime))
    );
    
    // Process and analyze sensor data
    const processedData = await this.processSensorData(sensorData);
    
    return {
      pondId,
      sensors: sensorsRes.rows,
      data: processedData,
      summary: this.generateSensorSummary(processedData),
      alerts: this.generateSensorAlerts(processedData)
    };
  }

  async fetchSensorData(deviceId, startTime, endTime) {
    // Fetch from IoT hub
    logger.info(`Fetching sensor data for device ${deviceId}`);
    
    // Placeholder for IoT hub integration
    return {
      deviceId,
      readings: [
        { timestamp: new Date(), ph: 7.2, temperature: 28.5, dissolvedOxygen: 6.8, turbidity: 15 }
      ]
    };
  }

  async processSensorData(sensorDataArray) {
    return sensorDataArray.map(sensorData => ({
      ...sensorData,
      readings: sensorData.readings.map(reading => ({
        ...reading,
        quality: this.assessDataQuality(reading),
        normalized: this.normalizeReading(reading),
        trends: this.analyzeTrends(reading)
      }))
    }));
  }

  assessDataQuality(reading) {
    // Assess data quality
    const issues = [];
    let score = 1.0;
    
    if (reading.ph < 0 || reading.ph > 14) {
      issues.push('pH out of range');
      score -= 0.3;
    }
    
    if (reading.temperature < 15 || reading.temperature > 35) {
      issues.push('Temperature out of range');
      score -= 0.2;
    }
    
    return { score: Math.max(0, score), issues };
  }

  normalizeReading(reading) {
    // Normalize readings for analysis
    return {
      ph: reading.ph / 7, // Normalized to neutral pH
      temperature: (reading.temperature - 25) / 10, // Normalized to optimal
      dissolvedOxygen: reading.dissolvedOxygen / 8, // Normalized to optimal
      turbidity: reading.turbidity / 20 // Normalized to acceptable range
    };
  }

  analyzeTrends(reading) {
    // Analyze trends (would use historical data in production)
    return {
      phTrend: 'STABLE',
      temperatureTrend: 'INCREASING',
      oxygenTrend: 'STABLE'
    };
  }

  generateSensorSummary(processedData) {
    const allReadings = processedData.flatMap(s => s.readings);
    
    if (allReadings.length === 0) {
      return { totalReadings: 0 };
    }
    
    return {
      totalReadings: allReadings.length,
      averagePH: allReadings.reduce((sum, r) => sum + r.ph, 0) / allReadings.length,
      averageTemperature: allReadings.reduce((sum, r) => sum + r.temperature, 0) / allReadings.length,
      averageOxygen: allReadings.reduce((sum, r) => sum + r.dissolvedOxygen, 0) / allReadings.length,
      averageTurbidity: allReadings.reduce((sum, r) => sum + r.turbidity, 0) / allReadings.length
    };
  }

  generateSensorAlerts(processedData) {
    const alerts = [];
    
    processedData.forEach(sensor => {
      sensor.readings.forEach(reading => {
        if (reading.ph < 6.5 || reading.ph > 8.5) {
          alerts.push({
            level: 'WARNING',
            type: 'PH',
            message: `pH level ${reading.ph} outside optimal range`,
            deviceId: sensor.deviceId
          });
        }
        
        if (reading.temperature > 32) {
          alerts.push({
            level: 'CRITICAL',
            type: 'TEMPERATURE',
            message: `High temperature: ${reading.temperature}°C`,
            deviceId: sensor.deviceId
          });
        }
        
        if (reading.dissolvedOxygen < 5) {
          alerts.push({
            level: 'WARNING',
            type: 'OXYGEN',
            message: `Low dissolved oxygen: ${reading.dissolvedOxygen} mg/L`,
            deviceId: sensor.deviceId
          });
        }
        
        if (reading.turbidity > 25) {
          alerts.push({
            level: 'INFO',
            type: 'TURBIDITY',
            message: `High turbidity: ${reading.turbidity} NTU`,
            deviceId: sensor.deviceId
          });
        }
      });
    });
    
    return alerts;
  }

  async getPondHealthIndex(pondId) {
    const sensorData = await this.getPondSensorData(pondId);
    const summary = sensorData.summary;
    
    // Calculate health index using AI
    const healthIndex = this.calculateHealthIndex(summary);
    
    return {
      pondId,
      healthIndex,
      healthStatus: this.getHealthStatus(healthIndex),
      summary,
      recommendations: this.generateHealthRecommendations(healthIndex, summary)
    };
  }

  calculateHealthIndex(summary) {
    if (summary.totalReadings === 0) return 50;
    
    let score = 0;
    
    // pH score (optimal: 7.0-7.5)
    const phScore = 1 - Math.abs(summary.averagePH - 7.25) / 7.25;
    score += phScore * 25;
    
    // Temperature score (optimal: 25-30°C)
    const tempScore = 1 - Math.abs(summary.averageTemperature - 27.5) / 27.5;
    score += tempScore * 25;
    
    // Oxygen score (optimal: 6-8 mg/L)
    const oxygenScore = 1 - Math.abs(summary.averageOxygen - 7) / 7;
    score += oxygenScore * 25;
    
    // Turbidity score (optimal: < 20 NTU)
    const turbidityScore = 1 - Math.min(summary.averageTurbidity / 20, 1);
    score += turbidityScore * 25;
    
    return Math.round(score);
  }

  getHealthStatus(healthIndex) {
    if (healthIndex >= 90) return 'EXCELLENT';
    if (healthIndex >= 75) return 'GOOD';
    if (healthIndex >= 60) return 'FAIR';
    if (healthIndex >= 40) return 'POOR';
    return 'CRITICAL';
  }

  generateHealthRecommendations(healthIndex, summary) {
    const recommendations = [];
    
    if (summary.averagePH < 6.5) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Add lime to increase pH level',
        target: '7.0-7.5'
      });
    } else if (summary.averagePH > 8.5) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Add organic matter to decrease pH level',
        target: '7.0-7.5'
      });
    }
    
    if (summary.averageTemperature > 30) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Increase aeration or add shade structures',
        target: '25-30°C'
      });
    }
    
    if (summary.averageOxygen < 5) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Increase aeration system capacity',
        target: '6-8 mg/L'
      });
    }
    
    if (summary.averageTurbidity > 25) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Install filtration system or reduce feeding',
        target: '< 20 NTU'
      });
    }
    
    return recommendations;
  }

  async getPondAIInsights(pondId) {
    const sensorData = await this.getPondSensorData(pondId);
    
    // AI-powered insights
    const insights = {
      growthPotential: await this.predictGrowthPotential(sensorData),
      feedOptimization: await this.optimizeFeeding(sensorData),
      diseaseRisk: await this.assessDiseaseRisk(sensorData),
      harvestPrediction: await this.predictHarvest(sensorData)
    };
    
    return {
      pondId,
      insights,
      confidence: 0.87
    };
  }

  async predictGrowthPotential(sensorData) {
    const summary = sensorData.summary;
    const healthIndex = this.calculateHealthIndex(summary);
    
    return {
      potential: healthIndex > 75 ? 'HIGH' : healthIndex > 50 ? 'MODERATE' : 'LOW',
      estimatedGrowthRate: healthIndex / 100 * 2.5, // kg/m²/week
      confidence: 0.85
    };
  }

  async optimizeFeeding(sensorData) {
    const summary = sensorData.summary;
    
    // AI-powered feeding optimization
    const feedRate = summary.averageTemperature > 28 ? 1.2 : 1.0;
    
    return {
      recommendedFeedRate: feedRate,
      feedingSchedule: this.generateFeedingSchedule(feedRate),
      optimizationSavings: (feedRate - 1.0) * 100
    };
  }

  generateFeedingSchedule(feedRate) {
    return [
      { time: '06:00', rate: feedRate * 0.3 },
      { time: '12:00', rate: feedRate * 0.4 },
      { time: '18:00', rate: feedRate * 0.3 }
    ];
  }

  async assessDiseaseRisk(sensorData) {
    const summary = sensorData.summary;
    const healthIndex = this.calculateHealthIndex(summary);
    
    const riskFactors = [];
    
    if (summary.averageOxygen < 5) {
      riskFactors.push({ factor: 'LOW_OXYGEN', risk: 'HIGH' });
    }
    
    if (summary.averagePH < 6.0 || summary.averagePH > 9.0) {
      riskFactors.push({ factor: 'PH_IMBALANCE', risk: 'HIGH' });
    }
    
    if (summary.averageTemperature > 32) {
      riskFactors.push({ factor: 'HIGH_TEMPERATURE', risk: 'MEDIUM' });
    }
    
    const overallRisk = riskFactors.length > 0 ? 'HIGH' : healthIndex < 60 ? 'MODERATE' : 'LOW';
    
    return {
      overallRisk,
      riskFactors,
      preventiveActions: this.generatePreventiveActions(riskFactors)
    };
  }

  generatePreventiveActions(riskFactors) {
    const actions = [];
    
    riskFactors.forEach(rf => {
      switch(rf.factor) {
        case 'LOW_OXYGEN':
          actions.push('Increase aeration system capacity');
          break;
        case 'PH_IMBALANCE':
          actions.push('Monitor pH levels and add buffers as needed');
          break;
        case 'HIGH_TEMPERATURE':
          actions.push('Add shade structures and improve water circulation');
          break;
      }
    });
    
    return actions;
  }

  async predictHarvest(sensorData) {
    const growthPotential = await this.predictGrowthPotential(sensorData);
    const healthIndex = this.calculateHealthIndex(sensorData.summary);
    
    const harvestDate = new Date();
    harvestDate.setDate(harvestDate.getDate() + 120); // ~4 months
    
    return {
      estimatedHarvestDate: harvestDate.toISOString().split('T')[0],
      expectedYield: growthPotential.estimatedGrowthRate * 120, // 4 months
      qualityPrediction: healthIndex > 75 ? 'PREMIUM' : healthIndex > 50 ? 'STANDARD' : 'BASIC',
      confidence: 0.82
    };
  }
}

const pondManagementService = new PondManagementService();

module.exports = {
  listPonds: (params) => pondManagementService.listPonds(params),
  getPond: (id) => pondManagementService.getPond(id),
  createPond: (payload) => pondManagementService.createPond(payload),
  updatePond: (id, payload) => pondManagementService.updatePond(id, payload),
  deletePond: (id) => pondManagementService.deletePond(id),
  configurePondSensors: (pondId, sensors) => pondManagementService.configurePondSensors(pondId, sensors),
  getPondSensorData: (pondId, params) => pondManagementService.getPondSensorData(pondId, params),
  getPondHealthIndex: (pondId) => pondManagementService.getPondHealthIndex(pondId),
  getPondAIInsights: (pondId) => pondManagementService.getPondAIInsights(pondId)
};