import React, { useState } from 'react';
import api from '../services/cloneGapClosureAPI';

const initial = { domain: 'commercial', status: 'passed', checkCode: 'FLOW_HEALTH', evidence: { note: 'Operational verification' } };

export default function CloneCompletionControlCenter() {
  const [form, setForm] = useState(initial);
  const [runId, setRunId] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submitEvidence(e) {
    e.preventDefault();
    setBusy(true); setMessage('');
    try {
      const response = await api.verificationEvidence({ runId, ...form });
      setMessage(`Evidence recorded: ${response.data?.evidence?.id || 'success'}`);
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'Unable to record evidence');
    } finally { setBusy(false); }
  }

  return (
    <main aria-labelledby="clone-completion-title">
      <h1 id="clone-completion-title">Clone Completion Control Center</h1>
      <p>Record evidence for the Village, ERP, commerce, logistics, finance and AI verification spine.</p>
      <form onSubmit={submitEvidence}>
        <label>Verification run ID<input value={runId} onChange={e => setRunId(e.target.value)} required /></label>
        <label>Domain<input value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} required /></label>
        <label>Check code<input value={form.checkCode} onChange={e => setForm({ ...form, checkCode: e.target.value })} required /></label>
        <label>Status<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="passed">Passed</option><option value="failed">Failed</option><option value="skipped">Skipped</option></select></label>
        <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Record evidence'}</button>
      </form>
      <p role="status" aria-live="polite">{message}</p>
    </main>
  );
}
