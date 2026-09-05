/**
 * Animal Health Service (M127 — Livestock domain)
 *
 * Cross-cutting health management service for all livestock types (dairy,
 * poultry, goat, sheep, pig). Provides health examination tracking, treatment
 * records, disease outbreak management, and quarantine tracking.
 *
 * Domain-specific computed capabilities:
 *  - getHealthOverview(): aggregate health status across all animal types
 *  - getActiveOutbreaks(): currently active disease outbreaks
 *  - getActiveQuarantines(): animals currently under quarantine
 *  - getTreatmentCompliance(): treatment adherence metrics
 *
 * Assumed constants (veterinary rules of thumb, not stored in schema):
 *  - ASSUMED_ROUTINE_EXAM_INTERVAL_DAYS: recommended interval between routine exams
 *  - ASSUMED_QUARANTINE_MIN_DAYS: minimum quarantine period for new arrivals
 *  - ASSUMED_CRITICAL_TEMP_C: body temperature threshold for critical status
 */

const { logger } = require('../../../utils/logger');
const { getPostgreSQL } = require('../../../database/connection');

// ---- Assumed constants (not stored in the schema; veterinary standards)
const ASSUMED_ROUTINE_EXAM_INTERVAL_DAYS = 90; // quarterly routine exams
const ASSUMED_QUARANTINE_MIN_DAYS = 14; // minimum quarantine period
const ASSUMED_CRITICAL_TEMP_C = 40.0; // critical body temperature threshold
const ASSUMED_HIGH_TEMP_C = 39.5; // high body temperature threshold

// ---------------------------------------------------------------------
// Health examinations (CRUD)
// ---------------------------------------------------------------------

async function listExaminations({ page = 1, limit = 50, animal_type = null, health_status = null } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const offset = (Number(page) - 1) * Number(limit);
  
  let query = 'SELECT COUNT(*) FROM animal_health_examinations';
  let countParams = [];
  let conditions = [];
  
  if (animal_type) {
    conditions.push('animal_type = $' + (countParams.length + 1));
    countParams.push(animal_type);
  }
  if (health_status) {
    conditions.push('health_status = $' + (countParams.length + 1));
    countParams.push(health_status);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  const totalRes = await pg.query(query, countParams);
  const total = parseInt(totalRes.rows[0].count || '0', 10);
  
  query = 'SELECT * FROM animal_health_examinations';
  const params = [limit, offset];
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.map((c, i) => c.replace(/\$\d+/, '$' + (i + 3))).join(' AND ');
    if (animal_type) params.push(animal_type);
    if (health_status) params.push(health_status);
  }
  query += ' ORDER BY examination_date DESC LIMIT $1 OFFSET $2';
  
  const res = await pg.query(query, params);
  return { items: res.rows, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) || 1 } };
}

