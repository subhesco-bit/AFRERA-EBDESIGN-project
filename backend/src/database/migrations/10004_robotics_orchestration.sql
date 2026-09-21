-- Canonical robotics and humanoid orchestration control plane.
-- Physical commands are permitted only after certification, telemetry interlocks,
-- mission approval and RBAC checks in the application service.

CREATE TABLE IF NOT EXISTS robotics_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  external_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  device_type VARCHAR(50) NOT NULL CHECK (device_type IN
    ('humanoid','field_robot','warehouse_robot','autonomous_tractor','drone','simulator')),
  adapter VARCHAR(80) NOT NULL,
  capabilities JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(capabilities) = 'array'),
  safety_profile JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(safety_profile) = 'object'),
  certification_status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (certification_status IN ('pending','certified','rejected','expired','revoked')),
  certification_notes TEXT,
  certified_by UUID REFERENCES users(id),
  certified_at TIMESTAMPTZ,
  operational_status VARCHAR(30) NOT NULL DEFAULT 'offline' CHECK (operational_status IN ('offline','online','busy','maintenance','fault','emergency_stopped')),
  emergency_stop_active BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ,
  last_telemetry JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_safety_inspection TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, external_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_robotics_device_global_external_id
  ON robotics_devices(external_id) WHERE organization_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_robotics_devices_status ON robotics_devices(operational_status, certification_status);

CREATE TABLE IF NOT EXISTS robotics_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES robotics_devices(id),
  organization_id UUID,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  hazard_level VARCHAR(20) NOT NULL CHECK (hazard_level IN ('low','medium','high','critical')),
  requires_human_approval BOOLEAN NOT NULL DEFAULT TRUE,
  steps JSONB NOT NULL CHECK (jsonb_typeof(steps) = 'array' AND jsonb_array_length(steps) > 0),
  constraints JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(constraints) = 'object'),
  status VARCHAR(30) NOT NULL CHECK (status IN ('draft','pending_approval','approved','running','paused','completed','aborted','cancelled','rejected')),
  created_by UUID NOT NULL REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  adapter_receipt JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completion_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT robotics_two_person_approval CHECK
    (approved_by IS NULL OR NOT requires_human_approval OR created_by <> approved_by),
  CONSTRAINT robotics_approval_evidence CHECK
    (status NOT IN ('approved','running','paused','completed') OR (approved_by IS NOT NULL AND approved_at IS NOT NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_robotics_one_active_mission
  ON robotics_missions(device_id) WHERE status IN ('approved','running','paused');
CREATE INDEX IF NOT EXISTS idx_robotics_missions_org_status ON robotics_missions(organization_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS robotics_telemetry (
  id BIGSERIAL PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES robotics_devices(id),
  mission_id UUID REFERENCES robotics_missions(id),
  event_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (severity IN ('debug','info','warning','critical')),
  data JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(data) = 'object'),
  occurred_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  received_by UUID REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_robotics_telemetry_device_time ON robotics_telemetry(device_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_robotics_telemetry_critical ON robotics_telemetry(severity, occurred_at DESC) WHERE severity IN ('warning','critical');

CREATE TABLE IF NOT EXISTS robotics_audit_events (
  id BIGSERIAL PRIMARY KEY,
  aggregate_type VARCHAR(50) NOT NULL,
  aggregate_id UUID NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  actor_id UUID REFERENCES users(id),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_robotics_audit_aggregate ON robotics_audit_events(aggregate_type, aggregate_id, created_at);

CREATE OR REPLACE FUNCTION prevent_robotics_audit_mutation() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'robotics audit events are append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_robotics_audit_append_only ON robotics_audit_events;
CREATE TRIGGER trg_robotics_audit_append_only
BEFORE UPDATE OR DELETE ON robotics_audit_events
FOR EACH ROW EXECUTE FUNCTION prevent_robotics_audit_mutation();
