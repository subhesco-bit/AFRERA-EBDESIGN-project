/**
 * ETL Service
 * Handles Extract, Transform, Load operations for data integration
 */

const { logger } = require('../utils/logger');
const { getPostgreSQL } = require('../database/connection');
const fs = require('fs').promises;
const path = require('path');

class ETLService {
  constructor() {
    this.db = null;
    this.dataDir = path.join(__dirname, '../../data/etl');
  }

  async initialize() {
    try {
      this.db = getPostgreSQL();
      // Ensure data directory exists
      await fs.mkdir(this.dataDir, { recursive: true });
      logger.info('ETLService initialized');
    } catch (error) {
      logger.error('ETLService initialization failed', error);
    }
  }

  /**
   * Extract data from various sources
   */
  async extract(sourceConfig) {
  // Validate inputs
  if (!sourceConfig) throw new Error('Missing required parameter');

    const { type, config } = sourceConfig;

    try {
      let data;
      switch (type) {
        case 'database':
          data = await this.extractFromDatabase(config);
          break;
        case 'api':
          data = await this.extractFromAPI(config);
          break;
        case 'file':
          data = await this.extractFromFile(config);
          break;
        case 'csv':
          data = await this.extractFromCSV(config);
          break;
        default:
          throw new Error(`Unknown extraction type: ${type}`);
      }

      logger.info(`Extracted ${data.length} records from ${type}`);
      return data;
    } catch (error) {
      logger.error('Extract failed', error);
      throw error;
    }
  }

  /**
   * Transform data according to rules
   */
  async transform(data, transformRules) {
    try {
      const transformedData = data.map(record => {
        let transformed = { ...record };

        // Apply transformation rules
        for (const rule of transformRules) {
          transformed = this.applyTransformRule(transformed, rule);
        }

        return transformed;
      });

      logger.info(`Transformed ${transformedData.length} records`);
      return transformedData;
    } catch (error) {
      logger.error('Transform failed', error);
      throw error;
    }
  }

  /**
   * Load data into destination
   */
  async load(data, destinationConfig) {
    const { type, table, config } = destinationConfig;

    try {
      let result;
      switch (type) {
        case 'database':
          result = await this.loadToDatabase(data, table, config);
          break;
        case 'file':
          result = await this.loadToFile(data, config);
          break;
        case 'api':
          result = await this.loadToAPI(data, config);
          break;
        default:
          throw new Error(`Unknown load type: ${type}`);
      }

      logger.info(`Loaded ${data.length} records to ${type}`);
      return result;
    } catch (error) {
      logger.error('Load failed', error);
      throw error;
    }
  }

  /**
   * Run complete ETL pipeline
   */
  async runPipeline(pipelineConfig) {
    const { name, source, transform, destination } = pipelineConfig;

    try {
      logger.info(`Starting ETL pipeline: ${name}`);

      // Extract
      const rawData = await this.extract(source);

      // Transform
      const transformedData = await this.transform(rawData, transform);

      // Load
      const loadResult = await this.load(transformedData, destination);

      // Save pipeline execution record
      await this.savePipelineExecution({
        name,
        recordsProcessed: transformedData.length,
        status: 'completed',
        config: pipelineConfig
      });

      logger.info(`ETL pipeline ${name} completed successfully`);
      return {
        success: true,
        recordsProcessed: transformedData.length,
        loadResult
      };
    } catch (error) {
      // Save pipeline execution record with error
      await this.savePipelineExecution({
        name,
        recordsProcessed: 0,
        status: 'failed',
        error: error.message,
        config: pipelineConfig
      });

      logger.error(`ETL pipeline ${name} failed`, error);
      throw error;
    }
  }

  /**
   * Extract from database
   */
  async extractFromDatabase(config) {
    const { query, params = [] } = config;
    const result = await this.db.query(query, params);
    return result.rows;
  }

