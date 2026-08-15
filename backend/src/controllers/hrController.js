/**
 * HR Controller with AI Integration
 * 
 * Controller layer for HR module with AI-powered capabilities
 * Handles HTTP requests and responses, delegates to service layer
 */

const hrService = require('../services/hrService');

class HRController {
  /**
   * Create employee with AI-powered recommendations
   */
  async createEmployee(req, res) {
    try {
      const result = await hrService.createEmployee(req.body);
      res.status(201).json({
        success: true,
        message: 'Employee created successfully with AI recommendations',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Predict employee attrition risk
   */
  async predictAttrition(req, res) {
    try {
      const { employeeId } = req.params;
      const result = await hrService.predictEmployeeAttrition(employeeId);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Analyze employee sentiment
   */
  async analyzeSentiment(req, res) {
    try {
      const { employeeId } = req.params;
      const timeframe = req.query.timeframe || '30 days';
      const result = await hrService.analyzeEmployeeSentiment(employeeId, timeframe);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get training recommendations
   */
  async getTrainingRecommendations(req, res) {
    try {
      const { employeeId } = req.params;
      const result = await hrService.recommendTraining(employeeId);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Optimize shift schedule
   */
  async optimizeShiftSchedule(req, res) {
    try {
      const { departmentId, startDate, endDate } = req.body;
      const result = await hrService.optimizeShiftSchedule(departmentId, startDate, endDate);
      res.json({
        success: true,
        message: 'Shift schedule optimized successfully',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Detect timesheet anomalies
   */
  async detectTimesheetAnomalies(req, res) {
    try {
      const result = await hrService.detectTimesheetAnomalies(req.body);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get workforce analytics
   */
  async getWorkforceAnalytics(req, res) {
    try {
      res.json({
        success: true,
        message: 'Workforce analytics - AI-powered insights',
        capabilities: [
          'attrition_risk_heatmap',
          'skill_gap_analysis',
          'performance_distribution',
          'sentiment_trends',
          'training_effectiveness'
        ]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get HR predictions
   */
  async getHRPredictions(req, res) {
    try {
      res.json({
        success: true,
        message: 'HR predictions - AI forecasting',
        capabilities: [
          'headcount_forecasting',
          'budget_predictions',
          'succession_planning',
          'hiring_demand_forecast'
        ]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new HRController();
