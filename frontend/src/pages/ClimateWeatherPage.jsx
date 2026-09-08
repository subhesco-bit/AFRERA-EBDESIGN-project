/**
 * Domain D14 — Climate & Weather.
 *
 * This domain had no UI, no service, no route and no table until today. It is
 * also what the forward-pricing engine reads its primary inputs from, so the
 * coverage table below is not a nice-to-have: every district missing from it is
 * a district where forward prices are computed from a constant.
 */
import React, { useState, useEffect } from 'react';
import { weatherAPI } from '../services/api';
import { ModulePage, Section, Field, Value, AsyncState, DataTable } from '../components/common/DataPrimitives';

export default function ClimateWeatherPage() {
  const [coverage, setCoverage] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [districts, setDistricts] = useState('');
  const [check, setCheck] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [c, a, f] = await Promise.all([
          weatherAPI.coverage(), weatherAPI.activeAlerts(), weatherAPI.forecastAccuracy(),
        ]);
        setCoverage(c.data?.data); setAlerts(a.data?.data); setAccuracy(f.data?.data);
      } catch (e) { setError(e.response?.data?.error || e.message); } finally { setLoading(false); }
    })();
  }, []);

  const runCheck = async (e) => {
    e.preventDefault();
    const d = districts.split(',').map((s) => s.trim()).filter(Boolean);
    if (!d.length) return;
    try {
      const r = await weatherAPI.dispatchCheck(d);
      setCheck(r.data?.data);
    } catch (err) { setCheck({ error: err.message }); }
  };

  return (
    <ModulePage
      title="Climate and weather"
      subtitle="Observations, forecasts, alerts and the dispatch blocks the logistics layer reads."
      migration="057 (D14, modules M081–M090)"
    >
      <AsyncState loading={loading} error={error}>
        <>
          {alerts && alerts.blocked && (
            <div role="alert" style={{ border: '1px solid hsl(var(--destructive))', borderLeft: '4px solid hsl(var(--destructive))',
              background: 'color-mix(in srgb, hsl(var(--destructive)) 12%, transparent)', borderRadius: 6, padding: '12px 14px', marginTop: 16 }}>
              <h2 style={{ margin: '0 0 6px', fontSize: 16 }}>
                {alerts.blocks.length} alert(s) currently block dispatch
              </h2>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {alerts.blocks.map((b) => (
                  <li key={b.alert_code} style={{ marginBottom: 6 }}>
                    <strong>{b.headline}</strong> — {b.severity} · {(b.districts || []).join(', ')}
                    <br /><em>{b.recommended_action}</em>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Section title="Dispatch check" description="Before routing a consignment, check the districts it passes through.">
            <form onSubmit={runCheck} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <Field label="Districts" id="wx-districts" hint="Comma separated">
                <input id="wx-districts" value={districts} onChange={(e) => setDistricts(e.target.value)}
                  aria-describedby="wx-districts-hint" style={{ minWidth: 280 }} />
              </Field>
              <button type="submit">Check route</button>
            </form>
            {check && (
              <p role="status" style={{ marginTop: 10, fontWeight: 600,
                color: check.safe ? 'hsl(var(--data-real))' : 'hsl(var(--destructive))' }}>
                {check.safe ? 'No active dispatch blocks on these districts.' :
                  `Blocked — ${check.blocks.length} active alert(s).`}
              </p>
            )}
          </Section>

          <Section title="Weather coverage"
            description="Districts with no station are districts where forward prices rest on a fallback constant, not on observed weather.">
            {coverage?.note && (
              <p role="note" style={{ background: 'color-mix(in srgb, hsl(var(--sev-warning)) 16%, transparent)', border: '1px solid hsl(var(--sev-warning))',
                borderRadius: 6, padding: '10px 12px', fontSize: 14 }}>{coverage.note}</p>
            )}
            <p style={{ fontSize: 14 }}>
              <Value value={coverage?.total} decimals={0} /> districts covered ·{' '}
              <Value value={coverage?.currentWithinAWeek} decimals={0} /> current within a week ·{' '}
              <strong><Value value={coverage?.stale} decimals={0} /> stale</strong>
            </p>
            <DataTable
              caption="Station coverage by district"
              emptyMessage="No weather stations registered."
              columns={[
                { key: 'state', label: 'State' },
                { key: 'district', label: 'District' },
                { key: 'stations', label: 'Stations', numeric: true },
                { key: 'observations', label: 'Observations', numeric: true },
                { key: 'validated_observations', label: 'Validated', numeric: true },
                { key: 'latest', label: 'Latest' },
                { key: 'current', label: 'Current?', render: (r) => (r.current_within_a_week ? 'yes' : 'STALE') },
              ]}
              rows={coverage?.districts || []}
              rowKey={(r) => `${r.state}-${r.district}`}
            />
          </Section>

          <Section title="Forecast provider accuracy"
            description="Measured after the fact against observations, not taken from the provider's own confidence claim.">
            {Array.isArray(accuracy) && accuracy.length ? (
              <DataTable
                caption="Provider accuracy by horizon"
                columns={[
                  { key: 'provider', label: 'Provider' },
                  { key: 'horizon_days', label: 'Horizon (days)', numeric: true },
                  { key: 'scored', label: 'Scored', numeric: true },
                  { key: 'mean_rainfall_error_mm', label: 'Rain error (mm)', numeric: true },
                  { key: 'mean_temp_error_c', label: 'Temp error (°C)', numeric: true },
                  { key: 'mean_stated_confidence', label: 'Claimed %', numeric: true },
                ]}
                rows={accuracy}
                rowKey={(r) => `${r.provider}-${r.horizon_days}`}
              />
            ) : (
              <p role="status" style={{ color: 'var(--muted,#888)' }}>
                {accuracy?.note || 'No forecasts scored yet. Provider accuracy is unknown, not good.'}
              </p>
            )}
          </Section>
        </>
      </AsyncState>
    </ModulePage>
  );
}
