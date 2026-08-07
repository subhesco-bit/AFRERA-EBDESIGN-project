/**
 * Tax compliance — TDS, e-invoice IRN, GSTR, RCM.
 *
 * The sandbox/production distinction on IRN is surfaced loudly: a sandbox IRN
 * on a real invoice looks completely normal until a buyer tries to claim input
 * credit against it and cannot.
 */
import React, { useState, useEffect } from 'react'
import { complianceAPI } from '../services/api'
import { ModulePage, Section, Field, Rupees, Value, AsyncState, DataTable } from '../components/common/DataPrimitives'

export default function CompliancePage() {
  const [summary, setSummary] = useState(null)
  const [rates, setRates] = useState(null)
  const [rcm, setRcm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [period, setPeriod] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const [s, r] = await Promise.all([complianceAPI.tdsSummary({}), complianceAPI.tdsRates()])
        setSummary(s.data?.data); setRates(r.data?.data)
      } catch (e) { setError(e.response?.data?.error || e.message) } finally { setLoading(false) }
    })()
  }, [])

  const loadRcm = async (e) => {
    e.preventDefault()
    if (!period) return
    try { const r = await complianceAPI.rcmOutstanding(period); setRcm(r.data?.data) }
    catch (err) { setRcm({ error: err.message }) }
  }

  return (
    <ModulePage title="Tax compliance" subtitle="TDS, e-invoicing, GSTR and reverse charge — one surface, not four features."
      migration="056">
      <AsyncState loading={loading} error={error}>
        <>
          <Section title={`TDS — ${summary?.financialYear || ''} ${summary?.quarter || ''}`}>
            {summary?.warning && (
              <p role="alert" style={{ border: '1px solid #cf222e', borderLeft: '4px solid #cf222e',
                background: '#ffebe9', borderRadius: 6, padding: '10px 12px', fontSize: 14 }}>
                <strong>{summary.warning}</strong>
              </p>
            )}
            <p style={{ fontSize: 15 }}>
              Total TDS deducted: <strong><Rupees value={summary?.totalTdsInr} /></strong>
            </p>
            <DataTable
              caption="TDS by section"
              emptyMessage="No deductions recorded this quarter."
              columns={[
                { key: 'section', label: 'Section' },
                { key: 'deductions', label: 'Count', numeric: true },
                { key: 'gross_paid', label: 'Gross paid', numeric: true, render: (r) => <Rupees value={r.gross_paid} /> },
                { key: 'tds_deducted', label: 'TDS', numeric: true, render: (r) => <Rupees value={r.tds_deducted} /> },
                { key: 'undeposited', label: 'Undeposited', numeric: true },
                { key: 'no_pan_cases', label: 'No PAN (20%)', numeric: true },
              ]}
              rows={summary?.bySection || []}
              rowKey={(r) => r.section}
            />
          </Section>

          <Section title="Statutory rates" description="Applied automatically. No-PAN cases attract 20% under s.206AA.">
            <DataTable
              caption="TDS rates by deductee type"
              columns={[
                { key: 'type', label: 'Deductee type' },
                { key: 'section', label: 'Section' },
                { key: 'rate', label: 'Rate %', numeric: true },
                { key: 'note', label: 'Note' },
              ]}
              rows={Object.entries(rates || {}).map(([type, v]) => ({ type, ...v }))}
              rowKey={(r) => r.type}
            />
          </Section>

          <Section title="Reverse charge outstanding"
            description="Buying from an unregistered farmer shifts GST liability to the buyer. Undischarged RCM must be paid in cash — it cannot be set off against input credit.">
            <form onSubmit={loadRcm} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <Field label="Period" id="rcm-period" hint="MM-YYYY">
                <input id="rcm-period" value={period} onChange={(e) => setPeriod(e.target.value)}
                  placeholder="08-2026" aria-describedby="rcm-period-hint" />
              </Field>
              <button type="submit">Check</button>
            </form>
            {rcm && !rcm.error && (
              <p role="status" style={{ marginTop: 10, fontSize: 15 }}>
                <Value value={rcm.items} decimals={0} /> item(s) ·{' '}
                <strong><Rupees value={rcm.liabilityInr} /></strong> outstanding
                {rcm.note && <><br /><span style={{ fontSize: 13, color: 'var(--muted,#666)' }}>{rcm.note}</span></>}
              </p>
            )}
          </Section>
        </>
      </AsyncState>
    </ModulePage>
  )
}
