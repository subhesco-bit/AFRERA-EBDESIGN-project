-- M301: Module M301 Service

CREATE TABLE IF NOT EXISTS m301_module_m301_service (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_m301_user_id ON m301_module_m301_service(user_id);
CREATE INDEX idx_m301_status ON m301_module_m301_service(status);
