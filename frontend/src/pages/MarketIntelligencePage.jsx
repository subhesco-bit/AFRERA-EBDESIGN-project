/**
 * Market Intelligence Page
 * Market trends, price analysis, and demand forecasting
 */

import { useState } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import { marketIntelligenceAPI } from '../services/api';

export default function MarketIntelligencePage() {
  const [villageId, setVillageId] = useState('');
  const [state, setState] = useState({ loading: false, error: null, data: null });
  const [actionState, setActionState] = useState({ loading: false, message: '' });
  const load = async (event) => {
    event?.preventDefault();
    if (!villageId.trim()) return;
    setState({ loading: true, error: null, data: null });
    try { const response = await marketIntelligenceAPI.getLatestIntelligence(villageId.trim()); setState({ loading: false, error: null, data: response.data }); }
    catch (error) { setState({ loading: false, error: error.message || 'Market intelligence could not be loaded.', data: null }); }
  };
  const createSnapshot = async (event) => {
    event.preventDefault();
    setActionState({ loading: true, message: '' });
    try { await marketIntelligenceAPI.createIntelligence({ village_id: villageId.trim() }); setActionState({ loading: false, message: 'Market intelligence record submitted.' }); await load(); }
    catch (error) { setActionState({ loading: false, message: error.message || 'Market intelligence record could not be submitted.' }); }
  };
  return <main className="space-y-6 p-6"><header><div className="flex items-center gap-2"><BarChart3 aria-hidden="true" /><h1 className="text-2xl font-semibold">Market Intelligence</h1></div><p className="text-sm">Latest market intelligence returned for a village.</p></header>
    <form onSubmit={load} className="space-y-2"><label htmlFor="market-village">Village ID</label><input id="market-village" value={villageId} onChange={(event) => setVillageId(event.target.value)} required /><button type="submit" disabled={state.loading}>{state.loading ? 'Loading...' : 'Load latest intelligence'}</button></form>
    {state.error && <p role="alert">{state.error}</p>}{state.loading && <p aria-busy="true">Loading market intelligence...</p>}{!state.loading && state.data === null && !state.error && <p role="status">Enter a village ID to view market intelligence.</p>}{!state.loading && state.data && <section><h2>Latest record</h2><pre>{JSON.stringify(state.data, null, 2)}</pre><p className="text-sm">Any forecasts or recommendations are advisory and require human review.</p></section>}
    <form onSubmit={createSnapshot} className="space-y-2"><h2>Record intelligence</h2><p className="text-sm">Creates a record using the selected village ID; supply additional fields through the API workflow when available.</p><button type="submit" disabled={actionState.loading || !villageId.trim()}><RefreshCw size={16} aria-hidden="true" />{actionState.loading ? 'Submitting...' : 'Submit record'}</button>{actionState.message && <p role="status">{actionState.message}</p>}</form>
  </main>;
}
