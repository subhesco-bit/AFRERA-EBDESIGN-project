import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Workflow, Briefcase, Scale, ShieldAlert, Siren, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { enterpriseControlAPI } from '../services/api';
import { Section, AsyncState, DataTable } from '../components/common/DataPrimitives';

/**
 * Enterprise Control Layer (migration 993) — backend/src/services/enterpriseControlService.js,
 * mounted at /api/v1/control. Six governance concerns behind one shared
 * workflow-engine contract: Workflow Engine, CRM, Clients, Legal, Risk, Emergency.
 *
 * THE BOUNDARY THIS PAGE MUST NOT CROSS
 * The backend's own header comment: "It does not approve, escalate or close
 * anything on its own authority. It records, computes and surfaces... Emergency
 * is the one place where the standing instruction is returned immediately
 * without deliberation — but even there, the ACTION is taken by a person and
 * merely logged here." Every mutation below is a direct, unmodified passthrough
 * to a route the backend already gates behind a named human actor (the
 * authenticated user clicking the button). Nothing here auto-approves,
 * auto-acknowledges, or infers an action the user did not explicitly take.
 *
 * MIXED ACCESS, BY DESIGN
 * Legal calendar and risk assessment are admin-gated on the backend
 * (adminMiddleware); everything else — including raising an emergency — is
 * only authenticated. That is deliberate: "the person who sees the problem
 * first is rarely the person with the highest privilege." This page is
 * therefore routed without a forced admin role; a non-admin hitting the two
 * admin-only actions will see the backend's error surfaced by AsyncState
 * rather than being locked out of the whole page.
 *
 * ROUTES WITH NO LIST/CREATE COUNTERPART
 * clients: only GET /clients/:id/health exists — no list or direct create
 * (clients are created solely via CRM lead conversion). legal: only the
 * calendar view exists — no create/list route for legal_matters or
 * legal_obligations. Neither is fabricated here; both sections are exactly
 * as wide as the backend actually is.
 */

const SEVERITY_STYLE = {
  critical: { text: 'hsl(var(--sev-emergency))', bg: 'color-mix(in srgb, hsl(var(--sev-emergency)) 12%, transparent)', border: 'hsl(var(--sev-emergency))' },
  high: { text: 'hsl(var(--sev-critical))', bg: 'color-mix(in srgb, hsl(var(--sev-critical)) 12%, transparent)', border: 'hsl(var(--sev-critical))' },
  medium: { text: 'hsl(var(--sev-warning))', bg: 'color-mix(in srgb, hsl(var(--sev-warning)) 16%, transparent)', border: 'hsl(var(--sev-warning))' },
  low: { text: 'hsl(var(--data-real))', bg: 'color-mix(in srgb, hsl(var(--data-real)) 12%, transparent)', border: 'hsl(var(--data-real))' },
};

/** Severity badge — colour reinforces, the printed word carries the meaning. */
function SeverityBadge({ severity }) {
  const s = SEVERITY_STYLE[severity] || { text: 'hsl(var(--data-assumed))', bg: 'hsl(var(--muted))', border: 'hsl(var(--data-assumed))' };
  return (
    <span
      style={{
        color: s.text, background: s.bg, border: `1px solid ${s.border}55`,
        borderRadius: 4, padding: '1px 8px', fontSize: 11, fontWeight: 700,
        whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: 0.3,
      }}
    >
      {severity || 'unknown'}
    </span>
  );
}

function SlaBadge({ status }) {
  const map = {
    breached: { text: 'hsl(var(--destructive))', bg: 'color-mix(in srgb, hsl(var(--destructive)) 12%, transparent)', label: 'SLA breached' },
    within_sla: { text: 'hsl(var(--data-real))', bg: 'color-mix(in srgb, hsl(var(--data-real)) 12%, transparent)', label: 'within SLA' },
    no_sla: { text: 'hsl(var(--data-assumed))', bg: 'hsl(var(--muted))', label: 'no SLA' },
  };
  let s = map[status] || map.no_sla;
  return (
    <span style={{ color: s.text, background: s.bg, borderRadius: 4, padding: '1px 8px', fontSize: 11, fontWeight: 600 }}>
      {s.label}
    </span>
  );
}

