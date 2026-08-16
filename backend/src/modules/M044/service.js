// Service for Crop Variety (M044) - AI Enhanced
// Comprehensive crop variety management with AI-powered selection and analysis
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus, SIGNAL, SEVERITY } = require('../../core/signalBus');

// Crop variety CRUD
async function createVariety(varietyData) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const { cropName, varietyName, characteristics, seedSource, maturityDays, yieldPotential, diseaseResistance, droughtTolerance, notes } = varietyData;

  const res = await pg.query(
    `INSERT INTO crop_varieties (crop_name, variety_name, characteristics, seed_source, maturity_days, yield_potential, disease_resistance, drought_tolerance, notes, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', NOW(), NOW())
     RETURNING *`,
    [cropName, varietyName, JSON.stringify(characteristics || {}), seedSource, maturityDays, yieldPotential, JSON.stringify(diseaseResistance || []), droughtTolerance, notes]
  );

  // Emit signal for variety creation
  signalBus.emitSignal(SIGNAL.ORGANIZATION_CREATED, {
    entityType: 'crop_variety',
    varietyId: res.rows[0].id,
    cropName,
    varietyName
  }, {
    severity: SEVERITY.INFO,
    source: 'crop_variety_service',
    entityId: res.rows[0].id
  });

  return res.rows[0];
}

async function getVariety(varietyId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const res = await pg.query('SELECT * FROM crop_varieties WHERE id = $1', [varietyId]);
  return res.rows[0] || null;
}

async function listVarieties({ page = 1, limit = 20, cropName, status } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM crop_varieties WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (cropName) {
    query += ` AND crop_name ILIKE $${paramIndex++}`;
    params.push(`%${cropName}%`);
  }
  if (status) {
    query += ` AND status = $${paramIndex++}`;
    params.push(status);
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);

  const res = await pg.query(query, params);
  const totalRes = await pg.query(query.replace(`SELECT * FROM crop_varieties`, 'SELECT COUNT(*) FROM crop_varieties').split('LIMIT')[0], params.slice(0, -2));
  const total = parseInt(totalRes.rows[0].count || '0');

  return { items: res.rows, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } };
}

async function updateVariety(varietyId, updates) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const { varietyName, characteristics, seedSource, maturityDays, yieldPotential, diseaseResistance, droughtTolerance, notes, status } = updates;

  const res = await pg.query(
    `UPDATE crop_varieties
     SET variety_name = COALESCE($1, variety_name),
         characteristics = COALESCE($2, characteristics),
         seed_source = COALESCE($3, seed_source),
         maturity_days = COALESCE($4, maturity_days),
         yield_potential = COALESCE($5, yield_potential),
         disease_resistance = COALESCE($6, disease_resistance),
         drought_tolerance = COALESCE($7, drought_tolerance),
         notes = COALESCE($8, notes),
         status = COALESCE($9, status),
         updated_at = NOW()
     WHERE id = $10
     RETURNING *`,
    [varietyName, characteristics ? JSON.stringify(characteristics) : null, seedSource, maturityDays, yieldPotential, diseaseResistance ? JSON.stringify(diseaseResistance) : null, droughtTolerance, notes, status, varietyId]
  );

  // Emit signal for variety update
  signalBus.emitSignal(SIGNAL.ORGANIZATION_UPDATED, {
    entityType: 'crop_variety',
    varietyId,
    action: 'updated'
  }, {
    severity: SEVERITY.INFO,
    source: 'crop_variety_service',
    entityId: varietyId
  });

  return res.rows[0] || null;
}

async function deleteVariety(varietyId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const res = await pg.query('DELETE FROM crop_varieties WHERE id = $1 RETURNING id', [varietyId]);

  if (res.rows[0]) {
    signalBus.emitSignal(SIGNAL.ORGANIZATION_DELETED, {
      entityType: 'crop_variety',
      varietyId
    }, {
      severity: SEVERITY.INFO,
      source: 'crop_variety_service',
      entityId: varietyId
    });
  }

  return !!res.rows[0];
}

// AI-powered variety recommendation
async function recommendVarieties(cropName, conditions = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const { soilType, climate, irrigation, season } = conditions;

  // Get all varieties for the crop
  const varietiesRes = await pg.query(
    'SELECT * FROM crop_varieties WHERE crop_name ILIKE $1 AND status = $2',
    [`%${cropName}%`, 'active']
  );

  const varieties = varietiesRes.rows;

  // Score and rank varieties
  const scoredVarieties = varieties.map(variety => ({
    ...variety,
    suitabilityScore: calculateSuitabilityScore(variety, conditions),
    matchFactors: identifyMatchFactors(variety, conditions)
  })).sort((a, b) => b.suitabilityScore - a.suitabilityScore);

  return {
    success: true,
    data: {
      cropName,
      conditions,
      recommendations: scoredVarieties.slice(0, 5),
      topPick: scoredVarieties[0] || null,
      comparison: generateVarietyComparison(scoredVarieties.slice(0, 3))
    }
  };
}

function calculateSuitabilityScore(variety, conditions) {
  let score = 50; // Base score

  // Soil type matching
  if (variety.characteristics && variety.characteristics.soilPreference) {
    if (variety.characteristics.soilPreference === conditions.soilType) score += 20;
  }

  // Drought tolerance
  if (conditions.irrigation === 'rainfed' && variety.drought_tolerance === 'high') {
    score += 15;
  }

  // Yield potential
  if (variety.yield_potential && variety.yield_potential > 80) {
    score += 10;
  }

  // Disease resistance
  if (variety.disease_resistance && variety.disease_resistance.length > 2) {
    score += 5;
  }

  return Math.min(score, 100);
}

