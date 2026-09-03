-- Durable module-to-module communication and operation audit.
CREATE TABLE IF NOT EXISTS module_events (
  id BIGSERIAL PRIMARY KEY,
  module_id VARCHAR(20) NOT NULL,
  operation VARCHAR(120) NOT NULL,
  event_type VARCHAR(30) NOT NULL CHECK (event_type IN ('started','completed','failed')),
  actor_user_id UUID,
  entity_id VARCHAR(160),
  correlation_id VARCHAR(160) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_code VARCHAR(80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_module_events_correlation ON module_events (correlation_id);
CREATE INDEX IF NOT EXISTS idx_module_events_module_created ON module_events (module_id, created_at DESC);
