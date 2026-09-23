-- ---------------------------------------------------------------------------
-- RECONCILIATION NOTE (added 2026-09-23)
--
-- One or more table names in this file are also defined by another migration
-- with a different column set. `CREATE TABLE IF NOT EXISTS` then does NOTHING
-- on a clean run, and this file's later INSERT / CREATE INDEX statements failed
-- on columns that were never added. Verified on a clean PostgreSQL 16 run of
-- the full migration set.
--
-- Per the project rule, a collision is reconciled and not resolved by dropping
-- one side. Each CREATE TABLE below is followed by ADD COLUMN IF NOT EXISTS for
-- its own columns: a no-op where this file really created the table, and the
-- missing columns where it did not.
--
-- NOT NULL, PRIMARY KEY, UNIQUE and REFERENCES are deliberately not carried
-- over -- the table may already hold rows from the other definition that cannot
-- satisfy them, and a referenced column's type often differs from what this
-- file declares. Where that hides a real type mismatch, it is a reconciliation
-- still owed, not a fix.
-- ---------------------------------------------------------------------------

-- HR Module Database Schema with AI Integration Support
-- Migration 3200: HR Module Tables

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  employee_id VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  -- CIRCULAR REFERENCE (resolved 2026-09-23): employees.department_id points
  -- at departments, and departments.manager_id points back at employees.
  -- Neither table can be created first with its foreign key inline, so this
  -- one is added by ALTER once both tables exist -- see below. The file
  -- previously failed here with `relation "departments" does not exist`.
  department_id INTEGER,
  department VARCHAR(100),
  role VARCHAR(100) NOT NULL,
  salary_level VARCHAR(50),
  salary DECIMAL(12, 2),
  hire_date DATE NOT NULL,
  employment_type VARCHAR(50) DEFAULT 'full_time', -- full_time, part_time, contract, intern
  skills JSONB DEFAULT '[]',
  experience INTEGER DEFAULT 0, -- years
  location VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, terminated, on_leave
  shift_preferences JSONB DEFAULT '{}',
  availability JSONB DEFAULT '{}',
  current_workload DECIMAL(5, 2) DEFAULT 0,
  ai_recommendations JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE employees ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employee_id VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS department_id INTEGER;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS role VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS salary_level VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS salary DECIMAL(12, 2);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS hire_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50) DEFAULT 'full_time';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS experience INTEGER DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS location VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS shift_preferences JSONB DEFAULT '{}';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS availability JSONB DEFAULT '{}';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS current_workload DECIMAL(5, 2) DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ai_recommendations JSONB DEFAULT '{}';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  department_name VARCHAR(100) UNIQUE NOT NULL,
  department_code VARCHAR(20) UNIQUE NOT NULL,
  manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  description TEXT,
  min_staff_per_shift INTEGER DEFAULT 1,
  max_staff_per_shift INTEGER DEFAULT 10,
  skill_requirements JSONB DEFAULT '[]',
  peak_hours JSONB DEFAULT '{}',
  labor_constraints JSONB DEFAULT '{}',
  budget DECIMAL(15, 2),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE departments ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS department_name VARCHAR(100);
