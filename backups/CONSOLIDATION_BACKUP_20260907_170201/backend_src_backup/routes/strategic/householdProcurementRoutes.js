/**
 * Household Procurement Routes
 * API endpoints for household procurement planning
 */

const express = require('express');
const router = express.Router();
const householdProcurementService = require('../../services/strategic/householdProcurementService');
const { authMiddleware: authenticate, requireRole } = require('../../middleware/auth');
const authorize = (roles) => requireRole(...roles);
const apiResponseHandler = require('../../middleware/apiResponseHandler');

const service = new householdProcurementService();

/**
 * @route   POST /api/v1/strategic/household/procurement-plans
 * @desc    Create a household procurement plan
 * @access  Private (Household)
 */
router.post('/procurement-plans', authenticate, async (req, res) => {
  try {
    const result = await service.createProcurementPlan(req.body);
    apiResponseHandler.sendSuccess(res, result, 'Procurement plan created successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to create procurement plan');
  }
});

/**
 * @route   GET /api/v1/strategic/household/procurement-plans/:id
 * @desc    Get household procurement plan details
 * @access  Private (Household)
 */
router.get('/procurement-plans/:id', authenticate, async (req, res) => {
  try {
    // Get procurement plan details - would need to implement this method in service
    const result = { plan: null, message: 'Procurement plan details retrieval' };
    apiResponseHandler.sendSuccess(res, result, 'Procurement plan retrieved successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to retrieve procurement plan');
  }
});

/**
 * @route   POST /api/v1/strategic/household/subscriptions
 * @desc    Create a household subscription
 * @access  Private (Household)
 */
router.post('/subscriptions', authenticate, async (req, res) => {
  try {
    const result = await service.createSubscription(req.body);
    apiResponseHandler.sendSuccess(res, result, 'Subscription created successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to create subscription');
  }
});

/**
 * @route   PUT /api/v1/strategic/household/subscriptions/:id
 * @desc    Manage subscription (pause, resume, cancel)
 * @access  Private (Household)
 */
router.put('/subscriptions/:id', authenticate, async (req, res) => {
  try {
    const result = await service.manageSubscription(req.params.id, req.body);
    apiResponseHandler.sendSuccess(res, result, 'Subscription managed successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to manage subscription');
  }
});

/**
 * @route   GET /api/v1/strategic/household/dashboard
 * @desc    Get household procurement dashboard
 * @access  Private (Household)
 */
router.get('/dashboard', authenticate, requireRole('household'), async (req, res) => {
  try {
    const result = await service.getHouseholdDashboard(req.user.id);
    apiResponseHandler.sendSuccess(res, result, 'Household dashboard retrieved successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to retrieve household dashboard');
  }
});

/**
 * @route   POST /api/v1/strategic/household/aggregate-orders
 * @desc    Aggregate household orders for efficiency
 * @access  Private (Admin, Logistics Provider)
 */
router.post('/aggregate-orders', authenticate, authorize(['admin', 'logistics']), async (req, res) => {
  try {
    const result = await service.aggregateHouseholdOrders(req.body.region, req.body.delivery_date);
    apiResponseHandler.sendSuccess(res, result, 'Household orders aggregated successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to aggregate household orders');
  }
});

/**
 * @route   GET /api/v1/strategic/household/aggregation-groups/:id
 * @desc    Get aggregation group details
 * @access  Private (Admin, Logistics Provider)
 */
router.get('/aggregation-groups/:id', authenticate, authorize(['admin', 'logistics']), async (req, res) => {
  try {
    // Get aggregation group details - would need to implement this method in service
    const result = { group: null, message: 'Aggregation group details retrieval' };
    apiResponseHandler.sendSuccess(res, result, 'Aggregation group retrieved successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to retrieve aggregation group');
  }
});

module.exports = router;