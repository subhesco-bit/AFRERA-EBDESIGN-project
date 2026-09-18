-- M63: Module M63 Service

CREATE TABLE IF NOT EXISTS m63_module_m63_service (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_m63_user_id ON m63_module_m63_service(user_id);
CREATE INDEX idx_m63_status ON m63_module_m63_service(status);
