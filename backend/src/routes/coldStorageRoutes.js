/**
 * Cold Storage Routes.
 * Facility/booking CRUD plus the real capacity-checked booking rule and
 * utilization rollup — see backend/src/services/coldStorageService.js.
 */

const express = require('express');
const router = express.Router();
const coldStorageService = require('../services/legacy/coldStorageService');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { LOGISTICS_ROLES } = require('../middleware/roleGroups');
const { adminMiddleware } = require('../middleware/admin');

// System-wide status rollup for the dashboard overview (real aggregate,
// not canned — see coldStorageService.getSystemStatus).
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const status = await coldStorageService.getSystemStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Facilities
router.post('/facilities', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const facility = await coldStorageService.createFacility(req.body);
    res.status(201).json({ success: true, data: facility });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/facilities', authMiddleware, async (req, res) => {
  try {
    const facilities = await coldStorageService.getFacilitiesWithStatus(req.query);
    res.json({ success: true, data: facilities, total: facilities.length });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/facilities/:facilityId', authMiddleware, async (req, res) => {
  try {
    const facility = await coldStorageService.getFacility(req.params.facilityId);
    res.json({ success: true, data: facility });
  } catch (error) {
    res.status(error.message === 'Cold storage facility not found' ? 404 : 400).json({ success: false, error: error.message });
  }
});

router.put('/facilities/:facilityId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const facility = await coldStorageService.updateFacility(req.params.facilityId, req.body);
    res.json({ success: true, data: facility });
  } catch (error) {
    res.status(error.message === 'Cold storage facility not found' ? 404 : 400).json({ success: false, error: error.message });
  }
});

// Utilization — real rollup (single facility or all)
router.get('/utilization', authMiddleware, async (req, res) => {
  try {
    const data = await coldStorageService.getUtilization(req.query.facilityId || null, req.query.atDate || null);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Facility-scoped utilization (frontend coldStorageAPI.getUtilization(facilityId))
router.get('/facilities/:facilityId/utilization', authMiddleware, async (req, res) => {
  try {
    const data = await coldStorageService.getUtilization(req.params.facilityId, req.query.atDate || null);
    if (!data) return res.status(404).json({ success: false, error: 'Cold storage facility not found' });
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Real capacity-planning projection over the next N days (default 30).
router.get('/facilities/:facilityId/capacity-planning', authMiddleware, async (req, res) => {
  try {
    const data = await coldStorageService.getCapacityPlanning(req.params.facilityId, req.query.days);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.message === 'Cold storage facility not found' ? 404 : 400).json({ success: false, error: error.message });
  }
});

// Facility-scoped booking (frontend coldStorageAPI.bookFacility(facilityId, data))
router.post('/facilities/:facilityId/book', authMiddleware, async (req, res) => {
  try {
    const booking = await coldStorageService.bookFacility(req.params.facilityId, req.body);
    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    const status = error.code === 'CAPACITY_EXCEEDED' ? 422 : 400;
    res.status(status).json({ success: false, error: error.message });
  }
});

// -------------------------------------------------------------------
// Temperature compliance — facility-level probe log (merged in from the
// previously-unmounted backend/src/routes/logistics/coldStorageRoutes.js;
// see coldStorageService.js for the real math).
// -------------------------------------------------------------------

router.post('/facilities/:facilityId/temperature', authMiddleware, async (req, res) => {
  try {
    const result = await coldStorageService.recordTemperatureReading(req.params.facilityId, req.body);
    res.status(201).json({ success: true, data: result.reading, reasoning: result.reasoning });
  } catch (error) {
    res.status(error.message === 'Cold storage facility not found' ? 404 : 400).json({ success: false, error: error.message });
  }
});

router.get('/facilities/:facilityId/temperature', authMiddleware, async (req, res) => {
  try {
    const { page, limit, rows } = await coldStorageService.getTemperatureReadings(req.params.facilityId, req.query);
    res.json({ success: true, page, limit, count: rows.length, data: rows });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/facilities/:facilityId/alerts', authMiddleware, async (req, res) => {
  try {
    const alerts = await coldStorageService.getTemperatureAlerts(req.params.facilityId, req.query);
    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/facilities/:facilityId/compliance', authMiddleware, async (req, res) => {
  try {
    const data = await coldStorageService.getComplianceStats(req.params.facilityId, req.query.hours);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.message === 'Cold storage facility not found' ? 404 : 400).json({ success: false, error: error.message });
  }
});

// Bookings
router.post('/bookings', authMiddleware, async (req, res) => {
  try {
    const booking = await coldStorageService.createBooking(req.body);
    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    const status = error.code === 'CAPACITY_EXCEEDED' ? 422 : 400;
    res.status(status).json({ success: false, error: error.message });
  }
});

router.get('/bookings', authMiddleware, async (req, res) => {
  try {
    const bookings = await coldStorageService.getBookings(req.query);
    res.json({ success: true, data: bookings, total: bookings.length });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/bookings/:bookingId/status', authMiddleware, requireRole(...LOGISTICS_ROLES), async (req, res) => {
  try {
    const booking = await coldStorageService.updateBookingStatus(req.params.bookingId, req.body.status);
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(error.message === 'Booking not found' ? 404 : 400).json({ success: false, error: error.message });
  }
});

module.exports = router;
