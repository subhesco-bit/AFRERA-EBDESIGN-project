'use strict';

const express = require('express');
const { authMiddleware, optionalAuth, requireRole } = require('../middleware/auth');
const { resolveFarmerId } = require('../middleware/resolveFarmerId');
const { logger } = require('../utils/logger');
const financialService = require('../services/legacy/financialService');
const operationsService = require('../services/legacy/operationsManagementService');
const enterpriseService = require('../services/enterpriseIntegrationService');

const router = express.Router();
const developmentSubscriptions = new Map();
const developmentOnly = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

const operationResources = {
  activities: operationsService.farmActivities,
  tasks: operationsService.farmTasks,
  contractors: operationsService.contractors,
  machinery: operationsService.machineryOperations,
  equipment: operationsService.equipmentScheduling,
  inputs: operationsService.inputConsumption,
  productivity: operationsService.farmProductivity,
  kpis: operationsService.farmOperationsDashboard,
};

function rejectDurability(res) {
  return res.status(501).json({
    success: false,
    implemented: false,
    error: 'Notifications persistence is not configured',
    message: 'Development-only in-memory notification adapter is disabled outside test/development.',
  });
}

router.get('/financial/overview', authMiddleware, resolveFarmerId, async (req, res, next) => {
  try {
    const [loans, advances] = await Promise.all([
      financialService.getFarmerLoans(req.farmerId, req.query),
      financialService.getFarmerAdvances(req.farmerId),
    ]);
    res.json({ success: true, data: { loans, advances } });
  } catch (error) { next(error); }
});

router.get('/financial/loans', authMiddleware, resolveFarmerId, async (req, res, next) => {
  try {
    const loans = await financialService.getFarmerLoans(req.farmerId, req.query);
    res.json({ success: true, data: { loans } });
  } catch (error) { next(error); }
});

router.get('/financial/loan-products', authMiddleware, (req, res) => {
  res.status(501).json({
    success: false,
    implemented: false,
    error: 'Loan products are not available',
    message: 'No verified loan-product service or database contract exists.',
  });
});

router.get('/operations/overview', authMiddleware, async (req, res, next) => {
  try {
    const entries = await Promise.all(Object.entries(operationResources).map(async ([name, service]) => {
      const result = await service.list({ ...req.query, limit: req.query.limit || 20 });
      return [name, result];
    }));
    res.json({ success: true, data: Object.fromEntries(entries) });
  } catch (error) { next(error); }
});

router.post('/errors/log', optionalAuth, (req, res) => {
  const errorData = req.body && typeof req.body === 'object' ? req.body : {};
  logger.error('client.error', { userId: req.user?.id, requestId: req.id, ...errorData });
  res.status(202).json({ success: true, logged: true });
});

router.post('/notifications/subscribe', authMiddleware, (req, res) => {
  if (!developmentOnly) return rejectDurability(res);
  const subscription = req.body?.subscription;
  if (!subscription || typeof subscription !== 'object') {
    return res.status(400).json({ success: false, error: 'subscription is required', code: 'INVALID_INPUT' });
  }
  developmentSubscriptions.set(req.user.id, subscription);
  return res.status(202).json({ success: true, durable: false, environment: process.env.NODE_ENV });
});

router.post('/notifications/unsubscribe', authMiddleware, (req, res) => {
  if (!developmentOnly) return rejectDurability(res);
  developmentSubscriptions.delete(req.user.id);
  return res.status(202).json({ success: true, durable: false, environment: process.env.NODE_ENV });
});

router.get('/enterprise/organizations/current/integrations', authMiddleware, requireRole('admin', 'organization_admin'), async (req, res, next) => {
  const organizationId = req.user?.organization_id;
  if (!organizationId) {
    return res.status(400).json({ success: false, error: 'Authenticated organization context is required', code: 'ORGANIZATION_CONTEXT_REQUIRED' });
  }
  try {
    const result = await enterpriseService.getOrganizationIntegrations(organizationId);
    const integrations = result.data.integrations.map(({ api_key, ...safeIntegration }) => safeIntegration);
    return res.json({ success: true, data: { ...result.data, integrations } });
  } catch (error) { return next(error); }
});

module.exports = router;