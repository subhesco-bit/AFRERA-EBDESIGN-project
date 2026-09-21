-- Canonical, governed Artificial Scientist research workflow.
CREATE TABLE IF NOT EXISTS research_hypotheses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (length(trim(title)) >= 5),
  statement TEXT NOT NULL CHECK (length(trim(statement)) >= 10),
  rationale TEXT NOT NULL,
  null_hypothesis TEXT,
  domain VARCHAR(80) NOT NULL,
  state VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (state IN ('draft','approved','rejected','retired')),
  evidence_refs JSONB NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(evidence_refs)='array'),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reviewed_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  reviewed_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS research_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hypothesis_id UUID NOT NULL REFERENCES research_hypotheses(id) ON DELETE RESTRICT,
  title TEXT NOT NULL, objective TEXT NOT NULL,
  protocol JSONB NOT NULL CHECK (jsonb_typeof(protocol)='object'),
  variables JSONB NOT NULL CHECK (jsonb_typeof(variables)='object'),
  acceptance_criteria JSONB NOT NULL CHECK (jsonb_typeof(acceptance_criteria)='object'),
  reproducibility JSONB NOT NULL CHECK (jsonb_typeof(reproducibility)='object'),
  state VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (state IN ('draft','approved','running','completed','failed','cancelled')),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  approved_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  approved_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS research_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES research_experiments(id) ON DELETE RESTRICT,
  version INTEGER NOT NULL CHECK(version > 0),
  content JSONB NOT NULL CHECK(jsonb_typeof(content)='object'),
  sha256 CHAR(64) NOT NULL CHECK(sha256 ~ '^[0-9a-f]{64}$'),
  state VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK(state IN ('draft','approved','superseded')),
  authored_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reviewed_by UUID REFERENCES users(id) ON DELETE RESTRICT, reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(experiment_id,version)
);

CREATE TABLE IF NOT EXISTS research_experiment_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES research_experiments(id) ON DELETE RESTRICT,
  run_number INTEGER NOT NULL CHECK (run_number > 0),
  idempotency_key VARCHAR(160) NOT NULL,
  request_hash CHAR(64) NOT NULL CHECK(request_hash ~ '^[0-9a-f]{64}$'),
  state VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (state IN ('queued','running','succeeded','failed','cancelled')),
  input_snapshot JSONB NOT NULL CHECK (jsonb_typeof(input_snapshot)='object'),
  result_summary JSONB,
  reproducibility JSONB NOT NULL CHECK (jsonb_typeof(reproducibility)='object'),
  started_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  started_at TIMESTAMPTZ, finished_at TIMESTAMPTZ,
  failure_reason TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (experiment_id,run_number), UNIQUE(experiment_id,idempotency_key)
);

CREATE TABLE IF NOT EXISTS research_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hypothesis_id UUID REFERENCES research_hypotheses(id) ON DELETE RESTRICT,
  experiment_id UUID REFERENCES research_experiments(id) ON DELETE RESTRICT,
  run_id UUID REFERENCES research_experiment_runs(id) ON DELETE RESTRICT,
  kind VARCHAR(30) NOT NULL CHECK (kind IN ('dataset','protocol','code','result','report','ai_output','log')),
  name TEXT NOT NULL, uri TEXT, media_type VARCHAR(120), sha256 CHAR(64) NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  size_bytes BIGINT CHECK (size_bytes IS NULL OR size_bytes >= 0),
  metadata JSONB NOT NULL DEFAULT '{}', created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT research_artifact_one_parent CHECK (num_nonnulls(hypothesis_id,experiment_id,run_id)=1)
);

