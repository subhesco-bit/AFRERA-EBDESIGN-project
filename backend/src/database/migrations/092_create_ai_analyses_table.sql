-- Create AI Analyses Table
CREATE TABLE IF NOT EXISTS ai_analyses (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER REFERENCES farms(id) ON DELETE CASCADE,
  analysis_type VARCHAR(100) NOT NULL,
  result JSONB,
  confidence DECIMAL(3,2) DEFAULT 0.85,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_type ON ai_analyses(analysis_type);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_farm_id ON ai_analyses(farm_id);
