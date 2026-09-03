-- Durable ownership and audit boundary for AI proposals.
ALTER TABLE ai_proposals
  ADD COLUMN IF NOT EXISTS proposed_by UUID;

CREATE INDEX IF NOT EXISTS idx_ai_proposals_proposed_by
  ON ai_proposals (proposed_by, created_at DESC);