async function createExamination(payload) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const { animal_type, animal_id, examination_date, examination_type, health_status, body_temperature_c, heart_rate_bpm, respiratory_rate_bpm, findings, examiner_name, notes } = payload || {};
  if (!animal_type || !animal_id || !examination_date || !examination_type || !health_status) {
    throw new Error('animal_type, animal_id, examination_date, examination_type and health_status are required');
  }
  let res = await pg.query(
    `INSERT INTO animal_health_examinations (animal_type, animal_id, examination_date, examination_type, health_status, body_temperature_c, heart_rate_bpm, respiratory_rate_bpm, findings, examiner_name, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [animal_type, animal_id, examination_date, examination_type, health_status, body_temperature_c || null, heart_rate_bpm || null, respiratory_rate_bpm || null, findings || null, examiner_name || null, notes || null]
  );
  return res.rows[0];
}

async function updateExamination(id, payload) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const { health_status, body_temperature_c, heart_rate_bpm, respiratory_rate_bpm, findings, examiner_name, notes } = payload || {};
  let res = await pg.query(
    `UPDATE animal_health_examinations SET
       health_status = COALESCE($1, health_status),
       body_temperature_c = COALESCE($2, body_temperature_c),
       heart_rate_bpm = COALESCE($3, heart_rate_bpm),
       respiratory_rate_bpm = COALESCE($4, respiratory_rate_bpm),
       findings = COALESCE($5, findings),
       examiner_name = COALESCE($6, examiner_name),
       notes = COALESCE($7, notes)
     WHERE id = $8
     RETURNING *`,
    [health_status, body_temperature_c, heart_rate_bpm, respiratory_rate_bpm, findings, examiner_name, notes, id]
  );
  return res.rows[0] || null;
}

async function deleteExamination(id) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  let res = await pg.query('DELETE FROM animal_health_examinations WHERE id = $1 RETURNING id', [id]);
  return res.rows[0] || null;
}

// ---------------------------------------------------------------------
// Treatments (CRUD)
// ---------------------------------------------------------------------

async function listTreatments({ page = 1, limit = 50, animal_type = null } = {}) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  let offset = (Number(page) - 1) * Number(limit);
  
  let query = 'SELECT COUNT(*) FROM animal_treatments';
  let countParams = [];
  let conditions = [];
  
  if (animal_type) {
    conditions.push('animal_type = $1');
    countParams.push(animal_type);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  let totalRes = await pg.query(query, countParams);
  let total = parseInt(totalRes.rows[0].count || '0', 10);
  
  query = 'SELECT * FROM animal_treatments';
  let params = [limit, offset];
  
  if (conditions.length > 0) {
    query += ' WHERE animal_type = $3';
    params.push(animal_type);
  }
  query += ' ORDER BY treatment_date DESC LIMIT $1 OFFSET $2';
  
  let res = await pg.query(query, params);
  return { items: res.rows, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) || 1 } };
}

async function createTreatment(payload) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const { animal_type, animal_id, treatment_date, medication_name, dosage, administration_route, prescribing_vet, diagnosis, notes } = payload || {};
  if (!animal_type || !animal_id || !treatment_date || !medication_name) {
    throw new Error('animal_type, animal_id, treatment_date and medication_name are required');
  }
  let res = await pg.query(
    `INSERT INTO animal_treatments (animal_type, animal_id, treatment_date, medication_name, dosage, administration_route, prescribing_vet, diagnosis, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [animal_type, animal_id, treatment_date, medication_name, dosage || null, administration_route || null, prescribing_vet || null, diagnosis || null, notes || null]
  );
  return res.rows[0];
}

async function updateTreatment(id, payload) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const { medication_name, dosage, administration_route, prescribing_vet, diagnosis, notes } = payload || {};
  let res = await pg.query(
    `UPDATE animal_treatments SET
       medication_name = COALESCE($1, medication_name),
       dosage = COALESCE($2, dosage),
       administration_route = COALESCE($3, administration_route),
       prescribing_vet = COALESCE($4, prescribing_vet),
       diagnosis = COALESCE($5, diagnosis),
       notes = COALESCE($6, notes)
     WHERE id = $7
     RETURNING *`,
    [medication_name, dosage, administration_route, prescribing_vet, diagnosis, notes, id]
  );
  return res.rows[0] || null;
}

async function deleteTreatment(id) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  let res = await pg.query('DELETE FROM animal_treatments WHERE id = $1 RETURNING id', [id]);
  return res.rows[0] || null;
}

// ---------------------------------------------------------------------
// Disease outbreaks (CRUD)
// ---------------------------------------------------------------------

async function listOutbreaks({ page = 1, limit = 50, status = null, affected_animal_type = null } = {}) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  let offset = (Number(page) - 1) * Number(limit);
  
  let query = 'SELECT COUNT(*) FROM disease_outbreaks';
  let countParams = [];
  let conditions = [];
  
  if (status) {
    conditions.push('status = $' + (countParams.length + 1));
    countParams.push(status);
  }
  if (affected_animal_type) {
    conditions.push('affected_animal_type = $' + (countParams.length + 1));
    countParams.push(affected_animal_type);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  let totalRes = await pg.query(query, countParams);
  let total = parseInt(totalRes.rows[0].count || '0', 10);
  
  query = 'SELECT * FROM disease_outbreaks';
  let params = [limit, offset];
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.map((c, i) => c.replace(/\$\d+/, '$' + (i + 3))).join(' AND ');
    if (status) params.push(status);
    if (affected_animal_type) params.push(affected_animal_type);
  }
  query += ' ORDER BY start_date DESC LIMIT $1 OFFSET $2';
  
  let res = await pg.query(query, params);
  return { items: res.rows, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) || 1 } };
}

