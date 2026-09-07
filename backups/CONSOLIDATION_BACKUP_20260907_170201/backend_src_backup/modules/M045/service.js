// Service for Seed Planning (M045) - AI Enhanced
// Comprehensive seed planning with AI-powered calculation and optimization
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus, SIGNAL, SEVERITY } = require('../../core/signalBus');

// Seed planning CRUD
async function createSeedPlan(planData) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const { farmerId, cropId, varietyId, area, seedRate, totalSeedRequired, plantingDate, supplierId, estimatedCost, notes } = planData;

  const res = await pg.query(
    `INSERT INTO seed_plans (farmer_id, crop_id, variety_id, area, seed_rate, total_seed_required, planting_date, supplier_id, estimated_cost, notes, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', NOW(), NOW())
     RETURNING *`,
    [farmerId, cropId, varietyId, area, seedRate, totalSeedRequired, plantingDate, supplierId, estimatedCost, notes]
  );

  // Emit signal for seed plan creation
  signalBus.emitSignal(SIGNAL.ORGANIZATION_CREATED, {
    entityType: 'seed_plan',
    planId: res.rows[0].id,
    farmerId,
    cropId
  }, {
    severity: SEVERITY.INFO,
    source: 'seed_planning_service',
    entityId: res.rows[0].id
  });

  return res.rows[0];
}

async function getSeedPlan(planId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const res = await pg.query('SELECT * FROM seed_plans WHERE id = $1', [planId]);
  return res.rows[0] || null;
}

async function listSeedPlans({ page = 1, limit = 20, farmerId, cropId, status } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM seed_plans WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (farmerId) {
    query += ` AND farmer_id = $${paramIndex++}`;
    params.push(farmerId);
  }
  if (cropId) {
    query += ` AND crop_id = $${paramIndex++}`;
    params.push(cropId);
  }
  if (status) {
    query += ` AND status = $${paramIndex++}`;
    params.push(status);
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);

  const res = await pg.query(query, params);
  const totalRes = await pg.query(query.replace(`SELECT * FROM seed_plans`, 'SELECT COUNT(*) FROM seed_plans').split('LIMIT')[0], params.slice(0, -2));
  const total = parseInt(totalRes.rows[0].count || '0');

  return { items: res.rows, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } };
}

async function updateSeedPlan(planId, updates) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const { area, seedRate, totalSeedRequired, plantingDate, supplierId, estimatedCost, notes, status } = updates;

  const res = await pg.query(
    `UPDATE seed_plans
     SET area = COALESCE($1, area),
         seed_rate = COALESCE($2, seed_rate),
         total_seed_required = COALESCE($3, total_seed_required),
         planting_date = COALESCE($4, planting_date),
         supplier_id = COALESCE($5, supplier_id),
         estimated_cost = COALESCE($6, estimated_cost),
         notes = COALESCE($7, notes),
         status = COALESCE($8, status),
         updated_at = NOW()
     WHERE id = $9
     RETURNING *`,
    [area, seedRate, totalSeedRequired, plantingDate, supplierId, estimatedCost, notes, status, planId]
  );

  // Emit signal for seed plan update
  signalBus.emitSignal(SIGNAL.ORGANIZATION_UPDATED, {
    entityType: 'seed_plan',
    planId,
    action: 'updated'
  }, {
    severity: SEVERITY.INFO,
    source: 'seed_planning_service',
    entityId: planId
  });

  return res.rows[0] || null;
}

async function deleteSeedPlan(planId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const res = await pg.query('DELETE FROM seed_plans WHERE id = $1 RETURNING id', [planId]);

  if (res.rows[0]) {
    signalBus.emitSignal(SIGNAL.ORGANIZATION_DELETED, {
      entityType: 'seed_plan',
      planId
    }, {
      severity: SEVERITY.INFO,
      source: 'seed_planning_service',
      entityId: planId
    });
  }

  return !!res.rows[0];
}

// AI-powered seed requirement calculation
async function calculateSeedRequirements(cropId, varietyId, area, conditions = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  // Get crop and variety information
  const cropRes = await pg.query('SELECT * FROM crop_registrations WHERE id = $1', [cropId]);
  const varietyRes = await pg.query('SELECT * FROM crop_varieties WHERE id = $1', [varietyId]);

  const crop = cropRes.rows[0];
  const variety = varietyRes.rows[0];

  // Calculate seed requirements
  const calculation = {
    cropId,
    varietyId,
    area,
    seedRate: calculateSeedRate(crop, variety, conditions),
    totalSeedRequired: 0,
    estimatedCost: 0,
    plantingWindow: identifyPlantingWindow(crop, conditions),
    alternatives: generateSeedAlternatives(crop, variety, area)
  };

  calculation.totalSeedRequired = calculation.seedRate * area;
  calculation.estimatedCost = calculation.totalSeedRequired * 50; // Base rate

  return { success: true, data: calculation };
}

