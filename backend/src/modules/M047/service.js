/**
 * M047 Irrigation Management Service
 * Production implementation with real domain logic
 *
 * Manages irrigation schedules, water allocation, and delivery tracking
 * for farm operations across Northeast India
 */

const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');

class IrrigationManagementService {
  constructor(db = null) {
    this.db = db || getPostgreSQL();
    this.scheduleTable = 'irrigation_schedules';
    this.logsTable = 'irrigation_delivery_logs';
    this.sourceTable = 'water_sources';
  }

  /**
   * Validation layer - type and business rule checking
   */
  validateScheduleData(data) {
    const errors = {};

    if (!data.farm_id) errors.farm_id = 'Farm ID is required';
    if (!data.crop_type) errors.crop_type = 'Crop type is required';

    if (data.water_volume === undefined || data.water_volume === null) {
      errors.water_volume = 'Water volume is required';
    } else if (data.water_volume < 100 || data.water_volume > 100000) {
      errors.water_volume = 'Water volume must be between 100-100000 liters';
    }

    if (!data.schedule_type || !['manual', 'automated', 'sensor_triggered'].includes(data.schedule_type)) {
      errors.schedule_type = 'Schedule type must be manual, automated, or sensor_triggered';
    }

    if (data.frequency_days && (data.frequency_days < 1 || data.frequency_days > 30)) {
      errors.frequency_days = 'Frequency must be between 1-30 days';
    }

    if (data.start_time && !this.isValidTime(data.start_time)) {
      errors.start_time = 'Invalid time format (HH:MM)';
    }

    if (Object.keys(errors).length > 0) {
      const err = new Error('Validation failed');
      err.validationErrors = errors;
      err.statusCode = 422;
      throw err;
    }
  }

  isValidTime(time) {
    const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
  }

  /**
   * Business logic: Compute irrigation recommendation based on crop and soil
   */
  async computeIrrigationRequirement(farmId, cropType, soilType) {
    const cropWaterNeeds = {
      'rice': 1000, 'wheat': 400, 'maize': 500, 'cotton': 700,
      'sugarcane': 2200, 'potato': 500, 'tomato': 400, 'onion': 300,
      'pulses': 300, 'vegetables': 400
    };

    const soilRetention = {
      'clay': 0.9, 'loam': 0.75, 'sand': 0.5, 'silty': 0.85
    };

    const baseNeed = cropWaterNeeds[cropType] || 500;
    const retention = soilRetention[soilType] || 0.7;

    const recommendedVolume = Math.round(baseNeed / (1 - retention / 2));

    return {
      crop_type: cropType,
      soil_type: soilType,
      base_crop_water_need: baseNeed,
      soil_water_retention: retention,
      recommended_volume_liters: recommendedVolume,
      efficiency_percentage: Math.round(retention * 100)
    };
  }

