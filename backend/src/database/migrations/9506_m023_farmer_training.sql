-- Folded from backend/src/modules/M023/model.sql (AUDIT_DB.md Finding 11/13 remediation)
-- Farmer Training Schema (M023) / -- Comprehensive farmer training program management with AI-powered course recommendations
-- Generated 2026-08-30 — DB linkage fix, see .ai/tasks/ACTIVE.md

CREATE TABLE IF NOT EXISTS training_sessions (
    session_id VARCHAR(50) PRIMARY KEY,
    program_id VARCHAR(50) NOT NULL,
    session_name VARCHAR(200),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    location VARCHAR(200),
    location_type VARCHAR(20),
    district VARCHAR(50),
    state VARCHAR(50),
    instructor_id VARCHAR(50),
    schedule JSONB,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'scheduled',
    registration_deadline DATE,
    materials_provided JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS farmer_enrollments (
    enrollment_id VARCHAR(50) PRIMARY KEY,
    session_id VARCHAR(50) NOT NULL REFERENCES training_sessions(session_id),
    farmer_id VARCHAR(50) NOT NULL,
    enrollment_date DATE NOT NULL,
    enrollment_status VARCHAR(20) DEFAULT 'enrolled',
    attendance_percentage DECIMAL(5,2),
    completion_percentage DECIMAL(5,2),
    assessment_score DECIMAL(5,2),
    certificate_issued BOOLEAN DEFAULT false,
    certificate_id VARCHAR(50),
    certificate_issue_date DATE,
    feedback JSONB,
    ai_learning_path JSONB,
    progress_tracking JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS training_assessments (
    assessment_id VARCHAR(50) PRIMARY KEY,
    program_id VARCHAR(50) NOT NULL,
    assessment_name VARCHAR(200),
    assessment_type VARCHAR(50),
    questions JSONB,
    passing_score DECIMAL(5,2),
    duration_minutes INTEGER,
    total_marks INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assessment_results (
    result_id VARCHAR(50) PRIMARY KEY,
    assessment_id VARCHAR(50) NOT NULL REFERENCES training_assessments(assessment_id),
    enrollment_id VARCHAR(50) NOT NULL REFERENCES farmer_enrollments(enrollment_id),
    farmer_id VARCHAR(50) NOT NULL,
    score DECIMAL(5,2),
    total_score DECIMAL(5,2),
    percentage DECIMAL(5,2),
    passed BOOLEAN,
    answers JSONB,
    time_taken_minutes INTEGER,
    attempted_at TIMESTAMP,
    ai_performance_analysis JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS training_materials (
    material_id VARCHAR(50) PRIMARY KEY,
    program_id VARCHAR(50) NOT NULL,
    material_type VARCHAR(50),
    title VARCHAR(200),
    description TEXT,
    file_url VARCHAR(500),
    file_size_bytes BIGINT,
    file_format VARCHAR(20),
    language VARCHAR(50),
    order_index INTEGER,
    is_mandatory BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS training_attendance (
    attendance_id VARCHAR(50) PRIMARY KEY,
    session_id VARCHAR(50) NOT NULL REFERENCES training_sessions(session_id),
    enrollment_id VARCHAR(50) NOT NULL REFERENCES farmer_enrollments(enrollment_id),
    farmer_id VARCHAR(50) NOT NULL,
    attendance_date DATE NOT NULL,
    status VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_training_sessions_program ON training_sessions(program_id);

CREATE INDEX IF NOT EXISTS idx_training_sessions_dates ON training_sessions(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_training_sessions_status ON training_sessions(status);

CREATE INDEX IF NOT EXISTS idx_farmer_enrollments_session ON farmer_enrollments(session_id);

CREATE INDEX IF NOT EXISTS idx_farmer_enrollments_farmer ON farmer_enrollments(farmer_id);

CREATE INDEX IF NOT EXISTS idx_farmer_enrollments_status ON farmer_enrollments(enrollment_status);

CREATE INDEX IF NOT EXISTS idx_assessment_results_assessment ON assessment_results(assessment_id);

CREATE INDEX IF NOT EXISTS idx_assessment_results_farmer ON assessment_results(farmer_id);

CREATE INDEX IF NOT EXISTS idx_training_attendance_session ON training_attendance(session_id);

CREATE INDEX IF NOT EXISTS idx_training_attendance_farmer ON training_attendance(farmer_id);
