-- Durable state for the server-management control plane.
-- Provider-specific infrastructure IDs and live telemetry remain outside this
-- contract; the service stores its verified control-plane payloads here.

CREATE TABLE IF NOT EXISTS server_management_servers (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS server_management_load_balancers (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS server_management_backup_schedules (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_server_management_servers_payload
  ON server_management_servers USING GIN (payload);
CREATE INDEX IF NOT EXISTS idx_server_management_load_balancers_payload
  ON server_management_load_balancers USING GIN (payload);
CREATE INDEX IF NOT EXISTS idx_server_management_backup_schedules_payload
  ON server_management_backup_schedules USING GIN (payload);
