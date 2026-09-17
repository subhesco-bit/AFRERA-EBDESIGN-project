'use strict';

// climateRouteSupport.js used to be a 12-line placeholder (just a router
// with GET /health) - weatherRoutes_merged.js imports 9 named
// request-validation helpers from it that never existed, so requiring
// weatherRoutes_merged.js always threw and it stayed unmounted since this
// PR's first commit. Rewritten (2026-09-16) with the real validators,
// derived directly from how weatherRoutes_merged.js already calls each
// one (e.g. numberValue/enumValue must tolerate `undefined` since
// weatherService.recordForecast defaults a missing `provider` itself).

const {
  router,
  invalid,
  fail,
  requestId,
  numberValue,
  enumValue,
  date,
  dateTime,
  bodyValidator,
  queryValidator,
} = require('../climateRouteSupport.js');

describe('climateRouteSupport.js', () => {
  test('exports a router with a health check (preserves index.js\'s climateRouteSupport.router mount)', () => {
    expect(router.stack.some((l) => l.route && l.route.path === '/health')).toBe(true);
  });

  describe('invalid()', () => {
    test('returns an Error with status 400', () => {
      const err = invalid('bad input');
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('bad input');
      expect(err.status).toBe(400);
    });
  });

  describe('fail()', () => {
    function mockRes() {
      const res = { id: 'req-1' };
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      return res;
    }

    test('responds with the given status and error message', () => {
      const res = mockRes();
      fail({ id: 'r1' }, res, new Error('boom'), 'someOp', 500);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'boom', operation: 'someOp' })
      );
    });

    test('falls back to error.status when no statusCode is passed', () => {
      const res = mockRes();
      fail({ id: 'r1' }, res, invalid('nope'), 'validation');
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('requestId()', () => {
    test('prefixes the request\'s own id', () => {
      expect(requestId({ id: 'abc123' }, 'weather')).toBe('weather-abc123');
    });

    test('falls back to a generated id when req.id is missing', () => {
      const id = requestId({}, 'weather');
      expect(id).toMatch(/^weather-[0-9a-f-]+$/);
    });
  });

  describe('numberValue()', () => {
    test('returns undefined for undefined/null/empty (optional field)', () => {
      expect(numberValue(undefined, 'days', { min: 1, max: 120 })).toBeUndefined();
      expect(numberValue(null, 'days', { min: 1, max: 120 })).toBeUndefined();
      expect(numberValue('', 'days', { min: 1, max: 120 })).toBeUndefined();
    });

    test('accepts a value within range', () => {
      expect(numberValue(30, 'days', { min: 1, max: 120 })).toBe(30);
    });

    test('rejects a non-number', () => {
      expect(() => numberValue('abc', 'days', {})).toThrow('days must be a number');
    });

    test('rejects below min / above max', () => {
      expect(() => numberValue(0, 'days', { min: 1, max: 120 })).toThrow('days must be >= 1');
      expect(() => numberValue(500, 'days', { min: 1, max: 120 })).toThrow('days must be <= 120');
    });

    test('rejects a non-integer when integer is required', () => {
      expect(() => numberValue(1.5, 'days', { integer: true })).toThrow('days must be an integer');
    });
  });

  describe('enumValue()', () => {
    test('returns undefined for undefined/null/empty (optional field)', () => {
      expect(enumValue(undefined, 'provider', ['imd', 'gfs'])).toBeUndefined();
    });

    test('accepts an allowed value', () => {
      expect(enumValue('imd', 'provider', ['imd', 'gfs'])).toBe('imd');
    });

    test('rejects a disallowed value', () => {
      expect(() => enumValue('bogus', 'provider', ['imd', 'gfs'])).toThrow('provider must be one of: imd, gfs');
    });
  });

  describe('date()', () => {
    test('returns undefined for undefined/null/empty (optional field)', () => {
      expect(date(undefined, 'observedOn')).toBeUndefined();
    });

    test('accepts a valid YYYY-MM-DD date', () => {
      expect(date('2026-01-15', 'observedOn')).toBe('2026-01-15');
    });

    test('rejects a malformed date string', () => {
      expect(() => date('15-01-2026', 'observedOn')).toThrow('observedOn must be a date in YYYY-MM-DD format');
      expect(() => date('not-a-date', 'observedOn')).toThrow('observedOn must be a date in YYYY-MM-DD format');
    });

    test('rejects a date beyond futureDays', () => {
      const farFuture = new Date();
      farFuture.setUTCFullYear(farFuture.getUTCFullYear() + 1);
      const iso = farFuture.toISOString().slice(0, 10);
      expect(() => date(iso, 'observedOn', { futureDays: 0 })).toThrow(/cannot be more than 0 day/);
    });

    test('accepts today under futureDays: 0', () => {
      const today = new Date().toISOString().slice(0, 10);
      expect(date(today, 'observedOn', { futureDays: 0 })).toBe(today);
    });
  });

  describe('dateTime()', () => {
    test('returns undefined for undefined/null/empty (optional field)', () => {
      expect(dateTime(undefined, 'effectiveFrom')).toBeUndefined();
    });

    test('accepts a valid ISO 8601 date-time', () => {
      expect(dateTime('2026-01-15T10:30:00Z', 'effectiveFrom')).toBe('2026-01-15T10:30:00Z');
    });

    test('rejects an invalid date-time', () => {
      expect(() => dateTime('not-a-datetime', 'effectiveFrom')).toThrow('effectiveFrom must be a valid ISO 8601 date-time');
    });
  });

  describe('bodyValidator() / queryValidator() middleware wrapping', () => {
    function mockRes() {
      const res = {};
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      return res;
    }

    test('bodyValidator calls next() when the validator passes', () => {
      const mw = bodyValidator((b) => { if (!b.x) throw new Error('x required'); });
      const next = jest.fn();
      const res = mockRes();
      mw({ id: 'r1', body: { x: 1 } }, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('bodyValidator responds 400 and does not call next() when the validator throws', () => {
      const mw = bodyValidator((b) => { if (!b.x) throw new Error('x required'); });
      const next = jest.fn();
      const res = mockRes();
      mw({ id: 'r1', body: {} }, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'x required' }));
    });

    test('queryValidator responds 400 on a thrown invalid()', () => {
      const mw = queryValidator((q) => { numberValue(q.days, 'days', { min: 1, max: 120 }); });
      const next = jest.fn();
      const res = mockRes();
      mw({ id: 'r1', query: { days: '999' } }, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
