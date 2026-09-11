CREATE TABLE IF NOT EXISTS m051_m100_hardening_audits (
 id UUID PRIMARY KEY,
 module_code TEXT NOT NULL CHECK (module_code ~ '^M(0[5-9][0-9]|100)$'),
 entity_id TEXT,
 validation_result JSONB NOT NULL,
 ai_enhancements JSONB NOT NULL DEFAULT '[]'::jsonb,
 actor_id TEXT,
 correlation_id UUID NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_m051_m100_hardening_module ON m051_m100_hardening_audits(module_code,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_m051_m100_hardening_entity ON m051_m100_hardening_audits(entity_id,created_at DESC);
