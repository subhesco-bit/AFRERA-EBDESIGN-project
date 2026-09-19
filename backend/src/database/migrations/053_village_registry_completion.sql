-- 053_village_registry_completion.sql
-- Complete the existing villages table used by M041 Village Registry.
-- This migration is additive and preserves the existing governance schema.

ALTER TABLE villages ADD COLUMN IF NOT EXISTS village_code VARCHAR(50);
ALTER TABLE villages ADD COLUMN IF NOT EXISTS block VARCHAR(255);
ALTER TABLE villages ADD COLUMN IF NOT EXISTS tehsil VARCHAR(255);
ALTER TABLE villages ADD COLUMN IF NOT EXISTS gram_panchayat VARCHAR(255);
ALTER TABLE villages ADD COLUMN IF NOT EXISTS pincode VARCHAR(10);
ALTER TABLE villages ADD COLUMN IF NOT EXISTS area_sq_km NUMERIC(12,3);
ALTER TABLE villages ADD COLUMN IF NOT EXISTS elevation NUMERIC(10,2);
ALTER TABLE villages ADD COLUMN IF NOT EXISTS climate_zone VARCHAR(100);
ALTER TABLE villages ADD COLUMN IF NOT EXISTS soil_type VARCHAR(100);
ALTER TABLE villages ADD COLUMN IF NOT EXISTS water_sources JSONB DEFAULT '[]'::jsonb;
ALTER TABLE villages ADD COLUMN IF NOT EXISTS infrastructure JSONB DEFAULT '{}'::jsonb;
ALTER TABLE villages ADD COLUMN IF NOT EXISTS agricultural_land_area NUMERIC(12,3);
ALTER TABLE villages ADD COLUMN IF NOT EXISTS major_crops JSONB DEFAULT '[]'::jsonb;
ALTER TABLE villages ADD COLUMN IF NOT EXISTS livestock_count JSONB DEFAULT '{}'::jsonb;
ALTER TABLE villages ADD COLUMN IF NOT EXISTS ai_development_index NUMERIC(5,2);
ALTER TABLE villages ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE villages ADD COLUMN IF NOT EXISTS avg_income NUMERIC(15,2);
ALTER TABLE villages ADD COLUMN IF NOT EXISTS literacy_rate NUMERIC(5,2);
ALTER TABLE villages ADD COLUMN IF NOT EXISTS irrigation_coverage NUMERIC(5,2);
ALTER TABLE villages ADD COLUMN IF NOT EXISTS electrified_households INTEGER;
ALTER TABLE villages ADD COLUMN IF NOT EXISTS road_access BOOLEAN;
ALTER TABLE villages ADD COLUMN IF NOT EXISTS market_distance_km NUMERIC(10,2);
ALTER TABLE villages ADD COLUMN IF NOT EXISTS financial_institutions_count INTEGER DEFAULT 0;
ALTER TABLE villages ADD COLUMN IF NOT EXISTS schools_count INTEGER DEFAULT 0;
ALTER TABLE villages ADD COLUMN IF NOT EXISTS health_centers_count INTEGER DEFAULT 0;
ALTER TABLE villages ADD COLUMN IF NOT EXISTS cooperative_societies_count INTEGER DEFAULT 0;
ALTER TABLE villages ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'active';

UPDATE villages SET status = 'active' WHERE status IS NULL;
UPDATE villages SET village_code = CONCAT('VIL-', id) WHERE village_code IS NULL;

ALTER TABLE villages ALTER COLUMN village_code SET NOT NULL;
ALTER TABLE villages ADD CONSTRAINT villages_village_code_unique UNIQUE (village_code);
ALTER TABLE villages ADD CONSTRAINT villages_status_check CHECK (status IN ('active','inactive','archived'));
ALTER TABLE villages ADD CONSTRAINT villages_population_check CHECK (population IS NULL OR population >= 0);
ALTER TABLE villages ADD CONSTRAINT villages_households_check CHECK (households IS NULL OR households >= 0);
ALTER TABLE villages ADD CONSTRAINT villages_area_check CHECK (area_sq_km IS NULL OR area_sq_km >= 0);
ALTER TABLE villages ADD CONSTRAINT villages_ai_index_check CHECK (ai_development_index IS NULL OR (ai_development_index >= 0 AND ai_development_index <= 100));
ALTER TABLE villages ADD CONSTRAINT villages_literacy_check CHECK (literacy_rate IS NULL OR (literacy_rate >= 0 AND literacy_rate <= 100));
ALTER TABLE villages ADD CONSTRAINT villages_irrigation_check CHECK (irrigation_coverage IS NULL OR (irrigation_coverage >= 0 AND irrigation_coverage <= 100));
ALTER TABLE villages ADD CONSTRAINT villages_electrified_check CHECK (electrified_households IS NULL OR electrified_households >= 0);
ALTER TABLE villages ADD CONSTRAINT villages_service_counts_check CHECK (
  (financial_institutions_count IS NULL OR financial_institutions_count >= 0) AND
  (schools_count IS NULL OR schools_count >= 0) AND
  (health_centers_count IS NULL OR health_centers_count >= 0) AND
  (cooperative_societies_count IS NULL OR cooperative_societies_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_villages_block ON villages(block);
CREATE INDEX IF NOT EXISTS idx_villages_district_state ON villages(district, state);
CREATE INDEX IF NOT EXISTS idx_villages_status ON villages(status);
CREATE INDEX IF NOT EXISTS idx_villages_code ON villages(village_code);

COMMENT ON COLUMN villages.village_code IS 'Stable business identifier for the village registry.';
COMMENT ON COLUMN villages.infrastructure IS 'Structured infrastructure inventory/assessment for roads, electricity, water, healthcare, education, internet and related assets.';
COMMENT ON COLUMN villages.ai_development_index IS '0-100 development index generated from village operational indicators; informational decision-support metric.';
