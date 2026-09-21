-- Phase 16-18: AI governance, event orchestration and bounded autonomy
-- PostgreSQL

CREATE TABLE IF NOT EXISTS ai_governance_audit (
  id UUID PRIMARY KEY,
  correlation_id VARCHAR(120) NOT NULL,
  actor_id VARCHAR(120),
  actor_type VARCHAR(40) NOT NULL DEFAULT 'system',
  action VARCHAR(160) NOT NULL,
  domain VARCHAR(80) NOT NULL,
  risk_level VARCHAR(20) NOT NULL DEFAULT 'low',
  decision VARCHAR(30) NOT NULL,
  approval_required BOOLEAN NOT NULL DEFAULT FALSE,
  approval_id VARCHAR(120),
  policy_version VARCHAR(40) NOT NULL DEFAULT 'phase16-v1',
  input_hash VARCHAR(128),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_governance_audit_correlation ON ai_governance_audit(correlation_id);
CREATE INDEX IF NOT EXISTS idx_ai_governance_audit_created ON ai_governance_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_governance_audit_risk ON ai_governance_audit(risk_level);

CREATE TABLE IF NOT EXISTS ai_domain_events (
  id UUID PRIMARY KEY,
  event_id VARCHAR(120) NOT NULL UNIQUE,
  event_type VARCHAR(160) NOT NULL,
  aggregate_type VARCHAR(100) NOT NULL,
  aggregate_id VARCHAR(160) NOT NULL,
  correlation_id VARCHAR(120) NOT NULL,
  causation_id VARCHAR(120),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(30) NOT NULL DEFAULT 'published',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_ai_domain_events_correlation ON ai_domain_events(correlation_id);
CREATE INDEX IF NOT EXISTS idx_ai_domain_events_status ON ai_domain_events(status);

CREATE TABLE IF NOT EXISTS ai_autonomous_actions (
  id UUID PRIMARY KEY,
  action_id VARCHAR(120) NOT NULL UNIQUE,
  correlation_id VARCHAR(120) NOT NULL,
  requested_by VARCHAR(120),
  agent_name VARCHAR(120) NOT NULL,
  action_type VARCHAR(160) NOT NULL,
  risk_level VARCHAR(20) NOT NULL,
  resource_scope JSONB NOT NULL DEFAULT '{}'::jsonb,
  requested_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  policy_version VARCHAR(40) NOT NULL DEFAULT 'phase18-v1',
  max_execution_seconds INTEGER NOT NULL DEFAULT 30,
  max_retries INTEGER NOT NULL DEFAULT 1,
  approval_required BOOLEAN NOT NULL DEFAULT FALSE,
  approval_id VARCHAR(120),
  status VARCHAR(30) NOT NULL DEFAULT 'proposed',
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_ai_autonomous_actions_correlation ON ai_autonomous_actions(correlation_id);
CREATE INDEX IF NOT EXISTS idx_ai_autonomous_actions_status ON ai_autonomous_actions(status);
