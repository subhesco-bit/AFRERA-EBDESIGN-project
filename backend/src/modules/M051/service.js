/**
 * FPO Registration Service (M051)
 * Farmer Producer Organization registration and management with AI-powered recommendations
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/aiService');
const pool = require('../../database/pool');

/**
 * Create FPO with AI-powered optimization
 */
async function createFPO(fpoData) {
  try {
    const {
      name,
      registration_number,
      village_id,
      district_id,
      state_id,
      address,
      contact_person,
      phone,
      email,
      fpo_type,
      formation_date,
      membership_count,
      share_capital,
      business_activities,
      metadata
    } = fpoData;

    const fpo = {
      fpo_id: generateId(),
      name,
      registration_number,
      village_id,
      district_id,
      state_id,
      address,
      contact_person,
      phone,
      email,
      fpo_type,
      formation_date,
      membership_count,
      share_capital,
      business_activities,
      status: 'active',
      created_at: new Date().toISOString()
    };

    // AI-powered FPO optimization recommendations
    const aiRequest = {
      task: 'fpo_optimization',
      parameters: {
        fpo_data: fpoData,
        regional_analysis: await getRegionalAnalysis(district_id, state_id),
        market_opportunities: await getMarketOpportunities(fpo_type),
        best_practices: await getFPOBestPractices(fpo_type),
        governance_recommendations: await getGovernanceRecommendations(membership_count)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    fpo.ai_recommendations = aiResponse;

    // Insert into database
    const result = await pool.query(
      `INSERT INTO fpos 
       (fpo_id, name, registration_number, village_id, district_id, state_id, 
        address, contact_person, phone, email, fpo_type, formation_date, 
        membership_count, share_capital, business_activities, status, 
        ai_recommendations, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       RETURNING *`,
      [
        fpo.fpo_id,
        fpo.name,
        fpo.registration_number,
        fpo.village_id,
        fpo.district_id,
        fpo.state_id,
        fpo.address,
        fpo.contact_person,
        fpo.phone,
        fpo.email,
        fpo.fpo_type,
        fpo.formation_date,
        fpo.membership_count,
        fpo.share_capital,
        JSON.stringify(fpo.business_activities || []),
        fpo.status,
        JSON.stringify(fpo.ai_recommendations),
        JSON.stringify(metadata || {}),
        fpo.created_at
      ]
    );

    logger.info(`FPO created: ${fpo.fpo_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating FPO', { error: error.message, stack: error.stack });
    throw new Error('Failed to create FPO');
  }
}

/**
 * List FPOs with filtering
 */
async function listFPOs({ page = 1, limit = 20, status = null, districtId = null, stateId = null } = {}) {
  try {
    const offset = (page - 1) * limit;
    
    let countQuery = 'SELECT COUNT(*) FROM fpos';
    let countParams = [];
    let conditions = [];
    
    if (status) {
      conditions.push('status = $' + (conditions.length + 1));
      countParams.push(status);
    }
    if (districtId) {
      conditions.push('district_id = $' + (conditions.length + 1));
      countParams.push(districtId);
    }
    if (stateId) {
      conditions.push('state_id = $' + (conditions.length + 1));
      countParams.push(stateId);
    }
    
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    const totalRes = await pool.query(countQuery, countParams);
    const total = parseInt(totalRes.rows[0].count || '0');
    
    let dataQuery = 'SELECT * FROM fpos';
    let dataParams = [...countParams];
    
    if (conditions.length > 0) {
      dataQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    dataQuery += ' ORDER BY created_at DESC LIMIT $' + (dataParams.length + 1) + ' OFFSET $' + (dataParams.length + 2);
    dataParams.push(limit, offset);
    
    const res = await pool.query(dataQuery, dataParams);
    return { items: res.rows, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } };
  } catch (error) {
    logger.error('Error listing FPOs', { error: error.message });
    throw new Error('Failed to list FPOs');
  }
}

/**
 * Get FPO by ID
 */
async function getFPO(fpoId) {
  try {
    const res = await pool.query('SELECT * FROM fpos WHERE fpo_id = $1', [fpoId]);
    return res.rows[0] || null;
  } catch (error) {
    logger.error('Error getting FPO', { error: error.message });
    throw new Error('Failed to get FPO');
  }
}

/**
 * Update FPO
 */
async function updateFPO(fpoId, updates) {
  try {
    const {
      name,
      registration_number,
      village_id,
      district_id,
      state_id,
      address,
      contact_person,
      phone,
      email,
      fpo_type,
      formation_date,
      membership_count,
      share_capital,
      business_activities,
      status,
      metadata
    } = updates;

    const result = await pool.query(
      `UPDATE fpos 
       SET name = COALESCE($1, name),
           registration_number = COALESCE($2, registration_number),
           village_id = COALESCE($3, village_id),
           district_id = COALESCE($4, district_id),
           state_id = COALESCE($5, state_id),
           address = COALESCE($6, address),
           contact_person = COALESCE($7, contact_person),
           phone = COALESCE($8, phone),
           email = COALESCE($9, email),
           fpo_type = COALESCE($10, fpo_type),
           formation_date = COALESCE($11, formation_date),
           membership_count = COALESCE($12, membership_count),
           share_capital = COALESCE($13, share_capital),
           business_activities = COALESCE($14, business_activities::jsonb),
           status = COALESCE($15, status),
           metadata = COALESCE($16, metadata::jsonb),
           updated_at = NOW()
       WHERE fpo_id = $17
       RETURNING *`,
      [
        name, registration_number, village_id, district_id, state_id,
        address, contact_person, phone, email, fpo_type, formation_date,
        membership_count, share_capital,
        business_activities ? JSON.stringify(business_activities) : null,
        status,
        metadata ? JSON.stringify(metadata) : null,
        fpoId
      ]
    );
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error updating FPO', { error: error.message });
    throw new Error('Failed to update FPO');
  }
}

/**
 * Delete FPO
 */
async function deleteFPO(fpoId) {
  try {
    const res = await pool.query('DELETE FROM fpos WHERE fpo_id = $1 RETURNING fpo_id', [fpoId]);
    return !!res.rows[0];
  } catch (error) {
    logger.error('Error deleting FPO', { error: error.message });
    throw new Error('Failed to delete FPO');
  }
}

/**
 * Add FPO member
 */
async function addFPOMember(fpoId, farmerId, memberDetails) {
  try {
    const res = await pool.query(
      `INSERT INTO fpo_memberships (membership_id, fpo_id, farmer_id, membership_date, shareholding, role, metadata) 
       VALUES ($1, $2, $3, NOW(), $4, $5, $6) RETURNING *`,
      [generateId(), fpoId, farmerId, memberDetails.shareholding || 0, memberDetails.role || 'MEMBER', JSON.stringify(memberDetails.metadata || {})]
    );
    
    // Update FPO membership count
    await pool.query('UPDATE fpos SET membership_count = membership_count + 1 WHERE fpo_id = $1', [fpoId]);
    
    return res.rows[0];
  } catch (error) {
    logger.error('Error adding FPO member', { error: error.message });
    throw new Error('Failed to add FPO member');
  }
}

/**
 * Get FPO members
 */
async function getFPOMembers(fpoId) {
  try {
    const res = await pool.query(
      `SELECT fm.*, f.name as farmer_name, f.contact_number 
       FROM fpo_memberships fm 
       JOIN farmers f ON fm.farmer_id = f.id 
       WHERE fm.fpo_id = $1 ORDER BY fm.membership_date DESC`,
      [fpoId]
    );
    
    return {
      fpoId,
      members: res.rows,
      totalMembers: res.rows.length,
      totalShareholding: res.rows.reduce((sum, member) => sum + parseFloat(member.shareholding || 0), 0)
    };
  } catch (error) {
    logger.error('Error getting FPO members', { error: error.message });
    throw new Error('Failed to get FPO members');
  }
}

/**
 * Get FPO financial summary
 */
async function getFPOFinancialSummary(fpoId) {
  try {
    const res = await pool.query(
      `SELECT 
        fpo_id,
        SUM(CASE WHEN transaction_type = 'CREDIT' THEN amount ELSE 0 END) as total_credits,
        SUM(CASE WHEN transaction_type = 'DEBIT' THEN amount ELSE 0 END) as total_debits,
        COUNT(*) as total_transactions
       FROM fpo_financial_transactions 
       WHERE fpo_id = $1 
       GROUP BY fpo_id`,
      [fpoId]
    );
    
    const financialData = res.rows[0] || { total_credits: 0, total_debits: 0, total_transactions: 0 };
    
    return {
      fpoId,
      ...financialData,
      netBalance: parseFloat(financialData.total_credits || 0) - parseFloat(financialData.total_debits || 0)
    };
  } catch (error) {
    logger.error('Error getting FPO financial summary', { error: error.message });
    throw new Error('Failed to get FPO financial summary');
  }
}

/**
 * Record FPO transaction
 */
async function recordFPOTransaction(fpoId, transactionDetails) {
  try {
    const { transactionType, amount, description, category, referenceId, metadata } = transactionDetails;
    
    const res = await pool.query(
      `INSERT INTO fpo_financial_transactions (transaction_id, fpo_id, transaction_type, amount, description, category, reference_id, metadata, transaction_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *`,
      [generateId(), fpoId, transactionType, amount, description, category, referenceId, JSON.stringify(metadata || {})]
    );
    
    return res.rows[0];
  } catch (error) {
    logger.error('Error recording FPO transaction', { error: error.message });
    throw new Error('Failed to record FPO transaction');
  }
}

/**
 * Generate AI-powered FPO performance report
 */
async function generateFPOPerformanceReport(fpoId) {
  try {
    const fpo = await getFPO(fpoId);
    const financialSummary = await getFPOFinancialSummary(fpoId);
    const members = await getFPOMembers(fpoId);

    const aiRequest = {
      task: 'fpo_performance_analysis',
      parameters: {
        fpo_data: fpo,
        financial_data: financialSummary,
        membership_data: members,
        regional_benchmarks: await getRegionalBenchmarks(fpo.district_id, fpo.state_id),
        industry_standards: await getIndustryStandards(fpo.fpo_type)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);

    const report = {
      report_id: generateId(),
      fpo_id: fpoId,
      generated_at: new Date().toISOString(),
      fpo_summary: fpo,
      financial_summary: financialSummary,
      membership_summary: members,
      performance_metrics: aiResponse.performance_metrics,
      recommendations: aiResponse.recommendations,
      benchmark_comparison: aiResponse.benchmark_comparison,
      growth_opportunities: aiResponse.growth_opportunities
    };

    return report;
  } catch (error) {
    logger.error('Error generating FPO performance report', { error: error.message });
    throw new Error('Failed to generate FPO performance report');
  }
}

// Helper functions
function generateId() {
  return `FPO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function getRegionalAnalysis(districtId, stateId) {
  return {
    crop_suitability: ['wheat', 'rice', 'vegetables'],
    market_access: 'moderate',
    infrastructure_quality: 'good',
    labor_availability: 'high'
  };
}

async function getMarketOpportunities(fpoType) {
  return [
    'Direct to consumer sales',
    'Value-added processing',
    'Contract farming',
    'Export markets'
  ];
}

async function getFPOBestPractices(fpoType) {
  return [
    'Implement democratic governance',
    'Maintain transparent financial records',
    'Regular member training programs',
    'Quality standard certification'
  ];
}

async function getGovernanceRecommendations(membershipCount) {
  if (membershipCount < 50) {
    return {
      board_size: 5,
      committee_structure: ['executive', 'finance', 'operations'],
      meeting_frequency: 'monthly'
    };
  } else {
    return {
      board_size: 7,
      committee_structure: ['executive', 'finance', 'operations', 'audit', 'grievance'],
      meeting_frequency: 'bi-weekly'
    };
  }
}

async function getRegionalBenchmarks(districtId, stateId) {
  return {
    average_membership: 150,
    average_share_capital: 500000,
    average_revenue: 2000000,
    success_rate: 0.75
  };
}

async function getIndustryStandards(fpoType) {
  return {
    governance_score: 80,
    financial_health_score: 75,
    operational_efficiency_score: 70,
    market_penetration_score: 65
  };
}

module.exports = {
  createFPO,
  listFPOs,
  getFPO,
  updateFPO,
  deleteFPO,
  addFPOMember,
  getFPOMembers,
  getFPOFinancialSummary,
  recordFPOTransaction,
  generateFPOPerformanceReport
};
