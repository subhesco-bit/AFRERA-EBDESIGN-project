-- AI training lifecycle persistence
CREATE TABLE IF NOT EXISTS ai_training_runs (
  id SERIAL PRIMARY KEY,
  model_type VARCHAR(100) NOT NULL,
  features_count INTEGER,
  training_size INTEGER NOT NULL,
  previous_accuracy DECIMAL(5,2),
  new_accuracy DECIMAL(5,2),
  status VARCHAR(20) DEFAULT 'completed',
  duration_ms INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_training_runs_model ON ai_training_runs(model_type);
CREATE INDEX IF NOT EXISTS idx_training_runs_created ON ai_training_runs(created_at DESC);

CREATE TABLE IF NOT EXISTS ai_hyperparameter_tuning (
  id SERIAL PRIMARY KEY,
  model_type VARCHAR(100) NOT NULL,
  parameters JSONB,
  performance JSONB,
  improvement_percent DECIMAL(5,2),
  status VARCHAR(20) DEFAULT 'evaluated',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_hyperparam_model ON ai_hyperparameter_tuning(model_type);

CREATE TABLE IF NOT EXISTS ai_retraining_logs (
  id SERIAL PRIMARY KEY,
  model_type VARCHAR(100) NOT NULL,
  data_size INTEGER,
  previous_accuracy DECIMAL(5,2),
  new_accuracy DECIMAL(5,2),
  drift_detected BOOLEAN,
  status VARCHAR(20),
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_retraining_model ON ai_retraining_logs(model_type);
CREATE INDEX IF NOT EXISTS idx_retraining_created ON ai_retraining_logs(created_at DESC);
