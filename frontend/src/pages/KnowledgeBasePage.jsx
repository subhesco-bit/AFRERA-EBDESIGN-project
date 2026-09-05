import { useState } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { knowledgeGraphAPI, libraryAPI } from '../services/api';

const asResults = (response) => {
  const body = response?.data ?? response;
  return Array.isArray(body) ? body : body?.results || body?.data?.results || [];
};

const resultTitle = (item) => item.title || item.name || item.filename || item.module_name || item.id;

export default function KnowledgeBasePage() {
  const [query, setQuery] = useState('');
  const [state, setState] = useState({ loading: false, error: '', results: [], searched: false });

  const searchKnowledge = async (event) => {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    setState({ loading: true, error: '', results: [], searched: true });
    try {
      const [libraryResponse, graphResponse] = await Promise.all([
        libraryAPI.search({ query: trimmedQuery }),
        knowledgeGraphAPI.searchNodes(trimmedQuery),
      ]);
      setState({ loading: false, error: '', results: [...asResults(libraryResponse), ...asResults(graphResponse)], searched: true });
    } catch (error) {
      setState({ loading: false, error: error.response?.data?.error || error.message || 'Knowledge search failed.', results: [], searched: true });
    }
  };

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <header className="flex items-start gap-3"><BookOpen className="mt-1 text-emerald-700" aria-hidden="true" /><div><h1 className="text-3xl font-semibold text-slate-950">Knowledge Base</h1><p className="mt-2 text-sm text-slate-600">Search the indexed agricultural library and knowledge graph.</p></div></header>
      <form onSubmit={searchKnowledge} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row" role="search"><label htmlFor="knowledge-search" className="sr-only">Search knowledge base</label><input id="knowledge-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search crop guides, practices, or topics" className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2" /><button type="submit" disabled={state.loading || !query.trim()} className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"><Search size={16} aria-hidden="true" />{state.loading ? 'Searching...' : 'Search'}</button></form>
      {state.error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-red-800">{state.error}</p>}
      {state.loading && <p role="status" aria-busy="true">Loading knowledge results...</p>}
      {!state.loading && state.searched && !state.error && !state.results.length && <p role="status">No knowledge entries found.</p>}
      {!state.loading && state.results.length > 0 && <section aria-label="Knowledge results" className="space-y-3"><h2 className="text-xl font-semibold text-slate-900">Knowledge results ({state.results.length})</h2>{state.results.map((item, index) => <article key={item.id || item.filename || `${resultTitle(item)}-${index}`} className="rounded-lg border border-slate-200 bg-white p-4"><h3 className="font-medium text-slate-900">{resultTitle(item)}</h3><p className="mt-1 text-sm text-slate-600">{item.description || item.summary || item.node_type || item.type || 'Indexed knowledge entry'}</p></article>)}</section>}
    </main>
  );
}