function FlagBadge({ on, label, offLabel }) {
  return (
    <span style={{
      color: on ? 'hsl(var(--destructive))' : 'hsl(var(--data-assumed))', background: on ? 'color-mix(in srgb, hsl(var(--destructive)) 12%, transparent)' : 'transparent',
      borderRadius: 4, padding: on ? '1px 8px' : 0, fontSize: 11, fontWeight: on ? 700 : 400,
    }}>
      {on ? label : (offLabel || '—')}
    </span>
  );
}

function inputClass() {
  return 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm';
}

const TABS = [
  { id: 'workflow', label: 'Workflows', icon: Workflow },
  { id: 'crm', label: 'CRM / Clients', icon: Briefcase },
  { id: 'legal', label: 'Legal', icon: Scale },
  { id: 'risk', label: 'Risk Register', icon: ShieldAlert },
  { id: 'emergency', label: 'Emergency', icon: Siren },
];

export default function EnterpriseControlPage() {
  const [activeTab, setActiveTab] = useState('workflow');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Enterprise Control</h1>
        <p className="text-gray-600">
          Workflow approvals, CRM, client health, legal calendar, risk register and emergency
          incidents — backed by migration 993.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          This page records, computes and surfaces. It does not approve, escalate or close
          anything on its own authority — every action below is taken by the person clicking it.
        </p>
      </div>

      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center whitespace-nowrap ${
              activeTab === tab.id ? 'bg-slate-700 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-5 h-5 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'workflow' && <WorkflowTab />}
      {activeTab === 'crm' && <CrmClientsTab />}
      {activeTab === 'legal' && <LegalTab />}
      {activeTab === 'risk' && <RiskTab />}
      {activeTab === 'emergency' && <EmergencyTab />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Workflows                                                           */
/* ------------------------------------------------------------------ */

function WorkflowTab() {
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState('');
  const [startForm, setStartForm] = useState({ workflowCode: '', entityType: '', entityId: '', amount: '' });
  const [rejectingCode, setRejectingCode] = useState(null);
  const [rejectComment, setRejectComment] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['control-pending-approvals', roleFilter],
    queryFn: () => enterpriseControlAPI
      .pendingApprovals(roleFilter ? { role: roleFilter } : {})
      .then((r) => r.data?.data ?? []),
  });

  const startMutation = useMutation({
    mutationFn: (body) => enterpriseControlAPI.startWorkflow(body),
    onSuccess: () => {
      toast.success('Workflow instance started');
      queryClient.invalidateQueries({ queryKey: ['control-pending-approvals'] });
      setStartForm({ workflowCode: '', entityType: '', entityId: '', amount: '' });
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to start workflow'),
  });

  const actMutation = useMutation({
    mutationFn: ({ instanceCode, body }) => enterpriseControlAPI.actOnWorkflow(instanceCode, body),
    onSuccess: (_res, vars) => {
      toast.success(vars.body.action === 'approved' ? 'Approved' : 'Recorded');
      queryClient.invalidateQueries({ queryKey: ['control-pending-approvals'] });
      setRejectingCode(null);
      setRejectComment('');
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to record action'),
  });

  const rows = data || [];

  return (
    <div className="space-y-6">
      <Section
        title="Pending approvals"
        description="Anything waiting on a human, across every module, in one place (v_pending_approvals)."
      >
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            placeholder="Filter by required role (optional)"
            className={inputClass()}
            style={{ maxWidth: 320 }}
          />
        </div>
        <AsyncState loading={isLoading} error={error?.response?.data?.error || error?.message}
          empty={!isLoading && rows.length === 0} emptyMessage="No workflow instances are waiting on a human right now.">
          <DataTable
            caption="Pending workflow instances"
            columns={[
              { key: 'instance_code', label: 'Instance' },
              { key: 'workflow', label: 'Workflow' },
              { key: 'entity', label: 'Entity', render: (r) => `${r.entity_type} · ${r.entity_id}` },
              { key: 'current_step', label: 'Current step' },
              { key: 'required_role', label: 'Required role' },
              { key: 'hours_open', label: 'Hours open', numeric: true, render: (r) => Number(r.hours_open || 0).toFixed(1) },
              { key: 'sla_status', label: 'SLA', render: (r) => <SlaBadge status={r.sla_status} /> },
              {
                key: 'actions', label: 'Actions', render: (r) => (
                  rejectingCode === r.instance_code ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={rejectComment}
                        onChange={(e) => setRejectComment(e.target.value)}
                        placeholder="Reason (required)"
                        className={inputClass()}
                        style={{ minWidth: 160 }}
                      />
                      <button
                        onClick={() => {
                          if (!rejectComment.trim()) { toast.error('A rejection must carry a reason'); return; }
                          actMutation.mutate({ instanceCode: r.instance_code, body: { action: 'rejected', comment: rejectComment } });
                        }}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Confirm reject
                      </button>
                      <button onClick={() => { setRejectingCode(null); setRejectComment(''); }} className="px-2 py-1 text-xs text-gray-600 hover:underline">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => actMutation.mutate({ instanceCode: r.instance_code, body: { action: 'approved' } })}
                        className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Approve
                      </button>
                      <button
                        onClick={() => setRejectingCode(r.instance_code)}
                        className="px-2 py-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 flex items-center gap-1"
                      >
                        <XCircle className="w-3 h-3" /> Reject
                      </button>
                    </div>
                  )
                ),
              },
            ]}
            rows={rows}
            rowKey={(r) => r.instance_code}
          />
        </AsyncState>
      </Section>

      <Section title="Start a workflow instance" description="Enters at the first step whose amount threshold the value clears.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!startForm.workflowCode || !startForm.entityType || !startForm.entityId) {
              toast.error('Workflow code, entity type and entity ID are required');
              return;
            }
            startMutation.mutate({
              workflowCode: startForm.workflowCode,
              entityType: startForm.entityType,
              entityId: startForm.entityId,
              amount: startForm.amount === '' ? undefined : Number(startForm.amount),
            });
          }}
          className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white rounded-lg shadow p-4"
        >
          <input value={startForm.workflowCode} onChange={(e) => setStartForm({ ...startForm, workflowCode: e.target.value })}
            placeholder="Workflow code *" className={inputClass()} />
          <input value={startForm.entityType} onChange={(e) => setStartForm({ ...startForm, entityType: e.target.value })}
            placeholder="Entity type *" className={inputClass()} />
          <input value={startForm.entityId} onChange={(e) => setStartForm({ ...startForm, entityId: e.target.value })}
            placeholder="Entity ID *" className={inputClass()} />
          <input value={startForm.amount} onChange={(e) => setStartForm({ ...startForm, amount: e.target.value })}
            type="number" step="any" placeholder="Amount" className={inputClass()} />
          <button type="submit" disabled={startMutation.isPending}
            className="md:col-span-4 justify-self-start px-4 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-60">
            {startMutation.isPending ? 'Starting…' : 'Start workflow'}
          </button>
        </form>
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CRM / Clients                                                       */
/* ------------------------------------------------------------------ */

