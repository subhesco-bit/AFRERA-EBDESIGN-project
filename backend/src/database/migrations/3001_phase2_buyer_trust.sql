-- Phase 2: Buyer Trust Schema
CREATE TABLE buyer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(id),
  total_orders INT DEFAULT 0,
  completed_orders INT DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  disputes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE buyer_trust_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(id),
  trust_score INT,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fraud_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_buyer_profiles_buyer ON buyer_profiles(buyer_id);
CREATE INDEX idx_trust_history_buyer ON buyer_trust_history(buyer_id);
CREATE INDEX idx_fraud_reports_buyer ON fraud_reports(buyer_id);
