CREATE TABLE IF NOT EXISTS ai_response_feedback (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT,
  session_id TEXT,
  request_id TEXT,
  feedback_type VARCHAR(50) NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_response_feedback_type
  ON ai_response_feedback (feedback_type);

CREATE INDEX IF NOT EXISTS idx_ai_response_feedback_created_at
  ON ai_response_feedback (created_at);
