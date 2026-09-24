/**
 * Animal Health Management Service (M127)
 *
 * Owns animal-health domain operations and integrates the
 * Veterinary Specialist Panel for clinical decision support.
 *
 * FIXED: previously incorrectly bound to `sales_pipeline`.
 */

// '../../database/connection' exports {initialize, getPostgreSQL, ...} - never a bare
// query method - db.query() below always threw. '../../database/pool' exports
// a real .query(); batch-fixed 2026-09-24, see .ai/decisions/0003-evidence-provenance-standard.md
const db = require('../../database/pool');
const { logger } = require('../../utils/logger');
const { ValidationError, NotFoundError, DatabaseError } = require('../../utils/errors');
const { VETERINARY_CLINICAL_DISCLAIMER } = require('../../utils/disclaimers');

let panel = null;
try {
  panel = require('../veterinary');
} catch (e) {
  logger.warn('Veterinary Specialist Panel not loaded', { message: e.message });
}

class M127Service {
  constructor() {
    this.healthTable = 'animal_health_records';
    this.defaultLimit = 20;
    this.maxLimit = 100;
  }

  /**
   * Run multi-specialist case conference (cow, pig, goat, poultry).
   */
  async runSpecialistPanel(caseInput) {
    if (!panel || typeof panel.runConference !== 'function') {
      throw new DatabaseError('Veterinary Specialist Panel module is not available');
    }
    if (!caseInput || !caseInput.species) {
      throw new ValidationError('species is required (cow|pig|goat|poultry)');
    }
    try {
      const report = panel.runConference(caseInput);
      logger.info('Specialist panel conference completed', {
        case_id: report.case_id,
        species: report.species,
        urgency: report.urgency,
        notifiable: report.notifiable_suspect,
      });
      return report;
    } catch (error) {
      logger.error('Specialist panel failed', { error: error.message });
      throw new ValidationError(error.message);
    }
  }

  async getAll(filters = {}) {
    try {
      const {
        page = 1,
        limit = this.defaultLimit,
        animal_type = null,
        health_status = null,
        farmer_id = null,
        search = null,
      } = filters;

      const validLimit = Math.min(parseInt(limit, 10) || this.defaultLimit, this.maxLimit);
      const validPage = Math.max(parseInt(page, 10) || 1, 1);
      const offset = (validPage - 1) * validLimit;

      const conditions = ["status = 'active'"];
      const params = [];

      if (animal_type) {
        params.push(animal_type);
        conditions.push(`animal_type = $${params.length}`);
      }
      if (health_status) {
        params.push(health_status);
        conditions.push(`health_status = $${params.length}`);
      }
      if (farmer_id) {
        params.push(farmer_id);
        conditions.push(`farmer_id = $${params.length}`);
      }
      if (search) {
        params.push(`%${search}%`);
        conditions.push(`(diagnosis ILIKE $${params.length} OR symptoms::text ILIKE $${params.length})`);
      }

      const whereClause = conditions.join(' AND ');
      const countResult = await db.query(
        `SELECT COUNT(*) as total FROM ${this.healthTable} WHERE ${whereClause}`,
        params,
      );
      const total = parseInt(countResult.rows[0].total, 10);

      const dataResult = await db.query(
        `SELECT * FROM ${this.healthTable}
         WHERE ${whereClause}
         ORDER BY created_at DESC
         LIMIT ${validLimit} OFFSET ${offset}`,
        params,
      );

      return {
        data: dataResult.rows,
        pagination: {
          page: validPage,
          limit: validLimit,
          total,
          pages: Math.ceil(total / validLimit) || 1,
          hasMore: offset + validLimit < total,
        },
        disclaimer: VETERINARY_CLINICAL_DISCLAIMER,
      };
    } catch (error) {
      logger.error(`Error fetching ${this.healthTable}`, { error: error.message });
      throw new DatabaseError(`Failed to fetch animal health records: ${error.message}`);
    }
  }

  async getById(id) {
    if (!id) throw new ValidationError('health_record_id is required');
    const result = await db.query(
      `SELECT * FROM ${this.healthTable} WHERE health_record_id = $1`,
      [id],
    );
    if (!result.rows.length) throw new NotFoundError('Animal health record not found');
    return { ...result.rows[0], disclaimer: VETERINARY_CLINICAL_DISCLAIMER };
  }

  async create(data) {
    const {
      health_record_id,
      animal_id,
      animal_type,
      farmer_id,
      breed,
      age,
      health_status,
      symptoms,
      diagnosis,
      treatment,
      veterinarian_id,
      location,
      state,
      district,
      ai_analysis,
    } = data || {};

    if (!animal_id || !animal_type || !farmer_id || !health_status || !location || !state || !district) {
      throw new ValidationError(
        'animal_id, animal_type, farmer_id, health_status, location, state, district are required',
      );
    }

    const id = health_record_id || `AHR-${Date.now()}`;
    const result = await db.query(
      `INSERT INTO ${this.healthTable} (
         health_record_id, animal_id, animal_type, farmer_id, breed, age,
         health_status, symptoms, diagnosis, treatment, veterinarian_id,
         location, state, district, ai_analysis, status, created_at, updated_at
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'active',NOW(),NOW()
       ) RETURNING *`,
      [
        id,
        animal_id,
        animal_type,
        farmer_id,
        breed || null,
        age || null,
        health_status,
        symptoms ? JSON.stringify(symptoms) : null,
        diagnosis || null,
        treatment ? JSON.stringify(treatment) : null,
        veterinarian_id || null,
        location,
        state,
        district,
        ai_analysis ? JSON.stringify(ai_analysis) : null,
      ],
    );
    logger.info('Created animal health record', { id });
    return { ...result.rows[0], disclaimer: VETERINARY_CLINICAL_DISCLAIMER };
  }

  async update(id, data) {
    await this.getById(id);
    const fields = [];
    const values = [];
    const allowed = [
      'health_status', 'symptoms', 'diagnosis', 'treatment', 'veterinarian_id',
      'ai_analysis', 'breed', 'age',
    ];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        values.push(
          key === 'symptoms' || key === 'treatment' || key === 'ai_analysis'
            ? JSON.stringify(data[key])
            : data[key],
        );
        fields.push(`${key} = $${values.length}`);
      }
    }
    if (!fields.length) throw new ValidationError('No updatable fields provided');
    values.push(id);
    const result = await db.query(
      `UPDATE ${this.healthTable}
       SET ${fields.join(', ')}, updated_at = NOW()
       WHERE health_record_id = $${values.length}
       RETURNING *`,
      values,
    );
    return { ...result.rows[0], disclaimer: VETERINARY_CLINICAL_DISCLAIMER };
  }

  async delete(id) {
    await this.getById(id);
    const result = await db.query(
      `UPDATE ${this.healthTable}
       SET status = 'deleted', updated_at = NOW()
       WHERE health_record_id = $1
       RETURNING *`,
      [id],
    );
    return result.rows[0];
  }

  /**
   * Create health record + optional specialist panel analysis in one call.
   */
  async createWithPanel(data, caseInput) {
    const record = await this.create(data);
    let conference = null;
    if (caseInput) {
      conference = await this.runSpecialistPanel({
        species: data.animal_type,
        ...caseInput,
      });
      try {
        await this.update(record.health_record_id, { ai_analysis: conference });
      } catch (e) {
        logger.warn('Could not persist panel analysis on record', { message: e.message });
      }
    }
    return {
      record,
      conference,
      disclaimer: VETERINARY_CLINICAL_DISCLAIMER,
    };
  }
}

module.exports = new M127Service();
