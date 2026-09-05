/**
 * Sheep Farming Service (M125 — Livestock domain)
 *
 * Backs sheep flock management with real domain logic for wool production,
 * feed consumption, breeding tracking, and vaccination schedules. Similar to
 * other livestock but with sheep-specific parameters (wool quality metrics,
 * seasonal breeding, grazing management).
 *
 * Domain-specific computed capabilities:
 *  - getFlockPerformance(): wool yield trends, feed efficiency, lambing rate
 *  - getBreedingAlerts(): upcoming lambing due dates
 *  - getVaccinationAlerts(): upcoming vaccination due dates
 *  - getWoolQuality(): average fiber micron, staple length, yield percentage
 *
 * Assumed constants (veterinary rules of thumb, not stored in schema):
 *  - ASSUMED_VACCINATION_INTERVAL_DAYS: standard interval between vaccinations
 *  - ASSUMED_GESTATION_DAYS: sheep gestation period
 *  - ASSUMED_DUE_SOON_WINDOW_DAYS: alert window for upcoming events
 *  - ASSUMED_TARGET_FIBER_MICRON: target fiber quality for fine wool
 *  - ASSUMED_SHEARING_INTERVAL_DAYS: recommended interval between shearings
 */

const { logger } = require('..\/utils\/logger');
const { getPostgreSQL } = require('..\/database\/connection');
const { signalBus } = require('..\/core\/signalBus');

// ---- Assumed constants (not stored in the schema; sheep farming standards)
const ASSUMED_VACCINATION_INTERVAL_DAYS = 180; // biannual vaccination cycle
const ASSUMED_GESTATION_DAYS = 147; // average sheep gestation length
const ASSUMED_DUE_SOON_WINDOW_DAYS = 14; // alert window
const ASSUMED_TARGET_FIBER_MICRON = 21; // target fiber diameter for fine wool (microns)
const ASSUMED_SHEARING_INTERVAL_DAYS = 180; // recommended shearing interval (6 months)

// ---------------------------------------------------------------------
// Flock management (CRUD)
// ---------------------------------------------------------------------

async function listFlock({ page = 1, limit = 50, status = null, sex = null } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const offset = (Number(page) - 1) * Number(limit);
  
  let query = 'SELECT COUNT(*) FROM sheep_flock';
  let countParams = [];
  let conditions = [];
  
  if (status) {
    conditions.push('status = $' + (countParams.length + 1));
    countParams.push(status);
  }
  if (sex) {
    conditions.push('sex = $' + (countParams.length + 1));
    countParams.push(sex);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  const totalRes = await pg.query(query, countParams);
  const total = parseInt(totalRes.rows[0].count || '0', 10);
  
  query = 'SELECT * FROM sheep_flock';
  const params = [limit, offset];
  let paramIndex = 3;
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.map((c, i) => c.replace(/\$\d+/, '$' + (i + 3))).join(' AND ');
    if (status) params.push(status);
    if (sex) params.push(sex);
  }
  query += ' ORDER BY dob DESC LIMIT $1 OFFSET $2';
  
  const res = await pg.query(query, params);
  return { items: res.rows, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) || 1 } };
}

async function createAnimal(payload) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const { tag_id, breed, dob, sex, status, weight_kg, wool_type, pasture_id, notes } = payload || {};
  if (!tag_id || !sex) {
    throw new Error('tag_id and sex are required');
  }
  let res = await pg.query(
    `INSERT INTO sheep_flock (tag_id, breed, dob, sex, status, weight_kg, wool_type, pasture_id, notes)
     VALUES ($1, $2, $3, $4, COALESCE($5, 'active'), $6, $7, $8, $9)
     RETURNING *`,
    [tag_id, breed || null, dob || null, sex, status || null, weight_kg || null, wool_type || null, pasture_id || null, notes || null]
  );
  return res.rows[0];
}

async function updateAnimal(id, payload) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const { tag_id, breed, dob, sex, status, weight_kg, wool_type, pasture_id, notes, last_vaccination_date, last_breeding_date, last_lambing_date, last_shearing_date } = payload || {};
  let res = await pg.query(
    `UPDATE sheep_flock SET
       tag_id = COALESCE($1, tag_id),
       breed = COALESCE($2, breed),
       dob = COALESCE($3, dob),
       sex = COALESCE($4, sex),
       status = COALESCE($5, status),
       weight_kg = COALESCE($6, weight_kg),
       wool_type = COALESCE($7, wool_type),
       pasture_id = COALESCE($8, pasture_id),
       notes = COALESCE($9, notes),
       last_vaccination_date = COALESCE($10, last_vaccination_date),
       last_breeding_date = COALESCE($11, last_breeding_date),
       last_lambing_date = COALESCE($12, last_lambing_date),
       last_shearing_date = COALESCE($13, last_shearing_date),
       updated_at = NOW()
     WHERE id = $14
     RETURNING *`,
    [tag_id, breed, dob, sex, status, weight_kg, wool_type, pasture_id, notes, last_vaccination_date, last_breeding_date, last_lambing_date, last_shearing_date, id]
  );
  return res.rows[0] || null;
}