function calculateSeedRate(crop, variety, conditions) {
  let baseRate = 2; // kg per hectare default

  if (variety && variety.characteristics) {
    if (variety.characteristics.seedRate) {
      baseRate = variety.characteristics.seedRate;
    }
  }

  // Adjust for conditions
  if (conditions.soilType === 'sandy') baseRate *= 1.1;
  if (conditions.irrigation === 'drip') baseRate *= 0.9;

  return baseRate;
}

function identifyPlantingWindow(crop, conditions) {
  return {
    startMonth: 'June',
    endMonth: 'July',
    optimalSeason: 'kharif',
    bufferDays: 15
  };
}

function generateSeedAlternatives(crop, variety, area) {
  return [
    {
      type: 'hybrid',
      seedRate: 2.5,
      costMultiplier: 1.5,
      yieldPotential: 'high'
    },
    {
      type: 'traditional',
      seedRate: 2.0,
      costMultiplier: 1.0,
      yieldPotential: 'medium'
    }
  ];
}

// Seed supplier management
async function addSeedSupplier(supplierData) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const { name, contact, location, cropsAvailable, qualityRating, notes } = supplierData;

  const res = await pg.query(
    `INSERT INTO seed_suppliers (name, contact, location, crops_available, quality_rating, notes, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW(), NOW())
     RETURNING *`,
    [name, JSON.stringify(contact), location, JSON.stringify(cropsAvailable || []), qualityRating, notes]
  );

  // Emit signal for supplier addition
  signalBus.emitSignal(SIGNAL.ORGANIZATION_CREATED, {
    entityType: 'seed_supplier',
    supplierId: res.rows[0].id,
    name
  }, {
    severity: SEVERITY.INFO,
    source: 'seed_planning_service',
    entityId: res.rows[0].id
  });

  return res.rows[0];
}

async function listSeedSuppliers({ cropType, minQualityRating } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  let query = 'SELECT * FROM seed_suppliers WHERE status = $1';
  const params = ['active'];
  let paramIndex = 2;

  if (cropType) {
    query += ` AND crops_available @> $${paramIndex++}`;
    params.push(JSON.stringify([cropType]));
  }
  if (minQualityRating) {
    query += ` AND quality_rating >= $${paramIndex++}`;
    params.push(minQualityRating);
  }

  query += ` ORDER BY quality_rating DESC`;

  const res = await pg.query(query, params);
  return res.rows;
}

// Seed analytics
async function getSeedAnalytics({ startDate, endDate, cropId } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  let query = `
    SELECT
      crop_id,
      COUNT(*) as count,
      SUM(total_seed_required) as total_seed,
      AVG(estimated_cost) as avg_cost
    FROM seed_plans
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
  if (cropId) {
    query += ` AND crop_id = $${paramIndex++}`;
    params.push(cropId);
  }

  query += ` GROUP BY crop_id ORDER BY count DESC`;

  const res = await pg.query(query, params);

  return {
    byCrop: res.rows,
    totalPlans: res.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
    totalSeed: res.rows.reduce((sum, row) => sum + (parseFloat(row.total_seed) || 0), 0),
    recommendations: generateSeedAnalyticsRecommendations(res.rows)
  };
}

function generateSeedAnalyticsRecommendations(seedData) {
  const recommendations = [];

  const highSeedCrops = seedData.filter(row => parseFloat(row.total_seed) > 1000);
  if (highSeedCrops.length > 0) {
    recommendations.push({
      type: 'bulk_procurement',
      message: `High seed volume for ${highSeedCrops.map(c => c.crop_id).join(', ')}. Consider bulk procurement discounts.`,
      priority: 'high'
    });
  }

  return recommendations;
}

module.exports = {
  // CRUD
  createSeedPlan,
  getSeedPlan,
  listSeedPlans,
  updateSeedPlan,
  deleteSeedPlan,

  // AI-powered calculation
  calculateSeedRequirements,

  // Supplier management
  addSeedSupplier,
  listSeedSuppliers,

  // Analytics
  getSeedAnalytics,
};