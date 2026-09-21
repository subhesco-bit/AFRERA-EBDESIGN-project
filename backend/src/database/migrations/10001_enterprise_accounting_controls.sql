-- Production controls for the canonical ledger introduced by 996.
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(160);
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS request_hash CHAR(64);
CREATE UNIQUE INDEX IF NOT EXISTS uq_journal_company_idempotency
  ON journal_entries(company_id,idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS journal_audit_log (
  id BIGSERIAL PRIMARY KEY,
  journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE RESTRICT,
  action VARCHAR(30) NOT NULL CHECK (action IN ('created','posted','reversed')),
  actor_id UUID,
  detail JSONB NOT NULL DEFAULT '{}',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_journal_audit_entry ON journal_audit_log(journal_entry_id,occurred_at);

CREATE OR REPLACE FUNCTION assert_journal_status_transition()
RETURNS TRIGGER AS $$
DECLARE v_debit NUMERIC(20,4); v_credit NUMERIC(20,4); v_lines INTEGER; v_period VARCHAR(20);
BEGIN
  IF OLD.status = 'reversed' AND NEW IS DISTINCT FROM OLD THEN
    RAISE EXCEPTION 'Reversed journal entry % is immutable.', OLD.id;
  END IF;
  IF OLD.status = 'posted' AND NEW.status NOT IN ('posted','reversed') THEN
    RAISE EXCEPTION 'Posted journal entry % cannot return to %.', OLD.id, NEW.status;
  END IF;
  IF OLD.status = 'posted' AND NEW.status = 'posted' AND to_jsonb(NEW) <> to_jsonb(OLD) THEN
    RAISE EXCEPTION 'Posted journal entry % is immutable; reverse it instead.', OLD.id;
  END IF;
  IF OLD.status = 'posted' AND NEW.status = 'reversed'
     AND (to_jsonb(NEW) - 'status' - 'reversed_by_entry_id') <>
         (to_jsonb(OLD) - 'status' - 'reversed_by_entry_id') THEN
    RAISE EXCEPTION 'Only reversal status and linkage may change on posted journal entry %.', OLD.id;
  END IF;
  IF NEW.status = 'posted' AND OLD.status <> 'posted' THEN
    SELECT COUNT(*),COALESCE(SUM(debit),0),COALESCE(SUM(credit),0)
      INTO v_lines,v_debit,v_credit FROM journal_lines WHERE journal_entry_id=NEW.id;
    IF v_lines < 2 OR v_debit = 0 OR v_debit <> v_credit THEN
      RAISE EXCEPTION 'Journal entry % cannot post: % lines, debits %, credits %.',NEW.id,v_lines,v_debit,v_credit;
    END IF;
    SELECT status INTO v_period FROM fiscal_periods WHERE id=NEW.fiscal_period_id FOR UPDATE;
    IF v_period IS DISTINCT FROM 'open' THEN
      RAISE EXCEPTION 'Journal entry % cannot post into % period.',NEW.id,COALESCE(v_period,'missing');
    END IF;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_journal_status_transition ON journal_entries;
CREATE TRIGGER trg_journal_status_transition BEFORE UPDATE ON journal_entries
FOR EACH ROW EXECUTE FUNCTION assert_journal_status_transition();

CREATE OR REPLACE FUNCTION prevent_posted_journal_line_change()
RETURNS TRIGGER AS $$
DECLARE v_status VARCHAR(20);
BEGIN
  SELECT status INTO v_status FROM journal_entries WHERE id=COALESCE(NEW.journal_entry_id,OLD.journal_entry_id);
  IF v_status IN ('posted','reversed') THEN RAISE EXCEPTION 'Lines of a % journal are immutable.',v_status; END IF;
  RETURN COALESCE(NEW,OLD);
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_posted_journal_lines_immutable ON journal_lines;
CREATE TRIGGER trg_posted_journal_lines_immutable BEFORE INSERT OR UPDATE OR DELETE ON journal_lines
FOR EACH ROW EXECUTE FUNCTION prevent_posted_journal_line_change();

CREATE OR REPLACE FUNCTION prevent_journal_audit_change()
RETURNS TRIGGER AS $$ BEGIN
  RAISE EXCEPTION 'Journal audit records are append-only.';
END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_journal_audit_append_only ON journal_audit_log;
CREATE TRIGGER trg_journal_audit_append_only BEFORE UPDATE OR DELETE ON journal_audit_log
FOR EACH ROW EXECUTE FUNCTION prevent_journal_audit_change();
