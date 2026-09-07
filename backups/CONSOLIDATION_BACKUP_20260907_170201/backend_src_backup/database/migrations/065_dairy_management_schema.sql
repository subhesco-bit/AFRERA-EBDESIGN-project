-- ============================================================================
-- 065_dairy_management_schema.sql   (2026-08-10)
--
-- WHY THIS EXISTS
-- frontend/src/pages/DairyManagementPage.jsx (M121 - Dairy Management,
-- Livestock domain) is a real, fully-built, routed page — herd registry +
-- milk-record entry form, both already wired against dairyAPI
-- (frontend/src/services/api.js) calling /dairy/animals and
-- /dairy/milk-records. Neither endpoint has ever existed on the backend
-- (backend/src/modules/M121 is an empty scaffold — README says "Status:
-- ABSENT"). This migration adds the two tables the page's own UI already
-- assumes: an animal registry (tag_id, breed, dob, status, notes — the exact
-- fields DairyManagementPage's form collects) and a milk-yield log
-- (animal_id, date, session, quantity_liters — the exact fields the milk
-- record form collects).
--
-- Two nullable columns are added beyond what the current form collects
-- (last_vaccination_date, last_breeding_date) so the wave-1 business logic
-- (vaccination due-date + breeding/calving due-date alerts) has somewhere
-- real to read from. The animal form is extended in the same pass to let a
-- user actually set them — see DairyManagementPage.jsx.
-- ============================================================================

CREATE TABLE IF NOT EXISTS dairy_animals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id VARCHAR(50) NOT NULL UNIQUE,
  breed VARCHAR(100),
  dob DATE,
  status VARCHAR(30) NOT NULL DEFAULT 'Lactating'
    CHECK (status IN ('Lactating', 'Dry', 'Pregnant', 'Calf', 'Sold')),
  notes TEXT,
  last_vaccination_date DATE,
  last_breeding_date DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dairy_animals_status ON dairy_animals(status);

CREATE TABLE IF NOT EXISTS dairy_milk_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES dairy_animals(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  session VARCHAR(10) NOT NULL DEFAULT 'morning' CHECK (session IN ('morning', 'evening')),
  quantity_liters NUMERIC(6,2) NOT NULL CHECK (quantity_liters >= 0),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (animal_id, date, session)
);

CREATE INDEX IF NOT EXISTS idx_dairy_milk_animal_date ON dairy_milk_records(animal_id, date);