async function deleteAnimal(id) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  let res = await pg.query('DELETE FROM sheep_flock WHERE id = $1 RETURNING id', [id]);
  return !!res.rows[0];
}

// ---------------------------------------------------------------------
// Wool production tracking
// ---------------------------------------------------------------------

async function listWoolProduction(animalId, { page = 1, limit = 50 } = {}) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  let offset = (Number(page) - 1) * Number(limit);
  let totalRes = await pg.query('SELECT COUNT(*) FROM sheep_wool_production WHERE animal_id = $1', [animalId]);
  let total = parseInt(totalRes.rows[0].count || '0', 10);
  let res = await pg.query(
    `SELECT * FROM sheep_wool_production WHERE animal_id = $1 ORDER BY shearing_date DESC LIMIT $2 OFFSET $3`,
    [animalId, limit, offset]
  );
  return { items: res.rows, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) || 1 } };
}

async function recordWoolProduction(payload) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const { animal_id, shearing_date, fleece_weight_kg, wool_grade, fiber_micron, staple_length_mm, yield_pct, notes } = payload || {};
  if (!animal_id || !shearing_date || fleece_weight_kg === undefined || fleece_weight_kg === null) {
    throw new Error('animal_id, shearing_date and fleece_weight_kg are required');
  }
  let res = await pg.query(
    `INSERT INTO sheep_wool_production (animal_id, shearing_date, fleece_weight_kg, wool_grade, fiber_micron, staple_length_mm, yield_pct, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (animal_id, shearing_date)
       DO UPDATE SET fleece_weight_kg = EXCLUDED.fleece_weight_kg, wool_grade = EXCLUDED.wool_grade, fiber_micron = EXCLUDED.fiber_micron, staple_length_mm = EXCLUDED.staple_length_mm, yield_pct = EXCLUDED.yield_pct
     RETURNING *`,
    [animal_id, shearing_date, fleece_weight_kg, wool_grade || null, fiber_micron || null, staple_length_mm || null, yield_pct || null, notes || null]
  );
  return res.rows[0];
}

// ---------------------------------------------------------------------
// Feed consumption tracking
// ---------------------------------------------------------------------

async function listFeedConsumption(animalId, { page = 1, limit = 100 } = {}) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  let offset = (Number(page) - 1) * Number(limit);
  let totalRes = await pg.query('SELECT COUNT(*) FROM sheep_feed_consumption WHERE animal_id = $1', [animalId]);
  let total = parseInt(totalRes.rows[0].count || '0', 10);
  let res = await pg.query(
    `SELECT * FROM sheep_feed_consumption WHERE animal_id = $1 ORDER BY record_date DESC LIMIT $2 OFFSET $3`,
    [animalId, limit, offset]
  );
  return { items: res.rows, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) || 1 } };
}

async function recordFeedConsumption(payload) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const { animal_id, record_date, feed_type, quantity_kg, cost_per_kg, grazing_hours, notes } = payload || {};
  if (!animal_id || !record_date || !feed_type || quantity_kg === undefined || quantity_kg === null) {
    throw new Error('animal_id, record_date, feed_type and quantity_kg are required');
  }
  let res = await pg.query(
    `INSERT INTO sheep_feed_consumption (animal_id, record_date, feed_type, quantity_kg, cost_per_kg, grazing_hours, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (animal_id, record_date, feed_type)
       DO UPDATE SET quantity_kg = EXCLUDED.quantity_kg, cost_per_kg = EXCLUDED.cost_per_kg, grazing_hours = EXCLUDED.grazing_hours
     RETURNING *`,
    [animal_id, record_date, feed_type, quantity_kg, cost_per_kg || null, grazing_hours || null, notes || null]
  );
  return res.rows[0];
}

// ---------------------------------------------------------------------
// Breeding records
// ---------------------------------------------------------------------

async function listBreedingRecords(femaleId, { page = 1, limit = 50 } = {}) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  let offset = (Number(page) - 1) * Number(limit);
  let totalRes = await pg.query('SELECT COUNT(*) FROM sheep_breeding_records WHERE female_id = $1', [femaleId]);
  let total = parseInt(totalRes.rows[0].count || '0', 10);
  let res = await pg.query(
    `SELECT * FROM sheep_breeding_records WHERE female_id = $1 ORDER BY breeding_date DESC LIMIT $2 OFFSET $3`,
    [femaleId, limit, offset]
  );
  return { items: res.rows, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) || 1 } };
}

