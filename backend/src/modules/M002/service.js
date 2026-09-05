/**
 * Platform Configuration Service (M002)
 * Dynamic configuration management, feature flags, and settings
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/legacy/aiService');
const pool = require('../../database/pool');

/**
 * Create configuration
 */
async function createConfiguration(configData) {
  try {
    const {
      config_key,
      config_value,
      config_type,
      environment,
      description,
      encrypted,
      validation_rules
    } = configData;

    const config = {
      config_id: generateId(),
      config_key,
      config_value,
      config_type,
      environment,
      description,
      encrypted: encrypted || false,
      validation_rules,
      status: 'active',
      created_at: new Date().toISOString()
    };

    // AI-powered configuration validation
    const aiRequest = {
      task: 'configuration_validation',
      parameters: {
        config_data: configData,
        security_risks: await assessSecurityRisks(configData),
        best_practices: await getConfigurationBestPractices(config_type),
        dependency_impact: await assessDependencyImpact(config_key)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    config.ai_validation = aiResponse;

    // Insert into database
    const result = await pool.query(
      `INSERT INTO platform_configurations 
       (config_id, config_key, config_value, config_type, environment, 
        description, encrypted, validation_rules, status, ai_validation, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        config.config_id,
        config.config_key,
        config.config_value,
        config.config_type,
        config.environment,
        config.description,
        config.encrypted,
        JSON.stringify(config.validation_rules),
        config.status,
        JSON.stringify(config.ai_validation),
        config.created_at
      ]
    );

    logger.info(`Configuration created: ${config.config_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating configuration', { error: error.message, stack: error.stack });
    throw new Error('Failed to create configuration');
  }
}

/**
 * Get configuration by key
 */
async function getConfiguration(configKey, environment) {
  try {
    let result = await pool.query(
      'SELECT * FROM platform_configurations WHERE config_key = $1 AND environment = $2 AND status = $3',
      [configKey, environment, 'active']
    );
    
    if (result.rows.length === 0) {
      throw new Error('Configuration not found');
    }

    let config = result.rows[0];
    
    // Decrypt if encrypted
    if (config.encrypted) {
      config.config_value = await decryptValue(config.config_value);
    }

    return config;
  } catch (error) {
    logger.error('Error getting configuration', { error: error.message, stack: error.stack });
    throw new Error('Failed to get configuration');
  }
}

/**
 * Update configuration
 */
async function updateConfiguration(configId, updates) {
  try {
    const {
      config_value,
      description,
      validation_rules,
      status
    } = updates;

    // AI-powered update validation
    let aiRequest = {
      task: 'configuration_update_validation',
      parameters: {
        config_id: configId,
        updates: updates,
        current_config: await getConfigurationById(configId),
        impact_analysis: await assessUpdateImpact(configId, updates)
      }
    };

    let aiResponse = await aiAPI.generateRecommendation(aiRequest);

    let result = await pool.query(
      `UPDATE platform_configurations 
       SET config_value = COALESCE($1, config_value),
           description = COALESCE($2, description),
           validation_rules = COALESCE($3, validation_rules),
           status = COALESCE($4, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE config_id = $5
       RETURNING *`,
      [
        config_value,
        description,
        validation_rules ? JSON.stringify(validation_rules) : null,
        status,
        configId
      ]
    );

    logger.info(`Configuration updated: ${configId}`);
    return { ...result.rows[0], validation_result: aiResponse };
  } catch (error) {
    logger.error('Error updating configuration', { error: error.message, stack: error.stack });
    throw new Error('Failed to update configuration');
  }
}

/**
 * Bulk update configurations
 */
async function bulkUpdateConfigurations(updates) {
  try {
    const results = [];
    
    for (const update of updates) {
      try {
        let result = await updateConfiguration(update.config_id, update);
        results.push({ success: true, config_id: update.config_id, data: result });
      } catch (error) {
        results.push({ success: false, config_id: update.config_id, error: error.message });
      }
    }

    return {
      total: updates.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  } catch (error) {
    logger.error('Error bulk updating configurations', { error: error.message, stack: error.stack });
    throw new Error('Failed to bulk update configurations');
  }
}

/**
 * Get configuration history
 */
async function getConfigurationHistory(configId) {
  try {
    const history = await pool.query(
      `SELECT * FROM configuration_history 
       WHERE config_id = $1 
       ORDER BY changed_at DESC`,
      [configId]
    );

    return {
      config_id: configId,
      total_changes: history.rows.length,
      changes: history.rows
    };
  } catch (error) {
    logger.error('Error getting configuration history', { error: error.message, stack: error.stack });
    throw new Error('Failed to get configuration history');
  }
}

// Helper functions
function generateId() {
  return `CFG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function assessSecurityRisks(configData) {
  const risks = [];
  
  if (configData.encrypted === false && configData.config_type === 'sensitive') {
    risks.push({ type: 'unencrypted_sensitive_data', severity: 'high' });
  }
  
  if (configData.config_key.includes('password') || configData.config_key.includes('secret')) {
    risks.push({ type: 'credential_storage', severity: 'medium' });
  }
  
  return risks;
}

async function getConfigurationBestPractices(configType) {
  const practices = {
    database: ['use_connection_pooling', 'enable_ssl', 'implement_retry_logic'],
    api: ['implement_rate_limiting', 'enable_caching', 'use_circuit_breaker'],
    security: ['enable_encryption', 'implement_audit_logging', 'use_least_privilege']
  };
  return practices[configType] || [];
}

async function assessDependencyImpact(configKey) {
  return {
    dependent_services: ['api_gateway', 'auth_service'],
    impact_level: 'medium',
    restart_required: false
  };
}

async function decryptValue(encryptedValue) {
  // In production, use actual decryption
  return encryptedValue;
}

async function getConfigurationById(configId) {
  try {
    let result = await pool.query(
      'SELECT * FROM platform_configurations WHERE config_id = $1',
      [configId]
    );
    return result.rows[0] || {};
  } catch (error) {
    return {};
  }
}

async function assessUpdateImpact(configId, updates) {
  return {
    user_impact: 'low',
    service_impact: 'medium',
    downtime_required: false,
    rollback_needed: true
  };
}

module.exports = {
  createConfiguration,
  getConfiguration,
  updateConfiguration,
  bulkUpdateConfigurations,
  getConfigurationHistory
};
