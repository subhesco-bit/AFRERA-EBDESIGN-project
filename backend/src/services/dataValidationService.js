/**
 * Data Validation Service
 * Handles data validation and quality checks
 */

const { logger } = require('../utils/logger');
const { getPostgreSQL } = require('../database/connection');

class DataValidationService {
  constructor() {
    this.db = null;
    this.validationRules = new Map();
  }

  async initialize() {
    try {
      this.db = getPostgreSQL();
      await this.loadValidationRules();
      logger.info('DataValidationService initialized');
    } catch (error) {
      logger.error('DataValidationService initialization failed', error);
    }
  }

  /**
   * Validate data against rules
   */
  async validate(data, ruleSet) {
    try {
      const rules = this.validationRules.get(ruleSet);
      if (!rules) {
        throw new Error(`Validation rule set ${ruleSet} not found`);
      }

      const errors = [];
      const warnings = [];

      for (const rule of rules) {
        const result = this.applyRule(data, rule);
        if (!result.valid) {
          if (rule.severity === 'error') {
            errors.push(result);
          } else {
            warnings.push(result);
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      logger.error('Data validation failed', error);
      throw error;
    }
  }

  /**
   * Apply validation rule
   */
  applyRule(data, rule) {
    const { field, type, constraints, message } = rule;
    const value = this.getFieldValue(data, field);

    switch (type) {
      case 'required':
        return this.validateRequired(value, message);
      case 'type':
        return this.validateType(value, constraints, message);
      case 'range':
        return this.validateRange(value, constraints, message);
      case 'pattern':
        return this.validatePattern(value, constraints, message);
      case 'length':
        return this.validateLength(value, constraints, message);
      case 'enum':
        return this.validateEnum(value, constraints, message);
      case 'custom':
        return this.validateCustom(value, constraints, message);
      default:
        return { valid: true };
    }
  }

  /**
   * Get field value from nested object
   */
  getFieldValue(data, field) {
    return field.split('.').reduce((obj, key) => obj?.[key], data);
  }

  /**
   * Validate required field
   */
  validateRequired(value, message) {
    const valid = value !== null && value !== undefined && value !== '';
    return {
      valid,
      message: message || 'Field is required'
    };
  }

  /**
   * Validate field type
   */
  validateType(value, constraints, message) {
    const { type } = constraints;
    let valid = true;

    switch (type) {
      case 'string':
        valid = typeof value === 'string';
        break;
      case 'number':
        valid = typeof value === 'number' && !isNaN(value);
        break;
      case 'boolean':
        valid = typeof value === 'boolean';
        break;
      case 'email':
        valid = this.validateEmail(value);
        break;
      case 'phone':
        valid = this.validatePhone(value);
        break;
      case 'date':
        valid = !isNaN(Date.parse(value));
        break;
      case 'array':
        valid = Array.isArray(value);
        break;
      case 'object':
        valid = typeof value === 'object' && value !== null && !Array.isArray(value);
        break;
    }

    return {
      valid,
      message: message || `Field must be of type ${type}`
    };
  }

  /**
   * Validate email format
   */
  validateEmail(value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  /**
   * Validate phone format
   */
  validatePhone(value) {
    const phoneRegex = /^[+]?[\d\s-()]{10,}$/;
    return phoneRegex.test(value);
  }

  /**
   * Validate range
   */
  validateRange(value, constraints, message) {
    const { min, max } = constraints;
    let valid = true;

    if (min !== undefined && value < min) {
      valid = false;
    }
    if (max !== undefined && value > max) {
      valid = false;
    }

    return {
      valid,
      message: message || `Field must be between ${min} and ${max}`
    };
  }

  /**
   * Validate pattern
   */
  validatePattern(value, constraints, message) {
    const { pattern } = constraints;
    const regex = new RegExp(pattern);
    const valid = regex.test(value);

    return {
      valid,
      message: message || 'Field does not match required pattern'
    };
  }

  /**
   * Validate length
   */
  validateLength(value, constraints, message) {
    const { min, max } = constraints;
    const length = String(value).length;
    let valid = true;

    if (min !== undefined && length < min) {
      valid = false;
    }
    if (max !== undefined && length > max) {
      valid = false;
    }

    return {
      valid,
      message: message || `Field length must be between ${min} and ${max}`
    };
  }

  /**
   * Validate enum
   */
  validateEnum(value, constraints, message) {
    const { values } = constraints;
    const valid = values.includes(value);

    return {
      valid,
      message: message || `Field must be one of: ${values.join(', ')}`
    };
  }

  /**
   * Validate with custom function
   */
  validateCustom(value, constraints, message) {
    const { validator } = constraints;
    try {
      const valid = validator(value);
      return {
        valid,
        message: message || 'Custom validation failed'
      };
    } catch (error) {
      return {
        valid: false,
        message: message || error.message
      };
    }
  }

  /**
   * Load validation rules from database
   */
  async loadValidationRules() {
    try {
      const query = `
        SELECT * FROM validation_rules ORDER BY rule_set, field
      `;
      const result = await this.db.query(query);

      // Group rules by rule set
      for (const row of result.rows) {
        const ruleSet = row.rule_set;
        if (!this.validationRules.has(ruleSet)) {
          this.validationRules.set(ruleSet, []);
        }
        this.validationRules.get(ruleSet).push({
          field: row.field,
          type: row.type,
          constraints: row.constraints ? JSON.parse(row.constraints) : {},
          severity: row.severity,
          message: row.message
        });
      }

      logger.info(`Loaded ${result.rows.length} validation rules`);
    } catch (error) {
      logger.error('Load validation rules failed', error);
    }
  }

  /**
   * Add validation rule
   */
  async addValidationRule(ruleData) {
    const { ruleSet, field, type, constraints, severity = 'error', message } = ruleData;

    try {
      const query = `
        INSERT INTO validation_rules (
          rule_set, field, type, constraints, severity, message, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *
      `;
      const result = await this.db.query(query, [
        ruleSet,
        field,
        type,
        JSON.stringify(constraints),
        severity,
        message
      ]);

      // Update in-memory rules
      if (!this.validationRules.has(ruleSet)) {
        this.validationRules.set(ruleSet, []);
      }
      this.validationRules.get(ruleSet).push({
        field,
        type,
        constraints,
        severity,
        message
      });

      logger.info(`Validation rule added: ${ruleSet}.${field}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Add validation rule failed', error);
      throw error;
    }
  }

  /**
   * Validate database record
   */
  async validateRecord(table, record) {
    try {
      const ruleSet = table;
      const validation = await this.validate(record, ruleSet);

      // Log validation result
      await this.logValidationResult({
        table,
        recordId: record.id || record.record_id,
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings
      });

      return validation;
    } catch (error) {
      logger.error('Validate record failed', error);
      throw error;
    }
  }

  /**
   * Log validation result
   */
  async logValidationResult(result) {
    try {
      const query = `
        INSERT INTO validation_logs (
          table_name, record_id, valid, errors, warnings, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
      `;
      await this.db.query(query, [
        result.table,
        result.recordId,
        result.valid,
        JSON.stringify(result.errors),
        JSON.stringify(result.warnings)
      ]);
    } catch (error) {
      logger.error('Log validation result failed', error);
    }
  }

  /**
   * Get validation statistics
   */
  async getValidationStatistics(filters = {}) {
    const { table, startDate, endDate } = filters;

    try {
      let query = `
        SELECT 
          COUNT(*) as total_validations,
          SUM(CASE WHEN valid = true THEN 1 ELSE 0 END) as valid,
          SUM(CASE WHEN valid = false THEN 1 ELSE 0 END) as invalid
        FROM validation_logs
      `;
      const params = [];
      let paramCount = 0;

      if (table) {
        paramCount++;
        query += ` WHERE table_name = $${paramCount}`;
        params.push(table);
      }

      if (startDate) {
        paramCount++;
        query += paramCount === 1 ? ' WHERE' : ' AND';
        query += ` created_at >= $${paramCount}`;
        params.push(startDate);
      }

      if (endDate) {
        paramCount++;
        query += paramCount === 1 ? ' WHERE' : ' AND';
        query += ` created_at <= $${paramCount}`;
        params.push(endDate);
      }

      const result = await this.db.query(query, params);
      return result.rows[0];
    } catch (error) {
      logger.error('Get validation statistics failed', error);
      throw error;
    }
  }

  /**
   * Clean old validation logs
   */
  async cleanOldLogs(daysToKeep = 30) {
    try {
      const query = `
        DELETE FROM validation_logs
        WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
      `;
      const result = await this.db.query(query);
      
      logger.info(`Cleaned ${result.rowCount} old validation logs`);
      return result.rowCount;
    } catch (error) {
      logger.error('Clean old logs failed', error);
      throw error;
    }
  }
}

module.exports = new DataValidationService();
