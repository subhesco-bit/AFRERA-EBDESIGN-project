-- Phases 19-21: AI self-healing, resilience/observability, master-data intelligence

CREATE TABLE IF NOT EXISTS ai_self_healing_incidents (
  id UUID PRIMARY KEY,
  correlation_id UUID NOT NULL,
  component TEXT NOT NULL,
  failure_class TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  fingerprint TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  diagnosis JSONB NOT NULL DEFAULT '{}'::jsonb,
  remediation JSONB NOT NULL DEFAULT '{}'::jsonb,
  approval_required BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'detected' CHECK (status IN ('detected','diagnosed','proposed','approved','remediating','resolved','escalated','blocked')),
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_self_healing_status ON ai_self_healing_incidents(status);
CREATE INDEX IF NOT EXISTS idx_ai_self_healing_fingerprint ON ai_self_healing_incidents(fingerprint);

CREATE TABLE IF NOT EXISTS platform_health_events (
  id UUID PRIMARY KEY,
  correlation_id UUID NOT NULL,
  component TEXT NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy','degraded','failed','recovered')),
  latency_ms INTEGER,
  error_rate NUMERIC(8,4),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_platform_health_component_time ON platform_health_events(component, observed_at DESC);

CREATE TABLE IF NOT EXISTS resilience_control_state (
  component TEXT PRIMARY KEY,
  state TEXT NOT NULL CHECK (state IN ('closed','open','half_open')),
  failure_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_failure_at TIMESTAMPTZ,
  last_recovery_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS master_data_quality_findings (
  id UUID PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  rule_code TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info','warning','error','critical')),
  finding JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_system TEXT,
  confidence NUMERIC(6,5),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','accepted','resolved','ignored')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_mdq_entity ON master_data_quality_findings(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_mdq_status ON master_data_quality_findings(status);

CREATE TABLE IF NOT EXISTS master_data_reconciliation_runs (
  id UUID PRIMARY KEY,
  correlation_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  source_count INTEGER NOT NULL DEFAULT 0,
  candidate_count INTEGER NOT NULL DEFAULT 0,
  matched_count INTEGER NOT NULL DEFAULT 0,
  conflict_count INTEGER NOT NULL DEFAULT 0,
  duplicate_count INTEGER NOT NULL DEFAULT 0,
  results JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('started','completed','failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_mdr_entity_time ON master_data_reconciliation_runs(entity_type, created_at DESC);
