// ORPHAN STUB — marked 2026-08-04. Empty, and imported by nothing.
// It existed only as a jest.mock() target, but those mocks pointed HERE
// instead of at database/connection.js and cache/redis.js — so the real
// connections ran unmocked in every test. tests/setup.js now mocks the
// modules the code actually imports. Safe to delete.
module.exports = {};
