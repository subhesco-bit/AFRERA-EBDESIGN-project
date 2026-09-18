CREATE TABLE IF NOT EXISTS ai_generation_runs (
  id UUID PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE RESTRICT,
  actor_id UUID,
  module_id VARCHAR(160) NOT NULL,
  capability VARCHAR(160) NOT NULL,
  provider VARCHAR(80),
  model VARCHAR(160),
  status VARCHAR(32) NOT NULL CHECK (status IN ('running','generated','not_configured','provider_error')),
  prompt_sha256 CHAR(64) NOT NULL,
  context_sha256 CHAR(64) NOT NULL,
  prompt_template_version VARCHAR(40) NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,
  latency_ms INTEGER,
  library_provenance JSONB NOT NULL DEFAULT '[]',
  policy_decision JSONB NOT NULL DEFAULT '{}',
  error_code VARCHAR(80),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ai_generation_runs_scope
  ON ai_generation_runs(company_id,module_id,capability,started_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_generation_runs_actor
  ON ai_generation_runs(actor_id,started_at DESC);

CREATE OR REPLACE FUNCTION prevent_ai_generation_run_delete()
RETURNS TRIGGER AS $$ BEGIN
  RAISE EXCEPTION 'AI generation evidence is append-preserved and cannot be deleted.';
END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_ai_generation_runs_no_delete ON ai_generation_runs;
CREATE TRIGGER trg_ai_generation_runs_no_delete BEFORE DELETE ON ai_generation_runs
FOR EACH ROW EXECUTE FUNCTION prevent_ai_generation_run_delete();
