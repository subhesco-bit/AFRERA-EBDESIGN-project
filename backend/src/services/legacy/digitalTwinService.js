/**
 * Digital Twin Service
 * Creates virtual representations of physical farms for real-time monitoring, 
 * simulation, and optimization. Integrates IoT sensors, satellite data, and AI analytics.
 * Based on latest research in agricultural digital twins (2024-2025)
 */

const { logger } = require('..\/utils\/logger');
const { getPostgreSQL } = require('..\/database\/connection');

class DigitalTwinService {
  constructor() {
    this.isInitialized = false;
    this.activeTwins = new Map();
    this.sensorDataBuffer = new Map();
    this.simulationEngine = null;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      logger.info('Initializing Digital Twin Service');
      
      // Initialize simulation engine
      this.initializeSimulationEngine();
      
      // Load existing digital twins
      await this.loadExistingTwins();
      
      // Start real-time data synchronization
      this.startDataSynchronization();
      
      this.isInitialized = true;
      logger.info('Digital Twin Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Digital Twin Service', { error: error.message });
      throw error;
    }
  }

  initializeSimulationEngine() {
    this.simulationEngine = {
      cropGrowthModel: this.cropGrowthSimulation.bind(this),
      soilMoistureModel: this.soilMoistureSimulation.bind(this),
      pestSpreadModel: this.pestSpreadSimulation.bind(this),
      yieldPredictionModel: this.yieldPredictionSimulation.bind(this),
      climateImpactModel: this.climateImpactSimulation.bind(this)
    };

    logger.info('Simulation engine initialized', {
      models: Object.keys(this.simulationEngine)
    });
  }

  async loadExistingTwins() {
    try {
      const result = await getPostgreSQL().query(`
        SELECT dt.id, dt.farm_id, dt.name, dt.configuration, dt.last_synced,
               f.name as farm_name, f.location, f.total_area
        FROM digital_twins dt
        JOIN farms f ON dt.farm_id = f.id
        WHERE dt.is_active = true
      `);

      result.rows.forEach(twin => {
        this.activeTwins.set(twin.id, {
          ...twin,
          state: this.initializeTwinState(twin.configuration),
          lastUpdate: twin.last_synced
        });
      });

      logger.info('Loaded existing digital twins', {
        count: this.activeTwins.size
      });
    } catch (error) {
      logger.warn('Failed to load existing twins', { error: error.message });
    }
  }

  initializeTwinState(configuration) {
    return {
      crops: [],
      soil: {
        moisture: 50,
        ph: 6.5,
        nutrients: { nitrogen: 50, phosphorus: 50, potassium: 50 }
      },
      weather: {
        temperature: 25,
        humidity: 60,
        rainfall: 0
      },
      sensors: {
        active: 0,
        dataPoints: []
      },
      predictions: {
        yield: null,
        pestRisk: null,
        irrigationNeed: null
      }
    };
  }

  startDataSynchronization() {
    // Sync sensor data every 5 minutes
    setInterval(async () => {
      await this.syncSensorData();
    }, 5 * 60 * 1000);

    // Run simulations every 15 minutes
    setInterval(async () => {
      await this.runAllSimulations();
    }, 15 * 60 * 1000);

    logger.info('Data synchronization started');
  }

  async createDigitalTwin(farmId, configuration) {
    try {
      let result = await getPostgreSQL().query(`
        INSERT INTO digital_twins (farm_id, name, configuration, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING id, farm_id, name, configuration
      `, [farmId, configuration.name || `Twin for Farm ${farmId}`, JSON.stringify(configuration)]);

      const twin = result.rows[0];
      
      this.activeTwins.set(twin.id, {
        ...twin,
        state: this.initializeTwinState(configuration),
        lastUpdate: new Date()
      });

      logger.info('Digital twin created', { twinId: twin.id, farmId });
      
      return {
        success: true,
        twin: {
          id: twin.id,
          farmId: twin.farm_id,
          name: twin.name,
          state: this.activeTwins.get(twin.id).state
        }
      };
    } catch (error) {
      logger.error('Failed to create digital twin', { error: error.message });
      throw error;
    }
  }

  async updateDigitalTwin(twinId, updates) {
    try {
      let twin = this.activeTwins.get(twinId);
      
      if (!twin) {
        throw new Error(`Digital twin not found: ${twinId}`);
      }

      // Update state
      if (updates.state) {
        twin.state = { ...twin.state, ...updates.state };
      }

      if (updates.configuration) {
        twin.configuration = { ...twin.configuration, ...updates.configuration };
      }

      // Persist to database
      await getPostgreSQL().query(`
        UPDATE digital_twins
        SET configuration = $1, last_synced = NOW(), updated_at = NOW()
        WHERE id = $2
      `, [JSON.stringify(twin.configuration), twinId]);

      twin.lastUpdate = new Date();
      this.activeTwins.set(twinId, twin);

      logger.info('Digital twin updated', { twinId });
      
      return {
        success: true,
        twin: {
          id: twin.id,
          state: twin.state,
          lastUpdate: twin.lastUpdate
        }
      };
    } catch (error) {
      logger.error('Failed to update digital twin', { error: error.message });
      throw error;
    }
  }

  async ingestSensorData(twinId, sensorData) {
    try {
      let twin = this.activeTwins.get(twinId);
      
      if (!twin) {
        throw new Error(`Digital twin not found: ${twinId}`);
      }

      // Store sensor data
      await getPostgreSQL().query(`
        INSERT INTO sensor_data (twin_id, sensor_type, value, unit, location, timestamp)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [twinId, sensorData.type, sensorData.value, sensorData.unit, sensorData.location]);

      // Update twin state
      this.updateTwinStateFromSensor(twin, sensorData);

      // Trigger immediate simulation if critical data
      if (this.isCriticalSensorData(sensorData)) {
        await this.runSimulation(twinId, sensorData.type);
      }

      logger.info('Sensor data ingested', { twinId, sensorType: sensorData.type });
      
      return {
        success: true,
        stateUpdated: true
      };
    } catch (error) {
      logger.error('Failed to ingest sensor data', { error: error.message });
      throw error;
    }
  }

  updateTwinStateFromSensor(twin, sensorData) {
    switch (sensorData.type) {
      case 'soil_moisture':
        twin.state.soil.moisture = sensorData.value;
        break;
      case 'soil_ph':
        twin.state.soil.ph = sensorData.value;
        break;
      case 'temperature':
        twin.state.weather.temperature = sensorData.value;
        break;
      case 'humidity':
        twin.state.weather.humidity = sensorData.value;
        break;
      case 'rainfall':
        twin.state.weather.rainfall = sensorData.value;
        break;
      default:
        // Store in sensor data points
        twin.state.sensors.dataPoints.push({
          type: sensorData.type,
          value: sensorData.value,
          timestamp: new Date()
        });
    }

    twin.state.sensors.active++;
  }

  isCriticalSensorData(sensorData) {
    const criticalTypes = ['soil_moisture', 'temperature', 'rainfall'];
    return criticalTypes.includes(sensorData.type);
  }

  async runSimulation(twinId, modelType) {
    try {
      let twin = this.activeTwins.get(twinId);
      
      if (!twin) {
        throw new Error(`Digital twin not found: ${twinId}`);
      }

      const model = this.simulationEngine[modelType];
      
      if (!model) {
        throw new Error(`Simulation model not found: ${modelType}`);
      }

      const simulationResult = await model(twin.state, twin.configuration);

      // Store simulation result
      await getPostgreSQL().query(`
        INSERT INTO simulation_results (twin_id, model_type, result, timestamp)
        VALUES ($1, $2, $3, NOW())
      `, [twinId, modelType, JSON.stringify(simulationResult)]);

      // Update twin predictions
      twin.state.predictions = {
        ...twin.state.predictions,
        [modelType]: simulationResult
      };

      logger.info('Simulation completed', { twinId, modelType });
      
      return {
        success: true,
        result: simulationResult
      };
    } catch (error) {
      logger.error('Simulation failed', { twinId, modelType, error: error.message });
      throw error;
    }
  }

  async runAllSimulations() {
    for (const [twinId, twin] of this.activeTwins) {
      try {
        // Run all simulation models
        for (const modelType of Object.keys(this.simulationEngine)) {
          await this.runSimulation(twinId, modelType);
        }
      } catch (error) {
        logger.error('Failed to run simulations for twin', { twinId, error: error.message });
      }
    }
  }

  async syncSensorData() {
    for (const [twinId, twin] of this.activeTwins) {
      try {
        // Fetch latest sensor data from external sources
        const sensorData = await this.fetchExternalSensorData(twin.farm_id);
        
        for (const data of sensorData) {
          await this.ingestSensorData(twinId, data);
        }
      } catch (error) {
        logger.error('Failed to sync sensor data for twin', { twinId, error: error.message });
      }
    }
  }

  async fetchExternalSensorData(farmId) {
    // No IoT platform integration is configured in this environment, and
    // the real iot_readings/iot_devices tables (015_advanced_features.sql)
    // key devices by owner (a user), not farm_id — there is no real
    // device-to-farm mapping to join against here. Previously returned
    // randomized fake soil_moisture/temperature/humidity values as if they
    // were real sensor readings; that is worse than returning nothing,
    // since callers (digital-twin simulation, farm advisories) could act on
    // fabricated environmental data. Honestly return no readings rather
    // than invent either the data or a query relationship that isn't real.
    logger.warn('fetchExternalSensorData: no IoT integration or farm-device mapping configured', { farmId });
    return [];
  }

  // Simulation models
  async cropGrowthSimulation(state, configuration) {
    const { crops, weather, soil } = state;
    
    if (!crops || crops.length === 0) {
      return { message: 'No crops to simulate' };
    }

    const growthPredictions = crops.map(crop => {
      const growthRate = this.calculateGrowthRate(weather, soil, crop);
      const daysToMaturity = this.calculateDaysToMaturity(crop, growthRate);
      const yieldPrediction = this.calculateYield(crop, soil, weather);

      return {
        crop: crop.name,
        currentStage: crop.stage || 'seedling',
        growthRate: growthRate,
        daysToMaturity: daysToMaturity,
        predictedYield: yieldPrediction,
        recommendations: this.getGrowthRecommendations(crop, soil, weather)
      };
    });

    return {
      timestamp: new Date().toISOString(),
      predictions: growthPredictions,
      overallHealth: this.calculateOverallHealth(growthPredictions)
    };
  }

  async soilMoistureSimulation(state, configuration) {
    const { soil, weather } = state;
    
    const moistureRetention = this.calculateMoistureRetention(soil);
    const evaporationRate = this.calculateEvaporationRate(weather);
    const irrigationNeed = this.calculateIrrigationNeed(soil.moisture, moistureRetention);
    
    const futureMoisture = Math.max(
      0,
      soil.moisture + weather.rainfall - evaporationRate
    );

    return {
      currentMoisture: soil.moisture,
      predictedMoisture: futureMoisture,
      irrigationNeed: irrigationNeed,
      retentionCapacity: moistureRetention,
      evaporationRate: evaporationRate,
      recommendations: this.getIrrigationRecommendations(irrigationNeed, soil.moisture)
    };
  }

  async pestSpreadSimulation(state, configuration) {
    const { crops, weather } = state;
    
    const pestRiskFactors = {
      temperature: weather.temperature > 30 ? 'high' : weather.temperature > 25 ? 'medium' : 'low',
      humidity: weather.humidity > 70 ? 'high' : weather.humidity > 50 ? 'medium' : 'low',
      cropDensity: crops.length > 3 ? 'high' : crops.length > 1 ? 'medium' : 'low'
    };

    const overallRisk = this.calculateOverallPestRisk(pestRiskFactors);
    const likelyPests = this.predictLikelyPests(crops, weather);
    const spreadRate = this.calculatePestSpreadRate(overallRisk, weather);

    return {
      overallRisk: overallRisk,
      riskFactors: pestRiskFactors,
      likelyPests: likelyPests,
      spreadRate: spreadRate,
      recommendations: this.getPestManagementRecommendations(overallRisk, likelyPests)
    };
  }

  async yieldPredictionSimulation(state, configuration) {
    const { crops, soil, weather } = state;
    
    const yieldPredictions = crops.map(crop => {
      const baseYield = this.getBaseYield(crop.name);
      const soilFactor = this.calculateSoilYieldFactor(soil, crop);
      const weatherFactor = this.calculateWeatherYieldFactor(weather, crop);
      const managementFactor = configuration.managementEfficiency || 0.85;

      const predictedYield = baseYield * soilFactor * weatherFactor * managementFactor;
      const confidence = this.calculateYieldConfidence(soil, weather, crop);

      return {
        crop: crop.name,
        baseYield: baseYield,
        predictedYield: predictedYield,
        unit: 'kg/hectare',
        confidence: confidence,
        factors: {
          soil: soilFactor,
          weather: weatherFactor,
          management: managementFactor
        },
        optimizationPotential: this.calculateOptimizationPotential(predictedYield, baseYield)
      };
    });

    return {
      timestamp: new Date().toISOString(),
      predictions: yieldPredictions,
      totalPredictedYield: yieldPredictions.reduce((sum, p) => sum + p.predictedYield, 0)
    };
  }

  async climateImpactSimulation(state, configuration) {
    const { weather, crops } = state;
    
    const climateScenarios = [
      { name: 'current', conditions: weather },
      { name: 'drought', conditions: { ...weather, rainfall: weather.rainfall * 0.3, temperature: weather.temperature + 3 } },
      { name: 'flood', conditions: { ...weather, rainfall: weather.rainfall * 2.5 } },
      { name: 'heat_wave', conditions: { ...weather, temperature: weather.temperature + 5, humidity: weather.humidity - 10 } }
    ];

    const impactAnalysis = climateScenarios.map(scenario => {
      const cropImpacts = crops.map(crop => ({
        crop: crop.name,
        yieldImpact: this.calculateYieldImpact(scenario.conditions, crop),
        stressLevel: this.calculateCropStressLevel(scenario.conditions, crop),
        adaptationNeeds: this.getAdaptationNeeds(scenario.name, crop)
      }));

      return {
        scenario: scenario.name,
        conditions: scenario.conditions,
        cropImpacts: cropImpacts,
        overallRisk: this.calculateScenarioRisk(cropImpacts)
      };
    });

    return {
      timestamp: new Date().toISOString(),
      scenarios: impactAnalysis,
      recommendations: this.getClimateAdaptationRecommendations(impactAnalysis)
    };
  }

  // Helper methods for simulations
  calculateGrowthRate(weather, soil, crop) {
    const optimalTemp = 25;
    const tempDiff = Math.abs(weather.temperature - optimalTemp);
    const tempFactor = Math.max(0, 1 - (tempDiff / 20));
    const moistureFactor = soil.moisture / 100;
    const nutrientFactor = (soil.nutrients.nitrogen + soil.nutrients.phosphorus + soil.nutrients.potassium) / 150;
    
    return (tempFactor * 0.4 + moistureFactor * 0.3 + nutrientFactor * 0.3) * 100;
  }

  calculateDaysToMaturity(crop, growthRate) {
    const baseDays = 90; // Average days to maturity
    return Math.round(baseDays / (growthRate / 100));
  }

  calculateYield(crop, soil, weather) {
    let baseYield = this.getBaseYield(crop.name);
    let soilFactor = soil.moisture / 100;
    let weatherFactor = 1 - (Math.abs(weather.temperature - 25) / 30);
    
    return baseYield * soilFactor * weatherFactor;
  }

  getGrowthRecommendations(crop, soil, weather) {
    const recommendations = [];
    
    if (soil.moisture < 40) {
      recommendations.push('Increase irrigation');
    }
    if (weather.temperature > 30) {
      recommendations.push('Provide shade or heat protection');
    }
    if (soil.nutrients.nitrogen < 40) {
      recommendations.push('Apply nitrogen fertilizer');
    }
    
    return recommendations;
  }

  calculateOverallHealth(predictions) {
    if (!predictions || predictions.length === 0) return 'unknown';
    
    const avgGrowthRate = predictions.reduce((sum, p) => sum + p.growthRate, 0) / predictions.length;
    
    if (avgGrowthRate > 80) return 'excellent';
    if (avgGrowthRate > 60) return 'good';
    if (avgGrowthRate > 40) return 'fair';
    return 'poor';
  }

  calculateMoistureRetention(soil) {
    // Simplified soil moisture retention calculation
    const retentionMap = { clay: 80, loam: 60, sandy: 30 };
    return retentionMap[soil.type] || 50;
  }

  calculateEvaporationRate(weather) {
    // Simplified evaporation rate based on temperature and humidity
    return (weather.temperature * 0.5) * (1 - weather.humidity / 100);
  }

  calculateIrrigationNeed(moisture, retention) {
    if (moisture < 30) return 'critical';
    if (moisture < 50) return 'moderate';
    return 'minimal';
  }

  getIrrigationRecommendations(irrigationNeed, currentMoisture) {
    if (irrigationNeed === 'critical') {
      return ['Immediate irrigation required', 'Apply 20-30mm water', 'Monitor soil moisture closely'];
    }
    if (irrigationNeed === 'moderate') {
      return ['Irrigate within 24 hours', 'Apply 10-15mm water', 'Check weather forecast'];
    }
    return ['Maintain current irrigation schedule', 'Monitor moisture levels'];
  }

  calculateOverallPestRisk(factors) {
    const riskScores = { high: 3, medium: 2, low: 1 };
    const totalScore = Object.values(factors).reduce((sum, factor) => sum + riskScores[factor], 0);
    
    if (totalScore >= 8) return 'high';
    if (totalScore >= 5) return 'medium';
    return 'low';
  }

  predictLikelyPests(crops, weather) {
    // Simplified pest prediction based on crops and weather
    const pestMap = {
      wheat: ['aphids', 'rust', 'armyworm'],
      rice: ['stem_borer', 'leaf_folder', 'brown_planthopper'],
      maize: ['fall_armyworm', 'stem_borer', 'aphids']
    };

    let likelyPests = [];
    crops.forEach(crop => {
      if (pestMap[crop.name]) {
        likelyPests.push(...pestMap[crop.name]);
      }
    });

    return [...new Set(likelyPests)];
  }

  calculatePestSpreadRate(risk, weather) {
    const baseRate = risk === 'high' ? 0.8 : risk === 'medium' ? 0.5 : 0.2;
    const weatherMultiplier = weather.humidity > 70 ? 1.5 : 1.0;
    
    return baseRate * weatherMultiplier;
  }

  getPestManagementRecommendations(risk, pests) {
    if (risk === 'high') {
      return [
        'Implement integrated pest management',
        'Monitor pest populations daily',
        'Consider preventive treatments',
        'Use biological controls where possible'
      ];
    }
    if (risk === 'medium') {
      return [
        'Regular pest monitoring',
        'Maintain field hygiene',
        'Use resistant varieties'
      ];
    }
    return ['Continue routine monitoring'];
  }

  getBaseYield(crop) {
    const yields = { wheat: 3000, rice: 4000, maize: 5000, soybean: 2500 };
    return yields[crop] || 3500;
  }

  calculateSoilYieldFactor(soil, crop) {
    return (soil.moisture / 100) * (soil.nutrients.nitrogen / 100);
  }

  calculateWeatherYieldFactor(weather, crop) {
    let optimalTemp = 25;
    let tempDiff = Math.abs(weather.temperature - optimalTemp);
    return Math.max(0.5, 1 - (tempDiff / 20));
  }

  calculateYieldConfidence(soil, weather, crop) {
    // Higher confidence with more data and optimal conditions
    const dataQuality = 0.8; // Placeholder for actual data quality assessment
    const conditionOptimality = (soil.moisture > 40 && soil.moisture < 80) ? 1 : 0.7;
    
    return (dataQuality + conditionOptimality) / 2;
  }

  calculateOptimizationPotential(predicted, base) {
    const gap = base - predicted;
    return (gap / base) * 100;
  }

  calculateYieldImpact(conditions, crop) {
    let baseYield = this.getBaseYield(crop.name);
    let impact = 0;

    if (conditions.rainfall < 50) impact -= 0.3; // Drought impact
    if (conditions.rainfall > 200) impact -= 0.2; // Flood impact
    if (conditions.temperature > 35) impact -= 0.25; // Heat stress

    return baseYield * (1 + impact);
  }

  calculateCropStressLevel(conditions, crop) {
    let stress = 0;
    
    if (conditions.temperature > 30) stress += 0.3;
    if (conditions.rainfall < 30) stress += 0.4;
    if (conditions.rainfall > 150) stress += 0.3;
    if (conditions.humidity > 80) stress += 0.2;

    if (stress > 0.7) return 'severe';
    if (stress > 0.4) return 'moderate';
    return 'low';
  }

  getAdaptationNeeds(scenario, crop) {
    const needs = {
      drought: ['drought-resistant varieties', 'improved irrigation', 'soil moisture conservation'],
      flood: ['flood-tolerant varieties', 'drainage systems', 'raised beds'],
      heat_wave: ['heat-tolerant varieties', 'shade structures', 'increased irrigation']
    };

    return needs[scenario] || ['monitor conditions closely'];
  }

  calculateScenarioRisk(cropImpacts) {
    const avgYieldImpact = cropImpacts.reduce((sum, impact) => sum + impact.yieldImpact, 0) / cropImpacts.length;
    const avgStress = cropImpacts.reduce((sum, impact) => sum + (impact.stressLevel === 'severe' ? 2 : impact.stressLevel === 'moderate' ? 1 : 0), 0) / cropImpacts.length;
    
    if (avgYieldImpact < 0.3 || avgStress > 1.5) return 'high';
    if (avgYieldImpact < 0.6 || avgStress > 0.8) return 'medium';
    return 'low';
  }

  getClimateAdaptationRecommendations(scenarios) {
    let recommendations = [];
    
    scenarios.forEach(scenario => {
      if (scenario.overallRisk === 'high') {
        recommendations.push(`Prepare for ${scenario.name} scenario`);
        scenario.cropImpacts.forEach(impact => {
          recommendations.push(...impact.adaptationNeeds);
        });
      }
    });

    return [...new Set(recommendations)];
  }

  // Setup API routes
  setupRoutes(app) {
    // Create digital twin
    app.post('/api/v1/digital-twin', async (req, res) => {
      try {
        const { farmId, configuration } = req.body;
        let result = await this.createDigitalTwin(farmId, configuration);
        res.json(result);
      } catch (error) {
        logger.error('Failed to create digital twin', { error: error.message });
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Update digital twin
    app.put('/api/v1/digital-twin/:twinId', async (req, res) => {
      try {
        const { twinId } = req.params;
        let result = await this.updateDigitalTwin(twinId, req.body);
        res.json(result);
      } catch (error) {
        logger.error('Failed to update digital twin', { error: error.message });
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Ingest sensor data
    app.post('/api/v1/digital-twin/:twinId/sensor-data', async (req, res) => {
      try {
        const { twinId } = req.params;
        let result = await this.ingestSensorData(twinId, req.body);
        res.json(result);
      } catch (error) {
        logger.error('Failed to ingest sensor data', { error: error.message });
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Run simulation
    app.post('/api/v1/digital-twin/:twinId/simulate', async (req, res) => {
      try {
        const { twinId } = req.params;
        const { modelType } = req.body;
        let result = await this.runSimulation(twinId, modelType);
        res.json(result);
      } catch (error) {
        logger.error('Failed to run simulation', { error: error.message });
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get digital twin state
    app.get('/api/v1/digital-twin/:twinId', async (req, res) => {
      try {
        const { twinId } = req.params;
        let twin = this.activeTwins.get(twinId);
        
        if (!twin) {
          return res.status(404).json({ success: false, error: 'Digital twin not found' });
        }

        res.json({
          success: true,
          twin: {
            id: twin.id,
            farmId: twin.farm_id,
            name: twin.name,
            state: twin.state,
            lastUpdate: twin.lastUpdate
          }
        });
      } catch (error) {
        logger.error('Failed to get digital twin', { error: error.message });
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // List all digital twins
    app.get('/api/v1/digital-twin', async (req, res) => {
      try {
        const twins = Array.from(this.activeTwins.values()).map(twin => ({
          id: twin.id,
          farmId: twin.farm_id,
          name: twin.name,
          farmName: twin.farm_name,
          location: twin.location,
          lastUpdate: twin.lastUpdate,
          state: twin.state
        }));

        res.json({
          success: true,
          twins
        });
      } catch (error) {
        logger.error('Failed to list digital twins', { error: error.message });
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get simulation results
    app.get('/api/v1/digital-twin/:twinId/simulations', async (req, res) => {
      try {
        const { twinId } = req.params;
        const { limit = 10 } = req.query;

        let result = await getPostgreSQL().query(`
          SELECT model_type, result, timestamp
          FROM simulation_results
          WHERE twin_id = $1
          ORDER BY timestamp DESC
          LIMIT $2
        `, [twinId, limit]);

        res.json({
          success: true,
          simulations: result.rows
        });
      } catch (error) {
        logger.error('Failed to get simulation results', { error: error.message });
        res.status(500).json({ success: false, error: error.message });
      }
    });
  }
}

module.exports = new DigitalTwinService();


