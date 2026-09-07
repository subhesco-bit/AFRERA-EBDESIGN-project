/**
 * ERP Cost Control & Profitability Module (AF-CO)
 * Manages cost centres, cost allocation, and profitability analysis
 */

class CostControlModule {
  /**
   * Create or update cost centre
   * @param {Object} params - Cost centre parameters
   * @returns {Object} Cost centre record
   */
  static createCostCentre(params) {
    const {
      code,
      name,
      parentId,
      department,
      managerId,
      budgetAnnual,
      costType = 'DEPARTMENT',
      profitCentre = false,
    } = params;

    return {
      id: this._generateId(),
      code,
      name,
      parentId,
      department,
      managerId,
      budgetAnnual,
      costType,
      profitCentre,
      status: 'ACTIVE',
      createdAt: new Date(),
      allocatedBudget: 0,
      consumedBudget: 0,
      projectedBudget: 0,
      budgetUtilization: 0,
      hierarchyLevel: this._calculateHierarchyLevel(parentId),
      costAllocationRules: [],
    };
  }

  /**
   * Allocate costs to cost centres
   * @param {Object} params - Allocation parameters
   * @returns {Object} Allocation result
   */
  static allocateCosts(params) {
    const {
      costCentreId,
      period,
      costType,
      amount,
      allocationBasis = 'DIRECT',
      driverId = null,
      notes = '',
    } = params;

    const allocationDetails = {
      id: this._generateId(),
      costCentreId,
      period,
      costType, // DIRECT, INDIRECT, ADMIN, MARKETING
      amount,
      allocationBasis, // DIRECT, HEADCOUNT, REVENUE, SQUARE_FEET, PRODUCTION_VOLUME
      driverId,
      allocatedDate: new Date(),
      notes,
      allocatedBy: null,
      approvalStatus: 'PENDING',
    };

    return {
      allocationDetails,
      costCentre: this._getCostCentreDetails(costCentreId),
      newAllocatedBudget: this._calculateAllocatedBudget(costCentreId, amount),
      budgetUtilization: this._calculateBudgetUtilization(costCentreId, amount),
    };
  }

  /**
   * Record actual cost consumption
   * @param {Object} params - Consumption parameters
   * @returns {Object} Consumption record
   */
  static recordCostConsumption(params) {
    const {
      costCentreId,
      costType,
      amount,
      invoiceNumber,
      vendorId,
      description,
      documentDate,
      period,
    } = params;

    const consumption = {
      id: this._generateId(),
      costCentreId,
      costType,
      amount,
      invoiceNumber,
      vendorId,
      description,
      documentDate,
      recordedDate: new Date(),
      period,
      status: 'RECORDED',
      verificationStatus: 'PENDING',
      varianceFromBudget: this._calculateVariance(costCentreId, amount),
    };

    return {
      consumption,
      newConsumedBudget: this._calculateConsumedBudget(costCentreId, amount),
      budgetVariance: consumption.varianceFromBudget,
      remainingBudget: this._calculateRemainingBudget(costCentreId, amount),
      alerts: this._generateBudgetAlerts(costCentreId, amount),
    };
  }

  /**
   * Allocate indirect costs using activity-based costing
   * @param {Object} params - ABC parameters
   * @returns {Object} ABC allocation result
   */
  static allocateIndirectCostsABC(params) {
    const {
      indirectCostPoolId,
      costDriver,
      costDriverValue,
      costCentres = [],
      period,
    } = params;

    // Calculate driver rates
    const totalCostPoolAmount = this._getCostPoolAmount(indirectCostPoolId);
    const totalDriverValue = costCentres.reduce((sum, cc) => 
      sum + this._getDriverValue(cc.id, costDriver), 0);
    
    const ratePerDriver = totalCostPoolAmount / totalDriverValue;

    const allocations = costCentres.map(costCentre => {
      const ccDriverValue = this._getDriverValue(costCentre.id, costDriver);
      const allocatedAmount = ccDriverValue * ratePerDriver;

      return {
        costCentreId: costCentre.id,
        costCentreName: costCentre.name,
        driverValue: ccDriverValue,
        ratePerDriver: ratePerDriver.toFixed(2),
        allocatedAmount: allocatedAmount.toFixed(2),
        allocationPercentage: ((allocatedAmount / totalCostPoolAmount) * 100).toFixed(2),
      };
    });

    return {
      costPoolId: indirectCostPoolId,
      costDriver,
      totalCostPoolAmount,
      totalDriverValue,
      ratePerDriver: ratePerDriver.toFixed(2),
      allocations,
      period,
      allocationDate: new Date(),
    };
  }

  /**
   * Calculate profitability by cost centre
   * @param {Object} params - Profitability parameters
   * @returns {Object} Profitability analysis
   */
  static calculateProfitability(params) {
    const {
      costCentreId,
      period,
      revenue = 0,
      directCosts = 0,
      allocatedIndirectCosts = 0,
    } = params;

    const totalCosts = directCosts + allocatedIndirectCosts;
    const grossProfit = revenue - directCosts;
    const netProfit = revenue - totalCosts;
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    const roi = totalCosts > 0 ? (netProfit / totalCosts) * 100 : 0;

    return {
      costCentreId,
      period,
      revenue,
      directCosts,
      allocatedIndirectCosts,
      totalCosts,
      grossProfit,
      grossProfitMargin: ((grossProfit / revenue) * 100).toFixed(2),
      netProfit,
      netProfitMargin: profitMargin.toFixed(2),
      roi: roi.toFixed(2),
      costBreakdown: {
        directCosts: ((directCosts / totalCosts) * 100).toFixed(2),
        indirectCosts: ((allocatedIndirectCosts / totalCosts) * 100).toFixed(2),
      },
      performanceRating: this._ratePerformance(profitMargin),
    };
  }

