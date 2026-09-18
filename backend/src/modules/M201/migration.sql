-- M201: Module M201 Service

CREATE TABLE IF NOT EXISTS m201_module_m201_service (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_m201_user_id ON m201_module_m201_service(user_id);
CREATE INDEX idx_m201_status ON m201_module_m201_service(status);
