-- Create AI Optimizations Table
-- Stores optimization engine results and recommendations

CREATE TABLE IF NOT EXISTS ai_optimizations (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER REFERENCES farms(id) ON DELETE CASCADE,
  farmer_id INTEGER REFERENCES farmers(id) ON DELETE CASCADE,
  optimization_type VARCHAR(100) NOT NULL,
  result JSONB,
  savings_percent DECIMAL(5,2),
  previous_value DECIMAL(10,2),
  optimized_value DECIMAL(10,2),
  implemented BOOLEAN DEFAULT FALSE,
  implementation_date TIMESTAMP,
  actual_savings DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_optimizations_type ON ai_optimizations(optimization_type);
CREATE INDEX IF NOT EXISTS idx_ai_optimizations_farm_id ON ai_optimizations(farm_id);
CREATE INDEX IF NOT EXISTS idx_ai_optimizations_implemented ON ai_optimizations(implemented);
