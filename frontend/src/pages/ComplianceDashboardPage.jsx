/**
 * Compliance Dashboard Page
 * Regulatory compliance and certification tracking
 */

import { useEffect, useState } from 'react';
import { FileCheck, RefreshCw } from 'lucide-react';
import { auditComplianceAPI } from '../services/api';

export default function ComplianceDashboardPage() {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [actionState, setActionState] = useState({ loading: false, message: '' });
  const load = () => { setState({ loading: true, error: null, data: null }); Promise.all([auditComplianceAPI.getAuditLogs(), auditComplianceAPI.listComplianceRules()]).then(([logs, rules]) => setState({ loading: false, error: null, data: { logs: logs.data, rules: rules.data } })).catch((error) => setState({ loading: false, error: error.message || 'Compliance data could not be loaded.', data: null })); };
  useEffect(() => { load(); }, []);
  const createAuditLog = async (event) => { event.preventDefault(); setActionState({ loading: true, message: '' }); try { await auditComplianceAPI.createAuditLog({ action: 'compliance-dashboard-review', source: 'frontend' }); setActionState({ loading: false, message: 'Audit log created.' }); load(); } catch (error) { setActionState({ loading: false, message: error.message || 'Audit log could not be created.' }); } };
  if (state.loading) return <main className="p-6" aria-busy="true"><p>Loading compliance data...</p></main>;
  if (state.error) return <main className="p-6"><p role="alert">{state.error}</p><button type="button" onClick={load}><RefreshCw size={16} aria-hidden="true" /> Retry</button></main>;
  const logs = state.data.logs?.data || state.data.logs?.results || state.data.logs || []; const rules = state.data.rules?.data || state.data.rules?.results || state.data.rules || [];
  return <main className="space-y-6 p-6"><header><div className="flex items-center gap-2"><FileCheck aria-hidden="true" /><h1 className="text-2xl font-semibold">Compliance Dashboard</h1></div><p className="text-sm">Audit logs and compliance rules returned by the compliance service.</p></header><section className="grid gap-4 md:grid-cols-2"><article><h2>Audit logs ({logs.length})</h2>{logs.length ? logs.map((log, index) => <p key={log.id || index}>{log.action || log.event || log.id || 'Recorded audit event'}</p>) : <p>No audit logs are available.</p>}</article><article><h2>Compliance rules ({rules.length})</h2>{rules.length ? rules.map((rule, index) => <p key={rule.id || index}>{rule.name || rule.description || rule.id || 'Unnamed rule'}</p>) : <p>No compliance rules are available.</p>}</article></section><form onSubmit={createAuditLog}><button type="submit" disabled={actionState.loading}>{actionState.loading ? 'Recording...' : 'Record dashboard review'}</button>{actionState.message && <p role="status">{actionState.message}</p>}</form></main>;
}