-- M046 (Nursery Management)'s service.js was written against a richer nursery
-- model (farmer ownership, structured location, area, irrigation type) than the
-- "nurseries" table crop_management_schema.sql actually created - its INSERT
-- referenced farmer_id/name/location/area/type/irrigation_type, none of which
-- existed, so every write would have failed at runtime. cropManagementService's
-- generic CRUD wrapper for the same table (createCrudService('nurseries', {
-- fields: [...] })) uses an explicit field list, so adding nullable columns
-- here doesn't change its behavior at all - safe to extend rather than dumb
-- down M046's implementation to fit the narrower original schema.
ALTER TABLE nurseries ADD COLUMN IF NOT EXISTS farmer_id UUID REFERENCES farmers(id);
ALTER TABLE nurseries ADD COLUMN IF NOT EXISTS location JSONB;
ALTER TABLE nurseries ADD COLUMN IF NOT EXISTS area NUMERIC(12,2);
ALTER TABLE nurseries ADD COLUMN IF NOT EXISTS irrigation_type VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_nurseries_farmer_id ON nurseries(farmer_id);
