// M051 - FPO Registration
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/fpos', controller.createFPO);
router.get('/fpos', controller.listFPOs);
router.get('/fpos/:id', controller.getFPO);
router.put('/fpos/:id', controller.updateFPO);
router.delete('/fpos/:id', controller.deleteFPO);
router.post('/fpos/:id/members', controller.addFPOMember);
router.get('/fpos/:id/members', controller.getFPOMembers);
router.get('/fpos/:id/financial-summary', controller.getFPOFinancialSummary);
router.post('/fpos/:id/transactions', controller.recordFPOTransaction);
router.get('/fpos/:id/performance-report', controller.generateFPOPerformanceReport);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
