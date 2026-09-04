/**
 * Competitor price intelligence.
 *
 * Writes to price_intelligence (migration 042, extended by 059) — there is no
 * separate competitor table, and an earlier draft that created one has been
 * removed.
 *
 * THREE THINGS THIS SCREEN REFUSES TO DO
 *
 *   It will not recommend a reprice on stale data. A decision made against a
 *   number that changed three weeks ago is worse than no decision, because it
 *   feels informed.
 *
 *   It will not recommend on weak product matching. Fuzzy name matching across
 *   retailers is unreliable, and repricing against the wrong basket is a
 *   self-inflicted margin cut.
 *
 *   It will not let automated collection be recorded without someone
 *   confirming the source's terms were reviewed. That is a prompt to have the
 *   conversation, not a legal opinion.
 */
import React, { useState } from 'react';
import { competitorAPI } from '../services/api';
import {
  ModulePage, Section, Field, Rupees, Value, AsyncState, DataTable,
} from '../components/common/DataPrimitives';

const METHODS = [
  ['manual_observation', 'Manual observation (someone read a price)'],
  ['published_price_list', 'Published price list'],
  ['public_api', 'Public API'],
  ['licensed_feed', 'Licensed data feed'],
  ['partner_share', 'Shared by a partner'],
  ['automated_collection', 'Automated collection'],
];

