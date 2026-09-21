-- M64: Module M64 Service

CREATE TABLE IF NOT EXISTS m64_module_m64_service (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_m64_user_id ON m64_module_m64_service(user_id);
CREATE INDEX idx_m64_status ON m64_module_m64_service(status);
