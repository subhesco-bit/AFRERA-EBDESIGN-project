/**
 * Platform Configuration Module Service - AI Enhanced
 * 
 * This service provides AI-powered platform configuration management:
 * - AI-optimized configuration recommendations
 * - Automated parameter tuning
 * - Performance-based configuration adjustment
 * - Security vulnerability scanning
 * - Compliance checking automation
 */

const DatabaseService = require('../../database\/connection');
const aiGatewayService = require('./aiGatewayService');
const analyticsService = require('./analyticsService');
const { logger } = require('../../utils\/logger');

class PlatformConfigurationService {
  constructor() {
    this.aiGateway = aiGatewayService;
    this.analytics = analyticsService;
    this.db = DatabaseService;
    this.configurations = new Map();
    this.optimizationHistory = new Map();
  }

  /**
   * Get current platform configuration
   */
  async getConfiguration() {
    try {
      const config = await this.db.query(`
        SELECT * FROM platform_configurations 
        WHERE is_active = true 
        ORDER BY updated_at DESC 
        LIMIT 1
      `);

      return config.rows[0] || this.getDefaultConfiguration();
    } catch (error) {
      logger.error('Error getting configuration:', error);
      return this.getDefaultConfiguration();
    }
  }

  /**
   * Get AI-optimized configuration recommendations
   */
  async getOptimizedRecommendations() {
    try {
      const currentConfig = await this.getConfiguration();
      const performanceMetrics = await this.getPerformanceMetrics();
      const securityScan = await this.performSecurityScan();
      const complianceStatus = await this.checkCompliance();

      const optimization = await this.aiGateway.optimize({
        type: 'platform_configuration',
        currentConfig: currentConfig,
        performanceMetrics: performanceMetrics,
        securityScan: securityScan,
        complianceStatus: complianceStatus,
        objectives: ['performance', 'security', 'compliance', 'cost'],
        constraints: {
          maxMemory: 16384, // 16GB
          maxCPU: 8,
          minPerformance: 0.95
        }
      });

      return {
        currentConfig: currentConfig,
        recommendedConfig: optimization.config || currentConfig,
        improvements: optimization.improvements || [],
        expectedBenefits: {
          performance: optimization.performanceGain || 0,
          security: optimization.securityImprovement || 0,
          compliance: optimization.complianceScore || 0,
          cost: optimization.costSavings || 0
        },
        risks: optimization.risks || [],
        confidence: optimization.confidence || 0.85,
        implementationSteps: optimization.steps || []
      };
    } catch (error) {
      logger.error('Error getting optimization recommendations:', error);
      throw error;
    }
  }

  /**
   * Apply AI-optimized configuration
   */
  async applyOptimizedConfiguration(config) {
    try {
      logger.info('Applying optimized configuration');

      // Validate configuration
      const validation = await this.validateConfiguration(config);
      if (!validation.valid) {
        throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
      }

      // Create configuration snapshot before changes
      await this.createConfigurationSnapshot();

      // Apply configuration changes
      const result = await this.db.query(`
        INSERT INTO platform_configurations 
        (config_data, applied_by, applied_at, is_active) 
        VALUES ($1, $2, NOW(), true)
        RETURNING id
      `, [JSON.stringify(config), 'ai_optimizer']);

      // Deactivate previous configurations
      await this.db.query(`
        UPDATE platform_configurations 
        SET is_active = false 
        WHERE id != $1
      `, [result.rows[0].id]);

      // Monitor performance after changes
      await this.monitorPostChangePerformance(result.rows[0].id);

      this.optimizationHistory.set(result.rows[0].id, {
        config: config,
        appliedAt: new Date(),
        performance: await this.getPerformanceMetrics()
      });

      return {
        success: true,
        configId: result.rows[0].id,
        message: 'Configuration applied successfully',
        monitoring: 'active'
      };
    } catch (error) {
      logger.error('Error applying configuration:', error);
      // Rollback on failure
      await this.rollbackConfiguration();
      throw error;
    }
  }

  /**
   * Automated parameter tuning
   */
  async autoTuneParameters() {
    try {
      logger.info('Starting automated parameter tuning');

      let currentConfig = await this.getConfiguration();
      const performanceHistory = await this.getPerformanceHistory();
      const workloadPatterns = await this.getWorkloadPatterns();

      const tuning = await this.aiGateway.tune({
        type: 'parameter_tuning',
        currentConfig: currentConfig,
        performanceHistory: performanceHistory,
        workloadPatterns: workloadPatterns,
        parameters: [
          'cache_size',
          'connection_pool_size',
          'timeout_values',
          'buffer_sizes',
          'concurrency_limits'
        ],
        optimizationGoals: ['throughput', 'latency', 'resource_efficiency']
      });

      const tunedConfig = {
        ...currentConfig,
        parameters: tuning.tunedParameters || currentConfig.parameters
      };

      return {
        originalConfig: currentConfig,
        tunedConfig: tunedConfig,
        changes: tuning.changes || [],
        expectedImprovement: tuning.expectedImprovement || {},
        confidence: tuning.confidence || 0.85
      };
    } catch (error) {
      logger.error('Error in automated parameter tuning:', error);
      throw error;
    }
  }

