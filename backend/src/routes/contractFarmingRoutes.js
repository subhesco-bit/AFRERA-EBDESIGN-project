/**
 * Contract Farming Routes
 * API endpoints for contract farming agreements
 *
 * Recovered from the old-new-folder dump (_MERGE_LAB/features/ecommerce-marketplace)
 * — real, working file with a real backing service
 * (services/strategic/contractFarmingService.js, exact method-name matches),
 * it was simply never copied into the live routes/ tree or mounted.
 * farmer-contracts below is the one endpoint the original author left as a
 * literal TODO stub (empty array, no real query) — kept as-is rather than
 * silently "completed" with an invented implementation.
 */

const express = require('express');
const router = express.Router();
// Liveness ping carried over from contractFarmingRoutes.js, merged and
// retired 2026-09-13. Declared first so a pattern route cannot swallow it.
router.get('/health', (req, res) => {
  res.json({ success: true, status: 'healthy', module: 'contractFarmingRoutes' });
});

const ContractFarmingService = require('../services/strategic/contractFarmingService');
const { authMiddleware: authenticate, requireRole } = require('../middleware/auth');
const authorize = (roles) => requireRole(...roles);
const apiResponseHandler = require('../middleware/apiResponseHandler');

const service = new ContractFarmingService();

/**
 * @route   POST /api/v1/strategic/contract-farming/contracts
 * @desc    Create a new contract farming agreement
 * @access  Private (Farmer, Buyer)
 */
router.post('/contracts', authenticate, async (req, res) => {
  try {
    const result = await service.createContract(req.body);
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
    const result = await service.trackCompliance(req.params.id);
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
    const result = await service.recordInputUsage(req.params.id, req.body);
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
    const result = await service.submitQualityTestResult(req.params.testId, req.body);
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
    const result = await service.amendContract(req.params.id, req.body);
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
    const result = await service.getBuyerContractPortfolio(req.user.id);
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
    const result = await service.getAvailableContractOpportunities(req.user.id);
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
    const contracts = await service.getFarmerContracts(req.user.id, { limit: req.query.limit });
    const result = { contracts };
    apiResponseHandler.sendSuccess(res, result, 'Farmer contracts retrieved successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to retrieve farmer contracts');
  }
});

module.exports = router;
