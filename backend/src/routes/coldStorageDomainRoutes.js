/**
 * Real backend routes for ColdStoragePage.jsx and ColdStorageDashboardPage.jsx,
 * backed by services/legacy/coldStorageService.js.
 *
 * A few page method names differ from the real ones: getComplianceStatus ->
 * getComplianceStats, getStatus -> getSystemStatus, getTemperatureData ->
 * getTemperatureReadings. getUtilization is called with a filter object on
 * one page but the real signature takes (facilityId, atDate) directly -
 * unwrapped below.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/coldStorageService');

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

router.post('/cold-storage/facility', wrap((req) => svc.createFacility(req.body)));
router.get('/cold-storage/facilities', wrap((req) => svc.getFacilities(req.query)));
router.get('/cold-storage/facility/:facilityId', wrap((req) => svc.getFacility(req.params.facilityId)));
router.put('/cold-storage/facility/:facilityId', wrap((req) => svc.updateFacility(req.params.facilityId, req.body)));

router.post('/cold-storage/booking', wrap((req) => svc.createBooking(req.body)));
router.get('/cold-storage/bookings', wrap((req) => svc.getBookings(req.query)));
router.put('/cold-storage/booking/:bookingId/status', wrap((req) => svc.updateBookingStatus(req.params.bookingId, req.body.status)));
router.post('/cold-storage/facility/:facilityId/book', wrap((req) => svc.bookFacility(req.params.facilityId, req.body)));

router.get('/cold-storage/utilization', wrap((req) => svc.getUtilization(req.query.facilityId, req.query.atDate)));
router.get('/cold-storage/compliance-status/:facilityId', wrap((req) => svc.getComplianceStats(req.params.facilityId, req.query.hours)));
router.get('/cold-storage/status', wrap(() => svc.getSystemStatus()));
router.get('/cold-storage/temperature/:facilityId', wrap((req) => svc.getTemperatureReadings(req.params.facilityId, req.query)));

module.exports = router;
