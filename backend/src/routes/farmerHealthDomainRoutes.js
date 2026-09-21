/**
 * Real backend routes for FarmerHealthWelfarePage.jsx, backed by
 * services/farmerHealthService.js. getRecords -> listHealthRecords,
 * createRecord -> createHealthRecord, updateRecord -> updateHealthRecord,
 * deleteRecord -> deleteHealthRecord (name differences); farmerId/isAdmin
 * context filled from the authenticated user.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/farmerHealthService');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

const authCtx = (req) => ({ farmerId: req.user?.farmerId || req.user?.id, isAdmin: req.user?.role === 'admin' });

const wrap = (fn) => async (req, res) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.get('/farmer-health/records', wrap((req) => svc.listHealthRecords({ ...req.query, ...authCtx(req) })));
router.post('/farmer-health/record', wrap((req) => svc.createHealthRecord(req.body, authCtx(req))));
router.put('/farmer-health/record/:id', wrap((req) => svc.updateHealthRecord(req.params.id, req.body, authCtx(req))));
router.delete('/farmer-health/record/:id', wrap((req) => svc.deleteHealthRecord(req.params.id, authCtx(req))));

// farmerWelfareAPI (FarmerHealthWelfarePage.jsx)
router.get('/farmer-welfare/programs', wrap((req) => svc.getWelfarePrograms(req.query)));
router.post('/farmer-welfare/enroll', wrap((req) => svc.enrollWelfareProgram(req.body.farmerId, req.body.programId)));

module.exports = router;
