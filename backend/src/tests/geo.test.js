/**
 * Geospatial utility tests.
 *
 * Distances are asserted against values cross-checked with an independent
 * equirectangular approximation, not against road distances (an early draft of
 * these tests failed because road distance was used by mistake — the code was
 * right and the expectation was wrong).
 */

const geo = require('../utils/geo');

describe('distanceKm', () => {
  test('matches known great-circle distances', () => {
    // Delhi -> Mumbai, a widely published ~1148 km great-circle distance
    expect(geo.distanceKm(28.6139, 77.209, 19.076, 72.8777)).toBeCloseTo(1148, -1);
    // Guwahati -> Imphal
    expect(geo.distanceKm(26.1445, 91.7362, 24.817, 93.9368)).toBeCloseTo(265.7, 0);
    // Kolkata -> Shillong
    expect(geo.distanceKm(22.5726, 88.3639, 25.5788, 91.8933)).toBeCloseTo(490.0, 0);
  });

  test('identical points are zero distance', () => {
    expect(geo.distanceKm(26.1, 91.7, 26.1, 91.7)).toBeCloseTo(0, 9);
  });

  test('is symmetric', () => {
    const ab = geo.distanceKm(28.6139, 77.209, 19.076, 72.8777);
    const ba = geo.distanceKm(19.076, 72.8777, 28.6139, 77.209);
    expect(ab).toBeCloseTo(ba, 9);
  });
});

describe('missing coordinates must fail closed (Null Island guard)', () => {
  // Number(null) === 0 and Number('') === 0, so without an explicit guard a
  // record with no coordinates is silently placed at 0N 0E in the Gulf of
  // Guinea — and can then appear in proximity results or pass a geofence check.
  test.each([
    ['null', null],
    ['undefined', undefined],
    ['empty string', '']
  ])('%s coordinates return null, not a distance', (_label, value) => {
    expect(geo.distanceKm(26, 91, value, value)).toBeNull();
    expect(geo.isValidCoord(value, value)).toBe(false);
  });

  test('geofence check fails closed for unlocated entities', () => {
    expect(geo.isWithinRadius(null, null, 26, 91, 50000)).toBe(false);
  });

  test('unlocated records are dropped from proximity sorting', () => {
    const sorted = geo.sortByProximity(26.1445, 91.7362, [
      { id: 'far', latitude: 28.6, longitude: 77.2 },
      { id: 'near', latitude: 26.15, longitude: 91.74 },
      { id: 'unlocated', latitude: null, longitude: null }
    ]);
    expect(sorted).toHaveLength(2);
    expect(sorted[0].id).toBe('near');
  });

  test('a genuine 0,0 coordinate remains valid (guard must not over-correct)', () => {
    expect(geo.isValidCoord(0, 0)).toBe(true);
    expect(geo.distanceKm(0, 0, 0, 1)).toBeCloseTo(111.2, 0);
  });

  test('out-of-range coordinates are rejected', () => {
    expect(geo.isValidCoord(91, 0)).toBe(false);
    expect(geo.isValidCoord(0, 181)).toBe(false);
  });
});

describe('bearingDeg', () => {
  test('due north is 0 and due east is 90', () => {
    expect(geo.bearingDeg(0, 0, 10, 0)).toBeCloseTo(0, 6);
    expect(geo.bearingDeg(0, 0, 0, 10)).toBeCloseTo(90, 6);
  });
});

describe('boundingBox', () => {
  test('fully contains the circle (never produces a false negative)', () => {
    const c = { lat: 26.1445, lng: 91.7362 };
    const r = 50;
    const b = geo.boundingBox(c.lat, c.lng, r);
    // Every corner must be at least r away, i.e. the box encloses the circle.
    const corners = [
      [b.minLat, b.minLng], [b.maxLat, b.maxLng],
      [b.minLat, b.maxLng], [b.maxLat, b.minLng]
    ];
    corners.forEach(([la, lo]) => {
      expect(geo.distanceKm(c.lat, c.lng, la, lo)).toBeGreaterThanOrEqual(r);
    });
  });

  test('a point just inside the radius falls inside the box', () => {
    const b = geo.boundingBox(26.1445, 91.7362, 50);
    const justInside = 26.1445 + (49 / geo.EARTH_RADIUS_KM) * (180 / Math.PI);
    expect(justInside).toBeLessThanOrEqual(b.maxLat);
  });

  test('invalid input returns null', () => {
    expect(geo.boundingBox(999, 0, 10)).toBeNull();
    expect(geo.boundingBox(0, 0, -5)).toBeNull();
  });
});

describe('radiusQueryFragment', () => {
  test('produces correctly numbered placeholders and params', () => {
    const f = geo.radiusQueryFragment({
      lat: 26.1445, lng: 91.7362, radiusKm: 50, table: 'w', startIndex: 3
    });
    expect(f.sql).toContain('$3');
    expect(f.sql).toContain('$6');
    expect(f.params).toHaveLength(4);
    expect(f.nextIndex).toBe(7);
  });

  test('returns null on invalid input so the caller can reject the request', () => {
    expect(geo.radiusQueryFragment({ lat: 999, lng: 0, radiusKm: 5 })).toBeNull();
  });
});

describe('isWithinPolygon', () => {
  const square = [
    { lat: 0, lng: 0 }, { lat: 0, lng: 10 },
    { lat: 10, lng: 10 }, { lat: 10, lng: 0 }
  ];

  test('detects inside and outside', () => {
    expect(geo.isWithinPolygon(5, 5, square)).toBe(true);
    expect(geo.isWithinPolygon(15, 5, square)).toBe(false);
  });

  test('degenerate polygons are rejected', () => {
    expect(geo.isWithinPolygon(5, 5, [{ lat: 0, lng: 0 }])).toBe(false);
    expect(geo.isWithinPolygon(5, 5, null)).toBe(false);
  });
});

describe('routeLengthKm', () => {
  test('sums consecutive legs', () => {
    const km = geo.routeLengthKm([
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 1 },
      { latitude: 0, longitude: 2 }
    ]);
    expect(km).toBeCloseTo(222.4, 0);
  });

  test('degenerate routes are zero, not NaN', () => {
    expect(geo.routeLengthKm([])).toBe(0);
    expect(geo.routeLengthKm([{ latitude: 1, longitude: 1 }])).toBe(0);
  });
});
