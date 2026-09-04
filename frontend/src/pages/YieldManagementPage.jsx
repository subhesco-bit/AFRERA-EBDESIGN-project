/**
 * Yield management — perishable inventory priced against time and stock.
 *
 * The airline mechanism, applied to produce. Two things this screen must make
 * impossible to miss:
 *
 *   The farmer floor is a hard stop. When markdown hits it, the screen says so
 *   explicitly. A discount that appears to keep falling teaches a buyer to wait,
 *   and a floor nobody can see is not a floor anyone trusts.
 *
 *   A thin booking curve is labelled as an anecdote. Airlines build curves on
 *   thousands of departures; three lots is not a model, and a UI that renders
 *   both as the same chart invites the same confidence in both.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { yieldAPI } from '../services/api';
import {
  ModulePage, Section, Field, Rupees, Value, AsyncState, DataTable,
} from '../components/common/DataPrimitives';

export default function YieldManagementPage() {
  const [attention, setAttention] = useState(null);
  const [lotCode, setLotCode] = useState('');
  const [price, setPrice] = useState(null);
  const [curve, setCurve] = useState(null);
  const [cropKey, setCropKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);

  const loadAttention = useCallback(async () => {
    try {
      const r = await yieldAPI.lotsNeedingAttention({ withinDays: 7 });
      setAttention(r.data?.data);
    } catch (e) { setError(e.response?.data?.error || e.message); } finally { setLoading(false); }
  }, []);
  useEffect(() => { loadAttention(); }, [loadAttention]);

  const checkPrice = async (e) => {
    e.preventDefault();
    if (!lotCode) return;
    setMsg(null);
    try { const r = await yieldAPI.lotPrice(lotCode); setPrice(r.data?.data); }
    catch (err) { setPrice(null); setMsg(err.response?.data?.error || err.message); }
  };

  const openBucket = async () => {
    if (!lotCode) return;
    try {
      const r = await yieldAPI.openNextBucket(lotCode);
      setMsg(r.data?.data?.note);
      checkPrice({ preventDefault() {} });
    } catch (err) { setMsg(err.response?.data?.error || err.message); }
  };

  const loadCurve = async (e) => {
    e.preventDefault();
    if (!cropKey) return;
    try { const r = await yieldAPI.bookingCurve(cropKey); setCurve(r.data?.data); }
    catch (err) { setCurve(null); setMsg(err.response?.data?.error || err.message); }
  };

  return (
    <ModulePage
      title="Yield management"
      subtitle="Pricing perishable inventory against time remaining and stock unsold — the airline mechanism, bounded by the farmer floor."
      migration="059"
    >
      <AsyncState loading={loading} error={error}>
        <>
          <Section title="Lots needing a decision"
            description="Approaching expiry with stock left. The alternative to a discount here is not a lower price — it is a total loss plus disposal, with the farmer floor still owed.">
            <DataTable
              caption="Lots expiring within 7 days"
              emptyMessage="No lots approaching expiry."
              columns={[
                { key: 'lot_code', label: 'Lot' },
                { key: 'crop_key', label: 'Crop' },
                { key: 'days_to_expiry', label: 'Days left', numeric: true },
                { key: 'lot_size_kg', label: 'Size (kg)', numeric: true,
                  render: (r) => <Value value={r.lot_size_kg} decimals={0} /> },
                { key: 'pctSold', label: 'Sold %', numeric: true,
                  render: (r) => <Value value={r.pctSold} decimals={1} /> },
                { key: 'atRiskKg', label: 'At risk (kg)', numeric: true,
                  render: (r) => <Value value={r.atRiskKg} decimals={0} /> },
                { key: 'farmer_floor_inr_per_kg', label: 'Floor', numeric: true,
                  render: (r) => <Rupees value={r.farmer_floor_inr_per_kg} perKg /> },
                { key: 'urgency', label: 'Urgency' },
              ]}
              rows={attention?.lots || []}
              rowKey={(r) => r.lot_code}
            />
            {attention?.note && (
              <p style={{ fontSize: 13, color: 'var(--muted,#666)', marginTop: 8 }}>{attention.note}</p>
            )}
          </Section>

          <Section title="Price a lot now">
            <form onSubmit={checkPrice} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <Field label="Lot code" id="ym-lot">
                <input id="ym-lot" value={lotCode} onChange={(e) => setLotCode(e.target.value)} />
              </Field>
              <button type="submit">Get current price</button>
              <button type="button" onClick={openBucket} disabled={!lotCode}>Open next bucket</button>
            </form>
            {msg && <p role="status" style={{ marginTop: 10, fontSize: 14 }}>{msg}</p>}

            {price && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'baseline' }}>
                  <div>
                    <span style={{ fontSize: 12, color: 'var(--muted,#888)', display: 'block' }}>Price now</span>
                    <strong style={{ fontSize: 26 }}><Rupees value={price.priceInrPerKg} perKg /></strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 12, color: 'var(--muted,#888)', display: 'block' }}>List</span>
                    <Rupees value={price.listPriceInrPerKg} perKg />
                  </div>
                  <div>
                    <span style={{ fontSize: 12, color: 'var(--muted,#888)', display: 'block' }}>Farmer floor</span>
                    <Rupees value={price.farmerFloorInrPerKg} perKg />
                  </div>
                  <div>
                    <span style={{ fontSize: 12, color: 'var(--muted,#888)', display: 'block' }}>Discount</span>
                    <strong>{price.discountPct}%</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 12, color: 'var(--muted,#888)', display: 'block' }}>Days left</span>
                    <strong>{price.daysToExpiry}</strong>
                  </div>
                </div>

                {price.floorApplied && (
                  <div role="note" style={{ marginTop: 14, border: '1px solid hsl(var(--data-real))',
                    borderLeft: '4px solid hsl(var(--data-real))', background: 'color-mix(in srgb, hsl(var(--data-real)) 12%, transparent)', borderRadius: 6,
                    padding: '10px 12px' }}>
                    <strong>Markdown stopped at the farmer floor.</strong>
                    <p style={{ margin: '4px 0 0', fontSize: 14 }}>{price.floorNote}</p>
                  </div>
                )}

                {price.unallocatedKg > 0 && (
                  <p role="alert" style={{ marginTop: 12, color: 'hsl(var(--sev-critical))', fontSize: 14 }}>
                    <strong><Value value={price.unallocatedKg} unit="kg" decimals={0} /> is unallocated</strong>
                    {' '}— no bucket covers it, so nobody can buy it.
                  </p>
                )}

                {price.activeBucket && (
                  <p style={{ marginTop: 12, fontSize: 14 }}>
                    Open bucket <strong>{price.activeBucket.code}</strong> at{' '}
                    <Rupees value={price.activeBucket.price} perKg />,{' '}
                    <Value value={price.activeBucket.remainingKg} unit="kg" decimals={0} /> remaining.
                  </p>
                )}

                <h3 style={{ fontSize: 14, marginTop: 18, marginBottom: 6 }}>Why this price</h3>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14 }}>
                  {(price.reasoning || []).map((r) => <li key={r}>{r}</li>)}
                </ul>
              </div>
            )}
          </Section>

          <Section title="Booking curve"
            description="How much of a lot is typically sold with N days remaining. Learned from observed sales, never assumed.">
            <form onSubmit={loadCurve} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <Field label="Crop key" id="ym-crop">
                <input id="ym-crop" value={cropKey} onChange={(e) => setCropKey(e.target.value)}
                  placeholder="lakadong_turmeric" />
              </Field>
              <button type="submit">Load curve</button>
            </form>
            {curve?.note && (
              <p role="note" style={{ marginTop: 12, background: 'color-mix(in srgb, hsl(var(--sev-warning)) 16%, transparent)',
                border: '1px solid hsl(var(--sev-warning))', borderRadius: 6, padding: '10px 12px', fontSize: 14 }}>
                {curve.note}
              </p>
            )}
            {curve?.points?.length > 0 && (
              <DataTable
                caption="Learned booking curve"
                columns={[
                  { key: 'days_to_expiry', label: 'Days to expiry', numeric: true },
                  { key: 'observations', label: 'Observations', numeric: true },
                  { key: 'mean_pct_sold', label: 'Mean % sold', numeric: true },
                  { key: 'stddev_pct_sold', label: 'Std dev', numeric: true,
                    render: (r) => <Value value={r.stddev_pct_sold} decimals={1} emptyLabel="—" /> },
                  { key: 'mean_realised_price', label: 'Mean price', numeric: true,
                    render: (r) => <Rupees value={r.mean_realised_price} perKg /> },
                  { key: 'statistically_usable', label: 'Usable?',
                    render: (r) => (r.statistically_usable ? 'yes' : 'anecdote — under 10 obs') },
                ]}
                rows={curve.points}
                rowKey={(r) => r.days_to_expiry}
              />
            )}
          </Section>
        </>
      </AsyncState>
    </ModulePage>
  );
}