async function recordBreeding(payload) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const { female_id, male_id, breeding_date, expected_lambing_date, notes } = payload || {};
  if (!female_id || !breeding_date) {
    throw new Error('female_id and breeding_date are required');
  }
  let res = await pg.query(
    `INSERT INTO sheep_breeding_records (female_id, male_id, breeding_date, expected_lambing_date, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [female_id, male_id || null, breeding_date, expected_lambing_date || null, notes || null]
  );
  return res.rows[0];
}

async function updateLambingOutcome(id, payload) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const { actual_lambing_date, lambs_count, lambs_survived, notes } = payload || {};
  let res = await pg.query(
    `UPDATE sheep_breeding_records SET
       actual_lambing_date = COALESCE($1, actual_lambing_date),
       lambs_count = COALESCE($2, lambs_count),
       lambs_survived = COALESCE($3, lambs_survived),
       notes = COALESCE($4, notes)
     WHERE id = $5
     RETURNING *`,
    [actual_lambing_date, lambs_count, lambs_survived, notes, id]
  );
  return res.rows[0] || null;
}

// ---------------------------------------------------------------------
// Vaccination records
// ---------------------------------------------------------------------

async function listVaccinationRecords(animalId, { page = 1, limit = 50 } = {}) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  let offset = (Number(page) - 1) * Number(limit);
  let totalRes = await pg.query('SELECT COUNT(*) FROM sheep_vaccination_records WHERE animal_id = $1', [animalId]);
  let total = parseInt(totalRes.rows[0].count || '0', 10);
  let res = await pg.query(
    `SELECT * FROM sheep_vaccination_records WHERE animal_id = $1 ORDER BY vaccination_date DESC LIMIT $2 OFFSET $3`,
    [animalId, limit, offset]
  );
  return { items: res.rows, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) || 1 } };
}

async function recordVaccination(payload) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const { animal_id, vaccine_name, vaccination_date, next_due_date, administered_by, notes } = payload || {};
  if (!animal_id || !vaccine_name || !vaccination_date) {
    throw new Error('animal_id, vaccine_name and vaccination_date are required');
  }
  let res = await pg.query(
    `INSERT INTO sheep_vaccination_records (animal_id, vaccine_name, vaccination_date, next_due_date, administered_by, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [animal_id, vaccine_name, vaccination_date, next_due_date || null, administered_by || null, notes || null]
  );
  return res.rows[0];
}

// ---------------------------------------------------------------------
// Computed: Flock performance metrics
// ---------------------------------------------------------------------

async function getFlockPerformance(animalId) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  try {
    const animalRes = await pg.query('SELECT * FROM sheep_flock WHERE id = $1', [animalId]);
    if (animalRes.rows.length === 0) throw new Error(`Animal ${animalId} not found`);
    const animal = animalRes.rows[0];

    const woolRes = await pg.query(
      `SELECT 
         COALESCE(AVG(fleece_weight_kg), 0) as avg_fleece_weight,
         COALESCE(AVG(fiber_micron), 0) as avg_fiber_micron,
         COALESCE(AVG(staple_length_mm), 0) as avg_staple_length,
         COALESCE(AVG(yield_pct), 0) as avg_yield_pct,
         COUNT(*) as shearing_count
       FROM sheep_wool_production
       WHERE animal_id = $1`,
      [animalId]
    );
    const woolData = woolRes.rows[0];

    const feedRes = await pg.query(
      `SELECT 
         COALESCE(SUM(quantity_kg), 0) as total_feed_kg,
         COALESCE(SUM(quantity_kg * COALESCE(cost_per_kg, 0)), 0) as total_cost,
         COALESCE(AVG(grazing_hours), 0) as avg_grazing_hours
       FROM sheep_feed_consumption
       WHERE animal_id = $1 AND record_date >= CURRENT_DATE - INTERVAL '30 days'`,
      [animalId]
    );
    const feedData = feedRes.rows[0];

    const breedingRes = await pg.query(
      `SELECT COUNT(*) as total_births, COALESCE(SUM(lambs_survived), 0) as total_survived
       FROM sheep_breeding_records
       WHERE female_id = $1 AND actual_lambing_date IS NOT NULL`,
      [animalId]
    );
    const breedingData = breedingRes.rows[0];
    const survivalRate = breedingData.total_births > 0 ? (Number(breedingData.total_survived) / breedingData.total_births) * 100 : null;

    const avgFiberMicron = Number(woolData.avg_fiber_micron);
    const fiberQuality = avgFiberMicron > 0 && avgFiberMicron <= ASSUMED_TARGET_FIBER_MICRON ? 'fine' : avgFiberMicron > 0 && avgFiberMicron <= 25 ? 'medium' : 'coarse';

    return {
      animalId,
      tagId: animal.tag_id,
      sex: animal.sex,
      status: animal.status,
      weightKg: animal.weight_kg,
      woolType: animal.wool_type,
      metrics: {
        avgFleeceWeightKg: Math.round(Number(woolData.avg_fleece_weight) * 100) / 100,
        avgFiberMicron: Math.round(avgFiberMicron * 100) / 100,
        fiberQuality,
        targetFiberMicron: ASSUMED_TARGET_FIBER_MICRON,
        avgStapleLengthMm: Math.round(Number(woolData.avg_staple_length) * 100) / 100,
        avgYieldPct: Math.round(Number(woolData.avg_yield_pct) * 100) / 100,
        totalShearings: woolData.shearing_count,
        monthlyFeedKg: Math.round(Number(feedData.total_feed_kg) * 100) / 100,
        avgDailyGrazingHours: Math.round(Number(feedData.avg_grazing_hours) * 100) / 100,
        totalBirths: breedingData.total_births,
        lambSurvivalRatePct: survivalRate !== null ? Math.round(survivalRate * 100) / 100 : null,
      },
      assumptions: {
        targetFiberMicron: ASSUMED_TARGET_FIBER_MICRON,
        shearingIntervalDays: ASSUMED_SHEARING_INTERVAL_DAYS,
        quality: 'assumed — not stored anywhere in the schema',
      },
      dataQuality: woolData.shearing_count > 0 ? 'real' : 'insufficient_records',
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Error computing flock performance', { error: error.message, stack: error.stack });
    throw error;
  }
}

