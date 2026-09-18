/**
 * Household Procurement Routes
 * API endpoints for household procurement planning
 *
 * Recovered from the old-new-folder dump — real file, real backing service
 * (services/strategic/householdProcurementService.js, exact method-name
 * matches for the non-stub routes), never copied into the live routes/
 * tree or mounted. procurement-plans/:id GET and aggregation-groups/:id
 * GET are pre-existing TODO stubs in the original file (no query
 * implemented in the service) - kept as honest empty results rather than
 * invented data.
 */

const express = require('express');
const router = express.Router();
// Liveness ping carried over from householdProcurementRoutes.js, merged and
// retired 2026-09-13. Declared first so a pattern route cannot swallow it.
router.get('/health', (req, res) => {
  res.json({ success: true, status: 'healthy', module: 'householdProcurementRoutes' });
});

const HouseholdProcurementService = require('../services/strategic/householdProcurementService');
const { authMiddleware: authenticate, requireRole } = require('../middleware/auth');
const authorize = (roles) => requireRole(...roles);
const apiResponseHandler = require('../middleware/apiResponseHandler');

const service = new HouseholdProcurementService();
// Household reads use the authenticated actor rather than a caller-supplied ID.
router.get('/procurement-plans', authenticate, async (req, res) => {
  try { res.json({ success: true, data: await service.listProcurementPlans(req.user.id) }); }
  catch { res.status(503).json({ success: false, error: 'Household plans unavailable' }); }
});

router.get('/subscriptions', authenticate, async (req, res) => {
  try { res.json({ success: true, data: await service.listSubscriptions(req.user.id) }); }
  catch { res.status(503).json({ success: false, error: 'Household subscriptions unavailable' }); }
});

router.post('/procurement-plans', authenticate, async (req, res) => {
  try {
    const result = await service.createProcurementPlan(req.body, req.user.id);
    apiResponseHandler.sendSuccess(res, result, 'Procurement plan created successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to create procurement plan');
  }
});

router.get('/procurement-plans/:id', authenticate, async (req, res) => {
  try {
    const result = await service.getProcurementPlan(req.params.id, req.user.id);
    if (!result) return res.status(404).json({ success: false, error: 'Plan not found' });
    apiResponseHandler.sendSuccess(res, result, 'Procurement plan retrieved successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to retrieve procurement plan');
  }
});

router.post('/subscriptions', authenticate, async (req, res) => {
  try {
    const result = await service.createSubscription(req.body);
    apiResponseHandler.sendSuccess(res, result, 'Subscription created successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to create subscription');
  }
});

router.put('/subscriptions/:id', authenticate, async (req, res) => {
  try {
    const result = await service.manageSubscription(req.params.id, req.body);
    apiResponseHandler.sendSuccess(res, result, 'Subscription managed successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to manage subscription');
  }
});

router.get('/dashboard', authenticate, requireRole('household'), async (req, res) => {
  try {
    const result = await service.getHouseholdDashboard(req.user.id);
    apiResponseHandler.sendSuccess(res, result, 'Household dashboard retrieved successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to retrieve household dashboard');
  }
});

router.post('/aggregate-orders', authenticate, authorize(['admin', 'logistics']), async (req, res) => {
  try {
    const result = await service.aggregateHouseholdOrders(req.body.region, req.body.delivery_date);
    apiResponseHandler.sendSuccess(res, result, 'Household orders aggregated successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to aggregate household orders');
  }
});

router.get('/aggregation-groups/:id', authenticate, authorize(['admin', 'logistics']), async (req, res) => {
  try {
    const result = await service.getAggregationGroup(req.params.id);
    if (!result) return res.status(404).json({ success: false, error: 'Aggregation group not found' });
    apiResponseHandler.sendSuccess(res, result, 'Aggregation group retrieved successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message, 'Failed to retrieve aggregation group');
  }
});

module.exports = router;
