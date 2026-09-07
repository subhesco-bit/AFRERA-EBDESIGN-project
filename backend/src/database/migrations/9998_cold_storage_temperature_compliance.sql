-- ============================================================================
-- 9998_cold_storage_temperature_compliance.sql
--
-- Facility-level temperature compliance logging for cold_storage_facilities
-- (migration 3104_cold_storage_schema.sql).
--
-- WHY A NEW TABLE, NOT temperature_readings
-- temperature_readings (013/034_logistics_enhancement_schema.sql) has a
-- NOT NULL shipment_id FK into shipments — it records a reading taken on a
-- consignment in transit. A cold storage facility probe is a different
-- question: "is bay X currently within range", asked continuously whether
-- or not any shipment is inside it at that moment (an empty bay is still
-- monitored). Forcing a facility reading through a shipment-scoped table
-- would mean either fabricating a shipment_id or leaving facility
-- temperature unmonitored between shipments — neither is honest.
--
-- WHY is_compliant/deviation_c ARE STORED, NOT JUST temperature
-- cold_storage_facilities.temperature_range_min_c/max_c can change over the
-- life of a facility (re-certification, equipment upgrade). Storing the
-- compliance verdict alongside the reading means a compliance history query
-- reflects what the range WAS at the time the reading was taken, not a
-- retroactively-recalculated verdict against today's range.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS cold_storage_temperature_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES cold_storage_facilities(id) ON DELETE CASCADE,
    recorded_temperature_c NUMERIC(5,2) NOT NULL,
    recorded_humidity_pct NUMERIC(5,2),
    sensor_id VARCHAR(100),
    is_compliant BOOLEAN NOT NULL,
    -- Degrees outside the facility's declared range at time of reading (0 when compliant).
    deviation_c NUMERIC(5,2) NOT NULL DEFAULT 0,
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cold_storage_temp_readings_facility
    ON cold_storage_temperature_readings(facility_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_cold_storage_temp_readings_compliance
    ON cold_storage_temperature_readings(facility_id, is_compliant);

COMMENT ON TABLE cold_storage_temperature_readings IS
    'Facility-level (not shipment-level) temperature probe log for cold_storage_facilities. Compliance verdict computed and stored at write time by coldStorageRoutes.js against the facility''s declared range.';
