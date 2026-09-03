/**
 * Sustainability Dashboard Page
 * Environmental impact and sustainability metrics
 */

import { useState } from 'react';
import { Leaf, RefreshCw } from 'lucide-react';
import { farmerTrainingAPI, foluAPI } from '../services/api';

export default function SustainabilityDashboardPage() {
  const [farmerId, setFarmerId] = useState('');
  const [state, setState] = useState({ loading: false, error: '', summary: null, carbon: null });

  const loadMetrics = async (event) => {
    event.preventDefault();
    const id = farmerId.trim();
    if (!id) return;
    setState({ loading: true, error: '', summary: null, carbon: null });
    try {
      const [summaryResponse, carbonResponse] = await Promise.all([
        foluAPI.landUseSummary({ farmer_id: id }),
        farmerTrainingAPI.getCarbonFootprint(id),
      ]);
      setState({ loading: false, error: '', summary: summaryResponse?.data ?? summaryResponse, carbon: carbonResponse?.data ?? carbonResponse });
    } catch (error) {
      setState({ loading: false, error: error.response?.data?.error || error.message || 'Sustainability data is unavailable.', summary: null, carbon: null });
    }
  };

  const renderData = (data) => <pre className="mt-3 overflow-auto rounded-md bg-slate-950 p-4 text-sm text-slate-100">{JSON.stringify(data, null, 2)}</pre>;
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6"><header className="flex items-start gap-3"><Leaf className="mt-1 text-lime-700" aria-hidden="true" /><div><h1 className="text-3xl font-semibold text-slate-950">Sustainability Dashboard</h1><p className="mt-2 text-sm text-slate-600">Review FOLU land-use and training-service carbon measurements for a farmer.</p></div></header>
      <form onSubmit={loadMetrics} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end"><div className="min-w-0 flex-1"><label htmlFor="sustainability-farmer" className="block text-sm font-medium text-slate-700">Farmer ID</label><input id="sustainability-farmer" required value={farmerId} onChange={(event) => setFarmerId(event.target.value)} placeholder="Enter a farmer ID" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></div><button type="submit" disabled={state.loading || !farmerId.trim()} className="inline-flex items-center justify-center gap-2 rounded-md bg-lime-700 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"><RefreshCw size={16} aria-hidden="true" />{state.loading ? 'Loading...' : 'Load metrics'}</button></form>
      {state.error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-red-800">{state.error}</p>}{state.loading && <p role="status" aria-busy="true">Loading sustainability metrics...</p>}{!state.loading && state.summary && <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-semibold text-slate-900">FOLU land-use summary</h2><p className="mt-1 text-sm text-slate-600">Source: foluAPI.landUseSummary</p>{renderData(state.summary)}</section>}{!state.loading && state.carbon && <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-semibold text-slate-900">Carbon footprint</h2><p className="mt-1 text-sm text-slate-600">Source: farmerTrainingAPI.getCarbonFootprint</p>{renderData(state.carbon)}</section>}{!state.loading && !state.error && farmerId && !state.summary && !state.carbon && <p role="status">No sustainability data was returned for this farmer.</p>}
    </main>
  );
}