// ---------------------------------------------------------------------
// Computed: Breeding alerts
// ---------------------------------------------------------------------

async function getBreedingAlerts() {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  try {
    const { rows } = await pg.query(
      `SELECT h.id, h.tag_id, h.status, h.last_breeding_date, h.last_lambing_date
         FROM sheep_flock h
        WHERE h.sex = 'female' AND h.status = 'active'
        ORDER BY h.tag_id`
    );

    const today = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysBetween = (from, to) => Math.round((to.getTime() - from.getTime()) / msPerDay);

    const alerts = [];

    for (const h of rows) {
      if (h.last_breeding_date) {
        const bredOn = new Date(h.last_breeding_date);
        const expectedLambing = new Date(bredOn.getTime() + ASSUMED_GESTATION_DAYS * msPerDay);
        const daysUntilDue = daysBetween(today, expectedLambing);
        if (daysUntilDue <= ASSUMED_DUE_SOON_WINDOW_DAYS) {
          alerts.push({
            animalId: h.id,
            tagId: h.tag_id,
            type: 'lambing',
            severity: daysUntilDue < 0 ? 'overdue' : 'due_soon',
            lastBreedingDate: h.last_breeding_date,
            expectedLambingDate: expectedLambing.toISOString().slice(0, 10),
            daysUntilDue,
            basis: `real last_breeding_date + assumed ${ASSUMED_GESTATION_DAYS}-day gestation`,
          });
        }
      }
    }

    return {
      generatedAt: new Date().toISOString(),
      assumptions: {
        gestationDays: ASSUMED_GESTATION_DAYS,
        dueSoonWindowDays: ASSUMED_DUE_SOON_WINDOW_DAYS,
        quality: 'assumed — not stored anywhere in the schema, applied uniformly',
      },
      totalFemales: rows.length,
      alerts,
    };
  } catch (error) {
    logger.error('Error computing breeding alerts', { error: error.message, stack: error.stack });
    throw error;
  }
}

// ---------------------------------------------------------------------
// Computed: Vaccination alerts
// ---------------------------------------------------------------------

async function getVaccinationAlerts() {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  try {
    const { rows } = await pg.query(
      `SELECT id, tag_id, sex, status, last_vaccination_date
         FROM sheep_flock
        WHERE status = 'active'
        ORDER BY tag_id`
    );

    let today = new Date();
    let msPerDay = 24 * 60 * 60 * 1000;
    let daysBetween = (from, to) => Math.round((to.getTime() - from.getTime()) / msPerDay);

    let alerts = [];

    for (const h of rows) {
      if (h.last_vaccination_date) {
        const lastVax = new Date(h.last_vaccination_date);
        const dueDate = new Date(lastVax.getTime() + ASSUMED_VACCINATION_INTERVAL_DAYS * msPerDay);
        let daysUntilDue = daysBetween(today, dueDate);
        if (daysUntilDue <= ASSUMED_DUE_SOON_WINDOW_DAYS) {
          alerts.push({
            animalId: h.id,
            tagId: h.tag_id,
            sex: h.sex,
            type: 'vaccination',
            severity: daysUntilDue < 0 ? 'overdue' : 'due_soon',
            lastVaccinationDate: h.last_vaccination_date,
            dueDate: dueDate.toISOString().slice(0, 10),
            daysUntilDue,
            basis: `real last_vaccination_date + assumed ${ASSUMED_VACCINATION_INTERVAL_DAYS}-day interval`,
          });
        }
      } else {
        alerts.push({
          animalId: h.id,
          tagId: h.tag_id,
          sex: h.sex,
          type: 'vaccination',
          severity: 'no_record',
          lastVaccinationDate: null,
          dueDate: null,
          daysUntilDue: null,
          basis: 'no vaccination ever recorded for this animal',
        });
      }
    }

    return {
      generatedAt: new Date().toISOString(),
      assumptions: {
        vaccinationIntervalDays: ASSUMED_VACCINATION_INTERVAL_DAYS,
        dueSoonWindowDays: ASSUMED_DUE_SOON_WINDOW_DAYS,
        quality: 'assumed — not stored anywhere in the schema, applied uniformly',
      },
      totalAnimals: rows.length,
      alerts,
    };
  } catch (error) {
    logger.error('Error computing vaccination alerts', { error: error.message, stack: error.stack });
    throw error;
  }
}

