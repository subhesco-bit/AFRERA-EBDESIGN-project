const villageService = require('./service');
const villageERPService = require('./villageERPService');
const villageProjectService = require('./villageProjectIntelligenceService');
const villageEconomyGeoService = require('./villageEconomyGeoService');
const villageProductionPotentialService = require('./villageProductionPotentialService');
const villageCompletenessService = require('./villageCompletenessService');
const { logger } = require('../../utils/logger');
const { sendSuccess, sendError } = require('../../utils/response');

async function execute(res, label, operation, fallbackStatus = 400) {
  try { return sendSuccess(res, await operation()); }
  catch (error) { logger.error(`M041 ${label} failed`, error); return sendError(res, error, error.statusCode || fallbackStatus); }
}

class M041Controller {
  getVillages(req, res) { return execute(res, 'getVillages', () => villageService.getVillages(req.query)); }
  getVillage(req, res) { return execute(res, 'getVillage', () => villageService.getVillageProfile(req.params.villageId), 404); }
  createVillage(req, res) { return execute(res, 'createVillage', () => villageService.createVillage(req.body), 400); }
  updateVillage(req, res) { return execute(res, 'updateVillage', () => villageService.updateVillage(req.params.villageId, req.body)); }
  deleteVillage(req, res) { return execute(res, 'deleteVillage', () => villageService.deleteVillage(req.params.villageId), 404); }
  addVillageResource(req, res) { return execute(res, 'addVillageResource', () => villageService.addVillageResource(req.params.villageId, req.body)); }
  getVillageAnalytics(req, res) { return execute(res, 'getVillageAnalytics', () => villageService.getVillageAnalytics(req.params.villageId), 404); }
  getVillageFinance(req, res) { return execute(res, 'getVillageFinance', () => villageService.getVillageFinance(req.params.villageId), 404); }
  initializeFinance(req, res) { return execute(res, 'initializeFinance', () => villageService.ensureVillageFinance(req.params.villageId), 404); }
  postVillageJournal(req, res) { return execute(res, 'postVillageJournal', () => villageService.postVillageJournal(req.params.villageId, req.body)); }
  upsertKPI(req, res) { return execute(res, 'upsertKPI', () => villageService.upsertVillageKPI(req.params.villageId, req.body)); }
  getDashboard(req, res) { return execute(res, 'getDashboard', () => villageService.getVillageDashboard(req.params.villageId), 404); }
  createTask(req, res) { return execute(res, 'createTask', () => villageService.createVillageTask(req.params.villageId, req.body)); }
  updateTask(req, res) { return execute(res, 'updateTask', () => villageService.updateVillageTask(req.params.taskId, req.body), 404); }
  generateAI(req, res) { return execute(res, 'generateAI', () => villageService.generateVillageAIInsights(req.params.villageId, req.body || {}), 404); }
  districtSummary(req, res) { return execute(res, 'districtSummary', () => villageService.getDistrictEconomicSummary(req.params.district), 404); }

  listHouseholds(req, res) { return execute(res, 'listHouseholds', () => villageERPService.listHouseholds(req.params.villageId, req.query), 404); }
  createHousehold(req, res) { return execute(res, 'createHousehold', () => villageERPService.createHousehold(req.params.villageId, req.body), 404); }
  addHouseholdMember(req, res) { return execute(res, 'addHouseholdMember', () => villageERPService.addHouseholdMember(req.params.householdId, req.body), 404); }
  listEnterprises(req, res) { return execute(res, 'listEnterprises', () => villageERPService.listEnterprises(req.params.villageId), 404); }
  createEnterprise(req, res) { return execute(res, 'createEnterprise', () => villageERPService.createEnterprise(req.params.villageId, req.body), 404); }
  createBudget(req, res) { return execute(res, 'createBudget', () => villageERPService.createBudget(req.params.villageId, req.body), 404); }
  listBudgets(req, res) { return execute(res, 'listBudgets', () => villageERPService.listBudgets(req.params.villageId), 404); }
  getERPOverview(req, res) { return execute(res, 'getERPOverview', () => villageERPService.getERPOverview(req.params.villageId), 404); }

  listProjects(req, res) { return execute(res, 'listProjects', () => villageProjectService.listProjects(req.params.villageId, req.query), 404); }
  getProject(req, res) { return execute(res, 'getProject', () => villageProjectService.getProject(req.params.projectId), 404); }
  createProject(req, res) { return execute(res, 'createProject', () => villageProjectService.createProject(req.params.villageId, req.body, req.user?.id), 400); }
  createEstimate(req, res) { return execute(res, 'createEstimate', () => villageProjectService.createEstimate(req.params.projectId, req.body, req.user?.id), 400); }
  addFundingSource(req, res) { return execute(res, 'addFundingSource', () => villageProjectService.addFundingSource(req.params.projectId, req.body), 400); }
  matchSubsidies(req, res) { return execute(res, 'matchSubsidies', () => villageProjectService.matchSubsidies(req.params.projectId), 400); }
  buildSubsidyAIContext(req, res) { return execute(res, 'buildSubsidyAIContext', () => villageProjectService.buildSubsidyAIContext(req.params.projectId), 404); }
  upsertScheme(req, res) { return execute(res, 'upsertScheme', () => villageProjectService.upsertScheme(req.body), 400); }

  getVillageGeo(req, res) { return execute(res, 'getVillageGeo', () => villageEconomyGeoService.getVillageGeo(req.params.villageId), 404); }
  updateVillageGeo(req, res) { return execute(res, 'updateVillageGeo', () => villageEconomyGeoService.updateVillageGeo(req.params.villageId, req.body), 400); }
  upsertLogisticsFacility(req, res) { return execute(res, 'upsertLogisticsFacility', () => villageEconomyGeoService.upsertFacility(req.body), 400); }
  getNearestFacilities(req, res) { return execute(res, 'getNearestFacilities', () => villageEconomyGeoService.nearestFacilities(req.params.villageId, req.query.types ? String(req.query.types).split(',') : undefined), 404); }
  recordProduction(req, res) { return execute(res, 'recordProduction', () => villageEconomyGeoService.recordProduction(req.params.villageId, req.body), 400); }
  recordEconomicFlow(req, res) { return execute(res, 'recordEconomicFlow', () => villageEconomyGeoService.recordFlow(req.params.villageId, req.body), 400); }
  getEconomicBalance(req, res) { return execute(res, 'getEconomicBalance', () => villageEconomyGeoService.economicBalance(req.params.villageId, req.query), 404); }
  getProductionPotential(req, res) { return execute(res, 'getProductionPotential', () => villageProductionPotentialService.productionPotential(req.params.villageId, req.query), 404); }
  upsertProductionPotential(req, res) { return execute(res, 'upsertProductionPotential', () => villageProductionPotentialService.upsertProfile(req.params.villageId, req.body), 400); }

  getCompleteness(req, res) { return execute(res, 'getCompleteness', () => villageCompletenessService.getCompleteness(req.params.villageId), 404); }
  getInfrastructureProfile(req, res) { return execute(res, 'getInfrastructureProfile', () => villageCompletenessService.getInfrastructureProfile(req.params.villageId), 404); }
  getReadinessSnapshot(req, res) { return execute(res, 'getReadinessSnapshot', () => villageCompletenessService.readinessSnapshot(req.params.villageId), 404); }
}

module.exports = new M041Controller();
