import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowRight, Banknote, CheckCircle2, CircleDollarSign, Download, Factory, HelpCircle,
  ImageIcon, Loader2, PackageCheck, ShieldCheck, Sparkles, ThermometerSnowflake,
  Truck, Warehouse, Workflow, Wrench, Landmark, Route,
} from 'lucide-react';
import { valueChainStudioAPI } from '../services/valueChainStudioAPI';
import { productMediaAIAPI } from '../services/productMediaAIAPI';
import StageTimeline, { exportPlanJson } from '../components/StageTimeline';

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

function fmtMoney(value) {
  const n = Number(value);
  return Number.isFinite(n) ? money.format(n) : '—';
}

function ProvenanceBadge({ provenance, path }) {
  const entry = provenance?.[path];
  if (!entry) return null;
  const styles = {
    db: 'bg-emerald-50 text-emerald-800',
    calculated: 'bg-sky-50 text-sky-800',
    inferred: 'bg-amber-50 text-amber-900',
    ai: 'bg-violet-50 text-violet-800',
    unavailable: 'bg-slate-100 text-slate-600',
  };
  const label = {
    db: entry.verified ? 'Verified · DB' : 'Unverified · DB',
    calculated: entry.verified ? 'Verified calculation' : 'Unverified calculation',
    inferred: 'Inferred · verify',
    ai: 'AI · advisory only',
    unavailable: 'Unavailable',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${styles[entry.source] || styles.unavailable}`}
      title={[entry.sourceRef, entry.methodology, entry.note].filter(Boolean).join(' · ')}
    >
      {entry.verified ? <CheckCircle2 className="h-3 w-3" /> : <HelpCircle className="h-3 w-3" />}
      {label[entry.source] || entry.source}
    </span>
  );
}

function Section({ icon: Icon, title, provenance, path, link, linkLabel = 'Open specialist workspace', children }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700"><Icon className="h-5 w-5" aria-hidden="true" /></span>
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        {path && <ProvenanceBadge provenance={provenance} path={path} />}
      </div>
      {children}
      {link && (
        <Link to={link} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-900">
          {linkLabel}<ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}

function EmptyNote({ children }) {
  return <p className="text-sm text-slate-500">{children}</p>;
}

export default function ValueChainStudioPage() {
  const [productId, setProductId] = useState('');
  const [farmerId, setFarmerId] = useState('');
  const [submitted, setSubmitted] = useState(null);
  const [imagePrompt, setImagePrompt] = useState('');

  const planQuery = useQuery({
    queryKey: ['value-chain-studio', submitted?.productId, submitted?.farmerId],
    queryFn: () => valueChainStudioAPI
      .getLifecyclePlan(submitted.productId, submitted.farmerId)
      .then((response) => response.data?.data),
    enabled: Boolean(submitted?.productId),
    retry: 1,
  });

  const plan = planQuery.data;
  const provenance = plan?.provenance;

  const positioning = useMutation({
    mutationFn: () => valueChainStudioAPI.generatePositioning(submitted.productId, {
      name: plan?.product?.name,
      category: plan?.product?.category,
      basePrice: plan?.product?.basePrice,
      valueScore: plan?.valueScore?.score,
      pricing: plan?.pricing,
    }).then((response) => response.data?.data),
  });

  const image = useMutation({
    mutationFn: () => productMediaAIAPI
      .generateImage(submitted.productId, imagePrompt || `Studio product photo of ${plan?.product?.name || 'this product'}`)
      .then((response) => response.data),
  });

  const submit = (event) => {
    event.preventDefault();
    if (!productId.trim()) return;
    setSubmitted({ productId: productId.trim(), farmerId: farmerId.trim() || undefined });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50/70 via-white to-amber-50/40">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header className="overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-xl sm:px-10 lg:py-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">
            <Workflow className="h-4 w-4" />Value-chain studio
          </div>
          <h1 className="max-w-4xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            One product and one farmer. The whole connected lifecycle plan.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
            Pricing, cold-chain, insurance and funding readiness, subsidy candidates, and compliance gates —
            every number sourced from a real table or a real calculation, tagged verified or unavailable.
            AI is used only for optional positioning copy and a product image, both triggered on demand below.
          </p>
        </header>

        <form onSubmit={submit} className="mt-7 flex flex-wrap items-end gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-800">Product ID</span>
            <input
              required
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
              placeholder="UUID from products.id"
              className="w-72 rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-800">Farmer ID (optional)</span>
            <input
              value={farmerId}
              onChange={(event) => setFarmerId(event.target.value)}
              placeholder="UUID from farmers.id"
              className="w-72 rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <button
            type="submit"
            disabled={planQuery.isFetching}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-wait disabled:bg-slate-400"
          >
            {planQuery.isFetching ? <><Loader2 className="h-5 w-5 animate-spin" />Loading plan…</> : <><Workflow className="h-5 w-5" />Build lifecycle plan</>}
          </button>
        </form>

        {planQuery.isError && (
          <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {planQuery.error?.response?.data?.error || planQuery.error?.message}
          </div>
        )}

        {!plan && !planQuery.isFetching && (
          <div className="mt-7 flex min-h-[320px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white/60 p-8 text-center">
            <Workflow className="h-12 w-12 text-emerald-700" />
            <h2 className="mt-4 text-xl font-bold text-slate-900">Enter a product ID to build its plan</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Every section below reads a real service or table. Sections show Unavailable instead of a guess when the
              underlying data does not exist yet.
            </p>
          </div>
        )}

        {plan && (
          <div className="mt-7 space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Product</div>
                <div className="mt-2 text-xl font-bold text-slate-950">{plan.product?.name}</div>
                <div className="mt-1 text-xs text-slate-600">{plan.product?.category || 'Uncategorized'}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Base price</div>
                <div className="mt-2 text-2xl font-bold text-slate-950">{fmtMoney(plan.product?.basePrice)}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Farmer Value Index</div>
                <div className="mt-2 text-2xl font-bold text-slate-950">{plan.farmerValue?.fvi?.fvi_score ?? '—'}</div>
                <div className="mt-1 text-xs text-slate-600">{plan.farmerValue?.fvi?.confidence_label || 'No farmer context supplied'}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Unclaimed subsidy</div>
                <div className="mt-2 text-2xl font-bold text-slate-950">{fmtMoney(plan.subsidies?.unclaimed?.claimable_now_total)}</div>
              </div>
            </div>

            {plan.farmerValue?.fvi?.statement && (
              <div className="rounded-3xl bg-slate-950 p-5 text-sm leading-6 text-slate-200">{plan.farmerValue.fvi.statement}</div>
            )}

            {plan.readiness && (
              <div className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">Lifecycle readiness (deterministic)</div>
                    <div className="mt-1 text-3xl font-black text-slate-950">{plan.readiness.score}<span className="text-lg font-bold text-slate-500">/100</span>
                      <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold uppercase text-emerald-800">{plan.readiness.label}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">
                      {plan.readiness.verifiedFields}/{plan.readiness.totalTrackedFields} fields verified ·
                      {plan.readiness.unavailableFields} unavailable ·
                      {plan.readiness.inferredFields || 0} inferred ·
                      {plan.readiness.openComplianceGates} open compliance gate(s)
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <ProvenanceBadge provenance={provenance} path="readiness.summary" />
                    <button
                      type="button"
                      onClick={() => exportPlanJson(plan)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-900 shadow-sm hover:bg-emerald-50"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export plan JSON
                    </button>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {plan.readiness.checks?.map((check) => (
                    <div key={check.id} className={`rounded-xl border p-3 ${check.passed ? 'border-emerald-200 bg-white' : 'border-amber-200 bg-amber-50'}`}>
                      <div className="flex items-center justify-between gap-2 text-xs font-bold">
                        <span>{check.label}</span><span>{check.passed ? `+${check.weight}` : `0/${check.weight}`}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-600">Formula: {plan.readiness.formula}</p>
              </div>
            )}

            {plan.stages?.length > 0 && <StageTimeline stages={plan.stages} />}

            {plan.handoffs?.length > 0 && (
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Route className="h-5 w-5 text-emerald-700" />
                  <h2 className="text-lg font-bold text-slate-950">Stakeholder handoffs</h2>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {plan.handoffs.map((h) => (
                    <Link
                      key={h.section}
                      to={h.href}
                      className="flex items-start justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 hover:border-emerald-300 hover:bg-emerald-50"
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{h.label}</div>
                        <div className="mt-0.5 text-xs text-slate-600">{h.detail}</div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        h.status === 'ready' || h.status === 'clear' ? 'bg-emerald-100 text-emerald-800'
                        : h.status === 'action_needed' ? 'bg-amber-100 text-amber-900'
                        : 'bg-slate-200 text-slate-700'
                      }`}>{h.status}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <div className="grid gap-5 lg:grid-cols-2">
              <Section icon={CircleDollarSign} title="Pricing" provenance={provenance} path="pricing.floorBenchmark">
                {plan.pricing?.floorBenchmark ? (
                  <div className="text-sm text-slate-700">
                    <div>Peer floor price range: <strong>{fmtMoney(plan.pricing.floorBenchmark.min)} – {fmtMoney(plan.pricing.floorBenchmark.max)}</strong></div>
                    <div className="mt-1 text-xs text-slate-500">{plan.pricing.floorBenchmark.note} ({plan.pricing.floorBenchmark.count} peer listing(s))</div>
                  </div>
                ) : <EmptyNote>No floor-price benchmark available.</EmptyNote>}
                {plan.pricing?.activeLot ? (
                  <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
                    Active lot: <strong>{fmtMoney(plan.pricing.activeLot.priceInrPerKg)}/kg</strong>, {plan.pricing.activeLot.daysToExpiry} day(s) to expiry
                    <ProvenanceBadge provenance={provenance} path="pricing.activeLot" />
                  </div>
                ) : <div className="mt-3"><EmptyNote>No active yield-managed pricing lot for this product.</EmptyNote></div>}
                {plan.pricing?.transparency && (
                  <div className="mt-3 rounded-xl border border-sky-100 bg-sky-50 p-3 text-xs text-slate-700">
                    <div className="flex flex-wrap items-center gap-2"><strong>Auditable pricing math</strong><ProvenanceBadge provenance={provenance} path="pricing.transparency" /></div>
                    <div className="mt-2">Catalog {fmtMoney(plan.pricing.transparency.catalogBasePriceInr)} · peer midpoint {plan.pricing.transparency.peerFloorMinInr == null ? '—' : fmtMoney((plan.pricing.transparency.peerFloorMinInr + plan.pricing.transparency.peerFloorMaxInr) / 2)} · delta {fmtMoney(plan.pricing.transparency.deltaBaseVsFloorMidInr)}</div>
                    <div className="mt-1 text-slate-500">base price − ((peer minimum + peer maximum) ÷ 2)</div>
                  </div>
                )}
                <Link to="/dynamic-pricing" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-900">Open pricing workspace<ArrowRight className="h-4 w-4" /></Link>
              </Section>

              <Section icon={ThermometerSnowflake} title="Cold-chain" provenance={provenance} path="coldChain.systemStatus" link="/cold-storage">
                {plan.coldChain?.systemStatus ? (
                  <div className="text-sm text-slate-700">
                    <div>Network status: <strong className="capitalize">{plan.coldChain.systemStatus.status}</strong></div>
                    <div className="mt-1">Average utilization: {plan.coldChain.systemStatus.avgUtilization}% · Compliance: {plan.coldChain.systemStatus.complianceRate ?? '—'}%</div>
                  </div>
                ) : <EmptyNote>Cold-chain network status unavailable.</EmptyNote>}
                {plan.coldChain?.facilities?.length > 0 && (
                  <ul className="mt-3 space-y-1 text-xs text-slate-600">
                    {plan.coldChain.facilities.map((f) => (
                      <li key={f.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1">
                        <span>{f.name}</span><span>{f.utilization}% used</span>
                      </li>
                    ))}
                  </ul>
                )}
                {plan.coldChain?.requirements && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
                    <div className="flex flex-wrap items-center gap-2"><strong>{plan.coldChain.requirements.likelyRequiresColdChain ? 'Cold-chain likely required' : 'Ambient handling may be suitable'}</strong><ProvenanceBadge provenance={provenance} path="coldChain.requirements" /></div>
                    <ul className="mt-2 list-disc space-y-1 pl-5">{plan.coldChain.requirements.checklist?.map((item) => <li key={item}>{item}</li>)}</ul>
                  </div>
                )}
              </Section>

              <Section icon={ShieldCheck} title="Insurance readiness" provenance={provenance} path="insurance.policies" link="/insurance">
                {plan.insurance?.policies?.length > 0 ? (
                  <ul className="space-y-2 text-sm text-slate-700">
                    {plan.insurance.policies.map((p) => (
                      <li key={p.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                        <span>{p.policy_number} · {p.insurance_type}</span>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">{p.status}</span>
                      </li>
                    ))}
                  </ul>
                ) : <EmptyNote>No existing policies found for this farmer's account.</EmptyNote>}
              </Section>

              <Section icon={Banknote} title="Subsidy candidates" provenance={provenance} path="subsidies.schemeEligibility" link="/government-subsidy">
                {plan.subsidies?.schemeEligibility?.eligible_schemes?.length > 0 ? (
                  <div className="space-y-2">
                    {plan.subsidies.schemeEligibility.eligible_schemes.map((s) => (
                      <div key={s.code} className="rounded-xl border border-slate-200 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-sm text-slate-900">{s.name}</strong>
                          <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase text-amber-800">{s.status}</span>
                        </div>
                        {s.notes && <p className="mt-1 text-xs text-slate-600">{s.notes}</p>}
                      </div>
                    ))}
                  </div>
                ) : <EmptyNote>No verified schemes matched.</EmptyNote>}
                {plan.subsidies?.unclaimed?.items?.length > 0 && (
                  <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
                    {plan.subsidies.unclaimed.items.length} unclaimed entitlement item(s), {fmtMoney(plan.subsidies.unclaimed.claimable_now_total)} claimable now.
                  </div>
                )}
              </Section>

              <Section icon={PackageCheck} title="Compliance gates" provenance={provenance} path="compliance.gates" link="/compliance">
                {plan.compliance?.gates?.length > 0 ? (
                  <ul className="space-y-2 text-sm text-slate-700">
                    {plan.compliance.gates.map((g) => (
                      <li key={g.id} className="rounded-lg bg-slate-50 px-3 py-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{g.requirement_type}</span>
                          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase">{g.status}</span>
                        </div>
                        {g.due_date && <div className="mt-1 text-xs text-slate-500">Due {new Date(g.due_date).toLocaleDateString()}</div>}
                      </li>
                    ))}
                  </ul>
                ) : <EmptyNote>No compliance records tracked for this entity yet.</EmptyNote>}
              </Section>

              <Section icon={Landmark} title="Funding readiness" provenance={provenance} path="funding.applications" link="/loan-management">
                {plan.funding?.summary ? (
                  <div className="text-sm text-slate-700">
                    <div>{plan.funding.summary.totalApplications} application(s) · {plan.funding.summary.openCount} open · {plan.funding.summary.approvedOrDisbursedCount} approved/disbursed</div>
                    <div className="mt-1">Requested {fmtMoney(plan.funding.summary.totalRequested)} · Approved {fmtMoney(plan.funding.summary.totalApproved)}</div>
                  </div>
                ) : <EmptyNote>No funding data for this farmer context.</EmptyNote>}
              </Section>

              <Section icon={Truck} title="Logistics" provenance={provenance} path="logistics.shipments" link="/logistics">
                {plan.logistics?.shipments?.length > 0 ? (
                  <ul className="space-y-1 text-sm text-slate-700">
                    {plan.logistics.shipments.slice(0, 5).map((s) => (
                      <li key={s.id} className="flex justify-between rounded-lg bg-slate-50 px-2 py-1 text-xs">
                        <span>{s.tracking_number || s.id}</span>
                        <span className="capitalize">{s.status}</span>
                      </li>
                    ))}
                  </ul>
                ) : <EmptyNote>No shipments linked to this product/farmer yet.</EmptyNote>}
              </Section>

              <Section icon={Factory} title="Engineering projects" provenance={provenance} path="engineering.projects" link="/engineering-projects">
                {plan.engineering?.projects?.length > 0 ? (
                  <ul className="space-y-1 text-sm text-slate-700">
                    {plan.engineering.projects.slice(0, 5).map((p) => (
                      <li key={p.id || p.name} className="rounded-lg bg-slate-50 px-2 py-1 text-xs">{p.name || p.title || p.id}</li>
                    ))}
                  </ul>
                ) : <EmptyNote>No engineering projects for this account.</EmptyNote>}
              </Section>

              <Section icon={Warehouse} title="Shared infrastructure" provenance={provenance} path="sharedInfrastructure.availableAssets" link="/shared-infra">
                {plan.sharedInfrastructure?.availableAssets?.length > 0 ? (
                  <ul className="space-y-1 text-xs text-slate-700">
                    {plan.sharedInfrastructure.availableAssets.slice(0, 5).map((a) => (
                      <li key={a.id} className="flex justify-between rounded-lg bg-slate-50 px-2 py-1">
                        <span>{a.name}</span><span>{a.status}</span>
                      </li>
                    ))}
                  </ul>
                ) : <EmptyNote>No matching available assets.</EmptyNote>}
              </Section>

              <Section icon={Wrench} title="Equipment rental" provenance={provenance} path="equipmentRental.availableListings" link="/equipment-rental">
                {plan.equipmentRental?.availableListings?.length > 0 ? (
                  <ul className="space-y-1 text-xs text-slate-700">
                    {plan.equipmentRental.availableListings.slice(0, 5).map((l) => (
                      <li key={l.id || l.name} className="rounded-lg bg-slate-50 px-2 py-1">{l.name || l.title || l.id}</li>
                    ))}
                  </ul>
                ) : <EmptyNote>No equipment listings available.</EmptyNote>}
              </Section>
            </div>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">Data provenance ledger</h2>
              <p className="mt-1 text-xs text-slate-600">Every plan field declares its source, verification state and method. Inferred and unavailable fields contribute no readiness points.</p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-xs">
                  <thead><tr className="border-b text-slate-500"><th className="p-2">Field</th><th className="p-2">Status</th><th className="p-2">Source</th><th className="p-2">Method / note</th><th className="p-2">As of</th></tr></thead>
                  <tbody>{Object.entries(provenance || {}).map(([field, item]) => (
                    <tr key={field} className="border-b border-slate-100 align-top"><td className="p-2 font-mono">{field}</td><td className="p-2"><ProvenanceBadge provenance={provenance} path={field} /></td><td className="p-2">{item.sourceRef || '—'}</td><td className="p-2 text-slate-600">{item.methodology || item.note || 'Direct record read'}</td><td className="p-2 text-slate-500">{item.asOf ? new Date(item.asOf).toLocaleString() : '—'}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            </section>

            <section className="rounded-3xl border border-violet-200 bg-violet-50/40 p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-700" />
                <h2 className="text-lg font-bold text-slate-950">AI (advisory only)</h2>
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-800">Never used for money or compliance</span>
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <button
                    type="button"
                    onClick={() => positioning.mutate()}
                    disabled={positioning.isPending}
                    className="flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-violet-800 disabled:cursor-wait disabled:bg-slate-400"
                  >
                    {positioning.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Generate positioning copy
                  </button>
                  {positioning.data?.copy && (
                    <p className="mt-3 rounded-xl bg-white p-3 text-sm leading-6 text-slate-700">{positioning.data.copy}</p>
                  )}
                  {positioning.isError && <p role="alert" className="mt-3 text-sm text-red-700">{positioning.error?.response?.data?.error || 'Positioning generation is unavailable.'}</p>}
                </div>
                <div>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-slate-800">Image prompt (optional)</span>
                    <input
                      value={imagePrompt}
                      onChange={(event) => setImagePrompt(event.target.value)}
                      placeholder={`Studio product photo of ${plan.product?.name || 'this product'}`}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => image.mutate()}
                    disabled={image.isPending}
                    className="mt-3 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-400"
                  >
                    {image.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                    Generate product image
                  </button>
                  {image.data && (
                    <div className="mt-3 text-sm text-slate-700">
                      {image.data.ok && image.data.imageUrl
                        ? <img src={image.data.imageUrl} alt="AI-generated product" className="mt-2 h-40 w-40 rounded-xl object-cover" />
                        : <span>{image.data.status === 'not_configured' ? 'Image provider not configured.' : (image.data.error || 'Image generation unavailable.')}</span>}
                    </div>
                  )}
                  {image.isError && <p role="alert" className="mt-3 text-sm text-red-700">{image.error?.response?.data?.error || 'Image generation is unavailable.'}</p>}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">Plan package</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Version {plan.planVersion || '2.0'} · Generated {plan.generatedAt ? new Date(plan.generatedAt).toLocaleString() : '—'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => exportPlanJson(plan)}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-800"
                >
                  <Download className="h-4 w-4" />
                  Download lifecycle plan (JSON)
                </button>
              </div>
            </section>

            <section className="rounded-3xl bg-slate-950 p-5 text-white">
              <div className="flex items-center gap-3"><Truck className="h-5 w-5 text-emerald-300" /><h2 className="font-bold">Quick links to specialist workspaces</h2></div>
              <div className="mt-4 flex flex-wrap gap-2">
                {plan.stakeholderLinks?.map((link) => (
                  <Link key={link.section} to={link.href} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10">
                    {link.label}<ArrowRight className="h-3.5 w-3.5" />
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
