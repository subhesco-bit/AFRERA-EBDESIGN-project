/**
 * FOLU land use, carbon and NE organic scheme status.
 *
 * THE DISTINCTION THIS SCREEN EXISTS TO PRESERVE
 *
 * Jhum — shifting cultivation — is a rotation, not deforestation. The fallow is
 * part of the system and has been roughly carbon-neutral over its cycle for
 * centuries. A dashboard that counts every jhum clearing as forest loss will
 * paint the North East as catastrophically deforesting while describing normal
 * practice, and that misreading has real consequences for the people doing it.
 *
 * What genuinely matters is the CYCLE LENGTH. A shortening cycle means the
 * fallow no longer restores what the clearing removed — that is degradation,
 * and that is the number this page puts in front of you.
 */
import React, { useState, useEffect } from 'react'
import { foluAPI } from '../services/api'
import {
  ModulePage, Section, Field, Value, ProvenanceBadge, AsyncState, DataTable,
} from '../components/common/DataPrimitives'

export default function LandUseCarbonPage() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState({ state: '', district: '' })

  const load = async (params = {}) => {
    setLoading(true)
    try {
      const r = await foluAPI.landUseSummary(params)
      setSummary(r.data?.data)
    } catch (e) { setError(e.response?.data?.error || e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  return (
    <ModulePage
      title="Land use and carbon"
      subtitle="Land-use classes, transitions and carbon estimates — with jhum treated as a rotation, not as forest loss."
      migration="991 (FOLU)"
    >
      <Section title="Filter">
        <form onSubmit={(e) => { e.preventDefault(); load(filter) }}
          style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <Field label="State" id="folu-state">
            <input id="folu-state" value={filter.state}
              onChange={(e) => setFilter((f) => ({ ...f, state: e.target.value }))} />
          </Field>
          <Field label="District" id="folu-district">
            <input id="folu-district" value={filter.district}
              onChange={(e) => setFilter((f) => ({ ...f, district: e.target.value }))} />
          </Field>
          <button type="submit">Apply</button>
        </form>
      </Section>

      <AsyncState loading={loading} error={error}>
        <>
          {summary?.jhumNote && (
            <div role="note" style={{
              border: '1px solid #0969da', borderLeft: '4px solid #0969da',
              background: '#ddf4ff', borderRadius: 6, padding: '12px 14px', marginTop: 18,
            }}>
              <p style={{ margin: 0, fontWeight: 600 }}>On jhum cultivation</p>
              <p style={{ margin: '6px 0 0', fontSize: 14 }}>{summary.jhumNote}</p>
            </div>
          )}

          <Section title="Land use by class">
            <DataTable
              caption="Parcels and area by land-use class"
              emptyMessage="No land parcels registered."
              columns={[
                { key: 'land_use_class', label: 'Class' },
                { key: 'parcels', label: 'Parcels', numeric: true },
                { key: 'area_ha', label: 'Area (ha)', numeric: true,
                  render: (r) => <Value value={r.area_ha} decimals={2} /> },
                { key: 'mean_forest_cover_pct', label: 'Forest cover %', numeric: true,
                  render: (r) => <Value value={r.mean_forest_cover_pct} decimals={1} /> },
                { key: 'mean_jhum_cycle_years', label: 'Jhum cycle (yrs)', numeric: true,
                  render: (r) => <Value value={r.mean_jhum_cycle_years} decimals={1} emptyLabel="n/a" /> },
              ]}
              rows={summary?.byLandUse || []}
              rowKey={(r) => r.land_use_class}
            />
          </Section>

          <Section title="Land-use change"
            description="is_deforestation is derived from the transition itself, not set by whoever entered the record.">
            {summary?.changes && (
              <p style={{ fontSize: 15 }}>
                <Value value={summary.changes.total_changes} decimals={0} /> recorded transitions ·{' '}
                <strong><Value value={summary.changes.deforestation_events} decimals={0} /></strong>{' '}
                classified as deforestation ·{' '}
                <Value value={summary.changes.deforested_ha} unit="ha" decimals={2} /> affected
              </p>
            )}
          </Section>

          <Section title="Carbon estimates"
            description="Every estimate carries its IPCC tier. Tier 1 uses global default factors and can be wrong by a factor of two for a specific North East hill soil — it is not sufficient evidence for a carbon credit claim.">
            <p style={{ fontSize: 13, color: 'var(--muted,#888)' }}>
              Estimates are recorded per parcel per year with an explicit uncertainty
              percentage and provenance <ProvenanceBadge provenance="assumed" />, because
              the default factors are assumptions until local measurement replaces them.
            </p>
          </Section>
        </>
      </AsyncState>
    </ModulePage>
  )
}
