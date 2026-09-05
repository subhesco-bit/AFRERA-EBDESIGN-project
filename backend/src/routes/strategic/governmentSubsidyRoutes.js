/**
 * Government Subsidy Routes
 * API endpoints for government subsidy management
 */

const express = require('express');
const router = express.Router();
const governmentSubsidyService = require('../../services/strategic/governmentSubsidyService');
const { authMiddleware: authenticate, requireRole } = require('../../middleware/auth');
const authorize = (roles) => requireRole(...roles);
const apiResponseHandler = require('../../middleware/apiResponseHandler');

const service = new governmentSubsidyService();

/**
 * @route   POST /api/v1/strategic/government/subsidy-programs
 * @desc    Create a new government subsidy program
 * @access  Private (Government Admin)
 */
router.post('/subsidy-programs', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const result = await service.createSubsidyProgram(req.body);
    apiResponseHandler.sendSuccess(res, result, 'Subsidy program created successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to create subsidy program');
  }
});

/**
 * @route   GET /api/v1/strategic/government/subsidy-programs
 * @desc    Get all subsidy programs (with optional filters)
 * @access  Private (Government Admin, Public)
 */
router.get('/subsidy-programs', authenticate, async (req, res) => {
  try {
    const ministry = req.query.ministry;
    const fiscalYear = req.query.fiscal_year;
    let result = await service.getGovernmentDashboard(ministry, fiscalYear);
    apiResponseHandler.sendSuccess(res, result, 'Subsidy programs retrieved successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to retrieve subsidy programs');
  }
});

/**
 * @route   GET /api/v1/strategic/government/subsidy-programs/:id
 * @desc    Get subsidy program details
 * @access  Private (Government Admin)
 */
router.get('/subsidy-programs/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    // Get program details - would need to implement this method in service
    let result = { program: null, message: 'Subsidy program details retrieval' };
    apiResponseHandler.sendSuccess(res, result, 'Subsidy program retrieved successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to retrieve subsidy program');
  }
});

/**
 * @route   POST /api/v1/strategic/government/eligibility
 * @desc    Calculate subsidy eligibility for farmer
 * @access  Private (Farmer, Government Admin)
 */
router.post('/eligibility', authenticate, async (req, res) => {
  try {
    let result = await service.calculateEligibility(req.body.farmer_id, req.body.program_id);
    apiResponseHandler.sendSuccess(res, result, 'Eligibility calculated successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to calculate eligibility');
  }
});

/**
 * @route   POST /api/v1/strategic/government/applications
 * @desc    Submit subsidy application
 * @access  Private (Farmer)
 */
router.post('/applications', authenticate, requireRole('farmer'), async (req, res) => {
  try {
    let result = await service.submitSubsidyApplication(req.body);
    apiResponseHandler.sendSuccess(res, result, 'Subsidy application submitted successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to submit subsidy application');
  }
});

/**
 * @route   GET /api/v1/strategic/government/applications/:id
 * @desc    Get subsidy application details
 * @access  Private (Farmer, Government Admin)
 */
router.get('/applications/:id', authenticate, async (req, res) => {
  try {
    // Get application details - would need to implement this method in service
    let result = { application: null, message: 'Application details retrieval' };
    apiResponseHandler.sendSuccess(res, result, 'Application retrieved successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to retrieve application');
  }
});

/**
 * @route   POST /api/v1/strategic/government/applications/:id/disburse
 * @desc    Process subsidy disbursement
 * @access  Private (Government Admin)
 */
router.post('/applications/:id/disburse', authenticate, requireRole('admin'), async (req, res) => {
  try {
    let result = await service.disburseSubsidy(req.params.id, req.body);
    apiResponseHandler.sendSuccess(res, result, 'Subsidy disbursed successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to disburse subsidy');
  }
});

/**
 * @route   GET /api/v1/strategic/government/programs/:id/impact
 * @desc    Track subsidy utilization and impact
 * @access  Private (Government Admin)
 */
router.get('/programs/:id/impact', authenticate, requireRole('admin'), async (req, res) => {
  try {
    let result = await service.trackSubsidyImpact(req.params.id);
    apiResponseHandler.sendSuccess(res, result, 'Subsidy impact tracked successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to track subsidy impact');
  }
});

/**
 * @route   GET /api/v1/strategic/government/farmer-dashboard
 * @desc    Get farmer's subsidy dashboard
 * @access  Private (Farmer)
 */
router.get('/farmer-dashboard', authenticate, requireRole('farmer'), async (req, res) => {
  try {
    let result = await service.getFarmerSubsidyDashboard(req.user.id);
    apiResponseHandler.sendSuccess(res, result, 'Farmer subsidy dashboard retrieved successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to retrieve farmer subsidy dashboard');
  }
});

/**
 * @route   GET /api/v1/strategic/government/dashboard
 * @desc    Get government subsidy dashboard
 * @access  Private (Government Admin)
 */
router.get('/dashboard', authenticate, requireRole('admin'), async (req, res) => {
  try {
    let ministry = req.query.ministry;
    let fiscalYear = req.query.fiscal_year;
    let result = await service.getGovernmentDashboard(ministry, fiscalYear);
    apiResponseHandler.sendSuccess(res, result, 'Government dashboard retrieved successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to retrieve government dashboard');
  }
});

module.exports = router;