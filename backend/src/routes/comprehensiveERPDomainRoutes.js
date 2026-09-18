/**
 * Real backend routes for ComprehensiveERPPage.jsx's 46 action cards, backed
 * by services/legacy/comprehensiveERPService.js's 12 SAP-style sub-modules
 * (generalLedger, controlling, materialsManagement, salesDistribution,
 * productionPlanning, qualityManagement, plantMaintenance, humanResources,
 * projectSystem, treasury, assetManagement, businessIntelligence).
 *
 * Every entry below was verified against the page's actual onRun call
 * (frontend/src/pages/ComprehensiveERPPage.jsx) - method name, argument
 * shape, and which real service method it maps to (a few page method names
 * differ slightly from the real ones, e.g. getTrialBalance ->
 * generateTrialBalance; noted per entry).
 */
'use strict';

const express = require('express');
const router = express.Router();
const erp = require('../services/legacy/comprehensiveERPService');
const accounting = require('../services/finance/enterpriseAccountingService');

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

// Explicit journal lifecycle endpoints. The action-card compatibility routes
// below continue to work, while these expose draft review, controlled posting,
// reversal, period close and complete financial statements.
router.post('/accounting/journals', async (req, res) => {
  try { res.status(201).json({ success: true, data: await accounting.createDraftJournal(req.body) }); }
  catch (error) { res.status(400).json({ success: false, error: error.message }); }
});
router.get('/accounting/journals/:id', async (req, res) => {
  try { res.json({ success: true, data: await accounting.getJournal(req.params.id) }); }
  catch (error) { res.status(404).json({ success: false, error: error.message }); }
});
router.post('/accounting/journals/:id/post', async (req, res) => {
  try { res.json({ success: true, data: await accounting.postJournal(req.params.id, req.body.actorId) }); }
  catch (error) { res.status(400).json({ success: false, error: error.message }); }
});
router.post('/accounting/journals/:id/reverse', async (req, res) => {
  try { res.status(201).json({ success: true, data: await accounting.reverseJournal(req.params.id, req.body) }); }
  catch (error) { res.status(400).json({ success: false, error: error.message }); }
});
router.put('/accounting/periods/:id/status', async (req, res) => {
  try { res.json({ success: true, data: await accounting.setPeriodStatus(req.params.id, req.body.status, req.body.actorId) }); }
  catch (error) { res.status(400).json({ success: false, error: error.message }); }
});
router.get('/accounting/statements', async (req, res) => {
  try { res.json({ success: true, data: await accounting.financialStatements(req.query) }); }
  catch (error) { res.status(400).json({ success: false, error: error.message }); }
});

