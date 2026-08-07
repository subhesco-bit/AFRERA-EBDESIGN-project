/**
 * Advance Rate Pricing — forward curve, commitment advice, basis.
 *
 * Renders migration 051 / riskPricingService. Until now this had no UI at all:
 * the master index reported it NO_UI, meaning a working service nothing showed.
 *
 * THE THING THIS SCREEN MUST NOT DO
 *
 * It must not present a forward price as a single number, and it must not
 * hide a refusal. The engine declines to advise when a district is
 * uncalibrated — "advising a farmer to commit a quantity on this basis would
 * be guessing with someone else's harvest" — and a UI that renders that as an
 * empty state, or falls back to showing the central figure anyway, quietly
 * removes the one safeguard the model has.
 */

import React, { useState, useCallback } from 'react'
import { pricingAPI, weatherAPI } from '../services/api'
import {
  ModulePage, Section, Field, Band, Rupees, Value, ProvenanceBadge,
  ConfidenceMeter, RefusalNotice, AsyncState, DataTable,
} from '../components/common/DataPrimitives'

const CROPS = [
  { key: 'lakadong_turmeric', name: 'Lakadong Turmeric' },
  { key: 'chakhao_rice', name: 'Chak-Hao Black Rice' },
  { key: 'naga_mircha', name: 'Naga Mircha' },
  { key: 'kaji_nemu', name: 'Kaji Nemu' },
]

