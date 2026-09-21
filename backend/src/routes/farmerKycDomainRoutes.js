/**
 * Real backend routes for FarmerKycPage.jsx, backed by
 * services/farmerKycService.js. getApplications -> list, submitApplication
 * -> create, verify/rejectApplication -> decide(id, status, notes) (name
 * differences).
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/farmerKycService');

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

router.get('/farmer-kyc/applications', wrap((req) => svc.list(req.query)));
router.post('/farmer-kyc/application', wrap((req) => svc.create(req.body)));
router.post('/farmer-kyc/application/:id/verify', wrap((req) => svc.decide(req.params.id, 'verified', req.body.notes)));
router.post('/farmer-kyc/application/:id/reject', wrap((req) => svc.decide(req.params.id, 'rejected', req.body.reason)));

module.exports = router;
