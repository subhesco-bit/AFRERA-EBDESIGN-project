-- M102: Module M102 Service

CREATE TABLE IF NOT EXISTS m102_module_m102_service (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_m102_user_id ON m102_module_m102_service(user_id);
CREATE INDEX idx_m102_status ON m102_module_m102_service(status);
