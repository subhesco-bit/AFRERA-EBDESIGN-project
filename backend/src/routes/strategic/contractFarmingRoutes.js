/**
 * Contract Farming Routes
 * API endpoints for contract farming agreements
 */

const express = require('express.js');
const router = express.Router();
const contractFarmingService = require('../../services/strategic/contractFarmingService.js');
const { authMiddleware: authenticate, requireRole } = require('../../middleware/auth.js');
const authorize = (roles) => requireRole(...roles);
const apiResponseHandler = require('../../middleware/apiResponseHandler.js');

const service = new contractFarmingService();

/**
 * @route   POST /api/v1/strategic/contract-farming/contracts
 * @desc    Create a new contract farming agreement
 * @access  Private (Farmer, Buyer)
 */
router.post('/contracts', authenticate, authorize(['farmer', 'buyer']), async (req, res) => {
  try {
    const contractData = { ...req.body };

    // Never trust a client-supplied party ID for either side of the agreement.
    // Farmers apply for themselves; buyers create offers for their own account.
    if (req.user.role === 'farmer') {
      contractData.farmer_id = req.user.id;
    } else {
      contractData.buyer_id = req.user.id;
    }

    const result = await service.createContract(contractData);
    apiResponseHandler.sendSuccess(res, result, 'Contract farming agreement created successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to create contract farming agreement');
  }
});

/**
 * @route   GET /api/v1/strategic/contract-farming/contracts/:id
 * @desc    Get contract farming agreement details and compliance
 * @access  Private (Farmer, Buyer)
 */
router.get('/contracts/:id', authenticate, async (req, res) => {
  try {
    let result = await service.trackCompliance(req.params.id);
    apiResponseHandler.sendSuccess(res, result, 'Contract compliance retrieved successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to retrieve contract compliance');
  }
});

/**
 * @route   POST /api/v1/strategic/contract-farming/contracts/:id/input-usage
 * @desc    Record input usage for contract
 * @access  Private (Farmer)
 */
router.post('/contracts/:id/input-usage', authenticate, requireRole('farmer'), async (req, res) => {
  try {
    let result = await service.recordInputUsage(req.params.id, req.body);
    apiResponseHandler.sendSuccess(res, result, 'Input usage recorded successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to record input usage');
  }
});

/**
 * @route   POST /api/v1/strategic/contract-farming/quality-tests/:testId/result
 * @desc    Submit quality test result
 * @access  Private (Buyer, Laboratory, Admin)
 */
router.post('/quality-tests/:testId/result', authenticate, authorize(['buyer', 'admin']), async (req, res) => {
  try {
    let result = await service.submitQualityTestResult(req.params.testId, req.body);
    apiResponseHandler.sendSuccess(res, result, 'Quality test result submitted successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to submit quality test result');
  }
});

/**
 * @route   POST /api/v1/strategic/contract-farming/contracts/:id/amend
 * @desc    Amend contract terms
 * @access  Private (Buyer, Farmer with approval)
 */
router.post('/contracts/:id/amend', authenticate, async (req, res) => {
  try {
    let result = await service.amendContract(req.params.id, req.body);
    apiResponseHandler.sendSuccess(res, result, 'Contract amended successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to amend contract');
  }
});

/**
 * @route   GET /api/v1/strategic/contract-farming/buyer-portfolio
 * @desc    Get buyer's contract farming portfolio
 * @access  Private (Buyer)
 */
router.get('/buyer-portfolio', authenticate, requireRole('buyer'), async (req, res) => {
  try {
    let result = await service.getBuyerContractPortfolio(req.user.id);
    apiResponseHandler.sendSuccess(res, result, 'Buyer contract portfolio retrieved successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to retrieve buyer contract portfolio');
  }
});

/**
 * @route   GET /api/v1/strategic/contract-farming/opportunities
 * @desc    Get available contract farming opportunities for farmers
 * @access  Private (Farmer)
 */
router.get('/opportunities', authenticate, requireRole('farmer'), async (req, res) => {
  try {
    let result = await service.getAvailableContractOpportunities(req.user.id);
    apiResponseHandler.sendSuccess(res, result, 'Contract farming opportunities retrieved successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to retrieve contract farming opportunities');
  }
});

/**
 * @route   GET /api/v1/strategic/contract-farming/farmer-contracts
 * @desc    Get farmer's contract farming agreements
 * @access  Private (Farmer)
 */
router.get('/farmer-contracts', authenticate, requireRole('farmer'), async (req, res) => {
  try {
    // Get farmer's contracts - would need to implement this method in service
    let result = { contracts: [], message: 'Farmer contracts retrieval' };
    apiResponseHandler.sendSuccess(res, result, 'Farmer contracts retrieved successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to retrieve farmer contracts');
  }
});

module.exports = router;