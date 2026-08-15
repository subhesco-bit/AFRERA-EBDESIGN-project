/**
 * HR Routes with AI Integration
 * 
 * Routes for HR module with AI-powered capabilities:
 * - Employee management with AI recommendations
 * - Attrition prediction
 * - Shift optimization
 * - Sentiment analysis
 * - Training recommendations
 * - Timesheet anomaly detection
 */

const express = require('express');
const router = express.Router();
const hrService = require('../services/hrService');
const { authMiddleware } = require('../middleware/auth');

// All HR routes require authentication
router.use(authMiddleware);

// ========================================================================
// EMPLOYEE MANAGEMENT
// ========================================================================

/**
 * POST /api/v1/hr/employees
 * Create employee with AI-powered role and salary recommendations
 */
router.post('/employees', async (req, res) => {
  try {
    const result = await hrService.createEmployee(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/hr/employees/:employeeId/attrition-risk
 * Predict employee attrition risk using ML
 */
router.get('/employees/:employeeId/attrition-risk', async (req, res) => {
  try {
    const result = await hrService.predictEmployeeAttrition(req.params.employeeId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/hr/employees/:employeeId/sentiment
 * Analyze employee sentiment using NLP
 */
router.get('/employees/:employeeId/sentiment', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '30 days';
    const result = await hrService.analyzeEmployeeSentiment(req.params.employeeId, timeframe);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/hr/employees/:employeeId/training-recommendations
 * Get personalized training recommendations
 */
router.get('/employees/:employeeId/training-recommendations', async (req, res) => {
  try {
    const result = await hrService.recommendTraining(req.params.employeeId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================================================
// SHIFT OPTIMIZATION
// ========================================================================

/**
 * POST /api/v1/hr/shifts/optimize
 * Optimize shift schedule using reinforcement learning
 */
router.post('/shifts/optimize', async (req, res) => {
  try {
    const { departmentId, startDate, endDate } = req.body;
    const result = await hrService.optimizeShiftSchedule(departmentId, startDate, endDate);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================================================
// TIMESHEET ANALYSIS
// ========================================================================

/**
 * POST /api/v1/hr/timesheets/analyze-anomalies
 * Detect timesheet anomalies using AI
 */
router.post('/timesheets/analyze-anomalies', async (req, res) => {
  try {
    const result = await hrService.detectTimesheetAnomalies(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================================================
// ANALYTICS & REPORTING
// ========================================================================

/**
 * GET /api/v1/hr/analytics/workforce
 * Get AI-powered workforce analytics
 */
router.get('/analytics/workforce', async (req, res) => {
  try {
    // Placeholder for workforce analytics
    res.json({
      message: 'Workforce analytics endpoint - to be implemented with AI insights',
      capabilities: [
        'attrition_risk_heatmap',
        'skill_gap_analysis',
        'performance_distribution',
        'sentiment_trends',
        'training_effectiveness'
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/hr/analytics/predictions
 * Get HR predictions and forecasts
 */
router.get('/analytics/predictions', async (req, res) => {
  try {
    // Placeholder for predictions
    res.json({
      message: 'HR predictions endpoint - to be implemented with AI forecasting',
      capabilities: [
        'headcount_forecasting',
        'budget_predictions',
        'succession_planning',
        'hiring_demand_forecast'
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
