// Service for Pig Management (M075) - AI Enhanced
// Comprehensive pig management with AI-powered analytics and recommendations
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus, SIGNAL, SEVERITY } = require('../../core/signalBus');

async function registerPigHerd(herdData) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { herdName, breed, pigCount, location, farmId, averageWeightGain, meatProductionTarget, healthStatus } = herdData;
  
  const res = await pg.query(
    `INSERT INTO pig_herds (herd_name, breed, pig_count, location, farm_id, average_weight_gain, meat_production_target, health_status, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', NOW(), NOW())
     RETURNING *`,
    [herdName, breed, pigCount, JSON.stringify(location), farmId, averageWeightGain, meatProductionTarget, healthStatus]
  );
  
  signalBus.emitSignal(SIGNAL.ORGANIZATION_CREATED, {
    entityType: 'pig_herd',
    herdId: res.rows[0].id,
    herdName,
    breed,
    pigCount
  }, {
    severity: SEVERITY.INFO,
    source: 'pig_management_service',
    entityId: res.rows[0].id
  });
  
  return res.rows[0];
}

async function getPigHerd(herdId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const res = await pg.query('SELECT * FROM pig_herds WHERE id = $1', [herdId]);
  return res.rows[0] || null;
}

async function listPigHerds({ page = 1, limit = 20, farmId, breed, status } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM pig_herds WHERE 1=1';
  const params = [];
  let paramIndex = 1;
  
  if (farmId) {
    query += ` AND farm_id = $${paramIndex++}`;
    params.push(farmId);
  }
  if (breed) {
    query += ` AND breed = $${paramIndex++}`;
    params.push(breed);
  }
  if (status) {
    query += ` AND status = $${paramIndex++}`;
    params.push(status);
  }
  
  query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);
  
  const res = await pg.query(query, params);
  const totalRes = await pg.query(query.replace(`SELECT * FROM pig_herds`, 'SELECT COUNT(*) FROM pig_herds').split('LIMIT')[0], params.slice(0, -2));
  const total = parseInt(totalRes.rows[0].count || '0');
  
  return { items: res.rows, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } };
}

async function updatePigHerd(herdId, updates) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { herdName, breed, pigCount, location, averageWeightGain, meatProductionTarget, healthStatus, status } = updates;
  
  const res = await pg.query(
    `UPDATE pig_herds 
     SET herd_name = COALESCE($1, herd_name),
         breed = COALESCE($2, breed),
         pig_count = COALESCE($3, pig_count),
         location = COALESCE($4, location),
         average_weight_gain = COALESCE($5, average_weight_gain),
         meat_production_target = COALESCE($6, meat_production_target),
         health_status = COALESCE($7, health_status),
         status = COALESCE($8, status),
         updated_at = NOW()
     WHERE id = $9
     RETURNING *`,
    [herdName, breed, pigCount, location ? JSON.stringify(location) : null, averageWeightGain, meatProductionTarget, healthStatus, status, herdId]
  );
  
  signalBus.emitSignal(SIGNAL.ORGANIZATION_UPDATED, {
    entityType: 'pig_herd',
    herdId,
    action: 'updated'
  }, {
    severity: SEVERITY.INFO,
    source: 'pig_management_service',
    entityId: herdId
  });
  
  return res.rows[0] || null;
}

async function analyzePigProduction(herdId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const herd = await getPigHerd(herdId);
  if (!herd) {
    return { success: false, error: 'Herd not found' };
  }
  
  const analysis = {
    herdId,
    herdName: herd.herd_name,
    productionCategory: categorizeProduction(herd.average_weight_gain),
    efficiencyScore: calculateEfficiencyScore(herd),
    feedOptimization: generateFeedOptimization(herd),
    breedingRecommendations: generateBreedingRecommendations(herd),
    healthAlerts: generateHealthAlerts(herd)
  };
  
  return { success: true, data: analysis };
}

function categorizeProduction(avgWeightGain) {
  if (!avgWeightGain) return 'unknown';
  if (avgWeightGain < 0.5) return 'low';
  if (avgWeightGain < 0.8) return 'medium';
  return 'high';
}

function calculateEfficiencyScore(herd) {
  let score = 0;
  if (herd.pig_count && herd.pig_count > 50) score += 20;
  if (herd.average_weight_gain && herd.average_weight_gain > 0.7) score += 30;
  if (herd.health_status === 'healthy') score += 25;
  return Math.min(score, 100);
}

function generateFeedOptimization(herd) {
  const recommendations = [];
  if (herd.average_weight_gain < 0.7) {
    recommendations.push({
      type: 'feed',
      message: 'Increase protein content in feed to improve weight gain',
      priority: 'high'
    });
  }
  return recommendations;
}

function generateBreedingRecommendations(herd) {
  const recommendations = [];
  if (herd.pig_count && herd.pig_count < 40) {
    recommendations.push({
      type: 'breeding',
      message: 'Consider expanding herd size for optimal production',
      priority: 'medium'
    });
  }
  return recommendations;
}

function generateHealthAlerts(herd) {
  const alerts = [];
  if (herd.health_status !== 'healthy') {
    alerts.push({
      type: 'health',
      message: 'Health status requires attention',
      priority: 'high'
    });
  }
  return alerts;
}

async function getPigAnalytics({ startDate, endDate, farmId } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let query = `
    SELECT 
      breed,
      COUNT(*) as herd_count,
      SUM(pig_count) as total_pigs,
      AVG(average_weight_gain) as avg_weight_gain
    FROM pig_herds
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;
  
  if (startDate) {
    query += ` AND created_at >= $${paramIndex++}`;
    params.push(startDate);
  }
  if (endDate) {
    query += ` AND created_at <= $${paramIndex++}`;
    params.push(endDate);
  }
  if (farmId) {
    query += ` AND farm_id = $${paramIndex++}`;
    params.push(farmId);
  }
  
  query += ` GROUP BY breed ORDER BY total_pigs DESC`;
  
  const res = await pg.query(query, params);
  
  return {
    byBreed: res.rows,
    totalHerds: res.rows.reduce((sum, row) => sum + parseInt(row.herd_count), 0),
    totalPigs: res.rows.reduce((sum, row) => sum + parseInt(row.total_pigs), 0),
    recommendations: generatePigAnalyticsRecommendations(res.rows)
  };
}

function generatePigAnalyticsRecommendations(breedData) {
  const recommendations = [];
  const topBreed = breedData[0];
  if (topBreed) {
    recommendations.push({
      type: 'resource_allocation',
      message: `Highest concentration of ${topBreed.breed}. Allocate specialized resources.`,
      priority: 'high'
    });
  }
  return recommendations;
}

module.exports = {
  registerPigHerd,
  getPigHerd,
  listPigHerds,
  updatePigHerd,
  analyzePigProduction,
  getPigAnalytics,
};
