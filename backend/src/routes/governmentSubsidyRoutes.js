/**
 * Government Subsidy Routes
 * API endpoints for government subsidy management
 *
 * Recovered from the old-new-folder dump — real file, real backing
 * service (services/strategic/governmentSubsidyService.js, exact
 * method-name matches for the non-stub routes), never copied into the
 * live routes/ tree or mounted. subsidy-programs/:id and applications/:id
 * GET are pre-existing TODO stubs in the original file (no query
 * implemented in the service) - kept as honest empty results rather than
 * invented data.
 */

const express = require('express');
const router = express.Router();
// Liveness ping carried over from governmentSubsidyRoutes.js, merged and
// retired 2026-09-13. Declared first so a pattern route cannot swallow it.
router.get('/health', (req, res) => {
  res.json({ success: true, status: 'healthy', module: 'governmentSubsidyRoutes' });
});

const GovernmentSubsidyService = require('../services/strategic/governmentSubsidyService');
const { authMiddleware: authenticate, requireRole } = require('../middleware/auth');
const apiResponseHandler = require('../middleware/apiResponseHandler');

const service = new GovernmentSubsidyService();

router.post('/subsidy-programs', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const result = await service.createSubsidyProgram(req.body);
    apiResponseHandler.sendSuccess(res, result, 'Subsidy program created successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to create subsidy program');
  }
});

router.get('/subsidy-programs', authenticate, async (req, res) => {
  try {
    const ministry = req.query.ministry;
    const fiscalYear = req.query.fiscal_year;
    const result = await service.getGovernmentDashboard(ministry, fiscalYear);
    apiResponseHandler.sendSuccess(res, result, 'Subsidy programs retrieved successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to retrieve subsidy programs');
  }
});

router.get('/subsidy-programs/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    // NOTE (pre-existing): not implemented in the service yet - kept as an
    // honest empty result rather than invented data.
    const result = { program: null, message: 'Subsidy program details retrieval' };
    apiResponseHandler.sendSuccess(res, result, 'Subsidy program retrieved successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to retrieve subsidy program');
  }
});

router.post('/eligibility', authenticate, async (req, res) => {
  try {
    const result = await service.calculateEligibility(req.body.farmer_id, req.body.program_id);
    apiResponseHandler.sendSuccess(res, result, 'Eligibility calculated successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to calculate eligibility');
  }
});

router.post('/applications', authenticate, requireRole('farmer'), async (req, res) => {
  try {
    const result = await service.submitSubsidyApplication(req.body);
    apiResponseHandler.sendSuccess(res, result, 'Subsidy application submitted successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to submit subsidy application');
  }
});

router.get('/applications/:id', authenticate, async (req, res) => {
  try {
    // NOTE (pre-existing): not implemented in the service yet - kept as an
    // honest empty result rather than invented data.
    const result = { application: null, message: 'Application details retrieval' };
    apiResponseHandler.sendSuccess(res, result, 'Application retrieved successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to retrieve application');
  }
});

router.post('/applications/:id/disburse', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const result = await service.disburseSubsidy(req.params.id, req.body);
    apiResponseHandler.sendSuccess(res, result, 'Subsidy disbursed successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to disburse subsidy');
  }
});

router.get('/programs/:id/impact', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const result = await service.trackSubsidyImpact(req.params.id);
    apiResponseHandler.sendSuccess(res, result, 'Subsidy impact tracked successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to track subsidy impact');
  }
});

router.get('/farmer-dashboard', authenticate, requireRole('farmer'), async (req, res) => {
  try {
    const result = await service.getFarmerSubsidyDashboard(req.user.id);
    apiResponseHandler.sendSuccess(res, result, 'Farmer subsidy dashboard retrieved successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to retrieve farmer subsidy dashboard');
  }
});

router.get('/dashboard', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const ministry = req.query.ministry;
    const fiscalYear = req.query.fiscal_year;
    const result = await service.getGovernmentDashboard(ministry, fiscalYear);
    apiResponseHandler.sendSuccess(res, result, 'Government dashboard retrieved successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to retrieve government dashboard');
  }
});

module.exports = router;
