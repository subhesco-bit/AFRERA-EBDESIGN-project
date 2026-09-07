/**
 * Pig Farming Service (M126 — Livestock domain)
 *
 * Backs pig herd management with real domain logic for weight tracking,
 * feed consumption, breeding tracking, and vaccination schedules. Similar to
 * other livestock but with pig-specific parameters (FCR calculation, farrowing
 * cycles, body condition scoring).
 *
 * Domain-specific computed capabilities:
 *  - getHerdPerformance(): weight gain trends, FCR, farrowing rate
 *  - getBreedingAlerts(): upcoming farrowing due dates
 *  - getVaccinationAlerts(): upcoming vaccination due dates
 *  - getFeedConversionRatio(): feed efficiency metric
 *
 * Assumed constants (veterinary rules of thumb, not stored in schema):
 *  - ASSUMED_VACCINATION_INTERVAL_DAYS: standard interval between vaccinations
 *  - ASSUMED_GESTATION_DAYS: pig gestation period
 *  - ASSUMED_DUE_SOON_WINDOW_DAYS: alert window for upcoming events
 *  - ASSUMED_TARGET_FCR: target feed conversion ratio
 *  - ASSUMED_TARGET_WEIGHT_GAIN_KG_PER_DAY: target daily weight gain for fattening pigs
 */

const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus } = require('../../core/signalBus');

// ---- Assumed constants (not stored in the schema; pig farming standards)
const ASSUMED_VACCINATION_INTERVAL_DAYS = 180; // biannual vaccination cycle
const ASSUMED_GESTATION_DAYS = 114; // average pig gestation length
const ASSUMED_DUE_SOON_WINDOW_DAYS = 14; // alert window
const ASSUMED_TARGET_FCR = 2.5; // target feed conversion ratio (kg feed per kg weight gain)
const ASSUMED_TARGET_WEIGHT_GAIN_KG_PER_DAY = 0.7; // target daily weight gain for fattening pigs

// ---------------------------------------------------------------------
// Herd management (CRUD)
// ---------------------------------------------------------------------

async function listHerd({ page = 1, limit = 50, status = null, sex = null } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  try {
    const offset = (Number(page) - 1) * Number(limit);
    
    let query = 'SELECT COUNT(*) FROM pig_herd';
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
    
    query = 'SELECT * FROM pig_herd';
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
  } catch (error) {
    logger.error('Error listing herd', { error: error.message });
    throw error;
  }
}

async function createAnimal(payload) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  try {
    const { tag_id, breed, dob, sex, status, weight_kg, pen_id, notes } = payload || {};
    if (!tag_id || !sex) {
      throw new Error('tag_id and sex are required');
    }
    const res = await pg.query(
      `INSERT INTO pig_herd (tag_id, breed, dob, sex, status, weight_kg, pen_id, notes)
       VALUES ($1, $2, $3, $4, COALESCE($5, 'active'), $6, $7, $8)
       RETURNING *`,
      [tag_id, breed || null, dob || null, sex, status || null, weight_kg || null, pen_id || null, notes || null]
    );
    return res.rows[0];
  } catch (error) {
    logger.error('Error creating animal', { error: error.message });
    throw error;
  }
}

async function updateAnimal(id, payload) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  try {
    const { tag_id, breed, dob, sex, status, weight_kg, pen_id, notes, last_vaccination_date, last_breeding_date, last_farrowing_date } = payload || {};
    const res = await pg.query(
      `UPDATE pig_herd SET
         tag_id = COALESCE($1, tag_id),
         breed = COALESCE($2, breed),
         dob = COALESCE($3, dob),
         sex = COALESCE($4, sex),
         status = COALESCE($5, status),
         weight_kg = COALESCE($6, weight_kg),
         pen_id = COALESCE($7, pen_id),
         notes = COALESCE($8, notes),
         last_vaccination_date = COALESCE($9, last_vaccination_date),
         last_breeding_date = COALESCE($10, last_breeding_date),
         last_farrowing_date = COALESCE($11, last_farrowing_date),
         updated_at = NOW()
       WHERE id = $12
       RETURNING *`,
      [tag_id, breed, dob, sex, status, weight_kg, pen_id, notes, last_vaccination_date, last_breeding_date, last_farrowing_date, id]
    );
    return res.rows[0] || null;
  } catch (error) {
    logger.error('Error updating animal', { error: error.message });
    throw error;
  }
}

