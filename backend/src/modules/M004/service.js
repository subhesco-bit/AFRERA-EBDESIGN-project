/**
 * Organization Management Service (M004)
 * Organization structure, hierarchy, and management
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/legacy/aiService');
const pool = require('../../database/pool');

/**
 * Create organization
 */
async function createOrganization(orgData) {
  try {
    const {
      org_name,
      org_code,
      org_type,
      industry,
      size,
      headquarters,
      parent_org_id,
      configuration
    } = orgData;

    const org = {
      org_id: generateId(),
      org_name,
      org_code,
      org_type,
      industry,
      size,
      headquarters,
      parent_org_id,
      configuration,
      status: 'active',
      created_at: new Date().toISOString()
    };

    // AI-powered organization setup
    const aiRequest = {
      task: 'organization_setup',
      parameters: {
        org_data: orgData,
        industry_best_practices: await getIndustryBestPractices(industry),
        organizational_structure: await recommendOrgStructure(size, org_type),
        compliance_requirements: await getComplianceRequirements(industry)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    org.ai_setup = aiResponse;

    const result = await pool.query(
      `INSERT INTO organizations 
       (org_id, org_name, org_code, org_type, industry, size, headquarters, 
        parent_org_id, configuration, status, ai_setup, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        org.org_id,
        org.org_name,
        org.org_code,
        org.org_type,
        org.industry,
        org.size,
        org.headquarters,
        org.parent_org_id,
        JSON.stringify(org.configuration),
        org.status,
        JSON.stringify(org.ai_setup),
        org.created_at
      ]
    );

    logger.info(`Organization created: ${org.org_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating organization', { error: error.message, stack: error.stack });
    throw new Error('Failed to create organization');
  }
}

/**
 * Get organization by ID
 */
async function getOrganization(orgId) {
  try {
    let result = await pool.query(
      'SELECT * FROM organizations WHERE org_id = $1',
      [orgId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Organization not found');
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Error getting organization', { error: error.message, stack: error.stack });
    throw new Error('Failed to get organization');
  }
}

/**
 * Update organization
 */
async function updateOrganization(orgId, updates) {
  try {
    let result = await pool.query(
      `UPDATE organizations 
       SET org_name = COALESCE($1, org_name),
           org_type = COALESCE($2, org_type),
           size = COALESCE($3, size),
           configuration = COALESCE($4, configuration),
           updated_at = CURRENT_TIMESTAMP
       WHERE org_id = $5
       RETURNING *`,
      [
        updates.org_name,
        updates.org_type,
        updates.size,
        updates.configuration ? JSON.stringify(updates.configuration) : null,
        orgId
      ]
    );

    logger.info(`Organization updated: ${orgId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error updating organization', { error: error.message, stack: error.stack });
    throw new Error('Failed to update organization');
  }
}

/**
 * List organizations
 */
async function listOrganizations(filters) {
  try {
    const { org_type, industry, limit, offset } = filters;
    
    let query = 'SELECT * FROM organizations WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (org_type) {
      query += ` AND org_type = $${paramIndex}`;
      params.push(org_type);
      paramIndex++;
    }

    if (industry) {
      query += ` AND industry = $${paramIndex}`;
      params.push(industry);
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

    let result = await pool.query(query, params);

    return {
      total: result.rows.length,
      organizations: result.rows
    };
  } catch (error) {
    logger.error('Error listing organizations', { error: error.message, stack: error.stack });
    throw new Error('Failed to list organizations');
  }
}

function generateId() {
  return `ORG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function getIndustryBestPractices(industry) {
  return {
    agriculture: ['crop_management', 'weather_integration', 'market_pricing'],
    manufacturing: ['inventory_management', 'quality_control', 'supply_chain'],
    services: ['customer_crm', 'project_management', 'resource_allocation']
  };
}

async function recommendOrgStructure(size, orgType) {
  const structures = {
    small: ['ceo', 'operations', 'finance'],
    medium: ['ceo', 'c_suite', 'departments', 'teams'],
    large: ['ceo', 'board', 'executive_committee', 'divisions', 'departments', 'teams']
  };
  return structures[size] || structures.medium;
}

async function getComplianceRequirements(industry) {
  return {
    reporting: ['financial', 'operational', 'environmental'],
    certifications: ['iso_9001', 'industry_specific'],
    audits: ['annual', 'random']
  };
}

module.exports = {
  createOrganization,
  getOrganization,
  updateOrganization,
  listOrganizations
};
