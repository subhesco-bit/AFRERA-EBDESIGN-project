/**
 * M029: Digital Twin Service
 * Creates and manages digital twins of farms, crops, and agricultural assets
 * for simulation, monitoring, and optimization
 */

const db = require('../database/connection');
const logger = require('../utils/logger');
const iotService = require('./iotIntegrationService');

class DigitalTwinService {
  constructor() {
    this.serviceName = 'DigitalTwinService';
    this.activeTwins = new Map();
    this.simulationInterval = 60000; // 1 minute
  }

  /**
   * Create digital twin for farm
   */
  async createFarmDigitalTwin(farmData) {
    try {
      const {
        farmId,
        farmerId,
        name,
        location,
        area,
        soilType,
        climateZone,
        initialConditions
      } = farmData;

      // Verify farm exists
      const farm = await this.verifyFarm(farmId);
      if (!farm) {
        return {
          success: false,
          error: 'Farm not found',
          farmId
        };
      }

      // Create digital twin record
      const query = `
        INSERT INTO digital_twins (
          twin_id, entity_type, entity_id, owner_id,
          name, location, specifications, status,
          created_at, last_synced
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', NOW(), NOW())
        RETURNING twin_id, entity_id, status
      `;

      const twinId = this.generateTwinId();
      const specifications = {
        area,
        soilType,
        climateZone,
        initialConditions,
        syncInterval: this.simulationInterval,
        modelVersion: '1.0'
      };

      const result = await db.query(query, [
        twinId, 'farm', farmId, farmerId, name, location,
        JSON.stringify(specifications)
      ]);

      // Initialize twin state
      const twinState = this.initializeTwinState('farm', specifications);
      this.activeTwins.set(twinId, twinState);

      // Start sync process
      this.startTwinSync(twinId, farmId);

      return {
        success: true,
        data: {
          twinId: result.rows[0].twin_id,
          entityId: result.rows[0].entity_id,
          status: result.rows[0].status,
          initialState: twinState,
          createdAt: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error(`${this.serviceName} - createFarmDigitalTwin error:`, error);
      return {
        success: false,
        error: 'Failed to create farm digital twin',
        details: error.message
      };
    }
  }

  /**
   * Create digital twin for crop
   */
  async createCropDigitalTwin(cropData) {
    try {
      const {
        cropId,
        farmerId,
        cropType,
        variety,
        plantingDate,
        location,
        fieldConditions
      } = cropData;

      const crop = await this.verifyCrop(cropId);
      if (!crop) {
        return {
          success: false,
          error: 'Crop not found',
          cropId
        };
      }

      const query = `
        INSERT INTO digital_twins (
          twin_id, entity_type, entity_id, owner_id,
          name, location, specifications, status,
          created_at, last_synced
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', NOW(), NOW())
        RETURNING twin_id, entity_id, status
      `;

      const twinId = this.generateTwinId();
      const specifications = {
        cropType,
        variety,
        plantingDate,
        fieldConditions,
        growthStage: 'seedling',
        expectedYield: this.calculateExpectedYield(cropType, fieldConditions),
        modelVersion: '1.0'
      };

      const result = await db.query(query, [
        twinId, 'crop', cropId, farmerId,
        `${cropType} - ${variety}`, location,
        JSON.stringify(specifications)
      ]);

      const twinState = this.initializeTwinState('crop', specifications);
      this.activeTwins.set(twinId, twinState);

      return {
        success: true,
        data: {
          twinId: result.rows[0].twin_id,
          entityId: result.rows[0].entity_id,
          status: result.rows[0].status,
          initialState: twinState,
          createdAt: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error(`${this.serviceName} - createCropDigitalTwin error:`, error);
      return {
        success: false,
        error: 'Failed to create crop digital twin',
        details: error.message
      };
    }
  }

  /**
   * Sync digital twin with real-world data
   */
  async syncDigitalTwin(twinId) {
    try {
      const twin = await this.getTwinById(twinId);
      if (!twin) {
        return {
          success: false,
          error: 'Digital twin not found',
          twinId
        };
      }

      // Get real-world data based on entity type
      const realWorldData = await this.getRealWorldData(twin);
      
      // Update twin state
      const updatedState = this.updateTwinState(twin, realWorldData);
      
      // Store updated state
      await this.storeTwinState(twinId, updatedState);
      
      // Update cache
      this.activeTwins.set(twinId, updatedState);

      // Update last synced timestamp
      await this.updateSyncTimestamp(twinId);

      return {
        success: true,
        data: {
          twinId,
          syncTimestamp: new Date().toISOString(),
          stateChanges: this.calculateStateChanges(
            this.activeTwins.get(twinId),
            updatedState
          ),
          dataPoints: Object.keys(realWorldData).length
        }
      };
    } catch (error) {
      logger.error(`${this.serviceName} - syncDigitalTwin error:`, error);
      return {
        success: false,
        error: 'Failed to sync digital twin',
        details: error.message
      };
    }
  }

  /**
   * Run simulation on digital twin
   */
  async runSimulation(twinId, simulationConfig) {
    try {
      const twin = await this.getTwinById(twinId);
      if (!twin) {
        return {
          success: false,
          error: 'Digital twin not found',
          twinId
        };
      }

      const currentState = this.activeTwins.get(twinId) || 
                           await this.getLatestTwinState(twinId);

      // Run simulation based on configuration
      const simulationResults = this.executeSimulation(
        currentState,
        simulationConfig
      );

      // Store simulation results
      await this.storeSimulationResults(twinId, simulationResults);

      return {
        success: true,
        data: {
          twinId,
          simulationId: simulationResults.id,
          simulationType: simulationConfig.type,
          results: simulationResults,
          executedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error(`${this.serviceName} - runSimulation error:`, error);
      return {
        success: false,
        error: 'Failed to run simulation',
        details: error.message
      };
    }
  }

  /**
   * Get twin by ID
   */
  async getTwinById(twinId) {
    const query = `
      SELECT twin_id, entity_type, entity_id, owner_id,
             name, location, specifications, status,
             created_at, last_synced
      FROM digital_twins
      WHERE twin_id = $1
    `;

    const result = await db.query(query, [twinId]);
    return result.rows[0];
  }

  /**
   * Get real-world data for sync
   */
  async getRealWorldData(twin) {
    const { entity_type, entity_id, owner_id, specifications } = twin;

    let realWorldData = {};

    if (entity_type === 'farm') {
      realWorldData = await this.getFarmRealTimeData(entity_id);
    } else if (entity_type === 'crop') {
      realWorldData = await this.getCropRealTimeData(entity_id);
    }

    // Integrate IoT data if available. iot_devices has no entity_id column
    // (see schema-decisions.json, "iot_devices" collision) - it links devices
    // to their owning farmer via farmer_id, the same farmer digital_twins
    // records as owner_id, so that's the real join, not a per-entity one.
    const iotData = await this.getIoTDataForEntity(owner_id);
    if (iotData) {
      realWorldData = { ...realWorldData, iot: iotData };
    }

    return realWorldData;
  }

  /**
   * Get farm real-time data
   */
  async getFarmRealTimeData(farmId) {
    const query = `
      SELECT
        f.area,
        f.soil_type,
        f.current_status,
        COUNT(DISTINCT cp.id) as active_crops,
        COALESCE(SUM(cp.expected_yield_kg), 0) as total_expected_yield
      FROM farms f
      LEFT JOIN crop_plantings cp ON f.id = cp.farm_id AND cp.status = 'active'
      WHERE f.id = $1
      GROUP BY f.id
    `;

    const result = await db.query(query, [farmId]);
    return result.rows[0] || {};
  }

  /**
   * Get crop real-time data. `cropPlantingId` is a crop_plantings row - a
   * specific farmer's planted instance of a catalog crop - not the catalog
   * crops.id itself (see schema-decisions.json's digital_twins entry).
   */
  async getCropRealTimeData(cropPlantingId) {
    const query = `
      SELECT
        cat.common_name as crop_type,
        cp.growth_stage,
        cp.current_health,
        cp.expected_yield_kg as estimated_yield_kg,
        cp.planting_date,
        cp.expected_harvest_date
      FROM crop_plantings cp
      JOIN crops cat ON cp.crop_id = cat.id
      WHERE cp.id = $1
    `;

    const result = await db.query(query, [cropPlantingId]);
    return result.rows[0] || {};
  }

  /**
   * Get IoT data for the twin's owning farmer
   */
  async getIoTDataForEntity(farmerId) {
    try {
      if (!farmerId) return null;

      // iot_devices links to its owner via farmer_id (see the note in
      // getRealWorldData above) - not a generic entity_id, which does not
      // exist on this table.
      const query = `
        SELECT device_id, device_type, last_active
        FROM iot_devices
        WHERE farmer_id = $1 AND status = 'active'
      `;

      const result = await db.query(query, [farmerId]);
      
      if (result.rows.length === 0) return null;
      
      // Get recent sensor data
      const sensorData = await Promise.all(
        result.rows.map(async (device) => {
          const recentData = await iotService.getRecentDeviceData(device.device_id, 1);
          return {
            deviceId: device.device_id,
            deviceType: device.device_type,
            lastActive: device.last_active,
            recentReadings: recentData.slice(0, 5)
          };
        })
      );
      
      return sensorData;
    } catch (error) {
      logger.error('Error getting IoT data:', error);
      return null;
    }
  }

  /**
   * Initialize twin state
   */
  initializeTwinState(entityType, specifications) {
    const baseState = {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      syncStatus: 'initialized'
    };

    if (entityType === 'farm') {
      return {
        ...baseState,
        entityType: 'farm',
        area: specifications.area,
        soilHealth: this.assessSoilHealth(specifications.soilType),
        climateConditions: this.getInitialClimateConditions(specifications.climateZone),
        resourceLevels: {
          water: 100,
          nutrients: 100,
            energy: 100
        },
        activityLevel: 'normal'
      };
    } else if (entityType === 'crop') {
      return {
        ...baseState,
        entityType: 'crop',
        growthStage: specifications.growthStage,
        healthStatus: 'healthy',
        biomass: this.calculateInitialBiomass(specifications.growthStage),
        stressFactors: [],
        predictedYield: specifications.expectedYield
      };
    }

    return baseState;
  }

  /**
   * Update twin state
   */
  updateTwinState(twin, realWorldData) {
    const currentState = this.activeTwins.get(twin.twin_id) || {};
    const newState = { ...currentState };

    // Update based on entity type
    if (twin.entity_type === 'farm') {
      newState.area = realWorldData.area || newState.area;
      newState.activeCrops = realWorldData.active_crops || 0;
      newState.totalExpectedYield = realWorldData.total_expected_yield || 0;
      
      if (realWorldData.iot) {
        newState.resourceLevels = this.updateResourceLevels(
          newState.resourceLevels,
          realWorldData.iot
        );
      }
    } else if (twin.entity_type === 'crop') {
      newState.growthStage = realWorldData.growth_stage || newState.growthStage;
      newState.healthStatus = this.assessCropHealth(realWorldData.current_health);
      newState.estimatedYield = realWorldData.estimated_yield_kg || newState.predictedYield;
      
      if (realWorldData.iot) {
        newState.stressFactors = this.identifyStressFactors(realWorldData.iot);
      }
    }

    newState.lastUpdated = new Date().toISOString();
    newState.syncStatus = 'synced';

    return newState;
  }

  /**
   * Execute simulation
   */
  executeSimulation(currentState, config) {
    const simulationId = this.generateSimulationId();
    const results = {
      id: simulationId,
      type: config.type,
      timestamp: new Date().toISOString(),
      initialState: { ...currentState },
      scenarios: []
    };

    switch (config.type) {
      case 'yield_prediction':
        results.scenarios = this.simulateYieldPrediction(currentState, config);
        break;
      case 'resource_optimization':
        results.scenarios = this.simulateResourceOptimization(currentState, config);
        break;
      case 'climate_impact':
        results.scenarios = this.simulateClimateImpact(currentState, config);
        break;
      default:
        results.scenarios = this.simulateGeneric(currentState, config);
    }

    return results;
  }

  /**
   * Simulate yield prediction
   */
  simulateYieldPrediction(state, config) {
    const scenarios = [];
    const baseYield = state.predictedYield || 1000;
    
    // Different scenarios
    const scenarios_config = [
      { name: 'Optimal', multiplier: 1.2, conditions: 'ideal_conditions' },
      { name: 'Normal', multiplier: 1.0, conditions: 'current_conditions' },
      { name: 'Suboptimal', multiplier: 0.8, conditions: 'stress_conditions' },
      { name: 'Poor', multiplier: 0.6, conditions: 'adverse_conditions' }
    ];

    scenarios_config.forEach(scenario => {
      scenarios.push({
        name: scenario.name,
        predictedYield: Math.round(baseYield * scenario.multiplier),
        confidence: this.calculateScenarioConfidence(scenario.conditions),
        factors: this.getImpactFactors(scenario.conditions)
      });
    });

    return scenarios;
  }

  /**
   * Simulate resource optimization
   */
  simulateResourceOptimization(state, config) {
    const scenarios = [];
    const currentResources = state.resourceLevels || { water: 100, nutrients: 100, energy: 100 };

    scenarios.push({
      name: 'Current Usage',
      resources: { ...currentResources },
      efficiency: 0.75,
      cost: this.calculateResourceCost(currentResources)
    });

    scenarios.push({
      name: 'Optimized Usage',
      resources: {
        water: currentResources.water * 0.85,
        nutrients: currentResources.nutrients * 0.90,
        energy: currentResources.energy * 0.80
      },
      efficiency: 0.92,
      cost: this.calculateResourceCost({
        water: currentResources.water * 0.85,
        nutrients: currentResources.nutrients * 0.90,
        energy: currentResources.energy * 0.80
      }),
      savings: 15
    });

    return scenarios;
  }

  /**
   * Simulate climate impact
   */
  simulateClimateImpact(state, config) {
    const scenarios = [];
    const climateScenarios = [
      { name: 'Normal Rainfall', rainfall: 'normal', impact: 0 },
      { name: 'Drought Conditions', rainfall: 'low', impact: -0.25 },
      { name: 'Excess Rainfall', rainfall: 'high', impact: -0.15 },
      { name: 'Optimal Conditions', rainfall: 'optimal', impact: 0.15 }
    ];

    climateScenarios.forEach(scenario => {
      scenarios.push({
        name: scenario.name,
        rainfallPattern: scenario.rainfall,
        yieldImpact: scenario.impact,
        recommendations: this.getClimateRecommendations(scenario.rainfall)
      });
    });

    return scenarios;
  }

  /**
   * Generic simulation
   */
  simulateGeneric(state, config) {
    return [{
      name: 'Basic Scenario',
      parameters: config.parameters || {},
      outcome: 'Simulation executed',
      confidence: 0.7
    }];
  }

  /**
   * Helper methods
   */
  verifyFarm(farmId) {
    return db.query('SELECT id FROM farms WHERE id = $1', [farmId])
      .then(result => result.rows[0]);
  }

  // cropId here is a crop_plantings.id (a specific planted instance), not the
  // crops catalog id - see the getCropRealTimeData comment above.
  verifyCrop(cropId) {
    return db.query('SELECT id FROM crop_plantings WHERE id = $1', [cropId])
      .then(result => result.rows[0]);
  }

  generateTwinId() {
    return `twin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateSimulationId() {
    return `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  calculateExpectedYield(cropType, conditions) {
    const baseYields = {
      'rice': 5000,
      'wheat': 3500,
      'maize': 4000,
      'vegetables': 2000
    };
    return baseYields[cropType] || 3000;
  }

  assessSoilHealth(soilType) {
    const healthMap = {
      'loam': 0.9,
      'clay': 0.75,
      'sandy': 0.7,
      'silt': 0.8
    };
    return healthMap[soilType] || 0.75;
  }

  getInitialClimateConditions(climateZone) {
    return {
      temperature: 25,
      humidity: 70,
      rainfall: 'normal',
      zone: climateZone
    };
  }

  calculateInitialBiomass(growthStage) {
    const biomassMap = {
      'seedling': 0.1,
      'vegetative': 0.4,
      'flowering': 0.7,
      'maturity': 1.0
    };
    return biomassMap[growthStage] || 0.5;
  }

  assessCropHealth(healthStatus) {
    return healthStatus || 'healthy';
  }

  updateResourceLevels(currentLevels, iotData) {
    const updated = { ...currentLevels };
    
    iotData.forEach(device => {
      device.recentReadings.forEach(reading => {
        if (reading.sensorType === 'soil_moisture') {
          updated.water = Math.min(100, reading.value);
        }
        if (reading.sensorType === 'nutrient_level') {
          updated.nutrients = Math.min(100, reading.value);
        }
      });
    });
    
    return updated;
  }

  identifyStressFactors(iotData) {
    const factors = [];
    
    iotData.forEach(device => {
      device.recentReadings.forEach(reading => {
        if (reading.quality === 'out_of_range') {
          factors.push({
            type: reading.sensorType,
            severity: 'warning',
            value: reading.value
          });
        }
      });
    });
    
    return factors;
  }

  calculateStateChanges(oldState, newState) {
    const changes = [];
    
    Object.keys(newState).forEach(key => {
      if (JSON.stringify(oldState[key]) !== JSON.stringify(newState[key])) {
        changes.push({
          field: key,
          oldValue: oldState[key],
          newValue: newState[key]
        });
      }
    });
    
    return changes;
  }

  calculateScenarioConfidence(conditions) {
    const confidenceMap = {
      'ideal_conditions': 0.9,
      'current_conditions': 0.8,
      'stress_conditions': 0.7,
      'adverse_conditions': 0.6
    };
    return confidenceMap[conditions] || 0.7;
  }

  getImpactFactors(conditions) {
    return {
      weather: 0.3,
      soil: 0.25,
      management: 0.25,
      variety: 0.2
    };
  }

  calculateResourceCost(resources) {
    const costs = {
      water: 0.05,
      nutrients: 0.15,
      energy: 0.10
    };
    
    return Object.keys(resources).reduce((total, key) => {
      return total + (resources[key] * costs[key]);
    }, 0);
  }

  getClimateRecommendations(rainfall) {
    const recommendations = {
      'normal': ['Continue current irrigation schedule'],
      'low': ['Increase irrigation frequency', 'Consider drought-resistant varieties'],
      'high': ['Reduce irrigation', 'Improve drainage', 'Monitor for fungal diseases'],
      'optimal': ['Maintain current practices', 'Monitor for pests']
    };
    return recommendations[rainfall] || ['Monitor conditions closely'];
  }

  storeTwinState(twinId, state) {
    return db.query(
      `UPDATE digital_twins SET current_state = $2, last_synced = NOW() WHERE twin_id = $1`,
      [twinId, JSON.stringify(state)]
    );
  }

  storeSimulationResults(twinId, results) {
    return db.query(
      `INSERT INTO twin_simulations (twin_id, simulation_id, results, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [twinId, results.id, JSON.stringify(results)]
    );
  }

  getLatestTwinState(twinId) {
    return db.query(
      `SELECT entity_type, specifications, current_state FROM digital_twins WHERE twin_id = $1`,
      [twinId]
    ).then(result => {
      const row = result.rows[0];
      if (!row) return this.initializeTwinState('farm', {});
      if (row.current_state) return row.current_state;
      return this.initializeTwinState(row.entity_type || 'farm', row.specifications || {});
    });
  }

  updateSyncTimestamp(twinId) {
    return db.query(
      `UPDATE digital_twins SET last_synced = NOW() WHERE twin_id = $1`,
      [twinId]
    );
  }

  startTwinSync(twinId, entityId) {
    // Start periodic sync (implementation depends on your scheduling system)
    logger.info(`Started sync for twin ${twinId} (entity: ${entityId})`);
  }

  getActiveTwinsCount() {
    return this.activeTwins.size;
  }
}

module.exports = new DigitalTwinService();