import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Boxes,
  CheckCircle2,
  Database,
  FileJson,
  Hash,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { libraryAPI } from '../../services/componentApi';

const moduleTypes = new Set(['runtime-module', 'backend-module', 'library-module-card']);
const catalogueTypes = new Set(['catalogue']);
const systemTypes = new Set(['modular-system-card']);

const tabs = [
  { id: 'all', label: 'All' },
  { id: 'modules', label: 'Modules' },
  { id: 'catalogues', label: 'Catalogues' },
  { id: 'systems', label: 'Systems' },
];

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? null;
}

function getItemType(item) {
  return item?.type || item?.data?.type || 'module';
}

function getModuleId(item) {
  return item?.moduleId || item?.data?.moduleId || item?.data?.module_id || item?.key || null;
}

function getTitle(item) {
  return (
    item?.data?.name ||
    item?.data?.ModuleName ||
    item?.name ||
    item?.moduleId ||
    item?.key ||
    'Library item'
  );
}

function getDescription(item) {
  return (
    item?.data?.description ||
    item?.data?.aiContext ||
    item?.description ||
    item?.category ||
    item?.data?.domain ||
    item?.data?.Domain ||
    item?.path ||
    'Indexed library entry'
  );
}

function filterByTab(items, activeTab) {
  if (activeTab === 'modules') {
    return items.filter((item) => moduleTypes.has(getItemType(item)));
  }

  if (activeTab === 'catalogues') {
    return items.filter((item) => catalogueTypes.has(getItemType(item)));
  }

  if (activeTab === 'systems') {
    return items.filter((item) => systemTypes.has(getItemType(item)));
  }

  return items;
}

function StatusBanner({ error, notice, verification }) {
  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-semibold">Library action failed</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (notice) {
    return (
      <div className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p className="text-sm font-medium">{notice}</p>
      </div>
    );
  }

  if (!verification) return null;

  return (
    <div
      className={`flex items-start gap-3 rounded-md border p-4 ${
        verification.verified ?
          'border-emerald-200 bg-emerald-50 text-emerald-800' :
          'border-amber-200 bg-amber-50 text-amber-900'
      }`}
    >
      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-semibold">
          {verification.verified ? 'Catalog integrity verified' : 'Catalog warnings found'}
        </p>
        <p className="text-sm">
          {verification.verified ?
            `${verification.totalItems} items checked and ${verification.hashedFiles} files hashed.` :
            `${verification.issues?.length || 0} issues and ${verification.warnings?.length || 0} warnings reported.`}
        </p>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <Icon className="h-5 w-5 text-slate-500" aria-hidden="true" />
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-950">{value ?? 0}</div>
    </div>
  );
}

