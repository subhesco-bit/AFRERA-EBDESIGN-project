/**
 * Pre-Season Purchase Routes
 * API endpoints for pre-season purchase agreements
 */

const express = require('express');
const router = express.Router();
const preSeasonPurchaseService = require('../../services/strategic/preSeasonPurchaseService');
const { authMiddleware: authenticate, requireRole } = require('../../middleware/auth');
const authorize = (roles) => requireRole(...roles);
const apiResponseHandler = require('../../middleware/apiResponseHandler');

const service = new preSeasonPurchaseService();

/**
 * @route   POST /api/v1/strategic/pre-season/agreements
 * @desc    Create a new pre-season purchase agreement
 * @access  Private (Farmer, Buyer)
 */
router.post('/agreements', authenticate, async (req, res) => {
  try {
    const result = await service.createAgreement(req.body);
    apiResponseHandler.sendSuccess(res, result, 'Pre-season agreement created successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to create pre-season agreement');
  }
});

/**
 * @route   GET /api/v1/strategic/pre-season/agreements/:id
 * @desc    Get pre-season agreement details and progress
 * @access  Private (Farmer, Buyer)
 */
router.get('/agreements/:id', authenticate, async (req, res) => {
  try {
    let result = await service.trackProgress(req.params.id);
    apiResponseHandler.sendSuccess(res, result, 'Agreement progress retrieved successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to retrieve agreement progress');
  }
});

/**
 * @route   PUT /api/v1/strategic/pre-season/agreements/:id/milestones/:milestoneId
 * @desc    Update milestone status
 * @access  Private (Farmer, Buyer)
 */
router.put('/agreements/:id/milestones/:milestoneId', authenticate, async (req, res) => {
  try {
    let result = await service.updateMilestone(req.params.milestoneId, req.body);
    apiResponseHandler.sendSuccess(res, result, 'Milestone updated successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to update milestone');
  }
});

/**
 * @route   POST /api/v1/strategic/pre-season/agreements/:id/settle
 * @desc    Settle pre-season agreement
 * @access  Private (Buyer, Admin)
 */
router.post('/agreements/:id/settle', authenticate, authorize(['buyer', 'admin']), async (req, res) => {
  try {
    let result = await service.settleAgreement(req.params.id, req.body);
    apiResponseHandler.sendSuccess(res, result, 'Agreement settled successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to settle agreement');
  }
});

/**
 * @route   GET /api/v1/strategic/pre-season/opportunities
 * @desc    Get available pre-season opportunities for farmers
 * @access  Private (Farmer)
 */
router.get('/opportunities', authenticate, async (req, res) => {
  try {
    let result = await service.getAvailableOpportunities(req.user.id);
    apiResponseHandler.sendSuccess(res, result, 'Opportunities retrieved successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to retrieve opportunities');
  }
});

/**
 * @route   GET /api/v1/strategic/pre-season/buyer-portfolio
 * @desc    Get buyer's pre-season portfolio
 * @access  Private (Buyer)
 */
router.get('/buyer-portfolio', authenticate, requireRole('buyer'), async (req, res) => {
  try {
    let result = await service.getBuyerPortfolio(req.user.id);
    apiResponseHandler.sendSuccess(res, result, 'Buyer portfolio retrieved successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to retrieve buyer portfolio');
  }
});

/**
 * @route   GET /api/v1/strategic/pre-season/farmer-agreements
 * @desc    Get farmer's pre-season agreements
 * @access  Private (Farmer)
 */
router.get('/farmer-agreements', authenticate, requireRole('farmer'), async (req, res) => {
  try {
    // Get farmer's agreements - would need to implement this method in service
    let result = { agreements: [], message: 'Farmer agreements retrieval' };
    apiResponseHandler.sendSuccess(res, result, 'Farmer agreements retrieved successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to retrieve farmer agreements');
  }
});

module.exports = router;