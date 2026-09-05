// Service for Goat Management (M073) - AI Enhanced
// Comprehensive goat management with AI-powered analytics and recommendations
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus, SIGNAL, SEVERITY } = require('../../core/signalBus');

async function registerGoatHerd(herdData) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { herdName, breed, goatCount, location, farmId, averageMilkProduction, meatProductionTarget, healthStatus } = herdData;
  
  const res = await pg.query(
    `INSERT INTO goat_herds (herd_name, breed, goat_count, location, farm_id, average_milk_production, meat_production_target, health_status, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', NOW(), NOW())
     RETURNING *`,
    [herdName, breed, goatCount, JSON.stringify(location), farmId, averageMilkProduction, meatProductionTarget, healthStatus]
  );
  
  signalBus.emitSignal(SIGNAL.ORGANIZATION_CREATED, {
    entityType: 'goat_herd',
    herdId: res.rows[0].id,
    herdName,
    breed,
    goatCount
  }, {
    severity: SEVERITY.INFO,
    source: 'goat_management_service',
    entityId: res.rows[0].id
  });
  
  return res.rows[0];
}

async function getGoatHerd(herdId) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  let res = await pg.query('SELECT * FROM goat_herds WHERE id = $1', [herdId]);
  return res.rows[0] || null;
}

async function listGoatHerds({ page = 1, limit = 20, farmId, breed, status } = {}) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM goat_herds WHERE 1=1';
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
  
  let res = await pg.query(query, params);
  const totalRes = await pg.query(query.replace(`SELECT * FROM goat_herds`, 'SELECT COUNT(*) FROM goat_herds').split('LIMIT')[0], params.slice(0, -2));
  const total = parseInt(totalRes.rows[0].count || '0');
  
  return { items: res.rows, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } };
}

async function updateGoatHerd(herdId, updates) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { herdName, breed, goatCount, location, averageMilkProduction, meatProductionTarget, healthStatus, status } = updates;
  
  let res = await pg.query(
    `UPDATE goat_herds 
     SET herd_name = COALESCE($1, herd_name),
         breed = COALESCE($2, breed),
         goat_count = COALESCE($3, goat_count),
         location = COALESCE($4, location),
         average_milk_production = COALESCE($5, average_milk_production),
         meat_production_target = COALESCE($6, meat_production_target),
         health_status = COALESCE($7, health_status),
         status = COALESCE($8, status),
         updated_at = NOW()
     WHERE id = $9
     RETURNING *`,
    [herdName, breed, goatCount, location ? JSON.stringify(location) : null, averageMilkProduction, meatProductionTarget, healthStatus, status, herdId]
  );
  
  signalBus.emitSignal(SIGNAL.ORGANIZATION_UPDATED, {
    entityType: 'goat_herd',
    herdId,
    action: 'updated'
  }, {
    severity: SEVERITY.INFO,
    source: 'goat_management_service',
    entityId: herdId
  });
  
  return res.rows[0] || null;
}

async function analyzeGoatProduction(herdId) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const herd = await getGoatHerd(herdId);
  if (!herd) {
    return { success: false, error: 'Herd not found' };
  }
  
  const analysis = {
    herdId,
    herdName: herd.herd_name,
    productionCategory: categorizeProduction(herd.average_milk_production),
    efficiencyScore: calculateEfficiencyScore(herd),
    feedOptimization: generateFeedOptimization(herd),
    breedingRecommendations: generateBreedingRecommendations(herd),
    healthAlerts: generateHealthAlerts(herd)
  };
  
  return { success: true, data: analysis };
}

function categorizeProduction(avgProduction) {
  if (!avgProduction) return 'unknown';
  if (avgProduction < 1) return 'low';
  if (avgProduction < 2) return 'medium';
  return 'high';
}

function calculateEfficiencyScore(herd) {
  let score = 0;
  if (herd.goat_count && herd.goat_count > 20) score += 20;
  if (herd.average_milk_production && herd.average_milk_production > 1.5) score += 30;
  if (herd.health_status === 'healthy') score += 25;
  return Math.min(score, 100);
}

function generateFeedOptimization(herd) {
  const recommendations = [];
  if (herd.average_milk_production < 1.5) {
    recommendations.push({
      type: 'feed',
      message: 'Increase nutrient density in feed to boost milk production',
      priority: 'high'
    });
  }
  return recommendations;
}

function generateBreedingRecommendations(herd) {
  let recommendations = [];
  if (herd.goat_count && herd.goat_count < 15) {
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

async function getGoatAnalytics({ startDate, endDate, farmId } = {}) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let query = `
    SELECT 
      breed,
      COUNT(*) as herd_count,
      SUM(goat_count) as total_goats,
      AVG(average_milk_production) as avg_production
    FROM goat_herds
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
  
  query += ` GROUP BY breed ORDER BY total_goats DESC`;
  
  let res = await pg.query(query, params);
  
  return {
    byBreed: res.rows,
    totalHerds: res.rows.reduce((sum, row) => sum + parseInt(row.herd_count), 0),
    totalGoats: res.rows.reduce((sum, row) => sum + parseInt(row.total_goats), 0),
    recommendations: generateGoatAnalyticsRecommendations(res.rows)
  };
}

function generateGoatAnalyticsRecommendations(breedData) {
  let recommendations = [];
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
  registerGoatHerd,
  getGoatHerd,
  listGoatHerds,
  updateGoatHerd,
  analyzeGoatProduction,
  getGoatAnalytics,
};