  /**
   * Generate variance analysis report
   * @param {Object} params - Variance parameters
   * @returns {Object} Variance analysis
   */
  static analyzeVariance(params) {
    const {
      costCentreId,
      period,
      budgetedAmount,
      actualAmount,
      forecastAmount,
    } = params;

    const budgetVariance = actualAmount - budgetedAmount;
    const budgetVariancePercent = (budgetVariance / budgetedAmount) * 100;
    const forecastVariance = forecastAmount - actualAmount;

    const varianceStatus = Math.abs(budgetVariancePercent) <= 5 ? 
      'FAVORABLE' : (budgetVariance < 0 ? 'FAVORABLE' : 'UNFAVORABLE');

    return {
      costCentreId,
      period,
      budgetedAmount,
      actualAmount,
      forecastAmount,
      budgetVariance: budgetVariance.toFixed(2),
      budgetVariancePercent: budgetVariancePercent.toFixed(2),
      forecastVariance: forecastVariance.toFixed(2),
      varianceStatus,
      varianceReason: this._identifyVarianceReason(budgetVariancePercent),
      correctionActions: this._suggestCorrectionActions(budgetVariancePercent),
      trend: this._analyzeTrend(budgetedAmount, actualAmount, forecastAmount),
    };
  }

  /**
   * Drill down into cost centre details
   * @param {string} costCentreId - Cost centre ID
   * @param {string} period - Period to analyze
   * @returns {Object} Detailed breakdown
   */
  static drillDownCostCentre(costCentreId, period) {
    const costCentre = this._getCostCentreDetails(costCentreId);
    const allocations = this._getCostAllocations(costCentreId, period);
    const consumptions = this._getCostConsumptions(costCentreId, period);
    const parentAllocation = this._getParentAllocation(costCentre.parentId, costCentreId);

    return {
      costCentre,
      period,
      summary: {
        budgetedAmount: allocations.reduce((s, a) => s + a.amount, 0),
        consumedAmount: consumptions.reduce((s, c) => s + c.amount, 0),
        remainingBudget: (allocations.reduce((s, a) => s + a.amount, 0) - 
                         consumptions.reduce((s, c) => s + c.amount, 0)),
      },
      allocations,
      consumptions,
      parentAllocation,
      childCentres: this._getChildCostCentres(costCentreId),
      trends: this._generateCostTrends(costCentreId, period),
    };
  }

  // Helper methods
  static _generateId() {
    return `CC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static _calculateHierarchyLevel(parentId) {
    return parentId ? 2 : 1;
  }

  static _getCostCentreDetails(costCentreId) {
    return {
      id: costCentreId,
      code: 'CC-001',
      name: 'Cost Centre Name',
      department: 'Department',
    };
  }

  static _calculateAllocatedBudget(costCentreId, amount) {
    return 100000 + amount;
  }

  static _calculateBudgetUtilization(costCentreId, amount) {
    const allocated = this._calculateAllocatedBudget(costCentreId, amount);
    const consumed = this._calculateConsumedBudget(costCentreId, 0);
    return ((consumed / allocated) * 100).toFixed(2);
  }

  static _calculateConsumedBudget(costCentreId, newAmount) {
    return 50000 + newAmount;
  }

  static _calculateRemainingBudget(costCentreId, newAmount) {
    const allocated = this._calculateAllocatedBudget(costCentreId, 0);
    const consumed = this._calculateConsumedBudget(costCentreId, newAmount);
    return allocated - consumed;
  }

  static _calculateVariance(costCentreId, amount) {
    return Math.random() * amount * 0.1;
  }

  static _generateBudgetAlerts(costCentreId, amount) {
    const alerts = [];
    if (this._calculateRemainingBudget(costCentreId, amount) < 10000) {
      alerts.push({
        level: 'WARNING',
        message: 'Budget utilization exceeding 90%',
        recommendedAction: 'Request budget revision',
      });
    }
    return alerts;
  }

  static _getCostPoolAmount(poolId) {
    return 500000;
  }

  static _getDriverValue(costCentreId, driver) {
    return Math.random() * 1000;
  }

  static _ratePerformance(profitMargin) {
    if (profitMargin >= 20) return 'EXCELLENT';
    if (profitMargin >= 10) return 'GOOD';
    if (profitMargin >= 0) return 'ADEQUATE';
    return 'POOR';
  }

  static _identifyVarianceReason(variancePercent) {
    if (variancePercent > 10) return 'Significant overspend - investigate causes';
    if (variancePercent > 5) return 'Minor overspend - monitoring needed';
    if (variancePercent < -5) return 'Underspend - check spending pace';
    return 'Within acceptable variance';
  }

  static _suggestCorrectionActions(variancePercent) {
    const actions = [];
    if (variancePercent > 10) {
      actions.push('Review vendor pricing');
      actions.push('Optimize resource allocation');
      actions.push('Implement cost control measures');
    }
    return actions;
  }

  static _analyzeTrend(budgeted, actual, forecast) {
    const trend = (forecast - actual) / actual;
    return {
      direction: trend > 0 ? 'INCREASING' : 'DECREASING',
      percentageChange: (trend * 100).toFixed(2),
      projectedEnd: forecast,
    };
  }

  static _getCostAllocations(costCentreId, period) {
    return [];
  }

  static _getCostConsumptions(costCentreId, period) {
    return [];
  }

  static _getParentAllocation(parentId, costCentreId) {
    return parentId ? { parentId, allocationAmount: 100000 } : null;
  }

  static _getChildCostCentres(costCentreId) {
    return [];
  }

  static _generateCostTrends(costCentreId, period) {
    return [];
  }
}

module.exports = CostControlModule;
