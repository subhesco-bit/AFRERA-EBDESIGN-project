import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import './styles.css';

export default function M001Page() {
  const [health, setHealth] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [payload, setPayload] = useState('{}');
  const [message, setMessage] = useState('');
  const load = async () => {
    try { const [h, m] = await Promise.all([api.get('/modules/m001/health'), api.get('/modules/m001/metrics')]); setHealth(h.data?.data); setMetrics(m.data?.data); }
    catch (error) { setMessage(error.response?.data?.error?.message || 'Unable to load platform status'); }
  };
  useEffect(() => { load(); }, []);
  const initialize = async () => {
    try { await api.post('/modules/m001/initialize', JSON.parse(payload)); setMessage('Platform configuration initialized'); load(); }
    catch (error) { setMessage(error.response?.data?.error?.message || 'Initialization failed'); }
  };
  return (
    <div className='module-M001'>
      <header><p className='eyebrow'>M001 / Platform foundation</p><h1>Platform Core</h1><p>Live platform health, runtime metrics, and controlled initialization.</p></header>
      <section className='m001-grid'><article><span>Status</span><strong>{health?.status || 'Loading'}</strong><small>{health?.timestamp || 'No status received'}</small></article><article><span>Uptime</span><strong>{metrics?.uptime ? `${Math.floor(metrics.uptime / 3600)}h` : '-'}</strong><small>Current process</small></article><article><span>Memory</span><strong>{metrics?.memory ? `${Math.round(metrics.memory.rss / 1024 / 1024)} MB` : '-'}</strong><small>Resident process memory</small></article></section>
      <section className='m001-panel'><h2>Initialize deployment</h2><textarea value={payload} onChange={event => setPayload(event.target.value)} aria-label='Configuration JSON' /><button onClick={initialize}>Initialize</button>{message && <p role='status'>{message}</p>}</section>
    </div>
  );
}
