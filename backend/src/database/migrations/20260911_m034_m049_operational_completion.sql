CREATE TABLE IF NOT EXISTS m034_parcels (id UUID PRIMARY KEY,parcel_id TEXT NOT NULL UNIQUE,land_id TEXT,village_id TEXT,geometry JSONB NOT NULL,crs TEXT NOT NULL DEFAULT 'EPSG:4326',area_ha NUMERIC CHECK(area_ha IS NULL OR area_ha>=0),status TEXT NOT NULL DEFAULT 'active',properties JSONB NOT NULL DEFAULT '{}'::jsonb,created_by TEXT,updated_by TEXT,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),deleted_at TIMESTAMPTZ);
CREATE INDEX IF NOT EXISTS idx_m034_parcels_village ON m034_parcels(village_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_m034_parcels_geometry ON m034_parcels USING GIN(geometry);

CREATE TABLE IF NOT EXISTS m035_gis_features (id UUID PRIMARY KEY,feature_id TEXT UNIQUE,layer TEXT NOT NULL,geometry JSONB NOT NULL,crs TEXT NOT NULL,source_reference TEXT,status TEXT NOT NULL DEFAULT 'active',attributes JSONB NOT NULL DEFAULT '{}'::jsonb,created_by TEXT,updated_by TEXT,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),deleted_at TIMESTAMPTZ);
CREATE INDEX IF NOT EXISTS idx_m035_layer ON m035_gis_features(layer) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_m035_geometry ON m035_gis_features USING GIN(geometry);

CREATE TABLE IF NOT EXISTS m037_water_resources (id UUID PRIMARY KEY,resource_id TEXT NOT NULL UNIQUE,resource_type TEXT NOT NULL,location JSONB NOT NULL,geometry JSONB,village_id TEXT,capacity NUMERIC,capacity_unit TEXT,seasonal_status TEXT,quality_status TEXT,status TEXT NOT NULL DEFAULT 'active',properties JSONB NOT NULL DEFAULT '{}'::jsonb,created_by TEXT,updated_by TEXT,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),deleted_at TIMESTAMPTZ);
CREATE INDEX IF NOT EXISTS idx_m037_village ON m037_water_resources(village_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS m038_geo_boundaries (id UUID PRIMARY KEY,boundary_id TEXT UNIQUE,boundary_type TEXT NOT NULL,name TEXT,parent_boundary_id TEXT,geometry JSONB NOT NULL,crs TEXT NOT NULL DEFAULT 'EPSG:4326',effective_from DATE,effective_to DATE,status TEXT NOT NULL DEFAULT 'active',properties JSONB NOT NULL DEFAULT '{}'::jsonb,created_by TEXT,updated_by TEXT,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),deleted_at TIMESTAMPTZ);
CREATE INDEX IF NOT EXISTS idx_m038_type_parent ON m038_geo_boundaries(boundary_type,parent_boundary_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS m039_surveys (id UUID PRIMARY KEY,survey_id TEXT NOT NULL UNIQUE,survey_date DATE NOT NULL,survey_type TEXT,location JSONB NOT NULL,geometry JSONB,enumerator_id TEXT,source_reference TEXT,status TEXT NOT NULL DEFAULT 'captured',findings JSONB NOT NULL DEFAULT '{}'::jsonb,evidence JSONB NOT NULL DEFAULT '{}'::jsonb,created_by TEXT,updated_by TEXT,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),deleted_at TIMESTAMPTZ);
CREATE INDEX IF NOT EXISTS idx_m039_date ON m039_surveys(survey_date DESC) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS m049_community_assets (id UUID PRIMARY KEY,asset_id TEXT NOT NULL UNIQUE,asset_type TEXT NOT NULL,name TEXT,location JSONB NOT NULL,village_id TEXT,condition TEXT NOT NULL CHECK(condition IN('excellent','good','fair','poor','critical')),custodian TEXT,utilization_pct NUMERIC CHECK(utilization_pct IS NULL OR utilization_pct BETWEEN 0 AND 100),maintenance_state TEXT,next_maintenance_at TIMESTAMPTZ,status TEXT NOT NULL DEFAULT 'active',properties JSONB NOT NULL DEFAULT '{}'::jsonb,created_by TEXT,updated_by TEXT,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),deleted_at TIMESTAMPTZ);
CREATE INDEX IF NOT EXISTS idx_m049_village_condition ON m049_community_assets(village_id,condition) WHERE deleted_at IS NULL;

COMMENT ON TABLE m034_parcels IS 'M034 authoritative parcel mapping registry with geometry provenance.';
COMMENT ON TABLE m035_gis_features IS 'M035 authoritative GIS thematic feature registry with CRS.';
COMMENT ON TABLE m037_water_resources IS 'M037 authoritative mapped water-resource inventory.';
COMMENT ON TABLE m038_geo_boundaries IS 'M038 version-ready administrative/geospatial boundary registry.';
COMMENT ON TABLE m039_surveys IS 'M039 survey observations with enumerator/source evidence.';
COMMENT ON TABLE m049_community_assets IS 'M049 community assets with condition, custodian, utilization and maintenance state.';
