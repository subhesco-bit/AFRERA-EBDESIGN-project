BEGIN;

CREATE TABLE IF NOT EXISTS optimization_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id VARCHAR(120) NOT NULL,
  requested_backend VARCHAR(40) NOT NULL CHECK (requested_backend IN ('classical','quantum')),
  status VARCHAR(30) NOT NULL CHECK (status IN ('queued','running','succeeded','failed','unavailable','cancelled')),
  input JSONB NOT NULL,
  baseline_result JSONB,
  result JSONB,
  narrative JSONB,
  provenance JSONB NOT NULL DEFAULT '{}',
  error_message TEXT,
  include_narrative BOOLEAN NOT NULL DEFAULT FALSE,
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  tenant_id UUID,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_optimization_jobs_requester ON optimization_jobs(requested_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_optimization_jobs_tenant ON optimization_jobs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_optimization_jobs_status ON optimization_jobs(status) WHERE status IN ('queued','running');

CREATE TABLE IF NOT EXISTS optimization_job_events (
  id BIGSERIAL PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES optimization_jobs(id) ON DELETE CASCADE,
  event_type VARCHAR(40) NOT NULL,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_optimization_job_events_job ON optimization_job_events(job_id, created_at);

COMMIT;