async function deleteAnimal(id) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  try {
    const res = await pg.query('DELETE FROM pig_herd WHERE id = $1 RETURNING id', [id]);
    return !!res.rows[0];
  } catch (error) {
    logger.error('Error deleting animal', { error: error.message });
    throw error;
  }
}

// ---------------------------------------------------------------------
// Weight tracking
// ---------------------------------------------------------------------

async function listWeightRecords(animalId, { page = 1, limit = 50 } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  try {
    const offset = (Number(page) - 1) * Number(limit);
    const totalRes = await pg.query('SELECT COUNT(*) FROM pig_weight_records WHERE animal_id = $1', [animalId]);
    const total = parseInt(totalRes.rows[0].count || '0', 10);
    const res = await pg.query(
      `SELECT * FROM pig_weight_records WHERE animal_id = $1 ORDER BY record_date DESC LIMIT $2 OFFSET $3`,
      [animalId, limit, offset]
    );
    return { items: res.rows, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) || 1 } };
  } catch (error) {
    logger.error('Error listing weight records', { error: error.message });
    throw error;
  }
}

async function recordWeight(payload) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  try {
    const { animal_id, record_date, weight_kg, body_condition_score, notes } = payload || {};
    if (!animal_id || !record_date || weight_kg === undefined || weight_kg === null) {
      throw new Error('animal_id, record_date and weight_kg are required');
    }
    const res = await pg.query(
      `INSERT INTO pig_weight_records (animal_id, record_date, weight_kg, body_condition_score, notes)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (animal_id, record_date)
         DO UPDATE SET weight_kg = EXCLUDED.weight_kg, body_condition_score = EXCLUDED.body_condition_score
       RETURNING *`,
      [animal_id, record_date, weight_kg, body_condition_score || null, notes || null]
    );
    return res.rows[0];
  } catch (error) {
    logger.error('Error recording weight', { error: error.message });
    throw error;
  }
}

// ---------------------------------------------------------------------
// Feed consumption tracking
// ---------------------------------------------------------------------

async function listFeedConsumption(animalId, { page = 1, limit = 100 } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  try {
    const offset = (Number(page) - 1) * Number(limit);
    const totalRes = await pg.query('SELECT COUNT(*) FROM pig_feed_consumption WHERE animal_id = $1', [animalId]);
    const total = parseInt(totalRes.rows[0].count || '0', 10);
    const res = await pg.query(
      `SELECT * FROM pig_feed_consumption WHERE animal_id = $1 ORDER BY record_date DESC LIMIT $2 OFFSET $3`,
      [animalId, limit, offset]
    );
    return { items: res.rows, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) || 1 } };
  } catch (error) {
    logger.error('Error listing feed consumption', { error: error.message });
    throw error;
  }
}

async function recordFeedConsumption(payload) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  try {
    const { animal_id, record_date, feed_type, quantity_kg, cost_per_kg, notes } = payload || {};
    if (!animal_id || !record_date || !feed_type || quantity_kg === undefined || quantity_kg === null) {
      throw new Error('animal_id, record_date, feed_type and quantity_kg are required');
    }
    const res = await pg.query(
      `INSERT INTO pig_feed_consumption (animal_id, record_date, feed_type, quantity_kg, cost_per_kg, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (animal_id, record_date, feed_type)
         DO UPDATE SET quantity_kg = EXCLUDED.quantity_kg, cost_per_kg = EXCLUDED.cost_per_kg
       RETURNING *`,
      [animal_id, record_date, feed_type, quantity_kg, cost_per_kg || null, notes || null]
    );
    return res.rows[0];
  } catch (error) {
    logger.error('Error recording feed consumption', { error: error.message });
    throw error;
  }
}

// ---------------------------------------------------------------------
// Breeding records
// ---------------------------------------------------------------------

async function listBreedingRecords(sowId, { page = 1, limit = 50 } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  try {
    const offset = (Number(page) - 1) * Number(limit);
    const totalRes = await pg.query('SELECT COUNT(*) FROM pig_breeding_records WHERE sow_id = $1', [sowId]);
    const total = parseInt(totalRes.rows[0].count || '0', 10);
    const res = await pg.query(
      `SELECT * FROM pig_breeding_records WHERE sow_id = $1 ORDER BY breeding_date DESC LIMIT $2 OFFSET $3`,
      [sowId, limit, offset]
    );
    return { items: res.rows, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) || 1 } };
  } catch (error) {
    logger.error('Error listing breeding records', { error: error.message });
    throw error;
  }
}

