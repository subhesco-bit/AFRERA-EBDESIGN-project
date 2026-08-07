/**
 * Landed cost, regional demand and revenue.
 *
 * The landed-cost model is labelled as a PLAN throughout. It comes from a
 * business plan, its rows are flagged estimated/assumed, and presenting it
 * alongside recorded actuals without that distinction would let a projection be
 * quoted to a buyer as a cost.
 */
import React, { useState, useEffect } from 'react'
import { economicAPI } from '../services/api'
import {
  ModulePage, Section, Field, Rupees, Value, ProvenanceBadge, AsyncState, DataTable,
} from '../components/common/DataPrimitives'

export default function CorridorEconomicsPage() {
  const [model, setModel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [commodity, setCommodity] = useState('')
  const [signal, setSignal] = useState(null)

  useEffect(() => {
    (async () => {
      try {
        const r = await economicAPI.corridorModel('NE->NCR')
        setModel(r.data?.data)
      } catch (e) { setError(e.response?.data?.error || e.message) } finally { setLoading(false) }
    })()
  }, [])

  const readMandi = async (e) => {
    e.preventDefault()
    if (!commodity) return
    try { const r = await economicAPI.mandiSignal({ commodity, days: 30 }); setSignal(r.data?.data) }
    catch (err) { setSignal({ error: err.message }) }
  }

  return (
    <ModulePage title="Corridor economics"
      subtitle="Where the money goes between a farmgate in the North East and a doorstep in the NCR."
      migration="052 / 055">
      <AsyncState loading={loading} error={error}>
        <>
          <Section title="Landed cost model">
            <p role="note" style={{ background: '#fff8c5', border: '1px solid #d4a72c66',
              borderRadius: 6, padding: '10px 12px', fontSize: 14 }}>
              <strong>Planning model, not observed cost.</strong> {model?.caveat}
            </p>
            <p style={{ fontSize: 16, marginTop: 14 }}>
              <Rupees value={model?.totals?.min} perKg /> {' / '}
              <strong><Rupees value={model?.totals?.optimised} perKg /></strong> {' / '}
              <Rupees value={model?.totals?.max} perKg />
              <span style={{ fontSize: 13, color: 'var(--muted,#888)' }}> min / optimised / max</span>
            </p>
            <DataTable
              caption="Cost components, largest first"
              emptyMessage="No landed-cost model recorded."
              columns={[
                { key: 'component', label: 'Component' },
                { key: 'optimised_inr_per_kg', label: 'Optimised', numeric: true,
                  render: (r) => <Rupees value={r.optimised_inr_per_kg} perKg /> },
                { key: 'pctOfOptimisedTotal', label: '% of total', numeric: true,
                  render: (r) => <Value value={r.pctOfOptimisedTotal} unit="%" decimals={1} /> },
                { key: 'subsidy_scheme', label: 'Subsidy', render: (r) => r.subsidy_scheme || '—' },
                { key: 'data_provenance', label: 'Provenance',
                  render: (r) => <ProvenanceBadge provenance={r.data_provenance} /> },
              ]}
              rows={[...(model?.components || [])].sort(
                (a, b) => Number(b.optimised_inr_per_kg) - Number(a.optimised_inr_per_kg)
              )}
              rowKey={(r) => r.sequence_no}
            />
          </Section>

          <Section title="Mandi signal"
            description="Arrivals and modal price from the market feed. A regional signal, not a quote.">
            <form onSubmit={readMandi} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <Field label="Commodity" id="mandi-commodity">
                <input id="mandi-commodity" value={commodity}
                  onChange={(e) => setCommodity(e.target.value)} placeholder="turmeric" />
              </Field>
              <button type="submit">Read market</button>
            </form>
            {signal && !signal.error && (
              <div role="status" style={{ marginTop: 12, fontSize: 15 }}>
                {signal.observations === 0 ? (
                  <p style={{ color: 'var(--muted,#888)' }}>{signal.note}</p>
                ) : (
                  <>
                    <p style={{ margin: 0 }}>
                      Recent mean <Rupees value={signal.meanModalRecent} />/qtl vs earlier{' '}
                      <Rupees value={signal.meanModalEarlier} />/qtl{' · '}
                      <strong>{signal.changePct}%</strong>
                    </p>
                    <p style={{ margin: '6px 0 0', fontWeight: 600 }}>{signal.signal}</p>
                    <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--muted,#666)' }}>
                      {signal.caveat}
                    </p>
                  </>
                )}
              </div>
            )}
          </Section>
        </>
      </AsyncState>
    </ModulePage>
  )
}