export default function LibraryBrowser() {
  const [query, setQuery] = useState('');
  const [modules, setModules] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadLibrary = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [statisticsResponse, modulesResponse] = await Promise.all([
        libraryAPI.getStatistics(),
        libraryAPI.getModules(),
      ]);

      setStats(unwrap(statisticsResponse));
      setModules(unwrap(modulesResponse) || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Unable to load library catalogue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const items = useMemo(() => {
    const source = hasSearched ? searchResults : modules;
    return filterByTab(source, activeTab);
  }, [activeTab, hasSearched, modules, searchResults]);

  const handleSearch = async (event) => {
    event?.preventDefault();
    const trimmedQuery = query.trim();
    setError('');
    setNotice('');

    if (!trimmedQuery) {
      setHasSearched(false);
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await libraryAPI.search({ query: trimmedQuery });
      setSearchResults(unwrap(response) || []);
      setHasSearched(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const initializeLibrary = async () => {
    setInitializing(true);
    setError('');
    setNotice('');

    try {
      let response = await libraryAPI.initialize();
      const result = unwrap(response);
      await loadLibrary();
      setNotice(
        `Library initialized: ${result?.indexedItems || 0} indexed items, ${result?.contentHashes || 0} content hashes.`,
      );
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Initialization failed');
    } finally {
      setInitializing(false);
    }
  };

  const verifyCatalog = async () => {
    setVerifying(true);
    setError('');
    setNotice('');

    try {
      let response = await libraryAPI.verifyCatalog();
      setVerification(unwrap(response));
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const inspectItem = async (item) => {
    const moduleId = getModuleId(item);
    setError('');

    if (!moduleId || !moduleTypes.has(getItemType(item))) {
      setSelectedItem(item);
      return;
    }

    try {
      let response = await libraryAPI.getModule(moduleId);
      setSelectedItem(response.data?.module || item);
    } catch (_err) {
      setSelectedItem(item);
    }
  };

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-700">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            Knowledge Library
          </div>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">EBDESIGN Library</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Search indexed catalogues, runtime module manifests, backend module scaffolds, and AI retrieval context.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={initializeLibrary}
            disabled={initializing || loading}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {initializing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Initialize
          </button>
          <button
            type="button"
            onClick={verifyCatalog}
            disabled={verifying}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Verify
          </button>
        </div>
      </div>

      <StatusBanner error={error} notice={notice} verification={verification} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard icon={Database} label="Indexed Items" value={stats?.totalItems} />
        <MetricCard icon={Boxes} label="Modules" value={stats?.byType?.['runtime-module'] || modules.length} />
        <MetricCard icon={FileJson} label="Catalogues" value={stats?.byType?.catalogue} />
        <MetricCard icon={Hash} label="Content Hashes" value={stats?.contentHashes} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="sr-only" htmlFor="library-search">
                Search library
              </label>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-slate-400" aria-hidden="true" />
                <input
                  id="library-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search modules, catalogues, routes, services"
                  className="w-full rounded-md border border-slate-300 py-2 pl-10 pr-3 text-sm text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Search
              </button>
            </div>
          </form>

          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                  activeTab === tab.id ?
                    'border-emerald-700 bg-emerald-50 text-emerald-800' :
                    'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <p className="text-sm font-semibold text-slate-800">
                {hasSearched ? 'Search results' : 'Module catalogue'}
              </p>
              <p className="text-xs font-medium text-slate-500">{items.length} visible</p>
            </div>

            {loading && items.length === 0 ? (
              <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading library
              </div>
            ) : items.length === 0 ? (
              <div className="p-10 text-center">
                <BookOpen className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium text-slate-700">No library items match this view.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {items.map((item) => {
                  const type = getItemType(item);
                  let moduleId = getModuleId(item);

                  return (
                    <article key={`${type}:${moduleId || item.path}`} className="p-4 hover:bg-slate-50">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold uppercase text-slate-700">
                              {type}
                            </span>
                            {item.relevance ? (
                              <span className="text-xs text-slate-500">Relevance {Math.round(item.relevance * 100)}%</span>
                            ) : null}
                          </div>
                          <h2 className="mt-2 text-base font-semibold text-slate-950">{getTitle(item)}</h2>
                          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{getDescription(item)}</p>
                          {moduleId ? <p className="mt-2 text-xs font-medium text-slate-500">{moduleId}</p> : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => inspectItem(item)}
                          className="inline-flex shrink-0 items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-white"
                        >
                          Details
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-950">Details</h2>
            {selectedItem ? (
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold uppercase text-slate-700">
                {getItemType(selectedItem)}
              </span>
            ) : null}
          </div>

          {selectedItem ? (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-lg font-semibold text-slate-950">{getTitle(selectedItem)}</p>
                <p className="mt-1 text-sm text-slate-600">{getDescription(selectedItem)}</p>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-slate-500">Module ID</dt>
                  <dd className="mt-1 font-medium text-slate-900">{getModuleId(selectedItem) || 'Not assigned'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Status</dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {selectedItem.status || selectedItem.data?.status || selectedItem.data?.Status || 'catalogued'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Backend</dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {String(selectedItem.backend ?? selectedItem.data?.hasBackend ?? false)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">API</dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {String(selectedItem.api ?? selectedItem.data?.hasApi ?? selectedItem.data?.hasRoutes ?? false)}
                  </dd>
                </div>
              </dl>
              {selectedItem.path ? (
                <p className="break-all rounded-md bg-slate-50 p-3 text-xs text-slate-600">{selectedItem.path}</p>
              ) : null}
              <pre className="max-h-80 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-100">
                {JSON.stringify(selectedItem.data || selectedItem, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="mt-8 text-center text-sm text-slate-500">
              <BookOpen className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
              <p className="mt-3">Select an item to inspect its module metadata and source path.</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
