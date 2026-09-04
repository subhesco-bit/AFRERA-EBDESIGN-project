import { useState } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { searchAPI } from '../services/api';

const asResults = (response) => {
  const body = response?.data ?? response;
  return Array.isArray(body) ? body : body?.results || body?.items || body?.data?.results || [];
};

const labelFor = (item) => item.title || item.name || item.label || item.product_name || item.id;

export default function AdvancedSearchPage() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [state, setState] = useState({ loading: false, error: '', results: [], searched: false });

  const submitSearch = async (event) => {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    setState({ loading: true, error: '', results: [], searched: true });
    try {
      const response = await searchAPI.search({ query: trimmedQuery, ...(type ? { type } : {}), page: 1, limit: 20 });
      setState({ loading: false, error: '', results: asResults(response), searched: true });
    } catch (error) {
      setState({ loading: false, error: error.response?.data?.error || error.message || 'Search failed.', results: [], searched: true });
    }
  };

  const clearSearch = () => {
    setQuery('');
    setType('');
    setState({ loading: false, error: '', results: [], searched: false });
  };

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <header><h1 className="text-3xl font-semibold text-slate-950">Advanced Search</h1><p className="mt-2 text-sm text-slate-600">Search the platform catalogue using verified search results.</p></header>
      <form onSubmit={submitSearch} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto_auto] sm:items-end" role="search">
        <div><label htmlFor="advanced-search-query" className="mb-1 block text-sm font-medium text-slate-700">Search</label><input id="advanced-search-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, farmers, or market data" className="w-full rounded-md border border-slate-300 px-3 py-2" /></div>
        <div><label htmlFor="advanced-search-type" className="mb-1 block text-sm font-medium text-slate-700">Type</label><select id="advanced-search-type" value={type} onChange={(event) => setType(event.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2"><option value="">All types</option><option value="product">Products</option><option value="farmer">Farmers</option><option value="market">Market data</option></select></div>
        <div className="flex gap-2"><button type="submit" disabled={state.loading || !query.trim()} className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"><Search size={16} aria-hidden="true" />{state.loading ? 'Searching...' : 'Search'}</button><button type="button" onClick={clearSearch} disabled={!query && !type && !state.searched} aria-label="Clear search" title="Clear search" className="rounded-md border border-slate-300 p-2 text-slate-700 disabled:opacity-40"><RotateCcw size={16} aria-hidden="true" /></button></div>
      </form>
      {state.error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-red-800">{state.error}</p>}
      {state.loading && <p role="status" aria-busy="true">Loading search results...</p>}
      {!state.loading && state.searched && !state.error && !state.results.length && <p role="status">No results found.</p>}
      {!state.loading && state.results.length > 0 && <section aria-label="Search results" className="space-y-3"><h2 className="text-xl font-semibold text-slate-900">Results ({state.results.length})</h2>{state.results.map((item, index) => <article key={item.id || `${labelFor(item)}-${index}`} className="rounded-lg border border-slate-200 bg-white p-4"><h3 className="font-medium text-slate-900">{labelFor(item)}</h3><p className="mt-1 text-sm text-slate-600">{item.description || item.type || item.category || 'Search result'}</p></article>)}</section>}
    </main>
  );
}
