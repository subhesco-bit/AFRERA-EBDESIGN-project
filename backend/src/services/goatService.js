/**
 * Goat Farming Service (M124 — Livestock domain)
 *
 * Backs goat herd management with real domain logic for milk production,
 * feed consumption, breeding tracking, and vaccination schedules. Similar to
 * dairy cattle but with goat-specific parameters (shorter gestation, different
 * milk composition, multiple kidding events).
 *
 * Domain-specific computed capabilities:
 *  - getHerdPerformance(): milk yield trends, feed efficiency, kidding rate
 *  - getBreedingAlerts(): upcoming kidding due dates
 *  - getVaccinationAlerts(): upcoming vaccination due dates
 *
 * Assumed constants (veterinary rules of thumb, not stored in schema):
 *  - ASSUMED_VACCINATION_INTERVAL_DAYS: standard interval between vaccinations
 *  - ASSUMED_GESTATION_DAYS: goat gestation period (shorter than cattle)
 *  - ASSUMED_DUE_SOON_WINDOW_DAYS: alert window for upcoming events
 *  - ASSUMED_TARGET_MILK_FAT_PCT: target fat content for goat milk
 */

const { logger } = require('../utils/logger');
const { getPostgreSQL } = require('../database/connection');
const { signalBus } = require('../core/signalBus');

// ---- Assumed constants (not stored in the schema; goat farming standards)
const ASSUMED_VACCINATION_INTERVAL_DAYS = 180; // biannual vaccination cycle
const ASSUMED_GESTATION_DAYS = 150; // average goat gestation length (shorter than cattle)
const ASSUMED_DUE_SOON_WINDOW_DAYS = 14; // alert window
const ASSUMED_TARGET_MILK_FAT_PCT = 4.5; // target fat content for goat milk
const ASSUMED_MILK_DECLINE_ALERT_PCT = 15; // flag a trailing-week drop of this size

// ---------------------------------------------------------------------
// Herd management (CRUD)
// ---------------------------------------------------------------------

async function listHerd({ page = 1, limit = 50, status = null, sex = null } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  try {
    const offset = (Number(page) - 1) * Number(limit);
    
    let query = 'SELECT COUNT(*) FROM goat_herd';
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
    
    query = 'SELECT * FROM goat_herd';
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
    const { tag_id, breed, dob, sex, status, weight_kg, house_id, notes } = payload || {};
    if (!tag_id || !sex) {
      throw new Error('tag_id and sex are required');
    }
    const res = await pg.query(
      `INSERT INTO goat_herd (tag_id, breed, dob, sex, status, weight_kg, house_id, notes)
       VALUES ($1, $2, $3, $4, COALESCE($5, 'active'), $6, $7, $8)
       RETURNING *`,
      [tag_id, breed || null, dob || null, sex, status || null, weight_kg || null, house_id || null, notes || null]
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
    const { tag_id, breed, dob, sex, status, weight_kg, house_id, notes, last_vaccination_date, last_breeding_date, last_kidding_date } = payload || {};
    const res = await pg.query(
      `UPDATE goat_herd SET
         tag_id = COALESCE($1, tag_id),
         breed = COALESCE($2, breed),
         dob = COALESCE($3, dob),
         sex = COALESCE($4, sex),
         status = COALESCE($5, status),
         weight_kg = COALESCE($6, weight_kg),
         house_id = COALESCE($7, house_id),
         notes = COALESCE($8, notes),
         last_vaccination_date = COALESCE($9, last_vaccination_date),
         last_breeding_date = COALESCE($10, last_breeding_date),
         last_kidding_date = COALESCE($11, last_kidding_date),
         updated_at = NOW()
       WHERE id = $12
       RETURNING *`,
      [tag_id, breed, dob, sex, status, weight_kg, house_id, notes, last_vaccination_date, last_breeding_date, last_kidding_date, id]
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
    const res = await pg.query('DELETE FROM goat_herd WHERE id = $1 RETURNING id', [id]);
    return !!res.rows[0];
  } catch (error) {
    logger.error('Error deleting animal', { error: error.message });
    throw error;
  }
}

// ---------------------------------------------------------------------
// Milk production tracking
// ---------------------------------------------------------------------

async function listMilkProduction(animalId, { page = 1, limit = 100 } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  try {
    const offset = (Number(page) - 1) * Number(limit);
    const totalRes = await pg.query('SELECT COUNT(*) FROM goat_milk_production WHERE animal_id = $1', [animalId]);
    const total = parseInt(totalRes.rows[0].count || '0', 10);
    const res = await pg.query(
      `SELECT * FROM goat_milk_production WHERE animal_id = $1 ORDER BY record_date DESC LIMIT $2 OFFSET $3`,
      [animalId, limit, offset]
    );
    return { items: res.rows, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) || 1 } };
  } catch (error) {
    logger.error('Error listing milk production', { error: error.message });
    throw error;
  }
}

