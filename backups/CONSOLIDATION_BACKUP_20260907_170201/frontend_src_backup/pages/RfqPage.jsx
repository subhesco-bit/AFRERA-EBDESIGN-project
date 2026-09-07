/**
 * RFQ sealed bidding, quote-loss analysis, QC holds, FPO cost centres.
 *
 * Two things this screen must get right:
 *
 *   Bids are anonymous and sealed. Showing a bidder's identity or a rival's
 *   price while bidding is open converts a sealed auction into a race, and the
 *   farmer is never the party with better information.
 *
 *   Releasing a QC hold requires a signature. The form below cannot submit
 *   without one, because the hold exists precisely so that somebody takes
 *   responsibility for overriding it.
 */
import React, { useState, useEffect } from 'react'
import { rfqAPI } from '../services/api'
import { ModulePage, Section, Field, Rupees, Value, AsyncState, DataTable } from '../components/common/DataPrimitives'

export default function RfqPage() {
  const [holds, setHolds] = useState(null)
  const [loss, setLoss] = useState(null)
  const [pnl, setPnl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [release, setRelease] = useState({ holdId: '', signature: '', justification: '' })
  const [releaseMsg, setReleaseMsg] = useState(null)

  const load = async () => {
    try {
      const [h, l, p] = await Promise.all([
        rfqAPI.activeHolds(), rfqAPI.lossAnalysis({ days: 90 }), rfqAPI.centrePnl(),
      ])
      setHolds(h.data?.data); setLoss(l.data?.data); setPnl(p.data?.data)
    } catch (e) { setError(e.response?.data?.error || e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const canRelease = release.holdId && release.signature.trim() && release.justification.trim()

  const submitRelease = async (e) => {
    e.preventDefault()
    if (!canRelease) return
    try {
      await rfqAPI.releaseQcHold({
        holdId: Number(release.holdId), signature: release.signature,
        justification: release.justification,
      })
      setReleaseMsg('Hold released and the signature recorded against it.')
      setRelease({ holdId: '', signature: '', justification: '' })
      load()
    } catch (err) { setReleaseMsg(err.response?.data?.error || err.message) }
  }

  return (
    <ModulePage title="Procurement, quality and centre performance"
      subtitle="Sealed-bid RFQs, why quotes are lost, QC holds, and centre-wise P&L."
      migration="056">
      <AsyncState loading={loading} error={error}>
        <>
          <Section title="Active QC holds"
            description="A failed lab result blocks a lot from dispatch. Only a named person with a signature can release it.">
            <DataTable
              caption="Lots currently held"
              emptyMessage="No lots on hold."
              columns={[
                { key: 'id', label: 'ID', numeric: true },
                { key: 'lot_code', label: 'Lot' },
                { key: 'hold_reason', label: 'Reason' },
                { key: 'failed_parameter', label: 'Parameter' },
                { key: 'observed_value', label: 'Observed' },
                { key: 'permitted_limit', label: 'Limit' },
                { key: 'held_at', label: 'Held since' },
              ]}
              rows={holds?.holds || []}
              rowKey={(r) => r.id}
            />

            <form onSubmit={submitRelease} style={{ marginTop: 16, display: 'flex', gap: 12,
              flexWrap: 'wrap', alignItems: 'flex-end', padding: 14, background: '#f6f8fa',
              border: '1px solid #d0d7de', borderRadius: 6 }}>
              <Field label="Hold ID" id="qc-id">
                <input id="qc-id" type="number" value={release.holdId}
                  onChange={(e) => setRelease((r) => ({ ...r, holdId: e.target.value }))} />
              </Field>
              <Field label="Signature" id="qc-sig" hint="Required — this is an override">
                <input id="qc-sig" value={release.signature} aria-describedby="qc-sig-hint"
                  onChange={(e) => setRelease((r) => ({ ...r, signature: e.target.value }))} />
              </Field>
              <Field label="Justification" id="qc-just" hint="Required">
                <input id="qc-just" value={release.justification} aria-describedby="qc-just-hint"
                  style={{ minWidth: 260 }}
                  onChange={(e) => setRelease((r) => ({ ...r, justification: e.target.value }))} />
              </Field>
              <button type="submit" disabled={!canRelease}
                title={canRelease ? 'Release this hold' : 'A signature and justification are required'}>
                Release hold
              </button>
              {releaseMsg && <p role="status" style={{ width: '100%', margin: 0 }}>{releaseMsg}</p>}
            </form>
          </Section>

          <Section title="Why quotes are lost"
            description="Conversion rate with no reason attached tells you that you are losing and nothing about what to change.">
            <p style={{ fontSize: 15 }}>
              Won <Value value={loss?.won} decimals={0} /> · Lost <Value value={loss?.lost} decimals={0} />
              {' · win rate '}
              <strong>{loss?.winRatePct === null || loss?.winRatePct === undefined
                ? 'unknown' : `${loss.winRatePct}%`}</strong>
            </p>
            {loss?.note && <p role="note" style={{ color: 'var(--muted,#888)', fontSize: 13 }}>{loss.note}</p>}
            <DataTable
              caption="Losses by reason"
              emptyMessage="No lost quotes recorded in this window."
              columns={[
                { key: 'loss_reason', label: 'Reason' },
                { key: 'losses', label: 'Count', numeric: true },
                { key: 'mean_quoted', label: 'Our price', numeric: true, render: (r) => <Rupees value={r.mean_quoted} perKg /> },
                { key: 'mean_competitor', label: 'Competitor', numeric: true, render: (r) => <Rupees value={r.mean_competitor} perKg /> },
                { key: 'mean_gap', label: 'Gap', numeric: true, render: (r) => <Rupees value={r.mean_gap} perKg /> },
              ]}
              rows={loss?.byReason || []}
              rowKey={(r) => r.loss_reason}
            />
          </Section>

          <Section title="FPO centre performance"
            description="Centre-wise P&L. An FPO-level total hides a centre being robbed; the comparison is the control.">
            {pnl?.outliers?.length > 0 && (
              <div role="alert" style={{ border: '1px solid #bc4c00', borderLeft: '4px solid #bc4c00',
                background: '#ffece5', borderRadius: 6, padding: '10px 12px', marginBottom: 12 }}>
                <strong>{pnl.outliers.length} centre(s) with wastage far above peers</strong>
                <ul style={{ margin: '6px 0 0', paddingLeft: 20, fontSize: 14 }}>
                  {pnl.outliers.map((o) => (
                    <li key={o.centre}>{o.centre} — {o.wastagePct}% wastage. {o.finding}</li>
                  ))}
                </ul>
              </div>
            )}
            <DataTable
              caption="Centre P&L"
              emptyMessage="No cost centres recorded."
              columns={[
                { key: 'centre_name', label: 'Centre' },
                { key: 'district', label: 'District' },
                { key: 'revenue_inr', label: 'Revenue', numeric: true, render: (r) => <Rupees value={r.revenue_inr} /> },
                { key: 'procurement_inr', label: 'Procurement', numeric: true, render: (r) => <Rupees value={r.procurement_inr} /> },
                { key: 'wastage_inr', label: 'Wastage', numeric: true, render: (r) => <Rupees value={r.wastage_inr} /> },
                { key: 'wastage_pct_of_procurement', label: 'Wastage %', numeric: true },
                { key: 'net_inr', label: 'Net', numeric: true, render: (r) => <Rupees value={r.net_inr} /> },
              ]}
              rows={pnl?.centres || []}
              rowKey={(r) => r.centre_id}
            />
          </Section>
        </>
      </AsyncState>
    </ModulePage>
  )
}
