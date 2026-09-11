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

// Geography + location intelligence
router.get('/villages/:villageId/geolocation', controller.getVillageGeo);
router.put('/villages/:villageId/geolocation', controller.updateVillageGeo);
router.get('/villages/:villageId/logistics/nearest', controller.getNearestFacilities);
router.post('/logistics/facilities', controller.upsertLogisticsFacility);

// Village economy / production / consumption / market flows
router.get('/villages/:villageId/economy/balance', controller.getEconomicBalance);
router.post('/villages/:villageId/economy/production', controller.recordProduction);
router.post('/villages/:villageId/economy/flows', controller.recordEconomicFlow);
router.get('/villages/:villageId/economy/production-potential', controller.getProductionPotential);
router.put('/villages/:villageId/economy/production-potential', controller.upsertProductionPotential);

// Village external needs and SUBH supply layer
router.get('/supply-catalog', controller.listSupplyCatalog);
router.post('/supply-catalog', controller.upsertSupplyCatalogItem);
router.post('/villages/:villageId/external-demand', controller.createExternalDemand);
router.get('/villages/:villageId/external-supply-plan', controller.getExternalSupplyPlan);
router.post('/villages/:villageId/supply-orders', controller.createSupplyOrder);
router.get('/villages/:villageId/supply-orders', controller.listSupplyOrders);
router.post('/supply-orders/:orderId/lines', controller.addSupplyOrderLine);
router.patch('/supply-orders/:orderId', controller.updateSupplyOrder);
router.get('/villages/:villageId/ai/supply-context', controller.getAISupplyContext);

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
router.post('/villages/:villageId/ai/insights', controller.generateAI);

// Village Project Design / DPR / Estimate / Funding / Subsidy Intelligence
router.get('/villages/:villageId/projects', controller.listProjects);
router.post('/villages/:villageId/projects', controller.createProject);
router.get('/projects/:projectId', controller.getProject);
router.post('/projects/:projectId/estimates', controller.createEstimate);
router.post('/projects/:projectId/funding-sources', controller.addFundingSource);
router.post('/projects/:projectId/subsidy-matches', controller.matchSubsidies);
router.get('/projects/:projectId/subsidy-ai-context', controller.buildSubsidyAIContext);
router.post('/scheme-catalogue', controller.upsertScheme);

// Village completeness / public infrastructure / resilience
router.get('/villages/:villageId/completeness', controller.getCompleteness);
router.get('/villages/:villageId/infrastructure-profile', controller.getInfrastructureProfile);
router.get('/villages/:villageId/readiness', controller.getReadinessSnapshot);

module.exports = {
  controller,
  service: require('./service'),
  erpService: require('./villageERPService'),
  projectIntelligenceService: require('./villageProjectIntelligenceService'),
  economyGeoService: require('./villageEconomyGeoService'),
  router,
};
