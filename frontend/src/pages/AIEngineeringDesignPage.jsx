import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowRight, Building2, ClipboardList, HardHat, HelpCircle, Loader2,
  ShieldCheck, Sparkles, Users, Workflow, Wrench,
} from 'lucide-react';
import { aiEngineeringTeamAPI } from '../services/aiEngineeringTeamAPI';

const FACILITY_OPTIONS = [
  'cold_storage', 'polyhouse', 'greenhouse', 'warehouse', 'dairy',
  'food_processing', 'grain_storage', 'fisheries', 'solar', 'water_infrastructure', 'other',
];

const roleIcon = {
  lead_architect: Users,
  structural: Building2,
  mep: Wrench,
  agricultural: HardHat,
  cost_estimator: ClipboardList,
  compliance: ShieldCheck,
};

function ProvenanceChip({ entry }) {
  if (!entry) return null;
  const styles = {
    calculated: 'bg-sky-50 text-sky-800',
    db: 'bg-emerald-50 text-emerald-800',
    ai: 'bg-violet-50 text-violet-800',
    unavailable: 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${styles[entry.source] || styles.unavailable}`} title={entry.note || ''}>
      {entry.source === 'unavailable' && <HelpCircle className="h-3 w-3" />}
      {entry.source}
    </span>
  );
}

export default function AIEngineeringDesignPage() {
  const [facilityType, setFacilityType] = useState('cold_storage');
  const [projectId, setProjectId] = useState('');
  const [state, setState] = useState('');
  const [lengthM, setLengthM] = useState('');
  const [widthM, setWidthM] = useState('');
  const [heightM, setHeightM] = useState('');
  const [targetClearSpanM, setTargetClearSpanM] = useState('');
  const [volumeM3, setVolumeM3] = useState('');
  const [deltaTempC, setDeltaTempC] = useState('');
  const [loadsKw, setLoadsKw] = useState('');
  const [plan, setPlan] = useState(null);
  const [notes, setNotes] = useState('');

  const caps = useQuery({
    queryKey: ['ai-eng-team-caps'],
    queryFn: () => aiEngineeringTeamAPI.getCapabilities().then((r) => r.data?.data),
    retry: 1,
  });

  const planMut = useMutation({
    mutationFn: () => {
      const loads = loadsKw.split(/[,\s]+/).map((s) => Number(s.trim())).filter((n) => Number.isFinite(n) && n > 0);
      return aiEngineeringTeamAPI.buildPlan({
        facilityType,
        projectId: projectId.trim() || undefined,
        state: state.trim() || undefined,
        structuralInputs: {
          lengthM: lengthM ? Number(lengthM) : undefined,
          widthM: widthM ? Number(widthM) : undefined,
          heightM: heightM ? Number(heightM) : undefined,
          targetClearSpanM: targetClearSpanM ? Number(targetClearSpanM) : undefined,
        },
        capacityInputs: {
          volumeM3: volumeM3 ? Number(volumeM3) : undefined,
          deltaTempC: deltaTempC ? Number(deltaTempC) : undefined,
          electricalLoadsKw: loads.length ? loads : undefined,
        },
      }).then((r) => r.data?.data);
    },
    onSuccess: setPlan,
  });

  const briefMut = useMutation({
    mutationFn: () => aiEngineeringTeamAPI.generateBrief({
      facilityType: plan?.facilityType || facilityType,
      projectName: plan?.project?.name,
      team: plan?.team,
      notes,
    }).then((r) => r.data?.data),
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-indigo-50/40">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-xl sm:px-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-300/30 bg-indigo-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-200">
            <Users className="h-4 w-4" /> AI Engineering Design Team
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            A team of AI engineers working on your design
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Lead Architect, Structural, MEP, Agricultural, Cost, and Compliance — each issues a deterministic work package.
            Engineering coding for capacity hints; AI only for the coordination brief.
          </p>
          {caps.data && (
            <p className="mt-2 text-xs text-indigo-200">
              {caps.data.roles?.length || 0} roles · plan v{caps.data.planVersion}
            </p>
          )}
        </header>

        <form
          className="mt-6 space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          onSubmit={(e) => { e.preventDefault(); planMut.mutate(); }}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm font-semibold text-slate-800">
              Facility type
              <select value={facilityType} onChange={(e) => setFacilityType(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal">
                {FACILITY_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-800">
              Project ID (optional)
              <input value={projectId} onChange={(e) => setProjectId(e.target.value)}
                placeholder="engineering_projects UUID"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" />
            </label>
            <label className="block text-sm font-semibold text-slate-800">
              State (optional)
              <input value={state} onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Maharashtra"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" />
            </label>
          </div>

          <fieldset className="rounded-2xl border border-dashed border-slate-200 p-4">
            <legend className="px-1 text-xs font-bold uppercase text-slate-500">Geometry & MEP inputs (optional)</legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm">Length (m)
                <input type="number" min="0" value={lengthM} onChange={(e) => setLengthM(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2" />
              </label>
              <label className="text-sm">Width (m)
                <input type="number" min="0" value={widthM} onChange={(e) => setWidthM(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2" />
              </label>
              <label className="text-sm">Height (m)
                <input type="number" min="0" value={heightM} onChange={(e) => setHeightM(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2" />
              </label>
              <label className="text-sm">Target clear span (m)
                <input type="number" min="0" value={targetClearSpanM} onChange={(e) => setTargetClearSpanM(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2" />
              </label>
              <label className="text-sm">Volume (m³)
                <input type="number" min="0" value={volumeM3} onChange={(e) => setVolumeM3(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2" />
              </label>
              <label className="text-sm">ΔT (°C)
                <input type="number" min="0" value={deltaTempC} onChange={(e) => setDeltaTempC(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2" />
              </label>
              <label className="text-sm sm:col-span-2">Loads kW (comma-separated)
                <input value={loadsKw} onChange={(e) => setLoadsKw(e.target.value)} placeholder="15, 7.5"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2" />
              </label>
            </div>
          </fieldset>

          <button type="submit" disabled={planMut.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-4 py-3 font-bold text-white hover:bg-indigo-800 disabled:bg-slate-400">
            {planMut.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Workflow className="h-5 w-5" />}
            Assemble design team & build plan
          </button>
          {planMut.isError && (
            <p className="text-sm text-red-700">{planMut.error?.response?.data?.error || planMut.error?.message}</p>
          )}
        </form>

        {plan && (
          <div className="mt-8 space-y-6">
            {plan.stages && (
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-lg font-bold">Design programme</h2>
                <ol className="flex flex-wrap gap-2">
                  {plan.stages.map((s) => (
                    <li key={s.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                      <div className="font-semibold">{s.label}</div>
                      <div className="text-xs text-slate-500">{s.status} · {s.detail}</div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <section className="space-y-4">
              <h2 className="text-lg font-bold text-slate-950">Your AI engineering team</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {(plan.team || []).map((eng) => {
                  const Icon = roleIcon[eng.id] || HardHat;
                  const pkg = eng.package || {};
                  const list = pkg.checklist || pkg.coordination || pkg.boqCategories || [];
                  return (
                    <article key={eng.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="mb-3 flex items-start gap-3">
                        <span className="rounded-xl bg-indigo-50 p-2 text-indigo-700"><Icon className="h-5 w-5" /></span>
                        <div>
                          <h3 className="font-bold text-slate-950">{eng.title}</h3>
                          <p className="text-xs text-slate-500">{eng.focus}</p>
                          <span className="mt-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">{eng.status}</span>
                        </div>
                      </div>
                      {list.length > 0 && (
                        <ul className="space-y-1.5 text-sm text-slate-700">
                          {list.map((item) => (
                            <li key={item} className="rounded-lg bg-slate-50 px-2 py-1.5">{item}</li>
                          ))}
                        </ul>
                      )}
                      {pkg.disciplines && (
                        <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                          <div><strong>M</strong>: {(pkg.disciplines.mechanical || []).length} items</div>
                          <div><strong>E</strong>: {(pkg.disciplines.electrical || []).length} items</div>
                          <div><strong>P</strong>: {(pkg.disciplines.plumbing || []).length} items</div>
                        </div>
                      )}
                      {pkg.hints?.approxBayAreaM2 != null && (
                        <p className="mt-2 text-sm">Bay area hint: <strong>{pkg.hints.approxBayAreaM2} m²</strong></p>
                      )}
                      {pkg.hints?.approxEnvelopeVolumeM3 != null && (
                        <p className="text-sm">Envelope volume: <strong>{pkg.hints.approxEnvelopeVolumeM3} m³</strong></p>
                      )}
                      {pkg.hints?.targetClearSpanM != null && (
                        <p className="text-sm">Target clear span: <strong>{pkg.hints.targetClearSpanM} m</strong> (intent only)</p>
                      )}
                      {pkg.capacityHints && (
                        <p className="mt-2 text-xs text-slate-500">
                          TR {pkg.capacityHints.refrigerationTonsRough ?? '—'} ·
                          kW {pkg.capacityHints.electricalDemandKw ?? '—'} ·
                          CMH {pkg.capacityHints.ventilationCmhRough ?? '—'}
                        </p>
                      )}
                      {pkg.specialistHref && (
                        <Link to={pkg.specialistHref} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo-700">
                          Open specialist workspace <ArrowRight className="h-4 w-4" />
                        </Link>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="rounded-3xl border border-violet-200 bg-violet-50/40 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-700" />
                <h2 className="font-bold">Team coordination brief (AI · advisory)</h2>
              </div>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Site constraints, client priorities…"
                className="mb-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" rows={2} />
              <button type="button" onClick={() => briefMut.mutate()} disabled={briefMut.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-800 disabled:bg-slate-400">
                {briefMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate team brief
              </button>
              {briefMut.data?.brief && (
                <p className="mt-3 rounded-xl bg-white p-4 text-sm leading-6 text-slate-700">{briefMut.data.brief}</p>
              )}
              {briefMut.data?.provenance && <div className="mt-2"><ProvenanceChip entry={briefMut.data.provenance} /></div>}
            </section>

            <section className="rounded-3xl bg-slate-950 p-5 text-white">
              <h2 className="font-bold">Connected workspaces</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {(plan.specialistLinks || []).map((l) => (
                  <Link key={l.section} to={l.href}
                    className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10">
                    {l.label}<ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
