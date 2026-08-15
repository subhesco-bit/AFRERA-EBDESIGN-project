/**
 * Geofencing routes — thin layer over services/geofencingService.js.
 *
 * Two real use cases only (see the service file for the full honest scope
 * note): a manual labour/farmer check-in, and a driver-ping-vs-warehouse-zone
 * check that reads the existing driver_location pipeline. Nothing here does
 * continuous tracking or polygon-precision geofencing.
 */
const express = require('express');
const router = express.Router();
const geofencingService = require('../services/geofencingService');
const { authMiddleware } = require('../middleware/auth');

const fail = (res, e) => res
  .status(/required|must|Refusing|not found|not active|No recorded/i.test(e.message) ? 400 : 500)
  .json({ success: false, error: e.message });

// ---------------------------------------------------------------------------
// Zone definition
// ---------------------------------------------------------------------------

router.post('/zones', authMiddleware, async (req, res) => {
  try {
    const data = await geofencingService.createGeofence({ ...req.body, createdBy: req.user?.id });
    res.status(201).json({ success: true, data });
  } catch (e) { fail(res, e); }
});

router.get('/zones', authMiddleware, async (req, res) => {
  try {
    const data = await geofencingService.listGeofences(req.query);
    res.json({ success: true, data });
  } catch (e) { fail(res, e); }
});

router.get('/zones/:id', authMiddleware, async (req, res) => {
  try {
    const data = await geofencingService.getGeofence(req.params.id);
    res.json({ success: true, data });
  } catch (e) { fail(res, e); }
});

// ---------------------------------------------------------------------------
// Use case 1 — manual labour/farmer check-in
// ---------------------------------------------------------------------------

router.post('/checkins', authMiddleware, async (req, res) => {
  try {
    const { geofenceId, latitude, longitude, accuracyM } = req.body;
    const data = await geofencingService.checkIn({
      geofenceId,
      userId: req.user?.id,
      userRole: req.user?.role,
      latitude,
      longitude,
      accuracyM,
    });
    res.json({ success: true, data });
  } catch (e) { fail(res, e); }
});

router.get('/checkins', authMiddleware, async (req, res) => {
  try {
    const data = await geofencingService.checkInHistory({
      userId: req.query.userId || req.user?.id,
      geofenceId: req.query.geofenceId,
      limit: req.query.limit,
    });
    res.json({ success: true, data });
  } catch (e) { fail(res, e); }
});

// ---------------------------------------------------------------------------
// Use case 2 — driver/shipment zone arrival (reads existing driver_location)
// ---------------------------------------------------------------------------

router.post('/driver-zone-check', authMiddleware, async (req, res) => {
  try {
    const { geofenceId, driverId, shipmentId } = req.body;
    const data = await geofencingService.checkDriverZoneArrival({ geofenceId, driverId, shipmentId });
    res.json({ success: true, data });
  } catch (e) { fail(res, e); }
});

module.exports = router;
