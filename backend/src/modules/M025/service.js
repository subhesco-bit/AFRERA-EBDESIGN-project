/**
 * Farmer Subsidies Service (M025)
 * Government subsidy management with AI-powered eligibility prediction
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/aiService');
const pool = require('../../database/pool');

async function createSubsidyScheme(schemeData) {
  try {
    const {
      scheme_name,
      scheme_code,
      category,
      description,
      eligibility_criteria,
      subsidy_percentage,
      max_amount,
      min_land_size,
      max_land_size,
      target_crops,
      application_period_start,
      application_period_end,
      required_documents
    } = schemeData;

    const scheme = {
      scheme_id: generateId(),
      scheme_name,
      scheme_code,
      category,
      description,
      eligibility_criteria: eligibility_criteria || {},
      subsidy_percentage,
      max_amount,
      min_land_size,
      max_land_size,
      target_crops: target_crops || [],
      application_period_start,
      application_period_end,
      required_documents: required_documents || [],
      status: 'active',
      created_at: new Date().toISOString()
    };

    const result = await pool.query(
      `INSERT INTO subsidy_schemes 
       (scheme_id, scheme_name, scheme_code, category, description, eligibility_criteria, 
        subsidy_percentage, max_amount, min_land_size, max_land_size, target_crops, 
        application_period_start, application_period_end, required_documents, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        scheme.scheme_id, scheme.scheme_name, scheme.scheme_code, scheme.category,
        scheme.description, JSON.stringify(scheme.eligibility_criteria), scheme.subsidy_percentage,
        scheme.max_amount, scheme.min_land_size, scheme.max_land_size,
        JSON.stringify(scheme.target_crops), scheme.application_period_start,
        scheme.application_period_end, JSON.stringify(scheme.required_documents),
        scheme.status, scheme.created_at
      ]
    );

    logger.info(`Subsidy scheme created: ${scheme.scheme_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating subsidy scheme', { error: error.message, stack: error.stack });
    throw new Error('Failed to create subsidy scheme');
  }
}

async function applyForSubsidy(schemeId, farmerId, applicationData) {
  try {
    const { land_area, crops_grown, documents_submitted } = applicationData;

    // AI-powered eligibility prediction
    const aiRequest = {
      task: 'subsidy_eligibility_prediction',
      parameters: {
        scheme_id: schemeId,
        farmer_id: farmerId,
        farmer_profile: await getFarmerProfile(farmerId),
        scheme_criteria: await getSchemeCriteria(schemeId),
        land_data: applicationData,
        historical_approvals: await getHistoricalApprovals(schemeId)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);

    const application = {
      application_id: generateId(),
      scheme_id: schemeId,
      farmer_id: farmerId,
      application_date: new Date().toISOString().split('T')[0],
      application_status: 'pending',
      land_area,
      crops_grown: crops_grown || [],
      estimated_subsidy: await calculateEstimatedSubsidy(schemeId, land_area),
      documents_submitted: documents_submitted || [],
      verification_status: 'pending',
      ai_eligibility_score: aiResponse.eligibility_score,
      created_at: new Date().toISOString()
    };

    const result = await pool.query(
      `INSERT INTO subsidy_applications 
       (application_id, scheme_id, farmer_id, application_date, application_status, 
        land_area, crops_grown, estimated_subsidy, documents_submitted, verification_status, 
        ai_eligibility_score, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        application.application_id, application.scheme_id, application.farmer_id,
        application.application_date, application.application_status, application.land_area,
        JSON.stringify(application.crops_grown), application.estimated_subsidy,
        JSON.stringify(application.documents_submitted), application.verification_status,
        application.ai_eligibility_score, application.created_at
      ]
    );

    logger.info(`Subsidy application created: ${application.application_id}`);
    return { ...result.rows[0], ai_analysis: aiResponse };
  } catch (error) {
    logger.error('Error applying for subsidy', { error: error.message, stack: error.stack });
    throw new Error('Failed to apply for subsidy');
  }
}

async function getRecommendedSubsidies(farmerId) {
  try {
    const farmerProfile = await getFarmerProfile(farmerId);
    const farmerLand = await getFarmerLand(farmerId);

    const aiRequest = {
      task: 'subsidy_recommendation',
      parameters: {
        farmer_profile: farmerProfile,
        farmer_land: farmerLand,
        available_schemes: await getActiveSchemes(),
        eligibility_match: await assessEligibilityMatch(farmerId)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);

    return {
      farmer_id: farmerId,
      recommendations: aiResponse.recommendations || [],
      eligibility_scores: aiResponse.eligibility_scores || {},
      application_priority: aiResponse.priority || []
    };
  } catch (error) {
    logger.error('Error getting recommended subsidies', { error: error.message, stack: error.stack });
    throw new Error('Failed to get recommended subsidies');
  }
}

function generateId() {
  return `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function getFarmerProfile(farmerId) {
  try {
    const result = await pool.query('SELECT * FROM farmer_profiles WHERE farmer_id = $1', [farmerId]);
    return result.rows[0] || {};
  } catch (error) {
    return {};
  }
}

async function getSchemeCriteria(schemeId) {
  try {
    const result = await pool.query('SELECT * FROM subsidy_schemes WHERE scheme_id = $1', [schemeId]);
    return result.rows[0] || {};
  } catch (error) {
    return {};
  }
}

async function getHistoricalApprovals(schemeId) {
  try {
    const result = await pool.query(
      'SELECT * FROM subsidy_applications WHERE scheme_id = $1 AND application_status = $2',
      [schemeId, 'approved']
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function calculateEstimatedSubsidy(schemeId, landArea) {
  try {
    const scheme = await getSchemeCriteria(schemeId);
    if (!scheme.max_amount || !scheme.subsidy_percentage) return 0;
    
    const baseAmount = landArea * 10000; // Assumed base rate per hectare
    const subsidyAmount = baseAmount * (scheme.subsidy_percentage / 100);
    return Math.min(subsidyAmount, scheme.max_amount);
  } catch (error) {
    return 0;
  }
}

async function getFarmerLand(farmerId) {
  try {
    const result = await pool.query('SELECT * FROM land_parcels WHERE farmer_id = $1', [farmerId]);
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function getActiveSchemes() {
  try {
    const result = await pool.query('SELECT * FROM subsidy_schemes WHERE status = $1', ['active']);
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function assessEligibilityMatch(farmerId) {
  return {
    land_eligible: true,
    crop_eligible: true,
    document_eligible: true
  };
}

module.exports = {
  createSubsidyScheme,
  applyForSubsidy,
  getRecommendedSubsidies
};
