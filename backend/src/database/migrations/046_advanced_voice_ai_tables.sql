-- FK TYPE FIX 2026-08-04: 5 column(s) in this file declared INTEGER while
-- referencing a UUID primary key. PostgreSQL rejects the whole CREATE TABLE
-- ("foreign key constraint cannot be implemented"), so these tables were
-- never created at all — along with every index and trigger that followed.
-- Changed to UUID to match 000_base_schema, which is canonical.

-- Advanced Voice AI Tables Migration
-- for AFRERA Platform Advanced Voice AI Service

-- Voice conversations table
CREATE TABLE IF NOT EXISTS voice_conversations (
  id SERIAL PRIMARY KEY,
  conversation_id VARCHAR(100) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  language VARCHAR(10) DEFAULT 'en',
  status VARCHAR(20) DEFAULT 'active',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  duration_seconds INTEGER,
  metadata JSONB DEFAULT '{}'
);

-- Indexes moved out of the CREATE TABLE body (2026-08-04).
-- "INDEX name (col)" inside CREATE TABLE is MySQL syntax; PostgreSQL parses
-- it as a column literally named "index" of type "name", then fails at
-- execution with: type "idx_voice_conversations_user" does not exist.
CREATE INDEX IF NOT EXISTS idx_voice_conversations_user ON voice_conversations (user_id);
CREATE INDEX IF NOT EXISTS idx_voice_conversations_status ON voice_conversations (status);
CREATE INDEX IF NOT EXISTS idx_voice_conversations_language ON voice_conversations (language);

-- Voice conversation turns table
CREATE TABLE IF NOT EXISTS voice_conversation_turns (
  id SERIAL PRIMARY KEY,
  conversation_id VARCHAR(100) NOT NULL REFERENCES voice_conversations(conversation_id),
  user_id UUID NOT NULL REFERENCES users(id),
  transcript TEXT NOT NULL,
  intent VARCHAR(50) NOT NULL,
  confidence DECIMAL(3,2),
  entities JSONB DEFAULT '{}',
  response_text TEXT NOT NULL,
  response_data JSONB DEFAULT '{}',
  audio_transcription_provider VARCHAR(50),
  audio_transcription_confidence DECIMAL(3,2),
  processing_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes moved out of the CREATE TABLE body (2026-08-04).
-- "INDEX name (col)" inside CREATE TABLE is MySQL syntax; PostgreSQL parses
-- it as a column literally named "index" of type "name", then fails at
-- execution with: type "idx_voice_turns_conversation" does not exist.
CREATE INDEX IF NOT EXISTS idx_voice_turns_conversation ON voice_conversation_turns (conversation_id);
CREATE INDEX IF NOT EXISTS idx_voice_turns_user ON voice_conversation_turns (user_id);
CREATE INDEX IF NOT EXISTS idx_voice_turns_intent ON voice_conversation_turns (intent);
CREATE INDEX IF NOT EXISTS idx_voice_turns_created ON voice_conversation_turns (created_at);

-- Voice command analytics table
CREATE TABLE IF NOT EXISTS voice_command_analytics (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  intent VARCHAR(50) NOT NULL,
  confidence DECIMAL(3,2),
  language VARCHAR(10),
  entities_detected JSONB,
  response_generated BOOLEAN DEFAULT TRUE,
  user_satisfaction_rating INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes moved out of the CREATE TABLE body (2026-08-04).
-- "INDEX name (col)" inside CREATE TABLE is MySQL syntax; PostgreSQL parses
-- it as a column literally named "index" of type "name", then fails at
-- execution with: type "idx_voice_command_analytics_user" does not exist.
CREATE INDEX IF NOT EXISTS idx_voice_command_analytics_user ON voice_command_analytics (user_id);
CREATE INDEX IF NOT EXISTS idx_voice_analytics_intent ON voice_command_analytics (intent);
CREATE INDEX IF NOT EXISTS idx_voice_analytics_language ON voice_command_analytics (language);
CREATE INDEX IF NOT EXISTS idx_voice_analytics_created ON voice_command_analytics (created_at);

-- Voice language preferences table
CREATE TABLE IF NOT EXISTS voice_language_preferences (
  id SERIAL PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES users(id),
  preferred_language VARCHAR(10) DEFAULT 'en',
  voice_gender VARCHAR(10) DEFAULT 'female',
  speech_rate DECIMAL(2,1) DEFAULT 1.0,
  speech_pitch DECIMAL(2,1) DEFAULT 1.0,
  accessibility_settings JSONB DEFAULT '{}',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes moved out of the CREATE TABLE body (2026-08-04).
-- "INDEX name (col)" inside CREATE TABLE is MySQL syntax; PostgreSQL parses
-- it as a column literally named "index" of type "name", then fails at
-- execution with: type "idx_voice_prefs_user" does not exist.
CREATE INDEX IF NOT EXISTS idx_voice_prefs_user ON voice_language_preferences (user_id);

-- Voice feedback table
CREATE TABLE IF NOT EXISTS voice_feedback (
  id SERIAL PRIMARY KEY,
  conversation_id VARCHAR(100) REFERENCES voice_conversations(conversation_id),
  user_id UUID NOT NULL REFERENCES users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  misunderstood_query TEXT,
  suggested_improvement TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes moved out of the CREATE TABLE body (2026-08-04).
-- "INDEX name (col)" inside CREATE TABLE is MySQL syntax; PostgreSQL parses
-- it as a column literally named "index" of type "name", then fails at
-- execution with: type "idx_voice_feedback_conversation" does not exist.
CREATE INDEX IF NOT EXISTS idx_voice_feedback_conversation ON voice_feedback (conversation_id);
CREATE INDEX IF NOT EXISTS idx_voice_feedback_user ON voice_feedback (user_id);
CREATE INDEX IF NOT EXISTS idx_voice_feedback_rating ON voice_feedback (rating);

-- Add voice preference to user profiles if not exists
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS voice_language VARCHAR(10) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS voice_preference JSONB DEFAULT '{"gender": "female", "rate": 1.0, "pitch": 1.0}';

-- Create function to update voice conversation duration
CREATE OR REPLACE FUNCTION update_voice_conversation_duration()
RETURNS TRIGGER AS $$
BEGIN
  NEW.duration_seconds = EXTRACT(EPOCH FROM (COALESCE(NEW.ended_at, CURRENT_TIMESTAMP) - NEW.started_at));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update duration
DROP TRIGGER IF EXISTS trigger_update_voice_conversation_duration ON voice_conversations;
CREATE TRIGGER trigger_update_voice_conversation_duration BEFORE INSERT OR UPDATE ON voice_conversations
FOR EACH ROW
EXECUTE FUNCTION update_voice_conversation_duration();