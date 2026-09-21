/**
 * Real backend routes for LandRegistryPage.jsx, backed by
 * services/legacy/landRecordsService.js. getParcels -> getFarmerLandRecords,
 * createParcel -> addLandRecord, updateParcel -> updateLandRecord,
 * deleteParcel -> deleteLandRecord (name differences); farmerId filled
 * from the authenticated user.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/landRecordsService');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

const wrap = (fn) => async (req, res) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.get('/land/parcels', wrap((req) => svc.getFarmerLandRecords(req.user.id, req.query)));
router.post('/land/parcel', wrap((req) => svc.addLandRecord(req.user.id, req.body)));
router.put('/land/parcel/:id', wrap((req) => svc.updateLandRecord(req.params.id, req.user.id, req.body)));
router.delete('/land/parcel/:id', wrap((req) => svc.deleteLandRecord(req.params.id, req.user.id)));

module.exports = router;
