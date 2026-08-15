-- ============================================================================
-- driver_location: add accuracy_m + battery_pct (schema catching up to code)
--
-- `logisticsEnhancementService.js#recordDriverLocation` has always inserted
-- `accuracy_m` and `battery_pct` alongside the ping — accuracy so a dispatcher
-- can tell a tight GPS fix from a rough one, battery so `getActiveDrivers`
-- can flag a driver whose phone is about to go dark. The `driver_location`
-- table created in 991_aeos_folu_ne_policy.sql never had these two columns,
-- so that INSERT has been failing against a real Postgres instance since day
-- one. This migration is purely additive — 991 may already be applied
-- elsewhere, so we do not touch it in place.
--
-- TYPES
-- accuracy_m: GPS horizontal accuracy radius in meters, as reported by the
--   device (e.g. Android's Location.getAccuracy()). Consumer GPS accuracy is
--   fractional (typically 3-50m) and unbounded at the high end (a stale/poor
--   fix can report hundreds of meters), so NUMERIC(7,2) rather than an
--   integer type — mirrors the precision style already used for
--   speed_kmph/heading_deg in the same table.
-- battery_pct: device battery percentage, always a whole number 0-100 in
--   every OS battery API this platform reads from — SMALLINT with a range
--   check, consistent with how `getActiveDrivers` already compares it
--   against the plain integer threshold 20 (`lowBattery`).
-- ============================================================================

ALTER TABLE driver_location ADD COLUMN IF NOT EXISTS accuracy_m NUMERIC(7,2)
    CHECK (accuracy_m IS NULL OR accuracy_m >= 0);

ALTER TABLE driver_location ADD COLUMN IF NOT EXISTS battery_pct SMALLINT
    CHECK (battery_pct IS NULL OR battery_pct BETWEEN 0 AND 100);
