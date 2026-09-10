/**
 * Geofencing Routes — real geometric zone-entry/exit tracking.
 *
 * Schema: geofences / geofence_events (migration 9997_geofencing.sql,
 * already present — circular zones only; see that migration's header for
 * why circular rather than polygon: no surveyed field/warehouse boundary
 * data exists in this platform yet).
 *
 * Geometry: backend/src/utils/geo.js (already present) — haversine distance
 * for the stored circular zones, plus ray-casting point-in-polygon exposed
 * here as a stateless ad-hoc check for callers who already have their own
 * polygon (no schema support for storing a polygon zone yet).
 *
 * This is distinct from logisticsEnhancementService.js's setGeofence(), which
 * attaches one radius+coordinates geofence directly to a single shipment
 * (shipment_geofences table). This module manages independently reusable
 * named zones (a warehouse, a mandi yard, a district boundary) that many
 * shipments/drivers/farmers can be checked against, and keeps a real
 * entry/exit event log per zone.
 */

const express = require('express');
const router = express.Router();

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) return res.status(401).json({ error: "Unauthorized" });
    if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
    next();

}

}

}

const pool = require('../../database/pool');
const { logger } = require('../../utils/logger');
const { authMiddleware, requireRole } = require('../../middleware/auth');
const { distanceKm, isValidCoord, isWithinPolygon } = require('../../utils/geo');

const MAX_LIMIT = 1000;
const DEFAULT_LIMIT = 200;

function boundedPage({ page, limit }) {
  const p = Math.max(parseInt(page, 10) || 1, 1);
  const l = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  return { page: p, limit: l, offset: (p - 1) * l };
}

// ---------------------------------------------------------------------------
// Zones
// ---------------------------------------------------------------------------

