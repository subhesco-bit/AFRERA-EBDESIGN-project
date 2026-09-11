-- GDPR Compliance Tables
CREATE TABLE IF NOT EXISTS data_inventory (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  inventory_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS user_consents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  consent_data JSONB,
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS data_exports (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  export_data JSONB,
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS deletion_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_data_inventory_user ON data_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_user ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_data_exports_user ON data_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_user ON deletion_requests(user_id);