function identifyMatchFactors(variety, conditions) {
  const factors = [];

  if (variety.drought_tolerance === 'high' && conditions.irrigation === 'rainfed') {
    factors.push({ factor: 'drought_tolerance', match: 'excellent', reason: 'High drought tolerance suits rainfed conditions' });
  }

  if (variety.yield_potential > 80) {
    factors.push({ factor: 'yield_potential', match: 'good', reason: 'High yield potential' });
  }

  return factors;
}

function generateVarietyComparison(varieties) {
  if (varieties.length < 2) return null;

  return {
    yieldComparison: varieties.map(v => ({ name: v.variety_name, yield: v.yield_potential })),
    maturityComparison: varieties.map(v => ({ name: v.variety_name, days: v.maturity_days })),
    diseaseResistanceComparison: varieties.map(v => ({ name: v.variety_name, resistance: v.disease_resistance }))
  };
}

// Variety performance tracking
async function recordVarietyPerformance(performanceData) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const { varietyId, farmerId, actualYield, plantingDate, harvestDate, conditions, notes } = performanceData;

  const res = await pg.query(
    `INSERT INTO variety_performance (variety_id, farmer_id, actual_yield, planting_date, harvest_date, conditions, notes, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     RETURNING *`,
    [varietyId, farmerId, actualYield, plantingDate, harvestDate, JSON.stringify(conditions || {}), notes]
  );

  // Emit signal for performance recording
  signalBus.emitSignal(SIGNAL.ORGANIZATION_UPDATED, {
    entityType: 'variety_performance',
    varietyId,
    farmerId,
    actualYield
  }, {
    severity: SEVERITY.INFO,
    source: 'crop_variety_service',
    entityId: res.rows[0].id
  });

  return res.rows[0];
}

async function getVarietyPerformance(varietyId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const res = await pg.query(
    'SELECT * FROM variety_performance WHERE variety_id = $1 ORDER BY harvest_date DESC',
    [varietyId]
  );

  return res.rows;
}

async function analyzeVarietyPerformance(varietyId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const performance = await getVarietyPerformance(varietyId);

  if (performance.length === 0) {
    return { success: false, error: 'No performance data available' };
  }

  const analysis = {
    varietyId,
    averageYield: performance.reduce((sum, p) => sum + (p.actual_yield || 0), 0) / performance.length,
    yieldRange: {
      min: Math.min(...performance.map(p => p.actual_yield || 0)),
      max: Math.max(...performance.map(p => p.actual_yield || 0))
    },
    consistency: calculateYieldConsistency(performance),
    totalRecords: performance.length,
    recommendation: generatePerformanceRecommendation(performance)
  };

  return { success: true, data: analysis };
}

function calculateYieldConsistency(performance) {
  if (performance.length < 2) return 'insufficient_data';

  const yields = performance.map(p => p.actual_yield || 0);
  const mean = yields.reduce((a, b) => a + b) / yields.length;
  const variance = yields.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / yields.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = (stdDev / mean) * 100;

  if (coefficientOfVariation < 10) return 'high';
  if (coefficientOfVariation < 20) return 'medium';
  return 'low';
}

function generatePerformanceRecommendation(performance) {
  const avgYield = performance.reduce((sum, p) => sum + (p.actual_yield || 0), 0) / performance.length;

  if (avgYield > 80) {
    return { action: 'recommend', reason: 'Consistently high yield performance' };
  } else if (avgYield > 60) {
    return { action: 'conditional', reason: 'Moderate yield, consider conditions' };
  } else {
    return { action: 'review', reason: 'Low yield performance, investigate causes' };
  }
}

// Variety analytics
async function getVarietyAnalytics({ cropName, startDate, endDate } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  let query = `
    SELECT
      crop_name,
      COUNT(*) as count,
      AVG(yield_potential) as avg_yield_potential,
      AVG(maturity_days) as avg_maturity
    FROM crop_varieties
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (cropName) {
    query += ` AND crop_name ILIKE $${paramIndex++}`;
    params.push(`%${cropName}%`);
  }

  query += ` GROUP BY crop_name ORDER BY count DESC`;

  const res = await pg.query(query, params);

  return {
    byCrop: res.rows,
    totalVarieties: res.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
    recommendations: generateVarietyAnalyticsRecommendations(res.rows)
  };
}

function generateVarietyAnalyticsRecommendations(cropData) {
  const recommendations = [];

  const lowYieldCrops = cropData.filter(row => parseFloat(row.avg_yield_potential) < 60);
  if (lowYieldCrops.length > 0) {
    recommendations.push({
      type: 'variety_improvement',
      message: `Consider introducing higher-yielding varieties for ${lowYieldCrops.map(c => c.crop_name).join(', ')}`,
      priority: 'medium'
    });
  }

  return recommendations;
}

module.exports = {
  // CRUD
  createVariety,
  getVariety,
  listVarieties,
  updateVariety,
  deleteVariety,

  // AI-powered recommendations
  recommendVarieties,

  // Performance tracking
  recordVarietyPerformance,
  getVarietyPerformance,
  analyzeVarietyPerformance,

  // Analytics
  getVarietyAnalytics,
};