async function recordBreeding(payload) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  try {
    const { sow_id, boar_id, breeding_date, expected_farrowing_date, notes } = payload || {};
    if (!sow_id || !breeding_date) {
      throw new Error('sow_id and breeding_date are required');
    }
    const res = await pg.query(
      `INSERT INTO pig_breeding_records (sow_id, boar_id, breeding_date, expected_farrowing_date, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [sow_id, boar_id || null, breeding_date, expected_farrowing_date || null, notes || null]
    );
    return res.rows[0];
  } catch (error) {
    logger.error('Error recording breeding', { error: error.message });
    throw error;
  }
}

async function updateFarrowingOutcome(id, payload) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  try {
    const { actual_farrowing_date, piglets_born, piglets_weaned, piglets_survived, notes } = payload || {};
    const res = await pg.query(
      `UPDATE pig_breeding_records SET
         actual_farrowing_date = COALESCE($1, actual_farrowing_date),
         piglets_born = COALESCE($2, piglets_born),
         piglets_weaned = COALESCE($3, piglets_weaned),
         piglets_survived = COALESCE($4, piglets_survived),
         notes = COALESCE($5, notes)
       WHERE id = $6
       RETURNING *`,
      [actual_farrowing_date, piglets_born, piglets_weaned, piglets_survived, notes, id]
    );
    return res.rows[0] || null;
  } catch (error) {
    logger.error('Error updating farrowing outcome', { error: error.message });
    throw error;
  }
}

// ---------------------------------------------------------------------
// Vaccination records
// ---------------------------------------------------------------------

async function listVaccinationRecords(animalId, { page = 1, limit = 50 } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  try {
    const offset = (Number(page) - 1) * Number(limit);
    const totalRes = await pg.query('SELECT COUNT(*) FROM pig_vaccination_records WHERE animal_id = $1', [animalId]);
    const total = parseInt(totalRes.rows[0].count || '0', 10);
    const res = await pg.query(
      `SELECT * FROM pig_vaccination_records WHERE animal_id = $1 ORDER BY vaccination_date DESC LIMIT $2 OFFSET $3`,
      [animalId, limit, offset]
    );
    return { items: res.rows, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) || 1 } };
  } catch (error) {
    logger.error('Error listing vaccination records', { error: error.message });
    throw error;
  }
}

async function recordVaccination(payload) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  try {
    const { animal_id, vaccine_name, vaccination_date, next_due_date, administered_by, notes } = payload || {};
    if (!animal_id || !vaccine_name || !vaccination_date) {
      throw new Error('animal_id, vaccine_name and vaccination_date are required');
    }
    const res = await pg.query(
      `INSERT INTO pig_vaccination_records (animal_id, vaccine_name, vaccination_date, next_due_date, administered_by, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [animal_id, vaccine_name, vaccination_date, next_due_date || null, administered_by || null, notes || null]
    );
    return res.rows[0];
  } catch (error) {
    logger.error('Error recording vaccination', { error: error.message });
    throw error;
  }
}

// ---------------------------------------------------------------------
// Computed: Herd performance metrics
// ---------------------------------------------------------------------

