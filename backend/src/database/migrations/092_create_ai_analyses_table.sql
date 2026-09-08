-- Create AI Analyses Table
-- Stores comprehensive analysis model outputs

CREATE TABLE IF NOT EXISTS ai_analyses (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER REFERENCES farms(id) ON DELETE CASCADE,
  farmer_id INTEGER REFERENCES farmers(id) ON DELETE CASCADE,
  field_id INTEGER REFERENCES fields(id) ON DELETE CASCADE,
  crop_id INTEGER REFERENCES crops(id) ON DELETE CASCADE,
  analysis_type VARCHAR(100) NOT NULL,
  result JSONB,
  confidence DECIMAL(3,2) DEFAULT 0.85,
  recommendations JSONB,
  severity VARCHAR(20),
  action_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_type ON ai_analyses(analysis_type);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_farm_id ON ai_analyses(farm_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_field_id ON ai_analyses(field_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_action_required ON ai_analyses(action_required);
