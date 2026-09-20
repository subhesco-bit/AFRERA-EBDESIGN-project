/**
 * AI-Based Subsidy Applicability Service
 * Determines eligibility for project, equipment, and logistics subsidies
 * Specifically for India and Northeast region
 */

const { logger } = require('../../utils/logger');
const { authMiddleware } = require('../../middleware/auth');

/**
 * Check subsidy eligibility for a project
 */
async function checkProjectSubsidyEligibility(projectDetails) {
  try {
    const { project_type, state } = projectDetails;

    // BUG FIX (2026-09-20): this routed the real, state-filtered
    // getGovernmentSchemes() result (the same real hardcoded scheme catalog
    // - name/code/ministry/subsidy_percentage/max_amount/eligibility - that
    // getApplicableSchemes() below already returns directly, unbroken)
    // through aiAPI.generateRecommendation() to have the AI invent
    // eligibility_score/subsidy_breakdown/next_steps on top of it - but
    // aiAPI was never a real export of aiBackboneService.js (see
    // sharedInfraService.js 6005e08c for the same finding), so this threw a
    // TypeError on every call. This is LIVE-WIRED and was the highest-value
    // finding of this pass: frontend/src/services/api.js's
    // subsidyOpsAPI.checkProjectSubsidy() calls this exact endpoint
    // (/subsidy/project/check), so every real caller got a 500. Now returns
    // the real, state-filtered scheme list directly instead of fabricating
    // AI eligibility scores on top of it - no eligibility_score/confidence/
    // documents/deadline fields are invented since getGovernmentSchemes()
    // does not track those.
    const matchingSchemes = await getGovernmentSchemes(state, project_type);

    const eligibility = {
      check_id: generateId(),
      timestamp: new Date().toISOString(),
      project_details: projectDetails,
      eligible_schemes: matchingSchemes.map(scheme => ({
        scheme_name: scheme.name,
        scheme_code: scheme.code,
        ministry: scheme.ministry,
        subsidy_percentage: scheme.subsidy_percentage,
        max_subsidy_amount: scheme.max_amount,
        eligibility_criteria: scheme.eligibility,
      })),
      recommended_scheme: null,
      total_potential_subsidy: null,
      subsidy_breakdown: null,
      application_guidance: null,
      next_steps: [],
    };

    logger.info(`Project subsidy eligibility check: ${eligibility.check_id}`);
    return eligibility;
  } catch (error) {
    logger.error('Error checking project subsidy eligibility', { error: error.message, stack: error.stack });
    throw new Error('Failed to check project subsidy eligibility');
  }
}

/**
 * Check subsidy eligibility for equipment
 */
async function checkEquipmentSubsidyEligibility(equipmentDetails) {
  try {
    const { equipment_category, state } = equipmentDetails;

    // BUG FIX (2026-09-20): same finding as checkProjectSubsidyEligibility
    // above - this discarded the real, state-filtered getEquipmentSchemes()
    // result and asked the (nonexistent) AI to invent eligibility_score/
    // subsidy_breakdown/alternatives on top of it. aiAPI was never a real
    // export of aiBackboneService.js. LIVE-WIRED:
    // subsidyOpsAPI.checkEquipmentSubsidy() in frontend/src/services/api.js
    // calls this exact endpoint (/subsidy/equipment/check), so every real
    // caller got a 500. Now returns the real scheme list directly - no
    // max_subsidy_per_unit/brand_restrictions/eligibility_score fields are
    // invented since getEquipmentSchemes() does not track per-unit or
    // brand-level data.
    const matchingSchemes = await getEquipmentSchemes(state, equipment_category);

    const eligibility = {
      check_id: generateId(),
      timestamp: new Date().toISOString(),
      equipment_details: equipmentDetails,
      eligible_schemes: matchingSchemes.map(scheme => ({
        scheme_name: scheme.name,
        scheme_code: scheme.code,
        ministry: scheme.ministry,
        subsidy_percentage: scheme.subsidy_percentage,
        max_subsidy_amount: scheme.max_amount,
        eligibility_criteria: scheme.eligibility,
      })),
      recommended_scheme: null,
      total_potential_subsidy: null,
      subsidy_breakdown: null,
      alternative_equipment: [],
      application_guidance: null,
    };

    logger.info(`Equipment subsidy eligibility check: ${eligibility.check_id}`);
    return eligibility;
  } catch (error) {
    logger.error('Error checking equipment subsidy eligibility', { error: error.message, stack: error.stack });
    throw new Error('Failed to check equipment subsidy eligibility');
  }
}

