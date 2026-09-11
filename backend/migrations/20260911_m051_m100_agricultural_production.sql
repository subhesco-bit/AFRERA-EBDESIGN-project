CREATE TABLE IF NOT EXISTS agricultural_production_records (
 id UUID PRIMARY KEY,
 module_code TEXT NOT NULL CHECK (module_code ~ '^M(0[5-9][0-9]|100)$'),
 entity_type TEXT NOT NULL,
 entity_id TEXT NOT NULL,
 data JSONB NOT NULL DEFAULT '{}'::jsonb,
 status TEXT NOT NULL DEFAULT 'recorded' CHECK (status IN ('recorded','validated','rejected','completed')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agri_prod_module_entity ON agricultural_production_records(module_code,entity_type,entity_id);
CREATE INDEX IF NOT EXISTS idx_agri_prod_created ON agricultural_production_records(created_at DESC);

CREATE TABLE IF NOT EXISTS agricultural_production_quality_events (
 id UUID PRIMARY KEY,
 production_record_id UUID NOT NULL REFERENCES agricultural_production_records(id) ON DELETE CASCADE,
 quality_code TEXT NOT NULL,
 measured_value NUMERIC,
 unit TEXT,
 evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
 passed BOOLEAN NOT NULL,
 recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agri_quality_record ON agricultural_production_quality_events(production_record_id);