  /**
   * Extract from API
   */
  async extractFromAPI(config) {
    const { url, method = 'GET', headers = {}, body } = config;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Extract from file
   */
  async extractFromFile(config) {
    const { filePath, format = 'json' } = config;
    const fullPath = path.join(this.dataDir, filePath);
    const content = await fs.readFile(fullPath, 'utf8');

    switch (format) {
      case 'json':
        return JSON.parse(content);
      default:
        throw new Error(`Unsupported file format: ${format}`);
    }
  }

  /**
   * Extract from CSV
   */
  async extractFromCSV(config) {
    const { filePath } = config;
    const fullPath = path.join(this.dataDir, filePath);
    const content = await fs.readFile(fullPath, 'utf8');
    
    // Simple CSV parsing (in production, use a proper CSV library)
    const lines = content.split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const record = {};
      headers.forEach((header, index) => {
        record[header.trim()] = values[index]?.trim();
      });
      return record;
    });
  }

  /**
   * Apply transformation rule
   */
  applyTransformRule(record, rule) {
    const { field, operation, value } = rule;

    switch (operation) {
      case 'rename':
        record[value] = record[field];
        delete record[field];
        break;
      case 'map':
        record[field] = value[record[field]] || record[field];
        break;
      case 'calculate':
        record[field] = this.calculateField(record, value);
        break;
      case 'format':
        record[field] = this.formatField(record[field], value);
        break;
      case 'filter':
        if (!this.evaluateCondition(record, value)) {
          return null;
        }
        break;
      default:
        throw new Error(`Unknown transform operation: ${operation}`);
    }

    return record;
  }

  /**
   * Calculate field value
   */
  calculateField(record, expression) {
    // Simple expression evaluation (in production, use a proper expression parser)
    try {
      return eval(expression.replace(/\{(\w+)\}/g, (_, key) => record[key] || 0));
    } catch (error) {
      logger.error('Calculate field failed', error);
      return null;
    }
  }

  /**
   * Format field value
   */
  formatField(value, format) {
    switch (format) {
      case 'uppercase':
        return String(value).toUpperCase();
      case 'lowercase':
        return String(value).toLowerCase();
      case 'trim':
        return String(value).trim();
      case 'number':
        return Number(value);
      case 'date':
        return new Date(value).toISOString();
      default:
        return value;
    }
  }

  /**
   * Evaluate condition
   */
  evaluateCondition(record, condition) {
    const { field, operator, value } = condition;
    const fieldValue = record[field];

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'not_equals':
        return fieldValue !== value;
      case 'greater_than':
        return fieldValue > value;
      case 'less_than':
        return fieldValue < value;
      case 'contains':
        return String(fieldValue).includes(value);
      default:
        throw new Error(`Unknown condition operator: ${operator}`);
    }
  }

  /**
   * Load to database
   */
  async loadToDatabase(data, table, config) {
    const { mode = 'insert', onConflict = 'ignore' } = config;

    if (data.length === 0) {
      return { inserted: 0, updated: 0 };
    }

    const columns = Object.keys(data[0]);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const columnNames = columns.join(', ');

    let query;
    if (mode === 'insert') {
      query = `
        INSERT INTO ${table} (${columnNames})
        VALUES (${placeholders})
      `;
      
      if (onConflict === 'update') {
        const updates = columns.map(col => `${col} = EXCLUDED.${col}`).join(', ');
        query += ` ON CONFLICT DO UPDATE SET ${updates}`;
      } else if (onConflict === 'ignore') {
        query += ` ON CONFLICT DO NOTHING`;
      }
    }

    let inserted = 0;
    let updated = 0;

    for (const record of data) {
      try {
        const values = columns.map(col => record[col]);
        await this.db.query(query, values);
        inserted++;
      } catch (error) {
        if (onConflict === 'update') {
          updated++;
        }
      }
    }

    return { inserted, updated };
  }

  /**
   * Load to file
   */
  async loadToFile(data, config) {
    const { filePath, format = 'json' } = config;
    const fullPath = path.join(this.dataDir, filePath);

    let content;
    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        break;
      case 'csv':
        if (data.length === 0) {
          content = '';
        } else {
          const headers = Object.keys(data[0]).join(',');
          const rows = data.map(row => Object.values(row).join(','));
          content = [headers, ...rows].join('\n');
        }
        break;
      default:
        throw new Error(`Unsupported file format: ${format}`);
    }

    await fs.writeFile(fullPath, content, 'utf8');
    return { filePath: fullPath, records: data.length };
  }

  /**
   * Load to API
   */
  async loadToAPI(data, config) {
    const { url, method = 'POST', headers = {}, batchSize = 100 } = config;

    let results = [];
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(batch)
      });

      if (!response.ok) {
        throw new Error(`API load failed: ${response.statusText}`);
      }

      const batchResult = await response.json();
      results.push(...(Array.isArray(batchResult) ? batchResult : [batchResult]));
    }

    return { loaded: results.length };
  }

  /**
   * Save pipeline execution record
   */
  async savePipelineExecution(executionData) {
    try {
      const query = `
        INSERT INTO etl_pipeline_executions (
          name, records_processed, status, error, config, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
      `;
      await this.db.query(query, [
        executionData.name,
        executionData.recordsProcessed,
        executionData.status,
        executionData.error,
        JSON.stringify(executionData.config)
      ]);
    } catch (error) {
      logger.error('Save pipeline execution failed', error);
    }
  }

  /**
   * Get pipeline execution history
   */
  async getPipelineHistory(pipelineName, limit = 10) {
    try {
      const query = `
        SELECT * FROM etl_pipeline_executions
        WHERE name = $1
        ORDER BY created_at DESC
        LIMIT $2
      `;
      const result = await this.db.query(query, [pipelineName, limit]);
      return result.rows;
    } catch (error) {
      logger.error('Get pipeline history failed', error);
      throw error;
    }
  }
}

module.exports = new ETLService();
