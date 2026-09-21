import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Activity, Brain, CheckCircle2, ClipboardCheck, FileSearch, HeartPulse, Loader2, ShieldCheck, Stethoscope } from 'lucide-react';
import { api } from '../services/api';

const systems = ['ICD-10-CM', 'ICD-10-PCS', 'CPT', 'HCPCS', 'SNOMED-CT', 'LOINC'];
const careContexts = [
  ['clinical_coding', 'Clinical coding'],
  ['dietitian', 'Dietitian / MNT'],
  ['nutritionist', 'Nutritionist'],
  ['nutrient_calculator', 'Nutrient calculator / laboratory'],
  ['natural_therapist', 'Natural therapist'],
];

function Pill({ children, tone = 'slate' }) {
  const colors = { slate: 'bg-slate-100 text-slate-700', green: 'bg-emerald-100 text-emerald-800', amber: 'bg-amber-100 text-amber-800', blue: 'bg-blue-100 text-blue-800' };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${colors[tone]}`}>{children}</span>;
}

export default function AdvancedMedicalCodingPage() {
  const [clinicalDescription, setClinicalDescription] = useState('');
  const [codeSystem, setCodeSystem] = useState('ICD-10-CM');
  const [careContext, setCareContext] = useState('clinical_coding');
  const [referenceQuery, setReferenceQuery] = useState('');

  const status = useQuery({
    queryKey: ['medical-coding-integration-status'],
    queryFn: () => api.get('/advanced-medical-coding/integration-status').then((response) => response.data),
    retry: 1,
  });

  const suggestion = useMutation({
    mutationFn: () => api.post('/advanced-medical-coding/ai-coding-assistance', { clinicalDescription, codeSystem, careContext }).then((response) => response.data),
  });

  const references = useMutation({
    mutationFn: () => api.get('/medical-coding-reference', { params: { standard: codeSystem, query: referenceQuery } }).then((response) => response.data),
  });

  useEffect(() => {
    suggestion.reset();
  }, [codeSystem, careContext]);

  const result = suggestion.data;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] bg-gradient-to-br from-blue-950 via-slate-950 to-emerald-950 p-7 text-white shadow-xl sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/30 bg-blue-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-blue-200"><Stethoscope className="h-4 w-4" />Clinical coding workspace</div>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">AI-assisted coding with clinician and coder control</h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">Supports clinical, dietitian, nutritionist, nutrient-calculation/laboratory, natural-therapy, telehealth, insurance, ERP finance, and audit workflows. AI produces draft candidates only; it never diagnoses, invents measurements, binds coverage, or submits a claim.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-slate-400">AI status</div><div className="mt-1 font-bold">{status.data?.ai_configured ? 'Configured' : 'Safe fallback'}</div></div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-slate-400">Output budget</div><div className="mt-1 font-bold">≤ {status.data?.max_output_tokens || 500} tokens</div></div>
            </div>
          </div>
        </header>

        <section className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            [HeartPulse, 'Farmer / patient', 'Clear encounter record, transparent review status, safer claims journey.'],
            [ClipboardCheck, 'Clinician and coder', 'Evidence-linked draft candidates, missing-document prompts, final human sign-off.'],
            [Activity, 'Dietitian / nutritionist', 'Nutrition assessment, MNT, counselling, calculated intake, outcomes, and scope-aware terminology.'],
            [Stethoscope, 'Natural therapist', 'Complementary-care documentation without inventing diagnoses or insurance coverage.'],
          ].map(([Icon, title, copy]) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Icon className="h-6 w-6 text-blue-700" /><h2 className="mt-3 font-bold text-slate-950">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p></article>)}
        </section>

        <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3"><Brain className="h-6 w-6 text-violet-700" /><div><h2 className="text-xl font-bold text-slate-950">Coding assistance</h2><p className="text-sm text-slate-500">Enter de-identified clinical documentation. Do not include names, phone numbers, addresses, or government identifiers.</p></div></div>
            <div className="mt-5 space-y-4">
              <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-800">Professional workflow</span><select value={careContext} onChange={(event) => setCareContext(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5">{careContexts.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-800">Code system</span><select value={codeSystem} onChange={(event) => setCodeSystem(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5">{systems.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-800">Encounter and evidence documentation</span><textarea value={clinicalDescription} onChange={(event) => setClinicalDescription(event.target.value)} rows={8} placeholder="Document the encounter, qualified assessment, measured nutrient/lab values with units and source, intervention, outcome, and relevant clinical facts. Do not include direct identifiers." className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
              <button onClick={() => suggestion.mutate()} disabled={!clinicalDescription.trim() || suggestion.isPending} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400">{suggestion.isPending ? <><Loader2 className="h-5 w-5 animate-spin" />Reviewing documentation…</> : <><Brain className="h-5 w-5" />Generate draft coding suggestions</>}</button>
              {suggestion.error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{suggestion.error.response?.data?.error || suggestion.error.message}</div>}
            </div>

            {result && <div className="mt-6 space-y-4 border-t border-slate-200 pt-6">
              <div className="flex flex-wrap items-center gap-2"><Pill tone={result.source === 'openai-draft' ? 'blue' : 'amber'}>{result.source}</Pill><Pill tone="amber">human review required</Pill><Pill>{result.care_context}</Pill><Pill>{result.code_system}</Pill>{result.cached && <Pill tone="green">cached</Pill>}</div>
              {result.suggested_codes?.length > 0 ? <div className="space-y-3">{result.suggested_codes.map((item) => <article key={`${item.code}-${item.display}`} className="rounded-2xl border border-slate-200 p-4"><div className="flex flex-wrap items-center gap-2"><strong className="text-lg text-slate-950">{item.code}</strong><Pill tone="blue">{Math.round((Number(item.confidence) || 0) * 100)}% draft confidence</Pill></div><div className="mt-1 font-semibold text-slate-800">{item.display}</div><p className="mt-2 text-sm text-slate-600">{item.rationale}</p>{item.evidence_text && <blockquote className="mt-2 border-l-2 border-blue-300 pl-3 text-xs text-slate-500">Evidence: {item.evidence_text}</blockquote>}</article>)}</div> : <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">No code was proposed. Complete the missing documentation and use the verified reference lookup.</div>}
              {result.missing_documentation?.length > 0 && <div><h3 className="font-bold text-slate-900">Documentation needed</h3><ul className="mt-2 space-y-2">{result.missing_documentation.map((item) => <li key={item} className="flex gap-2 text-sm text-slate-700"><FileSearch className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />{item}</li>)}</ul></div>}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><div className="flex items-center gap-2 font-bold text-emerald-950"><ShieldCheck className="h-5 w-5" />Submission control</div><p className="mt-1 text-sm text-emerald-900">Automatic diagnosis and claim submission are disabled. A qualified clinician/coder must validate every code against the current official code set and payer rules.</p></div>
            </div>}
          </section>

          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-xl font-bold text-slate-950"><FileSearch className="h-5 w-5 text-emerald-700" />Verified reference lookup</h2>
              <p className="mt-2 text-sm text-slate-600">Search the platform&apos;s versioned, source-referenced coding table. This remains reference-only until a qualified reviewer assigns a code.</p>
              <div className="mt-4 flex gap-2"><input value={referenceQuery} onChange={(event) => setReferenceQuery(event.target.value)} placeholder="Code or description" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5" /><button onClick={() => references.mutate()} disabled={!referenceQuery.trim() || references.isPending} className="rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white disabled:bg-slate-400">Search</button></div>
              <div className="mt-4 max-h-80 space-y-2 overflow-auto">{references.data?.data?.map((item) => <div key={`${item.standard}-${item.code}`} className="rounded-xl border border-slate-200 p-3"><div className="flex items-center justify-between gap-2"><strong className="text-slate-900">{item.code}</strong><Pill>{item.standard} {item.standard_version}</Pill></div><p className="mt-1 text-sm text-slate-600">{item.description}</p>{item.source_reference && <p className="mt-1 text-xs text-slate-500">Source: {item.source_reference}</p>}</div>)}</div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-950">ERP and AI handoff</h2>
              <ol className="mt-4 space-y-3">{(status.data?.workflow || ['encounter documentation', 'AI draft suggestions', 'qualified coder validation', 'claim/pre-authorisation', 'ERP finance posting', 'audit feedback']).map((step, index) => <li key={step} className="flex gap-3 rounded-xl bg-slate-50 p-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">{index + 1}</span><div><div className="font-semibold capitalize text-slate-900">{step}</div>{index === 2 && <div className="text-xs text-slate-500">Human approval gate</div>}</div></li>)}</ol>
              <div className="mt-4 border-t border-slate-200 pt-4"><h3 className="font-bold text-slate-900">Required controls</h3><div className="mt-2 flex flex-wrap gap-2">{(status.data?.controls || []).map((item) => <Pill key={item} tone="green"><span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" />{item}</span></Pill>)}</div></div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
