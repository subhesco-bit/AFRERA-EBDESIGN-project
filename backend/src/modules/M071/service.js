// Service for Dairy Management (M071) - AI Enhanced
// Comprehensive dairy management with AI-powered analytics and recommendations
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus, SIGNAL, SEVERITY } = require('../../core/signalBus');

// Dairy herd CRUD
async function registerDairyHerd(herdData) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { herdName, breed, cattleCount, location, farmId, averageMilkProduction, breedingStatus } = herdData;
  
  const res = await pg.query(
    `INSERT INTO dairy_herds (herd_name, breed, cattle_count, location, farm_id, average_milk_production, breeding_status, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', NOW(), NOW())
     RETURNING *`,
    [herdName, breed, cattleCount, JSON.stringify(location), farmId, averageMilkProduction, breedingStatus]
  );
  
  // Emit signal for herd registration
  signalBus.emitSignal(SIGNAL.ORGANIZATION_CREATED, {
    entityType: 'dairy_herd',
    herdId: res.rows[0].id,
    herdName,
    breed,
    cattleCount
  }, {
    severity: SEVERITY.INFO,
    source: 'dairy_management_service',
    entityId: res.rows[0].id
  });
  
  return res.rows[0];
}

async function getDairyHerd(herdId) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let res = await pg.query('SELECT * FROM dairy_herds WHERE id = $1', [herdId]);
  return res.rows[0] || null;
}

async function listDairyHerds({ page = 1, limit = 20, farmId, breed, status } = {}) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM dairy_herds WHERE 1=1';
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
  const totalRes = await pg.query(query.replace(`SELECT * FROM dairy_herds`, 'SELECT COUNT(*) FROM dairy_herds').split('LIMIT')[0], params.slice(0, -2));
  const total = parseInt(totalRes.rows[0].count || '0');
  
  return { items: res.rows, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } };
}

async function updateDairyHerd(herdId, updates) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { herdName, breed, cattleCount, location, averageMilkProduction, breedingStatus, status } = updates;
  
  let res = await pg.query(
    `UPDATE dairy_herds 
     SET herd_name = COALESCE($1, herd_name),
         breed = COALESCE($2, breed),
         cattle_count = COALESCE($3, cattle_count),
         location = COALESCE($4, location),
         average_milk_production = COALESCE($5, average_milk_production),
         breeding_status = COALESCE($6, breeding_status),
         status = COALESCE($7, status),
         updated_at = NOW()
     WHERE id = $8
     RETURNING *`,
    [herdName, breed, cattleCount, location ? JSON.stringify(location) : null, averageMilkProduction, breedingStatus, status, herdId]
  );
  
  // Emit signal for herd update
  signalBus.emitSignal(SIGNAL.ORGANIZATION_UPDATED, {
    entityType: 'dairy_herd',
    herdId,
    action: 'updated'
  }, {
    severity: SEVERITY.INFO,
    source: 'dairy_management_service',
    entityId: herdId
  });
  
  return res.rows[0] || null;
}

// AI-powered milk production analysis
async function analyzeMilkProduction(herdId) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const herd = await getDairyHerd(herdId);
  if (!herd) {
    return { success: false, error: 'Herd not found' };
  }
  
  // Analyze milk production characteristics
  const analysis = {
    herdId,
    herdName: herd.herd_name,
    productionCategory: categorizeProduction(herd.average_milk_production),
    efficiencyScore: calculateEfficiencyScore(herd),
    projectedMonthlyYield: calculateProjectedYield(herd),
    feedOptimization: generateFeedOptimization(herd),
    breedingRecommendations: generateBreedingRecommendations(herd),
    healthAlerts: generateHealthAlerts(herd)
  };
  
  return { success: true, data: analysis };
}

function categorizeProduction(avgProduction) {
  if (!avgProduction) return 'unknown';
  if (avgProduction < 10) return 'low';
  if (avgProduction < 20) return 'medium';
  if (avgProduction < 30) return 'high';
  return 'very_high';
}

function calculateEfficiencyScore(herd) {
  let score = 0;
  
  // Cattle count contribution
  if (herd.cattle_count && herd.cattle_count > 50) score += 20;
  
  // Production contribution
  if (herd.average_milk_production && herd.average_milk_production > 15) score += 30;
  
  // Breed contribution
  if (herd.breed && herd.breed.includes('Holstein')) score += 25;
  
  // Breeding status contribution
  if (herd.breeding_status === 'active') score += 15;
  
  return Math.min(score, 100);
}

function calculateProjectedYield(herd) {
  const dailyProduction = (herd.average_milk_production || 0) * (herd.cattle_count || 0);
  return {
    daily: dailyProduction,
    weekly: dailyProduction * 7,
    monthly: dailyProduction * 30,
    annual: dailyProduction * 365
  };
}