  /**
   * Create irrigation schedule
   */
  async createSchedule(scheduleData) {
    this.validateScheduleData(scheduleData);

    const pg = this.db;
    if (!pg) throw new Error('Database not initialized');

    const {
      farm_id, crop_type, water_volume, schedule_type,
      frequency_days, start_time, is_active, water_source_id
    } = scheduleData;

    try {
      const result = await pg.query(
        `INSERT INTO ${this.scheduleTable}
         (farm_id, crop_type, water_volume, schedule_type, frequency_days, start_time, is_active, water_source_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [farm_id, crop_type, water_volume, schedule_type, frequency_days || null, start_time || null, is_active !== false, water_source_id || null]
      );

      logger.info(`Irrigation schedule created: ${result.rows[0].id}`, { farm_id });
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to create irrigation schedule', { farm_id, error: error.message });
      throw error;
    }
  }

  /**
   * Get farmer's irrigation schedules
   */
  async getFarmSchedules(farmId, filters = {}) {
    const pg = this.db;
    if (!pg) throw new Error('Database not initialized');

    const { crop_type, active_only = true, limit = 50, offset = 0 } = filters;

    let query = `SELECT * FROM ${this.scheduleTable} WHERE farm_id = $1`;
    const params = [farmId];

    if (crop_type) {
      query += ` AND crop_type = $${params.length + 1}`;
      params.push(crop_type);
    }

    if (active_only) {
      query += ` AND is_active = true`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    try {
      const result = await pg.query(query, params);
      return { schedules: result.rows, count: result.rows.length };
    } catch (error) {
      logger.error('Failed to fetch schedules', { farm_id: farmId, error: error.message });
      throw error;
    }
  }

  /**
   * Update irrigation schedule
   */
  async updateSchedule(scheduleId, updateData) {
    this.validateScheduleData(updateData);

    const pg = this.db;
    if (!pg) throw new Error('Database not initialized');

    const setFields = [];
    const params = [];
    let paramIndex = 1;

    Object.entries(updateData).forEach(([key, value]) => {
      if (['farm_id', 'crop_type', 'water_volume', 'schedule_type', 'frequency_days', 'start_time', 'is_active', 'water_source_id'].includes(key)) {
        setFields.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    });

    setFields.push(`updated_at = NOW()`);
    params.push(scheduleId);

    const query = `
      UPDATE ${this.scheduleTable}
      SET ${setFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    try {
      const result = await pg.query(query, params);
      if (!result.rows[0]) throw new Error('Schedule not found');

      logger.info(`Irrigation schedule updated: ${scheduleId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to update irrigation schedule', { schedule_id: scheduleId, error: error.message });
      throw error;
    }
  }

  /**
   * Log irrigation delivery
   */
  async logDelivery(deliveryData) {
    const pg = this.db;
    if (!pg) throw new Error('Database not initialized');

    const {
      schedule_id, actual_volume, delivery_date, duration_minutes,
      water_pressure, delivery_status, notes
    } = deliveryData;

    if (!schedule_id || !actual_volume) {
      throw new Error('schedule_id and actual_volume are required');
    }

    try {
      const result = await pg.query(
        `INSERT INTO ${this.logsTable}
         (schedule_id, actual_volume, delivery_date, duration_minutes, water_pressure, delivery_status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [schedule_id, actual_volume, delivery_date || new Date(), duration_minutes, water_pressure, delivery_status || 'completed', notes]
      );

      logger.info(`Irrigation delivery logged: ${result.rows[0].id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to log delivery', { schedule_id, error: error.message });
      throw error;
    }
  }

  /**
   * Get irrigation analytics for farmer
   */
  async getAnalytics(farmId, period = 30) {
    const pg = this.db;
    if (!pg) throw new Error('Database not initialized');

    try {
      const query = `
        SELECT
          COUNT(DISTINCT schedule_id) as total_schedules,
          SUM(actual_volume) as total_volume_delivered,
          AVG(actual_volume) as avg_volume_per_delivery,
          COUNT(*) as total_deliveries,
          SUM(CASE WHEN delivery_status = 'completed' THEN 1 ELSE 0 END) as successful_deliveries,
          MAX(delivery_date) as last_delivery_date
        FROM ${this.logsTable}
        WHERE schedule_id IN (
          SELECT id FROM ${this.scheduleTable} WHERE farm_id = $1
        )
        AND delivery_date > NOW() - INTERVAL '${period} days'
      `;

      const result = await pg.query(query, [farmId]);

      return {
        period_days: period,
        ...result.rows[0]
      };
    } catch (error) {
      logger.error('Failed to get analytics', { farm_id: farmId, error: error.message });
      throw error;
    }
  }

  /**
   * Get water usage comparison (farmer vs regional average)
   */
  async getRegionalComparison(farmId) {
    const pg = this.db;
    if (!pg) throw new Error('Database not initialized');

    try {
      const farmAvg = await pg.query(
        `SELECT AVG(actual_volume) as avg_volume FROM ${this.logsTable}
         WHERE schedule_id IN (SELECT id FROM ${this.scheduleTable} WHERE farm_id = $1)`,
        [farmId]
      );

      const regionalAvg = await pg.query(
        `SELECT AVG(logs.actual_volume) as avg_volume
         FROM ${this.logsTable} logs
         JOIN ${this.scheduleTable} sched ON logs.schedule_id = sched.id
         JOIN farms f ON sched.farm_id = f.id
         WHERE f.district = (SELECT district FROM farms WHERE id = $1)`,
        [farmId]
      );

      const farmVolume = farmAvg.rows[0]?.avg_volume || 0;
      const regionalVolume = regionalAvg.rows[0]?.avg_volume || 0;
      const percentile = regionalVolume > 0 ? Math.round((farmVolume / regionalVolume) * 100) : 0;

      return {
        farm_avg_volume: Math.round(farmVolume),
        regional_avg_volume: Math.round(regionalVolume),
        efficiency_percentile: percentile,
        recommendation: percentile < 80 ? 'Your farm uses less water than regional average - good efficiency' :
                       percentile > 120 ? 'Consider optimizing irrigation - using more than regional average' :
                       'Your water usage is aligned with regional average'
      };
    } catch (error) {
      logger.error('Failed to get regional comparison', { farm_id: farmId, error: error.message });
      throw error;
    }
  }

  /**
   * Delete schedule
   */
  async deleteSchedule(scheduleId) {
    const pg = this.db;
    if (!pg) throw new Error('Database not initialized');

    try {
      await pg.query(`DELETE FROM ${this.logsTable} WHERE schedule_id = $1`, [scheduleId]);
      const result = await pg.query(
        `DELETE FROM ${this.scheduleTable} WHERE id = $1 RETURNING id`,
        [scheduleId]
      );

      logger.info(`Irrigation schedule deleted: ${scheduleId}`);
      return !!result.rows[0];
    } catch (error) {
      logger.error('Failed to delete schedule', { schedule_id: scheduleId, error: error.message });
      throw error;
    }
  }
}

module.exports = IrrigationManagementService;
