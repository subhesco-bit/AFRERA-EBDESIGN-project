/**
 * Geofencing Service — circular zone check-ins built on real mobile GPS.
 *
 * WHAT MOBILE GPS ACTUALLY GIVES US
 * `navigator.geolocation` (browser or a mobile app wrapping the same API,
 * see frontend/src/hooks/useGeolocation.js) reports a single point — latitude,
 * longitude, and an accuracy radius — at the moment the device asks for it.
 * That is the entire budget this service is built against. It is NOT:
 *   - continuous background tracking: a basic Android phone kills a
 *     background GPS watch to save battery, and holding a watch open while a
 *     labourer works a field all day would flatten the phone by noon:
 *   - precise: GPS accuracy in dense NE forest or hilly terrain commonly runs
 *     10-50m, so a "boundary" tighter than that is fiction, not a fence;
 *   - a substitute for a gate sensor: there is no RFID/BLE/LoRa hardware on
 *     this platform, so "the truck has arrived" can only mean "the driver's
 *     phone last reported a point inside this circle", not that a physical
 *     gate registered the vehicle.
 *
 * WHY CIRCULAR GEOFENCES
 * A polygon geofence needs a surveyed boundary. Nothing on this platform has
 * one (see the migration file's note on M035 GIS Land Mapping). Center point
 * + radius is the shape that matches what a GPS fix actually is: a point with
 * an error radius, not a boundary.
 *
 * TWO REAL USE CASES, ONE PRIMITIVE
 *   1. Manual check-in (labour/farmer): a person taps "Check in" and their
 *      current GPS point is tested against a known zone. This is explicitly
 *      NOT passive tracking — it only happens on a deliberate user action.
 *   2. Driver/shipment zone check: reuses the GPS pings the driver's phone
 *      already sends via driverTrackingAPI.recordLocation (see
 *      migration 991, driver_location table, logisticsEnhancementService.js)
 *      and tests the latest one against a destination geofence — e.g. "has
 *      the truck reached the warehouse zone". This service only READS
 *      driver_location; it does not write to it or modify the tracking
 *      pipeline that already exists.
 */

'use strict';

const pool = require('../../../database/pool');
const { logger } = require('../../../utils/logger');
const geo = require('../../../utils/geo');
const { signalBus, SIGNAL, SEVERITY } = require('../../../core/signalBus');

class GeofencingService {
  // ==========================================================================
  // ZONE DEFINITION
  // ==========================================================================

  async createGeofence({ name, zoneType, centerLatitude, centerLongitude, radiusMeters, description, referenceId, referenceType, createdBy }) {
    if (!name || !zoneType) {
      throw new Error('name and zoneType are required');
    }
    if (!geo.isValidCoord(centerLatitude, centerLongitude)) {
      throw new Error('centerLatitude/centerLongitude are missing or out of range');
    }
    const radius = Number(radiusMeters);
    if (!Number.isFinite(radius) || radius < 20) {
      // 20m floor matches the migration's CHECK constraint — a "zone" tighter
      // than typical GPS error would fail-check most real readers as outside.
      throw new Error('radiusMeters must be at least 20 (below typical GPS accuracy, not a real fence)');
    }

    try {
      const { rows } = await pool.query(
        `INSERT INTO geofences
           (name, zone_type, center_latitude, center_longitude, radius_meters,
            description, reference_id, reference_type, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING *`,
        [name, zoneType, centerLatitude, centerLongitude, radius,
          description ?? null, referenceId ?? null, referenceType ?? null, createdBy ?? null]
      );
      return rows[0];
    } catch (error) {
      logger.error('Error creating geofence', { error: error.message });
      throw error;
    }
  }

  async listGeofences({ zoneType, isActive = true } = {}) {
    try {
      const conditions = [];
      const params = [];
      if (zoneType) { params.push(zoneType); conditions.push(`zone_type = $${params.length}`); }
      if (isActive !== undefined && isActive !== null && isActive !== 'all') {
        params.push(isActive === true || isActive === 'true');
        conditions.push(`is_active = $${params.length}`);
      }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const { rows } = await pool.query(
        `SELECT * FROM geofences ${where} ORDER BY created_at DESC`,
        params
      );
      return rows;
    } catch (error) {
      logger.error('Error listing geofences', { error: error.message });
      throw error;
    }
  }