// { pageMethod, subModule, realMethod, argShape }
// argShape: 'body' = fn(req.body); 'query' = fn(req.query);
//           'idBody' = fn(req.params.id, req.body); 'idOnly' = fn(req.params.id)
const ACTIONS = [
  // generalLedger
  { pageMethod: 'createChartOfAccounts', subModule: 'generalLedger', realMethod: 'createChartOfAccounts', argShape: 'body' },
  { pageMethod: 'createGLAccount', subModule: 'generalLedger', realMethod: 'createGLAccount', argShape: 'body' },
  { pageMethod: 'postJournalEntry', subModule: 'generalLedger', realMethod: 'postJournalEntry', argShape: 'body' },
  { pageMethod: 'getTrialBalance', subModule: 'generalLedger', realMethod: 'generateTrialBalance', argShape: 'query' },
  { pageMethod: 'getBalanceSheet', subModule: 'generalLedger', realMethod: 'generateBalanceSheet', argShape: 'query' },
  { pageMethod: 'getProfitLoss', subModule: 'generalLedger', realMethod: 'generateProfitLoss', argShape: 'query' },
  { pageMethod: 'analyzeFinancialsAI', subModule: 'generalLedger', realMethod: 'analyzeFinancialsAI', argShape: 'query' },
  // controlling
  { pageMethod: 'createCostCenter', subModule: 'controlling', realMethod: 'createCostCenter', argShape: 'body' },
  { pageMethod: 'createProfitCenter', subModule: 'controlling', realMethod: 'createProfitCenter', argShape: 'body' },
  { pageMethod: 'postCostAllocation', subModule: 'controlling', realMethod: 'postCostAllocation', argShape: 'body' },
  { pageMethod: 'getCostCenterReport', subModule: 'controlling', realMethod: 'generateCostCenterReport', argShape: 'query' },
  { pageMethod: 'getProfitCenterReport', subModule: 'controlling', realMethod: 'generateProfitCenterReport', argShape: 'query' },
  // materialsManagement
  { pageMethod: 'createMaterialMaster', subModule: 'materialsManagement', realMethod: 'createMaterialMaster', argShape: 'body' },
  { pageMethod: 'createPurchaseOrder', subModule: 'materialsManagement', realMethod: 'createPurchaseOrder', argShape: 'body' },
  { pageMethod: 'createGoodsReceipt', subModule: 'materialsManagement', realMethod: 'createGoodsReceipt', argShape: 'body' },
  { pageMethod: 'getInventoryOverview', subModule: 'materialsManagement', realMethod: 'getInventoryOverview', argShape: 'query' },
  { pageMethod: 'optimizeSupplyChainAI', subModule: 'materialsManagement', realMethod: 'optimizeSupplyChainAI', argShape: 'query' },
  // salesDistribution
  { pageMethod: 'createCustomerMaster', subModule: 'salesDistribution', realMethod: 'createCustomerMaster', argShape: 'body' },
  { pageMethod: 'createSalesOrder', subModule: 'salesDistribution', realMethod: 'createSalesOrder', argShape: 'body' },
  { pageMethod: 'createDelivery', subModule: 'salesDistribution', realMethod: 'createDelivery', argShape: 'body' },
  { pageMethod: 'createInvoice', subModule: 'salesDistribution', realMethod: 'createInvoice', argShape: 'body' },
  // productionPlanning
  { pageMethod: 'createProductionOrder', subModule: 'productionPlanning', realMethod: 'createProductionOrder', argShape: 'body' },
  { pageMethod: 'releaseProductionOrder', subModule: 'productionPlanning', realMethod: 'releaseProductionOrder', argShape: 'idOnly' },
  { pageMethod: 'confirmProductionOrder', subModule: 'productionPlanning', realMethod: 'confirmProductionOrder', argShape: 'idBody' },
  { pageMethod: 'optimizeProductionAI', subModule: 'productionPlanning', realMethod: 'optimizeProductionAI', argShape: 'query' },
  // qualityManagement
  { pageMethod: 'createInspectionLot', subModule: 'qualityManagement', realMethod: 'createInspectionLot', argShape: 'body' },
  { pageMethod: 'recordInspectionResult', subModule: 'qualityManagement', realMethod: 'recordInspectionResult', argShape: 'body' },
  { pageMethod: 'makeUsageDecision', subModule: 'qualityManagement', realMethod: 'makeUsageDecision', argShape: 'idBody' },
  // plantMaintenance
  { pageMethod: 'createEquipmentMaster', subModule: 'plantMaintenance', realMethod: 'createEquipmentMaster', argShape: 'body' },
  { pageMethod: 'createMaintenanceOrder', subModule: 'plantMaintenance', realMethod: 'createMaintenanceOrder', argShape: 'body' },
  { pageMethod: 'confirmMaintenanceOrder', subModule: 'plantMaintenance', realMethod: 'confirmMaintenanceOrder', argShape: 'idBody' },
  // humanResources
  { pageMethod: 'createEmployeeMaster', subModule: 'humanResources', realMethod: 'createEmployeeMaster', argShape: 'body' },
  { pageMethod: 'createOrganizationalUnit', subModule: 'humanResources', realMethod: 'createOrganizationalUnit', argShape: 'body' },
  { pageMethod: 'processPayroll', subModule: 'humanResources', realMethod: 'processPayroll', argShape: 'body' },
  { pageMethod: 'analyzeHRAI', subModule: 'humanResources', realMethod: 'analyzeHRAI', argShape: 'query' },
  // projectSystem
  { pageMethod: 'createProjectDefinition', subModule: 'projectSystem', realMethod: 'createProjectDefinition', argShape: 'body' },
  { pageMethod: 'createWBS', subModule: 'projectSystem', realMethod: 'createWBS', argShape: 'body' },
  { pageMethod: 'updateProjectStatus', subModule: 'projectSystem', realMethod: 'updateProjectStatus', argShape: 'idBody' },
  { pageMethod: 'analyzeProjectAI', subModule: 'projectSystem', realMethod: 'analyzeProjectAI', argShape: 'idOnly' },
  // treasury
  { pageMethod: 'createBankAccount', subModule: 'treasury', realMethod: 'createBankAccount', argShape: 'body' },
  { pageMethod: 'recordCashFlow', subModule: 'treasury', realMethod: 'recordCashFlow', argShape: 'body' },
  { pageMethod: 'getCashPosition', subModule: 'treasury', realMethod: 'getCashPosition', argShape: 'query' },
  // assetManagement
  { pageMethod: 'createFixedAsset', subModule: 'assetManagement', realMethod: 'createFixedAsset', argShape: 'body' },
  { pageMethod: 'calculateDepreciation', subModule: 'assetManagement', realMethod: 'calculateDepreciation', argShape: 'idBody' },
  // businessIntelligence
  { pageMethod: 'getExecutiveDashboard', subModule: 'businessIntelligence', realMethod: 'generateExecutiveDashboard', argShape: 'query' },
  { pageMethod: 'getProfitabilityAnalysis', subModule: 'businessIntelligence', realMethod: 'generateProfitabilityAnalysis', argShape: 'query' },
];

for (const action of ACTIONS) {
  const path = `/comprehensive-erp/${action.pageMethod.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
  const fn = erp[action.subModule][action.realMethod];
  const verb = action.argShape === 'query' ? 'get' : (action.argShape === 'idOnly' ? 'post' : 'post');
  const handlerPath = action.argShape === 'idBody' || action.argShape === 'idOnly' ? `${path}/:id` : path;

  router[verb](handlerPath, async (req, res) => {
    try {
      let result;
      if (action.argShape === 'body') result = await fn(req.body);
      else if (action.argShape === 'query') result = await fn(req.query);
      else if (action.argShape === 'idOnly') result = await fn(req.params.id);
      else if (action.argShape === 'idBody') result = await fn(req.params.id, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });
}

module.exports = router;