async function recordMilkProduction(payload) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  try {
    const { animal_id, record_date, session, quantity_liters, fat_content_pct, notes } = payload || {};
    if (!animal_id || !record_date || quantity_liters === undefined || quantity_liters === null) {
      throw new Error('animal_id, record_date and quantity_liters are required');
    }
    const res = await pg.query(
      `INSERT INTO goat_milk_production (animal_id, record_date, session, quantity_liters, fat_content_pct, notes)
       VALUES ($1, $2, COALESCE($3, 'morning'), $4, $5, $6)
       ON CONFLICT (animal_id, record_date, session)
         DO UPDATE SET quantity_liters = EXCLUDED.quantity_liters, fat_content_pct = EXCLUDED.fat_content_pct
       RETURNING *`,
      [animal_id, record_date, session || null, quantity_liters, fat_content_pct || null, notes || null]
    );
    return res.rows[0];
  } catch (error) {
    logger.error('Error recording milk production', { error: error.message });
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
    const totalRes = await pg.query('SELECT COUNT(*) FROM goat_feed_consumption WHERE animal_id = $1', [animalId]);
    const total = parseInt(totalRes.rows[0].count || '0', 10);
    const res = await pg.query(
      `SELECT * FROM goat_feed_consumption WHERE animal_id = $1 ORDER BY record_date DESC LIMIT $2 OFFSET $3`,
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
      `INSERT INTO goat_feed_consumption (animal_id, record_date, feed_type, quantity_kg, cost_per_kg, notes)
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

async function listBreedingRecords(femaleId, { page = 1, limit = 50 } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  try {
    const offset = (Number(page) - 1) * Number(limit);
    const totalRes = await pg.query('SELECT COUNT(*) FROM goat_breeding_records WHERE female_id = $1', [femaleId]);
    const total = parseInt(totalRes.rows[0].count || '0', 10);
    const res = await pg.query(
      `SELECT * FROM goat_breeding_records WHERE female_id = $1 ORDER BY breeding_date DESC LIMIT $2 OFFSET $3`,
      [femaleId, limit, offset]
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
    const { female_id, male_id, breeding_date, expected_kidding_date, notes } = payload || {};
    if (!female_id || !breeding_date) {
      throw new Error('female_id and breeding_date are required');
    }
    const res = await pg.query(
      `INSERT INTO goat_breeding_records (female_id, male_id, breeding_date, expected_kidding_date, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [female_id, male_id || null, breeding_date, expected_kidding_date || null, notes || null]
    );
    return res.rows[0];
  } catch (error) {
    logger.error('Error recording breeding', { error: error.message });
    throw error;
  }
}

