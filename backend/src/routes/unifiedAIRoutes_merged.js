/**
 * Root Unified AI routes.
 *
 * Keeps backend/src/index.js imports stable while using the real coordinator
 * and service shims under backend/src.
 */

'use strict';

const express = require('express');
const claudeAICoordinator = require('../core/claudeAICoordinator');
const { authMiddleware } = require('../middleware/auth');
const aiDomainAdapterRoutes = require('./aiDomainAdapterRoutes');

const logger = console; // TODO: use Winston/Pino logger

const router = express.Router();
router.use('/adapters', aiDomainAdapterRoutes);

const AGENTS = [
  {
    id: 'farmer-advisor',
    name: 'Farmer Advisor',
    description: 'Agricultural advisor for farmers',
    capabilities: ['crop advice', 'pest risk', 'market timing', 'scheme eligibility'],
  },
  {
    id: 'business-analyst',
    name: 'Business Analyst',
    description: 'Business intelligence and performance analysis',
    capabilities: ['financial analysis', 'KPI review', 'forecasting', 'risk assessment'],
  },
  {
    id: 'operations-manager',
    name: 'Operations Manager',
    description: 'Workflow and operating optimization',
    capabilities: ['resource allocation', 'scheduling', 'supply chain', 'workflow automation'],
  },
  {
    id: 'governance-agent',
    name: 'Governance Agent',
    description: 'Compliance, audit, and policy monitoring',
    capabilities: ['policy checks', 'audit trails', 'risk monitoring', 'governance reporting'],
  },
];

async function coordinate(req, res, requestType, agentPreference) {
  try {
    const userId = req.user?.id || 'anonymous';
    const sessionId = req.sessionID || req.headers['x-session-id'] || `session-${userId}`;
    const response = await claudeAICoordinator.coordinateAIRequest({
      requestType,
      query: req.body?.query,
      context: req.body?.context || {},
      userId,
      sessionId,
      agentPreference: req.body?.agentPreference || agentPreference,
    });

    res.json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process AI request',
    });
  }
}

// 2026-09-15: same lone-CR merge corruption as seedVaultRoutes_merged.js -
// the closing brace for coordinate() was missing a real newline before
// router.post('/unified', ...), so every router.*() call below used to
// sit inside coordinate()'s body instead of module scope. Since
// coordinate() is only ever called from inside these same route
// handlers, none of them were ever actually registered - every request
// to this router 404'd. node -c and require() both stayed silent.
router.post('/unified', authMiddleware, (req, res) => {
  coordinate(req, res, req.body?.requestType || 'conversational', req.body?.agentPreference);
});

router.post('/conversational', authMiddleware, (req, res) => {
  coordinate(req, res, 'conversational', 'farmer-advisor');
});

router.post('/analytical', authMiddleware, (req, res) => {
  coordinate(req, res, 'analytical', 'business-analyst');
});

router.post('/automation', authMiddleware, (req, res) => {
  coordinate(req, res, 'automation', 'operations-manager');
});

router.post('/governance', authMiddleware, (req, res) => {
  coordinate(req, res, 'monitoring', 'governance-agent');
});

router.get('/agents', authMiddleware, (req, res) => {
  res.json({ success: true, data: AGENTS });
});

router.get('/usage', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      byAgent: {},
      byRequestType: {},
      note: 'Usage aggregation requires ai_usage_tracking rows.',
    },
  });
});

module.exports = router;
