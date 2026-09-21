-- ============================================================================
-- 054_village_governance_councils_groups.sql
--
-- Village governance integration: Panchayat, Village Council and Community
-- Groups. This extends the existing panchayats/village_profiles model and
-- provides a cross-cutting group registry. It does NOT create a second
-- village master and does NOT replace M046 SHG / M048 Producer Group records.
-- Existing group modules may be linked through source_module/source_id.
-- ============================================================================

-- Existing Panchayat master: enrich, do not duplicate.
ALTER TABLE panchayats
  ADD COLUMN IF NOT EXISTS panchayat_code TEXT,
  ADD COLUMN IF NOT EXISTS panchayat_type TEXT DEFAULT 'gram_panchayat',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'panchayats_type_valid'
  ) THEN
    ALTER TABLE panchayats ADD CONSTRAINT panchayats_type_valid
      CHECK (panchayat_type IN ('gram_panchayat','village_panchayat','intermediate_panchayat','district_panchayat','other'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'panchayats_status_valid'
  ) THEN
    ALTER TABLE panchayats ADD CONSTRAINT panchayats_status_valid
      CHECK (status IN ('active','inactive','superseded'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_panchayats_code
  ON panchayats(panchayat_code)
  WHERE panchayat_code IS NOT NULL;

-- Explicit relationship between the existing Panchayat master and the
-- authoritative village_profiles master. Replaces the weak JSON-only
-- villages list for operational joins while preserving legacy data.
CREATE TABLE IF NOT EXISTS panchayat_village_links (
  id SERIAL PRIMARY KEY,
  panchayat_id INTEGER NOT NULL REFERENCES panchayats(id) ON DELETE CASCADE,
  village_id INTEGER NOT NULL REFERENCES village_profiles(village_id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL DEFAULT 'jurisdiction',
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  effective_from DATE,
  effective_to DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT panchayat_village_relationship_valid CHECK (
    relationship_type IN ('jurisdiction','administrative','service_area','other')
  ),
  CONSTRAINT panchayat_village_dates_valid CHECK (
    effective_from IS NULL OR effective_to IS NULL OR effective_to >= effective_from
  ),
  UNIQUE (panchayat_id, village_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_pvl_village ON panchayat_village_links(village_id);
CREATE INDEX IF NOT EXISTS idx_pvl_panchayat ON panchayat_village_links(panchayat_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pvl_primary_village
  ON panchayat_village_links(village_id)
  WHERE is_primary = TRUE;

-- Village Council is deliberately separate from Panchayat: it represents a
-- traditional/indigenous/community council or other village-level council,
-- which can coexist with statutory local government.
CREATE TABLE IF NOT EXISTS village_councils (
  id SERIAL PRIMARY KEY,
  village_id INTEGER NOT NULL REFERENCES village_profiles(village_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  council_type TEXT NOT NULL DEFAULT 'village_council',
  recognition_status TEXT NOT NULL DEFAULT 'community_recognized',
  jurisdiction TEXT,
  registration_number TEXT,
  contact_info JSONB DEFAULT '{}'::jsonb,
  chairperson_user_id UUID REFERENCES users(id),
  secretary_user_id UUID REFERENCES users(id),
  established_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT village_council_type_valid CHECK (
    council_type IN ('village_council','traditional_council','indigenous_council','community_council','other')
  ),
  CONSTRAINT village_council_recognition_valid CHECK (
    recognition_status IN ('statutory','customary','community_recognized','other','pending')
  ),
  CONSTRAINT village_council_status_valid CHECK (
    status IN ('active','inactive','suspended','dissolved')
  ),
  UNIQUE (village_id, name)
);

CREATE INDEX IF NOT EXISTS idx_village_councils_village ON village_councils(village_id);
CREATE INDEX IF NOT EXISTS idx_village_councils_type ON village_councils(council_type);

CREATE TABLE IF NOT EXISTS village_council_members (
  id SERIAL PRIMARY KEY,
  council_id INTEGER NOT NULL REFERENCES village_councils(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  role TEXT NOT NULL DEFAULT 'member',
  membership_status TEXT NOT NULL DEFAULT 'active',
  appointed_from DATE,
  appointed_to DATE,
  responsibilities TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT council_member_dates_valid CHECK (
    appointed_from IS NULL OR appointed_to IS NULL OR appointed_to >= appointed_from
  ),
  CONSTRAINT council_member_status_valid CHECK (
    membership_status IN ('active','inactive','removed','ended')
  ),
  UNIQUE (council_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_council_members_council ON village_council_members(council_id);
CREATE INDEX IF NOT EXISTS idx_council_members_user ON village_council_members(user_id);

-- Cross-cutting community-group registry. M046 SHG, M048 Producer Group,
-- M047 Cooperative and future group modules can be linked here without
-- creating duplicate authoritative records.
CREATE TABLE IF NOT EXISTS village_group_registry (
  id SERIAL PRIMARY KEY,
  village_id INTEGER NOT NULL REFERENCES village_profiles(village_id) ON DELETE CASCADE,
  panchayat_id INTEGER REFERENCES panchayats(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  group_type TEXT NOT NULL,
  source_module TEXT,
  source_id TEXT,
  registration_number TEXT,
  purpose TEXT,
  leader_user_id UUID REFERENCES users(id),
  member_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  formed_date DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT village_group_type_valid CHECK (
    group_type IN ('shg','producer_group','cooperative','farmer_group','fisher_group','women_group','youth_group','artisan_group','water_user_group','forest_group','livelihood_group','community_group','other')
  ),
  CONSTRAINT village_group_status_valid CHECK (
    status IN ('active','inactive','suspended','dissolved')
  ),
  CONSTRAINT village_group_member_count_valid CHECK (member_count >= 0),
  CONSTRAINT village_group_source_pair_valid CHECK (
    (source_module IS NULL AND source_id IS NULL) OR
    (source_module IS NOT NULL AND source_id IS NOT NULL)
  ),
  UNIQUE (village_id, name, group_type)
);

CREATE INDEX IF NOT EXISTS idx_village_groups_village ON village_group_registry(village_id);
CREATE INDEX IF NOT EXISTS idx_village_groups_panchayat ON village_group_registry(panchayat_id);
CREATE INDEX IF NOT EXISTS idx_village_groups_type ON village_group_registry(group_type);
CREATE INDEX IF NOT EXISTS idx_village_groups_source ON village_group_registry(source_module, source_id);

CREATE TABLE IF NOT EXISTS village_group_members (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES village_group_registry(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  role TEXT NOT NULL DEFAULT 'member',
  membership_status TEXT NOT NULL DEFAULT 'active',
  joining_date DATE,
  leaving_date DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT village_group_member_dates_valid CHECK (
    joining_date IS NULL OR leaving_date IS NULL OR leaving_date >= joining_date
  ),
  CONSTRAINT village_group_member_status_valid CHECK (
    membership_status IN ('active','inactive','left','removed')
  ),
  UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_village_group_members_group ON village_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_village_group_members_user ON village_group_members(user_id);

-- Keep timestamps current without introducing another trigger function.
DROP TRIGGER IF EXISTS update_village_councils_updated_at ON village_councils;
CREATE TRIGGER update_village_councils_updated_at
  BEFORE UPDATE ON village_councils
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_village_group_registry_updated_at ON village_group_registry;
CREATE TRIGGER update_village_group_registry_updated_at
  BEFORE UPDATE ON village_group_registry
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE panchayat_village_links IS
  'Explicit Panchayat-to-authoritative-village relationship; supersedes JSON-only village membership for operational joins.';
COMMENT ON TABLE village_councils IS
  'Village-level council registry, including traditional/indigenous/community councils; distinct from statutory Panchayat administration.';
COMMENT ON TABLE village_group_registry IS
  'Cross-cutting village group registry linking existing SHG/Producer/Cooperative modules without duplicating their authoritative records.';
