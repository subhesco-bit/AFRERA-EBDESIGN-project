import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

const STAGE_LABEL = { candidate: 'In planning', pilot: 'First pilot', active: 'Operationally verified', paused: 'Paused' };

export default function IndiaCoveragePage() {
  const [jurisdictions, setJurisdictions] = useState([]);
  const [meaning, setMeaning] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/india-coverage').then(({ data }) => {
      if (!active) return;
      setJurisdictions(data.data.rows);
      setMeaning(data.data.meaning);
    }).catch(() => { if (active) setError('Coverage registry is unavailable. Try again after the service is restored.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const visible = useMemo(() => jurisdictions.filter((item) =>
    (region === 'all' || item.focus_region === region) && item.name.toLowerCase().includes(search.trim().toLowerCase())),
  [jurisdictions, region, search]);
  const states = jurisdictions.filter((item) => item.jurisdiction_type === 'state').length;
  const territories = jurisdictions.filter((item) => item.jurisdiction_type === 'union_territory').length;

  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" aria-labelledby="coverage-title">
    <div className="rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-xl sm:px-10">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">National rollout and partnership</p>
      <h1 id="coverage-title" className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">One platform for every Indian state</h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-slate-200">The premium marketplace launches across India. A farmer in the North East can reach buyers in every state, and producers nationwide can join. Enterprise workflows, rural domains, AI governance, ERP, and assisted access share one contract. The North East has priority for early local validation.</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/20 bg-white/10 p-4"><span className="block text-3xl font-semibold">{states}</span><span className="text-sm text-slate-200">States represented</span></div>
        <div className="rounded-2xl border border-white/20 bg-white/10 p-4"><span className="block text-3xl font-semibold">{territories}</span><span className="text-sm text-slate-200">Union territories represented</span></div>
        <div className="rounded-2xl border border-white/20 bg-white/10 p-4"><span className="block text-3xl font-semibold">8</span><span className="text-sm text-slate-200">North East focus states</span></div>
      </div>
    </div>
    <p className="mt-5 text-sm text-slate-600">{meaning || 'Registry stages distinguish planning from verified local operations.'}</p>
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="flex-1 text-sm font-medium text-slate-800">Search state or territory
        <input value={search} onChange={(event) => setSearch(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-600" placeholder="Search by name" />
      </label>
      <label className="text-sm font-medium text-slate-800">Presentation focus
        <select value={region} onChange={(event) => setRegion(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 sm:w-56">
          <option value="all">All India</option><option value="northeast">North East</option><option value="india">Other states and territories</option>
        </select>
      </label>
    </div>
    {loading && <p className="mt-8" role="status">Loading coverage registry…</p>}
    {error && <p className="mt-8 rounded-xl bg-red-50 p-4 text-red-800" role="alert">{error}</p>}
    {!loading && !error && <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {visible.map((item) => <article key={item.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3"><h2 className="text-lg font-semibold text-slate-950">{item.name}</h2><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-900">{STAGE_LABEL[item.rollout_stage] || item.rollout_stage}</span></div>
        <p className="mt-3 text-sm text-slate-600">{item.jurisdiction_type === 'state' ? 'State' : 'Union territory'} · {item.focus_region === 'northeast' ? 'North East priority' : 'National coverage'}</p>
        {item.market_launch_scope && <p className="mt-2 text-sm font-medium text-emerald-800">Included in all-India marketplace launch</p>}
        <p className="mt-2 text-xs leading-5 text-slate-500">Local schemes, languages, logistics and institutions require verified evidence before operational activation.</p>
      </article>)}
    </div>}
    {!loading && !error && visible.length === 0 && <p className="mt-8" role="status">No jurisdictions match these filters.</p>}
  </main>;
}
