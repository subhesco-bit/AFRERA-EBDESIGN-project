CREATE TABLE IF NOT EXISTS m001_m050_ai_native_evaluations (
  id UUID PRIMARY KEY,
  module_id VARCHAR(4) NOT NULL CHECK (module_id ~ '^M0[0-4][0-9]$' OR module_id = 'M050'),
  actor_id TEXT,
  input_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  evaluation JSONB NOT NULL,
  governance_state JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_m001_m050_ai_eval_module_created ON m001_m050_ai_native_evaluations(module_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_m001_m050_ai_eval_actor_created ON m001_m050_ai_native_evaluations(actor_id, created_at DESC) WHERE actor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_m001_m050_ai_eval_payload_gin ON m001_m050_ai_native_evaluations USING GIN(input_payload);

CREATE TABLE IF NOT EXISTS m001_m050_ai_decision_feedback (
  id UUID PRIMARY KEY,
  evaluation_id UUID NOT NULL REFERENCES m001_m050_ai_native_evaluations(id) ON DELETE CASCADE,
  module_id VARCHAR(4) NOT NULL,
  reviewer_id TEXT NOT NULL,
  decision VARCHAR(32) NOT NULL CHECK (decision IN ('accepted','rejected','modified','deferred','not_applicable')),
  reason TEXT,
  outcome JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_m001_m050_feedback_eval ON m001_m050_ai_decision_feedback(evaluation_id, created_at DESC);

COMMENT ON TABLE m001_m050_ai_native_evaluations IS 'Evidence-first M001-M050 analytical/predictive/prescriptive/generative/agentic decision support audit. Does not authorize consequential actions.';
COMMENT ON TABLE m001_m050_ai_decision_feedback IS 'Human decision/outcome feedback for governed continuous-learning evaluation.';
