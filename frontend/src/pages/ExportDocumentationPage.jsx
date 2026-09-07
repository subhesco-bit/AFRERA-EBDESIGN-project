/**
 * Export Documentation Page
 * Export documentation and international trade compliance
 */

import { useEffect, useState } from 'react';
import { FileCheck, RefreshCw } from 'lucide-react';
import { erpAPI } from '../services/api';

export default function ExportDocumentationPage() {
  const [state, setState] = useState({ loading: true, refreshing: false, error: '', status: null });

  const loadStatus = async (refreshing = false) => {
    setState((current) => ({ ...current, loading: !refreshing, refreshing, error: '' }));
    try {
      const response = await erpAPI.getSyncStatus();
      const status = response && Object.prototype.hasOwnProperty.call(response, 'data') ? response.data : response;
      setState({ loading: false, refreshing: false, error: '', status });
    } catch (error) {
      setState({ loading: false, refreshing: false, error: error.response?.data?.error || error.message || 'ERP sync status is unavailable.', status: null });
    }
  };

  useEffect(() => { loadStatus(); }, []);

  const statusText = state.status ? JSON.stringify(state.status) : '';
  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6"><header className="flex items-start gap-3"><FileCheck className="mt-1 text-sky-700" aria-hidden="true" /><div><h1 className="text-3xl font-semibold text-slate-950">Export Documentation</h1><p className="mt-2 text-sm text-slate-600">Review export readiness alongside the connected ERP synchronization status.</p></div></header>
      <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">No export-document generation client is available. This page reports only the verified ERP status and does not claim customs or certification records.</p>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="erp-status-heading"><div className="flex flex-wrap items-center justify-between gap-3"><h2 id="erp-status-heading" className="text-xl font-semibold text-slate-900">ERP connection status</h2><button type="button" onClick={() => loadStatus(true)} disabled={state.loading || state.refreshing} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"><RefreshCw size={16} aria-hidden="true" />{state.refreshing ? 'Refreshing...' : 'Refresh status'}</button></div>
        {state.loading && <p role="status" aria-busy="true" className="mt-4">Loading ERP status...</p>}{state.error && <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-800">{state.error}</p>}{!state.loading && !state.error && state.status && <pre className="mt-4 overflow-auto rounded-md bg-slate-950 p-4 text-sm text-slate-100">{statusText}</pre>}{!state.loading && !state.error && !state.status && <p role="status" className="mt-4">No ERP status was returned.</p>}
      </section>
    </main>
  );
}
