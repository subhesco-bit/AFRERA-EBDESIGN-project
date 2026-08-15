-- ============================================================================
-- 3104_cold_storage_schema.sql   (2026-08-11)
--
-- COLD STORAGE — confirmed genuinely absent before this migration.
--
-- PRE-BUILD GATE (AFRERA_CLAUDE_BUILD_DIRECTIVE.md 0.4)
--   1. Distinguishing noun: "cold storage" (a refrigerated facility a farmer/
--      FPO books produce into, distinct from cold-chain logistics in transit).
--   2. Grep hits before this migration: erpService.js line ~780 (a single
--      `'cold_storage': 'BUILD'` entry in an asset-type-to-GL-account-class
--      mapping table — not a facility/booking capability), sharedInfraService.js
--      (the word appears three times in vocabulary lists — "packhouse, cold
--      storage, solar" — again not a capability), plus doc/spec mentions.
--      Zero `cold_storage_*` tables, zero services, zero routes.
--   3. Nothing currently owns this domain, so nothing is being extracted from
--      or clubbed with. Building fresh is correct here (the ABSENT verdict
--      holds up under a hand probe).
-- ============================================================================

CREATE TABLE IF NOT EXISTS cold_storage_facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fpo_id UUID REFERENCES fpos(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    district VARCHAR(120),
    state VARCHAR(120),
    -- A facility states its own unit so quantities entered against it are
    -- never ambiguous between kg/quintal/tonne (the same ambiguity this
    -- session flagged in crop_plans.estimated_yield).
    capacity_units NUMERIC(12,2) NOT NULL CHECK (capacity_units > 0),
    capacity_unit_label VARCHAR(20) NOT NULL DEFAULT 'quintal'
        CHECK (capacity_unit_label IN ('kg','quintal','tonne')),
    temperature_range_min_c NUMERIC(5,2),
    temperature_range_max_c NUMERIC(5,2),
    operator_name VARCHAR(255),
    operator_phone VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active','maintenance','closed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cold_storage_temp_range_ordered CHECK (
      temperature_range_min_c IS NULL OR temperature_range_max_c IS NULL
      OR temperature_range_min_c <= temperature_range_max_c
    )
);

CREATE INDEX IF NOT EXISTS idx_cold_storage_facilities_fpo_id ON cold_storage_facilities(fpo_id);
CREATE INDEX IF NOT EXISTS idx_cold_storage_facilities_district ON cold_storage_facilities(district);
CREATE INDEX IF NOT EXISTS idx_cold_storage_facilities_status ON cold_storage_facilities(status);

CREATE TABLE IF NOT EXISTS cold_storage_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES cold_storage_facilities(id) ON DELETE CASCADE,
    farmer_id UUID REFERENCES farmers(id) ON DELETE SET NULL,
    fpo_id UUID REFERENCES fpos(id) ON DELETE SET NULL,
    produce_type VARCHAR(120) NOT NULL,
    quantity_units NUMERIC(12,2) NOT NULL CHECK (quantity_units > 0),
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'booked'
        CHECK (status IN ('booked','checked_in','checked_out','cancelled')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cold_storage_booking_dates_ordered CHECK (check_out_date >= check_in_date),
    CONSTRAINT cold_storage_booking_has_holder CHECK (farmer_id IS NOT NULL OR fpo_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_cold_storage_bookings_facility_id ON cold_storage_bookings(facility_id);
CREATE INDEX IF NOT EXISTS idx_cold_storage_bookings_farmer_id ON cold_storage_bookings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_cold_storage_bookings_fpo_id ON cold_storage_bookings(fpo_id);
-- The capacity check (coldStorageService.createBooking) scans active bookings
-- overlapping a date range for a facility — this index is what makes that scan
-- cheap instead of a full table sweep per booking attempt.
CREATE INDEX IF NOT EXISTS idx_cold_storage_bookings_facility_dates
    ON cold_storage_bookings(facility_id, check_in_date, check_out_date)
    WHERE status IN ('booked','checked_in');

COMMENT ON TABLE cold_storage_facilities IS 'Refrigerated storage facilities farmers/FPOs can book produce into. Real capacity in facility-declared units.';
COMMENT ON TABLE cold_storage_bookings IS 'Bookings against a cold storage facility. Capacity-checked at insert time by coldStorageService — see its header for the overlap rule.';
