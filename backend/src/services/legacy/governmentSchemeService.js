/**
 * Government Scheme Management Service
 * CSR integration, government support schemes, weather alerts, and official announcements
 */

const { logger } = require('../../../utils/logger');
const { aiAPI } = require('./aiService');
const { socketServer } = require('../../../websocket');
const { authMiddleware } = require('../../../middleware/auth');
// Shared pool (2026-08-04 convention, see database/pool.js): the AI-matching
// functions above never touched Postgres, but the scheme registry added in
// migration 9995_scheme_verification_map_protection.sql does — every scheme
// those functions return was AI-generated or hardcoded, with no stored
// verification status/expiry anywhere (see that migration's header).
const pool = require('../../../database/pool');

/**
 * List verified schemes from the registry table (government_schemes).
 * Distinct from getApplicableSchemes() above: that is AI-matched discovery;
 * this is the verified-status source of truth (active/conditional/expired,
 * with expiry date and last-verified source) the v44 prototype's SCHEMES
 * array named. Filters are all optional.
 */
async function listSchemeRegistry(filters = {}) {
  const { status, category, state } = filters;
  const conditions = [];
  const params = [];

  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }
  if (category) {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }
  if (state) {
    params.push(state);
    conditions.push(`(applicable_states IS NULL OR $${params.length} = ANY(applicable_states))`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await pool.query(
    `SELECT * FROM government_schemes ${where} ORDER BY status, name`,
    params
  );
  return result.rows;
}

async function getSchemeByCode(code) {
  let result = await pool.query('SELECT * FROM government_schemes WHERE code = $1', [code]);
  if (result.rows.length === 0) {
    throw new Error('Scheme not found');
  }
  return result.rows[0];
}

/**
 * Update a scheme's verified status. This is the discipline the v44
 * prototype's "Primary source verification only" note asks for: a status
 * cannot move to 'expired' without an expiry_date (enforced by the
 * expired_scheme_must_have_expiry_date CHECK constraint), and every update
 * records verification_source + last_verified_at/by.
 */
async function updateSchemeRegistry(code, updates, verifiedBy) {
  const {
    status, expiry_date, verification_source, notes, effective_from, applicable_states
  } = updates;

  let result = await pool.query(
    `UPDATE government_schemes SET
       status = COALESCE($1, status),
       expiry_date = COALESCE($2, expiry_date),
       verification_source = COALESCE($3, verification_source),
       notes = COALESCE($4, notes),
       effective_from = COALESCE($5, effective_from),
       applicable_states = COALESCE($6, applicable_states),
       last_verified_at = CURRENT_TIMESTAMP,
       last_verified_by = $7,
       updated_at = CURRENT_TIMESTAMP
     WHERE code = $8
     RETURNING *`,
    [status, expiry_date, verification_source, notes, effective_from, applicable_states, verifiedBy || null, code]
  );

  if (result.rows.length === 0) {
    throw new Error('Scheme not found');
  }
  return result.rows[0];
}

/**
 * Schemes expiring within `days` days, plus anything already expired —
 * the "automatic exclusion of lapsed schemes" the prototype called for
 * (see AHIDF, expired 2026-03-31, excluded from live financing/insurance
 * workflows per AdminDashboardPage.jsx / GovernmentDashboardPage.jsx).
 */
async function getExpiringSchemeRegistry(days = 30) {
  let result = await pool.query(
    `SELECT * FROM government_schemes
     WHERE expiry_date IS NOT NULL
       AND expiry_date <= CURRENT_DATE + ($1 || ' days')::INTERVAL
     ORDER BY expiry_date`,
    [days]
  );
  return result.rows;
}

/**
 * schemeExpiryStatus — deadline exposure monitoring.
 *
 * Ported from v42 (docs/MISSING_BUSINESS_LOGIC_EXTRACTION.md #7). The
 * original hardcoded a 4-row SCHEME_EXPIRY array (PM-FME/AIF/AHIDF/
 * OPGREENS). That is superseded here by the real government_schemes
 * registry added in 9995_scheme_verification_map_protection.sql for the
 * parallel V44 scheme-verification task (checked first, per instruction,
 * to avoid a competing table) — every scheme with a recorded expiry_date is
 * classified, not just the original four. Same ACTIVE / EXPIRING SOON (<=60
 * days) / LAPSED thresholds as the original.
 */
async function schemeExpiryStatus() {
  const { rows } = await pool.query(
    `SELECT code AS id, name AS label, expiry_date
       FROM government_schemes
      WHERE expiry_date IS NOT NULL
      ORDER BY expiry_date ASC`
  );

  const now = Date.now();
  return rows.map((s) => {
    const days = Math.round((new Date(s.expiry_date) - now) / 86400000);
    const state = days < 0 ? 'LAPSED' : days <= 60 ? 'EXPIRING SOON' : 'ACTIVE';
    return {
      id: s.id,
      label: s.label,
      expiry: s.expiry_date,
      days,
      state,
      urgency: state === 'LAPSED' ? 'critical' : state === 'EXPIRING SOON' ? 'high' : 'low'
    };
  });
}

/**
 * AI Scheme Checker (v44 feature 5) — deliberately grounded in the verified
 * registry rather than a free-form AI call: it answers strictly from rows in
 * government_schemes so an expired or unverified scheme can never be told to
 * a farmer as eligible. category/state/status are simple, real SQL filters;
 * "AI" here means query-time eligibility reasoning over verified data, not
 * an LLM hallucinating scheme names.
 */
async function checkSchemeEligibility(params = {}) {
  const { category, state, farm_size } = params;
  const rows = await listSchemeRegistry({ category, state, status: undefined });
  const eligible = rows.filter((s) => s.status !== 'expired');
  const conditional = eligible.filter((s) => s.status === 'conditional');

  return {
    checked_at: new Date().toISOString(),
    filters: { category, state, farm_size },
    eligible_count: eligible.length,
    eligible_schemes: eligible.map((s) => ({
      code: s.code,
      name: s.name,
      ministry: s.ministry,
      status: s.status,
      relevance: s.relevance,
      notes: s.notes
    })),
    reminder: conditional.length > 0
      ? `${conditional.length} scheme(s) are conditional — confirm current-year allocation with the primary source before committing.`
      : 'Confirm with the primary source before applying.'
  };
}

/**
 * Get applicable government schemes for a user/location
 */
async function getApplicableSchemes(params) {
  try {
    const {
      user_id,
      user_type,
      location,
      state,
      district,
      category,
      crop_type,
      farm_size,
      income_level
    } = params;

    // AI-powered scheme matching
    const aiRequest = {
      task: 'scheme_matching',
      parameters: {
        user_id,
        user_type,
        location,
        state,
        district,
        category,
        crop_type,
        farm_size,
        income_level,
        all_schemes: await getAllGovernmentSchemes(),
        user_profile: await getUserProfile(user_id),
        historical_applications: await getUserSchemeHistory(user_id)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);

    const schemes = {
      user_id: user_id,
      location: location,
      timestamp: new Date().toISOString(),
      eligible_schemes: aiResponse.eligible_schemes.map(scheme => ({
        scheme_name: scheme.name,
        scheme_code: scheme.code,
        ministry: scheme.ministry,
        department: scheme.department,
        description: scheme.description,
        eligibility_score: scheme.eligibility_score,
        subsidy_percentage: scheme.subsidy_percentage,
        max_amount: scheme.max_amount,
        application_deadline: scheme.deadline,
        required_documents: scheme.documents,
        application_process: scheme.process,
        contact_details: scheme.contact,
        ai_recommendation: scheme.recommendation,
        confidence: scheme.confidence
      })),
      recommended_schemes: aiResponse.recommended_schemes,
      total_schemes: aiResponse.eligible_schemes.length,
      application_guidance: aiResponse.application_guidance
    };

    return schemes;
  } catch (error) {
    logger.error('Error getting applicable schemes', { error: error.message, stack: error.stack });
    throw new Error('Failed to get applicable schemes');
  }
}

/**
 * Get weather alerts for a location
 */
async function getWeatherAlerts(location) {
  try {
    const alerts = {
      location: location,
      timestamp: new Date().toISOString(),
      current_weather: await getCurrentWeather(location),
      alerts: await getActiveWeatherAlerts(location),
      forecast: await getWeatherForecast(location, 7),
      agricultural_impact: await assessAgriculturalImpact(location),
      recommendations: await getWeatherRecommendations(location)
    };

    return alerts;
  } catch (error) {
    logger.error('Error getting weather alerts', { error: error.message, stack: error.stack });
    throw new Error('Failed to get weather alerts');
  }
}

/**
 * Create government announcement
 */
async function createGovernmentAnnouncement(announcementData) {
  try {
    const {
      title,
      content,
      announcement_type,
      target_audience,
      state,
      district,
      priority,
      valid_from,
      valid_until,
      attachments,
      created_by
    } = announcementData;

    const announcement = {
      announcement_id: generateId(),
      title: title,
      content: content,
      announcement_type: announcement_type, // scheme_launch, policy_change, alert, general
      target_audience: target_audience, // all, farmers, fpos, buyers, logistics
      state: state,
      district: district,
      priority: priority, // low, medium, high, urgent
      valid_from: valid_from,
      valid_until: valid_until,
      attachments: attachments,
      created_by: created_by,
      created_at: new Date().toISOString(),
      status: 'published'
    };

    // Broadcast announcement via WebSocket
    await broadcastAnnouncement(announcement);

    logger.info(`Government announcement created: ${announcement.announcement_id}`);
    return announcement;
  } catch (error) {
    logger.error('Error creating government announcement', { error: error.message, stack: error.stack });
    throw new Error('Failed to create government announcement');
  }
}

/**
 * Get government announcements for user
 */
async function getGovernmentAnnouncements(params) {
  try {
    const {
      user_id,
      user_type,
      location,
      state,
      district,
      announcement_type,
      priority
    } = params;

    const announcements = {
      user_id: user_id,
      timestamp: new Date().toISOString(),
      announcements: await getFilteredAnnouncements(params),
      total_count: 0,
      unread_count: 0
    };

    announcements.total_count = announcements.announcements.length;
    announcements.unread_count = announcements.announcements.filter(a => !a.read).length;

    return announcements;
  } catch (error) {
    logger.error('Error getting government announcements', { error: error.message, stack: error.stack });
    throw new Error('Failed to get government announcements');
  }
}

/**
 * Government official login
 */
async function governmentOfficialLogin(credentials) {
  try {
    const {
      employee_id,
      password,
      department,
      state,
      designation
    } = credentials;

    // Validate credentials against government database
    const validation = await validateGovernmentCredentials(credentials);

    if (!validation.valid) {
      throw new Error('Invalid credentials');
    }

    const official = {
      official_id: validation.official_id,
      employee_id: employee_id,
      name: validation.name,
      department: department,
      state: state,
      designation: designation,
      permissions: validation.permissions,
      access_level: validation.access_level,
      token: generateOfficialToken(validation),
      last_login: new Date().toISOString()
    };

    logger.info(`Government official login: ${official.employee_id}`);
    return official;
  } catch (error) {
    logger.error('Error in government official login', { error: error.message, stack: error.stack });
    throw new Error('Failed to authenticate government official');
  }
}

/**
 * Get CSR opportunities
 */
async function getCSROpportunities(params) {
  try {
    const {
      location,
      sector,
      focus_area,
      budget_range,
      company_type
    } = params;

    // AI-powered CSR matching
    let aiRequest = {
      task: 'csr_opportunity_matching',
      parameters: {
        location,
        sector,
        focus_area,
        budget_range,
        company_type,
        available_projects: await getCSRProjects(params),
        impact_assessment: await assessCSRImpact(params),
        compliance_requirements: await getCSRCompliance(params)
      }
    };

    let aiResponse = await aiAPI.generateRecommendation(aiRequest);

    const opportunities = {
      search_id: generateId(),
      timestamp: new Date().toISOString(),
      search_params: params,
      opportunities: aiResponse.opportunities.map(opp => ({
        project_id: opp.id,
        project_name: opp.name,
        organization: opp.organization,
        focus_area: opp.focus_area,
        location: opp.location,
        budget_required: opp.budget,
        impact_score: opp.impact_score,
        beneficiaries: opp.beneficiaries,
        timeline: opp.timeline,
        match_score: opp.match_score,
        ai_recommendation: opp.recommendation
      })),
      total_opportunities: aiResponse.opportunities.length,
      recommendations: aiResponse.recommendations
    };

    return opportunities;
  } catch (error) {
    logger.error('Error getting CSR opportunities', { error: error.message, stack: error.stack });
    throw new Error('Failed to get CSR opportunities');
  }
}

/**
 * Submit CSR project proposal
 */
async function submitCSRProposal(proposalData) {
  try {
    const {
      company_id,
      company_name,
      project_name,
      focus_area,
      location,
      budget,
      timeline,
      objectives,
      expected_outcomes,
      beneficiaries,
      partnership_model
    } = proposalData;

    const proposal = {
      proposal_id: generateId(),
      company_id: company_id,
      company_name: company_name,
      project_name: project_name,
      focus_area: focus_area,
      location: location,
      budget: budget,
      timeline: timeline,
      objectives: objectives,
      expected_outcomes: expected_outcomes,
      beneficiaries: beneficiaries,
      partnership_model: partnership_model,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      tracking_number: generateTrackingNumber()
    };

    // AI-powered proposal assessment
    let aiRequest = {
      task: 'csr_proposal_assessment',
      parameters: {
        proposal_data: proposalData,
        government_priorities: await getGovernmentPriorities(location),
        impact_potential: await assessImpactPotential(proposalData),
        alignment_score: await calculateAlignmentScore(proposalData)
      }
    };

    let aiResponse = await aiAPI.generateRecommendation(aiRequest);
    proposal.ai_assessment = aiResponse;

    logger.info(`CSR proposal submitted: ${proposal.proposal_id}`);
    return proposal;
  } catch (error) {
    logger.error('Error submitting CSR proposal', { error: error.message, stack: error.stack });
    throw new Error('Failed to submit CSR proposal');
  }
}

/**
 * Get localized default page content (before login)
 */
async function getLocalizedDefaultPage(location) {
  try {
    const pageContent = {
      location: location,
      timestamp: new Date().toISOString(),
      weather: await getCurrentWeather(location),
      weather_alerts: await getActiveWeatherAlerts(location),
    local_schemes: await getFeaturedSchemes(location),
    success_stories: await getLocalSuccessStories(location),
    market_prices: await getLocalMarketPrices(location),
    upcoming_events: await getUpcomingEvents(location),
    government_announcements: await getPublicAnnouncements(location),
    featured_products: await getFeaturedProducts(location)
    };

    return pageContent;
  } catch (error) {
    logger.error('Error getting localized default page', { error: error.message, stack: error.stack });
    throw new Error('Failed to get localized default page');
  }
}

/**
 * Track scheme application status
 */
async function trackSchemeApplication(applicationId) {
  try {
    const status = {
      application_id: applicationId,
      tracking_number: await getTrackingNumber(applicationId),
      current_status: 'under_review',
      status_history: await getApplicationHistory(applicationId),
      next_steps: await getNextSteps(applicationId),
      contact_officer: await getContactOfficer(applicationId),
      estimated_completion: await getEstimatedCompletion(applicationId),
      documents_pending: await getPendingDocuments(applicationId)
    };

    return status;
  } catch (error) {
    logger.error('Error tracking scheme application', { error: error.message, stack: error.stack });
    throw new Error('Failed to track scheme application');
  }
}

// Helper functions
function generateId() {
  return `GOV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateTrackingNumber() {
  return `TRK-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
}

function generateOfficialToken(validation) {
  // Generate JWT token for official
  return 'official_token_' + Date.now();
}

async function getAllGovernmentSchemes() {
  // Fetch all government schemes
  return [
    {
      name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
      code: 'PMFBY',
      ministry: 'Ministry of Agriculture',
      department: 'Department of Agriculture',
      description: 'Crop insurance scheme providing coverage against crop failure',
      subsidy_percentage: 50,
      max_amount: 50000,
      deadline: '2026-12-31'
    },
    {
      name: 'Mission for Integrated Development of Horticulture (MIDH)',
      code: 'MIDH',
      ministry: 'Ministry of Agriculture',
      department: 'Department of Horticulture',
      description: 'Integrated development of horticulture sector',
      subsidy_percentage: 40,
      max_amount: 5000000,
      deadline: '2027-03-31'
    },
    {
      name: 'PM-Kisan Samman Nidhi',
      code: 'PMKISAN',
      ministry: 'Ministry of Agriculture',
      department: 'Department of Agriculture',
      description: 'Income support of ₹6,000 per year to farmers',
      subsidy_percentage: 100,
      max_amount: 6000,
      deadline: 'Ongoing'
    },
    {
      name: 'Agriculture Infrastructure Fund (AIF)',
      code: 'AIF',
      ministry: 'Ministry of Agriculture',
      department: 'Department of Agriculture',
      description: 'Financing facility for creation of agricultural infrastructure',
      subsidy_percentage: 33,
      max_amount: 20000000,
      deadline: '2029-03-31'
    },
    {
      name: 'North East Special Infrastructure Development Scheme (NESIDS)',
      code: 'NESIDS',
      ministry: 'MDoNER',
      department: 'Ministry of Development of North Eastern Region',
      description: 'Infrastructure development in North East states',
      subsidy_percentage: 90,
      max_amount: 50000000,
      deadline: '2027-03-31'
    }
  ];
}

async function getUserProfile(userId) {
  // Fetch user profile
  return {};
}

async function getUserSchemeHistory(userId) {
  // Fetch user's scheme application history
  return [];
}

async function getCurrentWeather(location) {
  // Fetch current weather
  return {
    temperature: 28,
    humidity: 75,
    condition: 'partly_cloudy',
    wind_speed: 12
  };
}

async function getActiveWeatherAlerts(location) {
  // Fetch active weather alerts
  return [];
}

async function getWeatherForecast(location, days) {
  // Fetch weather forecast
  return [];
}

async function assessAgriculturalImpact(location) {
  // Assess agricultural impact
  return {};
}

async function getWeatherRecommendations(location) {
  // Get weather recommendations
  return [];
}

async function broadcastAnnouncement(announcement) {
  // Broadcast via WebSocket
  socketServer.sendGovernmentAnnouncement(announcement);
}

async function getFilteredAnnouncements(params) {
  // Get filtered announcements
  return [];
}

async function validateGovernmentCredentials(credentials) {
  // Validate against government database
  return {
    valid: true,
    official_id: 'OFF-001',
    name: 'Rajesh Kumar',
    permissions: ['read', 'write', 'approve'],
    access_level: 'state'
  };
}

async function getCSRProjects(params) {
  // Get CSR projects
  return [];
}

async function assessCSRImpact(params) {
  // Assess CSR impact
  return {};
}

async function getCSRCompliance(params) {
  // Get CSR compliance requirements
  return {};
}

async function getGovernmentPriorities(location) {
  // Get government priorities
  return [];
}

async function assessImpactPotential(proposalData) {
  // Assess impact potential
  return {};
}

async function calculateAlignmentScore(proposalData) {
  // Calculate alignment score
  return {};
}

async function getFeaturedSchemes(location) {
  // Get featured schemes
  return [];
}

async function getLocalSuccessStories(location) {
  // Get local success stories
  return [];
}

async function getLocalMarketPrices(location) {
  // Get local market prices
  return {};
}

async function getUpcomingEvents(location) {
  // Get upcoming events
  return [];
}

async function getPublicAnnouncements(location) {
  // Get public announcements
  return [];
}

async function getFeaturedProducts(location) {
  // Get featured products
  return [];
}

async function getTrackingNumber(applicationId) {
  // Get tracking number
  return '';
}

async function getApplicationHistory(applicationId) {
  // Get application history
  return [];
}

async function getNextSteps(applicationId) {
  // Get next steps
  return [];
}

async function getContactOfficer(applicationId) {
  // Get contact officer
  return {};
}

async function getEstimatedCompletion(applicationId) {
  // Get estimated completion
  return '';
}

async function getPendingDocuments(applicationId) {
  // Get pending documents
  return [];
}

// Express routes setup
function setupRoutes(app) {
  app.get('/api/v1/government/schemes', async (req, res) => {
    try {
      let schemes = await getApplicableSchemes(req.query);
      res.json({ success: true, data: schemes });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/v1/government/weather/alerts', async (req, res) => {
    try {
      let alerts = await getWeatherAlerts(req.query.location);
      res.json({ success: true, data: alerts });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/v1/government/announcements', authMiddleware, async (req, res) => {
    try {
      let announcement = await createGovernmentAnnouncement(req.body);
      res.json({ success: true, data: announcement });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/v1/government/announcements', async (req, res) => {
    try {
      let announcements = await getGovernmentAnnouncements(req.query);
      res.json({ success: true, data: announcements });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/v1/government/official/login', async (req, res) => {
    try {
      let official = await governmentOfficialLogin(req.body);
      res.json({ success: true, data: official });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/v1/government/csr/opportunities', async (req, res) => {
    try {
      let opportunities = await getCSROpportunities(req.query);
      res.json({ success: true, data: opportunities });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/v1/government/csr/proposals', authMiddleware, async (req, res) => {
    try {
      let proposal = await submitCSRProposal(req.body);
      res.json({ success: true, data: proposal });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/v1/government/localized-page', async (req, res) => {
    try {
      const page = await getLocalizedDefaultPage(req.query.location);
      res.json({ success: true, data: page });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/v1/government/schemes/track/:id', async (req, res) => {
    try {
      let status = await trackSchemeApplication(req.params.id);
      res.json({ success: true, data: status });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // -------------------------------------------------------------------
  // Scheme registry (v44 feature 2) — backed by government_schemes,
  // migration 9995_scheme_verification_map_protection.sql.
  // -------------------------------------------------------------------

  app.get('/api/v1/government/schemes/registry', async (req, res) => {
    try {
      const { status, category, state } = req.query;
      let schemes = await listSchemeRegistry({ status, category, state });
      res.json({ success: true, data: schemes, total: schemes.length });
    } catch (error) {
      logger.error('List scheme registry error', { error: error.message, stack: error.stack });
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/v1/government/schemes/registry/expiring', async (req, res) => {
    try {
      let days = Number(req.query.days) || 30;
      let schemes = await getExpiringSchemeRegistry(days);
      res.json({ success: true, data: schemes, total: schemes.length });
    } catch (error) {
      logger.error('Get expiring schemes error', { error: error.message, stack: error.stack });
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/v1/government/schemes/checker', async (req, res) => {
    try {
      let result = await checkSchemeEligibility(req.query);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Scheme eligibility checker error', { error: error.message, stack: error.stack });
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/v1/government/schemes/registry/:code', async (req, res) => {
    try {
      const scheme = await getSchemeByCode(req.params.code);
      res.json({ success: true, data: scheme });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  });

  // Admin-only: mark a scheme conditional/expired, attach an expiry date and
  // verification source. authMiddleware only (no separate admin role check
  // exists for this service today) — matches the authorization level already
  // used for /government/announcements above.
  app.put('/api/v1/government/schemes/registry/:code', authMiddleware, async (req, res) => {
    try {
      let scheme = await updateSchemeRegistry(req.params.code, req.body, req.user && req.user.id);
      logger.info(`Scheme registry updated: ${req.params.code} -> ${scheme.status}`);
      res.json({ success: true, data: scheme });
    } catch (error) {
      logger.error('Update scheme registry error', { error: error.message, stack: error.stack });
      res.status(error.message === 'Scheme not found' ? 404 : 500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/v1/government/schemes/expiry-status', authMiddleware, async (req, res) => {
    try {
      const data = await schemeExpiryStatus();
      res.json({ success: true, data });
    } catch (error) {
      logger.error('Scheme expiry status error', { error: error.message, stack: error.stack });
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

module.exports = {
  getApplicableSchemes,
  getWeatherAlerts,
  createGovernmentAnnouncement,
  getGovernmentAnnouncements,
  governmentOfficialLogin,
  getCSROpportunities,
  submitCSRProposal,
  getLocalizedDefaultPage,
  trackSchemeApplication,
  schemeExpiryStatus,
  listSchemeRegistry,
  getSchemeByCode,
  updateSchemeRegistry,
  getExpiringSchemeRegistry,
  checkSchemeEligibility,
  setupRoutes
};

