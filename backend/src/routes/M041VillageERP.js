/**
 * M041 Village ERP - Route Handler
 * Complete Village Operating System API
 * 36 endpoints for village management, projects, subsidies, finance, analytics
 */

const express = require('express');
const router = express.Router();

// Canonical M041 service composition.
// Core village/ERP operations and project/subsidy intelligence
// remain separate domain services and are composed here for this
// legacy route surface.
const M041CoreService = require('../modules/M041/service');
const M041ProjectService = require('../modules/M041/villageProjectIntelligenceService');

const getService = (req) => ({
  ...M041CoreService,
  ...M041ProjectService,

  // Legacy route aliases -> canonical core contracts.
  getVillage: M041CoreService.getVillageProfile,
  districtSummary: M041CoreService.getDistrictEconomicSummary,
  initializeFinance: M041CoreService.ensureVillageFinance,
  getDashboard: M041CoreService.getVillageDashboard,
  createTask: M041CoreService.createVillageTask,
  updateTask: M041CoreService.updateVillageTask,
  upsertKPI: M041CoreService.upsertVillageKPI,
  generateAI: M041CoreService.generateVillageAIInsights,

  // Legacy offset pagination -> canonical filter/page contract.
  getVillages: (limit = 10, offset = 0) => {
    const safeLimit = Math.max(parseInt(limit, 10) || 10, 1);
    const safeOffset = Math.max(parseInt(offset, 10) || 0, 0);

    return M041CoreService.getVillages({
      limit: safeLimit,
      page: Math.floor(safeOffset / safeLimit) + 1,
    });
  },

  // Preserve canonical project filtering from the request query.
  listProjects: (villageId) =>
    M041ProjectService.listProjects(villageId, req.query || {}),

  // Preserve authenticated audit attribution.
  createProject: (villageId, data) =>
    M041ProjectService.createProject(
      villageId,
      data,
      req.user?.id
    ),

  createEstimate: (projectId, data) =>
    M041ProjectService.createEstimate(
      projectId,
      data,
      req.user?.id
    ),
});

// ==================== VILLAGE MANAGEMENT (11 endpoints) ====================

/**
 * GET /api/v1/backend-modules/M041/getVillages
 * List all villages with pagination
 * Query: limit=10, offset=0
 */
