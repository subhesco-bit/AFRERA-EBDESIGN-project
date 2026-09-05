-- Governed public-data extraction, provenance, and searchable record storage.

CREATE TABLE IF NOT EXISTS public_data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  publisher TEXT NOT NULL,
  dataset_key TEXT NOT NULL UNIQUE,
  source_url TEXT NOT NULL,
  allowed_hosts TEXT[] NOT NULL,
  format TEXT NOT NULL DEFAULT 'json' CHECK (format IN ('json')),
  license TEXT,
  refresh_interval_minutes INTEGER NOT NULL DEFAULT 1440 CHECK (refresh_interval_minutes > 0),
  filter_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public_data_extraction_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES public_data_sources(id),
  requested_by UUID,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  http_status INTEGER,
  records_seen INTEGER NOT NULL DEFAULT 0,
  records_loaded INTEGER NOT NULL DEFAULT 0,
  filter_expression JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_retrieved_at TIMESTAMPTZ,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public_data_records (
  id BIGSERIAL PRIMARY KEY,
  source_id UUID NOT NULL REFERENCES public_data_sources(id),
  extraction_run_id UUID NOT NULL REFERENCES public_data_extraction_runs(id),
  record_hash TEXT NOT NULL,
  record JSONB NOT NULL,
  source_url TEXT NOT NULL,
  publisher TEXT NOT NULL,
  license TEXT,
  source_retrieved_at TIMESTAMPTZ NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_id, record_hash)
);

CREATE INDEX IF NOT EXISTS idx_public_data_sources_active
  ON public_data_sources(active, dataset_key);
CREATE INDEX IF NOT EXISTS idx_public_data_runs_source_started
  ON public_data_extraction_runs(source_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_data_records_source_captured
  ON public_data_records(source_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_data_records_record_gin
  ON public_data_records USING GIN(record);