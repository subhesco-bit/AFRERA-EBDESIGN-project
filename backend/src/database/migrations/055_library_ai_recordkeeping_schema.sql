-- Library AI Recordkeeping Schema
-- Tracks project-library file identity, activity, AI retrieval, model usage,
-- generated outputs, cost, safety, and evaluations.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS library_file_sources (
  source_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_label TEXT NOT NULL UNIQUE,
  source_role TEXT NOT NULL,
  root_path TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS library_file_records (
  library_id TEXT PRIMARY KEY,
  source_label TEXT NOT NULL REFERENCES library_file_sources(source_label) ON UPDATE CASCADE,
  source_role TEXT NOT NULL,
  absolute_path TEXT NOT NULL,
  relative_path TEXT NOT NULL,
  basename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  extension TEXT,
  bytes BIGINT NOT NULL DEFAULT 0,
  modified_at TIMESTAMPTZ,
  category TEXT NOT NULL,
  feature_key TEXT NOT NULL,
  workflow_role TEXT NOT NULL,
  hash_status TEXT NOT NULL,
  sha256 TEXT,
  review_required BOOLEAN NOT NULL DEFAULT TRUE,
  content_summary TEXT,
  text_preview TEXT,
  activity_status TEXT NOT NULL DEFAULT 'indexed',
  git_status TEXT,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  UNIQUE (source_label, relative_path)
);

CREATE TABLE IF NOT EXISTS library_file_activity_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  library_id TEXT,
  previous_library_id TEXT,
  name TEXT,
  file_type TEXT,
  bytes BIGINT,
  source_label TEXT,
  source_role TEXT,
  relative_path TEXT,
  absolute_path TEXT,
  previous_source_label TEXT,
  previous_relative_path TEXT,
  previous_absolute_path TEXT,
  feature_key TEXT,
  workflow_role TEXT,
  sha256 TEXT,
  hash_status TEXT,
  movement_confidence TEXT,
  content_summary TEXT,
  actor_type TEXT NOT NULL DEFAULT 'system',
  actor_id TEXT,
  run_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE TABLE IF NOT EXISTS library_ai_workflow_runs (
  run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_type TEXT NOT NULL,
  request_id TEXT,
  user_id TEXT,
  session_id TEXT,
  task_id TEXT,
  feature_key TEXT,
  objective TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'started',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  latency_ms INTEGER,
  input_summary TEXT,
  output_summary TEXT,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE TABLE IF NOT EXISTS library_ai_retrieval_context (
  context_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES library_ai_workflow_runs(run_id) ON DELETE CASCADE,
  library_id TEXT REFERENCES library_file_records(library_id) ON DELETE SET NULL,
  rank INTEGER NOT NULL,
  relevance_score NUMERIC(8, 6),
  retrieval_query TEXT NOT NULL,
  source_label TEXT,
  relative_path TEXT,
  feature_key TEXT,
  workflow_role TEXT,
  citation_text TEXT,
  content_excerpt TEXT,
  token_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE TABLE IF NOT EXISTS library_ai_model_calls (
  model_call_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES library_ai_workflow_runs(run_id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  model_family TEXT,
  purpose TEXT NOT NULL,
  prompt_hash TEXT NOT NULL,
  system_prompt_hash TEXT,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cached_input_tokens INTEGER NOT NULL DEFAULT 0,
  latency_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'completed',
  error_code TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE TABLE IF NOT EXISTS library_ai_generated_outputs (
  output_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES library_ai_workflow_runs(run_id) ON DELETE CASCADE,
  model_call_id UUID REFERENCES library_ai_model_calls(model_call_id) ON DELETE SET NULL,
  output_type TEXT NOT NULL,
  title TEXT,
  content_hash TEXT NOT NULL,
  storage_uri TEXT,
  mime_type TEXT,
  linked_library_id TEXT REFERENCES library_file_records(library_id) ON DELETE SET NULL,
  provenance JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE TABLE IF NOT EXISTS library_ai_safety_decisions (
  safety_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES library_ai_workflow_runs(run_id) ON DELETE CASCADE,
  model_call_id UUID REFERENCES library_ai_model_calls(model_call_id) ON DELETE SET NULL,
  decision_type TEXT NOT NULL,
  decision_status TEXT NOT NULL,
  policy_area TEXT,
  severity TEXT,
  reason TEXT,
  redacted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE TABLE IF NOT EXISTS library_ai_cost_events (
  cost_event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES library_ai_workflow_runs(run_id) ON DELETE CASCADE,
  model_call_id UUID REFERENCES library_ai_model_calls(model_call_id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  estimated_cost NUMERIC(18, 8) NOT NULL DEFAULT 0,
  billable_units NUMERIC(18, 6) NOT NULL DEFAULT 0,
  unit_type TEXT NOT NULL,
  cost_layer TEXT NOT NULL DEFAULT 'library-ai',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE TABLE IF NOT EXISTS library_ai_eval_results (
  eval_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES library_ai_workflow_runs(run_id) ON DELETE CASCADE,
  eval_type TEXT NOT NULL,
  score NUMERIC(8, 6),
  passed BOOLEAN,
  finding TEXT,
  expected_output TEXT,
  actual_output TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_library_file_records_feature ON library_file_records(feature_key);
CREATE INDEX IF NOT EXISTS idx_library_file_records_type ON library_file_records(file_type);
CREATE INDEX IF NOT EXISTS idx_library_file_records_category ON library_file_records(category);
CREATE INDEX IF NOT EXISTS idx_library_file_records_source_path ON library_file_records(source_label, relative_path);
CREATE INDEX IF NOT EXISTS idx_library_file_records_sha256 ON library_file_records(sha256) WHERE sha256 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_library_file_records_activity ON library_file_records(activity_status, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_library_file_activity_events_type_time ON library_file_activity_events(event_type, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_library_file_activity_events_library ON library_file_activity_events(library_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_library_ai_workflow_runs_feature_time ON library_ai_workflow_runs(feature_key, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_library_ai_workflow_runs_status ON library_ai_workflow_runs(status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_library_ai_retrieval_context_run_rank ON library_ai_retrieval_context(run_id, rank);
CREATE INDEX IF NOT EXISTS idx_library_ai_model_calls_run ON library_ai_model_calls(run_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_library_ai_cost_events_run ON library_ai_cost_events(run_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_library_ai_eval_results_run ON library_ai_eval_results(run_id, created_at DESC);
