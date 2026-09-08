-- Versioned veterinary/clinical coding reference catalog.
-- This is lookup-only: no autonomous diagnosis or code assignment.
CREATE TABLE IF NOT EXISTS medical_coding_reference (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    standard VARCHAR(80) NOT NULL,
    standard_version VARCHAR(40) NOT NULL,
    domain VARCHAR(50) NOT NULL CHECK (domain IN ('veterinary_diagnosis', 'laboratory', 'pharmaceutical', 'vaccine', 'procedure', 'pathology')),
    code VARCHAR(80) NOT NULL,
    description TEXT NOT NULL,
    source_reference TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (standard, standard_version, domain, code)
);

CREATE INDEX IF NOT EXISTS idx_medical_coding_reference_lookup
    ON medical_coding_reference(standard, domain, code);
