import React, { useCallback, useEffect, useState } from 'react';
import api from '../../services/api';
import './styles.css';

const ALERT_TYPES = [
  'heavy_rain', 'flood', 'landslide', 'drought', 'hailstorm',
  'cold_wave', 'heat_wave', 'cyclone', 'earthquake', 'frost', 'pest_outbreak',
];
const SEVERITIES = ['advisory', 'watch', 'warning', 'severe', 'extreme'];

const emptyForm = {
  alertCode: '', alertType: ALERT_TYPES[0], severity: SEVERITIES[0], state: '',
  headline: '', detail: '', recommendedAction: '', effectiveFrom: '', effectiveUntil: '',
};

/**
 * Real disaster-alert register backed by weatherService's climate_alerts
 * table (migration 057, M084 · DISASTER ALERTS) via
 * routes/agriculture/weatherRoutes.js - was an unfilled code-generator
 * template importing a nonexistent @/store.
 */
export default function M084Page() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/weather/alerts');
      const data = response?.data?.data;
      setAlerts(Array.isArray(data) ? data : data?.alerts || []);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Disaster alerts could not be loaded');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createAlert = async event => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/weather/alerts', form);
      setMessage('Alert created');
      setForm(emptyForm);
      load();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Alert could not be created');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="module-M084">
      <header>
        <p className="eyebrow">M084 / Climate &amp; weather</p>
        <h1>Disaster Alerts</h1>
        <p>Live climate alerts (flood, landslide, cyclone, and more) that can block dispatch through affected districts.</p>
      </header>

      <section className="m084-panel">
        <h2>Active and recent alerts</h2>
        {loading && <p aria-busy="true">Loading alerts…</p>}
        {!loading && alerts.length === 0 && <p role="status">No alerts recorded.</p>}
        {!loading && alerts.length > 0 && (
          <ul aria-label="Disaster alerts">
            {alerts.map(alert => (
              <li key={alert.id || alert.alert_code}>
                <strong>{alert.headline}</strong> — {alert.severity} {alert.alert_type}
                {alert.state ? ` · ${alert.state}` : ''}
                <p>{alert.recommended_action}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="m084-panel">
        <h2>Raise a new alert</h2>
        <form onSubmit={createAlert}>
          <div>
            <label htmlFor="m084-alert-code">Alert code</label>
            <input id="m084-alert-code" required value={form.alertCode}
              onChange={e => setForm({ ...form, alertCode: e.target.value })} />
          </div>
          <div>
            <label htmlFor="m084-alert-type">Type</label>
            <select id="m084-alert-type" value={form.alertType}
              onChange={e => setForm({ ...form, alertType: e.target.value })}>
              {ALERT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="m084-severity">Severity</label>
            <select id="m084-severity" value={form.severity}
              onChange={e => setForm({ ...form, severity: e.target.value })}>
              {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="m084-state">State</label>
            <input id="m084-state" value={form.state}
              onChange={e => setForm({ ...form, state: e.target.value })} />
          </div>
          <div>
            <label htmlFor="m084-headline">Headline</label>
            <input id="m084-headline" required value={form.headline}
              onChange={e => setForm({ ...form, headline: e.target.value })} />
          </div>
          <div>
            <label htmlFor="m084-action">Recommended action</label>
            <textarea id="m084-action" required value={form.recommendedAction}
              onChange={e => setForm({ ...form, recommendedAction: e.target.value })} />
          </div>
          <div>
            <label htmlFor="m084-from">Effective from</label>
            <input id="m084-from" type="datetime-local" required value={form.effectiveFrom}
              onChange={e => setForm({ ...form, effectiveFrom: e.target.value })} />
          </div>
          <div>
            <label htmlFor="m084-until">Effective until</label>
            <input id="m084-until" type="datetime-local" required value={form.effectiveUntil}
              onChange={e => setForm({ ...form, effectiveUntil: e.target.value })} />
          </div>
          <button type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create alert'}</button>
        </form>
        {message && <p role="status">{message}</p>}
      </section>
    </div>
  );
}
