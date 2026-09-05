// Service for Poultry Management (M072) - AI Enhanced
// Comprehensive poultry management with AI-powered analytics and recommendations
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus, SIGNAL, SEVERITY } = require('../../core/signalBus');

// Poultry flock CRUD
async function registerPoultryFlock(flockData) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { flockName, birdType, birdCount, location, farmId, averageEggProduction, healthStatus } = flockData;
  
  const res = await pg.query(
    `INSERT INTO poultry_flocks (flock_name, bird_type, bird_count, location, farm_id, average_egg_production, health_status, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', NOW(), NOW())
     RETURNING *`,
    [flockName, birdType, birdCount, JSON.stringify(location), farmId, averageEggProduction, healthStatus]
  );
  
  signalBus.emitSignal(SIGNAL.ORGANIZATION_CREATED, {
    entityType: 'poultry_flock',
    flockId: res.rows[0].id,
    flockName,
    birdType,
    birdCount
  }, {
    severity: SEVERITY.INFO,
    source: 'poultry_management_service',
    entityId: res.rows[0].id
  });
  
  return res.rows[0];
}

async function getPoultryFlock(flockId) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  let res = await pg.query('SELECT * FROM poultry_flocks WHERE id = $1', [flockId]);
  return res.rows[0] || null;
}

async function listPoultryFlocks({ page = 1, limit = 20, farmId, birdType, status } = {}) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM poultry_flocks WHERE 1=1';
  const params = [];
  let paramIndex = 1;
  
  if (farmId) {
    query += ` AND farm_id = $${paramIndex++}`;
    params.push(farmId);
  }
  if (birdType) {
    query += ` AND bird_type = $${paramIndex++}`;
    params.push(birdType);
  }
  if (status) {
    query += ` AND status = $${paramIndex++}`;
    params.push(status);
  }
  
  query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);
  
  let res = await pg.query(query, params);
  const totalRes = await pg.query(query.replace(`SELECT * FROM poultry_flocks`, 'SELECT COUNT(*) FROM poultry_flocks').split('LIMIT')[0], params.slice(0, -2));
  const total = parseInt(totalRes.rows[0].count || '0');
  
  return { items: res.rows, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } };
}

async function updatePoultryFlock(flockId, updates) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { flockName, birdType, birdCount, location, averageEggProduction, healthStatus, status } = updates;
  
  let res = await pg.query(
    `UPDATE poultry_flocks 
     SET flock_name = COALESCE($1, flock_name),
         bird_type = COALESCE($2, bird_type),
         bird_count = COALESCE($3, bird_count),
         location = COALESCE($4, location),
         average_egg_production = COALESCE($5, average_egg_production),
         health_status = COALESCE($6, health_status),
         status = COALESCE($7, status),
         updated_at = NOW()
     WHERE id = $8
     RETURNING *`,
    [flockName, birdType, birdCount, location ? JSON.stringify(location) : null, averageEggProduction, healthStatus, status, flockId]
  );
  
  signalBus.emitSignal(SIGNAL.ORGANIZATION_UPDATED, {
    entityType: 'poultry_flock',
    flockId,
    action: 'updated'
  }, {
    severity: SEVERITY.INFO,
    source: 'poultry_management_service',
    entityId: flockId
  });
  
  return res.rows[0] || null;
}

// AI-powered egg production analysis
async function analyzeEggProduction(flockId) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const flock = await getPoultryFlock(flockId);
  if (!flock) {
    return { success: false, error: 'Flock not found' };
  }
  
  const analysis = {
    flockId,
    flockName: flock.flock_name,
    productionCategory: categorizeProduction(flock.average_egg_production),
    efficiencyScore: calculateEfficiencyScore(flock),
    projectedDailyYield: calculateProjectedYield(flock),
    feedOptimization: generateFeedOptimization(flock),
    healthRecommendations: generateHealthRecommendations(flock),
    environmentalAlerts: generateEnvironmentalAlerts(flock)
  };
  
  return { success: true, data: analysis };
}

function categorizeProduction(avgProduction) {
  if (!avgProduction) return 'unknown';
  if (avgProduction < 50) return 'low';
  if (avgProduction < 80) return 'medium';
  if (avgProduction < 100) return 'high';
  return 'very_high';
}

function calculateEfficiencyScore(flock) {
  let score = 0;
  if (flock.bird_count && flock.bird_count > 100) score += 20;
  if (flock.average_egg_production && flock.average_egg_production > 70) score += 30;
  if (flock.health_status === 'healthy') score += 25;
  return Math.min(score, 100);
}

function calculateProjectedYield(flock) {
  const dailyProduction = (flock.average_egg_production || 0) * (flock.bird_count || 0) / 100;
  return {
    daily: dailyProduction,
    weekly: dailyProduction * 7,
    monthly: dailyProduction * 30
  };
}

function generateFeedOptimization(flock) {
  const recommendations = [];
  if (flock.average_egg_production < 70) {
    recommendations.push({
      type: 'feed',
      message: 'Increase calcium and protein in feed to boost egg production',
      priority: 'high'
    });
  }
  return recommendations;
}

function generateHealthRecommendations(flock) {
  let recommendations = [];
  if (flock.health_status !== 'healthy') {
    recommendations.push({
      type: 'health',
      message: 'Review health protocols and consult veterinarian',
      priority: 'high'
    });
  }
  return recommendations;
}

function generateEnvironmentalAlerts(flock) {
  const alerts = [];
  if (flock.bird_count && flock.bird_count > 500) {
    alerts.push({
      type: 'environment',
      message: 'Large flock requires enhanced ventilation monitoring',
      priority: 'medium'
    });
  }
  return alerts;
}

// Poultry analytics
async function getPoultryAnalytics({ startDate, endDate, farmId } = {}) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let query = `
    SELECT 
      bird_type,
      COUNT(*) as flock_count,
      SUM(bird_count) as total_birds,
      AVG(average_egg_production) as avg_production
    FROM poultry_flocks
    WHERE 1=1
  `;
  let params = [];
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
  
  query += ` GROUP BY bird_type ORDER BY total_birds DESC`;
  
  let res = await pg.query(query, params);
  
  return {
    byBirdType: res.rows,
    totalFlocks: res.rows.reduce((sum, row) => sum + parseInt(row.flock_count), 0),
    totalBirds: res.rows.reduce((sum, row) => sum + parseInt(row.total_birds), 0),
    recommendations: generatePoultryAnalyticsRecommendations(res.rows)
  };
}

function generatePoultryAnalyticsRecommendations(birdData) {
  let recommendations = [];
  const topBirdType = birdData[0];
  if (topBirdType) {
    recommendations.push({
      type: 'resource_allocation',
      message: `Highest concentration of ${topBirdType.bird_type}. Allocate specialized resources.`,
      priority: 'high'
    });
  }
  return recommendations;
}

module.exports = {
  registerPoultryFlock,
  getPoultryFlock,
  listPoultryFlocks,
  updatePoultryFlock,
  analyzeEggProduction,
  getPoultryAnalytics,
};
