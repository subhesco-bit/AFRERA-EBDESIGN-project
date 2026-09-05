/**
 * AI-Based Insurance Claims Processing and Settlement Follow-up Service
 */

const { logger } = require('../../utils\/logger');
const { aiAPI } = require('./aiService');
const { socketServer } = require('../../../websocket');
const { authMiddleware } = require('../../middleware\/auth');
const { signalBus, SIGNAL, SEVERITY } = require('../../core\/signalBus');

/**
 * Submit insurance claim with AI validation
 */
async function submitInsuranceClaim(claimData) {
  try {
    const {
      policy_id,
      claim_type,
      incident_date,
      incident_description,
      estimated_loss,
      supporting_documents,
      location,
      weather_data,
      images,
      farmer_id
    } = claimData;

    // AI-powered claim validation
    const aiRequest = {
      task: 'insurance_claim_validation',
      parameters: {
        policy_id,
        claim_type,
        incident_date,
        incident_description,
        estimated_loss,
        supporting_documents,
        location,
        weather_data,
        images,
        policy_details: await getPolicyDetails(policy_id),
        historical_claims: await getFarmerClaimHistory(farmer_id),
        fraud_indicators: await checkFraudIndicators(claimData)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);

    const claim = {
      claim_id: generateId(),
      policy_id: policy_id,
      claim_number: generateClaimNumber(),
      farmer_id: farmer_id,
      claim_type: claim_type,
      incident_date: incident_date,
      incident_description: incident_description,
      estimated_loss: estimated_loss,
      supporting_documents: supporting_documents,
      location: location,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      ai_validation: {
        confidence_score: aiResponse.confidence_score,
        fraud_probability: aiResponse.fraud_probability,
        coverage_eligibility: aiResponse.coverage_eligibility,
        estimated_payout: aiResponse.estimated_payout,
        validation_notes: aiResponse.validation_notes,
        required_additional_documents: aiResponse.required_documents,
        red_flags: aiResponse.red_flags
      },
      processing_timeline: aiResponse.estimated_processing_time
    };

    // Notify farmer via WebSocket
    socketServer.sendNotification(farmer_id, {
      type: 'claim_submitted',
      claim_id: claim.claim_id,
      claim_number: claim.claim_number,
      status: claim.status,
      message: 'Your insurance claim has been submitted successfully'
    });

    // AFFERENT WIRING: core/effectors.js already has a 'claim.intake' reaction
    // on SIGNAL.CLAIM_SUBMITTED whose whole purpose is to attach any logged
    // temperature-breach/shipment/quality evidence to a claim automatically —
    // it has never fired because nothing ever called emitSignal() here. Fired
    // after the claim object is fully built (real claim_id/claim_number), not
    // before, so a failed build cannot announce a claim that does not exist.
    signalBus.emitSignal(
      SIGNAL.CLAIM_SUBMITTED,
      {
        claimId: claim.claim_id,
        claimNumber: claim.claim_number,
        policyId: policy_id,
        claimType: claim_type,
        estimatedLoss: estimated_loss,
        fraudProbability: aiResponse.fraud_probability ?? null
      },
      { severity: SEVERITY.NOTICE, source: 'insuranceClaimsService.submitInsuranceClaim', entityId: farmer_id }
    );

    logger.info(`Insurance claim submitted: ${claim.claim_id}`);
    return claim;
  } catch (error) {
    logger.error('Error submitting insurance claim', { error: error.message, stack: error.stack });
    throw new Error('Failed to submit insurance claim');
  }
}

/**
 * Process insurance claim with AI assessment
 */
async function processInsuranceClaim(claimId) {
  try {
    let claim = await getClaimDetails(claimId);
    
    // AI-powered claim assessment
    let aiRequest = {
      task: 'insurance_claim_assessment',
      parameters: {
        claim_id: claimId,
        claim_data: claim,
        policy_data: await getPolicyDetails(claim.policy_id),
        evidence_analysis: await analyzeEvidence(claim.supporting_documents),
        weather_analysis: await analyzeWeatherConditions(claim.incident_date, claim.location),
        satellite_imagery: await getSatelliteImagery(claim.location, claim.incident_date),
        market_prices: await getCurrentMarketPrices(claim.claim_type),
        historical_data: await getHistoricalClaimData(claim.claim_type)
      }
    };

    let aiResponse = await aiAPI.generateRecommendation(aiRequest);

    const assessment = {
      claim_id: claimId,
      assessment_id: generateId(),
      timestamp: new Date().toISOString(),
      assessment_result: {
        approved: aiResponse.approved,
        approval_amount: aiResponse.approval_amount,
        rejection_reason: aiResponse.rejection_reason,
        partial_approval: aiResponse.partial_approval,
        conditions: aiResponse.conditions
      },
      damage_assessment: {
        actual_loss: aiResponse.actual_loss,
        coverage_percentage: aiResponse.coverage_percentage,
        deductible: aiResponse.deductible,
        net_payout: aiResponse.net_payout
      },
      evidence_analysis: {
        document_validity: aiResponse.document_validity,
        image_analysis: aiResponse.image_analysis,
        weather_correlation: aiResponse.weather_correlation,
        overall_evidence_strength: aiResponse.evidence_strength
      },
      risk_factors: aiResponse.risk_factors,
      recommendations: aiResponse.recommendations,
      confidence: aiResponse.confidence
    };

    // Update claim status
    claim.status = assessment.assessment_result.approved ? 'approved' : 'rejected';
    claim.assessment = assessment;
    claim.assessed_at = new Date().toISOString();

    // Notify farmer
    socketServer.sendNotification(claim.farmer_id, {
      type: 'claim_assessed',
      claim_id: claimId,
      status: claim.status,
      amount: assessment.assessment_result.approval_amount,
      message: claim.status === 'approved' 
        ? `Your claim has been approved for ₹${assessment.assessment_result.approval_amount}`
        : 'Your claim has been rejected'
    });

    logger.info(`Insurance claim processed: ${claimId}`);
    return assessment;
  } catch (error) {
    logger.error('Error processing insurance claim', { error: error.message, stack: error.stack });
    throw new Error('Failed to process insurance claim');
  }
}

/**
 * Follow up with insurance company for claim settlement
 */
async function followUpClaimSettlement(claimId) {
  try {
    let claim = await getClaimDetails(claimId);
    
    const followUp = {
      follow_up_id: generateId(),
      claim_id: claimId,
      claim_number: claim.claim_number,
      insurance_company: await getInsuranceCompany(claim.policy_id),
      follow_up_date: new Date().toISOString(),
      current_status: claim.status,
      days_since_submission: Math.floor((new Date() - new Date(claim.submitted_at)) / (1000 * 60 * 60 * 24)),
      next_action: determineNextAction(claim),
      estimated_settlement_date: estimateSettlementDate(claim),
      communication_history: await getCommunicationHistory(claimId),
      required_actions: getRequiredActions(claim),
      escalation_level: determineEscalationLevel(claim)
    };

    // AI-powered follow-up recommendation
    let aiRequest = {
      task: 'settlement_follow_up_recommendation',
      parameters: {
        claim_data: claim,
        follow_up_data: followUp,
        company_policies: await getCompanyPolicies(followUp.insurance_company),
        industry_benchmarks: await getIndustryBenchmarks()
      }
    };

    let aiResponse = await aiAPI.generateRecommendation(aiRequest);
    followUp.ai_recommendations = aiResponse;

    // Execute automated follow-up actions
    if (aiResponse.auto_send_reminder) {
      await sendReminderToInsuranceCompany(claimId);
    }

    if (aiResponse.escalate) {
      await escalateClaim(claimId, aiResponse.escalation_reason);
    }

    logger.info(`Claim settlement follow-up: ${claimId}`);
    return followUp;
  } catch (error) {
    logger.error('Error following up claim settlement', { error: error.message, stack: error.stack });
    throw new Error('Failed to follow up claim settlement');
  }
}

/**
 * Get claim status and timeline
 */
async function getClaimStatus(claimId) {
  try {
    let claim = await getClaimDetails(claimId);
    
    const status = {
      claim_id: claimId,
      claim_number: claim.claim_number,
      current_status: claim.status,
      submitted_at: claim.submitted_at,
      timeline: [
        {
          stage: 'submitted',
          date: claim.submitted_at,
          completed: true
        },
        {
          stage: 'validation',
          date: claim.validated_at,
          completed: !!claim.validated_at
        },
        {
          stage: 'assessment',
          date: claim.assessed_at,
          completed: !!claim.assessed_at
        },
        {
          stage: 'approval',
          date: claim.approved_at,
          completed: !!claim.approved_at
        },
        {
          stage: 'settlement',
          date: claim.settled_at,
          completed: !!claim.settled_at
        }
      ],
      estimated_completion: claim.processing_timeline?.estimated_completion,
      current_stage: getCurrentStage(claim),
      next_milestone: getNextMilestone(claim),
      pending_actions: getPendingActions(claim)
    };

    return status;
  } catch (error) {
    logger.error('Error getting claim status', { error: error.message, stack: error.stack });
    throw new Error('Failed to get claim status');
  }
}

/**
 * AI-based claim fraud detection
 */
async function detectClaimFraud(claimData) {
  try {
    let aiRequest = {
      task: 'fraud_detection',
      parameters: {
        claim_data: claimData,
        farmer_history: await getFarmerClaimHistory(claimData.farmer_id),
        pattern_analysis: await analyzeClaimPatterns(claimData),
        location_analysis: await analyzeLocation(claimData.location),
        weather_analysis: await analyzeWeatherConditions(claimData.incident_date, claimData.location),
        document_analysis: await analyzeDocuments(claimData.supporting_documents),
        industry_fraud_patterns: await getIndustryFraudPatterns()
      }
    };

    let aiResponse = await aiAPI.generateRecommendation(aiRequest);

    const fraudAnalysis = {
      claim_id: claimData.claim_id || generateId(),
      fraud_probability: aiResponse.fraud_probability,
      risk_level: aiResponse.risk_level,
      risk_factors: aiResponse.risk_factors,
      indicators: aiResponse.indicators,
      recommendations: aiResponse.recommendations,
      requires_manual_review: aiResponse.requires_manual_review,
      confidence: aiResponse.confidence,
      analyzed_at: new Date().toISOString()
    };

    return fraudAnalysis;
  } catch (error) {
    logger.error('Error detecting claim fraud', { error: error.message, stack: error.stack });
    throw new Error('Failed to detect claim fraud');
  }
}

/**
 * Calculate claim payout with AI
 */
async function calculateClaimPayout(claimId) {
  try {
    let claim = await getClaimDetails(claimId);
    
    let aiRequest = {
      task: 'payout_calculation',
      parameters: {
        claim_data: claim,
        policy_data: await getPolicyDetails(claim.policy_id),
        damage_assessment: await assessDamage(claim),
        market_prices: await getCurrentMarketPrices(claim.claim_type),
        depreciation_factors: await getDepreciationFactors(claim.claim_type),
        deductible_calculation: await calculateDeductible(claim),
        coverage_limits: await getCoverageLimits(claim.policy_id)
      }
    };

    let aiResponse = await aiAPI.generateRecommendation(aiRequest);

    const payout = {
      claim_id: claimId,
      calculation_id: generateId(),
      timestamp: new Date().toISOString(),
      breakdown: {
        assessed_loss: aiResponse.assessed_loss,
        coverage_percentage: aiResponse.coverage_percentage,
        covered_amount: aiResponse.covered_amount,
        deductible: aiResponse.deductible,
        depreciation: aiResponse.depreciation,
        net_payout: aiResponse.net_payout
      },
      factors: {
        market_price_adjustment: aiResponse.market_adjustment,
        quality_adjustment: aiResponse.quality_adjustment,
        age_adjustment: aiResponse.age_adjustment,
        location_adjustment: aiResponse.location_adjustment
      },
      payment_schedule: aiResponse.payment_schedule,
      confidence: aiResponse.confidence
    };

    return payout;
  } catch (error) {
    logger.error('Error calculating claim payout', { error: error.message, stack: error.stack });
    throw new Error('Failed to calculate claim payout');
  }
}

// Helper functions
function generateId() {
  return `CLM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateClaimNumber() {
  return `AFRERA-CLM-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
}

async function getPolicyDetails(policyId) {
  // Fetch from database
  return {};
}

async function getFarmerClaimHistory(farmerId) {
  // Fetch from database
  return [];
}

async function checkFraudIndicators(claimData) {
  // Check for fraud indicators
  return [];
}

async function getClaimDetails(claimId) {
  // Fetch from database
  return {};
}

async function analyzeEvidence(documents) {
  // Analyze supporting documents
  return {};
}

async function analyzeWeatherConditions(date, location) {
  // Analyze weather conditions
  return {};
}

async function getSatelliteImagery(location, date) {
  // Get satellite imagery
  return {};
}

async function getCurrentMarketPrices(claimType) {
  // Get current market prices
  return {};
}

async function getHistoricalClaimData(claimType) {
  // Get historical claim data
  return {};
}

async function getInsuranceCompany(policyId) {
  // Get insurance company details
  return 'ICICI Lombard';
}

async function getCommunicationHistory(claimId) {
  // Get communication history
  return [];
}

function determineNextAction(claim) {
  // Determine next action
  return 'awaiting_insurance_review';
}

function estimateSettlementDate(claim) {
  // Estimate settlement date
  return new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
}

function getRequiredActions(claim) {
  // Get required actions
  return [];
}

function determineEscalationLevel(claim) {
  // Determine escalation level
  return 'normal';
}

async function getCompanyPolicies(company) {
  // Get company policies
  return {};
}

async function getIndustryBenchmarks() {
  // Get industry benchmarks
  return {};
}

async function sendReminderToInsuranceCompany(claimId) {
  // Send reminder
  logger.info(`Reminder sent to insurance company for claim ${claimId}`);
}

async function escalateClaim(claimId, reason) {
  // Escalate claim
  logger.info(`Claim ${claimId} escalated: ${reason}`);
}

function getCurrentStage(claim) {
  // Get current stage
  return 'assessment';
}

function getNextMilestone(claim) {
  // Get next milestone
  return 'approval';
}

function getPendingActions(claim) {
  // Get pending actions
  return [];
}

async function analyzeClaimPatterns(claimData) {
  // Analyze claim patterns
  return {};
}

async function analyzeLocation(location) {
  // Analyze location
  return {};
}

async function analyzeDocuments(documents) {
  // Analyze documents
  return {};
}

async function getIndustryFraudPatterns() {
  // Get industry fraud patterns
  return [];
}

async function assessDamage(claim) {
  // Assess damage
  return {};
}

async function getDepreciationFactors(claimType) {
  // Get depreciation factors
  return {};
}

async function calculateDeductible(claim) {
  // Calculate deductible
  return {};
}

async function getCoverageLimits(policyId) {
  // Get coverage limits
  return {};
}

// Express routes setup
function setupRoutes(app) {
  app.post('/api/v1/insurance/claims/submit', authMiddleware, async (req, res) => {
    try {
      let claim = await submitInsuranceClaim(req.body);
      res.json({ success: true, data: claim });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/v1/insurance/claims/:id/process', authMiddleware, async (req, res) => {
    try {
      let assessment = await processInsuranceClaim(req.params.id);
      res.json({ success: true, data: assessment });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/v1/insurance/claims/:id/followup', authMiddleware, async (req, res) => {
    try {
      let followUp = await followUpClaimSettlement(req.params.id);
      res.json({ success: true, data: followUp });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/v1/insurance/claims/:id/status', async (req, res) => {
    try {
      let status = await getClaimStatus(req.params.id);
      res.json({ success: true, data: status });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/v1/insurance/claims/fraud-detect', authMiddleware, async (req, res) => {
    try {
      let fraudAnalysis = await detectClaimFraud(req.body);
      res.json({ success: true, data: fraudAnalysis });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/v1/insurance/claims/:id/payout', async (req, res) => {
    try {
      let payout = await calculateClaimPayout(req.params.id);
      res.json({ success: true, data: payout });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

module.exports = {
  submitInsuranceClaim,
  processInsuranceClaim,
  followUpClaimSettlement,
  getClaimStatus,
  detectClaimFraud,
  calculateClaimPayout,
  setupRoutes
};



