/**
 * The canonical general ledger: trial balance and integrity.
 *
 * REWRITTEN 2026-09-23, for two reasons.
 *
 * 1. IT WAS BROKEN. It called `financeAPI.trialBalance()` and
 *    `financeAPI.verifyLedger()`, neither of which existed on that object, so
 *    it threw "financeAPI.trialBalance is not a function" at mount and rendered
 *    nothing but an error. Both now exist and point at /api/v1/ledger.
 *
 * 2. IT MADE AN INTEGRITY CLAIM THE LEDGER DOES NOT SUPPORT. The old copy read
 *    "Hash-chained ledger ... A trial balance tells you the arithmetic is
 *    consistent; it tells you nothing about whether a historical entry was
 *    altered. The chain does." That was true of `gl_ledger_chain` — the
 *    hash-chained ledger that AFRERA_CLAUDE_BUILD_DIRECTIVE.md Part 3C
 *    deprecated. The CANONICAL ledger (journal_entries/journal_lines) is NOT
 *    hash-chained, so "chain intact" would have been a tamper-evidence claim
 *    with nothing behind it. This page now says exactly what the three checks
 *    establish, and exactly what they do not.
 */
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { financeAPI } from '../services/api';
import { ModulePage, Section, Rupees, AsyncState, DataTable } from '../components/common/DataPrimitives';

