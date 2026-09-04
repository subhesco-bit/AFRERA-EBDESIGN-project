import { useState } from 'react';
import { CheckCircle2, ClipboardCheck, RefreshCw, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { blockchainTraceabilityAPI, organicTraceabilityAPI } from '../services/api';

const listFrom = (value) => Array.isArray(value) ? value : value?.events || value?.chain || value?.data || [];
const shown = (value) => value === null || value === undefined || value === '' ? 'Not provided by API' : String(value);

export default function TraceabilityPage() {
  const [form, setForm] = useState({ productId: '', batchNumber: '', qrCode: '' });
  const [state, setState] = useState({ loading: false, error: null, events: null, verification: null, organic: null });

  const lookup = async (event) => {
    event.preventDefault();
    const productId = form.productId.trim(); const batchNumber = form.batchNumber.trim(); const qrCode = form.qrCode.trim();
    if (!productId && !qrCode) return;
    setState({ loading: true, error: null, events: null, verification: null, organic: null });
    try {
      const requests = [];
      if (productId) { requests.push(blockchainTraceabilityAPI.getTraceabilityEvents(productId, batchNumber)); requests.push(blockchainTraceabilityAPI.verifyChainOfCustody(productId, batchNumber)); }
      if (qrCode) requests.push(organicTraceabilityAPI.getConsumerTransparency(qrCode));
      const responses = await Promise.all(requests); const offset = productId ? 2 : 0;
      setState({ loading: false, error: null, events: productId ? responses[0]?.data : null, verification: productId ? responses[1]?.data : null, organic: qrCode ? responses[offset]?.data : null });
    } catch (error) { setState({ loading: false, error: error.message || 'Traceability lookup could not be completed.', events: null, verification: null, organic: null }); }
  };

  const events = listFrom(state.events); const chain = listFrom(state.verification); const hasResult = state.events !== null || state.verification !== null || state.organic !== null;
  return <main className="min-h-full space-y-6 bg-v42-mist/50 p-4 sm:p-6">
    <header className="mx-auto max-w-6xl"><div className="flex items-center gap-3"><ClipboardCheck className="text-v42-indigo" aria-hidden="true" /><h1 className="font-display text-3xl font-semibold text-v42-ink">Product Traceability</h1></div><p className="mt-2 max-w-2xl text-sm text-v42-ink2">Look up recorded journey events or request a chain-of-custody verification response.</p></header>
    <Card className="mx-auto max-w-6xl"><CardHeader><CardTitle>Lookup or verify</CardTitle><CardDescription>Provide a product ID, an optional batch number, or an organic QR code.</CardDescription></CardHeader><CardContent><form onSubmit={lookup} className="grid gap-4 md:grid-cols-4 md:items-end"><div><label className="text-sm font-medium" htmlFor="trace-product">Product ID</label><input className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" id="trace-product" value={form.productId} onChange={(event) => setForm({ ...form, productId: event.target.value })} /></div><div><label className="text-sm font-medium" htmlFor="trace-batch">Batch number</label><input className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" id="trace-batch" value={form.batchNumber} onChange={(event) => setForm({ ...form, batchNumber: event.target.value })} /></div><div><label className="text-sm font-medium" htmlFor="trace-qr">Organic QR code</label><input className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" id="trace-qr" value={form.qrCode} onChange={(event) => setForm({ ...form, qrCode: event.target.value })} /></div><Button type="submit" disabled={state.loading || (!form.productId.trim() && !form.qrCode.trim())}>{state.loading ? 'Checking...' : 'Lookup traceability'}</Button></form></CardContent></Card>
    {state.loading && <p className="mx-auto max-w-6xl" aria-busy="true">Loading traceability data...</p>}{state.error && <div className="mx-auto flex max-w-6xl items-center gap-3" role="alert"><p>{state.error}</p><Button type="button" variant="outline" onClick={lookup}><RefreshCw size={16} aria-hidden="true" /> Retry</Button></div>}{!state.loading && !state.error && !hasResult && <p className="mx-auto max-w-6xl" role="status">No lookup has been run.</p>}
    {hasResult && <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle>Recorded journey events</CardTitle><CardDescription>Source: blockchain traceability API.</CardDescription></CardHeader><CardContent>{events.length ? <ol className="space-y-3">{events.map((item, index) => <li className="border-l-2 border-v42-indigo pl-3" key={item.id || item.event_id || index}><p className="font-medium">{shown(item.event_type || item.type || item.action || item.id)}</p><p className="text-sm text-v42-ink2">{shown(item.event_timestamp || item.timestamp || item.location)}</p></li>)}</ol> : <p role="status">No events were returned for this lookup.</p>}</CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><Shield size={18} aria-hidden="true" /> Verification response</CardTitle><CardDescription>Source: chain-of-custody verification API. This is not an independent guarantee.</CardDescription></CardHeader><CardContent>{state.verification ? <div className="space-y-3"><p className="flex items-center gap-2 font-medium"><CheckCircle2 size={18} aria-hidden="true" /> API reported complete: {shown(state.verification.is_complete)}</p><p>Recorded chain entries: {chain.length}</p><p className="text-xs text-v42-mut">A human reviewer should assess the returned records and context before relying on this result.</p></div> : <p>No verification response was returned.</p>}</CardContent></Card>{state.organic && <Card><CardHeader><CardTitle>Organic transparency record</CardTitle><CardDescription>Source: organic traceability API.</CardDescription></CardHeader><CardContent><pre className="max-w-full overflow-auto whitespace-pre-wrap text-sm">{JSON.stringify(state.organic, null, 2)}</pre></CardContent></Card>}</div>}
  </main>;
}
