-- ============================================================================
-- 997_geospatial_indexes.sql   (generated 2026-08-03)
--
-- WHY THIS EXISTS
-- This platform is logistics- and location-heavy, yet it had ZERO spatial
-- indexes and no PostGIS extension. Every proximity question ("nearest
-- warehouse", "farmers within 50km", "is this vehicle inside its geofence")
-- was a full table scan with per-row trigonometry.
--
-- PART 1 - typed coordinate columns
-- A btree index cannot answer "within X km" directly, but it CAN answer
-- "latitude BETWEEN a AND b". The application computes a bounding box first
-- (src/utils/geo.js -> boundingBox / radiusQueryFragment), filters using these
-- indexes, then refines with exact haversine distance. Sequential scan becomes
-- an index range scan.
--
-- PART 2 - coordinates stored in JSONB
-- Most location data on this platform is NOT in typed columns: it lives inside
-- JSONB (location / current_location / coordinates / gps_coordinates). GIN
-- indexes below make containment and key lookups usable, but JSONB cannot
-- support efficient numeric RANGE queries, which is what radius search needs.
--
-- KNOWN LIMITATION - needs a human decision
-- The JSONB payload shape is not consistent across the codebase (some services
-- read `location` as a plain string, others as an object), so no expression
-- index on a specific key could be generated safely. Until those columns are
-- normalised into typed latitude/longitude DECIMAL columns - or migrated to
-- PostGIS geography - radius search over those tables will remain a scan.
-- Deliberately NOT guessed at here: a wrong expression index silently fails to
-- be used rather than erroring, which is worse than no index.
--
-- DECISION (2026-08-15, explicit authorization given): do not mass-migrate
-- the 10 existing JSONB-location tables in one pass - each has a different
-- payload shape and a different set of callers, and a wrong blind migration
-- here risks silently breaking real location data across logistics,
-- geofencing, and farmer-profile services simultaneously. Instead: (1) every
-- NEW table going forward must use typed latitude/longitude DECIMAL columns,
-- never a JSONB blob, per this file's own finding; (2) normalise the 10
-- existing tables one at a time, each as its own reviewed migration with its
-- own real-data verification, starting with whichever table's radius queries
-- are actually measured as slow in production - not guessed at here without
-- that measurement. Real PostGIS (`CREATE EXTENSION postgis`) remains the
-- longer-term target once typed columns exist to migrate from.
--
-- UPGRADE PATH (preferred where PostGIS is available):
--     CREATE EXTENSION IF NOT EXISTS postgis;
--     ALTER TABLE <t> ADD COLUMN geog geography(Point,4326)
--       GENERATED ALWAYS AS (ST_MakePoint(longitude, latitude)::geography) STORED;
--     CREATE INDEX IF NOT EXISTS idx_<t>_geog ON <t> USING GIST (geog);
--
-- Runs after table creation, before the FK-index and reconciliation files.
-- Safe to re-run.
-- ============================================================================

-- Part 1: composite btree on typed coordinate columns (supports bounding box)
CREATE INDEX IF NOT EXISTS idx_addresses_lat_lng
    ON addresses (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_lat_lng
    ON shipment_tracking (latitude, longitude);

-- Part 2: GIN on JSONB location payloads (containment / key lookup only)
CREATE INDEX IF NOT EXISTS idx_land_records_gps_coordinates_gin
    ON land_records USING GIN (gps_coordinates);
CREATE INDEX IF NOT EXISTS idx_villages_coordinates_gin
    ON villages USING GIN (coordinates);
CREATE INDEX IF NOT EXISTS idx_csr_projects_location_gin
    ON csr_projects USING GIN (location);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_current_location_gin
    ON fleet_vehicles USING GIN (current_location);
CREATE INDEX IF NOT EXISTS idx_shipment_geofences_coordinates_gin
    ON shipment_geofences USING GIN (coordinates);
CREATE INDEX IF NOT EXISTS idx_warehouses_location_gin
    ON warehouses USING GIN (location);
CREATE INDEX IF NOT EXISTS idx_iot_devices_location_gin
    ON iot_devices USING GIN (location);
CREATE INDEX IF NOT EXISTS idx_farm_information_coordinates_gin
    ON farm_information USING GIN (coordinates);
CREATE INDEX IF NOT EXISTS idx_engineering_projects_location_gin
    ON engineering_projects USING GIN (location);
CREATE INDEX IF NOT EXISTS idx_digital_twin_sensors_location_gin
    ON digital_twin_sensors USING GIN (location);
CREATE INDEX IF NOT EXISTS idx_quality_checks_location_gin
    ON quality_checks USING GIN (location);
CREATE INDEX IF NOT EXISTS idx_organic_farms_gps_coordinates_gin
    ON organic_farms USING GIN (gps_coordinates);
CREATE INDEX IF NOT EXISTS idx_rural_economic_units_location_gin
    ON rural_economic_units USING GIN (location);
CREATE INDEX IF NOT EXISTS idx_enterprise_feasibility_analysis_location_gin
    ON enterprise_feasibility_analysis USING GIN (location);
CREATE INDEX IF NOT EXISTS idx_renewable_energy_systems_location_gin
    ON renewable_energy_systems USING GIN (location);
CREATE INDEX IF NOT EXISTS idx_market_intelligence_location_gin
    ON market_intelligence USING GIN (location);
CREATE INDEX IF NOT EXISTS idx_buying_clubs_location_gin
    ON buying_clubs USING GIN (location);
CREATE INDEX IF NOT EXISTS idx_logistics_orders_current_location_gin
    ON logistics_orders USING GIN (current_location);
CREATE INDEX IF NOT EXISTS idx_mobility_rides_current_location_gin
    ON mobility_rides USING GIN (current_location);