export default function ForwardPricingPage() {
  const [form, setForm] = useState({
    crop: 'lakadong_turmeric', months: 6, spot: 180,
    state: 'Meghalaya', district: 'East Khasi Hills',
    qtyKg: 5000, floorPerKg: 150, participationShare: 0.6, cashUrgency: 0.5,
  })
  const [rate, setRate] = useState(null)
  const [advice, setAdvice] = useState(null)
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const run = useCallback(async () => {
    setLoading(true); setError(null); setRate(null); setAdvice(null)
    try {
      // Pull real weather for the district first. The engine falls back to a
      // hard-coded constant when this is missing, and the farmer should be able
      // to see which of the two produced their number.
      let w = null
      try {
        const wr = await weatherAPI.forArp({
          state: form.state, district: form.district, days: 120,
        })
        w = wr.data?.data ?? null
      } catch {
        w = null
      }
      setWeather(w)

      const r = await pricingAPI.forward({
        crop: form.crop, months: form.months, spot: form.spot,
        state: form.state, district: form.district,
        ...(w && w.calibrated
          ? { rainfall: w.rainfallMm, temp: w.meanTempC, heatDays: w.heatDaysAboveThresh }
          : {}),
      })
      setRate(r.data?.data ?? null)

      const a = await pricingAPI.advise({
        cropKey: form.crop, state: form.state, district: form.district,
        qtyKg: Number(form.qtyKg), floorPerKg: Number(form.floorPerKg),
        participationShare: Number(form.participationShare),
        spotPerKg: Number(form.spot), monthsAhead: Number(form.months),
        cashUrgency: Number(form.cashUrgency),
      })
      setAdvice(a.data?.data ?? null)
    } catch (e) {
      setError(e.response?.data?.error || e.message)
    } finally {
      setLoading(false)
    }
  }, [form])

  const declined = advice && advice.advice === 'NO RECOMMENDATION'

  return (
    <ModulePage
      title="Forward pricing and commitment advice"
      subtitle="What a forward commitment on an unharvested crop is worth, and how much of it is sensible to commit."
      migration="051 (ARP)"
    >
      <Section title="Inputs">
        <form
          onSubmit={(e) => { e.preventDefault(); run() }}
          style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}
        >
          <Field label="Crop" id="fp-crop">
            <select id="fp-crop" value={form.crop} onChange={set('crop')}>
              {CROPS.map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="State" id="fp-state">
            <input id="fp-state" value={form.state} onChange={set('state')} />
          </Field>
          <Field label="District" id="fp-district" hint="Calibration is per district">
            <input id="fp-district" value={form.district} onChange={set('district')} aria-describedby="fp-district-hint" />
          </Field>
          <Field label="Months ahead" id="fp-months">
            <input id="fp-months" type="number" min="1" max="24" value={form.months} onChange={set('months')} />
          </Field>
          <Field label="Spot ₹/kg" id="fp-spot">
            <input id="fp-spot" type="number" min="1" value={form.spot} onChange={set('spot')} />
          </Field>
          <Field label="Quantity (kg)" id="fp-qty">
            <input id="fp-qty" type="number" min="1" value={form.qtyKg} onChange={set('qtyKg')} />
          </Field>
          <Field label="Floor ₹/kg" id="fp-floor">
            <input id="fp-floor" type="number" min="1" value={form.floorPerKg} onChange={set('floorPerKg')} />
          </Field>
          <Field label="Upside share" id="fp-share" hint="0 to 1">
            <input id="fp-share" type="number" step="0.05" min="0" max="1"
              value={form.participationShare} onChange={set('participationShare')}
              aria-describedby="fp-share-hint" />
          </Field>
          <Field label="Cash urgency" id="fp-urgency" hint="0 = can wait, 1 = need cash now">
            <input id="fp-urgency" type="number" step="0.1" min="0" max="1"
              value={form.cashUrgency} onChange={set('cashUrgency')}
              aria-describedby="fp-urgency-hint" />
          </Field>
          <button type="submit" disabled={loading}>
            {loading ? 'Calculating…' : 'Calculate'}
          </button>
        </form>
      </Section>

      <AsyncState loading={loading} error={error} empty={!rate && !advice && !loading}
        emptyMessage="Enter the details above and calculate.">
        <>
          {weather && (
            <Section title="Weather behind this number"
              description="The yield model takes rainfall, mean temperature and heat-stress days as its primary inputs.">
              {weather.calibrated ? (
                <p style={{ fontSize: 14 }}>
                  <strong>{weather.observations}</strong> observations over {weather.days} days
                  {' · '}rainfall <Value value={weather.rainfallMm} unit="mm" decimals={1} />
                  {' · '}mean temp <Value value={weather.meanTempC} unit="°C" decimals={1} />
                  {' · '}<Value value={weather.heatDaysAboveThresh} decimals={0} /> heat-stress days
                </p>
              ) : (
                <div role="note" style={{ background: '#fff8c5', border: '1px solid #d4a72c66',
                  borderRadius: 6, padding: '10px 12px', fontSize: 14 }}>
                  <strong>No usable weather for this district.</strong>
                  <p style={{ margin: '4px 0 0' }}>{weather.note}</p>
                  <p style={{ margin: '6px 0 0' }}>
                    The forward price below is computed from a fallback constant, not from
                    observed weather for {form.district}.
                  </p>
                </div>
              )}
            </Section>
          )}

          {rate && (
            <Section title="Forward curve"
              description={`Delivery ${rate.deliveryMonth || rate.monthsAhead + ' months ahead'} · method ${rate.method}`}>
              <Band low={rate.low} central={rate.central} high={rate.high} bandPct={rate.band} />
              <p style={{ marginTop: 12, fontSize: 14 }}>
                Spot today <Rupees value={rate.spot} perKg />
                {' · '}yield index <Value value={rate.yieldIndex} decimals={2} />
                {' · '}<ProvenanceBadge provenance={rate.parameterProvenance} />
              </p>
              <div style={{ marginTop: 12, padding: '10px 12px', background: '#f6f8fa',
                border: '1px solid #d0d7de', borderRadius: 6 }}>
                <p style={{ margin: 0, fontSize: 14 }}>
                  <strong>Safe advance ceiling: <Rupees value={rate.advanceCeiling} perKg /></strong>
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted,#666)' }}>
                  80% of the LOW end of the band, not the central figure. An advance sized
                  against the central price leaves the farmer owing money if the market
                  lands anywhere in the lower half of its own forecast range.
                </p>
              </div>
              {rate.warning && (
                <p role="note" style={{ marginTop: 10, color: '#9a6700', fontSize: 13 }}>
                  <strong>Note:</strong> {rate.warning}
                </p>
              )}
              <p style={{ marginTop: 10 }}>
                <ConfidenceMeter confidence={rate.confidence} kind="district calibration" />
              </p>
            </Section>
          )}

          {declined && (
            <Section title="Commitment advice">
              <RefusalNotice reason={advice.declinedReason} whatWouldHelp={advice.whatWouldHelp} />
            </Section>
          )}

          {advice && !declined && (
            <Section title="Commitment advice" description={advice.advice}>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 14 }}>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--muted,#888)', display: 'block' }}>Commit now</span>
                  <strong style={{ fontSize: 26 }}>{advice.commitPct}%</strong>
                  <span style={{ fontSize: 13, display: 'block' }}>
                    <Value value={advice.commitKg} unit="kg" decimals={0} />
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--muted,#888)', display: 'block' }}>Hold</span>
                  <strong style={{ fontSize: 26 }}>{100 - advice.commitPct}%</strong>
                  <span style={{ fontSize: 13, display: 'block' }}>
                    <Value value={advice.holdKg} unit="kg" decimals={0} />
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--muted,#888)', display: 'block' }}>
                    Max holdable (shelf life)
                  </span>
                  <strong style={{ fontSize: 26 }}>{advice.maxHoldPct}%</strong>
                  <span style={{ fontSize: 13, display: 'block', color: 'var(--muted,#888)' }}>hard cap</span>
                </div>
              </div>

              <DataTable
                caption="How the recommendation was reached"
                columns={[
                  { key: 'factor', label: 'Factor' },
                  { key: 'weight', label: 'Weight' },
                  { key: 'reading', label: 'Reading' },
                ]}
                rows={advice.reasoning || []}
                rowKey={(r) => r.factor}
              />

              {advice.valuation && (
                <p style={{ marginTop: 14, fontSize: 14 }}>
                  Floor <Rupees value={advice.valuation.floorPerKg} perKg />
                  {' + '}upside option worth <Rupees value={advice.valuation.optionValuePerKg} perKg />
                  {' → expected '}<strong><Rupees value={advice.valuation.farmerExpectedPerKg} perKg /></strong>
                </p>
              )}
              <p style={{ fontSize: 12, color: 'var(--muted,#888)', marginTop: 10 }}>
                {advice.valuation?.method}
              </p>
            </Section>
          )}
        </>
      </AsyncState>
    </ModulePage>
  )
}
