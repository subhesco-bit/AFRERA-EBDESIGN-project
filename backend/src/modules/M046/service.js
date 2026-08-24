// Service for Nursery Management (M046) - AI Enhanced
// Comprehensive nursery management with AI-powered monitoring and optimization
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus, SIGNAL, SEVERITY } = require('../../core/signalBus');

// Nursery CRUD
async function createNursery(nurseryData) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const { farmerId, name, location, area, type, capacity, irrigationType, notes } = nurseryData;

  const res = await pg.query(
    `INSERT INTO nurseries (farmer_id, nursery_name, village, location, area, nursery_type, capacity, irrigation_type, notes, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', NOW(), NOW())
     RETURNING *`,
    [farmerId, name, location?.village || location?.district || 'Unknown', JSON.stringify(location || null), area, type, capacity, irrigationType, notes]
  );

  // Emit signal for nursery creation
  signalBus.emitSignal(SIGNAL.ORGANIZATION_CREATED, {
    entityType: 'nursery',
    nurseryId: res.rows[0].id,
    farmerId,
    name
  }, {
    severity: SEVERITY.INFO,
    source: 'nursery_service',
    entityId: res.rows[0].id
  });

  return res.rows[0];
}

async function getNursery(nurseryId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const res = await pg.query('SELECT * FROM nurseries WHERE id = $1', [nurseryId]);
  return res.rows[0] || null;
}

async function listNurseries({ page = 1, limit = 20, farmerId, type, status } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM nurseries WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (farmerId) {
    query += ` AND farmer_id = $${paramIndex++}`;
    params.push(farmerId);
  }
  if (type) {
    query += ` AND nursery_type = $${paramIndex++}`;
    params.push(type);
  }
  if (status) {
    query += ` AND status = $${paramIndex++}`;
    params.push(status);
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);

  const res = await pg.query(query, params);
  const totalRes = await pg.query(query.replace(`SELECT * FROM nurseries`, 'SELECT COUNT(*) FROM nurseries').split('LIMIT')[0], params.slice(0, -2));
  const total = parseInt(totalRes.rows[0].count || '0');

  return { items: res.rows, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } };
}

async function updateNursery(nurseryId, updates) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const { name, location, area, type, capacity, irrigationType, notes, status } = updates;

  const res = await pg.query(
    `UPDATE nurseries
     SET nursery_name = COALESCE($1, nursery_name),
         village = COALESCE($2, village),
         location = COALESCE($3, location),
         area = COALESCE($4, area),
         nursery_type = COALESCE($5, nursery_type),
         capacity = COALESCE($6, capacity),
         irrigation_type = COALESCE($7, irrigation_type),
         notes = COALESCE($8, notes),
         status = COALESCE($9, status),
         updated_at = NOW()
     WHERE id = $10
     RETURNING *`,
    [name, location?.village || location?.district || null, location ? JSON.stringify(location) : null,
      area, type, capacity, irrigationType, notes, status, nurseryId]
  );

  // Emit signal for nursery update
  signalBus.emitSignal(SIGNAL.ORGANIZATION_UPDATED, {
    entityType: 'nursery',
    nurseryId,
    action: 'updated'
  }, {
    severity: SEVERITY.INFO,
    source: 'nursery_service',
    entityId: nurseryId
  });

  return res.rows[0] || null;
}

async function deleteNursery(nurseryId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const res = await pg.query('DELETE FROM nurseries WHERE id = $1 RETURNING id', [nurseryId]);

  if (res.rows[0]) {
    signalBus.emitSignal(SIGNAL.ORGANIZATION_DELETED, {
      entityType: 'nursery',
      nurseryId
    }, {
      severity: SEVERITY.INFO,
      source: 'nursery_service',
      entityId: nurseryId
    });
  }

  return !!res.rows[0];
}

// Seedling batch management
async function createSeedlingBatch(batchData) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const { nurseryId, cropId, varietyId, quantity, sowingDate, expectedTransplantDate, notes } = batchData;

  const res = await pg.query(
    `INSERT INTO seedling_batches (nursery_id, crop_id, variety_id, quantity, sowing_date, expected_transplant_date, notes, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', NOW(), NOW())
     RETURNING *`,
    [nurseryId, cropId, varietyId, quantity, sowingDate, expectedTransplantDate, notes]
  );

  // Emit signal for batch creation
  signalBus.emitSignal(SIGNAL.ORGANIZATION_CREATED, {
    entityType: 'seedling_batch',
    batchId: res.rows[0].id,
    nurseryId,
    cropId
  }, {
    severity: SEVERITY.INFO,
    source: 'nursery_service',
    entityId: res.rows[0].id
  });

  return res.rows[0];
}