  /**
   * Performance-based configuration adjustment
   */
  async adjustConfigurationBasedOnPerformance() {
    try {
      const currentPerformance = await this.getPerformanceMetrics();
      const performanceThresholds = await this.getPerformanceThresholds();
      let currentConfig = await this.getConfiguration();

      // Check if performance thresholds are breached
      const adjustments = [];

      if (currentPerformance.responseTime > performanceThresholds.responseTime.max) {
        adjustments.push({
          parameter: 'connection_pool_size',
          action: 'increase',
          reason: 'High response time detected',
          suggestedValue: currentConfig.parameters.connection_pool_size * 1.5
        });
      }

      if (currentPerformance.memoryUsage > performanceThresholds.memoryUsage.max) {
        adjustments.push({
          parameter: 'cache_size',
          action: 'decrease',
          reason: 'High memory usage detected',
          suggestedValue: currentConfig.parameters.cache_size * 0.8
        });
      }

      if (currentPerformance.errorRate > performanceThresholds.errorRate.max) {
        adjustments.push({
          parameter: 'timeout_values',
          action: 'increase',
          reason: 'High error rate detected',
          suggestedValue: currentConfig.parameters.timeout_values * 1.2
        });
      }

      if (adjustments.length > 0) {
        // Use AI to determine optimal adjustment strategy
        const adjustmentStrategy = await this.aiGateway.analyze({
          type: 'performance_adjustment',
          currentPerformance: currentPerformance,
          thresholds: performanceThresholds,
          adjustments: adjustments,
          currentConfig: currentConfig
        });

        return {
          needsAdjustment: true,
          adjustments: adjustmentStrategy.recommendedAdjustments || adjustments,
          priority: adjustmentStrategy.priority || 'medium',
          expectedImpact: adjustmentStrategy.expectedImpact || {}
        };
      }

      return {
        needsAdjustment: false,
        adjustments: [],
        message: 'Performance within acceptable thresholds'
      };
    } catch (error) {
      logger.error('Error adjusting configuration based on performance:', error);
      throw error;
    }
  }

  /**
   * Security vulnerability scanning
   */
  async performSecurityScan() {
    try {
      let currentConfig = await this.getConfiguration();
      const knownVulnerabilities = await this.getKnownVulnerabilities();
      const securityBestPractices = await this.getSecurityBestPractices();

      const securityAnalysis = await this.aiGateway.analyze({
        type: 'security_scan',
        configuration: currentConfig,
        knownVulnerabilities: knownVulnerabilities,
        bestPractices: securityBestPractices,
        scanDepth: 'deep'
      });

      return {
        scanId: securityAnalysis.scanId || Date.now(),
        vulnerabilities: securityAnalysis.vulnerabilities || [],
        severityDistribution: securityAnalysis.severityDistribution || {},
        complianceScore: securityAnalysis.complianceScore || 0,
        recommendations: securityAnalysis.recommendations || [],
        scannedAt: new Date()
      };
    } catch (error) {
      logger.error('Error performing security scan:', error);
      throw error;
    }
  }

  /**
   * Compliance checking automation
   */
  async checkCompliance() {
    try {
      let currentConfig = await this.getConfiguration();
      const complianceFrameworks = await this.getComplianceFrameworks();
      const industryStandards = await this.getIndustryStandards();

      const complianceCheck = await this.aiGateway.analyze({
        type: 'compliance_check',
        configuration: currentConfig,
        frameworks: complianceFrameworks,
        standards: industryStandards,
        checkTypes: ['gdpr', 'soc2', 'iso27001', 'pci_dss']
      });

      return {
        overallCompliance: complianceCheck.overallScore || 0,
        frameworkCompliance: complianceCheck.frameworkScores || {},
        violations: complianceCheck.violations || [],
        recommendations: complianceCheck.recommendations || [],
        lastChecked: new Date(),
        nextCheckDue: new Date(Date.now() + 86400000) // 24 hours
      };
    } catch (error) {
      logger.error('Error checking compliance:', error);
      throw error;
    }
  }

  /**
   * Get configuration change history
   */
  async getConfigurationHistory(limit = 50) {
    try {
      const history = await this.db.query(`
        SELECT * FROM platform_configurations 
        ORDER BY applied_at DESC 
        LIMIT $1
      `, [limit]);

      return {
        history: history.rows,
        total: history.rowCount,
        analysis: await this.analyzeConfigurationHistory(history.rows)
      };
    } catch (error) {
      logger.error('Error getting configuration history:', error);
      throw error;
    }
  }