router.get('/getVillages', async (req, res) => {
  try {
    const service = getService(req);
    const { limit = 10, offset = 0 } = req.query;
    const result = await service.getVillages(parseInt(limit), parseInt(offset));
    res.json(result);
  } catch (error) {
    console.error('getVillages error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/backend-modules/M041/getVillage/:villageId
 * Get single village details
 */
router.get('/getVillage/:villageId', async (req, res) => {
  try {
    const service = getService(req);
    const village = await service.getVillage(req.params.villageId);
    if (!village) {
      return res.status(404).json({ error: 'Village not found' });
    }
    res.json(village);
  } catch (error) {
    console.error('getVillage error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/backend-modules/M041/createVillage
 * Create new village
 * Body: { name, state, district, block, gram_panchayat, pincode?, ... }
 */
router.post('/createVillage', async (req, res) => {
  try {
    const service = getService(req);
    const village = await service.createVillage(req.body);
    res.status(201).json(village);
  } catch (error) {
    console.error('createVillage error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/v1/backend-modules/M041/updateVillage/:villageId
 * Update village
 */
router.put('/updateVillage/:villageId', async (req, res) => {
  try {
    const service = getService(req);
    const village = await service.updateVillage(req.params.villageId, req.body);
    res.json(village);
  } catch (error) {
    console.error('updateVillage error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/v1/backend-modules/M041/deleteVillage/:villageId
 * Archive village (soft delete)
 */
router.delete('/deleteVillage/:villageId', async (req, res) => {
  try {
    const service = getService(req);
    await service.deleteVillage(req.params.villageId);
    res.json({ success: true, message: 'Village archived' });
  } catch (error) {
    console.error('deleteVillage error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/v1/backend-modules/M041/addVillageResource
 * Add resource to village (roads, electricity, water, healthcare, education)
 */
router.post('/addVillageResource', async (req, res) => {
  try {
    const service = getService(req);
    const resource = await service.addVillageResource(req.body);
    res.status(201).json(resource);
  } catch (error) {
    console.error('addVillageResource error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/v1/backend-modules/M041/getVillageAnalytics/:villageId
 * Get village analytics (KPIs, progress, metrics)
 */
router.get('/getVillageAnalytics/:villageId', async (req, res) => {
  try {
    const service = getService(req);
    const analytics = await service.getVillageAnalytics(req.params.villageId);
    res.json(analytics);
  } catch (error) {
    console.error('getVillageAnalytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/backend-modules/M041/getVillageFinance/:villageId
 * Get village financial data
 */
router.get('/getVillageFinance/:villageId', async (req, res) => {
  try {
    const service = getService(req);
    const finance = await service.getVillageFinance(req.params.villageId);
    res.json(finance);
  } catch (error) {
    console.error('getVillageFinance error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/backend-modules/M041/initializeFinance/:villageId
 * Initialize village finance (create cost centers, budget structure)
 */
router.post('/initializeFinance/:villageId', async (req, res) => {
  try {
    const service = getService(req);
    const finance = await service.initializeFinance(req.params.villageId);
    res.json(finance);
  } catch (error) {
    console.error('initializeFinance error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/v1/backend-modules/M041/getDashboard/:villageId
 * Get village dashboard (overview of all metrics)
 */
router.get('/getDashboard/:villageId', async (req, res) => {
  try {
    const service = getService(req);
    const dashboard = await service.getDashboard(req.params.villageId);
    res.json(dashboard);
  } catch (error) {
    console.error('getDashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/backend-modules/M041/districtSummary/:district
 * Get district-level rollup (all villages in district)
 */
router.get('/districtSummary/:district', async (req, res) => {
  try {
    const service = getService(req);
    const summary = await service.districtSummary(req.params.district);
    res.json(summary);
  } catch (error) {
    console.error('districtSummary error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== PROJECT MANAGEMENT (8 endpoints) ====================

/**
 * GET /api/v1/backend-modules/M041/listProjects/:villageId
 * List village projects
 */
router.get('/listProjects/:villageId', async (req, res) => {
  try {
    const service = getService(req);
    const projects = await service.listProjects(req.params.villageId);
    res.json(projects);
  } catch (error) {
    console.error('listProjects error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/backend-modules/M041/createProject/:villageId
 * Create village project
 */
router.post('/createProject/:villageId', async (req, res) => {
  try {
    const service = getService(req);
    const project = await service.createProject(req.params.villageId, req.body);
    res.status(201).json(project);
  } catch (error) {
    console.error('createProject error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/v1/backend-modules/M041/getProject/:projectId
 * Get project details
 */
router.get('/getProject/:projectId', async (req, res) => {
  try {
    const service = getService(req);
    const project = await service.getProject(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    console.error('getProject error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/backend-modules/M041/createEstimate/:projectId
 * Create project estimate (BOQ)
 */
router.post('/createEstimate/:projectId', async (req, res) => {
  try {
    const service = getService(req);
    const estimate = await service.createEstimate(req.params.projectId, req.body);
    res.status(201).json(estimate);
  } catch (error) {
    console.error('createEstimate error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/v1/backend-modules/M041/addFundingSource/:projectId
 * Add funding source to project
 */
router.post('/addFundingSource/:projectId', async (req, res) => {
  try {
    const service = getService(req);
    const funding = await service.addFundingSource(req.params.projectId, req.body);
    res.status(201).json(funding);
  } catch (error) {
    console.error('addFundingSource error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/v1/backend-modules/M041/buildSubsidyAIContext/:projectId
 * Build AI context for subsidy analysis
 */
router.get('/buildSubsidyAIContext/:projectId', async (req, res) => {
  try {
    const service = getService(req);
    const context = await service.buildSubsidyAIContext(req.params.projectId);
    res.json(context);
  } catch (error) {
    console.error('buildSubsidyAIContext error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/backend-modules/M041/matchSubsidies/:projectId
 * AI-powered government scheme matching for project
 */
router.post('/matchSubsidies/:projectId', async (req, res) => {
  try {
    const service = getService(req);
    const subsidies = await service.matchSubsidies(req.params.projectId);
    res.json(subsidies);
  } catch (error) {
    console.error('matchSubsidies error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/backend-modules/M041/upsertScheme
 * Upsert (create or update) government scheme
 */
router.post('/upsertScheme', async (req, res) => {
  try {
    const service = getService(req);
    const scheme = await service.upsertScheme(req.body);
    res.json(scheme);
  } catch (error) {
    console.error('upsertScheme error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ==================== KPI & WORKFLOW (5 endpoints) ====================

/**
 * POST /api/v1/backend-modules/M041/upsertKPI/:villageId
 * Upsert KPI for village
 */
router.post('/upsertKPI/:villageId', async (req, res) => {
  try {
    const service = getService(req);
    const kpi = await service.upsertKPI(req.params.villageId, req.body);
    res.json(kpi);
  } catch (error) {
    console.error('upsertKPI error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/v1/backend-modules/M041/createTask/:villageId
 * Create task/workflow item for village
 */
router.post('/createTask/:villageId', async (req, res) => {
  try {
    const service = getService(req);
    const task = await service.createTask(req.params.villageId, req.body);
    res.status(201).json(task);
  } catch (error) {
    console.error('createTask error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * PATCH /api/v1/backend-modules/M041/updateTask/:taskId
 * Update task status
 */
router.patch('/updateTask/:taskId', async (req, res) => {
  try {
    const service = getService(req);
    const task = await service.updateTask(req.params.taskId, req.body);
    res.json(task);
  } catch (error) {
    console.error('updateTask error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/v1/backend-modules/M041/postVillageJournal/:villageId
 * Post entry to village journal (ERP transaction)
 */
router.post('/postVillageJournal/:villageId', async (req, res) => {
  try {
    const service = getService(req);
    const entry = await service.postVillageJournal(req.params.villageId, req.body);
    res.status(201).json(entry);
  } catch (error) {
    console.error('postVillageJournal error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/v1/backend-modules/M041/generateAI/:villageId
 * Generate AI-powered recommendations
 */
router.post('/generateAI/:villageId', async (req, res) => {
  try {
    const service = getService(req);
    const response = await service.generateAI(req.params.villageId, req.body);
    res.json(response);
  } catch (error) {
    console.error('generateAI error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== ERROR HANDLER ====================

router.use((error, req, res, next) => {
  console.error('M041 Route Error:', error);
  res.status(error.statusCode || 500).json({
    error: error.message || 'Internal server error',
    service: 'M041VillageERP'
  });
});

module.exports = router;
