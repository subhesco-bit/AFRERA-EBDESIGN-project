-- 10011_farmer_voice_agent_stack.sql
-- Auditable, low-literacy IVR/voice channel. Audio itself is never stored here.

CREATE TABLE IF NOT EXISTS voice_agent_sessions (
  session_id UUID PRIMARY KEY,
  call_id TEXT,
  phone_hash CHAR(64),
  user_id UUID,
  channel TEXT NOT NULL DEFAULT 'ivr'
    CHECK (channel IN ('ivr','web','mobile','whatsapp','kiosk','assisted')),
  language TEXT NOT NULL DEFAULT 'hi',
  state TEXT NOT NULL DEFAULT 'consent_required'
    CHECK (state IN ('consent_required','menu','active','handoff','closed')),
  consent_at TIMESTAMPTZ,
  handoff_requested BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_voice_agent_call
  ON voice_agent_sessions(call_id) WHERE call_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_voice_agent_user
  ON voice_agent_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_agent_handoff
  ON voice_agent_sessions(handoff_requested, state);
CREATE TABLE IF NOT EXISTS voice_agent_turns (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES voice_agent_sessions(session_id) ON DELETE CASCADE,
  input_type TEXT NOT NULL CHECK (input_type IN ('dtmf','text','speech')),
  input_text TEXT,
  intent TEXT,
  confidence NUMERIC(5,4)
    CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  response_text TEXT NOT NULL,
  dispatch JSONB NOT NULL DEFAULT '{}'::jsonb,
  provider_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_agent_turn_session
  ON voice_agent_turns(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_voice_agent_turn_intent
  ON voice_agent_turns(intent, created_at);

CREATE TABLE IF NOT EXISTS voice_agent_handoffs (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES voice_agent_sessions(session_id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','assigned','connected','resolved','cancelled')),
  assigned_to UUID,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  connected_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_voice_agent_handoff_status
  ON voice_agent_handoffs(status, queued_at);

COMMENT ON TABLE voice_agent_sessions IS
  'Low-literacy voice/IVR sessions. Phone numbers are hashed; raw audio is not stored.';
COMMENT ON TABLE voice_agent_turns IS
  'Auditable text/DTMF/transcript turns and domain dispatch plans. No autonomous high-risk mutation authority.';
COMMENT ON TABLE voice_agent_handoffs IS
  'Human escalation queue for explicit requests, low confidence, channel failure, or safeguarded workflows.';
