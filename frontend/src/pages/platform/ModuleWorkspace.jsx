import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export default function ModuleWorkspace({ moduleKey = 'platform' }) {
  const [state, setState] = useState({ loading: true, error: '', data: null });

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/modules/${encodeURIComponent(moduleKey)}/workspace`, { credentials: 'include' })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.message || `Request failed (${response.status})`);
        return payload;
      })
      .then((data) => active && setState({ loading: false, error: '', data }))
      .catch((error) => active && setState({ loading: false, error: error.message, data: null }));
    return () => { active = false; };
  }, [moduleKey]);

  if (state.loading) return <main aria-busy="true"><h1>Loading module</h1></main>;
  if (state.error) return <main role="alert"><h1>Module unavailable</h1><p>{state.error}</p></main>;

  const data = state.data || {};
  return (
    <main>
      <header><h1>{data.name || moduleKey}</h1><p>{data.description || 'Module workspace'}</p></header>
      <section aria-label="Module status">
        <dl>
          <dt>Status</dt><dd>{data.status || 'operational'}</dd>
          <dt>API</dt><dd>{data.apiStatus || 'connected'}</dd>
          <dt>AI</dt><dd>{data.aiStatus || 'available'}</dd>
        </dl>
      </section>
      {Array.isArray(data.capabilities) && (
        <section><h2>Capabilities</h2><ul>{data.capabilities.map((item) => <li key={item}>{item}</li>)}</ul></section>
      )}
    </main>
  );
}
