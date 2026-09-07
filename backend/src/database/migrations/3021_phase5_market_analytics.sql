-- Phase 5: Market Analytics Schema
CREATE TABLE market_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID,
  analysis_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_market_analytics_product ON market_analytics(product_id);