function CrmClientsTab() {
  let queryClient = useQueryClient();
  const [leadForm, setLeadForm] = useState({ source: '', organisationName: '', contactName: '', email: '', phone: '', segment: '', estimatedValue: '' });
  const [convertForm, setConvertForm] = useState({ leadCode: '', name: '', amount: '', probabilityPct: '', expectedCloseDate: '', createClient: false });
  const [clientIdInput, setClientIdInput] = useState('');
  const [clientHealth, setClientHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState(null);

  const { data: pipeline, isLoading: pipelineLoading, error: pipelineError } = useQuery({
    queryKey: ['control-pipeline'],
    queryFn: () => enterpriseControlAPI.pipeline().then((r) => r.data?.data),
  });

  const leadMutation = useMutation({
    mutationFn: (body) => enterpriseControlAPI.createLead(body),
    onSuccess: (res) => {
      toast.success(`Lead ${res.data?.data?.lead_code || ''} created`);
      setLeadForm({ source: '', organisationName: '', contactName: '', email: '', phone: '', segment: '', estimatedValue: '' });
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to create lead'),
  });

  const convertMutation = useMutation({
    mutationFn: ({ leadCode, body }) => enterpriseControlAPI.convertLead(leadCode, body),
    onSuccess: () => {
      toast.success('Lead converted');
      queryClient.invalidateQueries({ queryKey: ['control-pipeline'] });
      setConvertForm({ leadCode: '', name: '', amount: '', probabilityPct: '', expectedCloseDate: '', createClient: false });
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to convert lead'),
  });

  const lookupHealth = async () => {
    if (!clientIdInput) { toast.error('Enter a client ID'); return; }
    setHealthLoading(true); setHealthError(null); setClientHealth(null);
    try {
      const res = await enterpriseControlAPI.clientHealth(clientIdInput);
      setClientHealth(res.data?.data);
    } catch (e) {
      setHealthError(e.response?.data?.error || e.message);
    } finally {
      setHealthLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Section title="Sales pipeline" description="Weighted value applies each deal's own probability — a planning figure, not committed revenue.">
        <AsyncState loading={pipelineLoading} error={pipelineError?.response?.data?.error || pipelineError?.message}
          empty={!pipelineLoading && (!pipeline || (pipeline.byStage || []).length === 0)}
          emptyMessage="No open opportunities recorded yet.">
          {pipeline && (
            <>
              <p className="text-sm text-gray-700 mb-3">
                Gross <strong>₹{Number(pipeline.totals?.gross || 0).toLocaleString('en-IN')}</strong>
                {' · '}Weighted <strong>₹{Number(pipeline.totals?.weighted || 0).toLocaleString('en-IN')}</strong>
              </p>
              <DataTable
                caption="Pipeline by stage"
                columns={[
                  { key: 'stage', label: 'Stage' },
                  { key: 'deal_count', label: 'Deals', numeric: true },
                  { key: 'gross_value', label: 'Gross (₹)', numeric: true, render: (r) => Number(r.gross_value || 0).toLocaleString('en-IN') },
                  { key: 'weighted_value', label: 'Weighted (₹)', numeric: true, render: (r) => Number(r.weighted_value || 0).toLocaleString('en-IN') },
                  { key: 'avg_probability', label: 'Avg %', numeric: true, render: (r) => Number(r.avg_probability || 0).toFixed(0) },
                ]}
                rows={pipeline.byStage || []}
                rowKey={(r) => r.stage}
              />
              <p className="text-xs text-gray-400 mt-2">{pipeline.note}</p>
            </>
          )}
        </AsyncState>
      </Section>

      <Section title="New lead">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            leadMutation.mutate({
              ...leadForm,
              estimatedValue: leadForm.estimatedValue === '' ? undefined : Number(leadForm.estimatedValue),
            });
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white rounded-lg shadow p-4"
        >
          <input value={leadForm.source} onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })} placeholder="Source" className={inputClass()} />
          <input value={leadForm.organisationName} onChange={(e) => setLeadForm({ ...leadForm, organisationName: e.target.value })} placeholder="Organisation name" className={inputClass()} />
          <input value={leadForm.contactName} onChange={(e) => setLeadForm({ ...leadForm, contactName: e.target.value })} placeholder="Contact name" className={inputClass()} />
          <input value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} placeholder="Email" className={inputClass()} />
          <input value={leadForm.phone} onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })} placeholder="Phone" className={inputClass()} />
          <input value={leadForm.segment} onChange={(e) => setLeadForm({ ...leadForm, segment: e.target.value })} placeholder="Segment (e.g. horeca, export)" className={inputClass()} />
          <input value={leadForm.estimatedValue} onChange={(e) => setLeadForm({ ...leadForm, estimatedValue: e.target.value })} type="number" step="any" placeholder="Estimated value (₹)" className={inputClass()} />
          <button type="submit" disabled={leadMutation.isPending}
            className="md:col-span-3 justify-self-start px-4 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-60">
            {leadMutation.isPending ? 'Saving…' : 'Create lead'}
          </button>
        </form>
      </Section>

      <Section title="Convert a qualified lead" description="Runs in a transaction — a lead marked converted always has an opportunity to show for it.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!convertForm.leadCode) { toast.error('Lead code is required'); return; }
            const { leadCode, ...rest } = convertForm;
            convertMutation.mutate({
              leadCode,
              body: {
                ...rest,
                amount: rest.amount === '' ? undefined : Number(rest.amount),
                probabilityPct: rest.probabilityPct === '' ? undefined : Number(rest.probabilityPct),
              },
            });
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white rounded-lg shadow p-4"
        >
          <input value={convertForm.leadCode} onChange={(e) => setConvertForm({ ...convertForm, leadCode: e.target.value })} placeholder="Lead code *" className={inputClass()} />
          <input value={convertForm.name} onChange={(e) => setConvertForm({ ...convertForm, name: e.target.value })} placeholder="Opportunity name" className={inputClass()} />
          <input value={convertForm.amount} onChange={(e) => setConvertForm({ ...convertForm, amount: e.target.value })} type="number" step="any" placeholder="Amount (₹)" className={inputClass()} />
          <input value={convertForm.probabilityPct} onChange={(e) => setConvertForm({ ...convertForm, probabilityPct: e.target.value })} type="number" min="0" max="100" placeholder="Probability %" className={inputClass()} />
          <input value={convertForm.expectedCloseDate} onChange={(e) => setConvertForm({ ...convertForm, expectedCloseDate: e.target.value })} type="date" className={inputClass()} />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={convertForm.createClient} onChange={(e) => setConvertForm({ ...convertForm, createClient: e.target.checked })} />
            Also create a client record
          </label>
          <button type="submit" disabled={convertMutation.isPending}
            className="md:col-span-3 justify-self-start px-4 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-60">
            {convertMutation.isPending ? 'Converting…' : 'Convert lead'}
          </button>
        </form>
      </Section>

      <Section title="Client health" description="Computed from behaviour (recency, activity volume, account standing) — not opinion. No client list/create route exists on the backend; clients are created only via lead conversion above.">
        <div className="flex gap-3 mb-4">
          <input value={clientIdInput} onChange={(e) => setClientIdInput(e.target.value)} placeholder="Client ID" className={inputClass()} style={{ maxWidth: 240 }} />
          <button onClick={lookupHealth} disabled={healthLoading} className="px-4 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-60">
            {healthLoading ? 'Looking up…' : 'Look up'}
          </button>
        </div>
        <AsyncState loading={false} error={healthError}>
          {clientHealth && (
            <>
              <p className="text-sm text-gray-700 mb-3">
                Score: <strong>{Number(clientHealth.score).toFixed(1)}</strong> / 100
                {clientHealth.breakdown?.daysSinceTouch != null && ` · ${clientHealth.breakdown.daysSinceTouch} days since last touch`}
                {clientHealth.breakdown?.activityCount != null && ` · ${clientHealth.breakdown.activityCount} activities`}
              </p>
              <DataTable
                caption="Score factors"
                columns={[
                  { key: 'name', label: 'Factor' },
                  { key: 'weight', label: 'Weight', numeric: true },
                  { key: 'score', label: 'Score', numeric: true },
                  { key: 'dataQuality', label: 'Data quality' },
                ]}
                rows={clientHealth.breakdown?.factors || []}
                rowKey={(r) => r.name}
              />
            </>
          )}
        </AsyncState>
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Legal                                                               */
/* ------------------------------------------------------------------ */

