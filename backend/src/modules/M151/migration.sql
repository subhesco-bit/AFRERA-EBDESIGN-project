-- M151: Module M151 Service

CREATE TABLE IF NOT EXISTS m151_module_m151_service (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_m151_user_id ON m151_module_m151_service(user_id);
CREATE INDEX idx_m151_status ON m151_module_m151_service(status);
