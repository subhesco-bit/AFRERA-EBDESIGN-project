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
-- 2026-10-05 merge-collision:loans - `loans` is already created by 000_base_schema.sql
-- (sorts first), so the CREATE above is a no-op. Additive merge so this
-- file's indexes/FKs and its service's columns exist (nullable: rows
-- written through the other shape never populate them).
ALTER TABLE loans ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE loans ADD COLUMN IF NOT EXISTS farmer_id UUID;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS amount DECIMAL(12,2);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS purpose VARCHAR(255);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS tenure_months INT DEFAULT 12;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS interest_rate DECIMAL(5,2) DEFAULT 12;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'applied';
ALTER TABLE loans ADD COLUMN IF NOT EXISTS application_date TIMESTAMP;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS approved_date TIMESTAMP;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS disbursed_date TIMESTAMP;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
CREATE UNIQUE INDEX IF NOT EXISTS uq_loans_id_merge ON loans(id);

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
