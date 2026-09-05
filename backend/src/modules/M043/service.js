// Service for Crop Registration (M043) - AI Enhanced
// Comprehensive crop registration with AI-powered selection and analysis
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus, SIGNAL, SEVERITY } = require('../../core/signalBus');

// Crop registration CRUD
async function registerCrop(cropData) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const { farmerId, cropName, variety, area, villageId, soilType, irrigationType, plantingDate, expectedYield, notes } = cropData;

  const res = await pg.query(
    `INSERT INTO crop_registrations (farmer_id, crop_name, variety, area, village_id, soil_type, irrigation_type, planting_date, expected_yield, notes, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', NOW(), NOW())
     RETURNING *`,
    [farmerId, cropName, variety, area, villageId, soilType, irrigationType, plantingDate, expectedYield, notes]
  );

  // Emit signal for crop registration
  signalBus.emitSignal(SIGNAL.ORGANIZATION_CREATED, {
    entityType: 'crop_registration',
    cropId: res.rows[0].id,
    farmerId,
    cropName,
    variety
  }, {
    severity: SEVERITY.INFO,
    source: 'crop_registration_service',
    entityId: res.rows[0].id
  });

  return res.rows[0];
}

async function getCropRegistration(registrationId) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  let res = await pg.query('SELECT * FROM crop_registrations WHERE id = $1', [registrationId]);
  return res.rows[0] || null;
}

async function listCropRegistrations({ page = 1, limit = 20, farmerId, cropName, villageId, status } = {}) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM crop_registrations WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (farmerId) {
    query += ` AND farmer_id = $${paramIndex++}`;
    params.push(farmerId);
  }
  if (cropName) {
    query += ` AND crop_name ILIKE $${paramIndex++}`;
    params.push(`%${cropName}%`);
  }
  if (villageId) {
    query += ` AND village_id = $${paramIndex++}`;
    params.push(villageId);
  }
  if (status) {
    query += ` AND status = $${paramIndex++}`;
    params.push(status);
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);

  let res = await pg.query(query, params);
  const totalRes = await pg.query(query.replace(`SELECT * FROM crop_registrations`, 'SELECT COUNT(*) FROM crop_registrations').split('LIMIT')[0], params.slice(0, -2));
  const total = parseInt(totalRes.rows[0].count || '0');

  return { items: res.rows, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } };
}

async function updateCropRegistration(registrationId, updates) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const { cropName, variety, area, soilType, irrigationType, plantingDate, expectedYield, notes, status } = updates;

  let res = await pg.query(
    `UPDATE crop_registrations
     SET crop_name = COALESCE($1, crop_name),
         variety = COALESCE($2, variety),
         area = COALESCE($3, area),
         soil_type = COALESCE($4, soil_type),
         irrigation_type = COALESCE($5, irrigation_type),
         planting_date = COALESCE($6, planting_date),
         expected_yield = COALESCE($7, expected_yield),
         notes = COALESCE($8, notes),
         status = COALESCE($9, status),
         updated_at = NOW()
     WHERE id = $10
     RETURNING *`,
    [cropName, variety, area, soilType, irrigationType, plantingDate, expectedYield, notes, status, registrationId]
  );

  // Emit signal for crop update
  signalBus.emitSignal(SIGNAL.ORGANIZATION_UPDATED, {
    entityType: 'crop_registration',
    cropId: registrationId,
    action: 'updated'
  }, {
    severity: SEVERITY.INFO,
    source: 'crop_registration_service',
    entityId: registrationId
  });

  return res.rows[0] || null;
}

async function deleteCropRegistration(registrationId) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  let res = await pg.query('DELETE FROM crop_registrations WHERE id = $1 RETURNING id', [registrationId]);

  if (res.rows[0]) {
    signalBus.emitSignal(SIGNAL.ORGANIZATION_DELETED, {
      entityType: 'crop_registration',
      cropId: registrationId
    }, {
      severity: SEVERITY.INFO,
      source: 'crop_registration_service',
      entityId: registrationId
    });
  }

  return !!res.rows[0];
}

// AI-powered crop recommendation
async function recommendCrops(farmerId, constraints = {}) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const farmer = await pg.query('SELECT * FROM farmers WHERE id = $1', [farmerId]);
  if (!farmer.rows.length) {
    return { success: false, error: 'Farmer not found' };
  }

  const farmerData = farmer.rows[0];

  // Generate AI-powered recommendations
  const recommendations = {
    farmerId,
    primaryRecommendations: generatePrimaryRecommendations(farmerData, constraints),
    alternativeOptions: generateAlternativeOptions(farmerData, constraints),
    marketAnalysis: analyzeMarketDemand(farmerData),
    profitabilityScores: calculateProfitabilityScores(farmerData),
    riskAssessment: assessCropRisks(farmerData)
  };

  return { success: true, data: recommendations };
}

function generatePrimaryRecommendations(farmerData, constraints) {
  let recommendations = [];

  // Based on land size
  if (farmerData.land_size < 2) {
    recommendations.push({
      crop: 'vegetables',
      variety: 'high_value',
      reason: 'High value per unit area for small holdings',
      expectedYield: 'High value, low volume',
      confidence: 0.9,
      marketDemand: 'high'
    });
  } else if (farmerData.land_size < 5) {
    recommendations.push({
      crop: 'cereals',
      variety: 'hybrid',
      reason: 'Balanced yield and risk for medium holdings',
      expectedYield: 'Medium volume, stable profit',
      confidence: 0.85,
      marketDemand: 'medium'
    });
  } else {
    recommendations.push({
      crop: 'cash_crops',
      variety: 'commercial',
      reason: 'Scale economies for large holdings',
      expectedYield: 'High volume, market-dependent',
      confidence: 0.8,
      marketDemand: 'high'
    });
  }

  // Based on primary crop experience
  if (farmerData.primary_crop) {
    recommendations.push({
      crop: farmerData.primary_crop,
      variety: 'improved',
      reason: 'Leveraging existing expertise',
      expectedYield: 'Improved over baseline',
      confidence: 0.9,
      marketDemand: 'medium'
    });
  }

  return recommendations;
}