async function updateSeedlingHealth(batchId, healthData) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const { healthScore, growthStage, issues, observations } = healthData;

  const res = await pg.query(
    `INSERT INTO seedling_health_records (batch_id, health_score, growth_stage, issues, observations, recorded_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING *`,
    [batchId, healthScore, growthStage, JSON.stringify(issues || []), observations]
  );

  // Emit alert for poor health
  if (healthScore < 60) {
    signalBus.emitSignal(SIGNAL.EMERGENCY_RAISED, {
      entityType: 'seedling_health',
      batchId,
      healthScore,
      issues
    }, {
      severity: SEVERITY.WARNING,
      source: 'nursery_service',
      entityId: batchId
    });
  }

  return res.rows[0];
}

// AI-powered nursery optimization
async function optimizeNurseryEnvironment(nurseryId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const nursery = await getNursery(nurseryId);
  if (!nursery) {
    return { success: false, error: 'Nursery not found' };
  }

  const optimization = {
    nurseryId,
    recommendedTemperature: 25,
    recommendedHumidity: 70,
    recommendedLight: 'medium',
    irrigationSchedule: generateIrrigationSchedule(nursery),
    nutrientSchedule: generateNutrientSchedule(nursery),
    riskFactors: assessNurseryRisks(nursery)
  };

  return { success: true, data: optimization };
}

function generateIrrigationSchedule(nursery) {
  return {
    frequency: 'daily',
    time: 'morning',
    duration: '30_minutes',
    method: nursery.irrigation_type || 'sprinkler'
  };
}

function generateNutrientSchedule(nursery) {
  return [
    { week: 1, nutrients: ['NPK_balanced'], frequency: 'twice_weekly' },
    { week: 2, nutrients: ['NPK_balanced', 'micronutrients'], frequency: 'twice_weekly' },
    { week: 3, nutrients: ['phosphorus_boost'], frequency: 'weekly' }
  ];
}

function assessNurseryRisks(nursery) {
  const risks = [];

  if (nursery.irrigation_type === 'manual') {
    risks.push({
      type: 'water_stress',
      severity: 'medium',
      description: 'Manual irrigation may lead to inconsistent watering',
      mitigation: 'Consider automated irrigation system'
    });
  }

  return risks;
}

// Nursery analytics
async function getNurseryAnalytics({ startDate, endDate, nurseryId } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  let query = `
    SELECT
      nursery_type AS type,
      COUNT(*) as count,
      SUM(capacity) as total_capacity,
      AVG(capacity) as avg_capacity
    FROM nurseries
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
  if (nurseryId) {
    query += ` AND id = $${paramIndex++}`;
    params.push(nurseryId);
  }

  query += ` GROUP BY type ORDER BY count DESC`;

  const res = await pg.query(query, params);

  return {
    byType: res.rows,
    totalNurseries: res.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
    totalCapacity: res.rows.reduce((sum, row) => sum + (parseFloat(row.total_capacity) || 0), 0),
    recommendations: generateNurseryAnalyticsRecommendations(res.rows)
  };
}

function generateNurseryAnalyticsRecommendations(nurseryData) {
  const recommendations = [];

  const lowCapacity = nurseryData.filter(row => parseFloat(row.avg_capacity) < 1000);
  if (lowCapacity.length > 0) {
    recommendations.push({
      type: 'capacity_expansion',
      message: `Nurseries of type ${lowCapacity.map(n => n.type).join(', ')} have low capacity. Consider expansion.`,
      priority: 'medium'
    });
  }

  return recommendations;
}

module.exports = {
  // Nursery CRUD
  createNursery,
  getNursery,
  listNurseries,
  updateNursery,
  deleteNursery,

  // Seedling batch management
  createSeedlingBatch,
  updateSeedlingHealth,

  // AI-powered optimization
  optimizeNurseryEnvironment,

  // Analytics
  getNurseryAnalytics,
};
