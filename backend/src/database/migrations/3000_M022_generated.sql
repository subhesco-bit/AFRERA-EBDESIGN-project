-- 3000_M022_generated.sql
-- Auto-generated table for M022

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS _items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);