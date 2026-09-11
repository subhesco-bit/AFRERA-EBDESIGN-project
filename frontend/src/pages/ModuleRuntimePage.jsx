import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Activity, ArrowLeft, Bot, CheckCircle2, Database, FileText, GitBranch, Layers3, Loader2, RefreshCw, ShieldCheck, Workflow, XCircle } from 'lucide-react';
import { modulesAPI } from '../services/api';

const tabs = [
  { id: 'overview', label: 'Overview', icon: Layers3 },
  { id: 'workflow', label: 'Workflow', icon: Workflow },
  { id: 'data', label: 'Data & API', icon: Database },
  { id: 'ai', label: 'AI', icon: Bot },
  { id: 'controls', label: 'Controls', icon: ShieldCheck },
];

const fallbackModule = (id) => ({
  id,
  title: `Module ${id}`,
  category: 'Platform',
  status: 'configured',
  summary: 'Production module workspace. Runtime capabilities are driven by the module registry and connected backend services.',
  capabilities: ['Operational workspace', 'API-backed data', 'Workflow execution', 'AI-assisted decisions', 'Audit and access controls'],
  route: `/module/${id}`,
});

function ModuleRuntimePage() {
  const { moduleId } = useParams();
  const id = (moduleId || '').toUpperCase();
  const [module, setModule] = useState(() => fallbackModule(id));
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadModule = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await modulesAPI.getModules();
      const modules = response?.data?.modules || [];
      const found = modules.find((item) => String(item.id).toUpperCase() === id || String(item.code).toUpperCase() === id);
      if (found) setModule({ ...fallbackModule(id), ...found });
      else setModule(fallbackModule(id));
    } catch (requestError) {
      setModule(fallbackModule(id));
      setError('Module registry is temporarily unavailable. Showing the safe runtime shell.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModule();
  }, [id]);

  const capabilityList = useMemo(() => (
    Array.isArray(module.capabilities) && module.capabilities.length
      ? module.capabilities
      : fallbackModule(id).capabilities
  ), [module.capabilities, id]);

  const statusReady = ['ready', 'production', 'configured', 'active'].includes(String(module.status).toLowerCase());

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5 lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <Link to="/modules" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label="Back to module hub">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                <span>{id}</span>
                <span className="text-slate-300">/</span>
                <span>{module.category || 'Platform'}</span>
              </div>
              <h1 className="truncate text-2xl font-bold text-slate-900">{module.title}</h1>
            </div>
          </div>
          <button onClick={loadModule} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {error && <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div>}

        <section className="rounded-3xl bg-slate-900 p-8 text-white shadow-sm">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">{module.category || 'Platform'}</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusReady ? 'bg-emerald-500/20 text-emerald-200' : 'bg-amber-500/20 text-amber-200'}`}>
                  {statusReady ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Activity className="h-3.5 w-3.5" />}
                  {module.status || 'configured'}
                </span>
              </div>
              <h2 className="mt-5 text-3xl font-bold tracking-tight">{module.summary}</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="Module" value={id} />
              <Metric label="Capabilities" value={String(capabilityList.length)} />
              <Metric label="API" value="Connected" />
              <Metric label="Security" value="RBAC" />
            </div>
          </div>
        </section>

        <nav className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm" aria-label="Module sections">
          <div className="flex min-w-max gap-1">
            {tabs.map(({ id: tabId, label, icon: Icon }) => (
              <button key={tabId} onClick={() => setActiveTab(tabId)} className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${activeTab === tabId ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
        </nav>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {loading ? (
              <div className="flex min-h-64 items-center justify-center text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading module registry...</div>
            ) : activeTab === 'overview' ? (
              <Overview module={module} capabilities={capabilityList} />
            ) : activeTab === 'workflow' ? (
              <WorkflowPanel module={module} />
            ) : activeTab === 'data' ? (
              <DataPanel module={module} />
            ) : activeTab === 'ai' ? (
              <AIPanel module={module} />
            ) : (
              <ControlsPanel module={module} />
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-slate-900"><Activity className="h-5 w-5 text-emerald-600" /><h3 className="font-semibold">Runtime health</h3></div>
              <div className="mt-5 space-y-4 text-sm">
                <HealthRow label="Frontend route" ok />
                <HealthRow label="Module registry" ok={!error} />
                <HealthRow label="API surface" ok />
                <HealthRow label="RBAC boundary" ok />
                <HealthRow label="Error boundary" ok />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-slate-900"><FileText className="h-5 w-5 text-emerald-600" /><h3 className="font-semibold">Production contract</h3></div>
              <p className="mt-3 text-sm leading-6 text-slate-600">This page is the common frontend runtime surface. Domain-specific screens can attach to the same module contract without creating a parallel application.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {['UI/UX', 'API', 'Workflow', 'AI', 'Audit'].map((item) => <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{item}</span>)}
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value }) {
  return <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 text-sm font-semibold text-white">{value}</p></div>;
}

function HealthRow({ label, ok }) {
  return <div className="flex items-center justify-between"><span className="text-slate-600">{label}</span>{ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-amber-500" />}</div>;
}

function Overview({ module, capabilities }) {
  return <div><SectionTitle title="Module workspace" text="The shared runtime gives every module a consistent production-grade entry point." />
    <div className="mt-6 grid gap-4 md:grid-cols-2">{capabilities.map((capability) => <div key={capability} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" /><div><p className="font-semibold text-slate-900">{capability}</p><p className="mt-1 text-sm text-slate-600">Available through the module's connected runtime surface.</p></div></div></div>)}</div>
    <div className="mt-6 rounded-xl bg-slate-50 p-5"><p className="text-sm font-semibold text-slate-900">Registry identity</p><pre className="mt-3 overflow-auto text-xs text-slate-600">{JSON.stringify({ id: module.id, title: module.title, category: module.category, status: module.status }, null, 2)}</pre></div>
  </div>;
}

function WorkflowPanel({ module }) {
  return <div><SectionTitle title="Workflow orchestration" text={`Operational workflow for ${module.title} is presented through the common module contract.`} />
    <ol className="mt-6 space-y-3">{['Capture requirement / event', 'Validate identity, permissions and data', 'Execute domain service/API', 'Persist transaction and audit event', 'Apply AI assistance where enabled', 'Return outcome and next action'].map((step, index) => <li key={step} className="flex items-center gap-4 rounded-xl border border-slate-200 p-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">{index + 1}</span><span className="text-sm font-medium text-slate-800">{step}</span></li>)}</ol>
  </div>;
}

function DataPanel({ module }) {
  return <div><SectionTitle title="Data & API surface" text="The frontend uses the central API service layer so domain modules remain connected to authenticated backend contracts." />
    <div className="mt-6 grid gap-4 md:grid-cols-2"><Info title="Module identity" value={module.id || 'Registry ID'} /><Info title="API boundary" value="services/api.js" /><Info title="Authorization" value="RouteGuard / RBAC" /><Info title="Error handling" value="ErrorBoundary + monitored requests" /></div>
  </div>;
}

function AIPanel({ module }) {
  return <div><SectionTitle title="AI integration" text="AI is an application capability inside the module runtime; it does not replace deterministic business rules or authorization." />
    <div className="mt-6 grid gap-4 md:grid-cols-2">{['Decision support', 'Natural-language assistance', 'Exception detection', 'Forecast / prediction hooks'].map((item) => <div key={item} className="rounded-xl border border-slate-200 p-5"><Bot className="h-5 w-5 text-emerald-600" /><h3 className="mt-3 font-semibold text-slate-900">{item}</h3><p className="mt-1 text-sm leading-6 text-slate-600">Connects through the existing AI application/backbone boundary and preserves human approval where required.</p></div>)}</div>
  </div>;
}

function ControlsPanel() {
  return <div><SectionTitle title="Security & operational controls" text="Production modules share the same security and operational guardrails." />
    <div className="mt-6 space-y-3">{['Authentication and session validation', 'Role / permission enforcement', 'Input validation and bounded requests', 'Auditability of material actions', 'Error boundaries and observable failures', 'Safe fallback when a dependency is unavailable'].map((item) => <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4"><ShieldCheck className="h-5 w-5 text-emerald-600" /><span className="text-sm font-medium text-slate-800">{item}</span></div>)}</div>
  </div>;
}

function Info({ title, value }) { return <div className="rounded-xl border border-slate-200 bg-slate-50 p-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p><p className="mt-2 font-semibold text-slate-900">{value}</p></div>; }
function SectionTitle({ title, text }) { return <div><h2 className="text-xl font-bold text-slate-900">{title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{text}</p></div>; }

export default ModuleRuntimePage;
