/**
 * Geospatial utilities.
 *
 * WHY THIS EXISTS
 * The schema stores latitude/longitude as plain DECIMAL columns with no PostGIS
 * extension and no spatial indexes. Every "nearest warehouse", "farmers within
 * 50km", or "is this vehicle inside its geofence" question therefore became a
 * full table scan with per-row trigonometry.
 *
 * This module provides two things:
 *   1. Correct distance/bearing maths (haversine) for in-process work.
 *   2. A bounding-box pre-filter so SQL can use a plain btree index on
 *      (latitude, longitude) before the expensive exact distance is computed.
 *
 * The bounding-box trick matters: a btree index cannot answer "within X km",
 * but it CAN answer "latitude between A and B". Filtering to a box first, then
 * refining with haversine, turns a full scan into an index range scan. That is
 * the pragmatic path when PostGIS is not available — see
 * migrations/997_geospatial_indexes.sql for the index definitions and the
 * PostGIS upgrade note.
 */

const EARTH_RADIUS_KM = 6371.0088; // mean radius (IUGG)

const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

/**
 * Coerce to a number, but treat null/undefined/'' as absent rather than 0.
 *
 * This guard is load-bearing. Number(null) === 0 and Number('') === 0, so a
 * record with MISSING coordinates would otherwise be silently interpreted as
 * 0°N 0°E — "Null Island" in the Gulf of Guinea. On a logistics platform that
 * means an unlocated farmer or warehouse can surface in proximity results, or
 * pass a geofence check, purely because its coordinates were never captured.
 * Missing data must fail closed, not resolve to a real place on Earth.
 */
function num(v) {
  if (v === null || v === undefined || v === '') return NaN;
  return Number(v);
}

function isValidCoord(lat, lng) {
  const a = num(lat);
  const o = num(lng);
  return (
    Number.isFinite(a) && Number.isFinite(o) &&
    a >= -90 && a <= 90 && o >= -180 && o <= 180
  );
}

/**
 * Great-circle distance in kilometres (haversine).
 * Returns null for invalid input rather than NaN, so callers can distinguish
 * "no answer" from "zero distance".
 */
function distanceKm(lat1, lng1, lat2, lng2) {
  const a1 = num(lat1), o1 = num(lng1), a2 = num(lat2), o2 = num(lng2);
  if (!isValidCoord(a1, o1) || !isValidCoord(a2, o2)) return null;

  const dLat = toRad(a2 - a1);
  const dLng = toRad(o2 - o1);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a1)) * Math.cos(toRad(a2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(s)));
}

/**
 * Initial bearing (forward azimuth) in degrees, 0 = north.
 * Useful for delivery direction and route sequencing.
 */
function bearingDeg(lat1, lng1, lat2, lng2) {
  const a1 = num(lat1), o1 = num(lng1), a2 = num(lat2), o2 = num(lng2);
  if (!isValidCoord(a1, o1) || !isValidCoord(a2, o2)) return null;

  const dLng = toRad(o2 - o1);
  const y = Math.sin(dLng) * Math.cos(toRad(a2));
  const x =
    Math.cos(toRad(a1)) * Math.sin(toRad(a2)) -
    Math.sin(toRad(a1)) * Math.cos(toRad(a2)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Bounding box around a point. Use this in SQL BEFORE computing exact distance
 * so a btree index on (latitude, longitude) can be used.
 *
 * Deliberately conservative: the box always fully contains the circle, so the
 * pre-filter never excludes a genuine match (no false negatives). Exact
 * distance must still be applied afterwards to remove the corners.
 */
function boundingBox(lat, lng, radiusKm) {
  const a = num(lat), o = num(lng), r = num(radiusKm);
  if (!isValidCoord(a, o) || !Number.isFinite(r) || r < 0) return null;

  const latDelta = toDeg(r / EARTH_RADIUS_KM);
  // Longitude degrees shrink toward the poles; guard the cos->0 singularity.
  const cosLat = Math.cos(toRad(a));
  const lngDelta = Math.abs(cosLat) < 1e-9 ? 180 : toDeg(r / (EARTH_RADIUS_KM * cosLat));

  return {
    minLat: Math.max(-90, a - latDelta),
    maxLat: Math.min(90, a + latDelta),
    minLng: Math.max(-180, o - Math.abs(lngDelta)),
    maxLng: Math.min(180, o + Math.abs(lngDelta))
  };
}

/**
 * SQL fragment + params for an index-friendly radius search.
 * Caller appends further conditions and an ORDER BY.
 *
 * Returns null when the input is invalid so the caller can reject the request
 * rather than issuing a query that scans the table.
 */
function radiusQueryFragment({ lat, lng, radiusKm, table = 't', latCol = 'latitude', lngCol = 'longitude', startIndex = 1 }) {
  const box = boundingBox(lat, lng, radiusKm);
  if (!box) return null;

  const i = startIndex;
  const sql =
    `${table}.${latCol} BETWEEN $${i} AND $${i + 1} ` +
    `AND ${table}.${lngCol} BETWEEN $${i + 2} AND $${i + 3}`;

  return {
    sql,
    params: [box.minLat, box.maxLat, box.minLng, box.maxLng],
    nextIndex: i + 4,
    box
  };
}

/** Point-in-circle test — the primitive behind geofence entry/exit. */
function isWithinRadius(lat, lng, centreLat, centreLng, radiusKm) {
  const d = distanceKm(lat, lng, centreLat, centreLng);
  return d === null ? false : d <= num(radiusKm);
}

/**
 * Ray-casting point-in-polygon for arbitrary geofences.
 * polygon: [{lat,lng}, ...] — assumed closed (first point reused if not).
 */
function isWithinPolygon(lat, lng, polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;
  const a = num(lat), o = num(lng);
  if (!isValidCoord(a, o)) return false;

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const yi = num(polygon[i].lat), xi = num(polygon[i].lng);
    const yj = num(polygon[j].lat), xj = num(polygon[j].lng);
    if (![yi, xi, yj, xj].every(Number.isFinite)) continue;

    const intersects =
      (yi > a) !== (yj > a) &&
      o < ((xj - xi) * (a - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/** Sort candidates by distance, attaching distanceKm. Invalid coords drop out. */
function sortByProximity(originLat, originLng, items, latKey = 'latitude', lngKey = 'longitude') {
  return (items || [])
    .map((item) => ({
      ...item,
      distanceKm: distanceKm(originLat, originLng, item?.[latKey], item?.[lngKey])
    }))
    .filter((item) => item.distanceKm !== null)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/** Total path length — used for route cost and delivery estimation. */
function routeLengthKm(points, latKey = 'latitude', lngKey = 'longitude') {
  if (!Array.isArray(points) || points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const d = distanceKm(
      points[i - 1]?.[latKey], points[i - 1]?.[lngKey],
      points[i]?.[latKey], points[i]?.[lngKey]
    );
    if (d !== null) total += d;
  }
  return total;
}

module.exports = {
  EARTH_RADIUS_KM,
  isValidCoord,
  distanceKm,
  bearingDeg,
  boundingBox,
  radiusQueryFragment,
  isWithinRadius,
  isWithinPolygon,
  sortByProximity,
  routeLengthKm
};
