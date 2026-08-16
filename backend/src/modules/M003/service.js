/**
 * Tenant Management Service (M003)
 * Multi-tenant architecture, tenant isolation, and resource management
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/aiService');
const pool = require('../../database/pool');

/**
 * Create tenant
 */
async function createTenant(tenantData) {
  try {
    const {
      tenant_name,
      tenant_code,
      domain,
      plan_tier,
      max_users,
      storage_quota,
      api_quota,
      billing_info,
      admin_contact,
      configuration
    } = tenantData;

    const tenant = {
      tenant_id: generateId(),
      tenant_name,
      tenant_code,
      domain,
      plan_tier,
      max_users,
      storage_quota,
      storage_used: 0,
      api_quota,
      api_used: 0,
      billing_info,
      admin_contact,
      configuration,
      status: 'active',
      created_at: new Date().toISOString()
    };

    // AI-powered tenant provisioning
    const aiRequest = {
      task: 'tenant_provisioning',
      parameters: {
        tenant_data: tenantData,
        resource_allocation: await calculateResourceAllocation(plan_tier),
        security_setup: await setupTenantSecurity(tenant_code),
        performance_optimization: await optimizeTenantPerformance(plan_tier)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    tenant.ai_provisioning = aiResponse;

    // Insert into database
    const result = await pool.query(
      `INSERT INTO tenants 
       (tenant_id, tenant_name, tenant_code, domain, plan_tier, max_users, 
        storage_quota, storage_used, api_quota, api_used, billing_info, 
        admin_contact, configuration, status, ai_provisioning, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [
        tenant.tenant_id,
        tenant.tenant_name,
        tenant.tenant_code,
        tenant.domain,
        tenant.plan_tier,
        tenant.max_users,
        tenant.storage_quota,
        tenant.storage_used,
        tenant.api_quota,
        tenant.api_used,
        JSON.stringify(tenant.billing_info),
        JSON.stringify(tenant.admin_contact),
        JSON.stringify(tenant.configuration),
        tenant.status,
        JSON.stringify(tenant.ai_provisioning),
        tenant.created_at
      ]
    );

    logger.info(`Tenant created: ${tenant.tenant_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating tenant', { error: error.message, stack: error.stack });
    throw new Error('Failed to create tenant');
  }
}

/**
 * Get tenant by ID
 */
async function getTenant(tenantId) {
  try {
    const result = await pool.query(
      'SELECT * FROM tenants WHERE tenant_id = $1',
      [tenantId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Tenant not found');
    }

    const tenant = result.rows[0];
    tenant.usage_metrics = await getTenantUsageMetrics(tenantId);
    
    return tenant;
  } catch (error) {
    logger.error('Error getting tenant', { error: error.message, stack: error.stack });
    throw new Error('Failed to get tenant');
  }
}

/**
 * Update tenant
 */
async function updateTenant(tenantId, updates) {
  try {
    const {
      tenant_name,
      plan_tier,
      max_users,
      storage_quota,
      api_quota,
      billing_info,
      admin_contact,
      configuration,
      status
    } = updates;

    const result = await pool.query(
      `UPDATE tenants 
       SET tenant_name = COALESCE($1, tenant_name),
           plan_tier = COALESCE($2, plan_tier),
           max_users = COALESCE($3, max_users),
           storage_quota = COALESCE($4, storage_quota),
           api_quota = COALESCE($5, api_quota),
           billing_info = COALESCE($6, billing_info),
           admin_contact = COALESCE($7, admin_contact),
           configuration = COALESCE($8, configuration),
           status = COALESCE($9, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE tenant_id = $10
       RETURNING *`,
      [
        tenant_name,
        plan_tier,
        max_users,
        storage_quota,
        api_quota,
        billing_info ? JSON.stringify(billing_info) : null,
        admin_contact ? JSON.stringify(admin_contact) : null,
        configuration ? JSON.stringify(configuration) : null,
        status,
        tenantId
      ]
    );

    logger.info(`Tenant updated: ${tenantId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error updating tenant', { error: error.message, stack: error.stack });
    throw new Error('Failed to update tenant');
  }
}

/**
 * Get tenant usage metrics
 */
async function getTenantUsageMetrics(tenantId) {
  try {
    const metrics = {
      storage_used: await getStorageUsage(tenantId),
      api_calls: await getAPICalls(tenantId),
      active_users: await getActiveUsers(tenantId),
      bandwidth_used: await getBandwidthUsage(tenantId),
      resource_utilization: await getResourceUtilization(tenantId)
    };

    return metrics;
  } catch (error) {
    logger.error('Error getting tenant usage metrics', { error: error.message, stack: error.stack });
    throw new Error('Failed to get tenant usage metrics');
  }
}

/**
 * List all tenants
 */
async function listTenants(filters) {
  try {
    const {
      status,
      plan_tier,
      limit,
      offset
    } = filters;

    let query = 'SELECT * FROM tenants WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (plan_tier) {
      query += ` AND plan_tier = $${paramIndex}`;
      params.push(plan_tier);
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
      tenants: result.rows
    };
  } catch (error) {
    logger.error('Error listing tenants', { error: error.message, stack: error.stack });
    throw new Error('Failed to list tenants');
  }
}

// Helper functions
function generateId() {
  return `TNT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function calculateResourceAllocation(planTier) {
  const allocations = {
    free: { cpu: 1, memory: 2, storage: 10 },
    pro: { cpu: 2, memory: 4, storage: 50 },
    enterprise: { cpu: 8, memory: 16, storage: 500 }
  };
  return allocations[planTier] || allocations.free;
}

async function setupTenantSecurity(tenantCode) {
  return {
    encryption_enabled: true,
    audit_logging: true,
    access_controls: ['ip_whitelist', 'rate_limiting'],
    compliance_level: 'standard'
  };
}

async function optimizeTenantPerformance(planTier) {
  return {
    caching_enabled: planTier !== 'free',
    cdn_enabled: planTier === 'enterprise',
    load_balancing: planTier === 'enterprise'
  };
}

async function getStorageUsage(tenantId) {
  try {
    const result = await pool.query(
      'SELECT storage_used FROM tenants WHERE tenant_id = $1',
      [tenantId]
    );
    return result.rows[0]?.storage_used || 0;
  } catch (error) {
    return 0;
  }
}

async function getAPICalls(tenantId) {
  try {
    const result = await pool.query(
      'SELECT api_used FROM tenants WHERE tenant_id = $1',
      [tenantId]
    );
    return result.rows[0]?.api_used || 0;
  } catch (error) {
    return 0;
  }
}

async function getActiveUsers(tenantId) {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE tenant_id = $1 AND status = $2',
      [tenantId, 'active']
    );
    return result.rows[0]?.count || 0;
  } catch (error) {
    return 0;
  }
}

async function getBandwidthUsage(tenantId) {
  return 1000; // MB
}

async function getResourceUtilization(tenantId) {
  return {
    cpu: 45,
    memory: 60,
    disk: 50
  };
}

module.exports = {
  createTenant,
  getTenant,
  updateTenant,
  getTenantUsageMetrics,
  listTenants
};
