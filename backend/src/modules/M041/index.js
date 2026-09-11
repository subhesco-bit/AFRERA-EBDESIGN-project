// M041 - Village ERP / Village Operating System
const express = require('express');
const router = express.Router();
const controller = require('./controller');
const authMiddleware = require('../../middleware/auth');

router.use(authMiddleware);

// Registry
router.get('/villages', controller.getVillages);
router.get('/villages/:villageId', controller.getVillage);
router.post('/villages', controller.createVillage);
router.put('/villages/:villageId', controller.updateVillage);
router.delete('/villages/:villageId', controller.deleteVillage);
router.post('/villages/:villageId/resources', controller.addVillageResource);
router.get('/villages/:villageId/analytics', controller.getVillageAnalytics);
router.get('/districts/:district/summary', controller.districtSummary);

// Village ERP / accounting
router.get('/villages/:villageId/finance', controller.getVillageFinance);
router.post('/villages/:villageId/finance/initialize', controller.initializeFinance);
router.post('/villages/:villageId/finance/journal', controller.postVillageJournal);

// Village master operational entities
router.get('/villages/:villageId/households', controller.listHouseholds);
router.post('/villages/:villageId/households', controller.createHousehold);
router.post('/households/:householdId/members', controller.addHouseholdMember);
router.get('/villages/:villageId/enterprises', controller.listEnterprises);
router.post('/villages/:villageId/enterprises', controller.createEnterprise);
router.get('/villages/:villageId/budgets', controller.listBudgets);
router.post('/villages/:villageId/budgets', controller.createBudget);
router.get('/villages/:villageId/erp-overview', controller.getERPOverview);

// Operational KPIs and workflow
router.get('/villages/:villageId/dashboard', controller.getDashboard);
router.post('/villages/:villageId/kpis', controller.upsertKPI);
router.post('/villages/:villageId/tasks', controller.createTask);
router.patch('/village-tasks/:taskId', controller.updateTask);

// AI decision support with persisted audit trail
router.post('/villages/:villageId/ai/insights', controller.generateAI);

// Village Project Design / DPR / Estimate / Funding / Subsidy Intelligence
router.get('/villages/:villageId/projects', controller.listProjects);
router.post('/villages/:villageId/projects', controller.createProject);
router.get('/projects/:projectId', controller.getProject);
router.post('/projects/:projectId/estimates', controller.createEstimate);
router.post('/projects/:projectId/funding-sources', controller.addFundingSource);
router.post('/projects/:projectId/subsidy-matches', controller.matchSubsidies);
router.get('/projects/:projectId/subsidy-ai-context', controller.buildSubsidyAIContext);

// Controlled administration of the Central/State scheme catalogue.
router.post('/scheme-catalogue', controller.upsertScheme);

module.exports = {
  controller: require('./controller'),
  service: require('./service'),
  erpService: require('./villageERPService'),
  projectIntelligenceService: require('./villageProjectIntelligenceService'),
  router,
};
