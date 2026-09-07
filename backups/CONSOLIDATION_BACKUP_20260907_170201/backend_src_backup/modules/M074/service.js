// Service for Sheep Management (M074) - AI Enhanced
// Comprehensive sheep management with AI-powered analytics and recommendations
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus, SIGNAL, SEVERITY } = require('../../core/signalBus');

async function registerSheepFlock(flockData) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { flockName, breed, sheepCount, location, farmId, averageWoolProduction, meatProductionTarget, healthStatus } = flockData;
  
  const res = await pg.query(
    `INSERT INTO sheep_flocks (flock_name, breed, sheep_count, location, farm_id, average_wool_production, meat_production_target, health_status, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', NOW(), NOW())
     RETURNING *`,
    [flockName, breed, sheepCount, JSON.stringify(location), farmId, averageWoolProduction, meatProductionTarget, healthStatus]
  );
  
  signalBus.emitSignal(SIGNAL.ORGANIZATION_CREATED, {
    entityType: 'sheep_flock',
    flockId: res.rows[0].id,
    flockName,
    breed,
    sheepCount
  }, {
    severity: SEVERITY.INFO,
    source: 'sheep_management_service',
    entityId: res.rows[0].id
  });
  
  return res.rows[0];
}

async function getSheepFlock(flockId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const res = await pg.query('SELECT * FROM sheep_flocks WHERE id = $1', [flockId]);
  return res.rows[0] || null;
}

async function listSheepFlocks({ page = 1, limit = 20, farmId, breed, status } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM sheep_flocks WHERE 1=1';
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
  const totalRes = await pg.query(query.replace(`SELECT * FROM sheep_flocks`, 'SELECT COUNT(*) FROM sheep_flocks').split('LIMIT')[0], params.slice(0, -2));
  const total = parseInt(totalRes.rows[0].count || '0');
  
  return { items: res.rows, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } };
}

async function updateSheepFlock(flockId, updates) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { flockName, breed, sheepCount, location, averageWoolProduction, meatProductionTarget, healthStatus, status } = updates;
  
  const res = await pg.query(
    `UPDATE sheep_flocks 
     SET flock_name = COALESCE($1, flock_name),
         breed = COALESCE($2, breed),
         sheep_count = COALESCE($3, sheep_count),
         location = COALESCE($4, location),
         average_wool_production = COALESCE($5, average_wool_production),
         meat_production_target = COALESCE($6, meat_production_target),
         health_status = COALESCE($7, health_status),
         status = COALESCE($8, status),
         updated_at = NOW()
     WHERE id = $9
     RETURNING *`,
    [flockName, breed, sheepCount, location ? JSON.stringify(location) : null, averageWoolProduction, meatProductionTarget, healthStatus, status, flockId]
  );
  
  signalBus.emitSignal(SIGNAL.ORGANIZATION_UPDATED, {
    entityType: 'sheep_flock',
    flockId,
    action: 'updated'
  }, {
    severity: SEVERITY.INFO,
    source: 'sheep_management_service',
    entityId: flockId
  });
  
  return res.rows[0] || null;
}

async function analyzeSheepProduction(flockId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const flock = await getSheepFlock(flockId);
  if (!flock) {
    return { success: false, error: 'Flock not found' };
  }
  
  const analysis = {
    flockId,
    flockName: flock.flock_name,
    productionCategory: categorizeProduction(flock.average_wool_production),
    efficiencyScore: calculateEfficiencyScore(flock),
    feedOptimization: generateFeedOptimization(flock),
    breedingRecommendations: generateBreedingRecommendations(flock),
    healthAlerts: generateHealthAlerts(flock)
  };
  
  return { success: true, data: analysis };
}

function categorizeProduction(avgProduction) {
  if (!avgProduction) return 'unknown';
  if (avgProduction < 2) return 'low';
  if (avgProduction < 4) return 'medium';
  return 'high';
}

function calculateEfficiencyScore(flock) {
  let score = 0;
  if (flock.sheep_count && flock.sheep_count > 30) score += 20;
  if (flock.average_wool_production && flock.average_wool_production > 3) score += 30;
  if (flock.health_status === 'healthy') score += 25;
  return Math.min(score, 100);
}

function generateFeedOptimization(flock) {
  const recommendations = [];
  if (flock.average_wool_production < 3) {
    recommendations.push({
      type: 'feed',
      message: 'Increase protein in feed to improve wool quality',
      priority: 'high'
    });
  }
  return recommendations;
}

function generateBreedingRecommendations(flock) {
  const recommendations = [];
  if (flock.sheep_count && flock.sheep_count < 25) {
    recommendations.push({
      type: 'breeding',
      message: 'Consider expanding flock size for optimal production',
      priority: 'medium'
    });
  }
  return recommendations;
}

function generateHealthAlerts(flock) {
  const alerts = [];
  if (flock.health_status !== 'healthy') {
    alerts.push({
      type: 'health',
      message: 'Health status requires attention',
      priority: 'high'
    });
  }
  return alerts;
}

async function getSheepAnalytics({ startDate, endDate, farmId } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let query = `
    SELECT 
      breed,
      COUNT(*) as flock_count,
      SUM(sheep_count) as total_sheep,
      AVG(average_wool_production) as avg_production
    FROM sheep_flocks
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
  
  query += ` GROUP BY breed ORDER BY total_sheep DESC`;
  
  const res = await pg.query(query, params);
  
  return {
    byBreed: res.rows,
    totalFlocks: res.rows.reduce((sum, row) => sum + parseInt(row.flock_count), 0),
    totalSheep: res.rows.reduce((sum, row) => sum + parseInt(row.total_sheep), 0),
    recommendations: generateSheepAnalyticsRecommendations(res.rows)
  };
}

function generateSheepAnalyticsRecommendations(breedData) {
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
  registerSheepFlock,
  getSheepFlock,
  listSheepFlocks,
  updateSheepFlock,
  analyzeSheepProduction,
  getSheepAnalytics,
};
