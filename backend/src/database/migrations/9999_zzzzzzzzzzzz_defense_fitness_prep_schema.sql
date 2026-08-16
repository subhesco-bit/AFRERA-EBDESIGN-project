-- Defense/Police/Border-Security Recruitment Fitness Prep — Reference Schema
--
-- SCOPE, READ BEFORE EXTENDING: this is a SELF-PREP comparison tool for
-- aspirants training toward publicly published physical standards. It has
-- no connection to any actual recruitment/selection system — no such
-- connection exists for a private platform to plug into (see conversation
-- this table was built from). A user comparing their own wearable/self-test
-- data against these rows never transmits anything to any recruiting
-- authority; this stays entirely within AFRERA.
--
-- Every row is evidence-labelled like wellness_natural_practices
-- (062_wellness_natural_practices_schema.sql): a real source_url and
-- last_verified_date, because these standards are cycle-dependent and
-- change — several 2026 official pages explicitly warn "verify against the
-- current notification." Never insert a threshold without a source.

CREATE TABLE IF NOT EXISTS defense_fitness_standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    force_name VARCHAR(100) NOT NULL, -- e.g. 'Indian Army (Agniveer GD)', 'BSF Constable GD', 'Delhi Police Constable', 'UP Police Constable'
    category VARCHAR(50) NOT NULL,    -- 'army_agniveer_gd' | 'bsf_constable_gd' | 'delhi_police_constable' | 'up_police_constable'
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'any')),
    test_component VARCHAR(50) NOT NULL, -- 'run_1.6km' | 'run_4.8km' | 'run_2.4km' | 'run_800m' | 'height_cm' | 'chest_expanded_cm' | 'chest_expansion_cm'
    threshold_value NUMERIC(8,2) NOT NULL,
    threshold_type VARCHAR(20) NOT NULL CHECK (threshold_type IN ('max_time_seconds', 'min_value')),
    unit VARCHAR(20) NOT NULL,
    notes TEXT,
    source_url TEXT NOT NULL,
    last_verified_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_defense_fitness_standards_category ON defense_fitness_standards(category, gender);

-- ============================================================================
-- SEED DATA — real, cited, dated 2026-08-16. Standards change per
-- recruitment cycle; last_verified_date and source_url let a caller (or a
-- future maintainer) know exactly how stale a row might be.
-- ============================================================================

INSERT INTO defense_fitness_standards
    (force_name, category, gender, test_component, threshold_value, threshold_type, unit, notes, source_url, last_verified_date)
VALUES
-- Indian Army Agniveer GD — PFT: 1.6km run, max marks at 5:30, disqualified beyond 5:45
('Indian Army (Agniveer GD)', 'army_agniveer_gd', 'any', 'run_1.6km', 330, 'max_time_seconds', 'seconds',
 'Finishing within 5 min 30 sec earns maximum marks for the 1.6km run component of the PFT.',
 'https://testbook.com/indian-army-agniveer/physical-fitness-test', '2026-08-16'),
('Indian Army (Agniveer GD)', 'army_agniveer_gd', 'any', 'run_1.6km_disqualify', 345, 'max_time_seconds', 'seconds',
 'Candidates taking longer than 5 min 45 sec are generally disqualified from the running event. PFT also includes pull-ups, a 9-feet ditch jump, and a zig-zag balance test (qualifying, not scored here).',
 'https://testbook.com/indian-army-agniveer/physical-fitness-test', '2026-08-16'),

-- BSF Constable GD — PET: 1.6km male / 800m female. PST (height/chest/weight) is eliminatory, not separately scored here.
('BSF Constable GD', 'bsf_constable_gd', 'male', 'run_1.6km', NULL, 'max_time_seconds', 'seconds',
 'PET running distance for male candidates is 1.6km. Exact time threshold varies by recruitment cycle — check the official BSF notification for the current cutoff.',
 'https://rojgardekho.in/article/bsf-physical-test-2026', '2026-08-16'),
('BSF Constable GD', 'bsf_constable_gd', 'female', 'run_800m', NULL, 'max_time_seconds', 'seconds',
 'PET running distance for female candidates is 800m. Exact time threshold varies by recruitment cycle — check the official BSF notification for the current cutoff.',
 'https://rojgardekho.in/article/bsf-physical-test-2026', '2026-08-16'),

-- Delhi Police Constable — height and chest
('Delhi Police Constable', 'delhi_police_constable', 'male', 'height_cm', 170, 'min_value', 'cm',
 'Minimum height for general category male candidates. Reserved categories and hill-area candidates may get relaxation per official rules.',
 'https://devdefenceacademy.in/delhi-police-constable-physical-test/', '2026-08-16'),
('Delhi Police Constable', 'delhi_police_constable', 'female', 'height_cm', 157, 'min_value', 'cm',
 'Minimum height for general category female candidates.',
 'https://devdefenceacademy.in/delhi-police-constable-physical-test/', '2026-08-16'),
('Delhi Police Constable', 'delhi_police_constable', 'male', 'chest_expanded_cm', 85, 'min_value', 'cm',
 'Expanded chest measurement (general category male); unexpanded minimum is 81cm with a required 4cm minimum expansion. Chest test applies to male candidates only.',
 'https://devdefenceacademy.in/delhi-police-constable-physical-test/', '2026-08-16'),

-- UP Police Constable — running
('UP Police Constable', 'up_police_constable', 'male', 'run_4.8km', 1500, 'max_time_seconds', 'seconds',
 '4.8km within 25 minutes for male candidates.',
 'https://rojgarwarrior.com/up-police-constable-physical-eligibility/', '2026-08-16'),
('UP Police Constable', 'up_police_constable', 'female', 'run_2.4km', 840, 'max_time_seconds', 'seconds',
 '2.4km within 14 minutes for female candidates.',
 'https://rojgarwarrior.com/up-police-constable-physical-eligibility/', '2026-08-16');

CREATE TABLE IF NOT EXISTS defense_fitness_prep_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    test_component VARCHAR(50) NOT NULL,
    recorded_value NUMERIC(8,2) NOT NULL,
    source VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'wearable')),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_defense_fitness_attempts_user ON defense_fitness_prep_attempts(user_id, category, recorded_at DESC);
