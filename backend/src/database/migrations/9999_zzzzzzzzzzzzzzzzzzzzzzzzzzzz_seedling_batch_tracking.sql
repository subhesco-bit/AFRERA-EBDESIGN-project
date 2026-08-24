-- M046 (Nursery Management)'s createSeedlingBatch/updateSeedlingHealth insert
-- into seedling_batches/seedling_health_records, but neither table existed
-- anywhere in the schema - both would fail with "relation does not exist" at
-- runtime. crop_id/variety_id are left as plain UUID columns rather than FKs:
-- two different "crops"-shaped tables exist across migrations (041_rural_life_os
-- and the crop_management_schema built this session) and picking wrong would
-- silently constrain against the wrong one - not worth guessing for what these
-- two functions actually need, which is nursery -> batch -> health tracking.
CREATE TABLE IF NOT EXISTS seedling_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nursery_id UUID NOT NULL REFERENCES nurseries(id) ON DELETE CASCADE,
    crop_id UUID,
    variety_id UUID,
    quantity NUMERIC(12,2),
    sowing_date DATE,
    expected_transplant_date DATE,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_seedling_batches_nursery_id ON seedling_batches(nursery_id);

CREATE TABLE IF NOT EXISTS seedling_health_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES seedling_batches(id) ON DELETE CASCADE,
    health_score NUMERIC(5,2),
    growth_stage VARCHAR(50),
    issues JSONB DEFAULT '[]',
    observations TEXT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_seedling_health_records_batch_id ON seedling_health_records(batch_id);