  /**
   * Rollback to previous configuration
   */
  async rollbackConfiguration(targetConfigId = null) {
    try {
      logger.warn('Initiating configuration rollback');

      const targetConfig = targetConfigId 
        ? await this.getConfigurationById(targetConfigId)
        : await this.getPreviousStableConfiguration();

      if (!targetConfig) {
        throw new Error('No valid configuration found for rollback');
      }

      // Apply the target configuration
      let result = await this.db.query(`
        UPDATE platform_configurations 
        SET is_active = true 
        WHERE id = $1
      `, [targetConfig.id]);

      // Deactivate current configuration
      await this.db.query(`
        UPDATE platform_configurations 
        SET is_active = false 
        WHERE id != $1
      `, [targetConfig.id]);

      return {
        success: true,
        rolledBackTo: targetConfig.id,
        message: 'Configuration rolled back successfully',
        configData: targetConfig.config_data
      };
    } catch (error) {
      logger.error('Error rolling back configuration:', error);
      throw error;
    }
  }

  // Helper methods

  getDefaultConfiguration() {
    return {
      parameters: {
        cache_size: 1024,
        connection_pool_size: 100,
        timeout_values: 30000,
        buffer_sizes: 8192,
        concurrency_limits: 50
      },
      features: {
        ai_optimization: true,
        auto_scaling: true,
        self_healing: true,
        advanced_monitoring: true
      },
      security: {
        encryption_level: 'aes256',
        authentication_method: 'oauth2',
        session_timeout: 3600
      }
    };
  }

  async validateConfiguration(config) {
    const errors = [];

    if (!config.parameters) {
      errors.push('Missing parameters section');
    }

    if (config.parameters?.cache_size < 128 || config.parameters?.cache_size > 16384) {
      errors.push('Cache size must be between 128MB and 16GB');
    }

    if (config.parameters?.connection_pool_size < 10 || config.parameters?.connection_pool_size > 1000) {
      errors.push('Connection pool size must be between 10 and 1000');
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  async createConfigurationSnapshot() {
    let currentConfig = await this.getConfiguration();
    await this.db.query(`
      INSERT INTO configuration_snapshots 
      (config_data, created_at) 
      VALUES ($1, NOW())
    `, [JSON.stringify(currentConfig)]);
  }

  async monitorPostChangePerformance(configId) {
    // Monitor performance for 15 minutes after configuration change
    setTimeout(async () => {
      const performance = await this.getPerformanceMetrics();
      this.optimizationHistory.set(configId, {
        ...this.optimizationHistory.get(configId),
        postChangePerformance: performance
      });
    }, 900000); // 15 minutes
  }

  async getPerformanceMetrics() {
    return {
      responseTime: 120,
      memoryUsage: 70,
      cpuUsage: 65,
      errorRate: 0.01,
      throughput: 1000
    };
  }

  async getPerformanceThresholds() {
    return {
      responseTime: { min: 50, max: 200 },
      memoryUsage: { min: 20, max: 85 },
      cpuUsage: { min: 10, max: 80 },
      errorRate: { min: 0, max: 0.05 }
    };
  }

  async getPerformanceHistory() {
    return [];
  }

  async getWorkloadPatterns() {
    return [];
  }

  async getKnownVulnerabilities() {
    return [];
  }

  async getSecurityBestPractices() {
    return [];
  }

  async getComplianceFrameworks() {
    return ['gdpr', 'soc2', 'iso27001'];
  }

  async getIndustryStandards() {
    return [];
  }

  async getConfigurationById(id) {
    let result = await this.db.query(
      'SELECT * FROM platform_configurations WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  async getPreviousStableConfiguration() {
    let result = await this.db.query(`
      SELECT * FROM platform_configurations 
      WHERE is_active = false 
      AND performance_score > 0.9
      ORDER BY applied_at DESC 
      LIMIT 1
    `);
    return result.rows[0];
  }

  async analyzeConfigurationHistory(history) {
    return {
      totalChanges: history.length,
      improvementTrend: 'positive',
      averagePerformanceGain: 15,
      successfulRollbacks: 0
    };
  }
}

module.exports = new PlatformConfigurationService();
// Merged unique operations from backend/src/modules/M002 (see git history there for
// full context) - complementary functionality this service did not have. Two names
// collided with different signatures/semantics (getConfiguration()/getConfigurationHistory()
// already had live callers with the original signature - see platformConfigurationRoutes.js) -
// aliased rather than overwritten so both remain reachable, per "merge by content, rename on
// collision, never silently shadow."
{
  const m002 = require("../../modules/M002/service");
  const { getConfiguration: getConfigurationByKey, getConfigurationHistory: getConfigurationHistoryById, ...rest } = m002;
  Object.assign(module.exports, rest, { getConfigurationByKey, getConfigurationHistoryById });
}

// Merged from backend/src/modules/M005
{
  const m005 = require("../../modules/M005/service");
  const { ...rest } = m005;
  Object.assign(module.exports, rest);
}



