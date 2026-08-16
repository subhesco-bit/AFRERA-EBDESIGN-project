// M076 - Water Budgeting
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/budgets', controller.createWaterBudget);
router.get('/budgets/:id/usage', controller.trackWaterUsage);
router.post('/budgets/:id/optimize', controller.optimizeWaterAllocation);
router.get('/budgets/:id/report', controller.generateBudgetReport);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
