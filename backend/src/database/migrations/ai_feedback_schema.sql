-- AI Feedback Schema for Learning Loop
-- Enables AI to learn from user feedback and improve responses

CREATE TABLE IF NOT EXISTS ai_feedback (
  id VARCHAR(255) PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  ai_response_id VARCHAR(255) NOT NULL,
  feedback_type VARCHAR(50) NOT NULL, -- 'helpful', 'not_helpful', 'needs_improvement', 'inaccurate'
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_text TEXT,
  context_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_session_id ON ai_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user_id ON ai_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_type ON ai_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_created_at ON ai_feedback(created_at);

CREATE TABLE IF NOT EXISTS ai_learning_metrics (
  id VARCHAR(255) PRIMARY KEY,
  metric_type VARCHAR(100) NOT NULL,
  metric_value DECIMAL(10,2),
  metric_count INTEGER DEFAULT 1,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS ai_response_improvements (
  id VARCHAR(255) PRIMARY KEY,
  original_response_id VARCHAR(255) NOT NULL,
  improvement_type VARCHAR(100) NOT NULL,
  original_content TEXT,
  improved_content TEXT,
  improvement_confidence DECIMAL(5,2),
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  effectiveness_score DECIMAL(5,2)
);

-- Comment for AI feedback tracking
COMMENT ON TABLE ai_feedback IS 'Tracks user feedback on AI responses for continuous learning';
COMMENT ON TABLE ai_learning_metrics IS 'Stores aggregated learning metrics for AI performance tracking';
COMMENT ON TABLE ai_response_improvements IS 'Records improvements made to AI responses based on feedback';