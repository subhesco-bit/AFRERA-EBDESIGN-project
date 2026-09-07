/**
 * Cost Control Routes — AF-CO ("Controlling").
 * Cost/profit centres and budget-vs-actual against the posted general ledger.
 * See backend/src/services/costControlService.js for scope notes and how
 * this differs from /api/v1/costs (landed-cost pricing) and the FPO cost
 * centre P&L served under /api/v1/rfq.
 */

const express = require('express');
const router = express.Router();
const costControlService = require('../services/legacy/costControlService');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/admin');

// Cost Centres
router.post('/cost-centers', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const costCenter = await costControlService.createCostCenter(req.body);
    res.json({ success: true, data: costCenter });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/cost-centers', authMiddleware, async (req, res) => {
  try {
    const { companyId, ...filters } = req.query;
    const costCenters = await costControlService.getCostCenters(companyId, filters);
    res.json({ success: true, data: costCenters });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/cost-centers/:costCenterId', authMiddleware, async (req, res) => {
  try {
    const costCenter = await costControlService.getCostCenter(req.params.costCenterId);
    res.json({ success: true, data: costCenter });
  } catch (error) {
    res.status(error.message === 'Cost centre not found' ? 404 : 400).json({ success: false, error: error.message });
  }
});

router.get('/cost-centers/:costCenterId/actuals', authMiddleware, async (req, res) => {
  try {
    const actuals = await costControlService.getCostCenterActuals(req.params.costCenterId, req.query);
    res.json({ success: true, data: actuals });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Profit Centres
router.post('/profit-centers', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const profitCenter = await costControlService.createProfitCenter(req.body);
    res.json({ success: true, data: profitCenter });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/profit-centers', authMiddleware, async (req, res) => {
  try {
    const { companyId, ...filters } = req.query;
    const profitCenters = await costControlService.getProfitCenters(companyId, filters);
    res.json({ success: true, data: profitCenters });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Budgets
router.post('/budgets', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const budget = await costControlService.createBudget(req.body);
    res.json({ success: true, data: budget });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/budgets', authMiddleware, async (req, res) => {
  try {
    const { companyId, ...filters } = req.query;
    const budgets = await costControlService.getBudgets(companyId, filters);
    res.json({ success: true, data: budgets });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/budgets/:budgetId', authMiddleware, async (req, res) => {
  try {
    const budget = await costControlService.getBudget(req.params.budgetId);
    res.json({ success: true, data: budget });
  } catch (error) {
    res.status(error.message === 'Budget not found' ? 404 : 400).json({ success: false, error: error.message });
  }
});

router.post('/budgets/:budgetId/submit', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const budget = await costControlService.submitBudget(req.params.budgetId);
    res.json({ success: true, data: budget });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/budgets/:budgetId/approve', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { approved = true } = req.body;
    const budget = await costControlService.approveBudget(req.params.budgetId, req.user.id, approved);
    res.json({ success: true, data: budget });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/budgets/:budgetId/lines', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const line = await costControlService.addBudgetLine(req.params.budgetId, req.body);
    res.json({ success: true, data: line });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/budgets/:budgetId/lines', authMiddleware, async (req, res) => {
  try {
    const lines = await costControlService.getBudgetLines(req.params.budgetId);
    res.json({ success: true, data: lines });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/budgets/:budgetId/vs-actual', authMiddleware, async (req, res) => {
  try {
    const report = await costControlService.getBudgetVsActual(req.params.budgetId);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/budgets/:budgetId/cost-reduction-recommendations', authMiddleware, async (req, res) => {
  try {
    const report = await costControlService.getCostReductionRecommendations(req.params.budgetId);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
