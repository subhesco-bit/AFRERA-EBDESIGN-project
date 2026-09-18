/**
 * Pre-Season Purchase Routes
 * API endpoints for pre-season purchase agreements
 *
 * Recovered from the old-new-folder dump — real file, real backing service
 * (services/strategic/preSeasonPurchaseService.js, exact method-name
 * matches for the non-stub routes), never copied into the live routes/
 * tree or mounted. farmer-agreements GET is a pre-existing TODO stub in
 * the original file (no query implemented in the service) - kept as an
 * honest empty result rather than invented data.
 */

const express = require('express');
const router = express.Router();
// Liveness ping carried over from preSeasonPurchaseRoutes.js, merged and
// retired 2026-09-13. Declared first so a pattern route cannot swallow it.
router.get('/health', (req, res) => {
  res.json({ success: true, status: 'healthy', module: 'preSeasonPurchaseRoutes' });
});

const PreSeasonPurchaseService = require('../services/strategic/preSeasonPurchaseService');
const { authMiddleware: authenticate, requireRole } = require('../middleware/auth');
const authorize = (roles) => requireRole(...roles);
const apiResponseHandler = require('../middleware/apiResponseHandler');

const service = new PreSeasonPurchaseService();

router.post('/agreements', authenticate, async (req, res) => {
  try {
    const result = await service.createAgreement(req.body);
    apiResponseHandler.sendSuccess(res, result, 'Pre-season agreement created successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to create pre-season agreement');
  }
});

router.get('/agreements/:id', authenticate, async (req, res) => {
  try {
    const result = await service.trackProgress(req.params.id);
    apiResponseHandler.sendSuccess(res, result, 'Agreement progress retrieved successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to retrieve agreement progress');
  }
});

router.put('/agreements/:id/milestones/:milestoneId', authenticate, async (req, res) => {
  try {
    const result = await service.updateMilestone(req.params.milestoneId, req.body);
    apiResponseHandler.sendSuccess(res, result, 'Milestone updated successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to update milestone');
  }
});

router.post('/agreements/:id/settle', authenticate, authorize(['buyer', 'admin']), async (req, res) => {
  try {
    const result = await service.settleAgreement(req.params.id, req.body);
    apiResponseHandler.sendSuccess(res, result, 'Agreement settled successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to settle agreement');
  }
});

router.get('/opportunities', authenticate, async (req, res) => {
  try {
    const result = await service.getAvailableOpportunities(req.user.id);
    apiResponseHandler.sendSuccess(res, result, 'Opportunities retrieved successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to retrieve opportunities');
  }
});

router.get('/buyer-portfolio', authenticate, requireRole('buyer'), async (req, res) => {
  try {
    const result = await service.getBuyerPortfolio(req.user.id);
    apiResponseHandler.sendSuccess(res, result, 'Buyer portfolio retrieved successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to retrieve buyer portfolio');
  }
});

router.get('/farmer-agreements', authenticate, requireRole('farmer'), async (req, res) => {
  try {
    // NOTE (pre-existing): not implemented in the service yet - kept as an
    // honest empty result rather than invented data.
    const result = { agreements: [], message: 'Farmer agreements retrieval' };
    apiResponseHandler.sendSuccess(res, result, 'Farmer agreements retrieved successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to retrieve farmer agreements');
  }
});

module.exports = router;