CREATE TABLE IF NOT EXISTS research_audit_events (
  id BIGSERIAL PRIMARY KEY, entity_type VARCHAR(30) NOT NULL,
  entity_id UUID NOT NULL, action VARCHAR(60) NOT NULL,
  actor_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  previous_state VARCHAR(20), next_state VARCHAR(20), detail JSONB NOT NULL DEFAULT '{}',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS research_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(30) NOT NULL CHECK(entity_type IN ('hypothesis','protocol','experiment','run','artifact')),
  entity_id UUID NOT NULL, decision VARCHAR(20) NOT NULL CHECK(decision IN ('approved','rejected','changes_requested')),
  comments TEXT NOT NULL, checklist JSONB NOT NULL DEFAULT '{}',
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_research_hypotheses_state ON research_hypotheses(state,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_experiments_hypothesis ON research_experiments(hypothesis_id,state);
CREATE INDEX IF NOT EXISTS idx_research_protocols_experiment ON research_protocols(experiment_id,version DESC);
CREATE INDEX IF NOT EXISTS idx_research_runs_experiment ON research_experiment_runs(experiment_id,run_number DESC);
CREATE INDEX IF NOT EXISTS idx_research_artifacts_run ON research_artifacts(run_id);
CREATE INDEX IF NOT EXISTS idx_research_audit_entity ON research_audit_events(entity_type,entity_id,occurred_at);
CREATE INDEX IF NOT EXISTS idx_research_reviews_entity ON research_reviews(entity_type,entity_id,created_at DESC);

CREATE OR REPLACE FUNCTION enforce_research_lifecycle() RETURNS TRIGGER AS $$
DECLARE allowed BOOLEAN := FALSE;
BEGIN
  IF TG_TABLE_NAME='research_hypotheses' THEN
    allowed := (OLD.state='draft' AND NEW.state IN ('approved','rejected')) OR
               (OLD.state='approved' AND NEW.state='retired') OR OLD.state=NEW.state;
  ELSIF TG_TABLE_NAME='research_experiments' THEN
    allowed := (OLD.state='draft' AND NEW.state IN ('approved','cancelled')) OR
               (OLD.state='approved' AND NEW.state IN ('running','cancelled')) OR
               (OLD.state='running' AND NEW.state IN ('completed','failed','cancelled')) OR OLD.state=NEW.state;
  ELSIF TG_TABLE_NAME='research_protocols' THEN
    allowed := (OLD.state='draft' AND NEW.state IN ('approved','superseded')) OR
               (OLD.state='approved' AND NEW.state='superseded') OR OLD.state=NEW.state;
  ELSE
    allowed := (OLD.state='queued' AND NEW.state IN ('running','cancelled')) OR
               (OLD.state='running' AND NEW.state IN ('succeeded','failed','cancelled')) OR OLD.state=NEW.state;
  END IF;
  IF NOT allowed THEN RAISE EXCEPTION 'Invalid % lifecycle transition % -> %',TG_TABLE_NAME,OLD.state,NEW.state; END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_research_hypothesis_lifecycle ON research_hypotheses;
CREATE TRIGGER trg_research_hypothesis_lifecycle BEFORE UPDATE OF state ON research_hypotheses FOR EACH ROW EXECUTE FUNCTION enforce_research_lifecycle();
DROP TRIGGER IF EXISTS trg_research_experiment_lifecycle ON research_experiments;
CREATE TRIGGER trg_research_experiment_lifecycle BEFORE UPDATE OF state ON research_experiments FOR EACH ROW EXECUTE FUNCTION enforce_research_lifecycle();
DROP TRIGGER IF EXISTS trg_research_protocol_lifecycle ON research_protocols;
CREATE TRIGGER trg_research_protocol_lifecycle BEFORE UPDATE OF state ON research_protocols FOR EACH ROW EXECUTE FUNCTION enforce_research_lifecycle();
DROP TRIGGER IF EXISTS trg_research_run_lifecycle ON research_experiment_runs;
CREATE TRIGGER trg_research_run_lifecycle BEFORE UPDATE OF state ON research_experiment_runs FOR EACH ROW EXECUTE FUNCTION enforce_research_lifecycle();

CREATE OR REPLACE FUNCTION prevent_research_audit_change() RETURNS TRIGGER AS $$ BEGIN
  RAISE EXCEPTION 'Research audit events are append-only';
END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_research_audit_append_only ON research_audit_events;
CREATE TRIGGER trg_research_audit_append_only BEFORE UPDATE OR DELETE ON research_audit_events FOR EACH ROW EXECUTE FUNCTION prevent_research_audit_change();
