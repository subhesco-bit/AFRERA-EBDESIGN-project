import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowRight, Cable, Droplets, Fan, HelpCircle, Loader2, Sparkles, Wind, Workflow,
} from 'lucide-react';
import { mepDesignAPI } from '../services/mepDesignAPI';

const FACILITY_OPTIONS = [
  'cold_storage', 'polyhouse', 'greenhouse', 'warehouse', 'dairy',
  'food_processing', 'grain_storage', 'fisheries', 'solar', 'water_infrastructure', 'other',
];

function Badge({ source, note }) {
  if (!source) return null;
  const styles = {
    calculated: 'bg-sky-50 text-sky-800',
    db: 'bg-emerald-50 text-emerald-800',
    ai: 'bg-violet-50 text-violet-800',
    unavailable: 'bg-slate-100 text-slate-600',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${styles[source] || styles.unavailable}`}
      title={note || ''}
    >
      {source === 'unavailable' ? <HelpCircle className="h-3 w-3" /> : null}
      {source}
    </span>
  );
}

export default function MEPDesignStudioPage() {
  const [facilityType, setFacilityType] = useState('cold_storage');
  const [projectId, setProjectId] = useState('');
  const [volumeM3, setVolumeM3] = useState('');
  const [deltaTempC, setDeltaTempC] = useState('');
  const [ach, setAch] = useState('');
  const [loadsKw, setLoadsKw] = useState('');
  const [diversity, setDiversity] = useState('1');
  const [plan, setPlan] = useState(null);
  const [notes, setNotes] = useState('');

  const capsQuery = useQuery({
    queryKey: ['mep-capabilities'],
    queryFn: () => mepDesignAPI.getCapabilities().then((r) => r.data?.data),
    retry: 1,
  });

  const planMutation = useMutation({
    mutationFn: () => {
      const loads = loadsKw
        .split(/[,\s]+/)
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n) && n > 0);
      return mepDesignAPI.buildPlan({
        facilityType,
        projectId: projectId.trim() || undefined,
        capacityInputs: {
          volumeM3: volumeM3 ? Number(volumeM3) : undefined,
          deltaTempC: deltaTempC ? Number(deltaTempC) : undefined,
          airChangesPerHour: ach ? Number(ach) : undefined,
          electricalLoadsKw: loads.length ? loads : undefined,
          diversityFactor: diversity ? Number(diversity) : undefined,
        },
      }).then((r) => r.data?.data);
    },
    onSuccess: (data) => setPlan(data),
  });

  const briefMutation = useMutation({
    mutationFn: () => mepDesignAPI.generateBrief({
      facilityType: plan?.facilityType || facilityType,
      projectName: plan?.project?.name,
      disciplines: plan?.disciplines,
      capacityHints: plan?.capacityHints,
      notes,
    }).then((r) => r.data?.data),
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50/60 via-white to-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-xl sm:px-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-300/30 bg-indigo-300/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-200">
            <Workflow className="h-4 w-4" /> AI MEP Engineer
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Mechanical · Electrical · Plumbing design support
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Deterministic design packages by facility type. Capacity hints only when you supply inputs.
            AI writes an advisory brief — never invents kW, TR, or pipe sizes.
          </p>
          {capsQuery.data && (
            <p className="mt-2 text-xs text-indigo-200">
              Plan v{capsQuery.data.planVersion} · {capsQuery.data.facilityTypes?.length || 0} facility types
            </p>
          )}
        </header>

        <form
          className="mt-6 space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          onSubmit={(e) => { e.preventDefault(); planMutation.mutate(); }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-800">Facility type</span>
              <select
                value={facilityType}
                onChange={(e) => setFacilityType(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
              >
                {FACILITY_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-800">Engineering project ID (optional)</span>
              <input
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="UUID from engineering_projects"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
              />
            </label>
          </div>

          <fieldset className="rounded-2xl border border-dashed border-slate-200 p-4">
            <legend className="px-1 text-xs font-bold uppercase tracking-wide text-slate-500">
              Optional capacity inputs (all calculable fields stay empty without these)
            </legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block text-sm">
                Volume (m³)
                <input type="number" min="0" step="any" value={volumeM3} onChange={(e) => setVolumeM3(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2" />
              </label>
              <label className="block text-sm">
                ΔT (°C) for rough TR
                <input type="number" min="0" step="any" value={deltaTempC} onChange={(e) => setDeltaTempC(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2" />
              </label>
              <label className="block text-sm">
                Air changes / hour
                <input type="number" min="0" step="any" value={ach} onChange={(e) => setAch(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2" />
              </label>
              <label className="block text-sm sm:col-span-2">
                Electrical loads (kW, comma-separated)
                <input value={loadsKw} onChange={(e) => setLoadsKw(e.target.value)}
                  placeholder="15, 7.5, 2"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2" />
              </label>
              <label className="block text-sm">
                Diversity factor
                <input type="number" min="0" step="any" value={diversity} onChange={(e) => setDiversity(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2" />
              </label>
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={planMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-4 py-3 font-bold text-white hover:bg-indigo-800 disabled:bg-slate-400"
          >
            {planMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wind className="h-5 w-5" />}
            Build MEP design plan
          </button>
          {planMutation.isError && (
            <p className="text-sm text-red-700">{planMutation.error?.response?.data?.error || planMutation.error?.message}</p>
          )}
        </form>

        {plan && (
          <div className="mt-8 space-y-6">
            {plan.stages?.length > 0 && (
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-lg font-bold text-slate-950">Design stages</h2>
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

            <div className="grid gap-5 lg:grid-cols-3">
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Fan className="h-5 w-5 text-indigo-700" />
                  <h2 className="font-bold text-slate-950">Mechanical</h2>
                  <Badge source={plan.provenance?.['mep.package']?.source} />
                </div>
                <ul className="space-y-2 text-sm text-slate-700">
                  {(plan.disciplines?.mechanical || []).map((item) => (
                    <li key={item} className="rounded-lg bg-slate-50 px-2 py-1.5">{item}</li>
                  ))}
                </ul>
              </section>
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Cable className="h-5 w-5 text-amber-600" />
                  <h2 className="font-bold text-slate-950">Electrical</h2>
                </div>
                <ul className="space-y-2 text-sm text-slate-700">
                  {(plan.disciplines?.electrical || []).map((item) => (
                    <li key={item} className="rounded-lg bg-slate-50 px-2 py-1.5">{item}</li>
                  ))}
                </ul>
              </section>
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-sky-600" />
                  <h2 className="font-bold text-slate-950">Plumbing</h2>
                </div>
                <ul className="space-y-2 text-sm text-slate-700">
                  {(plan.disciplines?.plumbing || []).map((item) => (
                    <li key={item} className="rounded-lg bg-slate-50 px-2 py-1.5">{item}</li>
                  ))}
                </ul>
              </section>
            </div>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-lg font-bold text-slate-950">Capacity hints (from your inputs only)</h2>
              <div className="grid gap-3 sm:grid-cols-3 text-sm">
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-xs uppercase text-slate-500">Rough refrigeration</div>
                  <div className="mt-1 text-xl font-bold">{plan.capacityHints?.refrigerationTonsRough ?? '—'} <span className="text-sm font-normal">TR</span></div>
                  <Badge source={plan.provenance?.['mep.capacity.refrigerationTonsRough']?.source} note={plan.provenance?.['mep.capacity.refrigerationTonsRough']?.note} />
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-xs uppercase text-slate-500">Ventilation</div>
                  <div className="mt-1 text-xl font-bold">{plan.capacityHints?.ventilationCmhRough ?? '—'} <span className="text-sm font-normal">CMH</span></div>
                  <Badge source={plan.provenance?.['mep.capacity.ventilationCmhRough']?.source} note={plan.provenance?.['mep.capacity.ventilationCmhRough']?.note} />
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-xs uppercase text-slate-500">Electrical demand</div>
                  <div className="mt-1 text-xl font-bold">{plan.capacityHints?.electricalDemandKw ?? '—'} <span className="text-sm font-normal">kW</span></div>
                  <Badge source={plan.provenance?.['mep.capacity.electricalDemandKw']?.source} note={plan.provenance?.['mep.capacity.electricalDemandKw']?.note} />
                </div>
              </div>
              {plan.capacityHints?.formulas && (
                <ul className="mt-3 space-y-1 text-xs text-slate-500">
                  {Object.values(plan.capacityHints.formulas).map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-3xl border border-violet-200 bg-violet-50/50 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-700" />
                <h2 className="font-bold text-slate-950">AI design brief (advisory)</h2>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes for the brief (site constraints, client preferences)"
                className="mb-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                rows={2}
              />
              <button
                type="button"
                onClick={() => briefMutation.mutate()}
                disabled={briefMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-800 disabled:bg-slate-400"
              >
                {briefMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate brief
              </button>
              {briefMutation.data?.brief && (
                <p className="mt-3 rounded-xl bg-white p-4 text-sm leading-6 text-slate-700">{briefMutation.data.brief}</p>
              )}
            </section>

            <section className="rounded-3xl bg-slate-950 p-5 text-white">
              <h2 className="font-bold">Specialist links</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {(plan.specialistLinks || []).map((l) => (
                  <Link key={l.section} to={l.href} className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10">
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
