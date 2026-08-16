/**
 * Database Query Optimization Layer
 * Production-ready query optimization with automatic rewriting, hints, and performance analysis
 */

const { Pool } = require('pg');
const { logger } = require('../../utils/logger');

class QueryOptimizer {
  constructor(config = {}) {
    this.config = {
      // Enable/disable optimization features
      enableQueryRewriting: config.enableQueryRewriting !== false,
      enableQueryHints: config.enableQueryHints !== false,
      enablePerformanceAnalysis: config.enablePerformanceAnalysis !== false,
      enableNPlusOneDetection: config.enableNPlusOneDetection !== false,
      
      // Performance thresholds
      slowQueryThreshold: config.slowQueryThreshold || 1000, // 1 second
      nPlusOneThreshold: config.nPlusOneThreshold || 10,
      
      // Optimization rules
      enableSelectStarOptimization: config.enableSelectStarOptimization !== false,
      enableJoinOptimization: config.enableJoinOptimization !== false,
      enableWhereOptimization: config.enableWhereOptimization !== false,
      enableSubqueryOptimization: config.enableSubqueryOptimization !== false,
      
      // Database connection
      databaseUrl: config.databaseUrl || process.env.DATABASE_URL,
      
      ...config
    };

    this.pool = null;
    this.queryPatterns = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize query optimizer
   */
  async initialize() {
    try {
      this.pool = new Pool({
        connectionString: this.config.databaseUrl
      });

      // Enable pg_stat_statements for query analysis
      await this.enableQueryStatistics();

      this.isInitialized = true;
      logger.info('Query optimizer initialized');
    } catch (error) {
      logger.error('Failed to initialize query optimizer', { error: error.message });
      throw error;
    }
  }

  /**
   * Enable pg_stat_statements
   */
  async enableQueryStatistics() {
    try {
      await this.pool.query('CREATE EXTENSION IF NOT EXISTS pg_stat_statements');
      logger.info('pg_stat_statements enabled for query optimization');
    } catch (error) {
      logger.warn('Failed to enable pg_stat_statements', { error: error.message });
    }
  }

  /**
   * Analyze and optimize query
   */
  async optimizeQuery(query, params = {}) {
    if (!this.config.enableQueryRewriting) {
      return { optimized: false, query, suggestions: [] };
    }

    const analysis = this.analyzeQuery(query);
    const suggestions = [];
    let optimizedQuery = query;

    // Apply optimizations based on analysis
    if (analysis.issues.selectStar && this.config.enableSelectStarOptimization) {
      const columns = await this.getTableColumns(analysis.tableName);
      if (columns.length > 0) {
        optimizedQuery = this.replaceSelectStar(optimizedQuery, columns);
        suggestions.push({
          type: 'select_star',
          message: 'Replaced SELECT * with explicit columns',
          severity: 'info'
        });
      }
    }

    if (analysis.issues.missingWhere && this.config.enableWhereOptimization) {
      suggestions.push({
        type: 'missing_where',
        message: 'Query lacks WHERE clause - consider adding filters to reduce result set',
        severity: 'warning'
      });
    }

    if (analysis.issues.missingLimit && this.config.enableWhereOptimization) {
      suggestions.push({
        type: 'missing_limit',
        message: 'Query lacks LIMIT clause - consider adding to prevent large result sets',
        severity: 'warning'
      });
    }

    if (analysis.issues.subquery && this.config.enableSubqueryOptimization) {
      suggestions.push({
        type: 'subquery',
        message: 'Query contains subquery - consider using JOIN for better performance',
        severity: 'info'
      });
    }

    if (analysis.issues.nPlusOne && this.config.enableNPlusOneDetection) {
      suggestions.push({
        type: 'n_plus_one',
        message: 'Potential N+1 query pattern detected - consider using eager loading',
        severity: 'warning'
      });
    }

    return {
      optimized: optimizedQuery !== query,
      query: optimizedQuery,
      originalQuery: query,
      analysis,
      suggestions
    };
  }

  /**
   * Analyze query for issues
   */
  analyzeQuery(query) {
    const normalizedQuery = query.toLowerCase().replace(/\s+/g, ' ');
    
    const analysis = {
      hasSelect: normalizedQuery.includes('select'),
      hasJoin: normalizedQuery.includes('join'),
      hasWhere: normalizedQuery.includes('where'),
      hasLimit: normalizedQuery.includes('limit'),
      hasSubquery: normalizedQuery.includes('select') && normalizedQuery.match(/select.*select/),
      hasOrderBy: normalizedQuery.includes('order by'),
      hasGroupBy: normalizedQuery.includes('group by'),
      hasIndexHint: normalizedQuery.includes('use index') || normalizedQuery.includes('force index'),
      tableName: this.extractTableName(query),
      issues: {
        selectStar: normalizedQuery.includes('select *'),
        missingWhere: normalizedQuery.includes('select') && !normalizedQuery.includes('where'),
        missingLimit: normalizedQuery.includes('select') && !normalizedQuery.includes('limit'),
        subquery: normalizedQuery.match(/select.*select/),
        nPlusOne: this.detectNPlusOnePattern(normalizedQuery)
      }
    };

    return analysis;
  }

  /**
   * Extract table name from query
   */
  extractTableName(query) {
    const match = query.match(/from\s+(\w+)/i);
    return match ? match[1] : null;
  }

  /**
   * Detect N+1 query pattern
   */
  detectNPlusOnePattern(query) {
    // Simple heuristic: multiple SELECTs on same table in short time
    const pattern = this.queryPatterns.get(this.extractTableName(query) || 'unknown');
    
    if (pattern) {
      pattern.count++;
      pattern.lastSeen = Date.now();
      
      if (pattern.count > this.config.nPlusOneThreshold) {
        return true;
      }
    } else {
      this.queryPatterns.set(this.extractTableName(query) || 'unknown', {
        count: 1,
        lastSeen: Date.now()
      });
    }

    return false;
  }

  /**
   * Get table columns
   */
  async getTableColumns(tableName) {
    if (!tableName) return [];

    try {
      const { rows } = await this.pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

      return rows.map(row => row.column_name);
    } catch (error) {
      logger.error('Failed to get table columns', { error: error.message, tableName });
      return [];
    }
  }

  /**
   * Replace SELECT * with explicit columns
   */
  replaceSelectStar(query, columns) {
    return query.replace(/SELECT\s+\*\s+FROM/i, `SELECT ${columns.join(', ')} FROM`);
  }

  /**
   * Add query hints
   */
  addQueryHints(query, hints = {}) {
    if (!this.config.enableQueryHints) {
      return query;
    }

    let modifiedQuery = query;

    if (hints.index) {
      modifiedQuery = modifiedQuery.replace(
        /FROM\s+(\w+)/i,
        `FROM $1 /*+ INDEX($1 ${hints.index}) */`
      );
    }

    if (hints.parallel) {
      modifiedQuery = modifiedQuery.replace(
        /SELECT/i,
        `SELECT /*+ PARALLEL(${hints.parallel}) */`
      );
    }

    return modifiedQuery;
  }

  /**
   * Analyze query performance
   */
  async analyzePerformance(query) {
    if (!this.config.enablePerformanceAnalysis) {
      return null;
    }

    try {
      const startTime = Date.now();
      
      // Get execution plan
      const planResult = await this.pool.query('EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ' + query);
      const duration = Date.now() - startTime;

      const plan = planResult.rows[0]['QUERY PLAN'];
      const analysis = this.parseExecutionPlan(plan);

      return {
        duration,
        plan,
        analysis,
        isSlow: duration > this.config.slowQueryThreshold
      };
    } catch (error) {
      logger.error('Performance analysis failed', { error: error.message });
      return null;
    }
  }

  /**
   * Parse execution plan
   */
  parseExecutionPlan(plan) {
    const analysis = {
      totalCost: 0,
      actualTime: 0,
      rows: 0,
      loops: 0,
      nodes: [],
      indexScans: [],
      sequentialScans: [],
      hashJoins: [],
      nestedLoops: []
    };

    function traverse(node) {
      analysis.nodes.push(node);

      if (node['Total Cost']) {
        analysis.totalCost = Math.max(analysis.totalCost, node['Total Cost']);
      }

      if (node['Actual Total Time']) {
        analysis.actualTime += node['Actual Total Time'];
      }

      if (node['Actual Rows']) {
        analysis.rows += node['Actual Rows'];
      }

      if (node['Actual Loops']) {
        analysis.loops += node['Actual Loops'];
      }

      if (node['Node Type'] === 'Index Scan') {
        analysis.indexScans.push(node);
      }

      if (node['Node Type'] === 'Seq Scan') {
        analysis.sequentialScans.push(node);
      }

      if (node['Node Type'] === 'Hash Join') {
        analysis.hashJoins.push(node);
      }

      if (node['Node Type'] === 'Nested Loop') {
        analysis.nestedLoops.push(node);
      }

      if (node['Plans']) {
        node['Plans'].forEach(traverse);
      }
    }

    if (Array.isArray(plan)) {
      plan.forEach(traverse);
    } else if (plan.Plan) {
      traverse(plan.Plan);
    }

    return analysis;
  }

  /**
   * Get optimization suggestions based on execution plan
   */
  getOptimizationSuggestions(analysis) {
    const suggestions = [];

    // Check for sequential scans on large tables
    if (analysis.sequentialScans.length > 0) {
      analysis.sequentialScans.forEach(scan => {
        if (scan['Actual Rows'] > 1000) {
          suggestions.push({
            type: 'sequential_scan',
            message: `Sequential scan on ${scan['Relation Name']} returned ${scan['Actual Rows']} rows - consider adding an index`,
            severity: 'warning',
            table: scan['Relation Name']
          });
        }
      });
    }

    // Check for nested loops with many iterations
    if (analysis.nestedLoops.length > 0) {
      analysis.nestedLoops.forEach(loop => {
        if (loop['Actual Loops'] > 100) {
          suggestions.push({
            type: 'nested_loop',
            message: `Nested loop executed ${loop['Actual Loops']} times - consider using Hash Join instead`,
            severity: 'warning'
          });
        }
      });
    }

    // Check for high cost queries
    if (analysis.totalCost > 10000) {
      suggestions.push({
        type: 'high_cost',
        message: `Query has high total cost (${analysis.totalCost.toFixed(2)}) - consider optimization`,
        severity: 'warning'
      });
    }

    return suggestions;
  }

  /**
   * Get slow queries from pg_stat_statements
   */
  async getSlowQueries(limit = 20) {
    try {
      const { rows } = await this.pool.query(`
        SELECT 
          query,
          calls,
          total_exec_time,
          mean_exec_time,
          max_exec_time,
          rows
        FROM pg_stat_statements
        WHERE mean_exec_time > $1
        ORDER BY mean_exec_time DESC
        LIMIT $2
      `, [this.config.slowQueryThreshold / 1000, limit]);

      return rows.map(row => ({
        query: row.query.substring(0, 500),
        calls: row.calls,
        totalTime: row.total_exec_time * 1000,
        avgTime: row.mean_exec_time * 1000,
        maxTime: row.max_exec_time * 1000,
        rows: row.rows
      }));
    } catch (error) {
      logger.error('Failed to get slow queries', { error: error.message });
      return [];
    }
  }

  /**
   * Get missing indexes suggestions
   */
  async getMissingIndexSuggestions() {
    try {
      const { rows } = await this.pool.query(`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats
        WHERE schemaname = 'public'
          AND n_distinct > 0
          AND correlation < 0.5
        ORDER BY correlation ASC
        LIMIT 20
      `);

      return rows.map(row => ({
        schema: row.schemaname,
        table: row.tablename,
        column: row.attname,
        distinct: row.n_distinct,
        correlation: row.correlation,
        suggestion: `Consider adding an index on ${row.tablename}.${row.attname}`
      }));
    } catch (error) {
      logger.error('Failed to get missing index suggestions', { error: error.message });
      return [];
    }
  }

  /**
   * Get unused indexes
   */
  async getUnusedIndexes() {
    try {
      const { rows } = await this.pool.query(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan
        FROM pg_stat_user_indexes
        WHERE idx_scan = 0
          AND indexname NOT LIKE '%_pkey'
        ORDER BY schemaname, tablename
      `);

      return rows.map(row => ({
        schema: row.schemaname,
        table: row.tablename,
        index: row.indexname,
        scans: row.idx_scan,
        suggestion: `Consider dropping unused index ${row.indexname} on ${row.tablename}`
      }));
    } catch (error) {
      logger.error('Failed to get unused indexes', { error: error.message });
      return [];
    }
  }

  /**
   * Analyze table statistics
   */
  async analyzeTable(tableName) {
    try {
      await this.pool.query(`ANALYZE ${tableName}`);
      logger.info(`Table analyzed: ${tableName}`);
      return { success: true, table: tableName };
    } catch (error) {
      logger.error('Failed to analyze table', { error: error.message, tableName });
      return { success: false, table: tableName, error: error.message };
    }
  }

  /**
   * Vacuum table
   */
  async vacuumTable(tableName, options = {}) {
    try {
      const vacuumOptions = [];
      if (options.full) vacuumOptions.push('FULL');
      if (options.analyze) vacuumOptions.push('ANALYZE');
      if (options.verbose) vacuumOptions.push('VERBOSE');

      const optionStr = vacuumOptions.length > 0 ? vacuumOptions.join(' ') : '';
      await this.pool.query(`VACUUM ${optionStr} ${tableName}`);
      
      logger.info(`Table vacuumed: ${tableName}`, { options: vacuumOptions });
      return { success: true, table: tableName };
    } catch (error) {
      logger.error('Failed to vacuum table', { error: error.message, tableName });
      return { success: false, table: tableName, error: error.message };
    }
  }

  /**
   * Reindex table
   */
  async reindexTable(tableName) {
    try {
      await this.pool.query(`REINDEX TABLE ${tableName}`);
      logger.info(`Table reindexed: ${tableName}`);
      return { success: true, table: tableName };
    } catch (error) {
      logger.error('Failed to reindex table', { error: error.message, tableName });
      return { success: false, table: tableName, error: error.message };
    }
  }

  /**
   * Get table bloat information
   */
  async getTableBloat() {
    try {
      const { rows } = await this.pool.query(`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
          pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `);

      return rows;
    } catch (error) {
      logger.error('Failed to get table bloat', { error: error.message });
      return [];
    }
  }

  /**
   * Reset query patterns
   */
  resetQueryPatterns() {
    this.queryPatterns.clear();
  }

  /**
   * Shutdown optimizer
   */
  async shutdown() {
    if (this.pool) {
      await this.pool.end();
    }

    this.queryPatterns.clear();
    this.isInitialized = false;

    logger.info('Query optimizer shutdown complete');
  }
}

// Singleton instance
let instance = null;

/**
 * Get or create the singleton optimizer instance
 */
function getQueryOptimizer(config = {}) {
  if (!instance) {
    instance = new QueryOptimizer(config);
  }
  return instance;
}

/**
 * Initialize the optimizer
 */
async function initializeQueryOptimizer(config = {}) {
  const optimizer = getQueryOptimizer(config);
  return await optimizer.initialize();
}

/**
 * Shutdown the optimizer
 */
async function shutdownQueryOptimizer() {
  if (instance) {
    await instance.shutdown();
    instance = null;
  }
}

module.exports = {
  QueryOptimizer,
  getQueryOptimizer,
  initializeQueryOptimizer,
  shutdownQueryOptimizer
};
