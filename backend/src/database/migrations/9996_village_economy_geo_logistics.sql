-- 9996_village_economy_geo_logistics.sql
-- Village production + market flow + geospatial/logistics intelligence.
-- Intentionally uses latitude/longitude + SQL Haversine calculations so the
-- feature does not require PostGIS to be installed.

BEGIN;

ALTER TABLE villages
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS geocode_source VARCHAR(50),
  ADD COLUMN IF NOT EXISTS geocode_accuracy_m NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS geocode_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS address_line TEXT,
  ADD COLUMN IF NOT EXISTS locality VARCHAR(255),
  ADD COLUMN IF NOT EXISTS nearest_post_office_id BIGINT,
  ADD COLUMN IF NOT EXISTS nearest_railway_station_id BIGINT,
  ADD COLUMN IF NOT EXISTS nearest_airport_id BIGINT,
  ADD COLUMN IF NOT EXISTS logistics_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD CONSTRAINT villages_latitude_range CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  ADD CONSTRAINT villages_longitude_range CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180);

CREATE INDEX IF NOT EXISTS idx_villages_lat_lon ON villages (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_villages_geo_state ON villages (state, district, block);

CREATE TABLE IF NOT EXISTS village_production_commodities (
  id BIGSERIAL PRIMARY KEY,
  commodity_code VARCHAR(60) UNIQUE NOT NULL,
  commodity_name VARCHAR(160) NOT NULL,
  category VARCHAR(60) NOT NULL,
  subcategory VARCHAR(80),
  species_or_variety VARCHAR(120),
  default_unit VARCHAR(30) NOT NULL DEFAULT 'kg',
  market_form VARCHAR(80),
  perishable BOOLEAN NOT NULL DEFAULT TRUE,
  cold_chain_required BOOLEAN NOT NULL DEFAULT FALSE,
  legally_restricted BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS village_production_records (
  id BIGSERIAL PRIMARY KEY,
  village_id INTEGER NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  commodity_id BIGINT NOT NULL REFERENCES village_production_commodities(id),
  producer_type VARCHAR(30) NOT NULL DEFAULT 'farmer',
  producer_id VARCHAR(100),
  production_period_start DATE NOT NULL,
  production_period_end DATE,
  quantity NUMERIC(18,3) NOT NULL CHECK (quantity >= 0),
  unit VARCHAR(30) NOT NULL,
  quality_grade VARCHAR(50),
  estimated_value NUMERIC(18,2) CHECK (estimated_value IS NULL OR estimated_value >= 0),
  source VARCHAR(50) NOT NULL DEFAULT 'manual',
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (production_period_end IS NULL OR production_period_end >= production_period_start)
);

CREATE INDEX IF NOT EXISTS idx_village_production_village_period
  ON village_production_records(village_id, production_period_start, commodity_id);
CREATE INDEX IF NOT EXISTS idx_village_production_commodity
  ON village_production_records(commodity_id, production_period_start);

CREATE TABLE IF NOT EXISTS village_economic_flows (
  id BIGSERIAL PRIMARY KEY,
  village_id INTEGER NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  production_record_id BIGINT REFERENCES village_production_records(id) ON DELETE SET NULL,
  commodity_id BIGINT NOT NULL REFERENCES village_production_commodities(id),
  flow_type VARCHAR(40) NOT NULL,
  destination_type VARCHAR(50),
  destination_id VARCHAR(120),
  period_start DATE NOT NULL,
  period_end DATE,
  quantity NUMERIC(18,3) NOT NULL CHECK (quantity >= 0),
  unit VARCHAR(30) NOT NULL,
  value_amount NUMERIC(18,2) CHECK (value_amount IS NULL OR value_amount >= 0),
  source VARCHAR(50) NOT NULL DEFAULT 'manual',
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (period_end IS NULL OR period_end >= period_start),
  CHECK (flow_type IN ('household_consumption','village_consumption','production_input','processing','storage','donation','loss','market','external_purchase'))
);

CREATE INDEX IF NOT EXISTS idx_village_economic_flows_summary
  ON village_economic_flows(village_id, commodity_id, flow_type, period_start);

CREATE TABLE IF NOT EXISTS village_logistics_facilities (
  id BIGSERIAL PRIMARY KEY,
  facility_type VARCHAR(40) NOT NULL,
  name VARCHAR(255) NOT NULL,
  facility_code VARCHAR(100),
  state VARCHAR(100),
  district VARCHAR(150),
  block VARCHAR(150),
  address TEXT,
  pincode VARCHAR(20),
  latitude NUMERIC(10,7) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude NUMERIC(10,7) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  phone VARCHAR(50),
  operating_status VARCHAR(30) NOT NULL DEFAULT 'active',
  capacity JSONB NOT NULL DEFAULT '{}'::jsonb,
  source VARCHAR(80),
  source_reference TEXT,
  verified_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (facility_type, facility_code),
  CHECK (facility_type IN ('post_office','railway_station','airport','market','warehouse','cold_store','collection_center','processing_unit','road_hub','other'))
);

CREATE INDEX IF NOT EXISTS idx_village_logistics_facilities_geo
  ON village_logistics_facilities(facility_type, latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_village_logistics_facilities_admin
  ON village_logistics_facilities(state, district, block, facility_type);

CREATE TABLE IF NOT EXISTS village_logistics_routes (
  id BIGSERIAL PRIMARY KEY,
  village_id INTEGER NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  facility_id BIGINT NOT NULL REFERENCES village_logistics_facilities(id) ON DELETE CASCADE,
  route_type VARCHAR(40) NOT NULL DEFAULT 'road',
  distance_km NUMERIC(12,3),
  estimated_minutes INTEGER,
  distance_source VARCHAR(50) DEFAULT 'geodesic',
  last_calculated_at TIMESTAMPTZ,
  route_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(village_id, facility_id, route_type),
  CHECK (distance_km IS NULL OR distance_km >= 0),
  CHECK (estimated_minutes IS NULL OR estimated_minutes >= 0)
);

CREATE INDEX IF NOT EXISTS idx_village_logistics_routes_village
  ON village_logistics_routes(village_id, route_type, distance_km);

CREATE TABLE IF NOT EXISTS village_logistics_profiles (
  village_id INTEGER PRIMARY KEY REFERENCES villages(id) ON DELETE CASCADE,
  nearest_post_office_id BIGINT REFERENCES village_logistics_facilities(id),
  nearest_post_office_distance_km NUMERIC(12,3),
  nearest_railway_station_id BIGINT REFERENCES village_logistics_facilities(id),
  nearest_railway_station_distance_km NUMERIC(12,3),
  nearest_airport_id BIGINT REFERENCES village_logistics_facilities(id),
  nearest_airport_distance_km NUMERIC(12,3),
  nearest_market_id BIGINT REFERENCES village_logistics_facilities(id),
  nearest_market_distance_km NUMERIC(12,3),
  nearest_warehouse_id BIGINT REFERENCES village_logistics_facilities(id),
  nearest_warehouse_distance_km NUMERIC(12,3),
  nearest_cold_store_id BIGINT REFERENCES village_logistics_facilities(id),
  nearest_cold_store_distance_km NUMERIC(12,3),
  nearest_collection_center_id BIGINT REFERENCES village_logistics_facilities(id),
  nearest_collection_center_distance_km NUMERIC(12,3),
  road_access_rating VARCHAR(30),
  all_weather_road BOOLEAN,
  transport_modes JSONB NOT NULL DEFAULT '[]'::jsonb,
  freight_constraints JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_calculated_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE OR REPLACE VIEW village_economic_balance AS
SELECT
  p.village_id,
  p.commodity_id,
  c.commodity_name,
  c.category,
  SUM(p.quantity) AS total_production,
  COALESCE(SUM(CASE WHEN f.flow_type = 'household_consumption' THEN f.quantity ELSE 0 END),0) AS household_consumption,
  COALESCE(SUM(CASE WHEN f.flow_type = 'village_consumption' THEN f.quantity ELSE 0 END),0) AS village_consumption,
  COALESCE(SUM(CASE WHEN f.flow_type = 'production_input' THEN f.quantity ELSE 0 END),0) AS production_input,
  COALESCE(SUM(CASE WHEN f.flow_type = 'processing' THEN f.quantity ELSE 0 END),0) AS processing,
  COALESCE(SUM(CASE WHEN f.flow_type = 'storage' THEN f.quantity ELSE 0 END),0) AS storage,
  COALESCE(SUM(CASE WHEN f.flow_type = 'donation' THEN f.quantity ELSE 0 END),0) AS donation,
  COALESCE(SUM(CASE WHEN f.flow_type = 'loss' THEN f.quantity ELSE 0 END),0) AS loss,
  COALESCE(SUM(CASE WHEN f.flow_type = 'market' THEN f.quantity ELSE 0 END),0) AS market_quantity
FROM village_production_records p
JOIN village_production_commodities c ON c.id = p.commodity_id
LEFT JOIN village_economic_flows f ON f.production_record_id = p.id
GROUP BY p.village_id, p.commodity_id, c.commodity_name, c.category;

COMMIT;
