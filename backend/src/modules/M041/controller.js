const villageService = require('./service');
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
}

module.exports = new M041Controller();
