/**
 * Hash-chained ledger, trial balance and chain integrity.
 *
 * The integrity check is the reason this screen exists. A trial balance that
 * balances tells you the arithmetic is consistent; it tells you nothing about
 * whether a historical entry was altered. The chain does.
 */
import React, { useState, useEffect } from 'react';
import { financeAPI } from '../services/api';
import { ModulePage, Section, Rupees, AsyncState, DataTable } from '../components/common/DataPrimitives';

export default function LedgerPage() {
  const [tb, setTb] = useState(null);
  const [integrity, setIntegrity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [a, b] = await Promise.all([financeAPI.trialBalance(), financeAPI.verifyLedger()]);
      setTb(a.data?.data); setIntegrity(b.data?.data);
    } catch (e) { setError(e.response?.data?.error || e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  return (
    <ModulePage title="General ledger" subtitle="Tamper-evident double-entry ledger with a derived trial balance."
      migration="053">
      <AsyncState loading={loading} error={error}>
        <>
          <Section title="Chain integrity">
            {integrity && (
              <div role={integrity.ok ? 'status' : 'alert'}
                style={{
                  border: `1px solid ${integrity.ok ? 'hsl(var(--data-real))' : 'hsl(var(--destructive))'}`,
                  borderLeft: `4px solid ${integrity.ok ? 'hsl(var(--data-real))' : 'hsl(var(--destructive))'}`,
                  background: integrity.ok ? 'color-mix(in srgb, hsl(var(--data-real)) 12%, transparent)' : 'color-mix(in srgb, hsl(var(--destructive)) 12%, transparent)',
                  borderRadius: 6, padding: '12px 14px',
                }}>
                <strong>
                  {integrity.ok ?
                    `Chain intact across ${integrity.length} entries.` :
                    `CHAIN BROKEN — ${integrity.broken.length} entry link(s) do not verify.`}
                </strong>
                {integrity.note && <p style={{ margin: '6px 0 0', fontSize: 14 }}>{integrity.note}</p>}
                {!integrity.ok && (
                  <DataTable
                    caption="Broken links"
                    columns={[
                      { key: 'entry_ref', label: 'Entry' },
                      { key: 'sequence_no', label: 'Sequence', numeric: true },
                      { key: 'finding', label: 'Finding' },
                    ]}
                    rows={integrity.broken}
                    rowKey={(r) => r.id}
                  />
                )}
              </div>
            )}
          </Section>

          <Section title="Trial balance">
            {tb && (
              <>
                <p style={{ fontSize: 15 }}>
                  Debits <strong><Rupees value={tb.totalDebit} /></strong>
                  {' · '}Credits <strong><Rupees value={tb.totalCredit} /></strong>
                  {' · '}
                  <strong style={{ color: tb.balanced ? 'hsl(var(--data-real))' : 'hsl(var(--destructive))' }}>
                    {tb.balanced ? 'balanced' : `out by ${tb.difference}`}
                  </strong>
                </p>
                {tb.note && <p role="alert" style={{ color: 'hsl(var(--destructive))', fontSize: 14 }}>{tb.note}</p>}
                <DataTable
                  caption="Account balances"
                  emptyMessage="No ledger entries recorded yet."
                  columns={[
                    { key: 'account', label: 'Account' },
                    { key: 'total_debit', label: 'Debit', numeric: true, render: (r) => <Rupees value={r.total_debit} /> },
                    { key: 'total_credit', label: 'Credit', numeric: true, render: (r) => <Rupees value={r.total_credit} /> },
                    { key: 'balance', label: 'Balance', numeric: true, render: (r) => <Rupees value={r.balance} /> },
                  ]}
                  rows={tb.lines || []}
                  rowKey={(r) => r.account}
                />
              </>
            )}
          </Section>
          <button onClick={load} style={{ marginTop: 16 }}>Re-verify</button>
        </>
      </AsyncState>
    </ModulePage>
  );
}