export default function LedgerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const companyId = searchParams.get('companyId') || '';

  const [tb, setTb] = useState(null);
  const [integrity, setIntegrity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const [balance, checks] = await Promise.all([
        financeAPI.trialBalance(companyId),
        financeAPI.ledgerIntegrity(companyId),
      ]);
      setTb(balance.data?.data);
      setIntegrity(checks.data?.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [companyId]);

  // The ledger is per company and the API requires it. Guessing a company would
  // put one set of books under another company's name, so the page asks.
  if (!companyId) {
    return (
      <ModulePage
        title="General ledger"
        subtitle="Double-entry ledger with a derived trial balance."
      >
        <Section title="Choose a company">
          <p style={{ fontSize: 15 }}>
            The ledger is kept per company, so this page needs a company id before it can show
            anything. It is not defaulted: showing one company&apos;s books under another
            company&apos;s name would be worse than showing nothing.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const value = new FormData(e.target).get('companyId');
              if (value) setSearchParams({ companyId: String(value).trim() });
            }}
            style={{ marginTop: 12, display: 'flex', gap: 8 }}
          >
            <label htmlFor="companyId" style={{ alignSelf: 'center' }}>Company id</label>
            <input id="companyId" name="companyId" inputMode="numeric" required
              style={{ padding: '6px 8px', border: '1px solid hsl(var(--border))', borderRadius: 4 }} />
            <button type="submit">Open ledger</button>
          </form>
        </Section>
      </ModulePage>
    );
  }

  return (
    <ModulePage
      title="General ledger"
      subtitle={`Company ${companyId} — journal_entries / journal_lines, the canonical ledger.`}
    >
      <AsyncState loading={loading} error={error}>
        <>
          <Section title="Integrity">
            {integrity && (
              <div
                role={integrity.clean ? 'status' : 'alert'}
                style={{
                  border: `1px solid ${integrity.clean ? 'hsl(var(--data-real))' : 'hsl(var(--destructive))'}`,
                  borderLeft: `4px solid ${integrity.clean ? 'hsl(var(--data-real))' : 'hsl(var(--destructive))'}`,
                  background: integrity.clean
                    ? 'color-mix(in srgb, hsl(var(--data-real)) 12%, transparent)'
                    : 'color-mix(in srgb, hsl(var(--destructive)) 12%, transparent)',
                  borderRadius: 6,
                  padding: '12px 14px',
                }}
              >
                <strong>
                  {integrity.clean
                    ? 'No findings from the three checks below.'
                    : `${integrity.findingCount} finding(s) — see below.`}
                </strong>

                {/* What the checks actually cover, stated on the page rather
                    than implied. Without this, "no findings" reads as "the
                    books are correct", which is a much larger claim. */}
                <ul style={{ margin: '8px 0 0', paddingLeft: 20, fontSize: 14 }}>
                  {(integrity.checks || []).map((check) => <li key={check}>{check}</li>)}
                </ul>
                {integrity.scopeNote && (
                  <p style={{ margin: '8px 0 0', fontSize: 14 }}>{integrity.scopeNote}</p>
                )}
                <p style={{ margin: '8px 0 0', fontSize: 14 }}>
                  This ledger is <strong>not hash-chained</strong>. These checks establish that
                  entries balance, that none is empty and that every line points at a real
                  account. They do <strong>not</strong> establish that a historical entry was
                  never altered.
                </p>

                {!integrity.clean && (
                  <>
                    {integrity.findings?.unbalancedEntries?.length > 0 && (
                      <DataTable
                        caption="Entries whose lines do not balance"
                        columns={[
                          { key: 'entryNumber', label: 'Entry' },
                          { key: 'entryDate', label: 'Date' },
                          { key: 'totalDebit', label: 'Debit', numeric: true, render: (r) => <Rupees value={r.totalDebit} /> },
                          { key: 'totalCredit', label: 'Credit', numeric: true, render: (r) => <Rupees value={r.totalCredit} /> },
                          { key: 'difference', label: 'Out by', numeric: true, render: (r) => <Rupees value={r.difference} /> },
                        ]}
                        rows={integrity.findings.unbalancedEntries}
                        rowKey={(r) => r.id}
                      />
                    )}
                    {integrity.findings?.emptyEntries?.length > 0 && (
                      <DataTable
                        caption="Entries with no lines"
                        columns={[
                          { key: 'entry_number', label: 'Entry' },
                          { key: 'entry_date', label: 'Date' },
                          { key: 'status', label: 'Status' },
                        ]}
                        rows={integrity.findings.emptyEntries}
                        rowKey={(r) => r.id}
                      />
                    )}
                    {integrity.findings?.orphanLines?.length > 0 && (
                      <DataTable
                        caption="Lines pointing at an account that does not exist"
                        columns={[
                          { key: 'id', label: 'Line' },
                          { key: 'journal_entry_id', label: 'Entry' },
                          { key: 'account_id', label: 'Account id' },
                        ]}
                        rows={integrity.findings.orphanLines}
                        rowKey={(r) => r.id}
                      />
                    )}
                  </>
                )}
              </div>
            )}
          </Section>

          <Section title="Trial balance">
            {tb && (
              <>
                <p style={{ fontSize: 15 }}>
                  Debits <strong><Rupees value={tb.totals?.debit} /></strong>
                  {' · '}Credits <strong><Rupees value={tb.totals?.credit} /></strong>
                  {' · '}
                  <strong style={{ color: tb.totals?.balanced ? 'hsl(var(--data-real))' : 'hsl(var(--destructive))' }}>
                    {tb.totals?.balanced ? 'balanced' : <>out by <Rupees value={tb.totals?.difference} /></>}
                  </strong>
                </p>
                {tb.scope && <p style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))' }}>{tb.scope}</p>}
                {/* Where the number came from, on the screen showing it. */}
                {tb.basis && (
                  <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
                    Source: {(tb.source || []).join(', ')} — {tb.basis}
                  </p>
                )}
                <DataTable
                  caption="Account balances"
                  emptyMessage="No posted entries for this company yet."
                  columns={[
                    { key: 'accountCode', label: 'Account' },
                    { key: 'accountName', label: 'Name' },
                    { key: 'totalDebit', label: 'Debit', numeric: true, render: (r) => <Rupees value={r.totalDebit} /> },
                    { key: 'totalCredit', label: 'Credit', numeric: true, render: (r) => <Rupees value={r.totalCredit} /> },
                    { key: 'balance', label: 'Balance', numeric: true, render: (r) => <Rupees value={r.balance} /> },
                  ]}
                  rows={tb.accounts || []}
                  rowKey={(r) => r.accountCode}
                />
              </>
            )}
          </Section>

          <button onClick={load} style={{ marginTop: 16 }}>Refresh</button>
        </>
      </AsyncState>
    </ModulePage>
  );
}