router.post('/zones', authMiddleware, requireRole('logistics', 'admin'), async (req, res) => {
  try {
    const {
      name, zoneType, centerLatitude, centerLongitude, radiusMeters,
      description, referenceId, referenceType
    } = req.body || {};

    if (!name || !zoneType) {
      return res.status(400).json({ success: false, error: 'name and zoneType are required' });
    }
    if (!isValidCoord(centerLatitude, centerLongitude)) {
      return res.status(400).json({ success: false, error: 'centerLatitude/centerLongitude must be valid coordinates' });
    }
    const radius = Number(radiusMeters);
    if (!Number.isFinite(radius) || radius < 20) {
      return res.status(400).json({ success: false, error: 'radiusMeters must be a number >= 20 (real GPS accuracy floor)' });
    }

    const { rows } = await pool.query(
      `INSERT INTO geofences
         (name, zone_type, center_latitude, center_longitude, radius_meters, description, reference_id, reference_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [name, zoneType, centerLatitude, centerLongitude, radius, description || null, referenceId || null, referenceType || null]
    );

    logger.info(`Geofence zone created: ${rows[0].id} (${name})`);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (error) {
    logger.error('Error creating geofence zone', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/zones', async (req, res) => {
  try {
    const { zoneType, activeOnly } = req.query;
    const params = [];
    const clauses = [];
    if (zoneType) { params.push(zoneType); clauses.push(`zone_type = $${params.length}`); }
    if (activeOnly !== 'false') { clauses.push('is_active = TRUE'); }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const { rows } = await pool.query(`SELECT * FROM geofences ${where} ORDER BY name ASC`, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    logger.error('Error listing geofence zones', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/zones/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM geofences WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Geofence not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    logger.error('Error getting geofence zone', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/zones/:id', authMiddleware, requireRole('logistics', 'admin'), async (req, res) => {
  try {
    const { name, description, radiusMeters, isActive } = req.body || {};
    if (radiusMeters !== undefined && (!Number.isFinite(Number(radiusMeters)) || Number(radiusMeters) < 20)) {
      return res.status(400).json({ success: false, error: 'radiusMeters must be a number >= 20' });
    }
    const { rows } = await pool.query(
      `UPDATE geofences SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         radius_meters = COALESCE($3, radius_meters),
         is_active = COALESCE($4, is_active)
       WHERE id = $5
       RETURNING *`,
      [name, description, radiusMeters, isActive, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Geofence not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    logger.error('Error updating geofence zone', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/zones/:id', authMiddleware, requireRole('logistics', 'admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE geofences SET is_active = FALSE WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Geofence not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    logger.error('Error deactivating geofence zone', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Entry/exit checks — the real geometry
// ---------------------------------------------------------------------------

/**
 * Point-in-circle test via haversine distance (geo.js), plus a real
 * transition check: this reading only becomes an 'entered'/'exited' event
 * if it actually changes the previous known inside/outside state for the
 * same identity (user_id or driver_id) against this geofence — so a driver
 * ping every few minutes while parked inside a warehouse zone does not spam
 * repeated "entered" events.
 */
router.post('/zones/:id/check', authMiddleware, async (req, res) => {
  try {
    const { latitude, longitude, source, userId, driverId, shipmentId, accuracyM } = req.body || {};

    if (!['manual_checkin', 'driver_ping'].includes(source)) {
      return res.status(400).json({ success: false, error: "source must be 'manual_checkin' or 'driver_ping'" });
    }
    if (!isValidCoord(latitude, longitude)) {
      return res.status(400).json({ success: false, error: 'latitude/longitude must be valid coordinates' });
    }
    if (source === 'manual_checkin' && !userId) {
      return res.status(400).json({ success: false, error: 'userId is required for source manual_checkin' });
    }
    if (source === 'driver_ping' && !driverId) {
      return res.status(400).json({ success: false, error: 'driverId is required for source driver_ping' });
    }

    const { rows: zoneRows } = await pool.query('SELECT * FROM geofences WHERE id = $1', [req.params.id]);
    if (zoneRows.length === 0) return res.status(404).json({ success: false, error: 'Geofence not found' });
    const zone = zoneRows[0];
    if (!zone.is_active) return res.status(409).json({ success: false, error: 'Geofence is not active' });

    const distanceMeters = Math.round(
      distanceKm(latitude, longitude, zone.center_latitude, zone.center_longitude) * 1000
    );
    const isInside = distanceMeters <= Number(zone.radius_meters);

    const identityColumn = source === 'manual_checkin' ? 'user_id' : 'driver_id';
    const identityValue = source === 'manual_checkin' ? userId : driverId;

    const { rows: lastEventRows } = await pool.query(
      `SELECT is_inside FROM geofence_events
        WHERE geofence_id = $1 AND ${identityColumn} = $2
        ORDER BY recorded_at DESC LIMIT 1`,
      [zone.id, identityValue]
    );

    let eventType = null;
    const previouslyInside = lastEventRows.length ? lastEventRows[0].is_inside : null;
    if (previouslyInside === null) {
      if (isInside) eventType = 'entered';
    } else if (previouslyInside !== isInside) {
      eventType = isInside ? 'entered' : 'exited';
    }

    const { rows } = await pool.query(
      `INSERT INTO geofence_events
         (geofence_id, source, user_id, driver_id, shipment_id, latitude, longitude, accuracy_m, distance_meters, is_inside, event_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        zone.id, source, userId || null, driverId || null, shipmentId || null,
        latitude, longitude, accuracyM ?? null, distanceMeters, isInside, eventType
      ]
    );

    if (eventType) {
      logger.info(`Geofence ${zone.id} (${zone.name}): ${identityColumn}=${identityValue} ${eventType} at ${distanceMeters}m`);
    }

    res.status(201).json({
      success: true,
      data: rows[0],
      reasoning: {
        distanceMeters,
        radiusMeters: Number(zone.radius_meters),
        isInside,
        previouslyInside,
        eventType,
        formula: 'haversine great-circle distance from geofence center vs radius_meters'
      }
    });
  } catch (error) {
    logger.error('Error checking geofence', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/zones/:id/events', async (req, res) => {
  try {
    const { page, limit, offset } = boundedPage(req.query);
    const { userId, driverId, eventType } = req.query;
    const params = [req.params.id];
    let where = 'WHERE geofence_id = $1';
    if (userId) { params.push(userId); where += ` AND user_id = $${params.length}`; }
    if (driverId) { params.push(driverId); where += ` AND driver_id = $${params.length}`; }
    if (eventType) { params.push(eventType); where += ` AND event_type = $${params.length}`; }
    params.push(limit); params.push(offset);

    const { rows } = await pool.query(
      `SELECT * FROM geofence_events ${where} ORDER BY recorded_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({ success: true, page, limit, count: rows.length, data: rows });
  } catch (error) {
    logger.error('Error listing geofence events', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
});

/** Who/what is currently inside this zone, from the latest event per identity. */
router.get('/zones/:id/current', async (req, res) => {
  try {
    const { rows: zoneRows } = await pool.query('SELECT * FROM geofences WHERE id = $1', [req.params.id]);
    if (zoneRows.length === 0) return res.status(404).json({ success: false, error: 'Geofence not found' });

    const { rows } = await pool.query(
      `SELECT DISTINCT ON (COALESCE(user_id::text, driver_id::text))
              user_id, driver_id, shipment_id, source, latitude, longitude,
              distance_meters, is_inside, recorded_at
         FROM geofence_events
        WHERE geofence_id = $1
        ORDER BY COALESCE(user_id::text, driver_id::text), recorded_at DESC`,
      [req.params.id]
    );

    const inside = rows.filter((r) => r.is_inside);
    res.json({ success: true, count: inside.length, data: inside });
  } catch (error) {
    logger.error('Error getting current geofence occupants', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Stateless ad-hoc polygon check — no stored zone, for callers that already
 * have their own boundary (e.g. an FPO-supplied field survey) and just want
 * the geometry. Uses the same ray-casting isWithinPolygon() already in
 * geo.js. Does not write a geofence_event since there is no geofence row to
 * attach it to.
 */
router.post('/check-polygon', authMiddleware, async (req, res) => {
  try {
    const { latitude, longitude, polygon } = req.body || {};
    if (!isValidCoord(latitude, longitude)) {
      return res.status(400).json({ success: false, error: 'latitude/longitude must be valid coordinates' });
    }
    if (!Array.isArray(polygon) || polygon.length < 3) {
      return res.status(400).json({ success: false, error: 'polygon must be an array of at least 3 {lat,lng} points' });
    }

    const isInside = isWithinPolygon(latitude, longitude, polygon);
    res.json({
      success: true,
      data: { isInside },
      reasoning: { formula: 'ray-casting point-in-polygon', vertexCount: polygon.length }
    });
  } catch (error) {
    logger.error('Error checking point in polygon', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
