/**
 * Weather Analytics Page
 * Weather monitoring and analytics for agricultural planning
 */

import { useEffect, useState } from 'react';
import { AlertTriangle, CloudSun, RefreshCw } from 'lucide-react';
import { weatherAPI } from '../services/api';

const asList = (value) => {
  if (Array.isArray(value)) return value;
  return value?.data || value?.results || value?.alerts || value?.triggers || [];
};

const displayValue = (value) => (value === null || value === undefined ? 'Not provided' : String(value));

export default function WeatherAnalyticsPage() {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [districts, setDistricts] = useState('');
  const [actionState, setActionState] = useState({ loading: false, message: '' });

  const load = () => {
    setState({ loading: true, error: null, data: null });
    Promise.all([weatherAPI.coverage(), weatherAPI.activeAlerts(), weatherAPI.forecastAccuracy(), weatherAPI.advisoryTriggers()])
      .then(([coverage, alerts, accuracy, triggers]) => setState({ loading: false, error: null, data: { coverage: coverage.data, alerts: alerts.data, accuracy: accuracy.data, triggers: triggers.data } }))
      .catch((error) => setState({ loading: false, error: error.message || 'Weather data could not be loaded.', data: null }));
  };

  useEffect(() => { load(); }, []);

  const checkDispatch = async (event) => {
    event.preventDefault();
    const values = districts.split(',').map((item) => item.trim()).filter(Boolean);
    if (!values.length) return;
    setActionState({ loading: true, message: '' });
    try {
      const response = await weatherAPI.dispatchCheck(values);
      setActionState({ loading: false, message: `Dispatch check returned ${asList(response.data).length} record(s).` });
    } catch (error) {
      setActionState({ loading: false, message: error.message || 'Dispatch check failed.' });
    }
  };

  if (state.loading) return <main className="p-6" aria-busy="true"><p>Loading weather analytics...</p></main>;
  if (state.error) return <main className="p-6"><p role="alert">{state.error}</p><button type="button" onClick={load}><RefreshCw size={16} aria-hidden="true" /> Retry</button></main>;
  const { coverage, alerts, accuracy, triggers } = state.data;
  const hasData = coverage || asList(alerts).length || accuracy || asList(triggers).length;
  return <main className="space-y-6 p-6">
    <header><div className="flex items-center gap-2"><CloudSun aria-hidden="true" /><h1 className="text-2xl font-semibold">Weather Analytics</h1></div><p className="text-sm">Operational weather data returned by the weather service.</p></header>
    {!hasData && <p role="status">No weather data is available.</p>}
    {hasData && <section className="grid gap-4 md:grid-cols-2" aria-label="Weather data">
      <article><h2>Coverage</h2><pre>{JSON.stringify(coverage, null, 2)}</pre></article>
      <article><h2>Forecast accuracy</h2><pre>{JSON.stringify(accuracy, null, 2)}</pre></article>
      <article><h2><AlertTriangle size={16} aria-hidden="true" /> Active alerts ({asList(alerts).length})</h2>{asList(alerts).length ? asList(alerts).map((item, index) => <p key={item.id || index}>{displayValue(item.title || item.message || item.type || item.id)}</p>) : <p>No active alerts.</p>}</article>
      <article><h2>Advisory triggers ({asList(triggers).length})</h2>{asList(triggers).length ? asList(triggers).map((item, index) => <p key={item.id || index}>{displayValue(item.title || item.message || item.type || item.id)}</p>) : <p>No advisory triggers.</p>}<p className="text-sm">Advisory signals are informational and require human review.</p></article>
    </section>}
    <form onSubmit={checkDispatch} className="space-y-2"><label htmlFor="weather-districts">Check alert dispatch for districts</label><input id="weather-districts" value={districts} onChange={(event) => setDistricts(event.target.value)} placeholder="District names, comma separated" /><button type="submit" disabled={actionState.loading || !districts.trim()}>{actionState.loading ? 'Checking...' : 'Check dispatch'}</button>{actionState.message && <p role="status">{actionState.message}</p>}</form>
  </main>;
}
