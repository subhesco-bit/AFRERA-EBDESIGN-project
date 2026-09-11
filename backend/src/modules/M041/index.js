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

// Operational KPIs and workflow
router.get('/villages/:villageId/dashboard', controller.getDashboard);
router.post('/villages/:villageId/kpis', controller.upsertKPI);
router.post('/villages/:villageId/tasks', controller.createTask);
router.patch('/village-tasks/:taskId', controller.updateTask);

// AI decision support with persisted audit trail
router.post('/villages/:villageId/ai/insights', controller.generateAI);

module.exports = {
  controller: require('./controller'),
  service: require('./service'),
  router,
};
