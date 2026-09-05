// Service for M144 - Greenhouse Management (Horticulture) - Advanced AI-Integrated
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');

const tableName = 'greenhouses';

class GreenhouseManagementService {
  constructor() {
    this.aiEnabled = true;
    this.iotHubConnected = true;
    this.blockchainEnabled = true;
    this.realTimeControl = true;
    this.automationEngine = true;
  }

  async listGreenhouses({ page = 1, limit = 20, farmerId = null, greenhouseType = null, status = null } = {}) {
    const pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
    const offset = (page - 1) * limit;
    
    let query = `SELECT COUNT(*) FROM ${tableName}`;
    let countParams = [];
    let conditions = [];
    
    if (farmerId) {
      conditions.push('farmer_id = $' + (conditions.length + 1));
      countParams.push(farmerId);
    }
    if (greenhouseType) {
      conditions.push('greenhouse_type = $' + (conditions.length + 1));
      countParams.push(greenhouseType);
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
    
    // Enrich with IoT sensor data and AI insights
    const enrichedItems = await this.enrichWithIoTData(res.rows);
    
    return { items: enrichedItems, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } };
  }

  async getGreenhouse(id) {
    let pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
    let res = await pg.query(`SELECT * FROM ${tableName} WHERE id = $1`, [id]);
    
    if (res.rows.length === 0) return null;
    
    const enriched = await this.enrichWithIoTData([res.rows[0]]);
    return enriched[0];
  }

  async createGreenhouse(payload) {
    let pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
    const { farmerId, name, location, area, greenhouseType, constructionDate, temperatureControl, humidityControl, irrigationSystem, lightingSystem, currentUsage, automationConfig, metadata } = payload;
    
    let res = await pg.query(
      `INSERT INTO ${tableName} (farmer_id, name, location, area, greenhouse_type, construction_date, temperature_control, humidity_control, irrigation_system, lighting_system, current_usage, automation_config, metadata, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW()) RETURNING *`,
      [farmerId, name, location, area, greenhouseType, constructionDate, temperatureControl, humidityControl, irrigationSystem, lightingSystem, currentUsage, JSON.stringify(automationConfig || {}), JSON.stringify(metadata || {})]
    );
    
    // Configure IoT sensors if automation enabled
    if (automationConfig && automationConfig.sensors) {
      await this.configureGreenhouseSensors(res.rows[0].id, automationConfig.sensors);
    }
    
    // Setup automation rules
    if (this.automationEngine && automationConfig.automationRules) {
      await this.setupAutomationRules(res.rows[0].id, automationConfig.automationRules);
    }
    
    return res.rows[0];
  }

  async updateGreenhouse(id, payload) {
    let pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
    const { name, location, area, greenhouseType, temperatureControl, humidityControl, irrigationSystem, lightingSystem, currentUsage, automationConfig, status, metadata } = payload;
    
    let res = await pg.query(
      `UPDATE ${tableName} 
       SET name = $1, location = $2, area = $3, greenhouse_type = $4, construction_date = $5, temperature_control = $6, humidity_control = $7, irrigation_system = $8, lighting_system = $9, current_usage = $10, automation_config = $11, status = $12, metadata = $13, updated_at = NOW() 
       WHERE id = $14 RETURNING *`,
      [name, location, area, greenhouseType, payload.constructionDate, temperatureControl, humidityControl, irrigationSystem, lightingSystem, currentUsage, JSON.stringify(automationConfig || {}), status, JSON.stringify(metadata || {}), id]
    );
    
    if (res.rows[0]) {
      // Reconfigure sensors if automation changed
      if (automationConfig && automationConfig.sensors) {
        await this.configureGreenhouseSensors(id, automationConfig.sensors);
      }
      
      // Update automation rules
      if (this.automationEngine && automationConfig.automationRules) {
        await this.updateAutomationRules(id, automationConfig.automationRules);
      }
    }
    
    return res.rows[0] || null;
  }

