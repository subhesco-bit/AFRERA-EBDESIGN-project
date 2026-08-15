-- ============================================================================
-- 071_animal_health_schema.sql   (2026-08-10)
--
-- WHY THIS EXISTS
-- M127 - Animal Health Management (Livestock domain) is a cross-cutting
-- module for health monitoring across all livestock types. This migration adds
-- proper domain-specific tables for health examinations, disease outbreaks,
-- quarantine management, and treatment records.
--
-- DOMAIN-SPECIFIC LOGIC
-- Animal health management differs from individual livestock modules:
-- - Cross-species health monitoring (applies to all livestock types)
-- - Disease outbreak tracking and containment
-- - Quarantine management for infected animals
-- - Treatment records with medications and dosages
-- - Health examination schedules and compliance
-- ============================================================================

CREATE TABLE IF NOT EXISTS animal_health_examinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_type VARCHAR(50) NOT NULL CHECK (animal_type IN ('dairy', 'poultry', 'goat', 'sheep', 'pig')),
  animal_id UUID NOT NULL,
  examination_date DATE NOT NULL,
  examination_type VARCHAR(50) NOT NULL CHECK (examination_type IN ('routine', 'pre-breeding', 'pre-sale', 'post-illness', 'quarantine')),
  health_status VARCHAR(30) NOT NULL CHECK (health_status IN ('healthy', 'under_observation', 'sick', 'critical', 'recovered')),
  body_temperature_c NUMERIC(4,2),
  heart_rate_bpm INTEGER,
  respiratory_rate_bpm INTEGER,
  findings TEXT,
  examiner_name VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_animal_health_animal ON animal_health_examinations(animal_type, animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_health_date ON animal_health_examinations(examination_date);
CREATE INDEX IF NOT EXISTS idx_animal_health_status ON animal_health_examinations(health_status);

CREATE TABLE IF NOT EXISTS animal_treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_type VARCHAR(50) NOT NULL CHECK (animal_type IN ('dairy', 'poultry', 'goat', 'sheep', 'pig')),
  animal_id UUID NOT NULL,
  treatment_date DATE NOT NULL,
  medication_name VARCHAR(100) NOT NULL,
  dosage VARCHAR(100),
  administration_route VARCHAR(20) CHECK (administration_route IN ('oral', 'injection', 'topical', 'intravenous')),
  prescribing_vet VARCHAR(100),
  diagnosis TEXT,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_animal_treatments_animal ON animal_treatments(animal_type, animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_treatments_date ON animal_treatments(treatment_date);

CREATE TABLE IF NOT EXISTS disease_outbreaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outbreak_name VARCHAR(100) NOT NULL,
  disease_name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  affected_animal_type VARCHAR(50) NOT NULL CHECK (affected_animal_type IN ('dairy', 'poultry', 'goat', 'sheep', 'pig', 'mixed')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  affected_count INTEGER CHECK (affected_count >= 0),
  deaths_count INTEGER CHECK (deaths_count >= 0),
  containment_measures TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'contained', 'resolved')),
  reported_by VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_disease_outbreaks_type ON disease_outbreaks(affected_animal_type);
CREATE INDEX IF NOT EXISTS idx_disease_outbreaks_status ON disease_outbreaks(status);
CREATE INDEX IF NOT EXISTS idx_disease_outbreaks_dates ON disease_outbreaks(start_date, end_date);

CREATE TABLE IF NOT EXISTS quarantine_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_type VARCHAR(50) NOT NULL CHECK (animal_type IN ('dairy', 'poultry', 'goat', 'sheep', 'pig')),
  animal_id UUID NOT NULL,
  quarantine_start_date DATE NOT NULL,
  quarantine_end_date DATE,
  reason VARCHAR(100) NOT NULL,
  quarantine_type VARCHAR(30) NOT NULL CHECK (quarantine_type IN ('disease_exposure', 'new_arrival', 'pre_sale', 'post_treatment')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'released', 'deceased')),
  location VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quarantine_animal ON quarantine_records(animal_type, animal_id);
CREATE INDEX IF NOT EXISTS idx_quarantine_status ON quarantine_records(status);
CREATE INDEX IF NOT EXISTS idx_quarantine_dates ON quarantine_records(quarantine_start_date, quarantine_end_date);
