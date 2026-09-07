-- Labour management: workers, attendance, and wage payments.
-- Deliberately independent of the inconsistent legacy farmers.id types.

CREATE TABLE IF NOT EXISTS labour_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  skill VARCHAR(100) NOT NULL DEFAULT 'General',
  wage_type VARCHAR(30) NOT NULL DEFAULT 'Daily',
  wage_rate NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (wage_rate >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS labour_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES labour_workers(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'half_day')),
  hours NUMERIC(6, 2) CHECK (hours IS NULL OR hours >= 0),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (worker_id, attendance_date)
);

CREATE TABLE IF NOT EXISTS labour_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES labour_workers(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  payment_type VARCHAR(30) NOT NULL DEFAULT 'wage',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_labour_attendance_worker_date ON labour_attendance(worker_id, attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_labour_payments_worker_date ON labour_payments(worker_id, payment_date DESC);