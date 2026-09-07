/**
 * Environment Management Service (M005)
 * Environment configuration, staging, and deployment management
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/legacy/aiService');
const pool = require('../../database/pool');

/**
 * Create environment
 */
async function createEnvironment(envData) {
  try {
    const {
      env_name,
      env_type,
      deployment_strategy,
      infrastructure_config,
      database_config,
      security_config,
      monitoring_config
    } = envData;

    const env = {
      env_id: generateId(),
      env_name,
      env_type,
      deployment_strategy,
      infrastructure_config,
      database_config,
      security_config,
      monitoring_config,
      status: 'active',
      created_at: new Date().toISOString()
    };

    // AI-powered environment setup
    const aiRequest = {
      task: 'environment_setup',
      parameters: {
        env_data: envData,
        best_practices: await getEnvironmentBestPractices(env_type),
        resource_requirements: await calculateResourceRequirements(env_type),
        security_configurations: await getSecurityConfigurations(env_type)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    env.ai_setup = aiResponse;

    const result = await pool.query(
      `INSERT INTO environments 
       (env_id, env_name, env_type, deployment_strategy, infrastructure_config, 
        database_config, security_config, monitoring_config, status, ai_setup, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        env.env_id,
        env.env_name,
        env.env_type,
        env.deployment_strategy,
        JSON.stringify(env.infrastructure_config),
        JSON.stringify(env.database_config),
        JSON.stringify(env.security_config),
        JSON.stringify(env.monitoring_config),
        env.status,
        JSON.stringify(env.ai_setup),
        env.created_at
      ]
    );

    logger.info(`Environment created: ${env.env_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating environment', { error: error.message, stack: error.stack });
    throw new Error('Failed to create environment');
  }
}

/**
 * Get environment by ID
 */
async function getEnvironment(envId) {
  try {
    const result = await pool.query(
      'SELECT * FROM environments WHERE env_id = $1',
      [envId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Environment not found');
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Error getting environment', { error: error.message, stack: error.stack });
    throw new Error('Failed to get environment');
  }
}

/**
 * Update environment
 */
async function updateEnvironment(envId, updates) {
  try {
    const result = await pool.query(
      `UPDATE environments 
       SET infrastructure_config = COALESCE($1, infrastructure_config),
           database_config = COALESCE($2, database_config),
           security_config = COALESCE($3, security_config),
           monitoring_config = COALESCE($4, monitoring_config),
           status = COALESCE($5, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE env_id = $6
       RETURNING *`,
      [
        updates.infrastructure_config ? JSON.stringify(updates.infrastructure_config) : null,
        updates.database_config ? JSON.stringify(updates.database_config) : null,
        updates.security_config ? JSON.stringify(updates.security_config) : null,
        updates.monitoring_config ? JSON.stringify(updates.monitoring_config) : null,
        updates.status,
        envId
      ]
    );

    logger.info(`Environment updated: ${envId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error updating environment', { error: error.message, stack: error.stack });
    throw new Error('Failed to update environment');
  }
}

/**
 * List environments
 */
async function listEnvironments(filters) {
  try {
    const { env_type, status, limit, offset } = filters;
    
    let query = 'SELECT * FROM environments WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (env_type) {
      query += ` AND env_type = $${paramIndex}`;
      params.push(env_type);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    if (limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(limit);
      paramIndex++;
    }

    if (offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(offset);
    }

    const result = await pool.query(query, params);

    return {
      total: result.rows.length,
      environments: result.rows
    };
  } catch (error) {
    logger.error('Error listing environments', { error: error.message, stack: error.stack });
    throw new Error('Failed to list environments');
  }
}

function generateId() {
  return `ENV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function getEnvironmentBestPractices(envType) {
  return {
    development: ['feature_flags', 'mock_services', 'fast_feedback'],
    staging: ['integration_testing', 'performance_testing', 'security_scanning'],
    production: ['high_availability', 'disaster_recovery', 'compliance_logging']
  };
}

async function calculateResourceRequirements(envType) {
  const requirements = {
    development: { cpu: 2, memory: 4, storage: 50 },
    staging: { cpu: 4, memory: 8, storage: 100 },
    production: { cpu: 8, memory: 16, storage: 500 }
  };
  return requirements[envType] || requirements.development;
}

async function getSecurityConfigurations(envType) {
  return {
    ssl_enabled: envType !== 'development',
    firewall_rules: envType === 'production' ? 'strict' : 'basic',
    audit_logging: envType === 'production',
    encryption_level: envType === 'production' ? 'aes256' : 'aes128'
  };
}

module.exports = {
  createEnvironment,
  getEnvironment,
  updateEnvironment,
  listEnvironments
};
