import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowRight, Banknote, Boxes, CheckCircle2, CircleDollarSign, Factory,
  HeartPulse, ImageIcon, Languages, Leaf, Loader2, PackageCheck, ShieldCheck, Sparkles,
  ThermometerSnowflake, AlertTriangle, Workflow,
} from 'lucide-react';
import { valueChainAPI } from '../services/api';

const initialForm = {
  name: 'Organic Assam Tea',
  description: 'Premium single-origin tea grown by a farmer collective with lot traceability.',
  location: 'Assam', language: 'English', costPerKg: 300, marketPricePerKg: 420,
  quantityKg: 100, qualityScore: 85, organic: true, giCertified: false,
  traceable: true, perishable: false, processingRequired: true, useAI: true, generateImage: true,
};

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

function Field({ label, children, hint }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-800">{label}</span>{children}{hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}</label>;
}

function Metric({ label, value, detail }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</div><div className="mt-2 text-2xl font-bold text-slate-950">{value}</div>{detail && <div className="mt-1 text-xs text-slate-600">{detail}</div>}</div>;
}

function InsightCard({ icon: Icon, title, children, link, linkLabel = 'Open specialist workspace' }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3"><span className="rounded-xl bg-emerald-50 p-2 text-emerald-700"><Icon className="h-5 w-5" aria-hidden="true" /></span><h2 className="text-lg font-bold text-slate-950">{title}</h2></div>
      {children}
      {link && <Link to={link} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-900">{linkLabel}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
    </section>
  );
}

