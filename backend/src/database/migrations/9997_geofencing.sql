-- ============================================================================
-- Geofencing — circular zones + entry/exit check events.
--
-- WHY CIRCULAR, NOT POLYGON
-- A precise polygon geofence needs a surveyed boundary. This platform has no
-- surveyed field/warehouse boundary data (M035 GIS Land Mapping is an unwired
-- placeholder — see frontend/src/pages/LandManagementPage.jsx's own
-- "backend endpoint has not been built yet" note on that tab). A center point
-- + radius is the honest shape given what mobile GPS actually reports: a
-- point with an accuracy radius, not a boundary. `backend/src/utils/geo.js`
-- already has `isWithinPolygon` for the day real survey data exists; this
-- schema deliberately does not use it yet.
--
-- WHY ONE EVENTS TABLE FOR BOTH USE CASES
-- A farmer/labourer manual check-in and a driver's GPS ping being tested
-- against a warehouse zone are the same question — "is this point inside
-- that circle, right now" — asked by two different callers. Splitting them
-- into two tables would duplicate the is_inside/distance bookkeeping for no
-- benefit; `source` distinguishes them instead.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS geofences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(160) NOT NULL,
    zone_type VARCHAR(30) NOT NULL
        CHECK (zone_type IN ('farm', 'field', 'warehouse', 'packhouse', 'village', 'other')),
    center_latitude NUMERIC(10,7) NOT NULL CHECK (center_latitude BETWEEN -90 AND 90),
    center_longitude NUMERIC(11,7) NOT NULL CHECK (center_longitude BETWEEN -180 AND 180),
    -- Real GPS accuracy in dense NE forest/hilly terrain runs 10-50m. A radius
    -- below that is not a real boundary, it is noise; reject it rather than
    -- let a zone be defined tighter than the sensor that will test it.
    radius_meters NUMERIC(8,2) NOT NULL CHECK (radius_meters >= 20),
    description TEXT,
    reference_id UUID,           -- optional link to shipment/warehouse/farmer record; no FK, callers vary
    reference_type VARCHAR(40),  -- e.g. 'shipment_destination', 'farmer_field'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS geofence_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    geofence_id UUID NOT NULL REFERENCES geofences(id) ON DELETE CASCADE,
    -- 'manual_checkin'  — a person tapped "Check in" (labour/farmer use case)
    -- 'driver_ping'     — an existing driver_location row was evaluated against a zone
    source VARCHAR(20) NOT NULL CHECK (source IN ('manual_checkin', 'driver_ping')),
    user_id UUID,          -- who checked in (manual_checkin)
    driver_id UUID,        -- whose ping this is (driver_ping)
    shipment_id UUID,      -- shipment this ping belongs to, if any (driver_ping)
    latitude NUMERIC(10,7) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude NUMERIC(11,7) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    accuracy_m NUMERIC(8,2), -- navigator.geolocation coords.accuracy, when supplied
    distance_meters NUMERIC(10,2) NOT NULL, -- haversine distance from geofence center at time of check
    is_inside BOOLEAN NOT NULL,
    event_type VARCHAR(10) CHECK (event_type IS NULL OR event_type IN ('entered', 'exited')),
    -- NULL when this reading did not change the previous inside/outside state
    -- for this geofence+identity; set only on a genuine transition, so a
    -- driver pinging every few minutes inside a warehouse zone does not spam
    -- "entered" repeatedly.
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_geofences_active ON geofences (is_active, zone_type);
CREATE INDEX IF NOT EXISTS idx_geofence_events_geofence ON geofence_events (geofence_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_geofence_events_user ON geofence_events (user_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_geofence_events_shipment ON geofence_events (shipment_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_geofence_events_driver ON geofence_events (driver_id, recorded_at);
