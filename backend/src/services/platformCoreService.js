/**
 * Platform Core Module Service (M001)
 * Core platform functionality with AI enhancement
 * System-wide configuration, monitoring, and core operations
 */

const { logger } = require('../utils/logger');
const { getPostgreSQL } = require('../database/connection');
const aiGateway = require('./aiGatewayService');
const analytics = require('./analyticsService');
const realtimeMonitoring = require('./realtimeMonitoringService');

class PlatformCoreService {
  constructor() {
    this.aiGateway = aiGateway;
    this.analytics = analytics;
    this.monitoring = realtimeMonitoring;
  }

  /**
   * Get platform status
   */
  async getPlatformStatus() {
    try {
      const pg = getPostgreSQL();
      
      // Get system metrics
      const systemMetrics = await this.getSystemMetrics();
      
      // Get AI Gateway status
      const aiStatus = await this.aiGateway.healthCheck();
      
      // Get Analytics status
      const analyticsStatus = await this.analytics.healthCheck();
      
      // Get Monitoring status
      const monitoringStatus = await this.monitoring.healthCheck();
      
      return {
        status: 'operational',
        uptime: process.uptime(),
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        system_metrics: systemMetrics,
        services: {
          ai_gateway: aiStatus,
          analytics: analyticsStatus,
          monitoring: monitoringStatus
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error getting platform status:', error);
      throw error;
    }
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics() {
    return {
      cpu_usage: process.cpuUsage().user / 1000000,
      memory_usage: process.memoryUsage().heapUsed / 1024 / 1024,
      total_memory: process.memoryUsage().heapTotal / 1024 / 1024,
      uptime: process.uptime(),
      load_average: require('os').loadavg()
    };
  }

  /**
   * Get platform configuration
   */
  async getPlatformConfiguration() {
    try {
      const pg = getPostgreSQL();
      
      const query = `
        SELECT * FROM platform_configurations
        WHERE is_active = true
        ORDER BY priority ASC
      `;
      
      const result = await pg.query(query);
      
      return {
        configurations: result.rows,
        categories: this.categorizeConfigurations(result.rows),
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error getting platform configuration:', error);
      throw error;
    }
  }

  /**
   * Update platform configuration
   */
  async updatePlatformConfiguration(configId, updates) {
    try {
      const pg = getPostgreSQL();
      
      const query = `
        UPDATE platform_configurations
        SET config_value = $1,
            updated_at = NOW(),
            updated_by = $2
        WHERE id = $3
        RETURNING *
      `;
      
      const result = await pg.query(query, [updates.value, updates.updated_by, configId]);
      
      if (result.rows.length === 0) {
        throw new Error('Configuration not found');
      }
      
      logger.info(`Platform configuration ${configId} updated`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating platform configuration:', error);
      throw error;
    }
  }

  /**
   * AI-powered system optimization
   */
  async optimizeSystem(parameters) {
    try {
      const optimization = await this.aiGateway.optimize('system', parameters, {
        max_cpu: 80,
        max_memory: 85,
        target_performance: 90
      });
      
      // Apply optimization recommendations
      const applied = await this.applyOptimizations(optimization);
      
      return {
        original_parameters: parameters,
        optimization_recommendations: optimization,
        applied_changes: applied,
        performance_improvement: this.calculatePerformanceImprovement(parameters, optimization)
      };
    } catch (error) {
      logger.error('Error optimizing system:', error);
      throw error;
    }
  }

  /**
   * AI-powered system analysis
   */
  async analyzeSystemPerformance(data) {
    try {
      const analysis = await this.aiGateway.analyze('system', data, 'performance');
      
      return {
        analysis_result: analysis,
        performance_score: analysis.score,
        bottlenecks: analysis.bottlenecks || [],
        recommendations: analysis.recommendations || [],
        predicted_performance: analysis.forecast || {}
      };
    } catch (error) {
      logger.error('Error analyzing system performance:', error);
      throw error;
    }
  }

  /**
   * Get platform analytics
   */
  async getPlatformAnalytics(parameters) {
    try {
      const report = await this.analytics.generateReport('platform_overview', parameters);
      
      return {
        report_type: 'platform_overview',
        summary: report.summary,
        detailed_metrics: report.detailed_metrics,
        trends: report.trends,
        recommendations: report.recommendations,
        generated_at: report.generated_at
      };
    } catch (error) {
      logger.error('Error getting platform analytics:', error);
      throw error;
    }
  }

  /**
   * Start platform monitoring
   */
  async startPlatformMonitoring(config) {
    try {
      const monitor = await this.monitoring.startMonitoring('platform_core', {
        resource_type: 'platform',
        metrics: [
          { name: 'cpu_usage', type: 'cpu_usage' },
          { name: 'memory_usage', type: 'memory_usage' },
          { name: 'response_time', type: 'response_time' },
          { name: 'error_rate', type: 'error_rate' }
        ],
        alerts: [
          {
            type: 'threshold',
            metric: 'cpu_usage',
            operator: 'greater_than',
            threshold: 90
          },
          {
            type: 'threshold',
            metric: 'memory_usage',
            operator: 'greater_than',
            threshold: 85
          }
        ],
        interval: config.interval || 60000
      });
      
      logger.info('Platform monitoring started');
      return monitor;
    } catch (error) {
      logger.error('Error starting platform monitoring:', error);
      throw error;
    }
  }

  /**
   * Platform health check
   */
  async healthCheck() {
    try {
      const checks = {
        database: await this.checkDatabase(),
        redis: await this.checkRedis(),
        ai_gateway: await this.aiGateway.healthCheck(),
        analytics: await this.analytics.healthCheck(),
        monitoring: await this.monitoring.healthCheck()
      };
      
      const allHealthy = Object.values(checks).every(check => check.status === 'healthy');
      
      return {
        status: allHealthy ? 'healthy' : 'degraded',
        checks: checks,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Platform health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check database connection
   */
  async checkDatabase() {
    try {
      const pg = getPostgreSQL();
      await pg.query('SELECT 1');
      return { status: 'healthy', latency: Date.now() };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  /**
   * Check Redis connection
   */
  async checkRedis() {
    try {
      // Mock Redis check - implement actual Redis check
      return { status: 'healthy' };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  /**
   * Categorize configurations
   */
  categorizeConfigurations(configurations) {
    const categories = {};
    
    configurations.forEach(config => {
      if (!categories[config.category]) {
        categories[config.category] = [];
      }
      categories[config.category].push(config);
    });
    
    return categories;
  }

  /**
   * Apply optimization recommendations
   */
  async applyOptimizations(optimization) {
    // Mock implementation - would apply actual optimizations
    return {
      applied_count: optimization.recommendations?.length || 0,
      details: optimization.recommendations || []
    };
  }

  /**
   * Calculate performance improvement
   */
  calculatePerformanceImprovement(original, optimized) {
    // Mock implementation - would calculate actual improvement
    return {
      improvement_percentage: 15,
      areas_improved: ['cpu_usage', 'memory_usage', 'response_time']
    };
  }
}

module.exports = new PlatformCoreService();