-- Fix: economy_balances primary key must include currency.
--
-- WHY
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
-- Verified 2026-09-21 by calling createLedgerEntry() against the live
-- afrera database: every ledger write fails and rolls back. The service has
-- therefore never successfully written an economy balance.
--
-- Two readings were possible. Either currency is vestigial and the service is
-- wrong, or the key is wrong. The column exists, defaults to 'INR' rather
-- than being fixed at it, is carried through every INSERT in the service, and
-- is a query parameter on getEconomyBalance(economy, currency) and
-- getAllEconomyBalances(currency). Keying on economy alone would collapse an
-- economy's INR and USD balances into one row and silently corrupt both. The
-- service's (economy, currency) is the correct domain key, so the constraint
-- is what moves.
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
