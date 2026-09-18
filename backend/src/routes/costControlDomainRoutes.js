/**
 * Real backend routes for CostControlPage.jsx, backed by
 * services/legacy/costControlService.js. Near-exact 1:1 match; only
 * approveBudget takes an extra approverId arg the page doesn't pass -
 * filled from the authenticated user when available.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/costControlService');

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

const wrap = (fn) => async (req, res) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.post('/cost-control/cost-center', wrap((req) => svc.createCostCenter(req.body)));
router.get('/cost-control/cost-centers/:companyId', wrap((req) => svc.getCostCenters(req.params.companyId, req.query)));
router.get('/cost-control/cost-center/:costCenterId', wrap((req) => svc.getCostCenter(req.params.costCenterId)));
router.get('/cost-control/cost-center/:costCenterId/actuals', wrap((req) => svc.getCostCenterActuals(req.params.costCenterId, req.query)));

router.post('/cost-control/profit-center', wrap((req) => svc.createProfitCenter(req.body)));
router.get('/cost-control/profit-centers/:companyId', wrap((req) => svc.getProfitCenters(req.params.companyId, req.query)));

router.post('/cost-control/budget', wrap((req) => svc.createBudget(req.body)));
router.get('/cost-control/budgets/:companyId', wrap((req) => svc.getBudgets(req.params.companyId, req.query)));
router.get('/cost-control/budget/:budgetId', wrap((req) => svc.getBudget(req.params.budgetId)));
router.post('/cost-control/budget/:budgetId/submit', wrap((req) => svc.submitBudget(req.params.budgetId)));
router.post('/cost-control/budget/:budgetId/approve', wrap((req) => svc.approveBudget(req.params.budgetId, req.user?.id, req.body.approved)));
router.post('/cost-control/budget/:budgetId/line', wrap((req) => svc.addBudgetLine(req.params.budgetId, req.body)));
router.get('/cost-control/budget/:budgetId/lines', wrap((req) => svc.getBudgetLines(req.params.budgetId)));
router.get('/cost-control/budget/:budgetId/vs-actual', wrap((req) => svc.getBudgetVsActual(req.params.budgetId)));
router.get('/cost-control/budget/:budgetId/cost-reduction-recommendations', wrap((req) => svc.getCostReductionRecommendations(req.params.budgetId)));

module.exports = router;