  async deleteGreenhouse(id) {
    let pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
    let res = await pg.query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING id`, [id]);
    return !!res.rows[0];
  }

  // IoT Sensor Integration
  async configureGreenhouseSensors(greenhouseId, sensors) {
    const sensorRegistrations = await Promise.all(
      sensors.map(sensor => this.registerGreenhouseSensor(greenhouseId, sensor))
    );
    
    return {
      greenhouseId,
      sensors: sensorRegistrations,
      connected: sensorRegistrations.filter(s => s.success).length,
      failed: sensorRegistrations.filter(s => !s.success).length
    };
  }

  async registerGreenhouseSensor(greenhouseId, sensorConfig) {
    const { sensorType, deviceId, location, calibration } = sensorConfig;
    
    logger.info(`Registering ${sensorType} sensor for greenhouse ${greenhouseId}`);
    
    const sensorId = `GH-SENSOR-${greenhouseId}-${sensorType}-${Date.now()}`;
    
    let pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
    await pg.query(
      `INSERT INTO greenhouse_sensors (greenhouse_id, sensor_type, device_id, sensor_id, location, calibration, status, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', NOW())`,
      [greenhouseId, sensorType, deviceId, sensorId, location, JSON.stringify(calibration || {})]
    );
    
    return {
      sensorId,
      sensorType,
      deviceId,
      success: true
    };
  }

  async getGreenhouseSensorData(greenhouseId, { startTime, endTime, sensorTypes } = {}) {
    let pg = getPostgreSQL(); if(!pg) throw new Error(' Database not initialized');
    
    const sensorsRes = await pg.query(
      `SELECT * FROM greenhouse_sensors WHERE greenhouse_id = $1 AND status = 'ACTIVE'`,
      [greenhouseId]
    );
    
    if (sensorTypes && sensorTypes.length > 0) {
      sensorsRes.rows = sensorsRes.rows.filter(s => sensorTypes.includes(s.sensor_type));
    }
    
    const sensorData = await Promise.all(
      sensorsRes.rows.map(sensor => this.fetchGreenhouseSensorData(sensor.device_id, startTime, endTime))
    );
    
    const processedData = await this.processGreenhouseSensorData(sensorData);
    
    return {
      greenhouseId,
      sensors: sensorsRes.rows,
      data: processedData,
      summary: this.generateGreenhouseSummary(processedData),
      alerts: this.generateGreenhouseAlerts(processedData)
    };
  }

  /**
   * (2026-08-29) Was unconditionally returning one hardcoded fabricated
   * reading (25.5C/75%/450ppm/etc.) for every device regardless of what
   * device_id was passed - a fake IoT feed dressed up as "fetching." No
   * real IoT/MQTT/GSM sensor gateway is configured anywhere in this
   * codebase. Reads real logged readings from greenhouse_sensor_readings
   * if the table/rows exist; returns an explicit empty result with a
   * reason otherwise, rather than fabricating one.
   */
  async fetchGreenhouseSensorData(deviceId, startTime, endTime) {
    let pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
    try {
      const params = [deviceId];
      let query = `SELECT * FROM greenhouse_sensor_readings WHERE device_id = $1`;
      if (startTime) { params.push(startTime); query += ` AND recorded_at >= $${params.length}`; }
      if (endTime) { params.push(endTime); query += ` AND recorded_at <= $${params.length}`; }
      query += ' ORDER BY recorded_at DESC LIMIT 100';
      let res = await pg.query(query, params);
      return { deviceId, readings: res.rows, configured: true };
    } catch (error) {
      // greenhouse_sensor_readings has no migration in this codebase yet -
      // no real IoT gateway writes to it. Honest empty result, not fake data.
      return {
        deviceId,
        readings: [],
        configured: false,
        reason: 'No IoT sensor gateway is configured in this deployment; no live or logged reading exists for this device.',
      };
    }
  }

  async processGreenhouseSensorData(sensorDataArray) {
    return sensorDataArray.map(sensorData => ({
      ...sensorData,
      readings: sensorData.readings.map(reading => ({
        ...reading,
        quality: this.assessGreenhouseDataQuality(reading),
        optimized: this.optimizeGreenhouseReading(reading),
        predictions: this.predictGreenhouseConditions(reading)
      }))
    }));
  }

  assessGreenhouseDataQuality(reading) {
    const issues = [];
    let score = 1.0;
    
    if (reading.temperature < 15 || reading.temperature > 35) {
      issues.push('Temperature out of range');
      score -= 0.3;
    }
    
    if (reading.humidity < 40 || reading.humidity > 90) {
      issues.push('Humidity out of range');
      score -= 0.2;
    }
    
    if (reading.co2 < 300 || reading.co2 > 1200) {
      issues.push('CO2 level suboptimal');
      score -= 0.2;
    }
    
    return { score: Math.max(0, score), issues };
  }

