-- M65: Module M65 Service

CREATE TABLE IF NOT EXISTS m65_module_m65_service (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_m65_user_id ON m65_module_m65_service(user_id);
CREATE INDEX idx_m65_status ON m65_module_m65_service(status);