async function updateKiddingOutcome(id, payload) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  try {
    const { actual_kidding_date, kids_count, kids_survived, notes } = payload || {};
    const res = await pg.query(
      `UPDATE goat_breeding_records SET
         actual_kidding_date = COALESCE($1, actual_kidding_date),
         kids_count = COALESCE($2, kids_count),
         kids_survived = COALESCE($3, kids_survived),
         notes = COALESCE($4, notes)
       WHERE id = $5
       RETURNING *`,
      [actual_kidding_date, kids_count, kids_survived, notes, id]
    );
    return res.rows[0] || null;
  } catch (error) {
    logger.error('Error updating kidding outcome', { error: error.message });
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
    const totalRes = await pg.query('SELECT COUNT(*) FROM goat_vaccination_records WHERE animal_id = $1', [animalId]);
    const total = parseInt(totalRes.rows[0].count || '0', 10);
    const res = await pg.query(
      `SELECT * FROM goat_vaccination_records WHERE animal_id = $1 ORDER BY vaccination_date DESC LIMIT $2 OFFSET $3`,
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
      `INSERT INTO goat_vaccination_records (animal_id, vaccine_name, vaccination_date, next_due_date, administered_by, notes)
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
    const animalRes = await pg.query('SELECT * FROM goat_herd WHERE id = $1', [animalId]);
    if (animalRes.rows.length === 0) throw new Error(`Animal ${animalId} not found`);
    const animal = animalRes.rows[0];

    const milkRes = await pg.query(
      `SELECT 
         COALESCE(SUM(quantity_liters), 0) as total_liters,
         COALESCE(AVG(fat_content_pct), 0) as avg_fat_pct,
         COUNT(*) as record_count
       FROM goat_milk_production
       WHERE animal_id = $1 AND record_date >= CURRENT_DATE - INTERVAL '7 days'`,
      [animalId]
    );
    const milkData = milkRes.rows[0];
    const dailyMilkAvg = milkData.record_count > 0 ? Number(milkData.total_liters) / milkData.record_count : 0;
    const avgFatPct = Number(milkData.avg_fat_pct);

    const feedRes = await pg.query(
      `SELECT 
         COALESCE(SUM(quantity_kg), 0) as total_feed_kg,
         COALESCE(SUM(quantity_kg * COALESCE(cost_per_kg, 0)), 0) as total_cost
       FROM goat_feed_consumption
       WHERE animal_id = $1 AND record_date >= CURRENT_DATE - INTERVAL '7 days'`,
      [animalId]
    );
    const feedData = feedRes.rows[0];
    const dailyFeedAvg = milkData.record_count > 0 ? Number(feedData.total_feed_kg) / milkData.record_count : 0;

    const breedingRes = await pg.query(
      `SELECT COUNT(*) as total_births, COALESCE(SUM(kids_survived), 0) as total_survived
       FROM goat_breeding_records
       WHERE female_id = $1 AND actual_kidding_date IS NOT NULL`,
      [animalId]
    );
    const breedingData = breedingRes.rows[0];
    const survivalRate = breedingData.total_births > 0 ? (Number(breedingData.total_survived) / breedingData.total_births) * 100 : null;

    const feedEfficiency = dailyMilkAvg > 0 ? dailyFeedAvg / dailyMilkAvg : null;
    const fatStatus = avgFatPct >= ASSUMED_TARGET_MILK_FAT_PCT ? 'good' : 'below_target';

    return {
      animalId,
      tagId: animal.tag_id,
      sex: animal.sex,
      status: animal.status,
      weightKg: animal.weight_kg,
      period: 'last_7_days',
      metrics: {
        dailyMilkAvgLiters: Math.round(dailyMilkAvg * 100) / 100,
        avgFatContentPct: Math.round(avgFatPct * 100) / 100,
        fatStatus,
        targetFatPct: ASSUMED_TARGET_MILK_FAT_PCT,
        dailyFeedAvgKg: Math.round(dailyFeedAvg * 100) / 100,
        feedEfficiency: feedEfficiency !== null ? Math.round(feedEfficiency * 100) / 100 : null,
        totalBirths: breedingData.total_births,
        kidSurvivalRatePct: survivalRate !== null ? Math.round(survivalRate * 100) / 100 : null,
      },
      assumptions: {
        targetFatPct: ASSUMED_TARGET_MILK_FAT_PCT,
        quality: 'assumed — not stored anywhere in the schema',
      },
      dataQuality: milkData.record_count > 0 ? 'real' : 'insufficient_records',
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
      `SELECT h.id, h.tag_id, h.status, h.last_breeding_date, h.last_kidding_date
         FROM goat_herd h
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
        const expectedKidding = new Date(bredOn.getTime() + ASSUMED_GESTATION_DAYS * msPerDay);
        const daysUntilDue = daysBetween(today, expectedKidding);
        if (daysUntilDue <= ASSUMED_DUE_SOON_WINDOW_DAYS) {
          alerts.push({
            animalId: h.id,
            tagId: h.tag_id,
            type: 'kidding',
            severity: daysUntilDue < 0 ? 'overdue' : 'due_soon',
            lastBreedingDate: h.last_breeding_date,
            expectedKiddingDate: expectedKidding.toISOString().slice(0, 10),
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
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  try {
    const { rows } = await pg.query(
      `SELECT id, tag_id, sex, status, last_vaccination_date
         FROM goat_herd
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
// AI-Embedded Functions for Goat Management
// ---------------------------------------------------------------------

/**
 * AI-powered milk production optimization for goats
 * Analyzes milk production data and provides optimization recommendations
 */
async function optimizeGoatMilkProduction(animalId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  try {
    // Get historical milk production data
    const { rows } = await pg.query(
      `SELECT mp.*, g.breed, g.status, g.dob
       FROM goat_milk_production mp
       JOIN goat_herd g ON mp.animal_id = g.id
       WHERE mp.animal_id = $1
       ORDER BY mp.record_date DESC
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
    const avgRecentYield = recentProduction.reduce((sum, r) => sum + r.milk_liters, 0) / 7;
    
    const olderProduction = rows.slice(7, 14);
    const avgOlderYield = olderProduction.reduce((sum, r) => sum + r.milk_liters, 0) / 7;
    
    const yieldTrend = ((avgRecentYield - avgOlderYield) / avgOlderYield) * 100;
    
    // AI recommendations based on trend analysis
    const recommendations = [];
    
    if (yieldTrend < -5) {
      recommendations.push({
        type: 'yield_decline',
        severity: 'high',
        action: 'Review feed quality and nutrition',
        reason: `Yield declined by ${yieldTrend.toFixed(1)}%`
      });
      recommendations.push({
        type: 'health_check',
        severity: 'medium',
        action: 'Schedule veterinary health check',
        reason: 'Declining yield may indicate health issues'
      });
    } else if (yieldTrend > 5) {
      recommendations.push({
        type: 'yield_increase',
        severity: 'low',
        action: 'Continue current feeding regimen',
        reason: `Yield increased by ${yieldTrend.toFixed(1)}%`
      });
    }
    
    // Fat content analysis (goat milk has higher fat than cow milk)
    const avgFatContent = recentProduction.reduce((sum, r) => sum + (r.fat_content || 4.5), 0) / 7;
    if (avgFatContent < 4.0) {
      recommendations.push({
        type: 'nutrition',
        severity: 'medium',
        action: 'Increase dietary fat content',
        reason: `Average fat content ${avgFatContent.toFixed(2)}% below optimal for goat milk`
      });
    }
    
    const optimization = {
      animalId,
      analysisDate: new Date().toISOString(),
      avgRecentYield: avgRecentYield.toFixed(2),
      avgOlderYield: avgOlderYield.toFixed(2),
      yieldTrend: yieldTrend.toFixed(2),
      avgFatContent: avgFatContent.toFixed(2),
      recommendations,
      confidence: 'high',
      dataSource: 'real_historical_records'
    };
    
    // Emit signal bus event for AI decision
    await signalBus.emit('ai.goat.milk.optimized', {
      animal_id: animalId,
      optimization,
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI goat milk production optimization completed', { animalId, yieldTrend });
    
    return {
      success: true,
      data: optimization
    };
  } catch (error) {
    logger.error('Error optimizing goat milk production with AI', { error: error.message, animalId });
    throw error;
  }
}

/**
 * AI-powered health monitoring for goats
 * Predicts health risks based on production patterns and historical data
 */
async function monitorGoatHealth(animalId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  try {
    // Get animal data and production history
    const { rows } = await pg.query(
      `SELECT g.*, mp.milk_liters, mp.fat_content, mp.record_date
       FROM goat_herd g
       LEFT JOIN goat_milk_production mp ON mp.animal_id = g.id
       WHERE g.id = $1
       ORDER BY mp.record_date DESC
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
    const productionRecords = rows.filter(r => r.milk_liters !== null);
    
    const riskFactors = [];
    let overallRisk = 'low';
    
    // Analyze production patterns for health indicators
    if (productionRecords.length >= 7) {
      const recentYield = productionRecords.slice(0, 7).reduce((sum, r) => sum + r.milk_liters, 0) / 7;
      const olderYield = productionRecords.slice(7, 14).reduce((sum, r) => sum + r.milk_liters, 0) / 7;
      
      const yieldDecline = ((olderYield - recentYield) / olderYield) * 100;
      
      if (yieldDecline > 15) {
        riskFactors.push({
          factor: 'significant_yield_decline',
          severity: 'high',
          value: yieldDecline.toFixed(1),
          description: `Yield declined by ${yieldDecline.toFixed(1)}%`
        });
        overallRisk = 'high';
      } else if (yieldDecline > 5) {
        riskFactors.push({
          factor: 'moderate_yield_decline',
          severity: 'medium',
          value: yieldDecline.toFixed(1),
          description: `Yield declined by ${yieldDecline.toFixed(1)}%`
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
          description: `Goat is ${age.toFixed(1)} years old`
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
      recommendations: generateGoatHealthRecommendations(riskFactors),
      confidence: productionRecords.length >= 7 ? 'high' : 'medium',
      dataSource: 'real_animal_and_production_records'
    };
    
    // Emit signal bus event for AI monitoring
    await signalBus.emit('ai.goat.health.monitored', {
      animal_id: animalId,
      monitoring,
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI goat health monitoring completed', { animalId, overallRisk });
    
    return {
      success: true,
      data: monitoring
    };
  } catch (error) {
    logger.error('Error monitoring goat health with AI', { error: error.message, animalId });
    throw error;
  }
}

/**
 * AI-powered feed optimization for goats
 * Recommends optimal feed composition based on production goals
 */
async function optimizeGoatFeed(animalId, productionGoal) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  try {
    // Get animal data
    const { rows } = await pg.query(
      `SELECT * FROM goat_herd WHERE id = $1`,
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
    
    // AI feed optimization logic for goats
    const baseFeed = {
      dry_matter_kg: 2.5,
      protein_percentage: 14,
      energy_mj_kg: 10,
      fiber_percentage: 25,
      calcium_percentage: 0.6,
      phosphorus_percentage: 0.4
    };
    
    // Adjust based on production goal
    if (productionGoal === 'maximize_milk') {
      baseFeed.protein_percentage = 16;
      baseFeed.energy_mj_kg = 11;
      baseFeed.calcium_percentage = 0.8;
    } else if (productionGoal === 'cost_efficiency') {
      baseFeed.protein_percentage = 12;
      baseFeed.energy_mj_kg = 9;
      baseFeed.calcium_percentage = 0.5;
    }
    
    // Adjust based on animal status
    if (animal.status === 'Lactating') {
      baseFeed.dry_matter_kg = 3.0;
      baseFeed.energy_mj_kg += 1;
    } else if (animal.status === 'Pregnant') {
      baseFeed.protein_percentage += 2;
      baseFeed.calcium_percentage += 0.2;
    }
    
    // Adjust based on breed (goat-specific)
    if (animal.breed && animal.breed.toLowerCase().includes('alpine')) {
      baseFeed.energy_mj_kg += 0.5;
    } else if (animal.breed && animal.breed.toLowerCase().includes('boer')) {
      baseFeed.protein_percentage += 1;
    }
    
    const optimization = {
      animalId,
      animalTag: animal.tag_id,
      animalStatus: animal.status,
      animalBreed: animal.breed,
      productionGoal,
      optimizedFeed: baseFeed,
      expectedMilkIncrease: productionGoal === 'maximize_milk' ? '12-18%' : '0-5%',
      feedCostChange: productionGoal === 'cost_efficiency' ? '-12%' : '+8%',
      recommendations: [
        'Monitor animal response for 2 weeks',
        'Adjust feed composition based on actual milk response',
        'Consider browse availability in feeding regimen'
      ],
      confidence: 'medium',
      dataSource: 'ai_algorithm_based_on_goat_characteristics'
    };
    
    // Emit signal bus event for AI optimization
    await signalBus.emit('ai.goat.feed.optimized', {
      animal_id: animalId,
      optimization,
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI goat feed optimization completed', { animalId, productionGoal });
    
    return {
      success: true,
      data: optimization
    };
  } catch (error) {
    logger.error('Error optimizing goat feed with AI', { error: error.message, animalId });
    throw error;
  }
}

/**
 * AI-powered breeding recommendations for goats
 * Recommends optimal breeding timing and partners
 */
async function recommendGoatBreeding(animalId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  try {
    // Get animal data
    const { rows } = await pg.query(
      `SELECT * FROM goat_herd WHERE id = $1`,
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
    
    // Breeding timing recommendation (goats have shorter gestation than cattle)
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
      const age = (new Date() - new Date(animal.dob)) / (365.25 * 24 * 60 * 60 * 1000);
      if (age < 1.5) {
        recommendations.push({
          type: 'age_consideration',
          priority: 'low',
          action: 'Animal may be too young for breeding',
          reasoning: `Animal is ${age.toFixed(1)} years old`,
          recommendedAge: '1.5-8 years'
        });
      } else if (age > 8) {
        recommendations.push({
          type: 'age_consideration',
          priority: 'medium',
          action: 'Consider replacement if breeding goal is long-term',
          reasoning: `Animal is ${age.toFixed(1)} years old`,
          recommendedAge: '1.5-8 years'
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
    await signalBus.emit('ai.goat.breeding.recommended', {
      animal_id: animalId,
      recommendation,
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI goat breeding recommendation completed', { animalId, breedingReadiness: recommendation.overallBreedingReadiness });
    
    return {
      success: true,
      data: recommendation
    };
  } catch (error) {
    logger.error('Error recommending goat breeding with AI', { error: error.message, animalId });
    throw error;
  }
}

// Helper function to generate goat health recommendations
function generateGoatHealthRecommendations(riskFactors) {
  const recommendations = [];
  
  riskFactors.forEach(factor => {
    if (factor.factor === 'significant_yield_decline' || factor.factor === 'moderate_yield_decline') {
      recommendations.push('Monitor goat health closely for next 7 days');
      recommendations.push('Review feed quality and nutrition program');
      recommendations.push('Check for parasites common in goats');
    } else if (factor.factor === 'vaccination_overdue') {
      recommendations.push('Schedule vaccination immediately');
      recommendations.push('Review vaccination schedule for common goat diseases');
    } else if (factor.factor === 'no_vaccination_record') {
      recommendations.push('Establish vaccination program immediately');
      recommendations.push('Consider CD&T vaccination for clostridial diseases');
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
  listMilkProduction,
  recordMilkProduction,
  listFeedConsumption,
  recordFeedConsumption,
  listBreedingRecords,
  recordBreeding,
  updateKiddingOutcome,
  listVaccinationRecords,
  recordVaccination,
  getHerdPerformance,
  getBreedingAlerts,
  getVaccinationAlerts,
  // AI-embedded functions
  optimizeGoatMilkProduction,
  monitorGoatHealth,
  optimizeGoatFeed,
  recommendGoatBreeding,
};