function LegalTab() {
  const [withinDays, setWithinDays] = useState(60);

  const { data, isLoading, error } = useQuery({
    queryKey: ['control-legal-calendar', withinDays],
    queryFn: () => enterpriseControlAPI.legalCalendar({ days: withinDays }).then((r) => r.data?.data ?? []),
  });

  let rows = data || [];

  return (
    <Section title="Legal calendar" description="Hearings and obligations due within the selected window (admin only). Read-only — no create route exists for legal matters or obligations on the backend.">
      <div className="flex items-center gap-3 mb-4">
        <label htmlFor="classname" className="text-sm text-gray-700">Due within</label>
        <input id="classname" type="number" min="1" value={withinDays} onChange={(e) => setWithinDays(Number(e.target.value) || 60)}
          className={inputClass()} style={{ maxWidth: 100 }} />
        <span className="text-sm text-gray-700">days</span>
      </div>
      <AsyncState loading={isLoading} error={error?.response?.data?.error || error?.message}
        empty={!isLoading && rows.length === 0} emptyMessage="Nothing due in this window.">
        <DataTable
          caption="Legal calendar"
          columns={[
            { key: 'matter_code', label: 'Code' },
            { key: 'matter_type', label: 'Type' },
            { key: 'title', label: 'Title / description' },
            { key: 'counterparty', label: 'Counterparty / reference' },
            { key: 'due_date', label: 'Due', render: (r) => new Date(r.due_date).toLocaleDateString() },
            { key: 'daysUntilDue', label: 'Days', numeric: true },
            { key: 'overdue', label: 'Status', render: (r) => <FlagBadge on={r.overdue} label="OVERDUE" offLabel={r.status} /> },
          ]}
          rows={rows}
          rowKey={(r) => `${r.matter_code}-${r.due_date}`}
        />
      </AsyncState>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Risk                                                                */
/* ------------------------------------------------------------------ */

function RiskTab() {
  let queryClient = useQueryClient();
  const [assessForm, setAssessForm] = useState({ riskCode: '', residualLikelihood: '', residualImpact: '' });

  const { data, isLoading, error } = useQuery({
    queryKey: ['control-risk-heatmap'],
    queryFn: () => enterpriseControlAPI.riskHeatmap().then((r) => r.data?.data ?? []),
  });

  const assessMutation = useMutation({
    mutationFn: ({ riskCode, body }) => enterpriseControlAPI.assessRisk(riskCode, body),
    onSuccess: () => {
      toast.success('Risk assessment recorded');
      queryClient.invalidateQueries({ queryKey: ['control-risk-heatmap'] });
      setAssessForm({ riskCode: '', residualLikelihood: '', residualImpact: '' });
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to record assessment'),
  });

  let rows = data || [];

  return (
    <div className="space-y-6">
      <Section title="Risk heatmap" description="By category: residual score bands (admin-scored). Risks past their next review date are the ones most likely to be wrong.">
        <AsyncState loading={isLoading} error={error?.response?.data?.error || error?.message}
          empty={!isLoading && rows.length === 0} emptyMessage="No open risks recorded yet.">
          <DataTable
            caption="Risk heatmap by category"
            columns={[
              { key: 'category', label: 'Category' },
              { key: 'critical', label: 'Critical', numeric: true, render: (r) => <span style={{ color: r.critical > 0 ? 'hsl(var(--destructive))' : undefined, fontWeight: r.critical > 0 ? 700 : 400 }}>{r.critical}</span> },
              { key: 'high', label: 'High', numeric: true },
              { key: 'medium', label: 'Medium', numeric: true },
              { key: 'low', label: 'Low', numeric: true },
              { key: 'total', label: 'Total', numeric: true },
              { key: 'overdue_review', label: 'Overdue review', numeric: true, render: (r) => <FlagBadge on={r.overdue_review > 0} label={`${r.overdue_review}`} offLabel="0" /> },
            ]}
            rows={rows}
            rowKey={(r) => r.category}
          />
        </AsyncState>
      </Section>

      <Section title="Assess a risk" description="Records the residual likelihood/impact (1-5 each) after controls. Admin only on the backend; the risk must already exist in the register.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!assessForm.riskCode || !assessForm.residualLikelihood || !assessForm.residualImpact) {
              toast.error('Risk code, likelihood and impact are all required');
              return;
            }
            assessMutation.mutate({
              riskCode: assessForm.riskCode,
              body: {
                residualLikelihood: Number(assessForm.residualLikelihood),
                residualImpact: Number(assessForm.residualImpact),
              },
            });
          }}
          className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white rounded-lg shadow p-4"
        >
          <input value={assessForm.riskCode} onChange={(e) => setAssessForm({ ...assessForm, riskCode: e.target.value })} placeholder="Risk code *" className={inputClass()} />
          <select value={assessForm.residualLikelihood} onChange={(e) => setAssessForm({ ...assessForm, residualLikelihood: e.target.value })} className={inputClass()}>
            <option value="">Residual likelihood *</option>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <select value={assessForm.residualImpact} onChange={(e) => setAssessForm({ ...assessForm, residualImpact: e.target.value })} className={inputClass()}>
            <option value="">Residual impact *</option>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <button type="submit" disabled={assessMutation.isPending}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-60">
            {assessMutation.isPending ? 'Recording…' : 'Record assessment'}
          </button>
        </form>
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Emergency — the reflex arc                                          */
/* ------------------------------------------------------------------ */

const SEVERITY_OPTIONS = ['', 'low', 'medium', 'high', 'critical'];

function EmergencyTab() {
  let queryClient = useQueryClient();
  const [form, setForm] = useState({
    typeCode: '', severity: '', title: '', description: '',
    affectedEntityType: '', affectedEntityIds: '', peopleAtRisk: false,
  });
  const [lastRaised, setLastRaised] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['control-active-incidents'],
    queryFn: () => enterpriseControlAPI.activeIncidents().then((r) => r.data?.data ?? []),
    refetchInterval: 30000,
  });

  const raiseMutation = useMutation({
    mutationFn: (body) => enterpriseControlAPI.raiseIncident(body),
    onSuccess: (res) => {
      const payload = res.data?.data;
      setLastRaised(payload);
      toast.success(`Incident ${payload?.incident?.incident_code || ''} raised`);
      queryClient.invalidateQueries({ queryKey: ['control-active-incidents'] });
      setForm({ typeCode: '', severity: '', title: '', description: '', affectedEntityType: '', affectedEntityIds: '', peopleAtRisk: false });
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to raise incident'),
  });

  const ackMutation = useMutation({
    mutationFn: (incidentCode) => enterpriseControlAPI.acknowledgeIncident(incidentCode),
    onSuccess: () => {
      toast.success('Acknowledged');
      queryClient.invalidateQueries({ queryKey: ['control-active-incidents'] });
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to acknowledge'),
  });

  let rows = data || [];

  return (
    <div className="space-y-6">
      {lastRaised && (
        <div role="alert" style={{
          border: '1px solid hsl(var(--destructive))', borderLeft: '4px solid hsl(var(--destructive))',
          background: 'color-mix(in srgb, hsl(var(--destructive)) 12%, transparent)', borderRadius: 6, padding: '14px 16px',
        }}>
          <div className="flex items-center justify-between">
            <strong>Standing instruction — {lastRaised.incident?.incident_code}</strong>
            <button onClick={() => setLastRaised(null)} className="text-xs text-gray-600 hover:underline">Dismiss</button>
          </div>
          {lastRaised.severityNote && <p className="text-sm mt-1">{lastRaised.severityNote}</p>}
          <p className="text-sm mt-2"><strong>Immediate actions:</strong> {lastRaised.immediateActions}</p>
          <p className="text-sm mt-1">Acknowledge within <strong>{lastRaised.acknowledgeWithinMinutes} minutes</strong>.</p>
          {lastRaised.regulatorNotification?.required && (
            <p className="text-sm mt-1">Regulator notification required within <strong>{lastRaised.regulatorNotification.withinHours} hours</strong>.</p>
          )}
          {(lastRaised.escalationChain || []).length > 0 && (
            <div className="mt-3">
              <DataTable
                caption="Escalation chain"
                columns={[
                  { key: 'escalation_level', label: 'Level', numeric: true },
                  { key: 'contact_role', label: 'Role' },
                  { key: 'name', label: 'Name' },
                  { key: 'phone', label: 'Phone' },
                  { key: 'alternate_phone', label: 'Alt. phone' },
                ]}
                rows={lastRaised.escalationChain}
                rowKey={(r, i) => `${r.contact_role}-${i}`}
              />
            </div>
          )}
          <p className="text-xs text-gray-600 mt-3">
            This instruction is surfaced for a person to act on. Taking the action itself — containment,
            notification, evacuation — happens outside this screen; use "Acknowledge" below once someone has.
          </p>
        </div>
      )}

      <Section title="Active incidents" description="Triaged: life safety first, then severity, then age (v_active_incidents).">
        <AsyncState loading={isLoading} error={error?.response?.data?.error || error?.message}
          empty={!isLoading && rows.length === 0} emptyMessage="No active incidents.">
          <DataTable
            caption="Active incidents"
            columns={[
              { key: 'incident_code', label: 'Code' },
              { key: 'incident_type', label: 'Type' },
              { key: 'severity', label: 'Severity', render: (r) => <SeverityBadge severity={r.severity} /> },
              { key: 'people_at_risk', label: 'People at risk', render: (r) => <FlagBadge on={r.people_at_risk} label="AT RISK" /> },
              { key: 'status', label: 'Status' },
              { key: 'minutes_open', label: 'Minutes open', numeric: true, render: (r) => Number(r.minutes_open || 0).toFixed(0) },
              { key: 'acknowledgement_overdue', label: 'Ack.', render: (r) => (
                r.acknowledged ?
                  <span style={{ color: 'hsl(var(--data-real))', fontSize: 12 }}>acknowledged</span> :
                  <FlagBadge on={r.acknowledgement_overdue} label="OVERDUE" offLabel="pending" />
              ) },
              { key: 'actions', label: 'Actions', render: (r) => (
                <button
                  onClick={() => ackMutation.mutate(r.incident_code)}
                  disabled={r.acknowledged || ackMutation.isPending}
                  className="px-2 py-1 text-xs bg-slate-700 text-white rounded hover:bg-slate-800 disabled:opacity-40"
                >
                  {r.acknowledged ? 'Acknowledged' : 'Acknowledge'}
                </button>
              ) },
            ]}
            rows={rows}
            rowKey={(r) => r.incident_code}
          />
        </AsyncState>
      </Section>

      <Section title="Raise an incident" description="Returns the standing instruction immediately. People at risk always forces severity to critical, regardless of what is selected below.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.title || !form.description) { toast.error('Title and description are required'); return; }
            raiseMutation.mutate({
              typeCode: form.typeCode || undefined,
              severity: form.severity || undefined,
              title: form.title,
              description: form.description,
              affectedEntityType: form.affectedEntityType || undefined,
              affectedEntityIds: form.affectedEntityIds ?
                form.affectedEntityIds.split(',').map((s) => s.trim()).filter(Boolean) :
                undefined,
              peopleAtRisk: form.peopleAtRisk,
            });
          }}
          className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white rounded-lg shadow p-4"
        >
          <input value={form.typeCode} onChange={(e) => setForm({ ...form, typeCode: e.target.value })} placeholder="Type code (optional)" className={inputClass()} />
          <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className={inputClass()}>
            <option value="">Severity (defaults from type, or high)</option>
            {SEVERITY_OPTIONS.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title *" className={`${inputClass()} md:col-span-2`} />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description *" rows={3} className={`${inputClass()} md:col-span-2`} />
          <input value={form.affectedEntityType} onChange={(e) => setForm({ ...form, affectedEntityType: e.target.value })} placeholder="Affected entity type" className={inputClass()} />
          <input value={form.affectedEntityIds} onChange={(e) => setForm({ ...form, affectedEntityIds: e.target.value })} placeholder="Affected entity IDs (comma-separated)" className={inputClass()} />
          <label className="flex items-center gap-2 text-sm text-gray-700 md:col-span-2">
            <input type="checkbox" checked={form.peopleAtRisk} onChange={(e) => setForm({ ...form, peopleAtRisk: e.target.checked })} />
            People are at risk
          </label>
          <button type="submit" disabled={raiseMutation.isPending}
            className="md:col-span-2 justify-self-start px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-60">
            {raiseMutation.isPending ? 'Raising…' : 'Raise incident'}
          </button>
        </form>
      </Section>
    </div>
  );
}
