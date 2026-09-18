-- M101: Module M101 Service

CREATE TABLE IF NOT EXISTS m101_module_m101_service (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_m101_user_id ON m101_module_m101_service(user_id);
CREATE INDEX idx_m101_status ON m101_module_m101_service(status);