async function createOutbreak(payload) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const { outbreak_name, disease_name, start_date, affected_animal_type, severity, affected_count, deaths_count, containment_measures, reported_by, notes } = payload || {};
  if (!outbreak_name || !disease_name || !start_date || !affected_animal_type || !severity) {
    throw new Error('outbreak_name, disease_name, start_date, affected_animal_type and severity are required');
  }
  let res = await pg.query(
    `INSERT INTO disease_outbreaks (outbreak_name, disease_name, start_date, affected_animal_type, severity, affected_count, deaths_count, containment_measures, reported_by, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [outbreak_name, disease_name, start_date, affected_animal_type, severity, affected_count || 0, deaths_count || 0, containment_measures || null, reported_by || null, notes || null]
  );
  return res.rows[0];
}

async function updateOutbreak(id, payload) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const { end_date, affected_count, deaths_count, containment_measures, status, notes } = payload || {};
  let res = await pg.query(
    `UPDATE disease_outbreaks SET
       end_date = COALESCE($1, end_date),
       affected_count = COALESCE($2, affected_count),
       deaths_count = COALESCE($3, deaths_count),
       containment_measures = COALESCE($4, containment_measures),
       status = COALESCE($5, status),
       notes = COALESCE($6, notes),
       updated_at = NOW()
     WHERE id = $7
     RETURNING *`,
    [end_date, affected_count, deaths_count, containment_measures, status, notes, id]
  );
  return res.rows[0] || null;
}

async function deleteOutbreak(id) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  let res = await pg.query('DELETE FROM disease_outbreaks WHERE id = $1 RETURNING id', [id]);
  return res.rows[0] || null;
}

// ---------------------------------------------------------------------
// Quarantine records (CRUD)
// ---------------------------------------------------------------------

async function listQuarantines({ page = 1, limit = 50, status = null, animal_type = null } = {}) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  let offset = (Number(page) - 1) * Number(limit);
  
  let query = 'SELECT COUNT(*) FROM quarantine_records';
  let countParams = [];
  let conditions = [];
  
  if (status) {
    conditions.push('status = $' + (countParams.length + 1));
    countParams.push(status);
  }
  if (animal_type) {
    conditions.push('animal_type = $' + (countParams.length + 1));
    countParams.push(animal_type);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  let totalRes = await pg.query(query, countParams);
  let total = parseInt(totalRes.rows[0].count || '0', 10);
  
  query = 'SELECT * FROM quarantine_records';
  let params = [limit, offset];
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.map((c, i) => c.replace(/\$\d+/, '$' + (i + 3))).join(' AND ');
    if (status) params.push(status);
    if (animal_type) params.push(animal_type);
  }
  query += ' ORDER BY quarantine_start_date DESC LIMIT $1 OFFSET $2';
  
  let res = await pg.query(query, params);
  return { items: res.rows, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) || 1 } };
}

async function createQuarantine(payload) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const { animal_type, animal_id, quarantine_start_date, reason, quarantine_type, location, notes } = payload || {};
  if (!animal_type || !animal_id || !quarantine_start_date || !reason || !quarantine_type) {
    throw new Error('animal_type, animal_id, quarantine_start_date, reason and quarantine_type are required');
  }
  let res = await pg.query(
    `INSERT INTO quarantine_records (animal_type, animal_id, quarantine_start_date, reason, quarantine_type, location, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [animal_type, animal_id, quarantine_start_date, reason, quarantine_type, location || null, notes || null]
  );
  return res.rows[0];
}

