CREATE TABLE IF NOT EXISTS audio_spatial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_audio_spatial_user ON audio_spatial(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_audio_spatial_status ON audio_spatial(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_audio_spatial_created ON audio_spatial(created_at) WHERE deleted_at IS NULL;