function generateFeedOptimization(herd) {
  const recommendations = [];
  
  if (herd.average_milk_production < 15) {
    recommendations.push({
      type: 'feed',
      message: 'Increase protein content in feed to boost milk production',
      priority: 'high'
    });
  }
  
  if (herd.breeding_status === 'active') {
    recommendations.push({
      type: 'feed',
      message: 'Add mineral supplements for breeding cattle',
      priority: 'medium'
    });
  }
  
  return recommendations;
}

function generateBreedingRecommendations(herd) {
  let recommendations = [];
  
  if (herd.breeding_status !== 'active') {
    recommendations.push({
      type: 'breeding',
      message: 'Consider starting breeding program to maintain herd size',
      priority: 'high'
    });
  }
  
  if (herd.cattle_count && herd.cattle_count < 30) {
    recommendations.push({
      type: 'breeding',
      message: 'Herd size is small - consider expanding breeding program',
      priority: 'medium'
    });
  }
  
  return recommendations;
}

function generateHealthAlerts(herd) {
  const alerts = [];
  
  if (herd.average_milk_production && herd.average_milk_production < 10) {
    alerts.push({
      type: 'health',
      message: 'Low milk production may indicate health issues',
      priority: 'high'
    });
  }
  
  return alerts;
}

// Milk quality tracking
async function recordMilkQuality(qualityData) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { herdId, sampleDate, fatContent, proteinContent, snf, ph, bacterialCount, grade } = qualityData;
  
  let res = await pg.query(
    `INSERT INTO milk_quality (herd_id, sample_date, fat_content, protein_content, snf, ph, bacterial_count, grade, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
     RETURNING *`,
    [herdId, sampleDate, fatContent, proteinContent, snf, ph, bacterialCount, grade]
  );
  
  // Emit signal for quality recording
  signalBus.emitSignal(SIGNAL.ORGANIZATION_UPDATED, {
    entityType: 'milk_quality',
    herdId,
    grade
  }, {
    severity: grade === 'poor' ? SEVERITY.WARNING : SEVERITY.INFO,
    source: 'dairy_management_service',
    entityId: res.rows[0].id
  });
  
  return res.rows[0];
}

async function getMilkQualityHistory(herdId, { startDate, endDate, limit = 20 } = {}) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let query = 'SELECT * FROM milk_quality WHERE herd_id = $1';
  let params = [herdId];
  let paramIndex = 2;
  
  if (startDate) {
    query += ` AND sample_date >= $${paramIndex++}`;
    params.push(startDate);
  }
  if (endDate) {
    query += ` AND sample_date <= $${paramIndex++}`;
    params.push(endDate);
  }
  
  query += ` ORDER BY sample_date DESC LIMIT $${paramIndex++}`;
  params.push(limit);
  
  let res = await pg.query(query, params);
  return res.rows;
}

// Dairy analytics
async function getDairyAnalytics({ startDate, endDate, farmId } = {}) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let query = `
    SELECT 
      breed,
      COUNT(*) as herd_count,
      SUM(cattle_count) as total_cattle,
      AVG(average_milk_production) as avg_production
    FROM dairy_herds
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
  
  query += ` GROUP BY breed ORDER BY total_cattle DESC`;
  
  let res = await pg.query(query, params);
  
  return {
    byBreed: res.rows,
    totalHerds: res.rows.reduce((sum, row) => sum + parseInt(row.herd_count), 0),
    totalCattle: res.rows.reduce((sum, row) => sum + parseInt(row.total_cattle), 0),
    recommendations: generateDairyAnalyticsRecommendations(res.rows)
  };
}

function generateDairyAnalyticsRecommendations(breedData) {
  let recommendations = [];
  
  const topBreed = breedData[0];
  if (topBreed) {
    recommendations.push({
      type: 'resource_allocation',
      message: `Highest concentration of ${topBreed.breed} cattle. Consider allocating specialized resources.`,
      priority: 'high'
    });
  }
  
  const lowProductionBreeds = breedData.filter(row => parseFloat(row.avg_production) < 15);
  if (lowProductionBreeds.length > 0) {
    recommendations.push({
      type: 'feed_optimization',
      message: `Breeds ${lowProductionBreeds.map(b => b.breed).join(', ')} have low production. Review feed programs.`,
      priority: 'medium'
    });
  }
  
  return recommendations;
}

module.exports = {
  // Dairy herd CRUD
  registerDairyHerd,
  getDairyHerd,
  listDairyHerds,
  updateDairyHerd,
  
  // AI-powered analysis
  analyzeMilkProduction,
  
  // Milk quality
  recordMilkQuality,
  getMilkQualityHistory,
  
  // Analytics
  getDairyAnalytics,
};
