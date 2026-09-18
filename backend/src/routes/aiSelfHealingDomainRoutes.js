/**
 * Real backend routes for AISelfHealingPage.jsx, backed by
 * services/legacy/aiSelfHealingService.js (NOT services/ai/aiSelfHealingService.js,
 * a 15-line mock stub).
 *
 * Several page method names/argument shapes differ from the real ones:
 * predictFailures -> predictiveFailurePrevention, detectError({error}) ->
 * detectAndClassifyError(error), rootCauseAnalysis(payload) ->
 * performRootCauseAnalysis(payload) [context defaults to {}],
 * addErrorPattern({name,...}) -> addErrorPattern(name, pattern),
 * addRecoveryStrategy({error_type,strategies}) ->
 * addRecoveryStrategy(errorType, strategies), executeRecovery({error_type,
 * context}) -> executeRecoveryStrategy(errorType, context).
 *
 * runHealingCycle and executeHealingDecision, which the page also calls,
 * have no implementation anywhere - not wired, flagged instead of faked.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/aiSelfHealingService');

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

const wrap = (fn) => async (req, res) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.get('/ai-self-healing/health-metrics', wrap(() => svc.getHealthMetrics()));
router.get('/ai-self-healing/health', wrap(() => ({ status: 'healthy', service: 'aiSelfHealingService' })));
router.get('/ai-self-healing/system-state', wrap(() => svc.getSystemState()));
router.get('/ai-self-healing/predict-failures', wrap(() => svc.predictiveFailurePrevention()));
router.post('/ai-self-healing/detect-error', wrap((req) => svc.detectAndClassifyError(req.body.error)));
router.post('/ai-self-healing/root-cause-analysis', wrap((req) => svc.performRootCauseAnalysis(req.body)));
router.get('/ai-self-healing/healing-history', wrap((req) => svc.getHealingHistory(req.query.limit)));
router.post('/ai-self-healing/error-pattern', wrap((req) => svc.addErrorPattern(req.body.name, { severity: req.body.severity, category: req.body.category, patterns: req.body.patterns })));
router.post('/ai-self-healing/recovery-strategy', wrap((req) => svc.addRecoveryStrategy(req.body.error_type, req.body.strategies)));
router.post('/ai-self-healing/execute-recovery', wrap((req) => svc.executeRecoveryStrategy(req.body.error_type, req.body.context)));

module.exports = router;