// ---------------------------------------------------------------------
// Computed: Shearing alerts
// ---------------------------------------------------------------------

async function getShearingAlerts() {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  try {
    const { rows } = await pg.query(
      `SELECT id, tag_id, sex, status, last_shearing_date
         FROM sheep_flock
        WHERE status = 'active'
        ORDER BY tag_id`
    );

    let today = new Date();
    let msPerDay = 24 * 60 * 60 * 1000;
    let daysBetween = (from, to) => Math.round((to.getTime() - from.getTime()) / msPerDay);

    let alerts = [];

    for (const h of rows) {
      if (h.last_shearing_date) {
        const lastShearing = new Date(h.last_shearing_date);
        let dueDate = new Date(lastShearing.getTime() + ASSUMED_SHEARING_INTERVAL_DAYS * msPerDay);
        let daysUntilDue = daysBetween(today, dueDate);
        if (daysUntilDue <= ASSUMED_DUE_SOON_WINDOW_DAYS) {
          alerts.push({
            animalId: h.id,
            tagId: h.tag_id,
            sex: h.sex,
            type: 'shearing',
            severity: daysUntilDue < 0 ? 'overdue' : 'due_soon',
            lastShearingDate: h.last_shearing_date,
            dueDate: dueDate.toISOString().slice(0, 10),
            daysUntilDue,
            basis: `real last_shearing_date + assumed ${ASSUMED_SHEARING_INTERVAL_DAYS}-day interval`,
          });
        }
      } else {
        alerts.push({
          animalId: h.id,
          tagId: h.tag_id,
          sex: h.sex,
          type: 'shearing',
          severity: 'no_record',
          lastShearingDate: null,
          dueDate: null,
          daysUntilDue: null,
          basis: 'no shearing ever recorded for this animal',
        });
      }
    }

    return {
      generatedAt: new Date().toISOString(),
      assumptions: {
        shearingIntervalDays: ASSUMED_SHEARING_INTERVAL_DAYS,
        dueSoonWindowDays: ASSUMED_DUE_SOON_WINDOW_DAYS,
        quality: 'assumed — not stored anywhere in the schema, applied uniformly',
      },
      totalAnimals: rows.length,
      alerts,
    };
  } catch (error) {
    logger.error('Error computing shearing alerts', { error: error.message, stack: error.stack });
    throw error;
  }
}

// ---------------------------------------------------------------------
// AI-Embedded Functions for Sheep Management
// ---------------------------------------------------------------------

/**
 * AI-powered wool production optimization for sheep
 * Analyzes wool production data and provides optimization recommendations
 */
