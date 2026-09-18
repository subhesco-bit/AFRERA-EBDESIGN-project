/**
 * Real backend routes for FarmerVerificationPage.jsx, backed by
 * services/farmerVerificationService.js. getRequests -> listRequests,
 * submitRequest -> createRequest, verify/rejectRequest ->
 * updateDecision(id, status, notes) (name differences).
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/farmerVerificationService');

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

router.get('/farmer-verification/requests', wrap((req) => svc.listRequests(req.query)));
router.post('/farmer-verification/request', wrap((req) => svc.createRequest(req.body)));
router.post('/farmer-verification/request/:id/verify', wrap((req) => svc.updateDecision(req.params.id, 'verified', req.body.notes)));
router.post('/farmer-verification/request/:id/reject', wrap((req) => svc.updateDecision(req.params.id, 'rejected', req.body.notes)));

module.exports = router;