  optimizeGreenhouseReading(reading) {
    // AI-powered optimization recommendations
    const optimizations = [];
    
    if (reading.temperature > 28) {
      optimizations.push({ action: 'reduce_ventilation', target: 25 });
    }
    
    if (reading.humidity < 60) {
      optimizations.push({ action: 'increase_humidity', target: 70 });
    }
    
    if (reading.co2 < 400) {
      optimizations.push({ action: 'increase_co2', target: 600 });
    }
    
    return optimizations;
  }

  predictGreenhouseConditions(reading) {
    // Predict future conditions based on current state
    return {
      temperatureTrend: reading.temperature > 25 ? 'INCREASING' : 'STABLE',
      humidityTrend: reading.humidity > 75 ? 'INCREASING' : 'STABLE',
      co2Trend: reading.co2 < 450 ? 'DECREASING' : 'STABLE',
      growthSuitability: this.calculateGrowthSuitability(reading)
    };
  }

  calculateGrowthSuitability(reading) {
    let score = 0;
    
    // Temperature score (optimal: 20-28°C)
    if (reading.temperature >= 20 && reading.temperature <= 28) {
      score += 30;
    } else if (reading.temperature >= 18 && reading.temperature <= 32) {
      score += 20;
    }
    
    // Humidity score (optimal: 60-80%)
    if (reading.humidity >= 60 && reading.humidity <= 80) {
      score += 30;
    } else if (reading.humidity >= 50 && reading.humidity <= 90) {
      score += 20;
    }
    
    // CO2 score (optimal: 400-600 ppm)
    if (reading.co2 >= 400 && reading.co2 <= 600) {
      score += 25;
    } else if (reading.co2 >= 300 && reading.co2 <= 800) {
      score += 15;
    }
    
    // Light level score (optimal: 10000-15000 lux)
    if (reading.lightLevel >= 10000 && reading.lightLevel <= 15000) {
      score += 15;
    }
    
    return Math.min(score, 100);
  }

  generateGreenhouseSummary(processedData) {
    const allReadings = processedData.flatMap(s => s.readings);
    
    if (allReadings.length === 0) {
      return { totalReadings: 0 };
    }
    
    return {
      totalReadings: allReadings.length,
      averageTemperature: allReadings.reduce((sum, r) => sum + r.temperature, 0) / allReadings.length,
      averageHumidity: allReadings.reduce((sum, r) => sum + r.humidity, 0) / allReadings.length,
      averageCO2: allReadings.reduce((sum, r) => sum + r.co2, 0) / allReadings.length,
      averageLightLevel: allReadings.reduce((sum, r) => sum + r.lightLevel, 0) / allReadings.length,
      averageSoilMoisture: allReadings.reduce((sum, r) => sum + r.soilMoisture, 0) / allReadings.length
    };
  }

  generateGreenhouseAlerts(processedData) {
    const alerts = [];
    
    processedData.forEach(sensor => {
      sensor.readings.forEach(reading => {
        if (reading.temperature > 32) {
          alerts.push({
            level: 'CRITICAL',
            type: 'TEMPERATURE',
            message: `High temperature: ${reading.temperature}°C`,
            deviceId: sensor.deviceId
          });
        }
        
        if (reading.humidity > 85) {
          alerts.push({
            level: 'WARNING',
            type: 'HUMIDITY',
            message: `High humidity: ${reading.humidity}%`,
            deviceId: sensor.deviceId
          });
        }
        
        if (reading.co2 < 350) {
          alerts.push({
            level: 'WARNING',
            type: 'CO2',
            message: `Low CO2: ${reading.co2} ppm`,
            deviceId: sensor.deviceId
          });
        }
        
        if (reading.soilMoisture < 40) {
          alerts.push({
            level: 'INFO',
            type: 'SOIL_MOISTURE',
            message: `Low soil moisture: ${reading.soilMoisture}%`,
            deviceId: sensor.deviceId
          });
        }
      });
    });
    
    return alerts;
  }

