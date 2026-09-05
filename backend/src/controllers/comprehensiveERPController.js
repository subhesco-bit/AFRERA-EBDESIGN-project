/**
 * Comprehensive ERP Controller - Oracle/SAP Standards
 * 
 * REST API controller for all ERP modules
 * Handles HTTP requests and responses for ERP operations
 */

const comprehensiveERPService = require('../services/legacy/comprehensiveERPService');
const { logger } = require('../utils/logger');

// ============================================================================
// CONTROLLERS FOR FINANCIAL ACCOUNTING (FI)
// ============================================================================

const generalLedgerController = {
  createChartOfAccounts: async (req, res) => {
    try {
      const result = await comprehensiveERPService.generalLedger.createChartOfAccounts(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error creating chart of accounts', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  },

  createGLAccount: async (req, res) => {
    try {
      let result = await comprehensiveERPService.generalLedger.createGLAccount(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error creating GL account', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  },

  postJournalEntry: async (req, res) => {
    try {
      let result = await comprehensiveERPService.generalLedger.postJournalEntry(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error posting journal entry', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  },

  generateTrialBalance: async (req, res) => {
    try {
      const { from_date, to_date, chart_id } = req.query;
      let result = await comprehensiveERPService.generalLedger.generateTrialBalance(from_date, to_date, chart_id);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error generating trial balance', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  generateBalanceSheet: async (req, res) => {
    try {
      const { as_of_date, chart_id } = req.query;
      let result = await comprehensiveERPService.generalLedger.generateBalanceSheet(as_of_date, chart_id);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error generating balance sheet', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  generateProfitLoss: async (req, res) => {
    try {
      const { from_date, to_date, chart_id } = req.query;
      let result = await comprehensiveERPService.generalLedger.generateProfitLoss(from_date, to_date, chart_id);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error generating profit and loss', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  analyzeFinancialsAI: async (req, res) => {
    try {
      const { from_date, to_date, chart_id } = req.query;
      let result = await comprehensiveERPService.generalLedger.analyzeFinancialsAI(from_date, to_date, chart_id);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error in AI financial analysis', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

// ============================================================================
// CONTROLLERS FOR CONTROLLING (CO)
// ============================================================================

const controllingController = {
  createCostCenter: async (req, res) => {
    try {
      let result = await comprehensiveERPService.controlling.createCostCenter(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error creating cost center', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  },

  createProfitCenter: async (req, res) => {
    try {
      let result = await comprehensiveERPService.controlling.createProfitCenter(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error creating profit center', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  },

  postCostAllocation: async (req, res) => {
    try {
      let result = await comprehensiveERPService.controlling.postCostAllocation(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error posting cost allocation', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  },

  generateCostCenterReport: async (req, res) => {
    try {
      const { cost_center_code, from_date, to_date } = req.query;
      let result = await comprehensiveERPService.controlling.generateCostCenterReport(cost_center_code, from_date, to_date);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error generating cost center report', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  generateProfitCenterReport: async (req, res) => {
    try {
      const { profit_center_code, from_date, to_date } = req.query;
      let result = await comprehensiveERPService.controlling.generateProfitCenterReport(profit_center_code, from_date, to_date);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error generating profit center report', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

// ============================================================================
// CONTROLLERS FOR MATERIALS MANAGEMENT (MM)
// ============================================================================

const materialsManagementController = {
  createMaterialMaster: async (req, res) => {
    try {
      let result = await comprehensiveERPService.materialsManagement.createMaterialMaster(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error creating material master', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  },

  createPurchaseOrder: async (req, res) => {
    try {
      let result = await comprehensiveERPService.materialsManagement.createPurchaseOrder(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error creating purchase order', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  },

  createGoodsReceipt: async (req, res) => {
    try {
      let result = await comprehensiveERPService.materialsManagement.createGoodsReceipt(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error creating goods receipt', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  },

  getInventoryOverview: async (req, res) => {
    try {
      const { material_code, storage_location } = req.query;
      let result = await comprehensiveERPService.materialsManagement.getInventoryOverview(material_code, storage_location);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error getting inventory overview', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  optimizeSupplyChainAI: async (req, res) => {
    try {
      const { material_code, storage_location } = req.query;
      let result = await comprehensiveERPService.materialsManagement.optimizeSupplyChainAI(material_code, storage_location);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error in AI supply chain optimization', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

// ============================================================================
// CONTROLLERS FOR SALES AND DISTRIBUTION (SD)
// ============================================================================

const salesDistributionController = {
  createCustomerMaster: async (req, res) => {
    try {
      let result = await comprehensiveERPService.salesDistribution.createCustomerMaster(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error creating customer master', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  },

  createSalesOrder: async (req, res) => {
    try {
      let result = await comprehensiveERPService.salesDistribution.createSalesOrder(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error creating sales order', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  },

  createDelivery: async (req, res) => {
    try {
      let result = await comprehensiveERPService.salesDistribution.createDelivery(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error creating delivery', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  },

  createInvoice: async (req, res) => {
    try {
      let result = await comprehensiveERPService.salesDistribution.createInvoice(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error creating invoice', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  }
};

// ============================================================================
// CONTROLLERS FOR PRODUCTION PLANNING (PP)
// ============================================================================

const productionPlanningController = {
  createProductionOrder: async (req, res) => {
    try {
      let result = await comprehensiveERPService.productionPlanning.createProductionOrder(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error creating production order', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  },

  releaseProductionOrder: async (req, res) => {
    try {
      const { production_order } = req.params;
      let result = await comprehensiveERPService.productionPlanning.releaseProductionOrder(production_order);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error releasing production order', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  },

  confirmProductionOrder: async (req, res) => {
    try {
      const { production_order } = req.params;
      let result = await comprehensiveERPService.productionPlanning.confirmProductionOrder(production_order, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error confirming production order', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  },

  optimizeProductionAI: async (req, res) => {
    try {
      const { production_plant, from_date, to_date } = req.query;
      let result = await comprehensiveERPService.productionPlanning.optimizeProductionAI(production_plant, from_date, to_date);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error in AI production optimization', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

// ============================================================================
// CONTROLLERS FOR QUALITY MANAGEMENT (QM)
// ============================================================================

const qualityManagementController = {
  createInspectionLot: async (req, res) => {
    try {
      let result = await comprehensiveERPService.qualityManagement.createInspectionLot(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error creating inspection lot', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  },

  recordInspectionResult: async (req, res) => {
    try {
      let result = await comprehensiveERPService.qualityManagement.recordInspectionResult(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error recording inspection result', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  },

  makeUsageDecision: async (req, res) => {
    try {
      const { inspection_lot } = req.params;
      let result = await comprehensiveERPService.qualityManagement.makeUsageDecision(inspection_lot, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error making usage decision', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  }
};

// ============================================================================
// CONTROLLERS FOR PLANT MAINTENANCE (PM)
// ============================================================================

const plantMaintenanceController = {
  createEquipmentMaster: async (req, res) => {
    try {
      let result = await comprehensiveERPService.plantMaintenance.createEquipmentMaster(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error creating equipment master', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  },

  createMaintenanceOrder: async (req, res) => {
    try {
      let result = await comprehensiveERPService.plantMaintenance.createMaintenanceOrder(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error creating maintenance order', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  },

  confirmMaintenanceOrder: async (req, res) => {
    try {
      const { maintenance_order } = req.params;
      let result = await comprehensiveERPService.plantMaintenance.confirmMaintenanceOrder(maintenance_order, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error confirming maintenance order', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  }
};

// ============================================================================
// CONTROLLERS FOR HUMAN RESOURCES (HR)
// ============================================================================

const humanResourcesController = {
  createEmployeeMaster: async (req, res) => {
    try {
      let result = await comprehensiveERPService.humanResources.createEmployeeMaster(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error creating employee master', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  },

  createOrganizationalUnit: async (req, res) => {
    try {
      let result = await comprehensiveERPService.humanResources.createOrganizationalUnit(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error creating organizational unit', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  },

  processPayroll: async (req, res) => {
    try {
      let result = await comprehensiveERPService.humanResources.processPayroll(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error processing payroll', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  },

  analyzeHRAI: async (req, res) => {
    try {
      const { period, year } = req.query;
      let result = await comprehensiveERPService.humanResources.analyzeHRAI(period, year);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error in AI HR analysis', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

// ============================================================================
// CONTROLLERS FOR PROJECT SYSTEM (PS)
// ============================================================================

const projectSystemController = {
  createProjectDefinition: async (req, res) => {
    try {
      let result = await comprehensiveERPService.projectSystem.createProjectDefinition(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error creating project definition', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  },

  createWBS: async (req, res) => {
    try {
      let result = await comprehensiveERPService.projectSystem.createWBS(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error creating WBS element', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  },

  updateProjectStatus: async (req, res) => {
    try {
      const { project_code } = req.params;
      let result = await comprehensiveERPService.projectSystem.updateProjectStatus(project_code, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error updating project status', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  },

  analyzeProjectAI: async (req, res) => {
    try {
      const { project_code } = req.params;
      let result = await comprehensiveERPService.projectSystem.analyzeProjectAI(project_code);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error in AI project analysis', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

// ============================================================================
// CONTROLLERS FOR TREASURY (TR)
// ============================================================================

const treasuryController = {
  createBankAccount: async (req, res) => {
    try {
      let result = await comprehensiveERPService.treasury.createBankAccount(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error creating bank account', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  },

  recordCashFlow: async (req, res) => {
    try {
      let result = await comprehensiveERPService.treasury.recordCashFlow(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error recording cash flow', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  },

  getCashPosition: async (req, res) => {
    try {
      const { as_of_date, currency } = req.query;
      let result = await comprehensiveERPService.treasury.getCashPosition(as_of_date, currency);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error getting cash position', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

// ============================================================================
// CONTROLLERS FOR ASSET MANAGEMENT (AM)
// ============================================================================

const assetManagementController = {
  createFixedAsset: async (req, res) => {
    try {
      let result = await comprehensiveERPService.assetManagement.createFixedAsset(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error creating fixed asset', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  },

  calculateDepreciation: async (req, res) => {
    try {
      const { asset_code } = req.params;
      const { from_date, to_date } = req.query;
      let result = await comprehensiveERPService.assetManagement.calculateDepreciation(asset_code, from_date, to_date);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error calculating depreciation', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  }
};

// ============================================================================
// CONTROLLERS FOR BUSINESS INTELLIGENCE (BI)
// ============================================================================

const businessIntelligenceController = {
  generateExecutiveDashboard: async (req, res) => {
    try {
      const { from_date, to_date } = req.query;
      let result = await comprehensiveERPService.businessIntelligence.generateExecutiveDashboard(from_date, to_date);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error generating executive dashboard', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  generateProfitabilityAnalysis: async (req, res) => {
    try {
      const { from_date, to_date, profit_center_code } = req.query;
      let result = await comprehensiveERPService.businessIntelligence.generateProfitabilityAnalysis(from_date, to_date, profit_center_code);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error generating profitability analysis', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

// ============================================================================
// EXPORT ALL CONTROLLERS
// ============================================================================

module.exports = {
  // Financial Accounting (FI)
  generalLedgerController,
  
  // Controlling (CO)
  controllingController,
  
  // Materials Management (MM)
  materialsManagementController,
  
  // Sales and Distribution (SD)
  salesDistributionController,
  
  // Production Planning (PP)
  productionPlanningController,
  
  // Quality Management (QM)
  qualityManagementController,
  
  // Plant Maintenance (PM)
  plantMaintenanceController,
  
  // Human Resources (HR)
  humanResourcesController,
  
  // Project System (PS)
  projectSystemController,
  
  // Treasury (TR)
  treasuryController,
  
  // Asset Management (AM)
  assetManagementController,
  
  // Business Intelligence (BI)
  businessIntelligenceController
};