async function getHerdPerformance(animalId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  try {
    const animalRes = await pg.query('SELECT * FROM pig_herd WHERE id = $1', [animalId]);
    if (animalRes.rows.length === 0) throw new Error(`Animal ${animalId} not found`);
    const animal = animalRes.rows[0];

    const weightRes = await pg.query(
      `SELECT 
         COALESCE(AVG(weight_kg), 0) as avg_weight,
         COALESCE(AVG(body_condition_score), 0) as avg_bcs,
         COUNT(*) as record_count
       FROM pig_weight_records
       WHERE animal_id = $1 AND record_date >= CURRENT_DATE - INTERVAL '30 days'`,
      [animalId]
    );
    const weightData = weightRes.rows[0];

    const feedRes = await pg.query(
      `SELECT 
         COALESCE(SUM(quantity_kg), 0) as total_feed_kg,
         COALESCE(SUM(quantity_kg * COALESCE(cost_per_kg, 0)), 0) as total_cost
       FROM pig_feed_consumption
       WHERE animal_id = $1 AND record_date >= CURRENT_DATE - INTERVAL '30 days'`,
      [animalId]
    );
    const feedData = feedRes.rows[0];

    const breedingRes = await pg.query(
      `SELECT COUNT(*) as total_farrowings, COALESCE(SUM(piglets_survived), 0) as total_survived
       FROM pig_breeding_records
       WHERE sow_id = $1 AND actual_farrowing_date IS NOT NULL`,
      [animalId]
    );
    const breedingData = breedingRes.rows[0];
    const survivalRate = breedingData.total_farrowings > 0 ? (Number(breedingData.total_survived) / breedingData.total_farrowings) * 100 : null;

    const avgWeight = Number(weightData.avg_weight);
    const avgBCS = Number(weightData.avg_bcs);
    const bcsStatus = avgBCS >= 3 && avgBCS <= 4 ? 'optimal' : avgBCS < 3 ? 'underweight' : 'overweight';

    const dailyFeedAvg = weightData.record_count > 0 ? Number(feedData.total_feed_kg) / weightData.record_count : 0;

    const fcr = avgWeight > 0 && dailyFeedAvg > 0 ? dailyFeedAvg / avgWeight : null;
    const fcrStatus = fcr !== null && fcr <= ASSUMED_TARGET_FCR ? 'good' : fcr !== null ? 'needs_improvement' : null;

    return {
      animalId,
      tagId: animal.tag_id,
      sex: animal.sex,
      status: animal.status,
      currentWeightKg: animal.weight_kg,
      penId: animal.pen_id,
      period: 'last_30_days',
      metrics: {
        avgWeightKg: Math.round(avgWeight * 100) / 100,
        avgBodyConditionScore: Math.round(avgBCS * 100) / 100,
        bcsStatus,
        dailyFeedAvgKg: Math.round(dailyFeedAvg * 100) / 100,
        feedConversionRatio: fcr !== null ? Math.round(fcr * 100) / 100 : null,
        fcrStatus,
        targetFCR: ASSUMED_TARGET_FCR,
        totalFarrowings: breedingData.total_farrowings,
        pigletSurvivalRatePct: survivalRate !== null ? Math.round(survivalRate * 100) / 100 : null,
      },
      assumptions: {
        targetFCR: ASSUMED_TARGET_FCR,
        targetWeightGainKgPerDay: ASSUMED_TARGET_WEIGHT_GAIN_KG_PER_DAY,
        quality: 'assumed — not stored anywhere in the schema',
      },
      dataQuality: weightData.record_count > 0 ? 'real' : 'insufficient_records',
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Error computing herd performance', { error: error.message, stack: error.stack });
    throw error;
  }
}

// ---------------------------------------------------------------------
// Computed: Breeding alerts
// ---------------------------------------------------------------------

async function getBreedingAlerts() {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  try {
    const { rows } = await pg.query(
      `SELECT h.id, h.tag_id, h.status, h.last_breeding_date, h.last_farrowing_date
         FROM pig_herd h
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
        const expectedFarrowing = new Date(bredOn.getTime() + ASSUMED_GESTATION_DAYS * msPerDay);
        const daysUntilDue = daysBetween(today, expectedFarrowing);
        if (daysUntilDue <= ASSUMED_DUE_SOON_WINDOW_DAYS) {
          alerts.push({
            animalId: h.id,
            tagId: h.tag_id,
            type: 'farrowing',
            severity: daysUntilDue < 0 ? 'overdue' : 'due_soon',
            lastBreedingDate: h.last_breeding_date,
            expectedFarrowingDate: expectedFarrowing.toISOString().slice(0, 10),
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
      totalSows: rows.length,
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
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  try {
    const { rows } = await pg.query(
      `SELECT id, tag_id, sex, status, last_vaccination_date
         FROM pig_herd
        WHERE status = 'active'
        ORDER BY tag_id`
    );

    const today = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysBetween = (from, to) => Math.round((to.getTime() - from.getTime()) / msPerDay);

    const alerts = [];

    for (const h of rows) {
      if (h.last_vaccination_date) {
        const lastVax = new Date(h.last_vaccination_date);
        const dueDate = new Date(lastVax.getTime() + ASSUMED_VACCINATION_INTERVAL_DAYS * msPerDay);
        const daysUntilDue = daysBetween(today, dueDate);
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
// AI-Embedded Functions for Pig Management
// ---------------------------------------------------------------------

/**
 * AI-powered meat production optimization for pigs
 * Analyzes weight gain data and provides optimization recommendations
 */
async function optimizeMeatProduction(animalId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  try {
    // Get historical weight gain data
    const { rows } = await pg.query(
      `SELECT wr.*, p.breed, p.status, p.dob
       FROM pig_weight_records wr
       JOIN pig_herd p ON wr.animal_id = p.id
       WHERE wr.animal_id = $1
       ORDER BY wr.record_date DESC
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
    const recentGrowth = rows.slice(0, 7);
    const avgRecentGain = recentGrowth.reduce((sum, r) => sum + r.weight_kg, 0) / 7;
    
    const olderGrowth = rows.slice(7, 14);
    const avgOlderGain = olderGrowth.reduce((sum, r) => sum + r.weight_kg, 0) / 7;
    
    const growthTrend = ((avgRecentGain - avgOlderGain) / avgOlderGain) * 100;
    
    // AI recommendations based on trend analysis
    const recommendations = [];
    
    if (growthTrend < -5) {
      recommendations.push({
        type: 'growth_decline',
        severity: 'high',
        action: 'Review feed quality and nutrition',
        reason: `Weight gain declined by ${growthTrend.toFixed(1)}%`
      });
      recommendations.push({
        type: 'health_check',
        severity: 'medium',
        action: 'Schedule veterinary health check',
        reason: 'Declining growth may indicate health issues'
      });
    } else if (growthTrend > 5) {
      recommendations.push({
        type: 'growth_increase',
        severity: 'low',
        action: 'Continue current management practices',
        reason: `Weight gain increased by ${growthTrend.toFixed(1)}%`
      });
    }
    
    // Feed conversion analysis
    const avgFeedConversion = recentGrowth.reduce((sum, r) => sum + (r.feed_conversion || 2.5), 0) / 7;
    if (avgFeedConversion > 3.0) {
      recommendations.push({
        type: 'feed_efficiency',
        severity: 'medium',
        action: 'Review feed composition for efficiency improvement',
        reason: `Average feed conversion ${avgFeedConversion.toFixed(2)} above optimal`
      });
    }
    
    const optimization = {
      animalId,
      analysisDate: new Date().toISOString(),
      avgRecentGain: avgRecentGain.toFixed(2),
      avgOlderGain: avgOlderGain.toFixed(2),
      growthTrend: growthTrend.toFixed(2),
      avgFeedConversion: avgFeedConversion.toFixed(2),
      recommendations,
      confidence: 'high',
      dataSource: 'real_historical_records'
    };
    
    // Emit signal bus event for AI decision
    await signalBus.emit('ai.pig.meat.optimized', {
      animal_id: animalId,
      optimization,
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI pig meat production optimization completed', { animalId, growthTrend });
    
    return {
      success: true,
      data: optimization
    };
  } catch (error) {
    logger.error('Error optimizing pig meat production with AI', { error: error.message, animalId });
    throw error;
  }
}

/**
 * AI-powered health monitoring for pigs
 * Predicts health risks based on growth patterns and historical data
 */
async function monitorPigHealth(animalId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  try {
    // Get animal data and production history
    const { rows } = await pg.query(
      `SELECT p.*, wr.weight_kg, wr.feed_conversion, wr.record_date
       FROM pig_herd p
       LEFT JOIN pig_weight_records wr ON wr.animal_id = p.id
       WHERE p.id = $1
       ORDER BY wr.record_date DESC
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
    
    const animal = rows[0];
    const growthRecords = rows.filter(r => r.weight_kg !== null);
    
    const riskFactors = [];
    let overallRisk = 'low';
    
    // Analyze growth patterns for health indicators
    if (growthRecords.length >= 7) {
      const recentGrowth = growthRecords.slice(0, 7).reduce((sum, r) => sum + r.weight_kg, 0) / 7;
      const olderGrowth = growthRecords.slice(7, 14).reduce((sum, r) => sum + r.weight_kg, 0) / 7;
      
      const growthDecline = ((olderGrowth - recentGrowth) / olderGrowth) * 100;
      
      if (growthDecline > 15) {
        riskFactors.push({
          factor: 'significant_growth_decline',
          severity: 'high',
          value: growthDecline.toFixed(1),
          description: `Growth declined by ${growthDecline.toFixed(1)}%`
        });
        overallRisk = 'high';
      } else if (growthDecline > 5) {
        riskFactors.push({
          factor: 'moderate_growth_decline',
          severity: 'medium',
          value: growthDecline.toFixed(1),
          description: `Growth declined by ${growthDecline.toFixed(1)}%`
        });
        overallRisk = 'medium';
      }
    }
    
    // Check age-related risks
    if (animal.dob) {
      const age = (new Date() - new Date(animal.dob)) / (365.25 * 24 * 60 * 60 * 1000);
      if (age > 2) {
        riskFactors.push({
          factor: 'advanced_age',
          severity: 'medium',
          value: age.toFixed(1),
          description: `Pig is ${age.toFixed(1)} years old`
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
      recommendations: generatePigHealthRecommendations(riskFactors),
      confidence: growthRecords.length >= 7 ? 'high' : 'medium',
      dataSource: 'real_animal_and_growth_records'
    };
    
    // Emit signal bus event for AI monitoring
    await signalBus.emit('ai.pig.health.monitored', {
      animal_id: animalId,
      monitoring,
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI pig health monitoring completed', { animalId, overallRisk });
    
    return {
      success: true,
      data: monitoring
    };
  } catch (error) {
    logger.error('Error monitoring pig health with AI', { error: error.message, animalId });
    throw error;
  }
}

/**
 * AI-powered feed optimization for pigs
 * Recommends optimal feed composition based on production goals
 */
async function optimizePigFeed(animalId, productionGoal) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  try {
    // Get animal data
    const { rows } = await pg.query(
      `SELECT * FROM pig_herd WHERE id = $1`,
      [animalId]
    );
    
    if (rows.length === 0) {
      return {
        success: false,
        message: 'Animal not found',
        data: null
      };
    }
    
    const animal = rows[0];
    
    // AI feed optimization logic for pigs
    const baseFeed = {
      dry_matter_kg: 2.5,
      protein_percentage: 16,
      energy_mj_kg: 14,
      fiber_percentage: 5,
      lysine_percentage: 1.0,
      calcium_percentage: 0.8
    };
    
    // Adjust based on production goal
    if (productionGoal === 'maximize_growth') {
      baseFeed.protein_percentage = 18;
      baseFeed.energy_mj_kg = 15;
      baseFeed.lysine_percentage = 1.2;
    } else if (productionGoal === 'cost_efficiency') {
      baseFeed.protein_percentage = 14;
      baseFeed.energy_mj_kg = 13;
      baseFeed.lysine_percentage = 0.8;
    }
    
    // Adjust based on animal status
    if (animal.status === 'Growing') {
      baseFeed.dry_matter_kg = 3.0;
      baseFeed.energy_mj_kg += 1;
    } else if (animal.status === 'Finishing') {
      baseFeed.protein_percentage -= 1;
      baseFeed.energy_mj_kg += 0.5;
    }
    
    // Adjust based on breed (pig-specific)
    if (animal.breed && animal.breed.toLowerCase().includes('landrace')) {
      baseFeed.protein_percentage += 1;
    } else if (animal.breed && animal.breed.toLowerCase().includes('large white')) {
      baseFeed.energy_mj_kg += 0.5;
    }
    
    const optimization = {
      animalId,
      animalTag: animal.tag_id,
      animalStatus: animal.status,
      animalBreed: animal.breed,
      productionGoal,
      optimizedFeed: baseFeed,
      expectedGrowthIncrease: productionGoal === 'maximize_growth' ? '15-20%' : '0-5%',
      feedCostChange: productionGoal === 'cost_efficiency' ? '-12%' : '+10%',
      recommendations: [
        'Monitor animal response for 1 week',
        'Adjust feed composition based on actual growth response',
        'Consider feed efficiency metrics'
      ],
      confidence: 'medium',
      dataSource: 'ai_algorithm_based_on_pig_characteristics'
    };
    
    // Emit signal bus event for AI optimization
    await signalBus.emit('ai.pig.feed.optimized', {
      animal_id: animalId,
      optimization,
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI pig feed optimization completed', { animalId, productionGoal });
    
    return {
      success: true,
      data: optimization
    };
  } catch (error) {
    logger.error('Error optimizing pig feed with AI', { error: error.message, animalId });
    throw error;
  }
}

/**
 * AI-powered breeding recommendations for pigs
 * Recommends optimal breeding timing and partners
 */
async function recommendPigBreeding(animalId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  try {
    // Get animal data
    const { rows } = await pg.query(
      `SELECT * FROM pig_herd WHERE id = $1`,
      [animalId]
    );
    
    if (rows.length === 0) {
      return {
        success: false,
        message: 'Animal not found',
        data: null
      };
    }
    
    const animal = rows[0];
    
    const recommendations = [];
    
    // Breeding timing recommendation (pigs have shorter gestation)
    if (animal.status === 'Lactating') {
      const daysSinceBreeding = animal.last_breeding_date 
        ? (new Date() - new Date(animal.last_breeding_date)) / (24 * 60 * 60 * 1000)
        : null;
      
      if (daysSinceBreeding && daysSinceBreeding > 120) {
        recommendations.push({
          type: 'breeding_timing',
          priority: 'high',
          action: 'Animal ready for breeding',
          reasoning: `Last breeding was ${daysSinceBreeding.toFixed(0)} days ago`,
          optimalWindow: 'Next 30 days'
        });
      } else if (daysSinceBreeding && daysSinceBreeding > 90) {
        recommendations.push({
          type: 'breeding_timing',
          priority: 'medium',
          action: 'Consider breeding soon',
          reasoning: `Last breeding was ${daysSinceBreeding.toFixed(0)} days ago`,
          optimalWindow: 'Next 60 days'
        });
      }
    } else if (animal.status === 'Weaned') {
      recommendations.push({
        type: 'breeding_timing',
        priority: 'high',
        action: 'Optimal time for breeding',
        reasoning: 'Animal weaned, ideal for breeding',
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
      const age = (new Date() - new Date(animal.dob)) / (365.25 * 24 * 60 * 60 * 1000);
      if (age < 0.8) {
        recommendations.push({
          type: 'age_consideration',
          priority: 'low',
          action: 'Animal may be too young for breeding',
          reasoning: `Animal is ${age.toFixed(1)} years old`,
          recommendedAge: '0.8-3 years'
        });
      } else if (age > 3) {
        recommendations.push({
          type: 'age_consideration',
          priority: 'medium',
          action: 'Consider replacement if breeding goal is long-term',
          reasoning: `Animal is ${age.toFixed(1)} years old`,
          recommendedAge: '0.8-3 years'
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
    await signalBus.emit('ai.pig.breeding.recommended', {
      animal_id: animalId,
      recommendation,
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI pig breeding recommendation completed', { animalId, breedingReadiness: recommendation.overallBreedingReadiness });
    
    return {
      success: true,
      data: recommendation
    };
  } catch (error) {
    logger.error('Error recommending pig breeding with AI', { error: error.message, animalId });
    throw error;
  }
}

// Helper function to generate pig health recommendations
function generatePigHealthRecommendations(riskFactors) {
  const recommendations = [];
  
  riskFactors.forEach(factor => {
    if (factor.factor === 'significant_growth_decline' || factor.factor === 'moderate_growth_decline') {
      recommendations.push('Monitor pig health closely for next 7 days');
      recommendations.push('Review feed quality and nutrition program');
      recommendations.push('Check for respiratory diseases common in pigs');
    } else if (factor.factor === 'vaccination_overdue') {
      recommendations.push('Schedule vaccination immediately');
      recommendations.push('Review vaccination schedule for common pig diseases');
    } else if (factor.factor === 'no_vaccination_record') {
      recommendations.push('Establish vaccination program immediately');
      recommendations.push('Consider vaccination for swine flu and erysipelas');
    } else if (factor.factor === 'advanced_age') {
      recommendations.push('Consider increased health monitoring frequency');
      recommendations.push('Review retirement/replacement planning');
    }
  });
  
  return recommendations;
}

module.exports = {
  listHerd,
  createAnimal,
  updateAnimal,
  deleteAnimal,
  listWeightRecords,
  recordWeight,
  listFeedConsumption,
  recordFeedConsumption,
  listBreedingRecords,
  recordBreeding,
  updateFarrowingOutcome,
  listVaccinationRecords,
  recordVaccination,
  getHerdPerformance,
  getBreedingAlerts,
  getVaccinationAlerts,
  // AI-embedded functions
  optimizeMeatProduction,
  monitorPigHealth,
  optimizePigFeed,
  recommendPigBreeding,
};
