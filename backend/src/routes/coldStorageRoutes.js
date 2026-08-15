/**
 * Cold Storage Routes.
 * Facility/booking CRUD plus the real capacity-checked booking rule and
 * utilization rollup — see backend/src/services/coldStorageService.js.
 */

const express = require('express');
const router = express.Router();
const coldStorageService = require('../services/coldStorageService');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/admin');

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
    const facilities = await coldStorageService.getFacilities(req.query);
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

router.put('/bookings/:bookingId/status', authMiddleware, async (req, res) => {
  try {
    const booking = await coldStorageService.updateBookingStatus(req.params.bookingId, req.body.status);
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(error.message === 'Booking not found' ? 404 : 400).json({ success: false, error: error.message });
  }
});

module.exports = router;
