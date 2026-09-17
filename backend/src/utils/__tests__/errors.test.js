'use strict';

// DatabaseError was destructured and thrown (`new DatabaseError(message)`)
// by 313 files under backend/src/modules/ but was never defined or
// exported here - every one of those catch blocks threw `TypeError:
// DatabaseError is not a constructor` instead of the intended error.
// Confirmed via a full local jest run: this single missing export
// accounted for 3130 failing assertions before the fix (2026-09-16).

const { AppError, DatabaseError, ServiceError } = require('../errors.js');

describe('utils/errors.js', () => {
  describe('DatabaseError', () => {
    test('is a real constructor, not undefined', () => {
      expect(() => new DatabaseError('boom')).not.toThrow();
    });

    test('is an instance of Error and AppError', () => {
      const err = new DatabaseError('boom');
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(AppError);
    });

    test('carries the message, a 500 status, and DATABASE_ERROR code', () => {
      const err = new DatabaseError('Failed to fetch things: boom');
      expect(err.message).toBe('Failed to fetch things: boom');
      expect(err.statusCode).toBe(500);
      expect(err.code).toBe('DATABASE_ERROR');
    });
  });

  test('other error classes are unaffected (ServiceError still constructs normally)', () => {
    const err = new ServiceError('weather', 'timed out');
    expect(err.message).toBe('weather error: timed out');
    expect(err.statusCode).toBe(503);
  });
});