  async getGeofence(id) {
    const { rows } = await pool.query('SELECT * FROM geofences WHERE id = $1', [id]);
    if (!rows[0]) throw new Error('Geofence not found');
    return rows[0];
  }

  // ==========================================================================
  // SHARED EVALUATION — the honest, cheap, reusable primitive.
  //
  // Distance uses the existing haversine implementation in utils/geo.js
  // (isWithinRadius / distanceKm) rather than a new copy — that module already
  // exists for exactly this reason ("is this vehicle inside its geofence",
  // see its file header) and duplicating it here would create a second
  // implementation to keep in sync.
  // ==========================================================================

  /**
   * Evaluate one GPS point against one geofence, record the event, and return
   * the result. Only marks event_type (entered/exited) when this reading is a
   * genuine change from the identity's previous state on this geofence — a
   * driver pinging every few minutes from inside a warehouse zone should not
   * produce a fresh "entered" signal on every ping.
   *
   * `identity` distinguishes the caller for transition tracking: either
   * { userId } for a manual check-in or { driverId, shipmentId } for a driver
   * ping. Exactly one shape should be provided per `source`.
   */
  async _evaluateAndRecord({ geofence, source, latitude, longitude, accuracyM, userId, driverId, shipmentId, userRole }) {
    if (!geo.isValidCoord(latitude, longitude)) {
      throw new Error('A valid latitude/longitude is required (missing or 0,0/unfixed GPS is rejected)');
    }
    if (latitude === 0 && longitude === 0) {
      throw new Error('Refusing (0,0) — this is an unfixed GPS module, not a location');
    }

    const distanceKm = geo.distanceKm(latitude, longitude, geofence.center_latitude, geofence.center_longitude);
    const radiusKm = Number(geofence.radius_meters) / 1000;
    const isInside = distanceKm !== null && distanceKm <= radiusKm;
    const distanceMeters = distanceKm !== null ? Math.round(distanceKm * 1000 * 100) / 100 : null;

    // Find this identity's previous event on this geofence to detect a
    // genuine transition rather than restating the same state every call.
    const identityCondition = source === 'manual_checkin'
      ? { sql: 'user_id = $2', param: userId }
      : { sql: 'driver_id = $2', param: driverId };

    const prev = await pool.query(
      `SELECT is_inside FROM geofence_events
        WHERE geofence_id = $1 AND source = '${source}' AND ${identityCondition.sql}
        ORDER BY recorded_at DESC LIMIT 1`,
      [geofence.id, identityCondition.param]
    );
    const previouslyInside = prev.rows[0]?.is_inside ?? null;
    const eventType = previouslyInside === null
      ? (isInside ? 'entered' : null) // first-ever reading: only worth flagging if it lands inside
      : (previouslyInside !== isInside ? (isInside ? 'entered' : 'exited') : null);

    const { rows } = await pool.query(
      `INSERT INTO geofence_events
         (geofence_id, source, user_id, driver_id, shipment_id,
          latitude, longitude, accuracy_m, distance_meters, is_inside, event_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [geofence.id, source, userId ?? null, driverId ?? null, shipmentId ?? null,
        latitude, longitude, accuracyM ?? null, distanceMeters, isInside, eventType]
    );
    const event = rows[0];

    if (eventType) {
      signalBus.emitSignal(
        eventType === 'entered' ? SIGNAL.GEOFENCE_ENTERED : SIGNAL.GEOFENCE_EXITED,
        {
          geofenceId: geofence.id,
          geofenceName: geofence.name,
          zoneType: geofence.zone_type,
          source,
          userId: userId ?? null,
          userRole: userRole ?? null,
          driverId: driverId ?? null,
          shipmentId: shipmentId ?? null,
          distanceMeters,
          accuracyM: accuracyM ?? null,
        },
        {
          severity: source === 'driver_ping' ? SEVERITY.NOTICE : SEVERITY.INFO,
          source: 'geofencingService',
          entityId: geofence.id,
        }
      );
    }

    return {
      event,
      geofence: { id: geofence.id, name: geofence.name, zoneType: geofence.zone_type, radiusMeters: Number(geofence.radius_meters) },
      distanceMeters,
      isInside,
      eventType,
      accuracyNote: accuracyM != null && Number(accuracyM) > Number(geofence.radius_meters)
        ? `Reported GPS accuracy (${accuracyM}m) is wider than this zone's radius `
          + `(${geofence.radius_meters}m) — treat the inside/outside result as indicative, not certain.`
        : null,
    };
  }