/**
 * Check subsidy eligibility for logistics
 */
async function checkLogisticsSubsidyEligibility(logisticsDetails) {
  try {
    const { state, is_northeast_route } = logisticsDetails;

    // BUG FIX (2026-09-20): same finding as checkProjectSubsidyEligibility
    // above - this discarded the real getLogisticsSchemes() result (a real,
    // concrete NE-logistics scheme with actual subsidy_type/rate/max_amount
    // fields when is_northeast_route is true) and asked the (nonexistent) AI
    // to invent eligibility_score/subsidy_breakdown/alternative_routes on
    // top of it, and also fabricated estimated_cost_with_gst via
    // aiResponse.estimated_private_cost. aiAPI was never a real export of
    // aiBackboneService.js. LIVE-WIRED:
    // subsidyOpsAPI.checkLogisticsSubsidy() in
    // frontend/src/services/api.js calls this exact endpoint
    // (/subsidy/logistics/check), so every real caller got a 500. Now
    // returns the real scheme list directly (subsidy_type/subsidy_rate/
    // max_subsidy_amount are genuine fields on the NE-logistics scheme
    // object, not invented); estimated_cost_with_gst is left null rather
    // than fabricating a private-carrier fare quote (a real GST-inclusive
    // figure for a known cargo_value is available via the separate
    // /subsidy/gst/calculate endpoint - calculateGSTApplicability() below).
    const matchingSchemes = await getLogisticsSchemes(state, is_northeast_route);

    const eligibility = {
      check_id: generateId(),
      timestamp: new Date().toISOString(),
      logistics_details: logisticsDetails,
      eligible_schemes: matchingSchemes.map(scheme => ({
        scheme_name: scheme.name,
        scheme_code: scheme.code,
        ministry: scheme.ministry,
        subsidy_type: scheme.subsidy_type, // per_km, per_ton, flat_rate
        subsidy_rate: scheme.rate,
        max_subsidy_amount: scheme.max_amount,
        eligibility_criteria: scheme.eligibility,
      })),
      recommended_scheme: null,
      total_potential_subsidy: null,
      subsidy_breakdown: null,
      private_company_routing: null,
      gst_applicability: null,
      alternative_routes: [],
      application_guidance: null,
    };

    // If subsidy not available, route through private company with GST
    if (eligibility.eligible_schemes.length === 0) {
      eligibility.private_company_routing = {
        recommended: true,
        reason: 'No direct subsidy available for this route',
        gst_applicable: true,
        gst_rate: 18,
        private_logistics_partners: await getPrivateLogisticsPartners(state),
        estimated_cost_with_gst: null,
      };
    }

    logger.info(`Logistics subsidy eligibility check: ${eligibility.check_id}`);
    return eligibility;
  } catch (error) {
    logger.error('Error checking logistics subsidy eligibility', { error: error.message, stack: error.stack });
    throw new Error('Failed to check logistics subsidy eligibility');
  }
}

/**
 * Get all applicable government schemes for a location and category
 */