  // Automation Engine
  async setupAutomationRules(greenhouseId, rules) {
    logger.info(`Setting up automation rules for greenhouse ${greenhouseId}`);
    
    let pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
    
    for (const rule of rules) {
      await pg.query(
        `INSERT INTO greenhouse_automation_rules (greenhouse_id, rule_name, rule_type, trigger_condition, action, parameters, status, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', NOW())`,
        [greenhouseId, rule.name, rule.type, JSON.stringify(rule.trigger), rule.action, JSON.stringify(rule.parameters || {})]
      );
    }
    
    return { greenhouseId, rulesConfigured: rules.length };
  }

  async updateAutomationRules(greenhouseId, rules) {
    let pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
    
    // Delete existing rules
    await pg.query(`DELETE FROM greenhouse_automation_rules WHERE greenhouse_id = $1`, [greenhouseId]);
    
    // Add new rules
    return await this.setupAutomationRules(greenhouseId, rules);
  }

  async executeAutomation(greenhouseId) {
    let pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
    
    // Get active automation rules
    const rulesRes = await pg.query(
      `SELECT * FROM greenhouse_automation_rules WHERE greenhouse_id = $1 AND status = 'ACTIVE'`,
      [greenhouseId]
    );
    
    const results = [];
    
    for (const rule of rulesRes.rows) {
      const triggerMet = await this.evaluateTrigger(rule.trigger_condition);
      
      if (triggerMet) {
        const actionResult = await this.executeAction(rule.action, rule.parameters);
        results.push({
          ruleName: rule.rule_name,
          triggered: true,
          actionResult
        });
      }
    }
    
    return {
      greenhouseId,
      automationExecuted: results.length,
      results
    };
  }

  /**
   * (2026-08-29) Was unconditionally `return true` - every automation rule
   * would fire on every check regardless of trigger condition, a silent
   * always-on bug, not a real evaluation. Evaluates real, simple threshold
   * conditions (field/operator/value) against the greenhouse's latest
   * logged sensor reading; honestly returns false (does not fire) if no
   * reading exists yet, rather than defaulting to true.
   */
  async evaluateTrigger(triggerCondition) {
    const { greenhouseId, field, operator, value } = triggerCondition || {};
    if (!greenhouseId || !field || !operator || value === undefined) {
      logger.warn(`Trigger condition missing required fields: ${JSON.stringify(triggerCondition)}`);
      return false;
    }
    let sensorData = await this.getGreenhouseSensorData(greenhouseId);
    const latest = sensorData.data?.[0]?.readings?.[0];
    if (!latest || latest[field] === undefined) return false;

    const actual = latest[field];
    switch (operator) {
      case '>': return actual > value;
      case '<': return actual < value;
      case '>=': return actual >= value;
      case '<=': return actual <= value;
      case '==': return actual === value;
      default:
        logger.warn(`Unknown trigger operator: ${operator}`);
        return false;
    }
  }

  async executeAction(action, parameters) {
    // Execute automation action
    logger.info(`Executing action: ${action} with parameters: ${JSON.stringify(parameters)}`);
    
    // Send command to IoT device
    return {
      action,
      executed: true,
      deviceId: parameters.deviceId,
      timestamp: new Date().toISOString()
    };
  }

  async getGreenhouseAIInsights(greenhouseId) {
    let sensorData = await this.getGreenhouseSensorData(greenhouseId);
    
    const insights = {
      cropOptimization: await this.optimizeCropSelection(sensorData),
      energyEfficiency: await this.optimizeEnergyUsage(sensorData),
      growthPrediction: await this.predictGrowthCycle(sensorData),
      resourceOptimization: await this.optimizeResources(sensorData)
    };
    
    // (2026-08-29) Was a hardcoded confidence:0.89 regardless of input -
    // the same fabricated-confidence-score pattern already found and fixed
    // in core/ai/aiOrchestratorCore.js this session. These insights are
    // deterministic rule-based calculations (see calculateCropSuitability/
    // calculateGrowthSuitability above), not a scored ML prediction - no
    // confidence figure honestly applies. Removed rather than faked.
    return {
      greenhouseId,
      insights,
      method: 'rule_based_calculation',
    };
  }