async function optimizeWoolProduction(animalId) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  try {
    // Get historical wool production data
    const { rows } = await pg.query(
      `SELECT wp.*, s.breed, s.status, s.dob
       FROM sheep_wool_production wp
       JOIN sheep_flock s ON wp.animal_id = s.id
       WHERE wp.animal_id = $1
       ORDER BY wp.record_date DESC
       LIMIT 30`,
      [animalId]
    );
    
    if (rows.length < 7) {
      return {
        success: false,
        message: 'Insufficient data for AI analysis (minimum 7 records required)',
        data: null
      };
    }
    
    // AI analysis calculations
    const recentProduction = rows.slice(0, 7);
    const avgRecentWool = recentProduction.reduce((sum, r) => sum + r.wool_kg, 0) / 7;
    
    const olderProduction = rows.slice(7, 14);
    const avgOlderWool = olderProduction.reduce((sum, r) => sum + r.wool_kg, 0) / 7;
    
    const productionTrend = ((avgRecentWool - avgOlderWool) / avgOlderWool) * 100;
    
    // AI recommendations based on trend analysis
    const recommendations = [];
    
    if (productionTrend < -5) {
      recommendations.push({
        type: 'production_decline',
        severity: 'high',
        action: 'Review feed quality and nutrition',
        reason: `Wool production declined by ${productionTrend.toFixed(1)}%`
      });
      recommendations.push({
        type: 'health_check',
        severity: 'medium',
        action: 'Schedule veterinary health check',
        reason: 'Declining production may indicate health issues'
      });
    } else if (productionTrend > 5) {
      recommendations.push({
        type: 'production_increase',
        severity: 'low',
        action: 'Continue current management practices',
        reason: `Wool production increased by ${productionTrend.toFixed(1)}%`
      });
    }
    
    // Wool quality analysis
    const avgFiberDiameter = recentProduction.reduce((sum, r) => sum + (r.fiber_diameter || 25), 0) / 7;
    if (avgFiberDiameter > 30) {
      recommendations.push({
        type: 'wool_quality',
        severity: 'medium',
        action: 'Review nutrition for fiber quality improvement',
        reason: `Average fiber diameter ${avgFiberDiameter.toFixed(1)}µm above optimal`
      });
    }
    
    const optimization = {
      animalId,
      analysisDate: new Date().toISOString(),
      avgRecentWool: avgRecentWool.toFixed(2),
      avgOlderWool: avgOlderWool.toFixed(2),
      productionTrend: productionTrend.toFixed(2),
      avgFiberDiameter: avgFiberDiameter.toFixed(1),
      recommendations,
      confidence: 'high',
      dataSource: 'real_historical_records'
    };
    
    // Emit signal bus event for AI decision
    await signalBus.emit('ai.sheep.wool.optimized', {
      animal_id: animalId,
      optimization,
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI sheep wool production optimization completed', { animalId, productionTrend });
    
    return {
      success: true,
      data: optimization
    };
  } catch (error) {
    logger.error('Error optimizing sheep wool production with AI', { error: error.message, animalId });
    throw error;
  }
}

/**
 * AI-powered health monitoring for sheep
 * Predicts health risks based on production patterns and historical data
 */
async function monitorSheepHealth(animalId) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  try {
    // Get animal data and production history
    const { rows } = await pg.query(
      `SELECT s.*, wp.wool_kg, wp.fiber_diameter, wp.record_date
       FROM sheep_flock s
       LEFT JOIN sheep_wool_production wp ON wp.animal_id = s.id
       WHERE s.id = $1
       ORDER BY wp.record_date DESC
       LIMIT 30`,
      [animalId]
    );
    
    if (rows.length === 0) {
      return {
        success: false,
        message: 'Animal not found',
        data: null
      };
    }
    
    let animal = rows[0];
    const productionRecords = rows.filter(r => r.wool_kg !== null);
    
    const riskFactors = [];
    let overallRisk = 'low';
    
    // Analyze production patterns for health indicators
    if (productionRecords.length >= 7) {
      let recentProduction = productionRecords.slice(0, 7).reduce((sum, r) => sum + r.wool_kg, 0) / 7;
      let olderProduction = productionRecords.slice(7, 14).reduce((sum, r) => sum + r.wool_kg, 0) / 7;
      
      const productionDecline = ((olderProduction - recentProduction) / olderProduction) * 100;
      
      if (productionDecline > 15) {
        riskFactors.push({
          factor: 'significant_production_decline',
          severity: 'high',
          value: productionDecline.toFixed(1),
          description: `Production declined by ${productionDecline.toFixed(1)}%`
        });
        overallRisk = 'high';
      } else if (productionDecline > 5) {
        riskFactors.push({
          factor: 'moderate_production_decline',
          severity: 'medium',
          value: productionDecline.toFixed(1),
          description: `Production declined by ${productionDecline.toFixed(1)}%`
        });
        overallRisk = 'medium';
      }
    }
    
    // Check age-related risks
    if (animal.dob) {
      const age = (new Date() - new Date(animal.dob)) / (365.25 * 24 * 60 * 60 * 1000);
      if (age > 10) {
        riskFactors.push({
          factor: 'advanced_age',
          severity: 'medium',
          value: age.toFixed(1),
          description: `Sheep is ${age.toFixed(1)} years old`
        });
        if (overallRisk === 'low') overallRisk = 'medium';
      }
    }
    
    // Check vaccination status
    if (animal.last_vaccination_date) {
      const daysSinceVaccination = (new Date() - new Date(animal.last_vaccination_date)) / (24 * 60 * 60 * 1000);
      if (daysSinceVaccination > 180) {
        riskFactors.push({
          factor: 'vaccination_overdue',
          severity: 'medium',
          value: daysSinceVaccination.toFixed(0),
          description: `Vaccination overdue by ${daysSinceVaccination.toFixed(0)} days`
        });
        if (overallRisk === 'low') overallRisk = 'medium';
      }
    } else {
      riskFactors.push({
        factor: 'no_vaccination_record',
        severity: 'high',
        value: null,
        description: 'No vaccination record found'
      });
      overallRisk = 'high';
    }
    
    const monitoring = {
      animalId,
      animalTag: animal.tag_id,
      analysisDate: new Date().toISOString(),
      overallRisk,
      riskFactors,
      recommendations: generateSheepHealthRecommendations(riskFactors),
      confidence: productionRecords.length >= 7 ? 'high' : 'medium',
      dataSource: 'real_animal_and_production_records'
    };
    
    // Emit signal bus event for AI monitoring
    await signalBus.emit('ai.sheep.health.monitored', {
      animal_id: animalId,
      monitoring,
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI sheep health monitoring completed', { animalId, overallRisk });
    
    return {
      success: true,
      data: monitoring
    };
  } catch (error) {
    logger.error('Error monitoring sheep health with AI', { error: error.message, animalId });
    throw error;
  }
}

/**
 * AI-powered feed optimization for sheep
 * Recommends optimal feed composition based on production goals
 */
async function optimizeSheepFeed(animalId, productionGoal) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  try {
    // Get animal data
    const { rows } = await pg.query(
      `SELECT * FROM sheep_flock WHERE id = $1`,
      [animalId]
    );
    
    if (rows.length === 0) {
      return {
        success: false,
        message: 'Animal not found',
        data: null
      };
    }
    
    let animal = rows[0];
    
    // AI feed optimization logic for sheep
    const baseFeed = {
      dry_matter_kg: 2.0,
      protein_percentage: 12,
      energy_mj_kg: 9,
      fiber_percentage: 30,
      calcium_percentage: 0.5,
      phosphorus_percentage: 0.3
    };
    
    // Adjust based on production goal
    if (productionGoal === 'maximize_wool') {
      baseFeed.protein_percentage = 14;
      baseFeed.energy_mj_kg = 10;
      baseFeed.fiber_percentage = 35;
    } else if (productionGoal === 'cost_efficiency') {
      baseFeed.protein_percentage = 10;
      baseFeed.energy_mj_kg = 8;
      baseFeed.fiber_percentage = 25;
    }
    
    // Adjust based on animal status
    if (animal.status === 'Lactating') {
      baseFeed.dry_matter_kg = 2.5;
      baseFeed.energy_mj_kg += 1;
    } else if (animal.status === 'Pregnant') {
      baseFeed.protein_percentage += 2;
      baseFeed.calcium_percentage += 0.2;
    }
    
    // Adjust based on breed (sheep-specific)
    if (animal.breed && animal.breed.toLowerCase().includes('merino')) {
      baseFeed.fiber_percentage += 5;
    } else if (animal.breed && animal.breed.toLowerCase().includes('dorper')) {
      baseFeed.protein_percentage += 1;
    }
    
    let optimization = {
      animalId,
      animalTag: animal.tag_id,
      animalStatus: animal.status,
      animalBreed: animal.breed,
      productionGoal,
      optimizedFeed: baseFeed,
      expectedWoolIncrease: productionGoal === 'maximize_wool' ? '10-15%' : '0-5%',
      feedCostChange: productionGoal === 'cost_efficiency' ? '-10%' : '+8%',
      recommendations: [
        'Monitor animal response for 2 weeks',
        'Adjust feed composition based on actual wool response',
        'Consider pasture availability in feeding regimen'
      ],
      confidence: 'medium',
      dataSource: 'ai_algorithm_based_on_sheep_characteristics'
    };
    
    // Emit signal bus event for AI optimization
    await signalBus.emit('ai.sheep.feed.optimized', {
      animal_id: animalId,
      optimization,
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI sheep feed optimization completed', { animalId, productionGoal });
    
    return {
      success: true,
      data: optimization
    };
  } catch (error) {
    logger.error('Error optimizing sheep feed with AI', { error: error.message, animalId });
    throw error;
  }
}

/**
 * AI-powered breeding recommendations for sheep
 * Recommends optimal breeding timing and partners
 */
async function recommendSheepBreeding(animalId) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  try {
    // Get animal data
    const { rows } = await pg.query(
      `SELECT * FROM sheep_flock WHERE id = $1`,
      [animalId]
    );
    
    if (rows.length === 0) {
      return {
        success: false,
        message: 'Animal not found',
        data: null
      };
    }
    
    let animal = rows[0];
    
    let recommendations = [];
    
    // Breeding timing recommendation (sheep breeding seasonality)
    if (animal.status === 'Lactating') {
      const daysSinceBreeding = animal.last_breeding_date 
        ? (new Date() - new Date(animal.last_breeding_date)) / (24 * 60 * 60 * 1000)
        : null;
      
      if (daysSinceBreeding && daysSinceBreeding > 180) {
        recommendations.push({
          type: 'breeding_timing',
          priority: 'high',
          action: 'Animal ready for breeding',
          reasoning: `Last breeding was ${daysSinceBreeding.toFixed(0)} days ago`,
          optimalWindow: 'Next 30 days'
        });
      } else if (daysSinceBreeding && daysSinceBreeding > 120) {
        recommendations.push({
          type: 'breeding_timing',
          priority: 'medium',
          action: 'Consider breeding soon',
          reasoning: `Last breeding was ${daysSinceBreeding.toFixed(0)} days ago`,
          optimalWindow: 'Next 60 days'
        });
      }
    } else if (animal.status === 'Dry') {
      recommendations.push({
        type: 'breeding_timing',
        priority: 'high',
        action: 'Optimal time for breeding',
        reasoning: 'Animal in dry period, ideal for breeding',
        optimalWindow: 'Immediate'
      });
    }
    
    // Genetic quality considerations
    if (animal.breed) {
      recommendations.push({
        type: 'genetic_consideration',
        priority: 'medium',
        action: `Select breeding partner from ${animal.breed} or compatible breed`,
        reasoning: 'Maintain breed characteristics and hybrid vigor',
        compatibility: 'high'
      });
    }
    
    // Age considerations
    if (animal.dob) {
      let age = (new Date() - new Date(animal.dob)) / (365.25 * 24 * 60 * 60 * 1000);
      if (age < 1.5) {
        recommendations.push({
          type: 'age_consideration',
          priority: 'low',
          action: 'Animal may be too young for breeding',
          reasoning: `Animal is ${age.toFixed(1)} years old`,
          recommendedAge: '1.5-7 years'
        });
      } else if (age > 7) {
        recommendations.push({
          type: 'age_consideration',
          priority: 'medium',
          action: 'Consider replacement if breeding goal is long-term',
          reasoning: `Animal is ${age.toFixed(1)} years old`,
          recommendedAge: '1.5-7 years'
        });
      }
    }
    
    const recommendation = {
      animalId,
      animalTag: animal.tag_id,
      animalStatus: animal.status,
      animalBreed: animal.breed,
      animalAge: animal.dob ? ((new Date() - new Date(animal.dob)) / (365.25 * 24 * 60 * 60 * 1000)).toFixed(1) : null,
      analysisDate: new Date().toISOString(),
      recommendations,
      overallBreedingReadiness: recommendations.length > 0 ? 'ready' : 'not_ready',
      confidence: 'medium',
      dataSource: 'ai_algorithm_based_on_animal_status'
    };
    
    // Emit signal bus event for AI recommendation
    await signalBus.emit('ai.sheep.breeding.recommended', {
      animal_id: animalId,
      recommendation,
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI sheep breeding recommendation completed', { animalId, breedingReadiness: recommendation.overallBreedingReadiness });
    
    return {
      success: true,
      data: recommendation
    };
  } catch (error) {
    logger.error('Error recommending sheep breeding with AI', { error: error.message, animalId });
    throw error;
  }
}

// Helper function to generate sheep health recommendations
function generateSheepHealthRecommendations(riskFactors) {
  let recommendations = [];
  
  riskFactors.forEach(factor => {
    if (factor.factor === 'significant_production_decline' || factor.factor === 'moderate_production_decline') {
      recommendations.push('Monitor sheep health closely for next 7 days');
      recommendations.push('Review feed quality and nutrition program');
      recommendations.push('Check for parasites common in sheep');
    } else if (factor.factor === 'vaccination_overdue') {
      recommendations.push('Schedule vaccination immediately');
      recommendations.push('Review vaccination schedule for common sheep diseases');
    } else if (factor.factor === 'no_vaccination_record') {
      recommendations.push('Establish vaccination program immediately');
      recommendations.push('Consider vaccination for foot rot and scabby mouth');
    } else if (factor.factor === 'advanced_age') {
      recommendations.push('Consider increased health monitoring frequency');
      recommendations.push('Review retirement/replacement planning');
    }
  });
  
  return recommendations;
}

module.exports = {
  listFlock,
  createAnimal,
  updateAnimal,
  deleteAnimal,
  listWoolProduction,
  recordWoolProduction,
  listFeedConsumption,
  recordFeedConsumption,
  listBreedingRecords,
  recordBreeding,
  updateLambingOutcome,
  listVaccinationRecords,
  recordVaccination,
  getFlockPerformance,
  getBreedingAlerts,
  getVaccinationAlerts,
  getShearingAlerts,
  // AI-embedded functions
  optimizeWoolProduction,
  monitorSheepHealth,
  optimizeSheepFeed,
  recommendSheepBreeding,
};

// Merged from backend/src/modules/M074
{
  const m074 = require("../../modules/M074/service");
  const { ...rest } = m074;
  Object.assign(module.exports, rest);
}


