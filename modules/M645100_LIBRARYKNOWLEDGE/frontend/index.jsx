/**
 * Library Knowledge frontend module entry.
 */

import React, { useEffect, useState } from 'react';
import { create } from 'zustand';

const API_BASE = '/api/v1/library';

export const useLibraryKnowledgeStore = create((set) => ({
  query: '',
  modules: [],
  results: [],
  statistics: null,
  loading: false,
  error: null,

  setQuery: (query) => set({ query }),

  loadStatistics: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/statistics`);
      const result = await response.json();
      set({ statistics: result.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  loadModules: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/modules`);
      const result = await response.json();
      set({ modules: result.data || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  search: async (query) => {
    set({ loading: true, error: null, query });
    try {
      const response = await fetch(`${API_BASE}/search?query=${encodeURIComponent(query)}`);
      const result = await response.json();
      set({ results: result.data || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  }
}));

export function LibraryKnowledgePage() {
  const {
    query,
    modules,
    results,
    statistics,
    loading,
    error,
    setQuery,
    loadModules,
    loadStatistics,
    search
  } = useLibraryKnowledgeStore();

  useEffect(() => {
    loadStatistics();
    loadModules();
  }, [loadModules, loadStatistics]);

  const visibleResults = results.length > 0 ? results : modules.slice(0, 20);

  return (
    <main className="library-knowledge-module">
      <header className="module-header">
        <h1>Library Knowledge</h1>
        <div className="module-metrics">
          <span>{statistics?.totalItems || 0} indexed</span>
          <span>{statistics?.contentHashes || 0} hashed</span>
          <span>{modules.length} modules</span>
        </div>
      </header>

      <form
        className="module-search"
        onSubmit={(event) => {
          event.preventDefault();
          search(query);
        }}
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search modules, catalogues, routes, AI context"
        />
        <button type="submit" disabled={loading}>
          Search
        </button>
      </form>

      {error ? <p className="module-error">{error}</p> : null}

      <section className="module-result-grid">
        {visibleResults.map((item) => (
          <article className="module-result-card" key={item.key || item.moduleId}>
            <h2>{item.data?.name || item.name || item.moduleId || item.key}</h2>
            <p>{item.type || item.category || 'module'}</p>
            <dl>
              <dt>Status</dt>
              <dd>{item.status || item.data?.status || 'catalogued'}</dd>
              <dt>Backend</dt>
              <dd>{String(item.backend ?? item.data?.hasBackend ?? false)}</dd>
              <dt>API</dt>
              <dd>{String(item.api ?? item.data?.hasApi ?? item.data?.hasRoutes ?? false)}</dd>
              <dt>Frontend</dt>
              <dd>{String(item.frontend ?? item.data?.hasFrontend ?? false)}</dd>
            </dl>
          </article>
        ))}
      </section>
    </main>
  );
}

export const moduleRoutes = [
  {
    path: '/library-knowledge',
    component: LibraryKnowledgePage,
    exact: true
  }
];

export default {
  Component: LibraryKnowledgePage,
  store: useLibraryKnowledgeStore,
  routes: moduleRoutes
};