ALTER TABLE departments ADD COLUMN IF NOT EXISTS department_code VARCHAR(20);
ALTER TABLE departments ADD COLUMN IF NOT EXISTS manager_id INTEGER;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS min_staff_per_shift INTEGER DEFAULT 1;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS max_staff_per_shift INTEGER DEFAULT 10;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS skill_requirements JSONB DEFAULT '[]';
ALTER TABLE departments ADD COLUMN IF NOT EXISTS peak_hours JSONB DEFAULT '{}';
ALTER TABLE departments ADD COLUMN IF NOT EXISTS labor_constraints JSONB DEFAULT '{}';
ALTER TABLE departments ADD COLUMN IF NOT EXISTS budget DECIMAL(15, 2);
ALTER TABLE departments ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE departments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- The employees -> departments half of the circular reference, added now that
-- both tables exist. Guarded so a re-run does not fail on the existing
-- constraint.
DO $$ BEGIN
  ALTER TABLE employees
    ADD CONSTRAINT employees_department_id_fkey
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Performance reviews table
CREATE TABLE IF NOT EXISTS performance_reviews (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  reviewer_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,
  performance_score DECIMAL(3, 2) CHECK (performance_score BETWEEN 1 AND 5),
  strengths TEXT,
  areas_for_improvement TEXT,
  goals JSONB DEFAULT '[]',
  comments TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, archived
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS employee_id INTEGER;
ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS reviewer_id INTEGER;
ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS review_period_start DATE;
ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS review_period_end DATE;
ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS performance_score DECIMAL(3, 2) CHECK (performance_score BETWEEN 1 AND 5);
ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS strengths TEXT;
ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS areas_for_improvement TEXT;
ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS goals JSONB DEFAULT '[]';
ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS comments TEXT;
ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- Leave requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  leave_type VARCHAR(50) NOT NULL, -- sick, vacation, personal, maternity, paternity, etc.
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days DECIMAL(5, 2) NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, cancelled
  approved_by INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS employee_id INTEGER;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS leave_type VARCHAR(50);
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS total_days DECIMAL(5, 2);
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS approved_by INTEGER;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- Training programs table
CREATE TABLE IF NOT EXISTS training_programs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  skills_taught JSONB DEFAULT '[]',
  duration INTEGER, -- in hours
  difficulty_level VARCHAR(20), -- beginner, intermediate, advanced
  instructor VARCHAR(100),
  cost DECIMAL(10, 2),
  max_participants INTEGER,
  success_rate DECIMAL(5, 2),
  rating DECIMAL(3, 2) CHECK (rating BETWEEN 1 AND 5),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS title VARCHAR(200);
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS skills_taught JSONB DEFAULT '[]';
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS duration INTEGER;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(20);
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS instructor VARCHAR(100);
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS cost DECIMAL(10, 2);
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS max_participants INTEGER;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS success_rate DECIMAL(5, 2);
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2) CHECK (rating BETWEEN 1 AND 5);
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- Training records table
CREATE TABLE IF NOT EXISTS training_records (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  training_program_id INTEGER REFERENCES training_programs(id) ON DELETE CASCADE,
  enrollment_date DATE NOT NULL,
  completion_date DATE,
  status VARCHAR(20) DEFAULT 'enrolled', -- enrolled, in_progress, completed, dropped
  score DECIMAL(5, 2),
  certificate_issued BOOLEAN DEFAULT FALSE,
  feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, training_program_id)
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE training_records ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE training_records ADD COLUMN IF NOT EXISTS employee_id INTEGER;
ALTER TABLE training_records ADD COLUMN IF NOT EXISTS training_program_id INTEGER;
ALTER TABLE training_records ADD COLUMN IF NOT EXISTS enrollment_date DATE;
ALTER TABLE training_records ADD COLUMN IF NOT EXISTS completion_date DATE;
ALTER TABLE training_records ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'enrolled';
ALTER TABLE training_records ADD COLUMN IF NOT EXISTS score DECIMAL(5, 2);
ALTER TABLE training_records ADD COLUMN IF NOT EXISTS certificate_issued BOOLEAN DEFAULT FALSE;
ALTER TABLE training_records ADD COLUMN IF NOT EXISTS feedback TEXT;
ALTER TABLE training_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE training_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- Promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  previous_role VARCHAR(100),
  new_role VARCHAR(100) NOT NULL,
  previous_salary DECIMAL(12, 2),
  new_salary DECIMAL(12, 2),
  promotion_date DATE NOT NULL,
  reason TEXT,
  approved_by INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS employee_id INTEGER;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS previous_role VARCHAR(100);
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS new_role VARCHAR(100);
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS previous_salary DECIMAL(12, 2);
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS new_salary DECIMAL(12, 2);
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS promotion_date DATE;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS approved_by INTEGER;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- Employee feedback table
CREATE TABLE IF NOT EXISTS employee_feedback (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  feedback_type VARCHAR(50), -- performance, culture, management, benefits, etc.
  feedback_text TEXT NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  category VARCHAR(100),
  is_anonymous BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'submitted',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE employee_feedback ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE employee_feedback ADD COLUMN IF NOT EXISTS employee_id INTEGER;
ALTER TABLE employee_feedback ADD COLUMN IF NOT EXISTS feedback_type VARCHAR(50);
ALTER TABLE employee_feedback ADD COLUMN IF NOT EXISTS feedback_text TEXT;
ALTER TABLE employee_feedback ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating BETWEEN 1 AND 5);
ALTER TABLE employee_feedback ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE employee_feedback ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;
ALTER TABLE employee_feedback ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'submitted';
ALTER TABLE employee_feedback ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE employee_feedback ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- Timesheets table
CREATE TABLE IF NOT EXISTS timesheets (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  timesheet_period VARCHAR(20) NOT NULL, -- e.g., "2024-01", "week-2024-W01"
  status VARCHAR(20) DEFAULT 'draft', -- draft, submitted, approved, rejected
  total_hours DECIMAL(6, 2) DEFAULT 0,
  submitted_at TIMESTAMP,
  approved_by INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS employee_id INTEGER;
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS timesheet_period VARCHAR(20);
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft';
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS total_hours DECIMAL(6, 2) DEFAULT 0;
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS approved_by INTEGER;
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- Timesheet entries table
CREATE TABLE IF NOT EXISTS timesheet_entries (
  id SERIAL PRIMARY KEY,
  timesheet_id INTEGER REFERENCES timesheets(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  project_code VARCHAR(50),
  task_description TEXT,
  hours DECIMAL(5, 2) NOT NULL CHECK (hours > 0),
  is_billable BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS timesheet_id INTEGER;
ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS project_code VARCHAR(50);
ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS task_description TEXT;
ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS hours DECIMAL(5, 2) CHECK (hours > 0);
ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS is_billable BOOLEAN DEFAULT FALSE;
ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- HR predictions table (for storing AI predictions)
CREATE TABLE IF NOT EXISTS hr_predictions (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  prediction_type VARCHAR(50) NOT NULL, -- attrition_risk, performance_forecast, etc.
  prediction_data JSONB NOT NULL,
  confidence DECIMAL(5, 2) CHECK (confidence BETWEEN 0 AND 1),
  prediction_date DATE NOT NULL,
  actual_outcome JSONB,
  outcome_recorded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, prediction_type, prediction_date)
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE hr_predictions ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE hr_predictions ADD COLUMN IF NOT EXISTS employee_id INTEGER;
ALTER TABLE hr_predictions ADD COLUMN IF NOT EXISTS prediction_type VARCHAR(50);
ALTER TABLE hr_predictions ADD COLUMN IF NOT EXISTS prediction_data JSONB;
ALTER TABLE hr_predictions ADD COLUMN IF NOT EXISTS confidence DECIMAL(5, 2) CHECK (confidence BETWEEN 0 AND 1);
ALTER TABLE hr_predictions ADD COLUMN IF NOT EXISTS prediction_date DATE;
ALTER TABLE hr_predictions ADD COLUMN IF NOT EXISTS actual_outcome JSONB;
ALTER TABLE hr_predictions ADD COLUMN IF NOT EXISTS outcome_recorded_at TIMESTAMP;
ALTER TABLE hr_predictions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE hr_predictions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- HR sentiment analysis table
CREATE TABLE IF NOT EXISTS hr_sentiment_analysis (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  sentiment_score DECIMAL(5, 2) CHECK (sentiment_score BETWEEN -1 AND 1),
  sentiment_label VARCHAR(20), -- positive, neutral, negative
  themes JSONB DEFAULT '[]',
  trend_data JSONB DEFAULT '{}',
  analysis_period VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE hr_sentiment_analysis ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE hr_sentiment_analysis ADD COLUMN IF NOT EXISTS employee_id INTEGER;
ALTER TABLE hr_sentiment_analysis ADD COLUMN IF NOT EXISTS sentiment_score DECIMAL(5, 2) CHECK (sentiment_score BETWEEN -1 AND 1);
ALTER TABLE hr_sentiment_analysis ADD COLUMN IF NOT EXISTS sentiment_label VARCHAR(20);
ALTER TABLE hr_sentiment_analysis ADD COLUMN IF NOT EXISTS themes JSONB DEFAULT '[]';
ALTER TABLE hr_sentiment_analysis ADD COLUMN IF NOT EXISTS trend_data JSONB DEFAULT '{}';
ALTER TABLE hr_sentiment_analysis ADD COLUMN IF NOT EXISTS analysis_period VARCHAR(50);
ALTER TABLE hr_sentiment_analysis ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE hr_sentiment_analysis ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- Optimized schedules table
CREATE TABLE IF NOT EXISTS optimized_schedules (
  id SERIAL PRIMARY KEY,
  department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  schedule_data JSONB NOT NULL,
  optimization_metrics JSONB DEFAULT '{}',
  is_applied BOOLEAN DEFAULT FALSE,
  applied_at TIMESTAMP,
  created_by INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE optimized_schedules ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE optimized_schedules ADD COLUMN IF NOT EXISTS department_id INTEGER;
ALTER TABLE optimized_schedules ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE optimized_schedules ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE optimized_schedules ADD COLUMN IF NOT EXISTS schedule_data JSONB;
ALTER TABLE optimized_schedules ADD COLUMN IF NOT EXISTS optimization_metrics JSONB DEFAULT '{}';
ALTER TABLE optimized_schedules ADD COLUMN IF NOT EXISTS is_applied BOOLEAN DEFAULT FALSE;
ALTER TABLE optimized_schedules ADD COLUMN IF NOT EXISTS applied_at TIMESTAMP;
ALTER TABLE optimized_schedules ADD COLUMN IF NOT EXISTS created_by INTEGER;
ALTER TABLE optimized_schedules ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_employee_id ON performance_reviews(employee_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_period ON performance_reviews(review_period_start, review_period_end);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_training_records_employee_id ON training_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_training_records_program_id ON training_records(training_program_id);
CREATE INDEX IF NOT EXISTS idx_promotions_employee_id ON promotions(employee_id);
CREATE INDEX IF NOT EXISTS idx_promotions_date ON promotions(promotion_date);
CREATE INDEX IF NOT EXISTS idx_employee_feedback_employee_id ON employee_feedback(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_feedback_type ON employee_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_timesheets_employee_id ON timesheets(employee_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_period ON timesheets(timesheet_period);
CREATE INDEX IF NOT EXISTS idx_timesheet_entries_timesheet_id ON timesheet_entries(timesheet_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_entries_date ON timesheet_entries(date);
CREATE INDEX IF NOT EXISTS idx_hr_predictions_employee_id ON hr_predictions(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_predictions_type ON hr_predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_hr_predictions_date ON hr_predictions(prediction_date);
CREATE INDEX IF NOT EXISTS idx_hr_sentiment_employee_id ON hr_sentiment_analysis(employee_id);
CREATE INDEX IF NOT EXISTS idx_optimized_schedules_department ON optimized_schedules(department_id);
CREATE INDEX IF NOT EXISTS idx_optimized_schedules_dates ON optimized_schedules(start_date, end_date);

-- Insert default departments
INSERT INTO departments (department_name, department_code, description, min_staff_per_shift, max_staff_per_shift) VALUES
('Operations', 'OPS', 'Core operations and field activities', 2, 8),
('Finance', 'FIN', 'Financial management and accounting', 1, 4),
('Human Resources', 'HR', 'HR and personnel management', 1, 3),
('Technology', 'TECH', 'IT and technical support', 1, 5),
('Sales & Marketing', 'SALES', 'Sales and marketing activities', 1, 6),
('Logistics', 'LOG', 'Supply chain and logistics', 2, 10)
ON CONFLICT (department_code) DO NOTHING;

-- Insert sample training programs
INSERT INTO training_programs (title, description, category, skills_taught, duration, difficulty_level, success_rate, rating) VALUES
('Leadership Fundamentals', 'Basic leadership and management skills', 'leadership', '["team_management", "communication", "decision_making"]', 40, 'beginner', 0.85, 4.2),
('Advanced Data Analysis', 'Advanced data analysis techniques', 'technical', '["data_analysis", "statistics", "visualization"]', 60, 'advanced', 0.78, 4.5),
('Communication Skills', 'Effective business communication', 'soft_skills', '["verbal_communication", "written_communication", "presentation"]', 24, 'intermediate', 0.92, 4.0),
('Project Management', 'Project management methodologies', 'management', '["planning", "execution", "monitoring", "agile"]', 50, 'intermediate', 0.88, 4.3),
('Financial Literacy', 'Basic financial concepts and budgeting', 'finance', '["budgeting", "financial_analysis", "reporting"]', 30, 'beginner', 0.90, 4.1)
ON CONFLICT DO NOTHING;
