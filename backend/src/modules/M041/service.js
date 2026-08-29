/**
 * Village Registry Service (M041)
 * Comprehensive village and community management with AI-powered development index
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/legacy/aiService');
const pool = require('../../database/pool');

async function createVillage(villageData) {
  try {
    const {
      village_name,
      village_code,
      district,
      state,
      block,
      tehsil,
      gram_panchayat,
      population,
      households,
      area_sq_km,
      coordinates,
      elevation,
      climate_zone,
      soil_type,
      water_sources,
      infrastructure,
      agricultural_land_area,
      major_crops,
      livestock_count
    } = villageData;

    const village = {
      village_id: generateId(),
      village_name,
      village_code,
      district,
      state,
      block,
      tehsil,
      gram_panchayat,
      population,
      households,
      area_sq_km,
      coordinates: coordinates || {},
      elevation,
      climate_zone,
      soil_type,
      water_sources: water_sources || [],
      infrastructure: infrastructure || {},
      agricultural_land_area,
      major_crops: major_crops || [],
      livestock_count: livestock_count || {},
      status: 'active',
      created_at: new Date().toISOString()
    };

    // AI-powered development index calculation
    const aiRequest = {
      task: 'village_development_index',
      parameters: {
        village_data: villageData,
        infrastructure_score: await calculateInfrastructureScore(infrastructure),
        resource_availability: await assessResourceAvailability(water_sources),
        agricultural_potential: await assessAgriculturalPotential(agricultural_land_area, major_crops),
        demographic_indicators: await calculateDemographicIndicators(population, households)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    village.ai_development_index = aiResponse.development_index;

    const result = await pool.query(
      `INSERT INTO villages 
       (village_id, village_name, village_code, district, state, block, tehsil, gram_panchayat, 
        population, households, area_sq_km, coordinates, elevation, climate_zone, soil_type, 
        water_sources, infrastructure, agricultural_land_area, major_crops, livestock_count, 
        ai_development_index, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
       RETURNING *`,
      [
        village.village_id, village.village_name, village.village_code, village.district,
        village.state, village.block, village.tehsil, village.gram_panchayat, village.population,
        village.households, village.area_sq_km, JSON.stringify(village.coordinates),
        village.elevation, village.climate_zone, village.soil_type,
        JSON.stringify(village.water_sources), JSON.stringify(village.infrastructure),
        village.agricultural_land_area, JSON.stringify(village.major_crops),
        JSON.stringify(village.livestock_count), village.ai_development_index,
        village.status, village.created_at
      ]
    );

    logger.info(`Village created: ${village.village_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating village', { error: error.message, stack: error.stack });
    throw new Error('Failed to create village');
  }
}

async function addVillageResource(villageId, resourceData) {
  try {
    const {
      resource_type,
      resource_name,
      capacity,
      current_utilization,
      condition,
      last_maintenance_date,
      next_maintenance_date,
      responsible_person
    } = resourceData;

    const resource = {
      resource_id: generateId(),
      village_id: villageId,
      resource_type,
      resource_name,
      capacity,
      current_utilization,
      condition,
      last_maintenance_date,
      next_maintenance_date,
      responsible_person,
      created_at: new Date().toISOString()
    };

    const result = await pool.query(
      `INSERT INTO village_resources 
       (resource_id, village_id, resource_type, resource_name, capacity, current_utilization, 
        condition, last_maintenance_date, next_maintenance_date, responsible_person, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        resource.resource_id, resource.village_id, resource.resource_type, resource.resource_name,
        resource.capacity, resource.current_utilization, resource.condition,
        resource.last_maintenance_date, resource.next_maintenance_date,
        resource.responsible_person, resource.created_at
      ]
    );

    logger.info(`Village resource added: ${resource.resource_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error adding village resource', { error: error.message, stack: error.stack });
    throw new Error('Failed to add village resource');
  }
}

async function getVillageAnalytics(villageId) {
  try {
    const village = await pool.query('SELECT * FROM villages WHERE village_id = $1', [villageId]);
    if (village.rows.length === 0) {
      throw new Error('Village not found');
    }

    const resources = await pool.query('SELECT * FROM village_resources WHERE village_id = $1', [villageId]);

    const analytics = {
      village_id: villageId,
      village_info: village.rows[0],
      resource_summary: {
        total_resources: resources.rows.length,
        by_type: getResourceTypeSummary(resources.rows),
        utilization_rate: calculateAverageUtilization(resources.rows),
        maintenance_status: getMaintenanceStatus(resources.rows)
      },
      development_metrics: {
        development_index: village.rows[0].ai_development_index,
        infrastructure_score: await calculateInfrastructureScore(village.rows[0].infrastructure),
        agricultural_potential: await assessAgriculturalPotential(
          village.rows[0].agricultural_land_area,
          village.rows[0].major_crops
        )
      },
      ai_insights: await generateVillageInsights(village.rows[0], resources.rows)
    };

    return analytics;
  } catch (error) {
    logger.error('Error getting village analytics', { error: error.message, stack: error.stack });
    throw new Error('Failed to get village analytics');
  }
}

function generateId() {
  return `VIL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function calculateInfrastructureScore(infrastructure) {
  if (!infrastructure) return 50;
  
  let score = 0;
  const features = ['roads', 'electricity', 'water_supply', 'healthcare', 'education', 'internet'];
  
  features.forEach(feature => {
    if (infrastructure[feature]) score += 16.67;
  });

  return Math.min(score, 100);
}

async function assessResourceAvailability(waterSources) {
  if (!waterSources || waterSources.length === 0) return 30;
  return waterSources.length * 20;
}

async function assessAgriculturalPotential(landArea, crops) {
  if (!landArea) return 0;
  let score = Math.min(landArea * 10, 50);
  if (crops && crops.length > 0) score += 20;
  return Math.min(score, 100);
}

async function calculateDemographicIndicators(population, households) {
  return {
    population_density: households > 0 ? population / households : 0,
    household_size: households > 0 ? population / households : 0
  };
}

function getResourceTypeSummary(resources) {
  const summary = {};
  resources.forEach(resource => {
    summary[resource.resource_type] = (summary[resource.resource_type] || 0) + 1;
  });
  return summary;
}

function calculateAverageUtilization(resources) {
  if (resources.length === 0) return 0;
  const total = resources.reduce((sum, r) => sum + (r.current_utilization || 0), 0);
  return total / resources.length;
}

function getMaintenanceStatus(resources) {
  const needsMaintenance = resources.filter(r => r.condition === 'poor').length;
  const wellMaintained = resources.filter(r => r.condition === 'good').length;
  
  return {
    needs_maintenance: needsMaintenance,
    well_maintained: wellMaintained,
    overall_status: needsMaintenance > resources.length / 2 ? 'attention_needed' : 'good'
  };
}

async function generateVillageInsights(village, resources) {
  const aiRequest = {
    task: 'village_analytics_insights',
    parameters: {
      village_data: village,
      resource_data: resources,
      development_index: village.ai_development_index
    }
  };

  const aiResponse = await aiAPI.generateRecommendation(aiRequest);
  return aiResponse;
}

module.exports = {
  createVillage,
  addVillageResource,
  getVillageAnalytics
};
