BEGIN;

CREATE TABLE IF NOT EXISTS ai_intelligence_runs (
  id BIGSERIAL PRIMARY KEY,
  domain TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  objective TEXT NOT NULL,
  input_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence NUMERIC(5,4) CHECK (confidence >= 0 AND confidence <= 1),
  model_provider TEXT,
  model_name TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('queued','running','completed','failed')),
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_intelligence_entity ON ai_intelligence_runs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_intelligence_domain ON ai_intelligence_runs(domain, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_agent_runs (
  id TEXT PRIMARY KEY,
  agent_name TEXT NOT NULL,
  objective TEXT NOT NULL,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  plan JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','awaiting_approval','approved','running','completed','failed','cancelled')),
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low','medium','high','critical')),
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  error TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_agent_runs_status ON ai_agent_runs(status, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_agent_steps (
  id BIGSERIAL PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES ai_agent_runs(id) ON DELETE CASCADE,
  step_no INTEGER NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','running','completed','failed','skipped')),
  output JSONB NOT NULL DEFAULT '{}'::jsonb,
  error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(run_id, step_no)
);
CREATE INDEX IF NOT EXISTS idx_ai_agent_steps_run ON ai_agent_steps(run_id, step_no);

CREATE TABLE IF NOT EXISTS ai_decision_controls (
  id BIGSERIAL PRIMARY KEY,
  run_id TEXT REFERENCES ai_agent_runs(id) ON DELETE CASCADE,
  decision_type TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low','medium','high','critical')),
  recommendation JSONB NOT NULL,
  rationale JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','approved','rejected','executed','expired')),
  proposed_by TEXT,
  decided_by TEXT,
  decided_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_decision_controls_status ON ai_decision_controls(status, created_at DESC);

COMMIT;