  // ==========================================================================
  // USE CASE 1 — Labour / farmer GPS check-in.
  //
  // A manual, user-triggered event — the honest version of "farmer/labour
  // geofencing". NOT continuous passive tracking: nothing calls this except a
  // person tapping "Check in", because a background watch would drain a
  // basic phone's battery and most rural devices cannot sustain that.
  // ==========================================================================

  async checkIn({ geofenceId, userId, userRole, latitude, longitude, accuracyM }) {
    if (!geofenceId || !userId) {
      throw new Error('geofenceId and userId are required');
    }
    const geofence = await this.getGeofence(geofenceId);
    if (!geofence.is_active) {
      throw new Error('This geofence is not active');
    }
    return this._evaluateAndRecord({
      geofence, source: 'manual_checkin', latitude, longitude, accuracyM, userId, userRole,
    });
  }

  async checkInHistory({ userId, geofenceId, limit = 50 } = {}) {
    let conditions = ["source = 'manual_checkin'"];
    let params = [];
    if (userId) { params.push(userId); conditions.push(`user_id = $${params.length}`); }
    if (geofenceId) { params.push(geofenceId); conditions.push(`geofence_id = $${params.length}`); }
    params.push(Math.min(Number(limit) || 50, 200));
    const { rows } = await pool.query(
      `SELECT ge.*, g.name AS geofence_name, g.zone_type
         FROM geofence_events ge
         JOIN geofences g ON g.id = ge.geofence_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY ge.recorded_at DESC
        LIMIT $${params.length}`,
      params
    );
    return rows;
  }

  // ==========================================================================
  // USE CASE 2 — Driver / shipment zone arrival.
  //
  // Reuses the GPS ping the driver's phone already sent via
  // driverTrackingAPI.recordLocation (POST /logistics-ops/drivers/location,
  // logisticsEnhancementService.recordDriverLocation -> driver_location
  // table). This service reads the latest such ping and tests it against a
  // geofence — realistic "has the truck reached the warehouse zone" without
  // any dedicated gate sensor.
  // ==========================================================================

  async checkDriverZoneArrival({ geofenceId, driverId, shipmentId }) {
    if (!geofenceId || !driverId) {
      throw new Error('geofenceId and driverId are required');
    }
    let geofence = await this.getGeofence(geofenceId);
    if (!geofence.is_active) {
      throw new Error('This geofence is not active');
    }

    let params = [driverId];
    let shipmentClause = '';
    if (shipmentId) {
      params.push(shipmentId);
      shipmentClause = 'AND shipment_id = $2';
    }
    const { rows } = await pool.query(
      `SELECT driver_id, shipment_id, latitude, longitude, recorded_at
         FROM driver_location
        WHERE driver_id = $1 ${shipmentClause}
        ORDER BY recorded_at DESC
        LIMIT 1`,
      params
    );
    const lastPing = rows[0];
    if (!lastPing) {
      throw new Error('No recorded GPS location for this driver yet — nothing to check against the geofence');
    }

    const minutesSincePing = (Date.now() - new Date(lastPing.recorded_at).getTime()) / 60000;
    const result = await this._evaluateAndRecord({
      geofence,
      source: 'driver_ping',
      latitude: lastPing.latitude,
      longitude: lastPing.longitude,
      driverId,
      shipmentId: lastPing.shipment_id ?? shipmentId ?? null,
    });

    return {
      ...result,
      pingAgeMinutes: Math.round(minutesSincePing * 10) / 10,
      stale: minutesSincePing > 30,
      note: minutesSincePing > 30
        ? `Last driver ping was ${Math.round(minutesSincePing)} minutes ago — this is a `
          + 'last-known position, not confirmation the truck is there right now.'
        : null,
    };
  }
}

module.exports = new GeofencingService();