function generateAlternativeOptions(farmerData, constraints) {
  const alternatives = [];

  alternatives.push({
    crop: 'legumes',
    variety: 'nitrogen_fixing',
    reason: 'Soil health improvement',
    rotationBenefit: 'high',
    confidence: 0.75
  });

  alternatives.push({
    crop: 'oilseeds',
    variety: 'drought_tolerant',
    reason: 'Risk diversification',
    rotationBenefit: 'medium',
    confidence: 0.7
  });

  return alternatives;
}

function analyzeMarketDemand(farmerData) {
  return {
    shortTerm: {
      trend: 'stable',
      topCrops: ['vegetables', 'cereals', 'pulses'],
      priceOutlook: 'moderate_increase'
    },
    longTerm: {
      trend: 'growing',
      emergingCrops: ['organic_farming', 'specialty_crops'],
      priceOutlook: 'favorable'
    }
  };
}

function calculateProfitabilityScores(farmerData) {
  const scores = [
    { crop: 'vegetables', score: 85, factors: ['high_value', 'quick_turnover'] },
    { crop: 'cereals', score: 70, factors: ['stable_market', 'lower_risk'] },
    { crop: 'cash_crops', score: 80, factors: ['high_profit_potential', 'market_risk'] }
  ];

  return scores;
}

function assessCropRisks(farmerData) {
  const risks = [];

  if (farmerData.land_size && farmerData.land_size < 1) {
    risks.push({
      type: 'climate',
      severity: 'high',
      description: 'Small holdings vulnerable to weather extremes',
      mitigation: 'Consider drought-resistant varieties'
    });
  }

  if (farmerData.farming_experience && farmerData.farming_experience < 2) {
    risks.push({
      type: 'experience',
      severity: 'medium',
      description: 'Limited experience may affect yield optimization',
      mitigation: 'Follow advisory recommendations'
    });
  }

  return risks;
}

// Yield estimation
async function estimateYield(registrationId, factors = {}) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const registration = await getCropRegistration(registrationId);
  if (!registration) {
    return { success: false, error: 'Crop registration not found' };
  }

  const estimation = {
    registrationId,
    baselineYield: registration.expected_yield,
    adjustedYield: calculateAdjustedYield(registration, factors),
    confidenceInterval: calculateConfidenceInterval(registration),
    influencingFactors: identifyInfluencingFactors(registration, factors)
  };

  return { success: true, data: estimation };
}

function calculateAdjustedYield(registration, factors) {
  let adjustment = 1.0;

  // Soil type adjustment
  if (registration.soil_type === 'fertile') adjustment *= 1.2;
  else if (registration.soil_type === 'average') adjustment *= 1.0;
  else adjustment *= 0.8;

  // Irrigation adjustment
  if (registration.irrigation_type === 'drip') adjustment *= 1.15;
  else if (registration.irrigation_type === 'sprinkler') adjustment *= 1.1;
  else if (registration.irrigation_type === 'flood') adjustment *= 0.95;

  return (registration.expected_yield || 0) * adjustment;
}

function calculateConfidenceInterval(registration) {
  return {
    lower: 0.8,
    upper: 1.2,
    confidence: 0.85
  };
}

function identifyInfluencingFactors(registration, factors) {
  return [
    { factor: 'soil_quality', impact: 'high', value: registration.soil_type },
    { factor: 'irrigation', impact: 'medium', value: registration.irrigation_type },
    { factor: 'area', impact: 'medium', value: registration.area }
  ];
}

// Crop analytics
async function getCropAnalytics({ startDate, endDate, villageId, cropName } = {}) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  let query = `
    SELECT
      crop_name,
      variety,
      COUNT(*) as count,
      SUM(area) as total_area,
      AVG(expected_yield) as avg_yield
    FROM crop_registrations
    WHERE 1=1
  `;
  let params = [];
  let paramIndex = 1;

  if (startDate) {
    query += ` AND planting_date >= $${paramIndex++}`;
    params.push(startDate);
  }
  if (endDate) {
    query += ` AND planting_date <= $${paramIndex++}`;
    params.push(endDate);
  }
  if (villageId) {
    query += ` AND village_id = $${paramIndex++}`;
    params.push(villageId);
  }
  if (cropName) {
    query += ` AND crop_name ILIKE $${paramIndex++}`;
    params.push(`%${cropName}%`);
  }

  query += ` GROUP BY crop_name, variety ORDER BY count DESC`;

  let res = await pg.query(query, params);

  return {
    byCrop: res.rows,
    totalRegistrations: res.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
    totalArea: res.rows.reduce((sum, row) => sum + (parseFloat(row.total_area) || 0), 0),
    recommendations: generateCropAnalyticsRecommendations(res.rows)
  };
}

function generateCropAnalyticsRecommendations(cropData) {
  let recommendations = [];

  const topCrop = cropData[0];
  if (topCrop) {
    recommendations.push({
      type: 'resource_allocation',
      message: `Highest concentration of ${topCrop.crop_name}. Ensure adequate input supply.`,
      priority: 'high'
    });
  }

  return recommendations;
}

module.exports = {
  // CRUD
  registerCrop,
  getCropRegistration,
  listCropRegistrations,
  updateCropRegistration,
  deleteCropRegistration,

  // AI-powered recommendations
  recommendCrops,

  // Yield estimation
  estimateYield,

  // Analytics
  getCropAnalytics,
};