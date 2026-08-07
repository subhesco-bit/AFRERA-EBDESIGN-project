-- 1002_system_administration.sql (generated)
-- System administration tables for logs/audit and admin settings (M006)

CREATE TABLE IF NOT EXISTS admin_settings (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  value JSONB,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Example admin setting
INSERT INTO admin_settings (name, value, description) VALUES
  ('maintenance_mode', 'false'::jsonb, 'Toggle platform maintenance mode')
ON CONFLICT (name) DO NOTHING;
