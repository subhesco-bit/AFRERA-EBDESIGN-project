-- Phase 2: Loan Management Schema
CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(12,2) NOT NULL,
  purpose VARCHAR(255),
  tenure_months INT DEFAULT 12,
  interest_rate DECIMAL(5,2) DEFAULT 12,
  status VARCHAR(50) DEFAULT 'applied',
  application_date TIMESTAMP,
  approved_date TIMESTAMP,
  disbursed_date TIMESTAMP,
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loan_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES loans(id),
  status VARCHAR(50),
  created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loan_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loans(id),
  amount DECIMAL(12,2),
  status VARCHAR(50) DEFAULT 'pending',
  due_date DATE,
  late BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loans_farmer ON loans(farmer_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_payments_loan ON loan_payments(loan_id);
