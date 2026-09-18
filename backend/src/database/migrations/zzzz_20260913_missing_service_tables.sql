-- Four tables that services query but no migration ever defined.
--
-- Found by probing every endpoint against the running server: each of these
-- produced a 500 reading 'relation "x" does not exist'. Unlike the other
-- missing tables recovered by fixing the migration runner, these are defined
-- nowhere in the 745-file migration set — they have to be written.
--
-- Column shapes are taken from the queries that use them, not invented:
--   refresh_tokens        services/dual-use/authService.js
--   insurance_policies    services/finance/insurancePolicyIssuanceService.js
--   fisheries / forestry  services/legacy/{fisheries,forestry}Service.js
--
-- refresh_tokens matters most: without it the auth service can issue an access
-- token but cannot persist the refresh token beside it, so sessions cannot be
-- renewed and every client is forced back through a full login after 15
-- minutes.

-- ------------------------------------------------------------ refresh_tokens
-- INSERT INTO refresh_tokens (user_id, token, device_info, expires_at)
-- UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       text NOT NULL UNIQUE,
  device_info jsonb,
  revoked     boolean NOT NULL DEFAULT false,
  expires_at  timestamp NOT NULL,
  created_at  timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Lookup is by token on every refresh, and by user when revoking a session.
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token   ON refresh_tokens (token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user    ON refresh_tokens (user_id);
-- Partial index: expiry sweeps only ever care about live tokens.
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens (expires_at)
  WHERE revoked = false;

COMMENT ON TABLE refresh_tokens IS
  'Refresh tokens issued alongside access tokens. Rows are retained after revocation so a replayed token can be recognised as revoked rather than merely unknown.';

-- -------------------------------------------------------- insurance_policies
-- INSERT INTO insurance_policies
--   (policy_number, policyholder_id, insurance_type, quote_id, premium_amount,
--    payment_method, payment_reference, start_date, end_date, payment_schedule,
--    policy_data, status, issued_at)
CREATE TABLE IF NOT EXISTS insurance_policies (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_number     varchar(64) NOT NULL UNIQUE,
  policyholder_id   uuid REFERENCES users(id) ON DELETE SET NULL,
  insurance_type    varchar(64) NOT NULL,
  quote_id          uuid,
  premium_amount    numeric(14,2) NOT NULL CHECK (premium_amount >= 0),
  payment_method    varchar(50),
  payment_reference varchar(120),
  start_date        date NOT NULL,
  end_date          date NOT NULL,
  payment_schedule  jsonb,
  policy_data       jsonb,
  status            varchar(20) NOT NULL DEFAULT 'active',
  issued_at         timestamp,
  created_at        timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- A policy that expires before it starts is a data-entry error, not a
  -- business case. Reject it at the boundary rather than reasoning about it
  -- later in every report that touches cover periods.
  CONSTRAINT insurance_policies_period_valid CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_insurance_policies_holder ON insurance_policies (policyholder_id);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_status ON insurance_policies (status);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_period ON insurance_policies (start_date, end_date);

-- ----------------------------------------------------------------- fisheries
-- INSERT INTO fisheries (farmer_id, name, location, species, pond_size_sqft,
--                        water_source, stock_count, average_weight_kg)
CREATE TABLE IF NOT EXISTS fisheries (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id         uuid REFERENCES users(id) ON DELETE SET NULL,
  name              varchar(255) NOT NULL,
  location          varchar(255),
  species           varchar(120),
  pond_size_sqft    numeric(12,2) CHECK (pond_size_sqft IS NULL OR pond_size_sqft > 0),
  water_source      varchar(120),
  stock_count       integer CHECK (stock_count IS NULL OR stock_count >= 0),
  average_weight_kg numeric(10,3) CHECK (average_weight_kg IS NULL OR average_weight_kg >= 0),
  status            varchar(20) NOT NULL DEFAULT 'active',
  created_at        timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fisheries_farmer  ON fisheries (farmer_id);
CREATE INDEX IF NOT EXISTS idx_fisheries_species ON fisheries (species);

-- ------------------------------------------------------------------ forestry
-- INSERT INTO forestry (farmer_id, name, location, type, area_hectares,
--                       species, planting_date, expected_harvest_date)
CREATE TABLE IF NOT EXISTS forestry (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id             uuid REFERENCES users(id) ON DELETE SET NULL,
  name                  varchar(255) NOT NULL,
  location              varchar(255),
  type                  varchar(120),
  area_hectares         numeric(12,3) CHECK (area_hectares IS NULL OR area_hectares > 0),
  species               varchar(255),
  planting_date         date,
  expected_harvest_date date,
  status                varchar(20) NOT NULL DEFAULT 'active',
  created_at            timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- Forestry rotations run for years; a harvest date before planting is an
  -- error worth catching at write time.
  CONSTRAINT forestry_harvest_after_planting
    CHECK (expected_harvest_date IS NULL OR planting_date IS NULL
           OR expected_harvest_date >= planting_date)
);

CREATE INDEX IF NOT EXISTS idx_forestry_farmer ON forestry (farmer_id);
CREATE INDEX IF NOT EXISTS idx_forestry_type   ON forestry (type);

-- --------------------------------------------------------- updated_at upkeep
-- The three business tables carry updated_at and nothing was maintaining it.
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS insurance_policies_touch ON insurance_policies;
CREATE TRIGGER insurance_policies_touch BEFORE UPDATE ON insurance_policies
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS fisheries_touch ON fisheries;
CREATE TRIGGER fisheries_touch BEFORE UPDATE ON fisheries
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS forestry_touch ON forestry;
CREATE TRIGGER forestry_touch BEFORE UPDATE ON forestry
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
