-- 3000_M107_generated.sql
-- Auto-generated table for M107

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS _items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);