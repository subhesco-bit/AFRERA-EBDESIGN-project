-- Phase 5: Supply Chain Analytics Schema
CREATE TABLE supply_chain_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_supply_chain_analytics_created ON supply_chain_analytics(created_at);
