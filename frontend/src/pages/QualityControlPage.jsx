/**
 * Quality Control Page
 * Quality assurance and product quality management
 */

import { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { comprehensiveERPAPI } from '../services/api';

export default function QualityControlPage() {
  const [lotId, setLotId] = useState('');
  const [result, setResult] = useState('');
  const [state, setState] = useState({ loading: false, error: null, data: null });
  const submitResult = async (event) => { event.preventDefault(); setState({ loading: true, error: null, data: null }); try { const response = await comprehensiveERPAPI.recordInspectionResult({ inspection_lot: lotId.trim(), result: result.trim() }); setState({ loading: false, error: null, data: response.data }); } catch (error) { setState({ loading: false, error: error.message || 'Inspection result could not be recorded.', data: null }); } };
  return <main className="space-y-6 p-6"><header><div className="flex items-center gap-2"><ClipboardCheck aria-hidden="true" /><h1 className="text-2xl font-semibold">Quality Control</h1></div><p className="text-sm">Record quality inspection results through the comprehensive ERP quality-management service.</p></header><form onSubmit={submitResult} className="max-w-xl space-y-3"><div><label htmlFor="quality-lot">Inspection lot</label><input id="quality-lot" value={lotId} onChange={(event) => setLotId(event.target.value)} required /></div><div><label htmlFor="quality-result">Inspection result</label><textarea id="quality-result" value={result} onChange={(event) => setResult(event.target.value)} required /></div><button type="submit" disabled={state.loading}>{state.loading ? 'Recording...' : 'Record inspection result'}</button></form>{state.loading && <p aria-busy="true">Recording quality result...</p>}{state.error && <p role="alert">{state.error}</p>}{state.data && <section><h2>Recorded result</h2><pre>{JSON.stringify(state.data, null, 2)}</pre></section>}{!state.loading && !state.error && !state.data && <p role="status">No inspection result has been recorded in this view.</p>}<p className="text-sm">Quality decisions remain subject to the responsible reviewer and ERP workflow.</p></main>;
}
