-- ============================================================================
-- 3106_fpo_member_shares_schema.sql   (2026-08-11)
--
-- FPO MEMBER SHARE CAPITAL + PATRONAGE-BASED PROFIT DISTRIBUTION.
--
-- PRE-BUILD GATE — this one DID find an existing table, so the collision is
-- answered explicitly rather than skipped:
--
--   1. Distinguishing noun: "share capital" / "patronage dividend".
--   2. Grep hits: governanceService.js has createCooperative/getCooperatives/
--      addCooperativeMember against 012_governance_module.sql's `cooperatives`
--      (SERIAL id) and `cooperative_members` (cooperative_id -> cooperatives,
--      user_id -> users, share_holding NUMERIC, joining_date). That table is
--      real and already live under /api/v1/governance/cooperatives.
--   3. Why extending it is the wrong choice here: `cooperatives` is the
--      village-level CSR/Panchayat-governance entity (migration 012's own
--      header: "Village Management, Panchayat Integration, CSR Tracking, and
--      Compliance"). It is keyed to `users`, not `farmers`, and has no
--      concept of an FPO. Every other real system this platform already has
--      for the FPO commercial domain — fpos/farmers (000_base_schema),
--      fpo_ledger_entries (9995, millCircuitService.js), FPODashboardPage.jsx
--      — is keyed to `fpos(id)` and `farmers(id)`. Bolting fpo_id/farmer_id
--      columns onto `cooperative_members` to make one table serve both the
--      CSR-cooperative membership register AND FPO commercial share capital
--      would conflate two legally and operationally distinct entities (a
--      village cooperative under panchayat governance is not necessarily an
--      FPO, and vice versa) — the same "renamed vs. parallel" trap
--      AFRERA_CLAUDE_BUILD_DIRECTIVE.md 0.5 warns about, just inverted: here
--      the wrong move is force-merging two different concepts into one name,
--      not duplicating one concept under two names.
--   4. Which module owns what: governanceService.js keeps owning general
--      cooperative/CSR membership. This migration adds a distinctly-named,
--      distinctly-keyed table for the FPO-specific concept, so there is no
--      name collision and no silent schema drift between the two.
-- ============================================================================

CREATE TABLE IF NOT EXISTS fpo_member_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fpo_id UUID NOT NULL REFERENCES fpos(id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    shares_held NUMERIC(12,2) NOT NULL CHECK (shares_held >= 0),
    -- Face value per share, in INR — needed to state actual paid-up capital
    -- (shares_held * share_value_inr), not just a share count.
    share_value_inr NUMERIC(12,2) NOT NULL CHECK (share_value_inr >= 0),
    join_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active','inactive','withdrawn')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (fpo_id, farmer_id)
);

CREATE INDEX IF NOT EXISTS idx_fpo_member_shares_fpo_id ON fpo_member_shares(fpo_id);
CREATE INDEX IF NOT EXISTS idx_fpo_member_shares_farmer_id ON fpo_member_shares(farmer_id);

-- One computed distribution run for an FPO over a period. `total_surplus_inr`
-- is entered by whoever runs the distribution (the FPO's own P&L surplus for
-- the period — this platform has no single real "FPO net profit" ledger to
-- pull it from automatically); the PER-MEMBER SPLIT of that surplus is what
-- is computed for real, from fpo_ledger_entries transaction volume.
CREATE TABLE IF NOT EXISTS fpo_profit_distributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fpo_id UUID NOT NULL REFERENCES fpos(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_surplus_inr NUMERIC(14,2) NOT NULL CHECK (total_surplus_inr >= 0),
    -- India's cooperative-law convention: dividends on PAID-UP CAPITAL are
    -- share-based; the SURPLUS itself is distributed by PATRONAGE (a
    -- member's actual transaction volume with the cooperative in the
    -- period) — these are legally distinct. This platform only computes the
    -- patronage method for now; 'share_based' is reserved, not implemented.
    distribution_method VARCHAR(20) NOT NULL DEFAULT 'patronage'
        CHECK (distribution_method IN ('patronage','share_based')),
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    computed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fpo_profit_distributions_period_ordered CHECK (period_end >= period_start)
);

CREATE INDEX IF NOT EXISTS idx_fpo_profit_distributions_fpo_id ON fpo_profit_distributions(fpo_id);

-- Per-member result of a distribution run. patronage_volume_inr is the real
-- SUM of that farmer's fpo_ledger_entries credit amounts in the period —
-- never invented; a farmer with zero ledger entries in the period gets a
-- zero line, not an estimated one.
CREATE TABLE IF NOT EXISTS fpo_profit_distribution_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    distribution_id UUID NOT NULL REFERENCES fpo_profit_distributions(id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    patronage_volume_inr NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (patronage_volume_inr >= 0),
    patronage_share_pct NUMERIC(7,4) NOT NULL DEFAULT 0 CHECK (patronage_share_pct >= 0),
    dividend_amount_inr NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (dividend_amount_inr >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (distribution_id, farmer_id)
);

CREATE INDEX IF NOT EXISTS idx_fpo_profit_distribution_lines_distribution_id ON fpo_profit_distribution_lines(distribution_id);
CREATE INDEX IF NOT EXISTS idx_fpo_profit_distribution_lines_farmer_id ON fpo_profit_distribution_lines(farmer_id);

COMMENT ON TABLE fpo_member_shares IS 'FPO member share capital — distinct from governance.cooperative_members (see migration header for why).';
COMMENT ON TABLE fpo_profit_distributions IS 'A computed patronage-dividend distribution run for one FPO/period.';
COMMENT ON TABLE fpo_profit_distribution_lines IS 'Per-member patronage share and dividend for a distribution run, computed from real fpo_ledger_entries transaction volume.';
