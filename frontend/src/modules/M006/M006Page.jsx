import React, { useEffect, useState } from 'react';
import './styles.css';
import { useAuthStore } from '../../store/authStore';

export default function M006Page() {
  const { token } = useAuthStore();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/settings', { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
      const body = await res.json();
      if (body && body.success) setSettings(body.data || []);
      else setError(body.error || 'Failed to load');
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function save(name, value) {
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/settings/${name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ value })
      });
      const body = await res.json();
      if (body && body.success) load(); else setError(body.error || 'Save failed');
    } catch (e) { setError(e.message); }
  }

  return (
    <div className='module-M006 p-4'>
      <h1>System Administration (M006)</h1>
      {loading && <div>Loading…</div>}
      {error && <div className='text-red-600'>{error}</div>}
      <section>
        <h2>Settings</h2>
        <table>
          <thead><tr><th>Name</th><th>Value</th><th>Action</th></tr></thead>
          <tbody>
            {settings.map(s => (
              <tr key={s.name}>
                <td>{s.name}</td>
                <td>{JSON.stringify(s.value)}</td>
                <td>
                  <button onClick={() => setEditing(s.name)}>Edit</button>
                  {editing === s.name && (
                    <div>
                      <input defaultValue={JSON.stringify(s.value)} id={`input-${s.name}`} />
                      <button onClick={() => { const val = document.getElementById(`input-${s.name}`).value; try { save(s.name, JSON.parse(val)); setEditing(null); } catch(e){ setError('Invalid JSON'); } }}>Save</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
