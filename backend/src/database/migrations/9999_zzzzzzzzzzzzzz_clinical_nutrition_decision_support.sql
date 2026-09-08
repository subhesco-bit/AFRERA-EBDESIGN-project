-- Clinical nutrition decision support audit store v1.0.0
-- Deterministic screening is persisted separately from any Claude draft.
CREATE TABLE IF NOT EXISTS clinical_nutrition_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    input_context JSONB NOT NULL,
    deterministic_assessment JSONB NOT NULL,
    claude_draft JSONB,
    assessment_hash CHAR(64) NOT NULL UNIQUE,
    status VARCHAR(40) NOT NULL CHECK (status IN ('urgent_escalation', 'needs_clinician_review', 'clinician_approved')),
    clinician_id UUID,
    clinician_reviewed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clinical_nutrition_assessments_user
    ON clinical_nutrition_assessments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_nutrition_assessments_status
    ON clinical_nutrition_assessments(status, created_at DESC);
