-- 1001_platform_configuration.sql (generated)
-- Platform configuration table for key-value settings (M002)

CREATE TABLE IF NOT EXISTS platform_configurations (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  description TEXT,
  environment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);

-- Example initial settings
INSERT INTO platform_configurations (key, value, description, environment) VALUES
  ('feature_flags', '{}'::jsonb, 'Global feature flags', 'global')
ON CONFLICT (key) DO NOTHING;
