-- Fix: economy_balances primary key must include currency.
--
-- READ THIS FIRST — THE SUBSYSTEM THIS TABLE BELONGS TO IS DEPRECATED
--
-- economy_balances is written only by unifiedLedgerService, whose entire route
-- surface AFRERA_CLAUDE_BUILD_DIRECTIVE.md Part 3C deprecates (HTTP 410,
-- explicit authorization, 2026-08-15): it implements the "9 separate economies"
-- ledger model the directive rejects in favour of one canonical
-- journal_entries/journal_lines ledger with economy as a cost-center tag.
--
-- This migration was written before that decision was found, while wiring an
-- HTTP API onto the service. That API has since been replaced with the same 410
-- the directive requires, so NOTHING SUPPORTED WRITES THROUGH THIS PATH and
-- this migration is not needed for any live code path.
--
-- It is kept, rather than deleted, because it has already been APPLIED to the
-- afrera database. Deleting the file would leave the repository silently
-- diverged from the live schema, which is worse than carrying a migration that
-- no supported code needs. Reverting the applied change is a destructive edit
-- to a live financial table and is left for an explicit human decision; the
-- revert is the two ALTER statements below, inverted.
--
-- WHAT IT FIXES (a real contradiction, still worth recording)
--
-- 9999_zzzzzzzzzz_unified_ledger_schema.sql declares:
--
--     economy  VARCHAR(20) PRIMARY KEY,
--     currency VARCHAR(3)  DEFAULT 'INR',
--
-- so the natural key is (economy) alone while the table carries a currency
-- column. unifiedLedgerService.updateEconomyBalance upserts with
--
--     ON CONFLICT (economy, currency)
--
-- which PostgreSQL rejects outright:
--
--     there is no unique or exclusion constraint matching the
--     ON CONFLICT specification
--
-- Verified 2026-09-21 against the live afrera database: every ledger write
-- failed and rolled back, so the service had never successfully written a row.
-- The service's key is the correct domain key — currency defaults to 'INR'
-- rather than being fixed at it, is carried through every INSERT, and is a
-- parameter of getEconomyBalance/getAllEconomyBalances — so keying on economy
-- alone would silently merge an economy's INR and USD balances.
--
-- Append-only: 9999_zzzzzzzzzz is already applied, so it is not edited.

BEGIN;

ALTER TABLE economy_balances
  ALTER COLUMN currency SET NOT NULL;

ALTER TABLE economy_balances
  ALTER COLUMN currency SET DEFAULT 'INR';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'economy_balances'::regclass
      AND contype = 'p'
      AND conname = 'economy_balances_pkey'
  ) THEN
    ALTER TABLE economy_balances DROP CONSTRAINT economy_balances_pkey;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'economy_balances'::regclass
      AND contype = 'p'
  ) THEN
    ALTER TABLE economy_balances
      ADD CONSTRAINT economy_balances_pkey PRIMARY KEY (economy, currency);
  END IF;
END $$;

COMMIT;
