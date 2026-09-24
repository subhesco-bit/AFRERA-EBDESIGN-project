/**
 * Escrow policy + issue resolution API
 * Mount: /api/v1/escrow  and nested under /api/v1/afrera
 */

'use strict';

const express = require('express');
const router = express.Router();
const escrow = require('../services/commerce/escrowPolicyEngine');
const issues = require('../services/commerce/issueResolutionWorkflow');

function fail(res, e) {
  const status = e.code ? 400 : 500;
  res.status(status).json({ success: false, error: e.message, code: e.code, allowed: e.allowed, missing: e.missing });
}

router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'escrow_policy_issue_resolution',
    policies: Object.keys(escrow.POLICIES),
  });
});

router.get('/policies', (req, res) => {
  res.json({ success: true, ...escrow.listPolicies() });
});

router.post('/escrows', async (req, res) => {
  try {
    res.json({ success: true, ...escrow.createEscrow(req.body || {}) });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/escrows/:id/fund', async (req, res) => {
  try {
    res.json({ success: true, ...escrow.fund(req.params.id, req.body || {}) });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/escrows/:id/condition', async (req, res) => {
  try {
    res.json({
      success: true,
      ...escrow.setCondition(req.params.id, req.body?.key, req.body?.value),
    });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/escrows/:id/request-release', async (req, res) => {
  try {
    res.json({ success: true, ...escrow.requestRelease(req.params.id, req.body || {}) });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/escrows/:id/release', async (req, res) => {
  try {
    res.json({ success: true, ...escrow.release(req.params.id, req.body || {}) });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/escrows/:id/refund', async (req, res) => {
  try {
    res.json({ success: true, ...escrow.refund(req.params.id, req.body || {}) });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/escrows/:id/dispute', async (req, res) => {
  try {
    res.json({ success: true, ...(await escrow.openDispute(req.params.id, req.body || {})) });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/escrows/:id/resolve', async (req, res) => {
  try {
    res.json({ success: true, ...escrow.resolveDispute(req.params.id, req.body || {}) });
  } catch (e) {
    fail(res, e);
  }
});

router.get('/escrows/:id', (req, res) => {
  const e = escrow.get(req.params.id);
  if (!e) return res.status(404).json({ success: false, error: 'not found' });
  res.json({ success: true, escrow: e });
});

router.get('/escrows', (req, res) => {
  res.json({ success: true, escrows: escrow.list(req.query) });
});

router.post('/escrow/operate', async (req, res) => {
  try {
    res.json({ success: true, ...(await escrow.operate(req.body || {})) });
  } catch (e) {
    fail(res, e);
  }
});

// Issues
router.post('/issues', async (req, res) => {
  try {
    res.json({ success: true, issue: issues.create(req.body || {}) });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/issues/:id/transition', async (req, res) => {
  try {
    res.json({
      success: true,
      issue: issues.transition(req.params.id, req.body?.to, req.body?.event),
    });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/issues/:id/evidence', async (req, res) => {
  try {
    res.json({ success: true, issue: issues.addEvidence(req.params.id, req.body || {}) });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/issues/:id/resolve', async (req, res) => {
  try {
    res.json({ success: true, issue: await issues.resolve(req.params.id, req.body || {}) });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/issues/:id/escalate', async (req, res) => {
  try {
    res.json({ success: true, issue: issues.escalate(req.params.id, req.body?.note) });
  } catch (e) {
    fail(res, e);
  }
});

router.get('/issues', (req, res) => {
  res.json({ success: true, issues: issues.list(req.query) });
});

router.get('/issues/sla-breaches', (req, res) => {
  res.json({ success: true, issues: issues.slaBreaches() });
});

router.post('/issues/operate', async (req, res) => {
  try {
    res.json({ success: true, ...(await issues.operate(req.body || {})) });
  } catch (e) {
    fail(res, e);
  }
});

module.exports = router;
