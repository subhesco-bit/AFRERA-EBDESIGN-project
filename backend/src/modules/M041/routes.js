const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authenticate } = require('../../middleware/authMiddleware');

/** M041 — Village ERP / Village Operating System. Base path: /api/m041 */
router.use(authenticate);

// Village registry
router.get('/villages', controller.getVillages.bind(controller));
router.get('/villages/:villageId', controller.getVillage.bind(controller));
router.post('/villages', controller.createVillage.bind(controller));
router.put('/villages/:villageId', controller.updateVillage.bind(controller));
router.delete('/villages/:villageId', controller.deleteVillage.bind(controller));
router.post('/villages/:villageId/resources', controller.addVillageResource.bind(controller));
router.get('/villages/:villageId/analytics', controller.getVillageAnalytics.bind(controller));
router.get('/districts/:district/summary', controller.districtSummary.bind(controller));

// Geography + location intelligence
router.get('/villages/:villageId/geolocation', controller.getVillageGeo.bind(controller));
router.put('/villages/:villageId/geolocation', controller.updateVillageGeo.bind(controller));
router.get('/villages/:villageId/logistics/nearest', controller.getNearestFacilities.bind(controller));
router.post('/logistics/facilities', controller.upsertLogisticsFacility.bind(controller));

// Village economy / production / consumption / market flows
router.get('/villages/:villageId/economy/balance', controller.getEconomicBalance.bind(controller));
router.post('/villages/:villageId/economy/production', controller.recordProduction.bind(controller));
router.post('/villages/:villageId/economy/flows', controller.recordEconomicFlow.bind(controller));

// Production intensity and potential
router.get('/villages/:villageId/economy/production-potential', controller.getProductionPotential.bind(controller));
router.put('/villages/:villageId/economy/production-potential', controller.upsertProductionPotential.bind(controller));

// Village ERP / accounting
router.get('/villages/:villageId/finance', controller.getVillageFinance.bind(controller));
router.post('/villages/:villageId/finance/initialize', controller.initializeFinance.bind(controller));
router.post('/villages/:villageId/finance/journal', controller.postVillageJournal.bind(controller));

// Village master operational entities
router.get('/villages/:villageId/households', controller.listHouseholds.bind(controller));
router.post('/villages/:villageId/households', controller.createHousehold.bind(controller));
router.post('/households/:householdId/members', controller.addHouseholdMember.bind(controller));
router.get('/villages/:villageId/enterprises', controller.listEnterprises.bind(controller));
router.post('/villages/:villageId/enterprises', controller.createEnterprise.bind(controller));
router.get('/villages/:villageId/budgets', controller.listBudgets.bind(controller));
router.post('/villages/:villageId/budgets', controller.createBudget.bind(controller));
router.get('/villages/:villageId/erp-overview', controller.getERPOverview.bind(controller));

// Operational KPIs and workflow
router.get('/villages/:villageId/dashboard', controller.getDashboard.bind(controller));
router.post('/villages/:villageId/kpis', controller.upsertKPI.bind(controller));
router.post('/villages/:villageId/tasks', controller.createTask.bind(controller));
router.patch('/village-tasks/:taskId', controller.updateTask.bind(controller));

// AI decision support
router.post('/villages/:villageId/ai/insights', controller.generateAI.bind(controller));

// Village Project Design / DPR / Estimate / Funding / Subsidy Intelligence
router.get('/villages/:villageId/projects', controller.listProjects.bind(controller));
router.post('/villages/:villageId/projects', controller.createProject.bind(controller));
router.get('/projects/:projectId', controller.getProject.bind(controller));
router.post('/projects/:projectId/estimates', controller.createEstimate.bind(controller));
router.post('/projects/:projectId/funding-sources', controller.addFundingSource.bind(controller));
router.post('/projects/:projectId/subsidy-matches', controller.matchSubsidies.bind(controller));
router.get('/projects/:projectId/subsidy-ai-context', controller.buildSubsidyAIContext.bind(controller));
router.post('/scheme-catalogue', controller.upsertScheme.bind(controller));

module.exports = router;
