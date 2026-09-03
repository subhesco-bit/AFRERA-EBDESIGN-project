/**
 * Comprehensive ERP Routes - Oracle/SAP Standards
 * 
 * REST API routes for all ERP modules
 * Following Oracle E-Business Suite and SAP S/4HANA routing conventions
 */

const express = require('express');
const {
  generalLedgerController,
  controllingController,
  materialsManagementController,
  salesDistributionController,
  productionPlanningController,
  qualityManagementController,
  plantMaintenanceController,
  humanResourcesController,
  projectSystemController,
  treasuryController,
  assetManagementController,
  businessIntelligenceController
} = require('../controllers/comprehensiveERPController');
const { authMiddleware } = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const { protectRouter, requireHumanAuthorization } = require('./enterpriseRouteSupport');

const router = express.Router();

router.use(authMiddleware);
protectRouter(router, { signal: 'enterprise.erp.changed' });
router.use((req, res, next) => {
  if (req.method === 'GET') return next();
  requireRole('admin', 'superadmin')(req, res, () => requireHumanAuthorization(req, res, next));
});

// ============================================================================
// FINANCIAL ACCOUNTING (FI) / GENERAL LEDGER (GL) ROUTES
// ============================================================================

router.post('/fi/gl/chart-of-accounts', generalLedgerController.createChartOfAccounts);
router.post('/fi/gl/accounts', generalLedgerController.createGLAccount);
router.post('/fi/gl/journal-entries', generalLedgerController.postJournalEntry);
router.get('/fi/gl/trial-balance', generalLedgerController.generateTrialBalance);
router.get('/fi/gl/balance-sheet', generalLedgerController.generateBalanceSheet);
router.get('/fi/gl/profit-loss', generalLedgerController.generateProfitLoss);
router.get('/fi/gl/ai-analysis', generalLedgerController.analyzeFinancialsAI);

// ============================================================================
// CONTROLLING (CO) ROUTES
// ============================================================================

router.post('/co/cost-centers', controllingController.createCostCenter);
router.post('/co/profit-centers', controllingController.createProfitCenter);
router.post('/co/cost-allocations', controllingController.postCostAllocation);
router.get('/co/cost-centers/report', controllingController.generateCostCenterReport);
router.get('/co/profit-centers/report', controllingController.generateProfitCenterReport);

// ============================================================================
// MATERIALS MANAGEMENT (MM) ROUTES
// ============================================================================

router.post('/mm/material-master', materialsManagementController.createMaterialMaster);
router.post('/mm/purchase-orders', materialsManagementController.createPurchaseOrder);
router.post('/mm/goods-receipts', materialsManagementController.createGoodsReceipt);
router.get('/mm/inventory', materialsManagementController.getInventoryOverview);
router.get('/mm/ai-optimization', materialsManagementController.optimizeSupplyChainAI);

// ============================================================================
// SALES AND DISTRIBUTION (SD) ROUTES
// ============================================================================

router.post('/sd/customers', salesDistributionController.createCustomerMaster);
router.post('/sd/sales-orders', salesDistributionController.createSalesOrder);
router.post('/sd/deliveries', salesDistributionController.createDelivery);
router.post('/sd/invoices', salesDistributionController.createInvoice);

// ============================================================================
// PRODUCTION PLANNING (PP) ROUTES
// ============================================================================

router.post('/pp/production-orders', productionPlanningController.createProductionOrder);
router.post('/pp/production-orders/:production_order/release', productionPlanningController.releaseProductionOrder);
router.post('/pp/production-orders/:production_order/confirm', productionPlanningController.confirmProductionOrder);
router.get('/pp/ai-optimization', productionPlanningController.optimizeProductionAI);

// ============================================================================
// QUALITY MANAGEMENT (QM) ROUTES
// ============================================================================

router.post('/qm/inspection-lots', qualityManagementController.createInspectionLot);
router.post('/qm/inspection-results', qualityManagementController.recordInspectionResult);
router.post('/qm/inspection-lots/:inspection_lot/usage-decision', qualityManagementController.makeUsageDecision);

// ============================================================================
// PLANT MAINTENANCE (PM) ROUTES
// ============================================================================

router.post('/pm/equipment', plantMaintenanceController.createEquipmentMaster);
router.post('/pm/maintenance-orders', plantMaintenanceController.createMaintenanceOrder);
router.post('/pm/maintenance-orders/:maintenance_order/confirm', plantMaintenanceController.confirmMaintenanceOrder);

// ============================================================================
// HUMAN RESOURCES (HR) ROUTES
// ============================================================================

router.post('/hr/employees', humanResourcesController.createEmployeeMaster);
router.post('/hr/org-units', humanResourcesController.createOrganizationalUnit);
router.post('/hr/payroll', humanResourcesController.processPayroll);
router.get('/hr/ai-analysis', humanResourcesController.analyzeHRAI);

// ============================================================================
// PROJECT SYSTEM (PS) ROUTES
// ============================================================================

router.post('/ps/projects', projectSystemController.createProjectDefinition);
router.post('/ps/wbs-elements', projectSystemController.createWBS);
router.post('/ps/projects/:project_code/status', projectSystemController.updateProjectStatus);
router.get('/ps/projects/:project_code/ai-analysis', projectSystemController.analyzeProjectAI);

// ============================================================================
// TREASURY (TR) ROUTES
// ============================================================================

router.post('/tr/bank-accounts', treasuryController.createBankAccount);
router.post('/tr/cash-flows', treasuryController.recordCashFlow);
router.get('/tr/cash-position', treasuryController.getCashPosition);

// ============================================================================
// ASSET MANAGEMENT (AM) ROUTES
// ============================================================================

router.post('/am/fixed-assets', assetManagementController.createFixedAsset);
router.post('/am/fixed-assets/:asset_code/depreciation', assetManagementController.calculateDepreciation);

// ============================================================================
// BUSINESS INTELLIGENCE (BI) ROUTES
// ============================================================================

router.get('/bi/executive-dashboard', businessIntelligenceController.generateExecutiveDashboard);
router.get('/bi/profitability-analysis', businessIntelligenceController.generateProfitabilityAnalysis);

module.exports = router;