export default function CompetitivePositionPage() {
  const [obs, setObs] = useState({
    productName: '', competitor: '', channel: 'online', observedPriceInr: '',
    packSizeG: '', unit: 'pack', collectionMethod: 'manual_observation',
    sourceUrl: '', termsReviewed: false, matchConfidence: '',
  });
  const [saved, setSaved] = useState(null);
  const [saveErr, setSaveErr] = useState(null);
  const [query, setQuery] = useState({ productName: '', ourPricePerKg: '' });
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setObs((o) => ({
    ...o, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
  }));

  const needsTerms = obs.collectionMethod === 'automated_collection';
  const canSubmit = obs.productName && obs.competitor && obs.observedPriceInr &&
    (!needsTerms || (obs.termsReviewed && obs.sourceUrl));

  const submit = async (e) => {
    e.preventDefault(); setSaveErr(null); setSaved(null);
    try {
      const r = await competitorAPI.observe({
        ...obs,
        observedPriceInr: Number(obs.observedPriceInr),
        packSizeG: obs.packSizeG ? Number(obs.packSizeG) : null,
        matchConfidence: obs.matchConfidence ? Number(obs.matchConfidence) : null,
      });
      setSaved(r.data?.data);
    } catch (err) { setSaveErr(err.response?.data?.error || err.message); }
  };

  const check = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const r = await competitorAPI.position({
        productName: query.productName,
        ourPricePerKg: query.ourPricePerKg,
      });
      setPosition(r.data?.data);
    } catch (err) { setPosition({ error: err.response?.data?.error || err.message }); }
    finally { setLoading(false); }
  };

  return (
    <ModulePage
      title="Competitive position"
      subtitle="Observed competitor prices, normalised per kg, with how each was obtained recorded."
      migration="042 + 059"
    >
      <Section title="Record an observation">
        <form onSubmit={submit} style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Field label="Product" id="cp-product">
            <input id="cp-product" value={obs.productName} onChange={set('productName')} />
          </Field>
          <Field label="Competitor" id="cp-competitor">
            <input id="cp-competitor" value={obs.competitor} onChange={set('competitor')} />
          </Field>
          <Field label="Channel" id="cp-channel">
            <select id="cp-channel" value={obs.channel} onChange={set('channel')}>
              {['online', 'quick_commerce', 'modern_trade', 'local_retail', 'mandi', 'd2c']
                .map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
            </select>
          </Field>
          <Field label="Price ₹" id="cp-price">
            <input id="cp-price" type="number" step="0.01" value={obs.observedPriceInr}
              onChange={set('observedPriceInr')} />
          </Field>
          <Field label="Pack size (g)" id="cp-pack" hint="Leave blank if priced per kg">
            <input id="cp-pack" type="number" value={obs.packSizeG} onChange={set('packSizeG')}
              aria-describedby="cp-pack-hint" />
          </Field>
          <Field label="Match confidence" id="cp-conf" hint="0 to 1 — how sure is this the same product?">
            <input id="cp-conf" type="number" step="0.05" min="0" max="1"
              value={obs.matchConfidence} onChange={set('matchConfidence')}
              aria-describedby="cp-conf-hint" />
          </Field>
          <Field label="How obtained" id="cp-method">
            <select id="cp-method" value={obs.collectionMethod} onChange={set('collectionMethod')}>
              {METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>

          {needsTerms && (
            <div style={{ width: '100%', border: '1px solid hsl(var(--sev-warning))', background: 'color-mix(in srgb, hsl(var(--sev-warning)) 16%, transparent)',
              borderRadius: 6, padding: '12px 14px' }}>
              <p style={{ margin: '0 0 8px', fontSize: 14 }}>
                <strong>Automated collection.</strong> Many retailers prohibit this in their
                terms of use, and the position varies by jurisdiction and by whether the data
                sits behind a login. This is a prompt to have that conversation before the
                platform is collecting at volume, not a legal opinion.
              </p>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <Field label="Source URL" id="cp-url">
                  <input id="cp-url" value={obs.sourceUrl} onChange={set('sourceUrl')}
                    style={{ minWidth: 320 }} />
                </Field>
                <label htmlFor="cp-terms" style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 14 }}>
                  <input id="cp-terms" type="checkbox" checked={obs.termsReviewed}
                    onChange={set('termsReviewed')} />
                  I have reviewed this source&apos;s terms of use
                </label>
              </div>
            </div>
          )}

          <button type="submit" disabled={!canSubmit}
            title={canSubmit ? 'Record' : 'Automated collection requires a source URL and a terms review'}>
            Record observation
          </button>
        </form>

        {saveErr && <p role="alert" style={{ color: 'hsl(var(--destructive))', marginTop: 10 }}>{saveErr}</p>}
        {saved && (
          <p role="status" style={{ marginTop: 10, fontSize: 14 }}>
            Recorded. {saved.note || ''}
            {saved.pricePerKgInr && (
              <> Normalised to <strong><Rupees value={saved.pricePerKgInr} perKg /></strong>.</>
            )}
          </p>
        )}
      </Section>

      <Section title="Where do we sit?">
        <form onSubmit={check} style={{ display: 'flex', gap: 14, alignItems: 'flex-end' }}>
          <Field label="Product" id="cp-q-product">
            <input id="cp-q-product" value={query.productName}
              onChange={(e) => setQuery((q) => ({ ...q, productName: e.target.value }))} />
          </Field>
          <Field label="Our price ₹/kg" id="cp-q-price">
            <input id="cp-q-price" type="number" value={query.ourPricePerKg}
              onChange={(e) => setQuery((q) => ({ ...q, ourPricePerKg: e.target.value }))} />
          </Field>
          <button type="submit">Compare</button>
        </form>

        <AsyncState loading={loading} error={position?.error}
          empty={position && !position.error && position.observations === 0}
          emptyMessage={position?.note}>
          {position && !position.error && position.observations > 0 && (
            <div style={{ marginTop: 16 }}>
              {position.stale && (
                <div role="alert" style={{ border: '1px solid hsl(var(--sev-critical))', borderLeft: '4px solid hsl(var(--sev-critical))',
                  background: 'color-mix(in srgb, hsl(var(--sev-critical)) 12%, transparent)', borderRadius: 6, padding: '10px 12px', marginBottom: 12 }}>
                  <strong>No recommendation — data is stale.</strong>
                  <p style={{ margin: '4px 0 0', fontSize: 14 }}>{position.note}</p>
                </div>
              )}
              {!position.stale && !position.recommendation && position.note && (
                <div role="note" style={{ border: '1px solid hsl(var(--sev-info))', borderLeft: '4px solid hsl(var(--sev-info))',
                  background: 'color-mix(in srgb, hsl(var(--sev-info)) 12%, transparent)', borderRadius: 6, padding: '10px 12px', marginBottom: 12 }}>
                  <strong>No recommendation.</strong>
                  <p style={{ margin: '4px 0 0', fontSize: 14 }}>{position.note}</p>
                </div>
              )}

              <DataTable
                caption="Observed competitor prices, per kg"
                columns={[
                  { key: 'observations', label: 'Observations', numeric: true },
                  { key: 'competitors', label: 'Competitors', numeric: true },
                  { key: 'lowest_per_kg', label: 'Lowest', numeric: true,
                    render: (r) => <Rupees value={r.lowest_per_kg} perKg /> },
                  { key: 'mean_per_kg', label: 'Mean', numeric: true,
                    render: (r) => <Rupees value={r.mean_per_kg} perKg /> },
                  { key: 'highest_per_kg', label: 'Highest', numeric: true,
                    render: (r) => <Rupees value={r.highest_per_kg} perKg /> },
                  { key: 'mean_match_confidence', label: 'Match conf.', numeric: true,
                    render: (r) => <Value value={r.mean_match_confidence} decimals={2} emptyLabel="—" /> },
                ]}
                rows={[position]}
                rowKey={() => 'pos'}
              />

              {position.gapVsMeanPct !== null && position.gapVsMeanPct !== undefined && (
                <p style={{ marginTop: 14, fontSize: 15 }}>
                  Our <Rupees value={position.ourPricePerKg} perKg /> is{' '}
                  <strong>{position.gapVsMeanPct > 0 ? '+' : ''}{position.gapVsMeanPct}%</strong>{' '}
                  against the observed mean — {position.position}.
                </p>
              )}
              {position.recommendation && (
                <p style={{ marginTop: 8, fontSize: 14 }}><strong>{position.recommendation}</strong></p>
              )}
              <p style={{ marginTop: 10, fontSize: 12, color: 'var(--muted,#888)' }}>
                {position.caveat}
              </p>
            </div>
          )}
        </AsyncState>
      </Section>
    </ModulePage>
  );
}