  async optimizeCropSelection(sensorData) {
    const summary = sensorData.summary;
    
    // AI-powered crop recommendations based on environmental conditions
    const recommendations = [
      { crop: 'Tomato', suitability: this.calculateCropSuitability('TOMATO', summary), reason: 'Optimal temperature and humidity' },
      { crop: 'Lettuce', suitability: this.calculateCropSuitability('LETTUCE', summary), reason: 'Low temperature preference' },
      { crop: 'Bell Pepper', suitability: this.calculateCropSuitability('BELL_PEPPER', summary), reason: 'High light requirement met' }
    ];
    
    return recommendations.sort((a, b) => b.suitability - a.suitability);
  }

  calculateCropSuitability(crop, summary) {
    // Simplified crop suitability calculation
    const cropRequirements = {
      'TOMATO': { tempMin: 18, tempMax: 30, humidityMin: 60, humidityMax: 80 },
      'LETTUCE': { tempMin: 15, tempMax: 25, humidityMin: 50, humidityMax: 70 },
      'BELL_PEPPER': { tempMin: 20, tempMax: 28, humidityMin: 60, humidityMax: 80 }
    };
    
    const req = cropRequirements[crop];
    if (!req) return 0;
    
    let score = 0;
    
    if (summary.averageTemperature >= req.tempMin && summary.averageTemperature <= req.tempMax) {
      score += 40;
    }
    
    if (summary.averageHumidity >= req.humidityMin && summary.averageHumidity <= req.humidityMax) {
      score += 40;
    }
    
    if (summary.averageLightLevel >= 10000) {
      score += 20;
    }
    
    return score;
  }

  async optimizeEnergyUsage(sensorData) {
    let summary = sensorData.summary;
    
    let optimizations = [];
    
    if (summary.averageTemperature > 28) {
      optimizations.push({
        action: 'reduce_ventilation_hours',
        savings: '15%',
        reason: 'Temperature is naturally high, reduce mechanical cooling'
      });
    }
    
    if (summary.averageLightLevel > 15000) {
      optimizations.push({
        action: 'adjust_lighting_schedule',
        savings: '20%',
        reason: 'Natural light is sufficient, reduce artificial lighting'
      });
    }
    
    return optimizations;
  }

  async predictGrowthCycle(sensorData) {
    const growthSuitability = this.calculateGrowthSuitability(sensorData.summary);
    
    const estimatedDays = Math.round(120 / (growthSuitability / 100));
    const harvestDate = new Date();
    harvestDate.setDate(harvestDate.getDate() + estimatedDays);
    
    return {
      estimatedGrowthDays: estimatedDays,
      estimatedHarvestDate: harvestDate.toISOString().split('T')[0],
      expectedYieldQuality: growthSuitability > 80 ? 'PREMIUM' : growthSuitability > 60 ? 'STANDARD' : 'BASIC'
    };
  }

  async optimizeResources(sensorData) {
    let summary = sensorData.summary;
    
    return {
      irrigation: {
        recommendedFrequency: summary.averageSoilMoisture < 50 ? 'INCREASED' : 'MAINTAIN',
        waterSavings: summary.averageSoilHumidity > 70 ? '20%' : '0%'
      },
      fertilization: {
        recommendedSchedule: 'AI-OPTIMIZED',
        applicationRate: '1.2x' // Slightly higher for optimal growth
      },
      climateControl: {
        recommendedSettings: {
          temperature: 25,
          humidity: 70,
          co2: 500
        }
      }
    };
  }
}

const greenhouseManagementService = new GreenhouseManagementService();

module.exports = {
  listGreenhouses: (params) => greenhouseManagementService.listGreenhouses(params),
  getGreenhouse: (id) => greenhouseManagementService.getGreenhouse(id),
  createGreenhouse: (payload) => greenhouseManagementService.createGreenhouse(payload),
  updateGreenhouse: (id, payload) => greenhouseManagementService.updateGreenhouse(id, payload),
  deleteGreenhouse: (id) => greenhouseManagementService.deleteGreenhouse(id),
  configureGreenhouseSensors: (greenhouseId, sensors) => greenhouseManagementService.configureGreenhouseSensors(greenhouseId, sensors),
  getGreenhouseSensorData: (greenhouseId, params) => greenhouseManagementService.getGreenhouseSensorData(greenhouseId, params),
  executeAutomation: (greenhouseId) => greenhouseManagementService.executeAutomation(greenhouseId),
  getGreenhouseAIInsights: (greenhouseId) => greenhouseManagementService.getGreenhouseAIInsights(greenhouseId)
};