async function updateQuarantine(id, payload) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const { quarantine_end_date, status, notes } = payload || {};
  let res = await pg.query(
    `UPDATE quarantine_records SET
       quarantine_end_date = COALESCE($1, quarantine_end_date),
       status = COALESCE($2, status),
       notes = COALESCE($3, notes),
       updated_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [quarantine_end_date, status, notes, id]
  );
  return res.rows[0] || null;
}

async function deleteQuarantine(id) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  let res = await pg.query('DELETE FROM quarantine_records WHERE id = $1 RETURNING id', [id]);
  return res.rows[0] || null;
}

// ---------------------------------------------------------------------
// Computed: Health overview
// ---------------------------------------------------------------------

async function getHealthOverview() {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  try {
    const examRes = await pg.query(
      `SELECT 
         animal_type,
         health_status,
         COUNT(*) as count
       FROM animal_health_examinations
       WHERE examination_date >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY animal_type, health_status
       ORDER BY animal_type, health_status`
    );

    const outbreakRes = await pg.query(
      `SELECT 
         affected_animal_type,
         severity,
         status,
         COUNT(*) as count
       FROM disease_outbreaks
       WHERE status = 'active'
       GROUP BY affected_animal_type, severity, status
       ORDER BY affected_animal_type, severity`
    );

    const quarantineRes = await pg.query(
      `SELECT 
         animal_type,
         status,
         COUNT(*) as count
       FROM quarantine_records
       WHERE status = 'active'
       GROUP BY animal_type, status
       ORDER BY animal_type`
    );

    const treatmentRes = await pg.query(
      `SELECT 
         animal_type,
         COUNT(*) as total_treatments
       FROM animal_treatments
       WHERE treatment_date >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY animal_type
       ORDER BY animal_type`
    );

    return {
      generatedAt: new Date().toISOString(),
      period: 'last_30_days',
      examinations: examRes.rows,
      activeOutbreaks: outbreakRes.rows,
      activeQuarantines: quarantineRes.rows,
      recentTreatments: treatmentRes.rows,
      assumptions: {
        routineExamIntervalDays: ASSUMED_ROUTINE_EXAM_INTERVAL_DAYS,
        quarantineMinDays: ASSUMED_QUARANTINE_MIN_DAYS,
        criticalTempC: ASSUMED_CRITICAL_TEMP_C,
        quality: 'assumed — not stored anywhere in the schema',
      },
    };
  } catch (error) {
    logger.error('Error computing health overview', { error: error.message, stack: error.stack });
    throw error;
  }
}

// ---------------------------------------------------------------------
// Computed: Active outbreaks
// ---------------------------------------------------------------------

async function getActiveOutbreaks() {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  try {
    const { rows } = await pg.query(
      `SELECT * FROM disease_outbreaks WHERE status = 'active' ORDER BY start_date DESC`
    );

    const today = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysBetween = (from, to) => Math.round((to.getTime() - from.getTime()) / msPerDay);

    const enriched = rows.map((outbreak) => {
      const startDate = new Date(outbreak.start_date);
      const durationDays = daysBetween(startDate, today);
      const mortalityRate = outbreak.affected_count > 0 ? (Number(outbreak.deaths_count) / outbreak.affected_count) * 100 : 0;

      return {
        ...outbreak,
        durationDays,
        mortalityRatePct: Math.round(mortalityRate * 100) / 100,
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      totalActiveOutbreaks: enriched.length,
      outbreaks: enriched,
    };
  } catch (error) {
    logger.error('Error computing active outbreaks', { error: error.message, stack: error.stack });
    throw error;
  }
}

// ---------------------------------------------------------------------
// Computed: Active quarantines
// ---------------------------------------------------------------------

async function getActiveQuarantines() {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  try {
    const { rows } = await pg.query(
      `SELECT * FROM quarantine_records WHERE status = 'active' ORDER BY quarantine_start_date DESC`
    );

    let today = new Date();
    let msPerDay = 24 * 60 * 60 * 1000;
    let daysBetween = (from, to) => Math.round((to.getTime() - from.getTime()) / msPerDay);

    let enriched = rows.map((quarantine) => {
      let startDate = new Date(quarantine.quarantine_start_date);
      const daysInQuarantine = daysBetween(startDate, today);
      const isOverdue = quarantine.quarantine_end_date && daysBetween(new Date(quarantine.quarantine_end_date), today) < 0;

      return {
        ...quarantine,
        daysInQuarantine,
        isOverdue,
        minQuarantineDays: ASSUMED_QUARANTINE_MIN_DAYS,
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      totalActiveQuarantines: enriched.length,
      quarantines: enriched,
      assumptions: {
        quarantineMinDays: ASSUMED_QUARANTINE_MIN_DAYS,
        quality: 'assumed — not stored anywhere in the schema',
      },
    };
  } catch (error) {
    logger.error('Error computing active quarantines', { error: error.message, stack: error.stack });
    throw error;
  }
}

module.exports = {
  listExaminations,
  createExamination,
  updateExamination,
  deleteExamination,
  listTreatments,
  createTreatment,
  updateTreatment,
  deleteTreatment,
  listOutbreaks,
  createOutbreak,
  updateOutbreak,
  deleteOutbreak,
  listQuarantines,
  createQuarantine,
  updateQuarantine,
  deleteQuarantine,
  getHealthOverview,
  getActiveOutbreaks,
  getActiveQuarantines,
};

// Merged unique operations from backend/src/modules/M127 (see git history there for
// full context) - complementary functionality this service did not have.
Object.assign(module.exports, require("../../modules/M127/service"));