export default function AIProductStudioPage() {
  const [form, setForm] = useState(initialForm);
  const statusQuery = useQuery({ queryKey: ['value-chain-status'], queryFn: () => valueChainAPI.getStatus().then((response) => response.data?.data), retry: 1 });
  const analysis = useMutation({ mutationFn: (payload) => valueChainAPI.analyzeProduct(payload).then((response) => response.data?.data) });
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }));
  const submit = (event) => {
    event.preventDefault();
    analysis.mutate({ ...form, costPerKg: Number(form.costPerKg), marketPricePerKg: Number(form.marketPricePerKg), quantityKg: Number(form.quantityKg), qualityScore: Number(form.qualityScore) });
  };
  const result = analysis.data;
  const nutrition = result?.nutrition?.per_100g_estimate;

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50/70 via-white to-amber-50/40">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header className="overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-xl sm:px-10 lg:py-10">
          <div className="grid items-end gap-8 lg:grid-cols-[1.3fr_0.7fr]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-emerald-200"><Sparkles className="h-4 w-4" />AI value-chain studio</div>
              <h1 className="max-w-4xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">One product input. One connected farm-to-consumer plan.</h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">Turn a farmer&apos;s product into marketplace content, evidence-aware nutrition, per-kilogram pricing, storage, insurance, finance, subsidy, engineering, compliance, and fulfilment handoffs.</p>
              {result && <Link to={`/value-chain-control?title=${encodeURIComponent(result.product.name)}&commodity=${encodeURIComponent(result.product.category || result.product.name)}&location=${encodeURIComponent(form.location)}`} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-4 py-2.5 text-sm font-bold text-emerald-950 hover:bg-emerald-200">Govern this product in Control Center<ArrowRight className="h-4 w-4" /></Link>}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
              <div className="flex items-center justify-between gap-3"><span className="text-slate-300">AI provider</span><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusQuery.data?.aiConfigured ? 'bg-emerald-300 text-emerald-950' : 'bg-amber-300 text-amber-950'}`}>{statusQuery.data?.aiConfigured ? 'Configured' : 'Fallback mode'}</span></div>
              <div className="mt-3 flex items-center justify-between gap-3"><span className="text-slate-300">AI output budget</span><span className="font-semibold">≤ {statusQuery.data?.tokenOptimization?.maxOutputTokens || 320} tokens</span></div>
              <div className="mt-3 flex items-center justify-between gap-3"><span className="text-slate-300">Repeated analyses</span><span className="font-semibold">Cached 6 hours</span></div>
            </div>
          </div>
        </header>

        <div className="mt-7 grid gap-7 xl:grid-cols-[420px_minmax(0,1fr)]">
          <form onSubmit={submit} className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-4">
            <div className="mb-5 flex items-center gap-3"><PackageCheck className="h-6 w-6 text-emerald-700" /><div><h2 className="font-bold text-slate-950">Product intake</h2><p className="text-xs text-slate-500">No identity, banking, or health data is sent to AI.</p></div></div>
            <div className="space-y-4">
              <Field label="Product name"><input required value={form.name} onChange={update('name')} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></Field>
              <Field label="Product story and evidence"><textarea rows={3} value={form.description} onChange={update('description')} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></Field>
              <div className="grid grid-cols-2 gap-3"><Field label="Location"><input value={form.location} onChange={update('location')} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" /></Field><Field label="Output language"><input value={form.language} onChange={update('language')} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" /></Field></div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Cost / kg (₹)"><input type="number" min="0" value={form.costPerKg} onChange={update('costPerKg')} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" /></Field>
                <Field label="Market / kg (₹)"><input type="number" min="0" value={form.marketPricePerKg} onChange={update('marketPricePerKg')} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" /></Field>
                <Field label="Quantity (kg)"><input type="number" min="1" value={form.quantityKg} onChange={update('quantityKg')} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" /></Field>
                <Field label="Quality score"><input type="number" min="0" max="100" value={form.qualityScore} onChange={update('qualityScore')} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-slate-700">
                {[
                  ['organic', 'Organic evidence'], ['giCertified', 'GI certificate'], ['traceable', 'Lot traceable'], ['perishable', 'Perishable'],
                  ['processingRequired', 'Needs processing'], ['useAI', 'AI copy'], ['generateImage', 'AI image'],
                ].map(([key, label]) => <label key={key} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2"><input type="checkbox" checked={form[key]} onChange={update(key)} className="h-4 w-4 accent-emerald-700" />{label}</label>)}
              </div>
              <button type="submit" disabled={analysis.isPending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-wait disabled:bg-slate-400">{analysis.isPending ? <><Loader2 className="h-5 w-5 animate-spin" />Building connected plan…</> : <><Workflow className="h-5 w-5" />Analyze complete value chain</>}</button>
              {analysis.error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{analysis.error.response?.data?.error || analysis.error.message}</div>}
            </div>
          </form>

          <div className="min-w-0">
            {!result && !analysis.isPending && <div className="flex min-h-[520px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white/60 p-8 text-center"><Workflow className="h-12 w-12 text-emerald-700" /><h2 className="mt-4 text-xl font-bold text-slate-900">Your connected operating plan appears here</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">The analysis separates estimates from verified data and routes every regulated decision to a qualified human or specialist page.</p></div>}
            {analysis.isPending && <div className="flex min-h-[520px] items-center justify-center rounded-3xl border border-slate-200 bg-white p-8"><div className="text-center"><Loader2 className="mx-auto h-10 w-10 animate-spin text-emerald-700" /><p className="mt-4 font-semibold text-slate-800">Coordinating product, commerce, risk, and fulfilment…</p></div></div>}

            {result && <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric label="Category" value={result.product.category} detail={`${result.product.shelf_life_days_estimate}-day shelf-life estimate`} />
                <Metric label="Recommended / kg" value={money.format(result.pricing.recommended_price_per_kg)} detail={`${result.pricing.premium_rate_percent}% evidence-based premium`} />
                <Metric label="Working capital" value={money.format(result.funding.working_capital_estimate_inr)} detail="Indicative preparation value" />
                <Metric label="Insurance" value={money.format(result.insurance.indicative_premium_inr)} detail="Indicative premium—not a bound policy" />
              </div>

              <InsightCard icon={ImageIcon} title="Marketplace story and product image" link="/sell/new-product" linkLabel="Continue to product listing">
                <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)]">
                  <div className="aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-100 to-amber-100">{result.media?.imageUrl ? <img src={result.media.imageUrl} alt={`AI-generated preview for ${result.product.name}`} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center p-4 text-center text-xs font-semibold text-slate-600">{result.media?.status === 'provider_error' ? 'Image provider unavailable' : 'Image was not requested'}</div>}</div>
                  <div><div className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700"><Sparkles className="h-3.5 w-3.5" />{result.marketing.source}{result.marketing.cached ? ' · cached' : ''}</div><h3 className="mt-3 text-xl font-black text-slate-950">{result.marketing.slogan}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{result.marketing.short_description}</p><ul className="mt-3 grid gap-2 sm:grid-cols-3">{result.marketing.buyer_bullets.map((item) => <li key={item} className="rounded-lg bg-slate-50 p-2 text-xs text-slate-700">{item}</li>)}</ul></div>
                </div>
              </InsightCard>

              <div className="grid gap-5 lg:grid-cols-2">
                <InsightCard icon={Leaf} title="Nutrition and value evidence" link="/ecommerce-integration">
                  {nutrition ? <div className="grid grid-cols-3 gap-2">{Object.entries(nutrition).map(([key, value]) => <div key={key} className="rounded-xl bg-emerald-50 p-3"><div className="text-lg font-bold text-emerald-950">{value}</div><div className="text-[11px] text-emerald-800">{key.replaceAll('_', ' ')}</div></div>)}</div> : <p className="text-sm text-slate-600">No reference profile matched. Laboratory or authoritative database verification is required.</p>}
                  <p className="mt-3 flex items-start gap-2 text-xs text-amber-800"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{result.nutrition.warning}</p>
                </InsightCard>
                <InsightCard icon={ThermometerSnowflake} title="Storage and cold-chain" link={result.cold_chain.handoff}>
                  <p className="text-sm font-semibold text-slate-900">{result.cold_chain.storage_mode}</p><p className="mt-2 text-sm text-slate-600">{result.cold_chain.required ? `Indicative ${result.cold_chain.target_temperature_c.min}–${result.cold_chain.target_temperature_c.max}°C monitored chain.` : 'Ambient handling plan with humidity, pest, and lot-age controls.'}</p><div className="mt-3 flex flex-wrap gap-2">{result.cold_chain.monitoring.map((item) => <span key={item} className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800">{item}</span>)}</div>
                </InsightCard>
                <InsightCard icon={ShieldCheck} title="Insurance layers" link={result.insurance.handoff}>
                  <div className="flex flex-wrap gap-2">{result.insurance.recommended_layers.map((item) => <span key={item} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-800">{item}</span>)}</div><p className="mt-3 text-sm text-slate-600">Indicative sum insured: <strong className="text-slate-900">{money.format(result.insurance.indicative_sum_insured_inr)}</strong></p>
                </InsightCard>
                <InsightCard icon={HeartPulse} title="Health and medical coding boundary" link={result.medical_coding.handoff}>
                  <p className="text-sm leading-6 text-slate-600">{result.medical_coding.boundary}</p><div className="mt-3 flex flex-wrap gap-2">{result.medical_coding.use_cases.map((item) => <span key={item} className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-800">{item}</span>)}</div>
                </InsightCard>
                <InsightCard icon={Banknote} title="Bank funding readiness" link={result.funding.bank_handoff}><ul className="space-y-2 text-sm text-slate-700">{result.funding.suggested_instruments.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />{item}</li>)}</ul></InsightCard>
                <InsightCard icon={CircleDollarSign} title="Subsidy pre-screen" link={result.subsidies.handoff}><div className="space-y-2">{result.subsidies.candidates.map((scheme) => <div key={scheme.name} className="rounded-xl border border-slate-200 p-3"><div className="flex items-center justify-between gap-2"><strong className="text-sm text-slate-900">{scheme.name}</strong><span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase text-amber-800">{scheme.fit}</span></div><p className="mt-1 text-xs text-slate-600">{scheme.use}</p></div>)}</div></InsightCard>
                <InsightCard icon={Factory} title="Engineering preparation" link={result.engineering.handoff}><div className="flex flex-wrap gap-2">{result.engineering.preparation.map((item) => <span key={item} className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-800">{item}</span>)}</div></InsightCard>
              </div>

              <InsightCard icon={Workflow} title="Inter-system workflow">
                <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{result.workflow.map((step, index) => <li key={step.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center justify-between"><span className="text-xs font-black text-emerald-700">0{index + 1}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-600">{step.status}</span></div><div className="mt-3 font-bold text-slate-950">{step.label}</div><div className="mt-1 text-xs text-slate-500">Owner: {step.owner}</div><Link to={step.link} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-700">Open handoff<ArrowRight className="h-3.5 w-3.5" /></Link></li>)}</ol>
              </InsightCard>

              <section className="rounded-3xl bg-slate-950 p-5 text-white">
                <div className="flex items-center gap-3"><Boxes className="h-5 w-5 text-emerald-300" /><h2 className="font-bold">When a consumer orders</h2></div><div className="mt-4 flex flex-wrap gap-2">{result.order_flow.map((step, index) => <span key={step} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs"><b className="text-emerald-300">{index + 1}</b>{step}</span>)}</div><div className="mt-5 flex items-start gap-2 border-t border-white/10 pt-4 text-xs leading-5 text-slate-300"><Languages className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />{result.marketing.localization_note}</div>
              </section>
            </div>}
          </div>
        </div>
      </div>
    </main>
  );
}
