-- Create AI Predictions Table
CREATE TABLE IF NOT EXISTS ai_predictions (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER REFERENCES farms(id) ON DELETE CASCADE,
  farmer_id INTEGER REFERENCES farmers(id) ON DELETE CASCADE,
  model_type VARCHAR(100) NOT NULL,
  prediction JSONB,
  confidence DECIMAL(3,2) DEFAULT 0.85,
  outcome JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_predictions_model_type ON ai_predictions(model_type);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_farm_id ON ai_predictions(farm_id);