async function getApplicableSchemes(location, category) {
  try {
    const schemes = await getGovernmentSchemes(location.state, category);

    return {
      location,
      category,
      schemes: schemes.map(scheme => ({
        name: scheme.name,
        code: scheme.code,
        ministry: scheme.ministry,
        description: scheme.description,
        eligibility_criteria: scheme.eligibility,
        subsidy_percentage: scheme.subsidy_percentage,
        max_amount: scheme.max_amount,
        application_process: scheme.application_process,
        documents_required: scheme.documents,
        contact_details: scheme.contact,
        last_updated: scheme.updated_at,
      })),
      total_schemes: schemes.length,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Error getting applicable schemes', { error: error.message, stack: error.stack });
    throw new Error('Failed to get applicable schemes');
  }
}

/**
 * Submit subsidy application
 */
async function submitSubsidyApplication(applicationData) {
  try {
    const {
      scheme_code,
      applicant_type,
      applicant_id,
      project_details,
      documents,
      bank_details,
      declaration,
    } = applicationData;

    const application = {
      application_id: generateId(),
      scheme_code,
      applicant_type,
      applicant_id,
      project_details,
      documents,
      bank_details,
      declaration,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      estimated_processing_time: await getProcessingTime(scheme_code),
      tracking_number: generateTrackingNumber(),
    };

    // In production, save to database and trigger workflow

    logger.info(`Subsidy application submitted: ${application.application_id}`);
    return application;
  } catch (error) {
    logger.error('Error submitting subsidy application', { error: error.message, stack: error.stack });
    throw new Error('Failed to submit subsidy application');
  }
}

/**
 * Track subsidy application status
 */
async function trackSubsidyApplication(applicationId) {
  try {
    // In production, fetch from database
    const status = {
      application_id: applicationId,
      tracking_number: `SUB-${ applicationId}`,
      current_status: 'under_review',
      status_history: [
        {
          status: 'submitted',
          timestamp: '2026-07-20T10:00:00Z',
          remarks: 'Application submitted successfully',
        },
        {
          status: 'document_verification',
          timestamp: '2026-07-21T14:30:00Z',
          remarks: 'Documents under verification',
        },
        {
          status: 'under_review',
          timestamp: '2026-07-23T09:15:00Z',
          remarks: 'Application under departmental review',
        },
      ],
      expected_completion: '2026-08-15T00:00:00Z',
      next_steps: ['Field inspection scheduled', 'Technical approval pending'],
      contact_officer: {
        name: 'Rajesh Kumar',
        designation: 'Agricultural Officer',
        phone: '+91-9876543210',
        email: 'rajesh.kumar@agri.gov.in',
      },
    };

    return status;
  } catch (error) {
    logger.error('Error tracking subsidy application', { error: error.message, stack: error.stack });
    throw new Error('Failed to track subsidy application');
  }
}

/**
 * Calculate GST applicability for logistics
 */
async function calculateGSTApplicability(logisticsDetails) {
  try {
    const {
      service_type,
      route,
      cargo_type,
      cargo_value,
      distance,
      vehicle_type,
    } = logisticsDetails;

    const gstApplicability = {
      logistics_id: generateId(),
      gst_applicable: true,
      gst_rate: 18, // Standard GST rate for logistics
      calculation: {
        base_value: cargo_value,
        gst_amount: cargo_value * 0.18,
        total_with_gst: cargo_value * 1.18,
      },
      exemptions: [],
      compliance_requirements: [
        'GST registration required',
        'E-invoice generation',
        'E-way bill for interstate movement',
        'GST return filing',
      ],
      input_tax_credit_available: true,
      reverse_charge_applicable: false,
      timestamp: new Date().toISOString(),
    };

    // Check for exemptions
    if (route.origin_state === route.destination_state) {
      gstApplicability.intrastate = true;
      gstApplicability.cgst_rate = 9;
      gstApplicability.sgst_rate = 9;
    } else {
      gstApplicability.interstate = true;
      gstApplicability.igst_rate = 18;
    }

    return gstApplicability;
  } catch (error) {
    logger.error('Error calculating GST applicability', { error: error.message, stack: error.stack });
    throw new Error('Failed to calculate GST applicability');
  }
}

// Helper functions
function generateId() {
  return `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateTrackingNumber() {
  return `TRK-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
}

async function getGovernmentSchemes(state, projectType) {
  // In production, fetch from government schemes database
  const schemes = [
    {
      name: 'Mission for Integrated Development of Horticulture (MIDH)',
      code: 'MIDH',
      ministry: 'Ministry of Agriculture',
      subsidy_percentage: 40,
      max_amount: 5000000,
      eligibility: { state: ['all'], category: ['greenhouse', 'cold_storage', 'processing'] },
    },
    {
      name: 'Agriculture Infrastructure Fund (AIF)',
      code: 'AIF',
      ministry: 'Ministry of Agriculture',
      subsidy_percentage: 33,
      max_amount: 20000000,
      eligibility: { state: ['all'], category: ['infrastructure', 'warehouse', 'logistics'] },
    },
    {
      name: 'PM Formalization of Micro Food Processing Enterprises (PM-FME)',
      code: 'PM-FME',
      ministry: 'Ministry of Food Processing',
      subsidy_percentage: 35,
      max_amount: 10000000,
      eligibility: { state: ['all'], category: ['processing', 'equipment'] },
    },
    {
      name: 'North East Special Infrastructure Development Scheme (NESIDS)',
      code: 'NESIDS',
      ministry: 'MDoNER',
      subsidy_percentage: 90,
      max_amount: 50000000,
      eligibility: { state: ['arunachal', 'assam', 'manipur', 'meghalaya', 'mizoram', 'nagaland', 'sikkim', 'tripura'], category: ['infrastructure', 'logistics', 'processing'] },
    },
    {
      name: 'MOVCDNER (Mission on Organic Value Chain Development for North East Region)',
      code: 'MOVCDNER',
      ministry: 'Ministry of Agriculture',
      subsidy_percentage: 50,
      max_amount: 30000000,
      eligibility: { state: ['arunachal', 'assam', 'manipur', 'meghalaya', 'mizoram', 'nagaland', 'sikkim', 'tripura'], category: ['organic', 'processing', 'value_addition'] },
    },
  ];

  return schemes.filter(scheme =>
    scheme.eligibility.state.includes('all') || scheme.eligibility.state.includes(state.toLowerCase()),
  );
}

async function getEquipmentSchemes(state, equipmentCategory) {
  // Similar logic for equipment-specific schemes
  return getGovernmentSchemes(state, 'equipment');
}

async function getLogisticsSchemes(state, isNortheastRoute) {
  const schemes = [];

  if (isNortheastRoute) {
    schemes.push({
      name: 'North East Logistics Support Scheme',
      code: 'NER-LOGISTICS',
      ministry: 'MDoNER',
      subsidy_type: 'per_ton',
      rate: 25, // per ton
      max_amount: 500000,
      eligibility: { state: ['arunachal', 'assam', 'manipur', 'meghalaya', 'mizoram', 'nagaland', 'sikkim', 'tripura'] },
    });
  }

  return schemes;
}

async function getPrivateLogisticsPartners(state) {
  // Fetch private logistics partners
  return [
    { name: 'AgriTrans Logistics', gstin: '27AAAAA0000A1Z5', rating: 4.5 },
    { name: 'FarmFresh Transport', gstin: '27BBBBB0000B1Z5', rating: 4.2 },
    { name: 'ColdChain Express', gstin: '27CCCCC0000C1Z5', rating: 4.7 },
  ];
}

async function getProcessingTime(schemeCode) {
  // Return estimated processing time based on scheme
  return '45-60 days';
}

// Express routes setup
function setupRoutes(app) {
  app.post('/api/v1/subsidy/project/check', authMiddleware, async (req, res) => {
    try {
      const eligibility = await checkProjectSubsidyEligibility(req.body);
      res.json({ success: true, data: eligibility });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/v1/subsidy/equipment/check', authMiddleware, async (req, res) => {
    try {
      const eligibility = await checkEquipmentSubsidyEligibility(req.body);
      res.json({ success: true, data: eligibility });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/v1/subsidy/logistics/check', authMiddleware, async (req, res) => {
    try {
      const eligibility = await checkLogisticsSubsidyEligibility(req.body);
      res.json({ success: true, data: eligibility });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/v1/subsidy/schemes', async (req, res) => {
    try {
      const schemes = await getApplicableSchemes(req.query);
      res.json({ success: true, data: schemes });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/v1/subsidy/apply', authMiddleware, async (req, res) => {
    try {
      const application = await submitSubsidyApplication(req.body);
      res.json({ success: true, data: application });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/v1/subsidy/track/:id', async (req, res) => {
    try {
      const status = await trackSubsidyApplication(req.params.id);
      res.json({ success: true, data: status });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/v1/subsidy/gst/calculate', authMiddleware, async (req, res) => {
    try {
      const gst = await calculateGSTApplicability(req.body);
      res.json({ success: true, data: gst });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

module.exports = {
  checkProjectSubsidyEligibility,
  checkEquipmentSubsidyEligibility,
  checkLogisticsSubsidyEligibility,
  getApplicableSchemes,
  submitSubsidyApplication,
  trackSubsidyApplication,
  calculateGSTApplicability,
  setupRoutes,
};

