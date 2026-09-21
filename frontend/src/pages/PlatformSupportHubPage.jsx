import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowRight, Building2, Loader2, Network, Stethoscope, Workflow } from 'lucide-react';
import { platformSupportAPI } from '../services/platformSupportAPI';

export default function PlatformSupportHubPage() {
  const [query, setQuery] = useState('');
  const [productId, setProductId] = useState('');
  const [desk, setDesk] = useState(null);
  const [exec, setExec] = useState(null);

  const caps = useQuery({
    queryKey: ['platform-support-caps'],
    queryFn: () => platformSupportAPI.getCapabilities().then((r) => r.data?.data),
    retry: 1,
  });

  const deskMut = useMutation({
    mutationFn: () => platformSupportAPI.getDesk({
      query,
      productId: productId || undefined,
    }).then((r) => r.data?.data),
    onSuccess: (d) => { setDesk(d); setExec(null); },
  });

  const execMut = useMutation({
    mutationFn: () => platformSupportAPI.execute({ query }).then((r) => r.data?.data),
    onSuccess: setExec,
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-indigo-50/30">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <header className="rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-300/30 bg-indigo-400/10 px-3 py-1 text-xs font-bold uppercase text-indigo-200">
            <Network className="h-4 w-4" /> Platform Support Hub
          </div>
          <h1 className="text-3xl font-black tracking-tight">Unified routing — not a generic chatbot</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Routes your request to the right system: Farmer Support Clinic (health),
            AI Engineering Design Team (buildings), or Value-Chain Studio (market lifecycle).
            Each pillar stays specialized; this hub only coordinates.
          </p>
          {caps.data && (
            <p className="mt-2 text-xs text-indigo-200">
              Intents: {(caps.data.intents || []).join(', ')} · v{caps.data.planVersion}
            </p>
          )}
        </header>

        <form
          className="mt-6 space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          onSubmit={(e) => { e.preventDefault(); deskMut.mutate(); }}
        >
          <label className="block text-sm font-semibold text-slate-800">
            What do you need?
            <textarea value={query} onChange={(e) => setQuery(e.target.value)} rows={3}
              placeholder="e.g. Mastitis in my dairy cow — or — design a cold storage 30x12m — or — leaf yellow spots on tomato"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" />
          </label>
          <label className="block text-sm font-semibold text-slate-800">
            Product ID (for value-chain routing)
            <input value={productId} onChange={(e) => setProductId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" placeholder="optional UUID" />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={deskMut.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-4 py-3 font-bold text-white hover:bg-indigo-800 disabled:bg-slate-400">
              {deskMut.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Workflow className="h-5 w-5" />}
              Build support desk
            </button>
            <button type="button" onClick={() => execMut.mutate()} disabled={execMut.isPending || !query}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-800 hover:bg-slate-50">
              {execMut.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Stethoscope className="h-5 w-5" />}
              Execute routed consult / design
            </button>
          </div>
        </form>

        {desk && (
          <section className="mt-6 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm">
                Detected intent: <strong>{desk.detected?.intent}</strong> → route{' '}
                <strong>{desk.detected?.route}</strong> (confidence {desk.detected?.confidence})
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(desk.modules || {}).map(([key, mod]) => (
                <article key={key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h3 className="font-bold capitalize text-slate-900">{key.replace(/([A-Z])/g, ' $1')}</h3>
                  <p className="mt-1 text-xs text-slate-500">Status: {mod.status}</p>
                  {mod.href && (
                    <Link to={mod.href} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-indigo-700">
                      Open <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                  {mod.recentExaminations?.length > 0 && (
                    <p className="mt-1 text-xs text-slate-600">{mod.recentExaminations.length} recent exam(s)</p>
                  )}
                  {mod.projects?.length > 0 && (
                    <p className="mt-1 text-xs text-slate-600">{mod.projects.length} project(s)</p>
                  )}
                </article>
              ))}
            </div>
            {desk.recommended?.length > 0 && (
              <div className="rounded-2xl bg-indigo-50 p-4">
                <h3 className="font-bold text-indigo-950">Recommended next steps</h3>
                <ul className="mt-2 space-y-2">
                  {desk.recommended.map((r) => (
                    <li key={r.action + r.href}>
                      <Link to={r.href} className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-800">
                        {r.reason} <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {exec && (
          <section className="mt-6 rounded-3xl border border-emerald-200 bg-white p-5">
            <h2 className="font-bold">Executed route: {exec.route}</h2>
            {exec.clinicResult?.consult?.summary && (
              <p className="mt-3 text-sm leading-6 text-slate-700">{exec.clinicResult.consult.summary}</p>
            )}
            {exec.engineeringPlan && (
              <p className="mt-3 text-sm text-slate-700">
                Design team assembled for <strong>{exec.engineeringPlan.facilityType}</strong> —{' '}
                {(exec.engineeringPlan.team || []).length} engineers.
              </p>
            )}
            {exec.next && (
              <Link to={exec.next.href} className="mt-4 inline-flex items-center gap-1 font-bold text-indigo-700">
                {exec.next.label} <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </section>
        )}

        <section className="mt-8 rounded-3xl bg-slate-950 p-5 text-white">
          <h2 className="font-bold">Pillars stay specialized</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/farmer-support-clinic" className="rounded-full border border-white/15 px-3 py-1.5 text-xs hover:bg-white/10">Clinic</Link>
            <Link to="/ai-engineering-design" className="rounded-full border border-white/15 px-3 py-1.5 text-xs hover:bg-white/10">Engineering</Link>
            <Link to="/mep-design" className="rounded-full border border-white/15 px-3 py-1.5 text-xs hover:bg-white/10">MEP</Link>
            <Link to="/value-chain-studio" className="rounded-full border border-white/15 px-3 py-1.5 text-xs hover:bg-white/10">Value-Chain</Link>
            <Link to="/animal-health" className="rounded-full border border-white/15 px-3 py-1.5 text-xs hover:bg-white/10">Animal Health</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
