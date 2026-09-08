-- Create AI Predictions Table
-- Stores all prediction model outputs and results

CREATE TABLE IF NOT EXISTS ai_predictions (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER REFERENCES farms(id) ON DELETE CASCADE,
  farmer_id INTEGER REFERENCES farmers(id) ON DELETE CASCADE,
  field_id INTEGER REFERENCES fields(id) ON DELETE CASCADE,
  crop_id INTEGER REFERENCES crops(id) ON DELETE CASCADE,
  planting_id INTEGER,
  equipment_id INTEGER,
  product_id INTEGER,
  model_type VARCHAR(100) NOT NULL,
  prediction JSONB,
  confidence DECIMAL(3,2) DEFAULT 0.85,
  outcome JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_predictions_model_type ON ai_predictions(model_type);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_farm_id ON ai_predictions(farm_id);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_farmer_id ON ai_predictions(farmer_id);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_created_at ON ai_predictions(created_at DESC);
