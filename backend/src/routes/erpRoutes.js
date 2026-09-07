/**
 * ERP Cost Control & Profitability Module API Routes
 * Cost centre management, cost allocation, and profitability analysis
 */

const express = require('express');
const CostControlModule = require('../services/erp/CostControlModule');

const router = express.Router();

/**
 * POST /api/v1/erp/cost-centres/create
 * Create a new cost centre
 */
router.post('/cost-centres/create', async (req, res) => {
  try {
    const {
      code,
      name,
      parent_id,
      department,
      manager_id,
      budget_annual,
      cost_type,
      profit_centre,
    } = req.body;

    if (!code || !name || !manager_id) {
      return res.status(400).json({ 
        error: 'code, name, and manager_id are required' 
      });
    }

    const costCentre = CostControlModule.createCostCentre({
      code,
      name,
      parentId: parent_id || null,
      department: department || 'General',
      managerId: manager_id,
      budgetAnnual: budget_annual || 0,
      costType: cost_type || 'DEPARTMENT',
      profitCentre: profit_centre || false,
    });

    res.status(201).json({
      success: true,
      data: costCentre,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/erp/costs/allocate
 * Allocate costs to cost centre
 */
router.post('/costs/allocate', async (req, res) => {
  try {
    const {
      cost_centre_id,
      period,
      cost_type,
      amount,
      allocation_basis,
      driver_id,
      notes,
    } = req.body;

    if (!cost_centre_id || !period || !cost_type || !amount) {
      return res.status(400).json({ 
        error: 'cost_centre_id, period, cost_type, and amount are required' 
      });
    }

    const allocation = CostControlModule.allocateCosts({
      costCentreId: cost_centre_id,
      period,
      costType: cost_type,
      amount,
      allocationBasis: allocation_basis || 'DIRECT',
      driverId: driver_id || null,
      notes: notes || '',
    });

    res.status(201).json({
      success: true,
      data: allocation,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/erp/costs/record-consumption
 * Record actual cost consumption
 */
router.post('/costs/record-consumption', async (req, res) => {
  try {
    const {
      cost_centre_id,
      cost_type,
      amount,
      invoice_number,
      vendor_id,
      description,
      document_date,
      period,
    } = req.body;

    if (!cost_centre_id || !cost_type || !amount) {
      return res.status(400).json({ 
        error: 'cost_centre_id, cost_type, and amount are required' 
      });
    }

    const consumption = CostControlModule.recordCostConsumption({
      costCentreId: cost_centre_id,
      costType: cost_type,
      amount,
      invoiceNumber: invoice_number || null,
      vendorId: vendor_id || null,
      description: description || '',
      documentDate: document_date || new Date(),
      period: period || new Date().toISOString().slice(0, 7),
    });

    res.status(201).json({
      success: true,
      data: consumption,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/erp/costs/allocate-abc
 * Allocate indirect costs using activity-based costing
 */
router.post('/costs/allocate-abc', async (req, res) => {
  try {
    const {
      indirect_cost_pool_id,
      cost_driver,
      cost_centre_ids,
      period,
    } = req.body;

    if (!indirect_cost_pool_id || !cost_driver) {
      return res.status(400).json({ 
        error: 'indirect_cost_pool_id and cost_driver are required' 
      });
    }

    const allocation = CostControlModule.allocateIndirectCostsABC({
      indirectCostPoolId: indirect_cost_pool_id,
      costDriver: cost_driver,
      costCentres: (cost_centre_ids || []).map(id => ({ id })),
      period: period || new Date().toISOString().slice(0, 7),
    });

    res.status(200).json({
      success: true,
      data: allocation,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/erp/profitability/:cost_centre_id/:period
 * Calculate profitability for cost centre
 */
router.get('/profitability/:cost_centre_id/:period', async (req, res) => {
  try {
    const {
      cost_centre_id,
      period,
    } = req.params;
    const {
      revenue,
      direct_costs,
      allocated_indirect_costs,
    } = req.query;

    const profitability = CostControlModule.calculateProfitability({
      costCentreId: cost_centre_id,
      period,
      revenue: parseFloat(revenue) || 0,
      directCosts: parseFloat(direct_costs) || 0,
      allocatedIndirectCosts: parseFloat(allocated_indirect_costs) || 0,
    });

    res.status(200).json({
      success: true,
      data: profitability,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/erp/variance/:cost_centre_id/:period
 * Analyze cost variance
 */
router.get('/variance/:cost_centre_id/:period', async (req, res) => {
  try {
    const {
      cost_centre_id,
      period,
    } = req.params;
    const {
      budgeted_amount,
      actual_amount,
      forecast_amount,
    } = req.query;

    if (!budgeted_amount || !actual_amount) {
      return res.status(400).json({ 
        error: 'budgeted_amount and actual_amount query parameters are required' 
      });
    }

    const variance = CostControlModule.analyzeVariance({
      costCentreId: cost_centre_id,
      period,
      budgetedAmount: parseFloat(budgeted_amount),
      actualAmount: parseFloat(actual_amount),
      forecastAmount: parseFloat(forecast_amount) || parseFloat(actual_amount),
    });

    res.status(200).json({
      success: true,
      data: variance,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/erp/drill-down/:cost_centre_id/:period
 * Drill down into cost centre details
 */
router.get('/drill-down/:cost_centre_id/:period', async (req, res) => {
  try {
    const { cost_centre_id, period } = req.params;

    const drillDown = CostControlModule.drillDownCostCentre(cost_centre_id, period);

    res.status(200).json({
      success: true,
      data: drillDown,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
